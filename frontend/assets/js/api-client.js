// The one place the frontend talks to the backend. Follows the root API_CONTRACT.yaml exactly.
// Same-origin /api/v1, session cookie for admin, X-CSRF-Token on every admin change.
import { config } from './config.js';

export class ApiError extends Error {
  constructor(status, code, message, fields = {}) {
    super(message || 'Request failed');
    this.name = 'ApiError';
    this.status = status; // 0 = network/offline/timeout
    this.code = code || 'error';
    this.fields = fields || {};
  }
}

let mockModule = null;
async function mock() {
  // Loaded only in mock mode, so production never downloads /mock.
  if (!mockModule) mockModule = await import('../../mock/mock-api.js');
  return mockModule;
}

function buildQuery(query) {
  if (!query) return '';
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
  }
  const s = qs.toString();
  return s ? `?${s}` : '';
}

function toError(status, body) {
  const e = body && body.error;
  return new ApiError(status, e?.code, e?.message, e?.fields);
}

async function send(method, path, { query, json, form, csrf } = {}) {
  const url = config.apiBase + path + buildQuery(query);
  const headers = { Accept: 'application/json' };
  if (csrf) headers['X-CSRF-Token'] = csrf;

  if (config.apiMode === 'mock') {
    const m = await mock();
    const res = await m.handle({ method, path, query: query || {}, json, form, headers });
    if (res.status >= 400) throw toError(res.status, res.body);
    return res.body ?? null;
  }

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new ApiError(0, 'offline', 'You appear to be offline.');
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), config.timeoutMs);
  let res;
  try {
    const init = { method, headers, credentials: 'same-origin', signal: ctrl.signal };
    if (json !== undefined) {
      headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(json);
    } else if (form) {
      init.body = form;
    }
    res = await fetch(url, init);
  } catch (err) {
    throw err.name === 'AbortError'
      ? new ApiError(0, 'timeout', 'The server took too long to answer.')
      : new ApiError(0, 'network', 'Could not reach the server.');
  } finally {
    clearTimeout(timer);
  }

  if (res.status === 204) return null;
  let body = null;
  const type = res.headers.get('Content-Type') || '';
  if (type.includes('application/json')) {
    try { body = await res.json(); } catch { body = null; }
  }
  if (!res.ok) throw toError(res.status, body);
  return body;
}

// ---------- CSRF ----------
let csrfToken = null;

async function fetchCsrf() {
  const body = await send('GET', '/admin/csrf');
  csrfToken = body?.data?.csrf_token || null;
  return csrfToken;
}

// Admin changes: attach the token; if the server says 403 (token stale), refresh once and retry.
// A 403 means the change was not applied, so retrying is safe.
async function mutate(method, path, opts = {}) {
  if (!csrfToken) await fetchCsrf();
  try {
    return await send(method, path, { ...opts, csrf: csrfToken });
  } catch (err) {
    if (err instanceof ApiError && err.status === 403 && !opts._retried) {
      await fetchCsrf();
      return mutate(method, path, { ...opts, _retried: true });
    }
    throw err;
  }
}

// Upload uses XMLHttpRequest because fetch cannot report upload progress.
function uploadWithProgress(path, form, onProgress) {
  if (config.apiMode === 'mock') {
    return (async () => {
      const m = await mock();
      const res = await m.handleUpload({ path, form, csrf: csrfToken, onProgress });
      if (res.status >= 400) throw toError(res.status, res.body);
      return res.body;
    })();
  }
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', config.apiBase + path);
    xhr.withCredentials = true;
    xhr.timeout = 60000;
    xhr.setRequestHeader('Accept', 'application/json');
    if (csrfToken) xhr.setRequestHeader('X-CSRF-Token', csrfToken);
    xhr.upload.onprogress = (e) => { if (e.lengthComputable && onProgress) onProgress(e.loaded / e.total); };
    xhr.onload = () => {
      let body = null;
      try { body = JSON.parse(xhr.responseText); } catch { /* not JSON */ }
      if (xhr.status >= 200 && xhr.status < 300) resolve(body);
      else reject(toError(xhr.status, body));
    };
    xhr.onerror = () => reject(new ApiError(0, 'network', 'Could not reach the server.'));
    xhr.ontimeout = () => reject(new ApiError(0, 'timeout', 'The upload took too long.'));
    xhr.send(form);
  });
}

async function upload(path, form, onProgress, retried = false) {
  if (!csrfToken) await fetchCsrf();
  try {
    return await uploadWithProgress(path, form, onProgress);
  } catch (err) {
    if (err instanceof ApiError && err.status === 403 && !retried) {
      await fetchCsrf();
      return upload(path, form, onProgress, true);
    }
    throw err;
  }
}

export const api = {
  mode: config.apiMode,

  products: {
    list: (query = {}) => send('GET', '/products', { query }),
    get: (slug) => send('GET', `/products/${encodeURIComponent(slug)}`),
  },
  categories: {
    list: () => send('GET', '/categories'),
  },

  admin: {
    csrf: fetchCsrf,
    login: async (email, password) => {
      const body = await mutate('POST', '/admin/login', { json: { email, password } });
      await fetchCsrf(); // session id changes at login, so get a fresh token
      return body;
    },
    me: () => send('GET', '/admin/me'),
    logout: async () => {
      await mutate('POST', '/admin/logout');
      csrfToken = null;
    },
    products: {
      list: (query = {}) => send('GET', '/admin/products', { query }),
      // Every page, for screens that count and filter in the browser. The catalogue is small.
      all: async () => {
        const data = [];
        for (let page = 1; ; page++) {
          const res = await send('GET', '/admin/products', { query: { page, per_page: 50 } });
          data.push(...(res?.data || []));
          if (page >= (res?.meta?.total_pages || 0)) return { data };
        }
      },
      get: (id) => send('GET', `/admin/products/${id}`),
      create: (input) => mutate('POST', '/admin/products', { json: input }),
      update: (id, input) => mutate('PATCH', `/admin/products/${id}`, { json: input }),
      setStatus: (id, status) => mutate('POST', `/admin/products/${id}/status`, { json: { status } }),
    },
    categories: {
      list: () => send('GET', '/admin/categories'),
      create: (input) => mutate('POST', '/admin/categories', { json: input }),
      update: (id, input) => mutate('PATCH', `/admin/categories/${id}`, { json: input }),
    },
    images: {
      upload: ({ product_id, file, alt_text }, onProgress) => {
        const form = new FormData();
        form.append('product_id', String(product_id));
        form.append('file', file);
        if (alt_text) form.append('alt_text', alt_text);
        return upload('/admin/images', form, onProgress);
      },
      update: (id, altText) => mutate('PATCH', `/admin/images/${id}`, { json: { alt_text: altText } }),
      remove: (id) => mutate('DELETE', `/admin/images/${id}`),
      // Send every current image id once; the first becomes the main photo. 409 = gallery changed, reload.
      reorder: (productId, imageIds) => mutate('PUT', `/admin/products/${productId}/images/order`, { json: { image_ids: imageIds } }),
    },
  },
};

// Plain-words message for any error, used by every page.
export function describeError(err) {
  const status = err instanceof ApiError ? err.status : -1;
  switch (true) {
    case err?.code === 'offline':
      return { title: 'You’re offline', message: 'Check your internet connection and try again.', retry: true };
    case err?.code === 'timeout':
      return { title: 'That took too long', message: 'The server is slow right now. Please try again.', retry: true };
    case status === 0:
      return { title: 'Can’t reach the server', message: 'Please check your connection and try again.', retry: true };
    case status === 401:
      return { title: 'Please sign in', message: 'Your session has ended. Sign in again to continue.', retry: false };
    case status === 403:
      return { title: 'Not allowed', message: 'You don’t have permission for this, or the page is out of date. Reload and try again.', retry: false };
    case status === 404:
      return { title: 'Not found', message: err.message || 'We couldn’t find that.', retry: false };
    case status === 409:
      return { title: 'That clashes with a change', message: err.message || 'Reload the page and try again.', retry: false };
    case status === 413:
      return { title: 'File too large', message: 'Choose an image under 5 MB.', retry: false };
    case status === 422:
      return { title: 'Please check the form', message: err.message || 'Some fields need attention.', retry: false };
    case status === 429:
      return { title: 'Too many tries', message: 'Please wait a minute before trying again.', retry: true };
    case status >= 500:
      return { title: 'Something went wrong on our side', message: 'Please try again in a moment.', retry: true };
    default:
      return { title: 'Something went wrong', message: 'Please try again.', retry: true };
  }
}
