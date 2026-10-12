const Fastify = require('fastify');
const { Server } = require('socket.io');
const db = require('./db');

const PORT = Number(process.env.PORT) || 3000;
const fastify = Fastify({ logger: true });

const ioHolder = { io: null };

function emitAll(event, payload) {
  if (ioHolder.io) {
    ioHolder.io.emit(event, payload);
  }
}

function getUserByCreds(username, password) {
  return db
    .prepare('SELECT id, username, role, current_lat, current_lon FROM users WHERE username = ? AND password = ?')
    .get(username, password);
}

async function authenticate(request, reply) {
  const username = request.headers.username;
  const password = request.headers.password;
  const user = getUserByCreds(username, password);
  if (!user) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }
  request.user = user;
}

const ORDER_SQL = `
  SELECT
    o.*,
    p.username AS passenger_name,
    p.current_lat AS passenger_lat,
    p.current_lon AS passenger_lon,
    d.username AS driver_name,
    d.current_lat AS driver_lat,
    d.current_lon AS driver_lon
  FROM orders o
  LEFT JOIN users p ON p.id = o.passenger_id
  LEFT JOIN users d ON d.id = o.driver_id
`;

function getOrder(id) {
  return db.prepare(`${ORDER_SQL} WHERE o.id = ?`).get(id);
}

function listOrdersFor(user) {
  if (user.role === 'admin') {
    return db.prepare(`${ORDER_SQL} ORDER BY o.id DESC LIMIT 50`).all();
  }
  if (user.role === 'driver') {
    return db
      .prepare(
        `${ORDER_SQL} WHERE o.status = 'PENDING' OR o.driver_id = ? ORDER BY o.id DESC LIMIT 50`,
      )
      .all(user.id);
  }
  return db.prepare(`${ORDER_SQL} WHERE o.passenger_id = ? ORDER BY o.id DESC LIMIT 50`).all(user.id);
}

function listUsers() {
  return db
    .prepare('SELECT id, username, role, current_lat, current_lon FROM users')
    .all();
}

async function build() {
  await fastify.register(require('@fastify/cors'), { origin: true });

  fastify.get('/health', async () => ({ ok: true }));

  fastify.post('/login', async (request, reply) => {
    const { username, password } = request.body || {};
    const user = getUserByCreds(username, password);
    if (!user) {
      return reply.code(401).send({ error: 'Неверный логин или пароль' });
    }
    return user;
  });

  fastify.get('/orders', { preHandler: authenticate }, async (request) => {
    return listOrdersFor(request.user);
  });

  fastify.get('/users', { preHandler: authenticate }, async (request, reply) => {
    if (request.user.role !== 'admin') {
      return reply.code(403).send({ error: 'Admin access required' });
    }
    return listUsers();
  });

  fastify.post('/order', { preHandler: authenticate }, async (request, reply) => {
    const passenger = request.user;
    if (passenger.role !== 'passenger') {
      return reply.code(403).send({ error: 'Only passengers can create orders' });
    }

    const { from_lat, from_lon, to_lat, to_lon } = request.body || {};
    if ([from_lat, from_lon, to_lat, to_lon].some((v) => typeof v !== 'number')) {
      return reply.code(400).send({ error: 'Need from_lat, from_lon, to_lat, to_lon' });
    }

    const active = db
      .prepare(
        `SELECT id FROM orders WHERE passenger_id = ? AND status IN ('PENDING','ACCEPTED','ARRIVED','IN_PROGRESS')`,
      )
      .get(passenger.id);
    if (active) {
      return reply.code(409).send({ error: 'У вас уже есть активный заказ', order: getOrder(active.id) });
    }

    const info = db
      .prepare(
        'INSERT INTO orders (passenger_id, status, from_lat, from_lon, to_lat, to_lon) VALUES (?, ?, ?, ?, ?, ?)',
      )
      .run(passenger.id, 'PENDING', from_lat, from_lon, to_lat, to_lon);

    const order = getOrder(info.lastInsertRowid);
    emitAll('new_order', order);
    emitAll('order_update', order);
    return order;
  });

  fastify.post('/order/accept', { preHandler: authenticate }, async (request, reply) => {
    const driver = request.user;
    if (driver.role !== 'driver') {
      return reply.code(403).send({ error: 'Only drivers can accept orders' });
    }

    const { orderId } = request.body || {};
    const pending = db.prepare(`SELECT * FROM orders WHERE id = ? AND status = 'PENDING'`).get(orderId);
    if (!pending) {
      return reply.code(404).send({ error: 'Заказ не найден или уже взят' });
    }

    const busy = db
      .prepare(
        `SELECT id FROM orders WHERE driver_id = ? AND status IN ('ACCEPTED','ARRIVED','IN_PROGRESS')`,
      )
      .get(driver.id);
    if (busy) {
      return reply.code(409).send({ error: 'Сначала завершите текущий заказ' });
    }

    db.prepare(`UPDATE orders SET driver_id = ?, status = 'ACCEPTED' WHERE id = ?`).run(driver.id, orderId);
    const order = getOrder(orderId);
    emitAll('order_update', order);
    return order;
  });

  fastify.post('/order/status', { preHandler: authenticate }, async (request, reply) => {
    const { orderId, status } = request.body || {};
    const user = request.user;
    const orderRow = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    if (!orderRow) {
      return reply.code(404).send({ error: 'Заказ не найден' });
    }

    const allowed = {
      ACCEPTED: 'ARRIVED',
      ARRIVED: 'IN_PROGRESS',
      IN_PROGRESS: 'COMPLETED',
    };

    if (user.role === 'driver' && orderRow.driver_id === user.id) {
      if (allowed[orderRow.status] !== status) {
        return reply.code(400).send({ error: `Нельзя перевести ${orderRow.status} → ${status}` });
      }
    } else if (user.role === 'passenger' && orderRow.passenger_id === user.id && status === 'CANCELLED') {
      if (!['PENDING', 'ACCEPTED'].includes(orderRow.status)) {
        return reply.code(400).send({ error: 'Этот заказ уже нельзя отменить' });
      }
    } else {
      return reply.code(403).send({ error: 'Недостаточно прав' });
    }

    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, orderId);
    const order = getOrder(orderId);
    emitAll('order_update', order);
    return order;
  });

  fastify.post('/admin/order/manage', { preHandler: authenticate }, async (request, reply) => {
    const admin = request.user;
    if (admin.role !== 'admin') {
      return reply.code(403).send({ error: 'Admin access required' });
    }

    const { orderId, action, driverId } = request.body || {};
    const existing = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    if (!existing) {
      return reply.code(404).send({ error: 'Заказ не найден' });
    }

    if (action === 'CANCEL') {
      db.prepare(`UPDATE orders SET status = 'CANCELLED' WHERE id = ?`).run(orderId);
    } else if (action === 'ASSIGN') {
      let targetDriverId = driverId;
      if (!targetDriverId) {
        const demo = db.prepare(`SELECT id FROM users WHERE role = 'driver' ORDER BY id LIMIT 1`).get();
        targetDriverId = demo && demo.id;
      }
      if (!targetDriverId) {
        return reply.code(400).send({ error: 'Нет водителя для назначения' });
      }
      db.prepare(`UPDATE orders SET driver_id = ?, status = 'ACCEPTED' WHERE id = ?`).run(
        targetDriverId,
        orderId,
      );
    } else if (action === 'FORCE_COMPLETE') {
      db.prepare(`UPDATE orders SET status = 'COMPLETED' WHERE id = ?`).run(orderId);
    } else if (action === 'REOPEN') {
      db.prepare(`UPDATE orders SET driver_id = NULL, status = 'PENDING' WHERE id = ?`).run(orderId);
    } else {
      return reply.code(400).send({ error: 'Invalid action' });
    }

    const order = getOrder(orderId);
    emitAll('order_update', order);
    return order;
  });

  fastify.post('/location', { preHandler: authenticate }, async (request) => {
    const { lat, lon } = request.body || {};
    const user = request.user;
    db.prepare('UPDATE users SET current_lat = ?, current_lon = ? WHERE id = ?').run(lat, lon, user.id);
    const payload = { userId: user.id, username: user.username, role: user.role, lat, lon };
    emitAll('location_update', payload);
    return { status: 'updated', ...payload };
  });

  await fastify.listen({ port: PORT, host: '0.0.0.0' });

  const io = new Server(fastify.server, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
  });
  ioHolder.io = io;

  io.on('connection', (socket) => {
    fastify.log.info(`socket connected ${socket.id}`);
    socket.on('disconnect', () => fastify.log.info(`socket disconnected ${socket.id}`));
  });

  console.log(`Vibe Taxi API: http://0.0.0.0:${PORT}`);
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
