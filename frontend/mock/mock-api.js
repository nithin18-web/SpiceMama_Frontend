// DEVELOPMENT ONLY. In-browser stand-in for the PHP API, following API_CONTRACT.yaml.
// State lives in sessionStorage so admin edits carry across pages in one tab.
//
// Test switches (add to any page URL on localhost, kept for the tab):
//   ?mock=error   every request fails with 500
//   ?mock=empty   public lists come back empty
//   ?mock=slow    3 second delay
//   ?mock=off     back to normal
// Mock admin sign-in: any valid email with a password of 8+ characters.
import * as fx from './fixtures.js';

const KEY = 'sm-mock-state-v1';
const MODE_KEY = 'sm-mock-mode';

function readMode() {
  try {
    const m = new URLSearchParams(location.search).get('mock');
    if (m === 'off') sessionStorage.removeItem(MODE_KEY);
    else if (m) sessionStorage.setItem(MODE_KEY, m);
    return sessionStorage.getItem(MODE_KEY) || '';
  } catch { return ''; }
}

function fresh() {
  return {
    categories: structuredClone(fx.categories),
    products: structuredClone(fx.products),
    nextId: { product: 100, category: 100, image: 1000 },
    session: null, // { admin, csrf }
    preCsrf: null,
    failedLogins: 0,
  };
}

let state;
function load() {
  if (state) return state;
  try { state = JSON.parse(sessionStorage.getItem(KEY)) || fresh(); } catch { state = fresh(); }
  return state;
}
function save() {
  try { sessionStorage.setItem(KEY, JSON.stringify(state)); }
  catch { /* quota (large uploaded images): keep in memory only */ }
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const ok = (body, status = 200) => ({ status, body });
const fail = (status, code, message, fields) => ({ status, body: { error: { code, message, ...(fields ? { fields } : {}) } } });
const token = () => Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join('');

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateProduct(input, s, selfId) {
  const f = {};
  const name = (input.name ?? '').trim();
  const slug = (input.slug ?? '').trim();
  if (!name) f.name = 'Enter a product name.';
  else if (name.length > 180) f.name = 'Keep the name under 180 characters.';
  if (!slug) f.slug = 'Enter a web address name.';
  else if (slug.length > 200 || !SLUG_RE.test(slug)) f.slug = 'Use lowercase letters, numbers and dashes only.';
  else if (s.products.some((p) => p.slug === slug && p.id !== selfId)) f.slug = 'Another product already uses this.';
  if (!s.categories.some((c) => c.id === Number(input.category_id))) f.category_id = 'Choose a category.';
  if ((input.short_description ?? '').length > 500) f.short_description = 'Keep this under 500 characters.';
  if ((input.pack_size_label ?? '') && input.pack_size_label.length > 100) f.pack_size_label = 'Keep this under 100 characters.';
  return f;
}

function validateCategory(input, s, selfId) {
  const f = {};
  const name = (input.name ?? '').trim();
  const slug = (input.slug ?? '').trim();
  if (!name) f.name = 'Enter a category name.';
  else if (name.length > 120) f.name = 'Keep the name under 120 characters.';
  if (!slug) f.slug = 'Enter a web address name.';
  else if (slug.length > 160 || !SLUG_RE.test(slug)) f.slug = 'Use lowercase letters, numbers and dashes only.';
  else if (s.categories.some((c) => c.slug === slug && c.id !== selfId)) f.slug = 'Another category already uses this.';
  return f;
}

const PRODUCT_FIELDS = ['name', 'slug', 'category_id', 'short_description', 'description', 'pack_size_label', 'ingredients', 'sort_order'];
const CATEGORY_FIELDS = ['name', 'slug', 'description', 'sort_order', 'is_active'];
const pick = (obj, keys) => Object.fromEntries(keys.filter((k) => obj[k] !== undefined).map((k) => [k, obj[k]]));
const bySort = (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.id - b.id;

export async function handle({ method, path, query, json, headers }) {
  const mode = readMode();
  await wait(mode === 'slow' ? 3000 : 250 + Math.random() * 300);
  if (mode === 'error') return fail(500, 'server_error', 'Simulated server error.');
  const s = load();
  const res = route(s, mode, method, path, query, json || {}, headers);
  save();
  return structuredClone(res);
}

function authed(s, headers, needCsrf) {
  if (!s.session) return fail(401, 'unauthenticated', 'Please sign in.');
  if (needCsrf && headers['X-CSRF-Token'] !== s.session.csrf) return fail(403, 'csrf_invalid', 'Security token expired.');
  return null;
}

function route(s, mode, method, path, query, body, headers) {
  let m;
  // ---------- public ----------
  if (method === 'GET' && path === '/products') {
    let list = mode === 'empty' ? [] : s.products.filter((p) => p.status === 'published');
    if (query.category) {
      const cat = s.categories.find((c) => c.slug === query.category);
      list = cat ? list.filter((p) => p.category_id === cat.id) : [];
    }
    if (query.q) {
      const q = String(query.q).toLowerCase().slice(0, 100);
      list = list.filter((p) => `${p.name} ${p.short_description || ''}`.toLowerCase().includes(q));
    }
    list.sort(bySort);
    const per = Math.min(50, Math.max(1, Number(query.per_page) || 12));
    const total = list.length;
    const pages = Math.max(1, Math.ceil(total / per));
    const page = Math.max(1, Number(query.page) || 1);
    return ok({ data: list.slice((page - 1) * per, page * per), meta: { page, per_page: per, total, total_pages: pages } });
  }
  if (method === 'GET' && (m = path.match(/^\/products\/([^/]+)$/))) {
    const slug = decodeURIComponent(m[1]);
    const p = s.products.find((x) => x.slug === slug && x.status === 'published');
    return p ? ok({ data: p }) : fail(404, 'not_found', 'Product not found.');
  }
  if (method === 'GET' && path === '/categories') {
    const list = mode === 'empty' ? [] : s.categories.filter((c) => c.is_active).sort(bySort);
    return ok({ data: list });
  }

  // ---------- admin auth ----------
  if (method === 'GET' && path === '/admin/csrf') {
    const t = token();
    if (s.session) s.session.csrf = t; else s.preCsrf = t;
    return ok({ data: { csrf_token: t } });
  }
  if (method === 'POST' && path === '/admin/login') {
    if (headers['X-CSRF-Token'] !== s.preCsrf && headers['X-CSRF-Token'] !== s.session?.csrf) return fail(403, 'csrf_invalid', 'Security token expired.');
    if (s.failedLogins >= 5) return fail(429, 'rate_limited', 'Too many attempts.');
    const email = String(body.email || '').trim();
    const password = String(body.password || '');
    if (!EMAIL_RE.test(email) || password.length < 8) {
      s.failedLogins += 1;
      return fail(401, 'invalid_credentials', 'Email or password is incorrect.');
    }
    s.failedLogins = 0;
    const admin = { id: 1, email, display_name: email.split('@')[0] };
    s.session = { admin, csrf: token() };
    return ok({ data: admin });
  }
  if (method === 'GET' && path === '/admin/me') {
    return s.session ? ok({ data: s.session.admin }) : fail(401, 'unauthenticated', 'Please sign in.');
  }
  if (method === 'POST' && path === '/admin/logout') {
    const no = authed(s, headers, true); if (no) return no;
    s.session = null;
    return { status: 204, body: null };
  }

  // ---------- admin products ----------
  if (path === '/admin/products') {
    const no = authed(s, headers, method !== 'GET'); if (no) return no;
    if (method === 'GET') return ok({ data: [...s.products].sort(bySort) });
    if (method === 'POST') {
      const fields = validateProduct(body, s, null);
      if (Object.keys(fields).length) return fail(422, 'validation_failed', 'Some fields need attention.', fields);
      const p = { id: s.nextId.product++, status: 'draft', images: [], sort_order: 0, pack_size_label: null, ingredients: null, short_description: '', description: '', ...pick(body, PRODUCT_FIELDS) };
      p.category_id = Number(p.category_id);
      s.products.push(p);
      return ok({ data: p }, 201);
    }
  }
  if ((m = path.match(/^\/admin\/products\/(\d+)$/)) && method === 'PATCH') {
    const no = authed(s, headers, true); if (no) return no;
    const p = s.products.find((x) => x.id === Number(m[1]));
    if (!p) return fail(404, 'not_found', 'Product not found.');
    const merged = { ...p, ...pick(body, PRODUCT_FIELDS) };
    const fields = validateProduct(merged, s, p.id);
    if (Object.keys(fields).length) return fail(422, 'validation_failed', 'Some fields need attention.', fields);
    Object.assign(p, merged, { category_id: Number(merged.category_id) });
    return ok({ data: p });
  }
  if ((m = path.match(/^\/admin\/products\/(\d+)\/status$/)) && method === 'POST') {
    const no = authed(s, headers, true); if (no) return no;
    const p = s.products.find((x) => x.id === Number(m[1]));
    if (!p) return fail(404, 'not_found', 'Product not found.');
    if (!['draft', 'published', 'archived'].includes(body.status)) return fail(422, 'validation_failed', 'Unknown status.', { status: 'Choose draft, published or archived.' });
    p.status = body.status;
    return ok({ data: p });
  }

  // ---------- admin categories ----------
  if (path === '/admin/categories') {
    const no = authed(s, headers, method !== 'GET'); if (no) return no;
    if (method === 'GET') return ok({ data: [...s.categories].sort(bySort) });
    if (method === 'POST') {
      const fields = validateCategory(body, s, null);
      if (Object.keys(fields).length) return fail(422, 'validation_failed', 'Some fields need attention.', fields);
      const c = { id: s.nextId.category++, description: null, sort_order: 0, is_active: true, ...pick(body, CATEGORY_FIELDS) };
      s.categories.push(c);
      return ok({ data: c }, 201);
    }
  }
  if ((m = path.match(/^\/admin\/categories\/(\d+)$/)) && method === 'PATCH') {
    const no = authed(s, headers, true); if (no) return no;
    const c = s.categories.find((x) => x.id === Number(m[1]));
    if (!c) return fail(404, 'not_found', 'Category not found.');
    const merged = { ...c, ...pick(body, CATEGORY_FIELDS) };
    const fields = validateCategory(merged, s, c.id);
    if (Object.keys(fields).length) return fail(422, 'validation_failed', 'Some fields need attention.', fields);
    Object.assign(c, merged);
    return ok({ data: c });
  }

  return fail(404, 'not_found', `No mock route for ${method} ${path}.`);
}

const UPLOAD_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function handleUpload({ form, csrf, onProgress }) {
  const s = load();
  if (readMode() === 'error') { await wait(400); return fail(500, 'server_error', 'Simulated server error.'); }
  if (!s.session) return fail(401, 'unauthenticated', 'Please sign in.');
  if (csrf !== s.session.csrf) return fail(403, 'csrf_invalid', 'Security token expired.');
  const file = form.get('file');
  const productId = Number(form.get('product_id'));
  const p = s.products.find((x) => x.id === productId);
  if (!p) return fail(422, 'validation_failed', 'Product not found.', { product_id: 'Unknown product.' });
  if (!(file instanceof File)) return fail(422, 'validation_failed', 'Choose an image.', { file: 'Choose an image.' });
  if (file.size > 5 * 1024 * 1024) return fail(413, 'too_large', 'Image is larger than 5 MB.');
  if (!UPLOAD_TYPES.includes(file.type)) return fail(422, 'validation_failed', 'Only JPEG, PNG or WebP.', { file: 'Only JPEG, PNG or WebP images.' });

  for (let i = 1; i <= 10; i++) { await wait(90); onProgress?.(i / 10); }
  const url = await new Promise((resolve) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => resolve(URL.createObjectURL(file));
    r.readAsDataURL(file);
  });
  const image = { id: s.nextId.image++, url, alt_text: String(form.get('alt_text') || ''), sort_order: p.images.length };
  p.images.push(image);
  save();
  return ok({ data: image }, 201);
}
