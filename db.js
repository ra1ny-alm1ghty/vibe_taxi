const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'vibe_taxi.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT CHECK(role IN ('passenger', 'driver', 'admin')),
    current_lat REAL,
    current_lon REAL
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    passenger_id INTEGER,
    driver_id INTEGER,
    status TEXT CHECK(status IN ('PENDING', 'ACCEPTED', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
    from_lat REAL,
    from_lon REAL,
    to_lat REAL,
    to_lon REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(passenger_id) REFERENCES users(id),
    FOREIGN KEY(driver_id) REFERENCES users(id)
  );
`);

const seedUsers = [
  ['passenger_demo', 'pass123', 'passenger', 56.8389, 60.6057],
  ['driver_demo', 'drive123', 'driver', 56.8435, 60.6128],
  ['admin_demo', 'admin123', 'admin', 56.8300, 60.6000],
];

const insertUser = db.prepare(
  'INSERT OR IGNORE INTO users (username, password, role, current_lat, current_lon) VALUES (?, ?, ?, ?, ?)',
);

for (const user of seedUsers) {
  insertUser.run(...user);
}

const updateSeed = db.prepare(
  'UPDATE users SET password = ?, role = ? WHERE username = ?',
);
updateSeed.run('pass123', 'passenger', 'passenger_demo');
updateSeed.run('drive123', 'driver', 'driver_demo');
updateSeed.run('admin123', 'admin', 'admin_demo');

module.exports = db;
