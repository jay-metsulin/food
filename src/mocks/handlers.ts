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

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
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