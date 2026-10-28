import { useEffect, useMemo, useState } from "react";
import { ShoppingBag, Search, Menu, X, Plus, Minus, Trash2, ArrowRight, CheckCircle2 } from "lucide-react";

const API = "http://127.0.0.1:5000/api";
const fallbackProducts = [
  { id: 1, name: "Everyday Linen Shirt", category: "Men", price: 1299, image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=85", badge: "BESTSELLER" },
  { id: 2, name: "Soft Knit Cardigan", category: "Women", price: 1899, image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=800&q=85", badge: "NEW" },
  { id: 3, name: "Classic Denim Jacket", category: "Men", price: 2499, image: "https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=800&q=85", badge: "" },
  { id: 4, name: "Everyday Midi Dress", category: "Women", price: 2199, image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=85", badge: "POPULAR" },
  { id: 5, name: "Relaxed Cotton Tee", category: "Men", price: 799, image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=85", badge: "" },
  { id: 6, name: "Minimal Shoulder Bag", category: "Accessories", price: 1599, image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=85", badge: "NEW" },
  { id: 7, name: "Tailored Wide-Leg Pants", category: "Women", price: 1799, image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=85", badge: "" },
  { id: 8, name: "Weekend Overshirt", category: "Men", price: 1999, image: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=800&q=85", badge: "" }
];

const money = (n) => new Intl.NumberFormat("en-IN", {
  style: "currency", currency: "INR", maximumFractionDigits: 0
}).format(n);

function App() {
  const [products, setProducts] = useState(fallbackProducts);
  const [apiStatus, setApiStatus] = useState("connecting");
  const [cart, setCart] = useState([]);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [customer, setCustomer] = useState({ name: "", email: "", phone: "", address: "" });
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`${API}/products`)
      .then((res) => {
        if (!res.ok) throw new Error("Backend unavailable");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data) && data.length) setProducts(data);
        setApiStatus("online");
      })
      .catch(() => setApiStatus("offline"));
  }, []);

  const categories = ["All", "Women", "Men", "Accessories"];
  const visibleProducts = useMemo(() => products.filter((p) => {
    const categoryMatch = category === "All" || p.category === category;
    const searchMatch = `${p.name} ${p.category}`.toLowerCase().includes(search.toLowerCase());
    return categoryMatch && searchMatch;
  }), [products, category, search]);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal === 0 || subtotal >= 2500 ? 0 : 99;
  const total = subtotal + shipping;

  function addToCart(product) {
    setCart((current) => {
      const found = current.find((item) => item.id === product.id);
      if (found) return current.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...current, { ...product, quantity: 1 }];
    });
    setNotice(`${product.name} added to bag`);
    setCartOpen(true);
    window.setTimeout(() => setNotice(""), 2500);
  }

  function changeQuantity(id, amount) {
    setCart((current) => current
      .map((item) => item.id === id ? { ...item, quantity: item.quantity + amount } : item)
      .filter((item) => item.quantity > 0));
  }

  async function placeOrder(event) {
    event.preventDefault();
    if (!cart.length) return;
    setSubmitting(true);
    setNotice("");
    try {
      const response = await fetch(`${API}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: customer.name.trim(),
          email: customer.email.trim(),
          phone: customer.phone.trim(),
          address: customer.address.trim(),
          items: cart.map(({ id, quantity }) => ({ id, quantity }))
        })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Order could not be placed.");
      setCart([]);
      setCheckoutOpen(false);
      setCartOpen(false);
      setCustomer({ name: "", email: "", phone: "", address: "" });
      setNotice(`Order #${result.order_id} placed successfully! Total ${money(result.total)}.`);
    } catch (error) {
      setNotice(apiStatus === "offline"
        ? "Start the Python backend first (see README). Your cart is still saved on this page."
        : error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="site-shell">
      <div className="announcement">COMPLIMENTARY SHIPPING ON ORDERS OVER ₹2,500</div>
      <header className="header">
        <a className="brand" href="#home" aria-label="Fashion Hub home">FASHION<span>HUB.</span></a>
        <nav className="desktop-nav" aria-label="Main navigation">
          <a href="#shop">New In</a><a href="#shop" onClick={() => setCategory("Women")}>Women</a>
          <a href="#shop" onClick={() => setCategory("Men")}>Men</a><a href="#story">Our Story</a>
        </nav>
        <div className="header-actions">
          <label className="search-box"><Search size={17}/><input aria-label="Search products" placeholder="Search pieces..." value={search} onChange={(e) => { setSearch(e.target.value); document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" }); }}/></label>
          <button className="bag-button" onClick={() => setCartOpen(true)} aria-label={`Open shopping bag, ${cartCount} items`}>
            <ShoppingBag size={20}/><span>Bag</span><b>{cartCount}</b>
          </button>
        </div>
      </header>

      <main>
        <section className="hero" id="home">
          <img className="hero-image" src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=2000&q=90" alt="Friends wearing modern everyday fashion" />
          <div className="hero-shade"/>
          <div className="hero-content">
            <p className="eyebrow light">THE EVERYDAY EDIT · 2026</p>
            <h1>Style that feels<br/><em>like you.</em></h1>
            <p className="hero-copy">Thoughtful essentials. Easy silhouettes.<br/>Made for wherever life takes you.</p>
            <a className="button button-light" href="#shop">Explore collection <ArrowRight size={17}/></a>
          </div>
          <div className="hero-caption">01 / THE NEW SEASON</div>
        </section>

        <section className="intro-strip" id="story">
          <span>DESIGNED FOR REAL LIFE</span><p>Less trend. More <em>you.</em></p><span>QUALITY OVER QUANTITY</span>
        </section>

        <section className="shop-section" id="shop">
          <div className="section-heading">
            <div><p className="eyebrow">THE GOOD STUFF</p><h2>Pieces to live in<span>.</span></h2></div>
            <p className="section-note">The wardrobe favourites you'll reach for<br/>again and again.</p>
          </div>
          <div className="shop-controls">
            <div className="category-tabs">{categories.map((item) => <button key={item} className={category === item ? "tab active" : "tab"} onClick={() => setCategory(item)}>{item}</button>)}</div>
            <span className="result-count">{visibleProducts.length} PIECES</span>
          </div>
          {apiStatus === "offline" && <div className="backend-note">Preview mode: start the Python backend to load database products and save orders.</div>}
          <div className="product-grid">
            {visibleProducts.map((product, index) => (
              <article className="product-card" key={product.id}>
                <div className="product-image-wrap">
                  <img src={product.image} alt={product.name} loading={index > 3 ? "lazy" : "eager"} onError={(e) => { e.currentTarget.src = "https://placehold.co/700x850/f0e9e1/38322d?text=Fashion+Hub"; }}/>
                  {product.badge && <span className="product-badge">{product.badge}</span>}
                  <button className="quick-add" onClick={() => addToCart(product)}><Plus size={16}/> Quick add</button>
                </div>
                <div className="product-info"><div><p className="product-category">{product.category}</p><h3>{product.name}</h3></div><strong>{money(product.price)}</strong></div>
              </article>
            ))}
          </div>
          {visibleProducts.length === 0 && <div className="empty-results">No pieces found. Try another search.</div>}
          <div className="view-all"><button className="button button-dark" onClick={() => { setCategory("All"); setSearch(""); }}>View all pieces <ArrowRight size={16}/></button></div>
        </section>

        <section className="story-banner">
          <div className="story-image"><img src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1100&q=85" alt="Modern fashion editorial" loading="lazy"/></div>
          <div className="story-copy"><p className="eyebrow">A LITTLE MORE CONSIDERED</p><h2>Good clothes.<br/><em>Good feeling.</em></h2><p>We believe getting dressed should be the easiest part of your day. So we focus on versatile pieces, thoughtful details and styles that feel right season after season.</p><a href="#shop" className="text-link">Find your favourites <ArrowRight size={16}/></a></div>
        </section>

        <section className="newsletter"><p className="eyebrow">A NOTE FROM US</p><h2>Good things, occasionally.</h2><p>New arrivals, styling notes and little things worth sharing.</p><a href="#shop" className="text-link">Explore the collection <ArrowRight size={16}/></a></section>
      </main>

      <footer className="footer"><a className="brand footer-brand" href="#home">FASHION<span>HUB.</span></a><p>Wear what feels like you.</p><div className="footer-bottom"><span>© 2026 Fashion Hub</span><span>Made for everyday living.</span><a href="#home">Back to top ↑</a></div></footer>

      {notice && <div className="toast" role="status"><CheckCircle2 size={18}/>{notice}<button onClick={() => setNotice("")} aria-label="Dismiss notification"><X size={16}/></button></div>}

      {cartOpen && <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) setCartOpen(false); }}>
        <aside className="cart-drawer" aria-label="Shopping bag">
          <div className="drawer-header"><div><p className="eyebrow">YOUR SELECTION</p><h2>Your bag <span>({cartCount})</span></h2></div><button className="icon-button" onClick={() => setCartOpen(false)} aria-label="Close bag"><X/></button></div>
          {cart.length === 0 ? <div className="empty-cart"><ShoppingBag size={36}/><h3>Your bag is taking a break.</h3><p>Find something you'll love wearing.</p><button className="button button-dark" onClick={() => { setCartOpen(false); document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" }); }}>Explore pieces</button></div> :
            <><div className="cart-items">{cart.map((item) => <div className="cart-item" key={item.id}><img src={item.image} alt={item.name}/><div className="cart-item-detail"><p className="product-category">{item.category}</p><h3>{item.name}</h3><strong>{money(item.price)}</strong><div className="quantity-control"><button onClick={() => changeQuantity(item.id, -1)} aria-label="Decrease quantity"><Minus size={13}/></button><span>{item.quantity}</span><button onClick={() => changeQuantity(item.id, 1)} aria-label="Increase quantity"><Plus size={13}/></button></div></div><button className="remove-button" onClick={() => setCart((current) => current.filter((p) => p.id !== item.id))} aria-label={`Remove ${item.name}`}><Trash2 size={16}/></button></div>)}</div>
            <div className="cart-summary"><p><span>Subtotal</span><strong>{money(subtotal)}</strong></p><p><span>Shipping</span><strong>{shipping === 0 ? "Complimentary" : money(shipping)}</strong></p><p className="summary-total"><span>Total</span><strong>{money(total)}</strong></p><small>{subtotal >= 2500 ? "You've unlocked complimentary shipping." : `Add ${money(2500 - subtotal)} more for complimentary shipping.`}</small><button className="button button-dark checkout-button" onClick={() => { setCartOpen(false); setCheckoutOpen(true); }}>Continue to checkout <ArrowRight size={16}/></button></div></>}
        </aside>
      </div>}

      {checkoutOpen && <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) setCheckoutOpen(false); }}>
        <section className="checkout-modal">
          <div className="drawer-header"><div><p className="eyebrow">ALMOST YOURS</p><h2>Checkout</h2></div><button className="icon-button" onClick={() => setCheckoutOpen(false)} aria-label="Close checkout"><X/></button></div>
          <p className="checkout-total">Order total <strong>{money(total)}</strong></p>
          <form onSubmit={placeOrder} className="checkout-form">
            <label>Full name<input required minLength="2" value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} placeholder="Your full name"/></label>
            <label>Email address<input type="email" required value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} placeholder="you@example.com"/></label>
            <label>Phone number<input required minLength="10" value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} placeholder="Contact number"/></label>
            <label>Delivery address<textarea required minLength="8" rows="3" value={customer.address} onChange={(e) => setCustomer({ ...customer, address: e.target.value })} placeholder="House no., street, city, PIN code"/></label>
            <p className="demo-note">Demo checkout: no payment is collected. Your order is saved to the local database when the backend is running.</p>
            <button className="button button-dark checkout-button" disabled={submitting}>{submitting ? "Placing order..." : "Place demo order · " + money(total)}</button>
          </form>
        </section>
      </div>}
    </div>
  );
}

export default App;