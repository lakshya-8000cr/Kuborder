const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const db = require("./db");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());

const mapOrder = (orderRow) => {
  const items = db
    .prepare(
      `SELECT food_id AS foodId, food_name AS foodName, price, quantity
       FROM order_items WHERE order_id = ?`
    )
    .all(orderRow.id);

  return {
    id: orderRow.id,
    customerName: orderRow.customer_name,
    phone: orderRow.phone,
    address: orderRow.address,
    paymentMethod: orderRow.payment_method,
    subtotal: orderRow.subtotal,
    deliveryFee: orderRow.delivery_fee,
    total: orderRow.total,
    status: orderRow.status,
    createdAt: orderRow.created_at,
    items,
  };
};

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "kuborder-api" });
});

app.get("/api/foods", (req, res) => {
  const search = (req.query.search || "").toString().trim().toLowerCase();
  const category = (req.query.category || "").toString().trim();

  let rows = db
    .prepare(
      `SELECT id, name, category, price, rating, prep_time AS prepTime, image, description
       FROM foods ORDER BY rating DESC, name ASC`
    )
    .all();

  if (category && category !== "All") {
    rows = rows.filter((food) => food.category === category);
  }

  if (search) {
    rows = rows.filter(
      (food) =>
        food.name.toLowerCase().includes(search) ||
        food.description.toLowerCase().includes(search)
    );
  }

  res.json({ foods: rows });
});

app.get("/api/foods/:id", (req, res) => {
  const id = Number(req.params.id);
  const food = db
    .prepare(
      `SELECT id, name, category, price, rating, prep_time AS prepTime, image, description
       FROM foods WHERE id = ?`
    )
    .get(id);

  if (!food) {
    res.status(404).json({ message: "Food item not found" });
    return;
  }

  res.json({ food });
});

app.post("/api/orders", (req, res) => {
  const { customerName, phone, address, paymentMethod, items } = req.body || {};

  if (!customerName || !phone || !address || !paymentMethod) {
    res.status(400).json({ message: "Customer details are required" });
    return;
  }

  if (!Array.isArray(items) || items.length === 0) {
    res.status(400).json({ message: "At least one order item is required" });
    return;
  }

  const validatedItems = [];
  let subtotal = 0;

  for (const item of items) {
    const foodId = Number(item.foodId);
    const quantity = Number(item.quantity);

    if (!Number.isInteger(foodId) || !Number.isInteger(quantity) || quantity <= 0) {
      res.status(400).json({ message: "Invalid order item payload" });
      return;
    }

    const food = db
      .prepare("SELECT id, name, price FROM foods WHERE id = ?")
      .get(foodId);

    if (!food) {
      res.status(400).json({ message: `Food ID ${foodId} is invalid` });
      return;
    }

    const lineTotal = food.price * quantity;
    subtotal += lineTotal;

    validatedItems.push({
      foodId: food.id,
      foodName: food.name,
      price: food.price,
      quantity,
    });
  }

  const deliveryFee = subtotal >= 500 ? 0 : 39;
  const total = Number((subtotal + deliveryFee).toFixed(2));
  const orderId = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  const createOrder = db.transaction(() => {
    db.prepare(
      `INSERT INTO orders (id, customer_name, phone, address, payment_method, subtotal, delivery_fee, total, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      orderId,
      customerName,
      phone,
      address,
      paymentMethod,
      subtotal,
      deliveryFee,
      total,
      "Placed",
      createdAt
    );

    const insertItem = db.prepare(
      `INSERT INTO order_items (order_id, food_id, food_name, price, quantity)
       VALUES (?, ?, ?, ?, ?)`
    );

    for (const item of validatedItems) {
      insertItem.run(
        orderId,
        item.foodId,
        item.foodName,
        item.price,
        item.quantity
      );
    }
  });

  createOrder();

  const order = mapOrder(
    db.prepare("SELECT * FROM orders WHERE id = ?").get(orderId)
  );
  res.status(201).json({ message: "Order placed successfully", order });
});

app.get("/api/orders", (_req, res) => {
  const rows = db
    .prepare("SELECT * FROM orders ORDER BY datetime(created_at) DESC")
    .all();

  const orders = rows.map(mapOrder);
  res.json({ orders });
});

app.get("/api/orders/:id", (req, res) => {
  const orderRow = db.prepare("SELECT * FROM orders WHERE id = ?").get(req.params.id);

  if (!orderRow) {
    res.status(404).json({ message: "Order not found" });
    return;
  }

  res.json({ order: mapOrder(orderRow) });
});

app.listen(PORT, () => {
  console.log(`KUBORDER API running on http://localhost:${PORT}`);
});
