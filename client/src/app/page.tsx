"use client";

import Image from "next/image";
import { FormEvent, useEffect, useMemo, useState } from "react";

type Food = {
  id: number;
  name: string;
  category: string;
  price: number;
  rating: number;
  prepTime: number;
  image: string;
  description: string;
};

type OrderItem = {
  foodId: number;
  foodName: string;
  price: number;
  quantity: number;
};

type Order = {
  id: string;
  customerName: string;
  phone: string;
  address: string;
  paymentMethod: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: string;
  createdAt: string;
  items: OrderItem[];
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const money = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const timeText = (isoDate: string) =>
  new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(isoDate));

export default function Home() {
  const [foods, setFoods] = useState<Food[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<Record<number, number>>({});
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [placingOrder, setPlacingOrder] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("UPI");

  const categories = useMemo(() => {
    const all = new Set<string>(["All"]);
    foods.forEach((food) => all.add(food.category));
    return [...all];
  }, [foods]);

  const filteredFoods = useMemo(() => {
    return foods.filter((food) => {
      const matchCategory =
        activeCategory === "All" || food.category === activeCategory;
      const keyword = search.trim().toLowerCase();
      const matchSearch =
        keyword.length === 0 ||
        food.name.toLowerCase().includes(keyword) ||
        food.description.toLowerCase().includes(keyword);
      return matchCategory && matchSearch;
    });
  }, [activeCategory, foods, search]);

  const cartItems = useMemo(() => {
    return Object.entries(cart)
      .map(([id, quantity]) => {
        const food = foods.find((item) => item.id === Number(id));
        if (!food || quantity <= 0) {
          return null;
        }
        return { food, quantity };
      })
      .filter((entry): entry is { food: Food; quantity: number } => entry !== null);
  }, [cart, foods]);

  const subtotal = useMemo(
    () =>
      cartItems.reduce((sum, item) => sum + item.food.price * item.quantity, 0),
    [cartItems]
  );
  const deliveryFee = subtotal === 0 ? 0 : subtotal >= 500 ? 0 : 39;
  const total = subtotal + deliveryFee;

  const loadFoods = async () => {
    const response = await fetch(`${API_BASE}/api/foods`, { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Failed to load menu");
    }
    const data: { foods: Food[] } = await response.json();
    setFoods(data.foods);
  };

  const loadOrders = async () => {
    const response = await fetch(`${API_BASE}/api/orders`, { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Failed to load orders");
    }
    const data: { orders: Order[] } = await response.json();
    setOrders(data.orders);
  };

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      setError("");
      try {
        await Promise.all([loadFoods(), loadOrders()]);
      } catch (loadError) {
        if (loadError instanceof Error) {
          setError(loadError.message);
        } else {
          setError("Unable to reach backend API");
        }
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  const updateCart = (foodId: number, nextQuantity: number) => {
    setCart((prev) => {
      const next = { ...prev };
      if (nextQuantity <= 0) {
        delete next[foodId];
      } else {
        next[foodId] = nextQuantity;
      }
      return next;
    });
  };

  const placeOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuccessMessage("");
    setError("");

    if (cartItems.length === 0) {
      setError("Add at least one item before placing the order.");
      return;
    }

    setPlacingOrder(true);
    try {
      const response = await fetch(`${API_BASE}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          phone,
          address,
          paymentMethod,
          items: cartItems.map((item) => ({
            foodId: item.food.id,
            quantity: item.quantity,
          })),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Order placement failed");
      }

      setSuccessMessage(`Order placed. Tracking ID: ${data.order.id.slice(0, 8)}`);
      setCart({});
      setCustomerName("");
      setPhone("");
      setAddress("");
      setPaymentMethod("UPI");
      await loadOrders();
    } catch (placeError) {
      if (placeError instanceof Error) {
        setError(placeError.message);
      } else {
        setError("Unable to place order");
      }
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand-wrap">
          <p className="brand-dot">K</p>
          <div>
            <h2>KUBORDER</h2>
            <p>Delivering hot. Tracking smart.</p>
          </div>
        </div>
        <p className="topbar-meta">Live Menu: {foods.length} items</p>
      </header>

      <section className="hero">
        <p className="badge">Food Commerce Suite</p>
        <h1>Scale your food ordering business like modern delivery apps</h1>
        <p>
          Discover menu fast, place orders in seconds, and manage complete order
          history from one smooth interface.
        </p>
      </section>

      {error ? <p className="alert error">{error}</p> : null}
      {successMessage ? <p className="alert success">{successMessage}</p> : null}

      {loading ? <p className="loading">Loading menu and order timeline...</p> : null}

      {!loading ? (
        <main className="layout-grid">
          <section className="panel menu-panel">
            <div className="panel-head">
              <h2>Menu</h2>
              <input
                type="search"
                placeholder="Search food..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <div className="category-row">
              {categories.map((category) => (
                <button
                  type="button"
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={
                    activeCategory === category ? "chip chip-active" : "chip"
                  }
                >
                  {category}
                </button>
              ))}
            </div>

            <div className="food-grid">
              {filteredFoods.map((food) => {
                const quantity = cart[food.id] || 0;
                return (
                  <article key={food.id} className="food-card">
                    <p className="food-rating">{food.rating.toFixed(1)} star</p>
                    <Image
                      src={food.image}
                      alt={food.name}
                      width={640}
                      height={380}
                    />
                    <div className="food-meta">
                      <h3>{food.name}</h3>
                      <p>{food.description}</p>
                      <div className="food-tags">
                        <span>{food.category}</span>
                        <span>{food.rating.toFixed(1)} star</span>
                        <span>{food.prepTime} mins</span>
                      </div>
                    </div>
                    <div className="food-actions">
                      <strong>{money(food.price)}</strong>
                      <div className="stepper">
                        <button
                          type="button"
                          onClick={() => updateCart(food.id, quantity - 1)}
                        >
                          -
                        </button>
                        <span>{quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateCart(food.id, quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="panel cart-panel">
            <h2>Checkout</h2>
            <p className="cart-help">Free delivery above {money(500)}</p>

            <div className="cart-list">
              {cartItems.length === 0 ? (
                <p className="muted">Cart is empty.</p>
              ) : (
                cartItems.map((item) => (
                  <div className="cart-item" key={item.food.id}>
                    <span>
                      {item.food.name} x {item.quantity}
                    </span>
                    <strong>{money(item.food.price * item.quantity)}</strong>
                  </div>
                ))
              )}
            </div>

            <div className="bill">
              <div>
                <span>Subtotal</span>
                <strong>{money(subtotal)}</strong>
              </div>
              <div>
                <span>Delivery</span>
                <strong>{deliveryFee === 0 ? "FREE" : money(deliveryFee)}</strong>
              </div>
              <div className="bill-total">
                <span>Total</span>
                <strong>{money(total)}</strong>
              </div>
            </div>

            <form onSubmit={placeOrder} className="checkout-form">
              <input
                required
                type="text"
                value={customerName}
                placeholder="Customer name"
                onChange={(event) => setCustomerName(event.target.value)}
              />
              <input
                required
                type="tel"
                value={phone}
                placeholder="Phone number"
                onChange={(event) => setPhone(event.target.value)}
              />
              <textarea
                required
                value={address}
                placeholder="Delivery address"
                onChange={(event) => setAddress(event.target.value)}
              />
              <select
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value)}
              >
                <option value="UPI">UPI</option>
                <option value="Card">Card</option>
                <option value="Cash On Delivery">Cash On Delivery</option>
              </select>

              <button type="submit" disabled={placingOrder || cartItems.length === 0}>
                {placingOrder ? "Placing Order..." : "Place Order"}
              </button>
            </form>
          </section>

          <section className="panel history-panel">
            <h2>Order History</h2>
            {orders.length === 0 ? (
              <p className="muted">No orders yet. Your placed orders will appear here.</p>
            ) : (
              <div className="history-list">
                {orders.map((order) => (
                  <article key={order.id} className="history-card">
                    <div className="history-head">
                      <div>
                        <h3>{order.customerName}</h3>
                        <p>{timeText(order.createdAt)}</p>
                      </div>
                      <strong>{money(order.total)}</strong>
                    </div>
                    <p className="small">Status: {order.status}</p>
                    <p className="small">Payment: {order.paymentMethod}</p>
                    <p className="small">Phone: {order.phone}</p>
                    <ul>
                      {order.items.map((item) => (
                        <li key={`${order.id}-${item.foodId}`}>
                          {item.foodName} x {item.quantity}
                        </li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            )}
          </section>
        </main>
      ) : null}
    </div>
  );
}
