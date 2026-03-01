# Food Delivery App — Claude Code Project

## What to build
A complete food delivery app (think DoorDash/UberEats) that runs with **zero backend installation**.  
- **Database**: SQLocal (SQLite in the browser via WebAssembly + OPFS — no PostgreSQL)  
- **API**: Mock Service Worker v2 (intercepts all fetch() calls — no Express server)  
- **`npm install && npm start` is the only setup required**

---

## Tech stack (use exact versions)

| Package | Version |
|---|---|
| expo | ~51.0.0 |
| react-native | 0.74.1 |
| react-native-web | ~0.19.12 |
| @expo/webpack-config | ^19.0.1 |
| typescript | ^5.3.3 |
| sqlocal | ^0.12.0 |
| msw | ^2.3.4 |
| zod | ^3.23.8 |
| react-hook-form | ^7.52.1 |
| @hookform/resolvers | ^3.6.0 |
| zustand | ^4.5.4 |
| @react-navigation/native | ^6.1.18 |
| @react-navigation/stack | ^6.3.29 |
| @react-navigation/bottom-tabs | ^6.5.20 |
| react-native-screens | ^3.31.1 |
| react-native-safe-area-context | ^4.10.5 |
| nativewind | ^2.0.11 |
| tailwindcss | 3.1.8 (pinned — last sync PostCSS version) |
| bcryptjs | ^2.4.3 |
| uuid | ^10.0.0 |
| @stripe/stripe-js | ^4.1.0 |
| react-native-maps | ^1.14.0 |

| react-native-gesture-handler | ^2.16.2 (required by @react-navigation/stack) |

Dev deps: `@babel/core ^7.24`, `@types/bcryptjs`, `@types/react ~18.2`, `@types/react-native ~0.73`, `@types/uuid ^10`
Overrides: `postcss: "8.4.14"` (prevents async plugin detection)

---

## Architecture rules (never break these)

- MSW intercepts ALL fetch() calls — do NOT install Express, Fastify, or any server
- SQLocal stores ALL data in browser OPFS — do NOT install PostgreSQL or SQLite CLI
- Zod schemas in `src/schemas/` are imported by BOTH MSW handlers AND React Hook Form — no duplication
- Auth token lives in Zustand memory store only — NOT in localStorage
- All styling via NativeWind (Tailwind classes) — no inline styles
- `NODE_ENV=development` starts MSW worker; production build skips it and hits real API_BASE_URL

---

## Execution order

Implement in this exact order. Do not skip ahead.

1. Config files (Section 2)
2. Navigation setup (Section 3)
3. Reusable components (Section 4)
4. Database layer — SQLocal (Section 5)
5. MSW handlers — all 14, no stubs (Section 6)
6. Shared Zod schemas (Section 7)
7. State stores (Section 8)
8. All 10 screens (Section 9)
9. Verify checklist (Section 10)

---

## Section 2 — Config files (create all before any screen code)

### package.json
```json
{
  "name": "delivery-app",
  "version": "1.0.0",
  "main": "node_modules/expo/AppEntry.js",
  "scripts": {
    "start": "expo start --web",
    "web": "expo start --web",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "build:web": "expo export --platform web",
    "msw:init": "msw init public/ --save",
    "typecheck": "tsc --noEmit",
    "tailwind": "tailwindcss -i src/global.css -o src/tailwind-built.css",
    "tailwind:watch": "tailwindcss -i src/global.css -o src/tailwind-built.css --watch"
  },
  "dependencies": {
    "expo": "~51.0.0",
    "react": "18.2.0",
    "react-native": "0.74.1",
    "react-native-web": "~0.19.12",
    "react-native-gesture-handler": "^2.16.2",
    "sqlocal": "^0.12.0",
    "msw": "^2.3.4",
    "zod": "^3.23.8",
    "react-hook-form": "^7.52.1",
    "@hookform/resolvers": "^3.6.0",
    "zustand": "^4.5.4",
    "@react-navigation/native": "^6.1.18",
    "@react-navigation/stack": "^6.3.29",
    "@react-navigation/bottom-tabs": "^6.5.20",
    "react-native-screens": "^3.31.1",
    "react-native-safe-area-context": "^4.10.5",
    "nativewind": "^2.0.11",
    "tailwindcss": "3.1.8",
    "bcryptjs": "^2.4.3",
    "uuid": "^10.0.0",
    "@stripe/stripe-js": "^4.1.0",
    "react-native-maps": "^1.14.0"
  },
  "devDependencies": {
    "@babel/core": "^7.24.0",
    "@expo/webpack-config": "^19.0.1",
    "@types/bcryptjs": "^2.4.6",
    "@types/react": "~18.2.0",
    "@types/react-native": "~0.73.0",
    "@types/uuid": "^10.0.0",
    "typescript": "^5.3.3"
  },
  "overrides": {
    "postcss": "8.4.14"
  }
}
```

**Critical version pins:**
- `tailwindcss: "3.1.8"` — Last fully synchronous PostCSS plugin. v3.2+ returns Promises, breaking NativeWind v2's sync babel pipeline.
- `postcss: "8.4.14"` (override) — Prevents newer PostCSS from detecting async plugins and throwing.

### app.json
```json
{
  "expo": {
    "name": "DeliveryApp",
    "slug": "delivery-app",
    "version": "1.0.0",
    "orientation": "portrait",
    "platforms": ["ios", "android", "web"],
    "web": { "bundler": "webpack", "output": "single" }
  }
}
```

### tsconfig.json
```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["src", "*.ts", "*.tsx"]
}
```

### babel.config.js
```js
module.exports = function(api) {
  api.cache(true);
  return { presets: ["babel-preset-expo"], plugins: ["nativewind/babel"] };
};
```

### webpack.config.js  ← REQUIRED for SQLocal (SharedArrayBuffer needs COOP/COEP)
```js
const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const path = require('path');

module.exports = async function(env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);
  // COOP/COEP headers required for SharedArrayBuffer (SQLocal uses OPFS)
  config.devServer = config.devServer || {};
  config.devServer.headers = {
    ...config.devServer.headers,
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Embedder-Policy': 'require-corp',
  };
  // Serve public/ folder for MSW service worker and placeholder images
  config.devServer.static = [
    ...(Array.isArray(config.devServer.static) ? config.devServer.static : config.devServer.static ? [config.devServer.static] : []),
    { directory: path.resolve(__dirname, 'public'), publicPath: '/' },
  ];
  // Path alias: @/ → ./src/
  config.resolve = config.resolve || {};
  config.resolve.alias = {
    ...config.resolve.alias,
    '@': path.resolve(__dirname, 'src'),
  };
  return config;
};
```

### tailwind.config.js
```js
module.exports = {
  important: true, // Required: overrides React Native Web's inline styles
  content: ['./App.tsx', './src/**/*.{js,jsx,ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
};
```

### postcss.config.js
```js
module.exports = { plugins: { tailwindcss: {}, autoprefixer: {} } };
```

### src/global.css ← Tailwind directives source file
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### src/tailwind-built.css ← Pre-built CSS (generated, do not hand-edit)
Generate with: `npm run tailwind`
This file is imported in App.tsx so actual Tailwind CSS rules are present in the DOM with `!important`, overriding React Native Web's inline styles.

### App.tsx (entry point)
```tsx
import './src/tailwind-built.css'; // Pre-built Tailwind CSS for web
import { useEffect, useState } from 'react';
import { initDatabase } from '@/db/init';
import RootNavigator from '@/navigation/RootNavigator';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { View, ActivityIndicator } from 'react-native';

async function prepare() {
  if (process.env.NODE_ENV === 'development') {
    const { worker } = await import('./src/mocks/browser');
    await worker.start({ onUnhandledRequest: 'bypass' });
  }
  await initDatabase();
}

export default function App() {
  const [ready, setReady] = useState(false);
  useEffect(() => { prepare().then(() => setReady(true)); }, []);
  if (!ready) return <View className="flex-1 items-center justify-center"><ActivityIndicator size="large" /></View>;
  return <ErrorBoundary><RootNavigator /></ErrorBoundary>;
}
```

**How NativeWind styling works on web:**
1. `nativewind/babel` plugin wraps RN components with `StyledComponent` which passes `className` through as CSS classes (via `$css: true` mode)
2. React Native Web renders actual `<div>` elements with both inline styles AND CSS class names
3. The pre-built `tailwind-built.css` provides real CSS rules with `!important` that override RNW's inline styles
4. Both the babel plugin AND the pre-built CSS are required for styling to work on web

---

## Section 3 — Navigation (src/navigation/)

### types.ts
```ts
export type AuthStackParamList = {
  Splash: undefined;
  Signup: undefined;
  OTP: { userId: string; phone: string };
  Login: undefined;
};
export type HomeStackParamList = {
  HomeScreen: undefined;
  Restaurant: { restaurantId: string };
  Cart: undefined;
  Checkout: undefined;
  OrderTracking: { orderId: string };
  Rating: { orderId: string };
};
```

### RootNavigator.tsx
```tsx
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '@/lib/auth';
import AuthStack from './AuthStack';
import MainTabs from './MainTabs';

const Stack = createStackNavigator();
export default function RootNavigator() {
  const { accessToken } = useAuth();
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {accessToken
          ? <Stack.Screen name="Main" component={MainTabs} />
          : <Stack.Screen name="Auth" component={AuthStack} />}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

### AuthStack, MainTabs, HomeStack
- AuthStack: Splash → Signup → OTP → Login (all headerShown: false)
- MainTabs: 5 bottom tabs — Home (HomeStack) | Search | Orders | Offers | Profile
- HomeStack: HomeScreen → Restaurant → Cart → Checkout → OrderTracking → Rating

---

## Section 4 — Reusable components (src/components/)

Build ALL of these before any screen. Every screen imports from here.

| File | Props | Notes |
|---|---|---|
| Button.tsx | label, onPress, variant ('primary'\|'secondary'\|'ghost'), loading, disabled | Shows spinner when loading; greyed when disabled |
| Input.tsx | label, error, required, ...TextInputProps | Error text below field; green checkmark when valid |
| PasswordInput.tsx | label, error, ...TextInputProps | Input + show/hide eye icon |
| SkeletonLoader.tsx | width, height, borderRadius | Animated shimmer; use while loading |
| RestaurantCard.tsx | restaurant: Restaurant | Logo, name, rating, ETA, delivery fee |
| MenuItemCard.tsx | item: MenuItem, onAdd | Image, name, price, + Add button |
| CartItemRow.tsx | item: CartItem, onQtyChange, onRemove | Swipeable; qty stepper |
| StarRating.tsx | value, onChange?, readonly? | 1–5 stars; tap to set; readonly display mode |
| Toast.tsx | message, type ('error'\|'success'\|'info'), visible | Auto-dismiss after 3s; bottom position |
| OTPInput.tsx | length=6, onComplete(code) | Split inputs; auto-advance; paste support; numeric |
| ProgressSteps.tsx | steps: string[], currentStep: number | 4-step order tracking indicator |
| BottomSheet.tsx | visible, onClose, children | Modal drawer from bottom with backdrop |
| ErrorBoundary.tsx | children | Class component; catches errors; shows fallback |
| OfflineBanner.tsx | — | NetInfo listener; shows banner when offline |

---

## Section 5 — Database (src/db/)

### db/index.ts
```ts
import { SQLocal } from 'sqlocal';

const db = new SQLocal('delivery-app.sqlite3');

// Wrapper around SQLocal — db.exec() is protected, so we use db.sql()
// which accepts plain SQL strings with ? placeholders.
export const driver = {
  async exec(sql: string, params?: any[]): Promise<{ rows: any[] }> {
    if (params && params.length > 0) {
      const rows = await db.sql(sql, ...params);
      return { rows: rows ?? [] };
    }
    // Multi-statement DDL: split on ; and execute individually
    const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);
    let lastRows: any[] = [];
    for (const stmt of statements) {
      lastRows = await db.sql(stmt);
    }
    return { rows: lastRows ?? [] };
  }
};
```

**Why not SQLocalDrizzle?** `SQLocalDrizzle` exports a drizzle-specific function, not an object with `.exec()`. The `SQLocal` class has `.exec()` as `protected`, so we wrap `.sql()` which accepts plain strings with `?` placeholders spread as rest args.

### db/schema.ts — paste this SQL exactly
```ts
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
```

### db/init.ts
```ts
import { driver } from './index';
import { CREATE_TABLES_SQL } from './schema';
import { seedDatabase } from './seed';

export async function initDatabase(): Promise<void> {
  await driver.exec(CREATE_TABLES_SQL);
  await seedDatabase(driver);
}
```

### db/seed.ts — run once, guarded by localStorage flag
```ts
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';

const SEED_KEY = 'db_seeded_v1';

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}

export async function seedDatabase(driver: any) {
  if (localStorage.getItem(SEED_KEY)) return;

  const hash = await bcrypt.hash('Password1', 12);
  await driver.exec(
    `INSERT OR IGNORE INTO users VALUES ('u1','Test User','test@example.com','+14155551234','${hash}','1990-01-01',1,NULL,datetime('now'))`
  );
  await driver.exec(
    `INSERT OR IGNORE INTO addresses VALUES ('a1','u1','Home','123 Main St','San Francisco','CA','94102',37.77,-122.41,1)`
  );
  await driver.exec(`INSERT OR IGNORE INTO restaurants VALUES
    ('r1','Pizza Palace','Best wood-fired pizza','/assets/imgs/pizza.png',37.77,-122.41,4.5,2.99,15,30),
    ('r2','Burger Barn','Gourmet smash burgers','/assets/imgs/burger.png',37.78,-122.42,4.2,0,10,20),
    ('r3','Sushi Spot','Fresh daily sushi','/assets/imgs/sushi.png',37.76,-122.40,4.8,3.99,25,45)`
  );
  await driver.exec(`INSERT OR IGNORE INTO menu_categories VALUES
    ('mc1','r1','Pizzas',1),('mc2','r1','Drinks',2),
    ('mc3','r2','Burgers',1),('mc4','r2','Sides',2),
    ('mc5','r3','Rolls',1),('mc6','r3','Starters',2)`
  );
  await driver.exec(`INSERT OR IGNORE INTO menu_items VALUES
    ('mi1','mc1','Margherita','Classic tomato & mozzarella',12.99,'/assets/imgs/margherita.png',1),
    ('mi2','mc1','Pepperoni','Double pepperoni',14.99,'/assets/imgs/pepperoni.png',1),
    ('mi3','mc2','Cola','Chilled Coca-Cola',2.99,NULL,1),
    ('mi4','mc3','Smash Burger','Double smash patty',13.99,'/assets/imgs/smashburger.png',1),
    ('mi5','mc4','Fries','Crispy fries',4.99,NULL,1),
    ('mi6','mc5','Salmon Roll','Fresh salmon 8pc',16.99,'/assets/imgs/salmonroll.png',1)`
  );
  await driver.exec(`INSERT OR IGNORE INTO promo_codes VALUES
    ('p1','WELCOME20','percent',20,0,'2099-01-01T00:00:00Z',1000,0),
    ('p2','FLAT5','flat',5,20,'2099-01-01T00:00:00Z',500,0)`
  );
  const otpHash = await sha256('123456');
  await driver.exec(
    `INSERT OR REPLACE INTO otp_tokens VALUES ('otp1','u1','${otpHash}','2099-12-31T00:00:00Z',0,0)`
  );
  localStorage.setItem(SEED_KEY, '1');
}
```

---

## Section 6 — MSW handlers (src/mocks/)

### browser.ts
```ts
import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';
export const worker = setupWorker(...handlers);
```

### handlers.ts — implement ALL 14, no stubs or TODOs

```ts
import { http, HttpResponse } from 'msw';
import { driver } from '@/db';
import { RegisterSchema, LoginSchema } from '@/schemas/auth';
import { CreateOrderSchema } from '@/schemas/order';
import { RatingSchema } from '@/schemas/rating';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';

function getAuthedUser(request: Request) {
  const auth = request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  try {
    const payload = JSON.parse(atob(auth.split(' ')[1]));
    return payload.exp > Date.now() ? payload : null;
  } catch { return null; }
}

function mockToken(userId: string) {
  return btoa(JSON.stringify({ userId, exp: Date.now() + 900_000 }));
}

export const handlers = [

  // 1. Register
  http.post('/api/auth/register', async ({ request }) => {
    const body = await request.json();
    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) return HttpResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors } }, { status: 422 });
    const existing = await driver.exec(`SELECT id FROM users WHERE email = ?`, [parsed.data.email]);
    if (existing.rows.length) return HttpResponse.json(
      { success: false, error: { code: 'email_already_registered' } }, { status: 409 });
    const id = uuid();
    const hash = await bcrypt.hash(parsed.data.password, 12);
    await driver.exec(`INSERT INTO users VALUES (?,?,?,?,?,?,0,NULL,datetime('now'))`,
      [id, parsed.data.name, parsed.data.email, parsed.data.phone, hash, parsed.data.dob]);
    const otpHash = await sha256('123456');
    await driver.exec(`INSERT OR REPLACE INTO otp_tokens VALUES (?,?,?,?,0,0)`,
      [uuid(), id, otpHash, new Date(Date.now() + 600_000).toISOString()]);
    return HttpResponse.json({ success: true, data: { userId: id } }, { status: 201 });
  }),

  // 2. Login
  http.post('/api/auth/login', async ({ request }) => {
    const { email, password } = await request.json() as any;
    const rows = await driver.exec(`SELECT * FROM users WHERE email = ?`, [email]);
    const user = rows.rows[0] as any;
    if (!user) return HttpResponse.json(
      { success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Incorrect email or password.' } }, { status: 401 });
    if (user.locked_until && new Date(user.locked_until) > new Date())
      return HttpResponse.json({ success: false, error: { code: 'ACCOUNT_LOCKED', lockedUntil: user.locked_until } }, { status: 403 });
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      await driver.exec(`INSERT INTO failed_logins VALUES (?,?,datetime('now'))`, [uuid(), user.id]);
      const recent = await driver.exec(
        `SELECT COUNT(*) as c FROM failed_logins WHERE user_id=? AND attempted_at > datetime('now','-15 minutes')`, [user.id]);
      if ((recent.rows[0] as any).c >= 5) {
        const lockUntil = new Date(Date.now() + 900_000).toISOString();
        await driver.exec(`UPDATE users SET locked_until=? WHERE id=?`, [lockUntil, user.id]);
      }
      return HttpResponse.json({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Incorrect email or password.' } }, { status: 401 });
    }
    return HttpResponse.json({ success: true, data: { accessToken: mockToken(user.id), user: { id: user.id, name: user.name, email: user.email } } });
  }),

  // 3. OTP verify
  http.post('/api/auth/otp/verify', async ({ request }) => {
    const { userId, code } = await request.json() as any;
    const hash = await sha256(code);
    const rows = await driver.exec(`SELECT * FROM otp_tokens WHERE user_id=?`, [userId]);
    const otp = rows.rows[0] as any;
    if (!otp) return HttpResponse.json({ success: false, error: { code: 'OTP_NOT_FOUND' } }, { status: 404 });
    if (new Date(otp.expires_at) < new Date()) return HttpResponse.json(
      { success: false, error: { code: 'OTP_EXPIRED', message: 'OTP has expired. Request a new one.' } }, { status: 400 });
    if (otp.attempts >= 5) return HttpResponse.json(
      { success: false, error: { code: 'OTP_MAX_ATTEMPTS' } }, { status: 429 });
    if (otp.code_hash !== hash) {
      await driver.exec(`UPDATE otp_tokens SET attempts=attempts+1 WHERE user_id=?`, [userId]);
      return HttpResponse.json({ success: false, error: { code: 'OTP_INCORRECT', attemptsLeft: 5 - otp.attempts - 1 } }, { status: 400 });
    }
    await driver.exec(`UPDATE users SET is_verified=1 WHERE id=?`, [userId]);
    await driver.exec(`DELETE FROM otp_tokens WHERE user_id=?`, [userId]);
    return HttpResponse.json({ success: true });
  }),

  // 4. OTP resend
  http.post('/api/auth/otp/resend', async ({ request }) => {
    const { userId } = await request.json() as any;
    const rows = await driver.exec(`SELECT * FROM otp_tokens WHERE user_id=?`, [userId]);
    const otp = rows.rows[0] as any;
    if (otp?.resend_count >= 3) return HttpResponse.json(
      { success: false, error: { code: 'OTP_RESEND_LIMIT', message: 'Max resend limit. Try again in 1 hour.' } }, { status: 429 });
    const hash = await sha256('123456');
    const expires = new Date(Date.now() + 600_000).toISOString();
    await driver.exec(`INSERT OR REPLACE INTO otp_tokens VALUES (?,?,?,?,0,?)`,
      [uuid(), userId, hash, expires, (otp?.resend_count || 0) + 1]);
    return HttpResponse.json({ success: true });
  }),

  // 5. Token refresh
  http.post('/api/auth/refresh', async ({ request }) => {
    const user = getAuthedUser(request);
    if (!user) return HttpResponse.json({ success: false }, { status: 401 });
    return HttpResponse.json({ success: true, data: { accessToken: mockToken(user.userId) } });
  }),

  // 6. List restaurants
  http.get('/api/restaurants', async ({ request }) => {
    if (!getAuthedUser(request)) return HttpResponse.json({ success: false }, { status: 401 });
    const url = new URL(request.url);
    const q = url.searchParams.get('q') || '';
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const rows = await driver.exec(`SELECT * FROM restaurants WHERE name LIKE ? LIMIT 20 OFFSET ?`, [`%${q}%`, offset]);
    return HttpResponse.json({ success: true, data: rows.rows });
  }),

  // 7. Restaurant detail
  http.get('/api/restaurants/:id', async ({ request, params }) => {
    if (!getAuthedUser(request)) return HttpResponse.json({ success: false }, { status: 401 });
    const r = await driver.exec(`SELECT * FROM restaurants WHERE id=?`, [params.id]);
    const cats = await driver.exec(`SELECT * FROM menu_categories WHERE restaurant_id=? ORDER BY sort_order`, [params.id]);
    const items = await driver.exec(`SELECT * FROM menu_items WHERE category_id IN (SELECT id FROM menu_categories WHERE restaurant_id=?)`, [params.id]);
    return HttpResponse.json({ success: true, data: { ...r.rows[0], categories: cats.rows, items: items.rows } });
  }),

  // 8. Promo validate
  http.post('/api/promo/validate', async ({ request }) => {
    if (!getAuthedUser(request)) return HttpResponse.json({ success: false }, { status: 401 });
    const { code, subtotal } = await request.json() as any;
    const rows = await driver.exec(`SELECT * FROM promo_codes WHERE code=?`, [code.toUpperCase()]);
    const promo = rows.rows[0] as any;
    if (!promo) return HttpResponse.json({ success: false, error: { code: 'PROMO_NOT_FOUND', message: "This promo code doesn't exist." } }, { status: 404 });
    if (new Date(promo.expiry) < new Date()) return HttpResponse.json({ success: false, error: { code: 'PROMO_EXPIRED', message: 'This promo code has expired.' } }, { status: 400 });
    if (promo.uses_count >= promo.max_uses) return HttpResponse.json({ success: false, error: { code: 'PROMO_LIMIT_REACHED', message: 'Promo limit reached.' } }, { status: 400 });
    if (subtotal < promo.min_order) return HttpResponse.json({ success: false, error: { code: 'PROMO_MIN_ORDER', message: `Minimum $${promo.min_order} required for this code.` } }, { status: 400 });
    const discount = promo.discount_type === 'percent' ? subtotal * (promo.amount / 100) : promo.amount;
    return HttpResponse.json({ success: true, data: { discount: Math.min(discount, subtotal), promoId: promo.id } });
  }),

  // 9. Create order
  http.post('/api/orders/create', async ({ request }) => {
    const user = getAuthedUser(request);
    if (!user) return HttpResponse.json({ success: false }, { status: 401 });
    const body = await request.json();
    const parsed = CreateOrderSchema.safeParse(body);
    if (!parsed.success) return HttpResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors } }, { status: 422 });
    const d = parsed.data as any;
    const restRows = await driver.exec(`SELECT min_order FROM restaurants WHERE id=?`, [d.restaurantId]);
    const minOrder = (restRows.rows[0] as any)?.min_order || 0;
    if (d.subtotal < minOrder) return HttpResponse.json({ success: false, error: { code: 'ORDER_MINIMUM_NOT_MET', message: `Minimum order is $${minOrder}.` } }, { status: 400 });
    const orderId = uuid();
    await driver.exec(`INSERT INTO orders VALUES (?,?,?,'confirmed',?,?,?,?,?,?,?,datetime('now'))`,
      [orderId, user.userId, d.restaurantId, d.subtotal, d.deliveryFee, d.discount || 0, d.tax, d.tipAmount || 0, d.total, d.deliveryNotes || '']);
    for (const item of d.items) {
      await driver.exec(`INSERT INTO order_items VALUES (?,?,?,?,?,?)`,
        [uuid(), orderId, item.menuItemId, item.quantity, item.unitPrice, JSON.stringify(item.customizations || {})]);
    }
    return HttpResponse.json({ success: true, data: { orderId } }, { status: 201 });
  }),

  // 10. Get order (with auto-advancing status based on elapsed time)
  http.get('/api/orders/:id', async ({ request, params }) => {
    const user = getAuthedUser(request);
    if (!user) return HttpResponse.json({ success: false }, { status: 401 });
    const rows = await driver.exec(`SELECT * FROM orders WHERE id=? AND user_id=?`, [params.id, user.userId]);
    const order = rows.rows[0] as any;
    if (!order) return HttpResponse.json({ success: false }, { status: 404 });
    // Auto-advance status by time elapsed since created_at
    const elapsed = (Date.now() - new Date(order.created_at).getTime()) / 60000;
    const status = elapsed < 2 ? 'confirmed' : elapsed < 7 ? 'preparing' : elapsed < 15 ? 'out_for_delivery' : 'delivered';
    if (status !== order.status) {
      await driver.exec(`UPDATE orders SET status=? WHERE id=?`, [status, params.id]);
      order.status = status;
    }
    const items = await driver.exec(`SELECT oi.*, mi.name FROM order_items oi JOIN menu_items mi ON oi.menu_item_id=mi.id WHERE oi.order_id=?`, [params.id]);
    return HttpResponse.json({ success: true, data: { ...order, items: items.rows } });
  }),

  // 11. List orders
  http.get('/api/orders', async ({ request }) => {
    const user = getAuthedUser(request);
    if (!user) return HttpResponse.json({ success: false }, { status: 401 });
    const url = new URL(request.url);
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const rows = await driver.exec(`SELECT * FROM orders WHERE user_id=? ORDER BY created_at DESC LIMIT 20 OFFSET ?`, [user.userId, offset]);
    return HttpResponse.json({ success: true, data: rows.rows });
  }),

  // 12. Rate order
  http.post('/api/orders/:id/rate', async ({ request, params }) => {
    const user = getAuthedUser(request);
    if (!user) return HttpResponse.json({ success: false }, { status: 401 });
    const body = await request.json();
    const parsed = RatingSchema.safeParse(body);
    if (!parsed.success) return HttpResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors } }, { status: 422 });
    const d = parsed.data;
    try {
      await driver.exec(`INSERT INTO ratings VALUES (?,?,?,?,?,?,?,datetime('now'))`,
        [uuid(), params.id, user.userId, d.restaurantRating, d.riderRating, d.review || '', JSON.stringify(d.tags || [])]);
      return HttpResponse.json({ success: true }, { status: 201 });
    } catch {
      return HttpResponse.json({ success: false, error: { code: 'ALREADY_RATED', message: "You've already rated this order." } }, { status: 409 });
    }
  }),

  // 13. Get profile
  http.get('/api/profile', async ({ request }) => {
    const user = getAuthedUser(request);
    if (!user) return HttpResponse.json({ success: false }, { status: 401 });
    const rows = await driver.exec(`SELECT id, name, email, phone, dob FROM users WHERE id=?`, [user.userId]);
    const addresses = await driver.exec(`SELECT * FROM addresses WHERE user_id=?`, [user.userId]);
    return HttpResponse.json({ success: true, data: { ...rows.rows[0], addresses: addresses.rows } });
  }),

  // 14. Update profile
  http.put('/api/profile', async ({ request }) => {
    const user = getAuthedUser(request);
    if (!user) return HttpResponse.json({ success: false }, { status: 401 });
    const { name, phone } = await request.json() as any;
    await driver.exec(`UPDATE users SET name=?, phone=? WHERE id=?`, [name, phone, user.userId]);
    const rows = await driver.exec(`SELECT id, name, email, phone FROM users WHERE id=?`, [user.userId]);
    return HttpResponse.json({ success: true, data: rows.rows[0] });
  }),
];

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}
```

---

## Section 7 — Zod schemas (src/schemas/)

### auth.ts
```ts
import { z } from 'zod';
const getAge = (dob: string) => Math.floor((Date.now() - new Date(dob).getTime()) / 31_557_600_000);

export const RegisterSchema = z.object({
  name:            z.string().min(2).max(60).regex(/^[a-zA-Z\s\-]+$/),
  email:           z.string().email(),
  phone:           z.string().regex(/^\+?[0-9]{10,15}$/),
  password:        z.string().min(8).regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/).regex(/^\S+$/),
  confirmPassword: z.string(),
  dob:             z.string()
                     .refine(d => getAge(d) >= 18, 'Must be 18+')
                     .refine(d => new Date(d) < new Date(), 'Cannot be future'),
  termsAccepted:   z.literal(true, { errorMap: () => ({ message: 'Required' }) }),
}).refine(d => d.password === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });

export type RegisterInput = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1, 'Password is required'),
});
export type LoginInput = z.infer<typeof LoginSchema>;
```

### order.ts
```ts
import { z } from 'zod';
export const CheckoutSchema = z.object({
  addressId:     z.string().min(1, 'Please select a delivery address'),
  paymentMethod: z.enum(['stripe_card', 'cash', 'wallet']),
  promoCode:     z.string().min(4).max(20).optional().or(z.literal('')),
  tipAmount:     z.number().min(0).max(100).optional(),
  deliveryNotes: z.string().max(200).optional(),
});
export const CreateOrderSchema = CheckoutSchema.extend({
  restaurantId: z.string().min(1),
  userId:       z.string().min(1),
  subtotal:     z.number().positive(),
  deliveryFee:  z.number().min(0),
  tax:          z.number().min(0),
  total:        z.number().positive(),
  items: z.array(z.object({
    menuItemId:     z.string().min(1),
    quantity:       z.number().int().min(1).max(99),
    unitPrice:      z.number().positive(),
    customizations: z.record(z.string()).optional(),
  })).min(1, 'Cart is empty'),
});
```

**Why `.min(1)` not `.uuid()`?** Seed data uses simple IDs (`'a1'`, `'r1'`, `'mi1'`) which aren't valid UUIDs. Using `.uuid()` causes silent form validation failures.

### rating.ts
```ts
import { z } from 'zod';
export const RatingSchema = z.object({
  restaurantRating: z.number().int().min(1, 'Please rate the restaurant').max(5),
  riderRating:      z.number().int().min(1, 'Please rate the rider').max(5),
  review:           z.string().max(500).optional(),
  tags:             z.array(z.string()).max(10).optional(),
});
export type RatingInput = z.infer<typeof RatingSchema>;
```

---

## Section 8 — State stores (src/lib/ and src/store/)

### src/lib/auth.ts — Zustand auth store
```ts
import { create } from 'zustand';
interface AuthState {
  accessToken: string | null;
  userId: string | null;
  user: { name: string; email: string } | null;
  setAuth: (token: string, userId: string, user: any) => void;
  clearAuth: () => void;
  getAuthHeader: () => Record<string, string>;
}
export const useAuth = create<AuthState>((set, get) => ({
  accessToken: null, userId: null, user: null,
  setAuth: (accessToken, userId, user) => set({ accessToken, userId, user }),
  clearAuth: () => set({ accessToken: null, userId: null, user: null }),
  getAuthHeader: () => {
    const t = get().accessToken;
    return t ? { Authorization: `Bearer ${t}` } : {};
  },
}));
```

### src/lib/api.ts — typed fetch wrapper
```ts
import { useAuth } from './auth';
const BASE = process.env.EXPO_PUBLIC_API_URL || '';
async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...useAuth.getState().getAuthHeader() },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}
export const api = {
  get:    <T>(path: string) => req<T>('GET', path),
  post:   <T>(path: string, body: unknown) => req<T>('POST', path, body),
  put:    <T>(path: string, body: unknown) => req<T>('PUT', path, body),
  delete: <T>(path: string) => req<T>('DELETE', path),
};
```

### src/lib/errorMap.ts — maps MSW codes to RHF field errors
```ts
const MAP: Record<string, { field: string; message: string }> = {
  email_already_registered:  { field: 'email',           message: 'This email is already in use.' },
  email_invalid_format:      { field: 'email',           message: 'Enter a valid email address.' },
  phone_invalid_length:      { field: 'phone',           message: 'Enter a valid phone number.' },
  password_too_short:        { field: 'password',        message: 'Min 8 characters.' },
  passwords_mismatch:        { field: 'confirmPassword', message: 'Passwords do not match.' },
  dob_underage:              { field: 'dob',             message: 'Must be 18 or older.' },
  terms_not_accepted:        { field: 'termsAccepted',   message: 'Accept terms to continue.' },
  INVALID_CREDENTIALS:       { field: 'email',           message: 'Incorrect email or password.' },
  PROMO_EXPIRED:             { field: 'promoCode',       message: 'This promo code has expired.' },
  PROMO_MIN_ORDER:           { field: 'promoCode',       message: 'Minimum order not met for this code.' },
  ORDER_MINIMUM_NOT_MET:     { field: 'root',            message: 'Restaurant minimum order not met.' },
};
export function mapServerErrorsToForm(error: any, setError: Function) {
  if (error?.fields) {
    Object.keys(error.fields).forEach(code => {
      const m = MAP[code]; if (m) setError(m.field, { message: m.message });
    });
  } else if (error?.code && MAP[error.code]) {
    const { field, message } = MAP[error.code];
    setError(field, { message });
  }
}
```

### src/store/cart.ts — Zustand cart store
```ts
import { create } from 'zustand';
export interface CartItem {
  menuItemId: string; name: string; price: number;
  quantity: number; customizations?: Record<string, string>;
}
interface CartState {
  restaurantId: string | null;
  items: CartItem[];
  addItem: (restaurantId: string, item: CartItem) => void;
  removeItem: (menuItemId: string) => void;
  updateQty: (menuItemId: string, qty: number) => void;
  clearCart: () => void;
  subtotal: () => number;
}
export const useCartStore = create<CartState>((set, get) => ({
  restaurantId: null,
  items: [],
  addItem: (restaurantId, item) => {
    if (get().restaurantId && get().restaurantId !== restaurantId) set({ items: [], restaurantId });
    set(s => ({ restaurantId, items: [...s.items.filter(i => i.menuItemId !== item.menuItemId), item] }));
  },
  removeItem: (menuItemId) => set(s => ({ items: s.items.filter(i => i.menuItemId !== menuItemId) })),
  updateQty: (menuItemId, qty) => set(s => ({
    items: qty <= 0 ? s.items.filter(i => i.menuItemId !== menuItemId)
                   : s.items.map(i => i.menuItemId === menuItemId ? { ...i, quantity: qty } : i)
  })),
  clearCart: () => set({ restaurantId: null, items: [] }),
  subtotal: () => get().items.reduce((s, i) => s + i.price * i.quantity, 0),
}));
```

---

## Section 9 — Screens (src/screens/)

Build all 10 screens. Each one must follow these rules:
- Use `useForm({ resolver: zodResolver(schema), mode: 'onBlur' })` for all forms
- Use components from Section 4 — never custom inline components
- Use `api.get/post/put` from `src/lib/api.ts` for all network calls
- Use NativeWind class names for all styling — no `StyleSheet.create`
- Show `<SkeletonLoader>` while loading, `<OfflineBanner>` when offline
- Call `mapServerErrorsToForm` on any API error response

| Screen | File | Key behaviour |
|---|---|---|
| Splash | SplashScreen.tsx | Animated logo 2s; check auth token; redirect or show onboarding |
| Signup | SignupScreen.tsx | RHF + RegisterSchema; password strength bar; POST /api/auth/register → OTP |
| OTP | OTPScreen.tsx | OTPInput component; auto-submit on 6th digit; 60s resend countdown |
| Login | LoginScreen.tsx | RHF + LoginSchema; lockout countdown if ACCOUNT_LOCKED |
| Home | HomeScreen.tsx | Debounced search 300ms; FlatList with SkeletonLoader; RestaurantCard |
| Restaurant | RestaurantDetailScreen.tsx | SectionList with sticky tabs; BottomSheet for customization; FloatingCartBar |
| Cart | CartScreen.tsx | useCartStore; SwipeableRow; promo code input; order summary totals |
| Checkout | CheckoutScreen.tsx | Address picker; Stripe.js test mode; tip selector; RHF + CheckoutSchema |
| OrderTracking | OrderTrackingScreen.tsx | Poll /api/orders/:id every 5s; ProgressSteps; cancel < 2 min; confetti on delivered |
| Rating | RatingScreen.tsx | StarRating x2; review with char counter; tags chips; RHF + RatingSchema |

---

## Section 10 — Completion checklist

Do not consider this project done until every box is checked.

- [ ] package.json, app.json, tsconfig.json, babel.config.js, webpack.config.js, tailwind.config.js, postcss.config.js
- [ ] App.tsx with MSW start + initDatabase() + tailwind-built.css import
- [ ] src/global.css (Tailwind directives) + src/tailwind-built.css (pre-built output)
- [ ] public/mockServiceWorker.js  ← run: `npx msw init public/ --save`
- [ ] public/assets/imgs/ — placeholder PNG files for seed restaurant/menu images
- [ ] src/navigation/ — RootNavigator, AuthStack, MainTabs, HomeStack, types.ts
- [ ] src/components/ — all 14 components (Section 4)
- [ ] src/db/ — index.ts (SQLocal wrapper), schema.ts, init.ts, seed.ts
- [ ] src/mocks/ — browser.ts + handlers.ts (all 14 handlers, no stubs)
- [ ] src/schemas/ — auth.ts, order.ts (use .min(1) not .uuid()), rating.ts
- [ ] src/lib/ — auth.ts, api.ts, errorMap.ts
- [ ] src/store/ — cart.ts
- [ ] src/screens/ — all 10 screens

### Quick start verification
```
npm install
npx msw init public/ --save
npm run tailwind          # Build Tailwind CSS (only needed once or after class changes)
npm start                 # Opens http://localhost:19006
# Login: test@example.com / Password1
# OTP: 123456
# Promo codes: WELCOME20 or FLAT5
```

**Note:** This app is designed to run in the browser only (`npm start` / `expo start --web`). SQLocal and MSW are browser-only APIs. Running on Android/iOS would require replacing them with native equivalents.

The full flow must work: login → browse → add to cart → checkout → track order → rate.

---

## Validation rules summary

All validation via Zod. MSW calls `schema.safeParse()`. RHF uses `zodResolver(schema)`. Never duplicate.

**Signup field triggers:**
- `onBlur`: name, email, phone length, password rules, confirmPassword, DOB
- `onChange` (live): phone digits-only filter, password no-spaces filter, password strength bar
- `onSubmit`: termsAccepted

**Error UX:**
- Errors shown inline below each field
- Error clears as soon as user starts typing
- Submit button disabled while `formState.isValid === false`
- Inputs disabled + spinner in button during API call
- `setFocus(firstErrorField)` when submit pressed with errors
- Character counter shown for all max-length fields
- Toasts only for network errors — never for field errors

**Key server-side rules (enforced in MSW handlers):**
- 5 failed logins → 15-min account lockout (stored in `users.locked_until`)
- OTP: 10-min expiry, 5-attempt max, 3 resends/hour
- Order minimum: checked against `restaurants.min_order`
- Promo: expiry, uses_count, min_order all server-enforced
- Rating: `UNIQUE` on `ratings.order_id` prevents duplicates
