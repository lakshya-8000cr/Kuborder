const { useState, useEffect } = React;

function App() {
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState([]);
  const [name, setName] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/menu')
      .then(res => res.json())
      .then(setMenu)
      .catch(() => setMenu([]));
    fetch('/orders')
      .then(r => r.json())
      .then(setOrders)
      .catch(() => setOrders([]));
  }, []);

  function addToCart(item) {
    setCart(prev => {
      const found = prev.find(p => p.id === item.id);
      if (found) return prev.map(p => p.id === item.id ? { ...p, qty: p.qty + 1 } : p);
      return [...prev, { ...item, qty: 1 }];
    });
  }

  function removeFromCart(id) {
    setCart(prev => prev.filter(p => p.id !== id));
  }

  function changeQty(id, delta) {
    setCart(prev => prev.map(p => p.id === id ? { ...p, qty: Math.max(1, p.qty + delta) } : p));
  }

  function placeOrder() {
    if (cart.length === 0) return alert('Cart is empty');
    const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
    setLoading(true);
    fetch('/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer: name || 'Guest', items: cart, total })
    })
    .then(r => r.json())
    .then(res => {
      if (res.ok) {
        setOrders(prev => [res.order, ...prev]);
        setCart([]);
        setName('');
        alert('Order placed!');
      } else {
        alert('Failed to place order');
      }
    })
    .catch(() => alert('Network error'))
    .finally(() => setLoading(false));
  }

  return (
    <div className="app">
      <header>
        <h1>Kuborder</h1>
        <p>Simple food ordering demo</p>
      </header>

      <main>
        <section className="menu">
          <h2>Menu</h2>
          {menu.length === 0 ? <p>Loading menu...</p> : (
            <div className="items">
              {menu.map(item => (
                <div className="item" key={item.id}>
                  <div className="meta">
                    <strong>{item.name}</strong>
                    <span className="price">${item.price.toFixed(2)}</span>
                  </div>
                  <p className="desc">{item.description}</p>
                  <button onClick={() => addToCart(item)}>Add to cart</button>
                </div>
              ))}
            </div>
          )}
        </section>

        <aside className="cart">
          <h2>Cart</h2>
          {cart.length === 0 ? <p>No items.</p> : (
            <div>
              {cart.map(i => (
                <div className="cart-item" key={i.id}>
                  <div>{i.name} x {i.qty}</div>
                  <div className="cart-controls">
                    <button onClick={() => changeQty(i.id, -1)}>-</button>
                    <button onClick={() => changeQty(i.id, +1)}>+</button>
                    <button onClick={() => removeFromCart(i.id)}>Remove</button>
                  </div>
                </div>
              ))}
              <div className="cart-total">
                Total: ${cart.reduce((s,i)=>s+i.price*i.qty,0).toFixed(2)}
              </div>
              <input placeholder="Your name (optional)" value={name} onChange={e=>setName(e.target.value)} />
              <button onClick={placeOrder} disabled={loading}>{loading ? 'Placing...' : 'Place Order'}</button>
            </div>
          )}

          <h3>Order History</h3>
          {orders.length === 0 ? <p>No orders yet.</p> : (
            <div className="orders">
              {orders.map(o => (
                <div className="order" key={o.id}>
                  <div><strong>{o.customer}</strong> — {new Date(o.createdAt).toLocaleString()}</div>
                  <div className="order-items">{o.items.map(it => <div key={it.id}>{it.name} x {it.qty}</div>)}</div>
                  <div className="order-total">${o.total.toFixed(2)}</div>
                </div>
              ))}
            </div>
          )}
        </aside>
      </main>

      <footer>
        <small>Demo — not for production</small>
      </footer>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App));
