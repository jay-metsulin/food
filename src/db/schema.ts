export const CREATE_TABLES_SQL = `
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL,
    phone TEXT, password_hash TEXT NOT NULL, dob TEXT,
    is_verified INTEGER DEFAULT 0, locked_until TEXT,
    created_at TEXT DEFAULT (datetime('now')));
  CREATE TABLE IF NOT EXISTS restaurants (
    id TEXT PRIMARY KEY, name TEXT, description TEXT, logo_url TEXT,
    lat REAL, lng REAL, rating REAL DEFAULT 4.0,
    delivery_fee REAL DEFAULT 0, min_order REAL DEFAULT 0, eta_min INTEGER DEFAULT 30);
  CREATE TABLE IF NOT EXISTS menu_categories (
    id TEXT PRIMARY KEY, restaurant_id TEXT NOT NULL, name TEXT, sort_order INTEGER DEFAULT 0);
  CREATE TABLE IF NOT EXISTS menu_items (
    id TEXT PRIMARY KEY, category_id TEXT NOT NULL, name TEXT, description TEXT,
    price REAL NOT NULL, image_url TEXT, is_available INTEGER DEFAULT 1);
  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL, restaurant_id TEXT NOT NULL,
    status TEXT DEFAULT 'confirmed', subtotal REAL, delivery_fee REAL,
    discount REAL DEFAULT 0, tax REAL, tip REAL DEFAULT 0, total REAL,
    delivery_notes TEXT, created_at TEXT DEFAULT (datetime('now')));
  CREATE TABLE IF NOT EXISTS order_items (
    id TEXT PRIMARY KEY, order_id TEXT NOT NULL, menu_item_id TEXT NOT NULL,
    quantity INTEGER, unit_price REAL, customizations TEXT DEFAULT '{}');
  CREATE TABLE IF NOT EXISTS promo_codes (
    id TEXT PRIMARY KEY, code TEXT UNIQUE,
    discount_type TEXT CHECK(discount_type IN('percent','flat')),
    amount REAL, min_order REAL DEFAULT 0, expiry TEXT,
    max_uses INTEGER, uses_count INTEGER DEFAULT 0);
  CREATE TABLE IF NOT EXISTS ratings (
    id TEXT PRIMARY KEY, order_id TEXT UNIQUE NOT NULL, user_id TEXT NOT NULL,
    restaurant_rating INTEGER CHECK(restaurant_rating BETWEEN 1 AND 5),
    rider_rating INTEGER CHECK(rider_rating BETWEEN 1 AND 5),
    review TEXT, tags TEXT, created_at TEXT DEFAULT (datetime('now')));
  CREATE TABLE IF NOT EXISTS addresses (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL, label TEXT, street TEXT,
    city TEXT, state TEXT, zip TEXT, lat REAL, lng REAL, is_default INTEGER DEFAULT 0);
  CREATE TABLE IF NOT EXISTS otp_tokens (
    id TEXT PRIMARY KEY, user_id TEXT UNIQUE NOT NULL, code_hash TEXT,
    expires_at TEXT, attempts INTEGER DEFAULT 0, resend_count INTEGER DEFAULT 0);
  CREATE TABLE IF NOT EXISTS failed_logins (
    id TEXT PRIMARY KEY, user_id TEXT, attempted_at TEXT DEFAULT (datetime('now')));
`;