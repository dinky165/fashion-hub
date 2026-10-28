from flask import Flask, jsonify, request
from flask_cors import CORS
from pathlib import Path
import sqlite3
import json
import re

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": ["http://localhost:5173", "http://127.0.0.1:5173"]}})

DB_PATH = Path(__file__).with_name("fashion.db")

SEED_PRODUCTS = [
    ("Everyday Linen Shirt", "Men", 1299, "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=85", "BESTSELLER"),
    ("Soft Knit Cardigan", "Women", 1899, "https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=800&q=85", "NEW"),
    ("Classic Denim Jacket", "Men", 2499, "https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=800&q=85", ""),
    ("Everyday Midi Dress", "Women", 2199, "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=85", "POPULAR"),
    ("Relaxed Cotton Tee", "Men", 799, "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=85", ""),
    ("Minimal Shoulder Bag", "Accessories", 1599, "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=85", "NEW"),
    ("Tailored Wide-Leg Pants", "Women", 1799, "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=85", ""),
    ("Weekend Overshirt", "Men", 1999, "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=800&q=85", "")
]

def connect_db():
    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    return con

def initialize_db():
    with connect_db() as con:
        con.execute("""
            CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                category TEXT NOT NULL,
                price REAL NOT NULL CHECK(price >= 0),
                image TEXT NOT NULL,
                badge TEXT NOT NULL DEFAULT ''
            )
        """)
        con.execute("""
            CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                customer TEXT NOT NULL,
                email TEXT NOT NULL,
                phone TEXT NOT NULL,
                address TEXT NOT NULL,
                items TEXT NOT NULL,
                subtotal REAL NOT NULL,
                shipping REAL NOT NULL,
                total REAL NOT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        """)
        count = con.execute("SELECT COUNT(*) FROM products").fetchone()[0]
        if count == 0:
            con.executemany("""
                INSERT INTO products (name, category, price, image, badge)
                VALUES (?, ?, ?, ?, ?)
            """, SEED_PRODUCTS)

@app.get("/api/health")
def health():
    return jsonify({"status": "ok", "message": "Fashion Hub API is running"})

@app.get("/api/products")
def get_products():
    with connect_db() as con:
        rows = con.execute("""
            SELECT id, name, category, price, image, badge
            FROM products ORDER BY id
        """).fetchall()
    return jsonify([dict(row) for row in rows])

@app.post("/api/orders")
def create_order():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "Please send order details as JSON."}), 400

    customer = str(data.get("customer", "")).strip()
    email = str(data.get("email", "")).strip()
    phone = str(data.get("phone", "")).strip()
    address = str(data.get("address", "")).strip()
    items = data.get("items")

    if len(customer) < 2:
        return jsonify({"error": "Please enter your full name."}), 400
    if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email):
        return jsonify({"error": "Please enter a valid email address."}), 400
    if len(phone) < 10:
        return jsonify({"error": "Please enter a valid phone number."}), 400
    if len(address) < 8:
        return jsonify({"error": "Please enter a complete delivery address."}), 400
    if not isinstance(items, list) or not items or len(items) > 50:
        return jsonify({"error": "Your cart is empty or contains too many items."}), 400

    clean_items = []
    subtotal = 0.0
    try:
        with connect_db() as con:
            for item in items:
                product_id = int(item["id"])
                quantity = int(item["quantity"])
                if quantity < 1 or quantity > 99:
                    return jsonify({"error": "Each quantity must be between 1 and 99."}), 400
                product = con.execute(
                    "SELECT id, name, price FROM products WHERE id = ?", (product_id,)
                ).fetchone()
                if product is None:
                    return jsonify({"error": "A product in your cart no longer exists."}), 400
                subtotal += float(product["price"]) * quantity
                clean_items.append({
                    "id": product["id"],
                    "name": product["name"],
                    "price": float(product["price"]),
                    "quantity": quantity
                })
            shipping = 0.0 if subtotal == 0 or subtotal >= 2500 else 99.0
            total = subtotal + shipping
            cursor = con.execute("""
                INSERT INTO orders (customer, email, phone, address, items, subtotal, shipping, total)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                customer, email, phone, address, json.dumps(clean_items),
                subtotal, shipping, total
            ))
            order_id = cursor.lastrowid
    except (KeyError, TypeError, ValueError):
        return jsonify({"error": "One or more cart items are invalid."}), 400

    return jsonify({
        "message": "Order placed successfully",
        "order_id": order_id,
        "subtotal": round(subtotal, 2),
        "shipping": round(shipping, 2),
        "total": round(total, 2)
    }), 201

@app.get("/api/orders")
def list_orders():
    # Local demo endpoint for checking saved orders. Do not expose publicly in production.
    with connect_db() as con:
        rows = con.execute("""
            SELECT id, customer, email, phone, address, items, subtotal, shipping, total, created_at
            FROM orders ORDER BY id DESC
        """).fetchall()
    results = []
    for row in rows:
        order = dict(row)
        order["items"] = json.loads(order["items"])
        results.append(order)
    return jsonify(results)

if __name__ == "__main__":
    initialize_db()
    print("Fashion Hub API: http://127.0.0.1:5000")
    print("Health check: http://127.0.0.1:5000/api/health")
    app.run(debug=True, port=5000)
