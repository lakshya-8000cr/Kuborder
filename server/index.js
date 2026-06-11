const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const MENU_FILE = path.join(__dirname, 'data', 'menu.json');

const ORDERS_FILE = process.env.ORDERS_FILE || path.join(__dirname, 'data', 'orders.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// Initialize files if missing
if (!fs.existsSync(MENU_FILE)) fs.writeFileSync(MENU_FILE, JSON.stringify([], null, 2));
if (!fs.existsSync(ORDERS_FILE)) fs.writeFileSync(ORDERS_FILE, JSON.stringify([], null, 2));

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    return [];
  }
}

function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

app.get('/api/menu', (req, res) => {
  const menu = readJson(MENU_FILE);
  res.json(menu);
});

app.get('/api/orders', (req, res) => {
  const orders = readJson(ORDERS_FILE);
  res.json(orders);
});

app.post('/api/order', (req, res) => {
  const { customer = 'Guest', items = [], total = 0 } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Order must include at least one item' });
  }
  const orders = readJson(ORDERS_FILE);
  const id = Date.now();
  const order = { id, customer, items, total, createdAt: new Date().toISOString() };
  orders.unshift(order);
  writeJson(ORDERS_FILE, orders);
  res.json({ ok: true, order });
});

// Serve client static files from /client
const clientPath = path.join(__dirname, '..', 'client');
if (fs.existsSync(clientPath)) {
  app.use(express.static(clientPath));
}

app.get("/api/cpu", (req, res) => {
  let sum = 0;
  for (let i = 0; i < 1000000000; i++) {
    sum += i;
  }
  res.send("CPU load done");
});

const PORT = process.env.PORT || 3000;
app.get("/api/server", (req,res)=>{
    res.json({
        version: "v2",
        hostname: require("os").hostname(),
        time: new Date()
    })
})

app.get("/api/config", (req,res)=>{
    res.json({
        app: process.env.APP_NAME,
        env: process.env.ENVIRONMENT,
        version: process.env.APP_VERSION
    });
});

app.get("/api/secret", (req,res)=>{
    res.json({
        secret: process.env.JWT_SECRET
    });
});
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
