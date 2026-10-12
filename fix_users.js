const db = require('./db');

const seedUsers = [
  ['passenger_demo', 'pass123', 'passenger', 56.8389, 60.6057],
  ['driver_demo', 'drive123', 'driver', 56.8400, 60.6100],
  ['admin_demo', 'admin123', 'admin', 56.8300, 60.6000],
];

const insertUser = db.prepare('INSERT OR REPLACE INTO users (id, username, password, role, current_lat, current_lon) VALUES (?, ?, ?, ?, ?, ?)');

// Using explicit IDs to ensure we don't create duplicates and just update existing ones
seedUsers.forEach((user, index) => {
  insertUser.run(index + 1, ...user);
});

console.log('DEMO ACCOUNTS FORCE-RESET SUCCESSFULLY');
