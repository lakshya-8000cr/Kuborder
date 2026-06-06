const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");
const seedFoods = require("./seedFoods");

const dataDir = path.join(__dirname, "..", "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, "kuborder.db");
const db = new Database(dbPath);

db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS foods (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price REAL NOT NULL,
    rating REAL NOT NULL,
    prep_time INTEGER NOT NULL,
    image TEXT NOT NULL,
    description TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    payment_method TEXT NOT NULL,
    subtotal REAL NOT NULL,
    delivery_fee REAL NOT NULL,
    total REAL NOT NULL,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT NOT NULL,
    food_id INTEGER NOT NULL,
    food_name TEXT NOT NULL,
    price REAL NOT NULL,
    quantity INTEGER NOT NULL,
    FOREIGN KEY(order_id) REFERENCES orders(id)
  );
`);

const seedCount = db.prepare("SELECT COUNT(*) AS count FROM foods").get();
if (seedCount.count === 0) {
  const insert = db.prepare(`
    INSERT INTO foods (id, name, category, price, rating, prep_time, image, description)
    VALUES (@id, @name, @category, @price, @rating, @prepTime, @image, @description)
  `);

  const insertMany = db.transaction((foods) => {
    for (const food of foods) {
      insert.run(food);
    }
  });

  insertMany(seedFoods);
}

module.exports = db;
