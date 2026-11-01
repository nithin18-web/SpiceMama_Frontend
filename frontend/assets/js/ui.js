// Small DOM helpers. Everything from the API is set as text, never as HTML.
import { config } from './config.js';

export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k === 'vars') for (const [p, val] of Object.entries(v)) el.style.setProperty(p, val);
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (v === true) el.setAttribute(k, '');
    else el.setAttribute(k, String(v));
  }
  append(el, children);
  return el;
}

function append(el, children) {
  for (const c of children.flat(Infinity)) {
    if (c === null || c === undefined || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
}

// Inline SVG icons (static markup we own, safe to build from strings).
const ICONS = {
  phone: '<path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z" fill="currentColor"/>',
  mail: '<path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h15A1.5 1.5 0 0 1 21 6.5v11a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5z" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="m4 7 8 6 8-6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
  whatsapp: '<path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M8.8 8.3c.2-.4.4-.4.7-.4h.5c.2 0 .4 0 .6.5l.7 1.7c0 .2 0 .3-.1.5l-.5.6c-.1.1-.2.3 0 .5a6 6 0 0 0 2.9 2.5c.2.1.4.1.5-.1l.7-.8c.2-.2.3-.2.5-.1l1.6.8c.2.1.4.2.4.3 0 .2 0 1-.5 1.5-.4.5-1.3.9-2 .9-.8 0-2.6-.5-4.3-2.1-1.8-1.7-2.4-3.5-2.5-4.2 0-.7.3-1.4.8-2.1z" fill="currentColor"/>',
  pin: '<path d="M12 21s-7-6.1-7-11.5a7 7 0 0 1 14 0C19 14.9 12 21 12 21z" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="9.5" r="2.5" fill="currentColor"/>',
  arrow: '<path d="M5 12h14m-6-6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
};
export function icon(name) {
  const span = document.createElement('span');
  span.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${ICONS[name] || ''}</svg>`;
  return span.firstChild;
}

// ---------- contact links ----------
const b = config.business;
export const links = {
  tel: () => `tel:${b.phone}`,
  mail: (subject = '', body = '') => {
    const qs = new URLSearchParams();
    if (subject) qs.set('subject', subject);
    if (body) qs.set('body', body);
    const s = qs.toString().replace(/\+/g, '%20');
    return `mailto:${b.email}${s ? `?${s}` : ''}`;
  },
  whatsapp: (text = '') => (b.whatsapp ? `https://wa.me/${b.whatsapp.replace(/\D/g, '')}${text ? `?text=${encodeURIComponent(text)}` : ''}` : ''),
  product: (slug) => `/product.html?slug=${encodeURIComponent(slug)}`,
};

// ---------- toasts ----------
let toastBox = null;
export function toast(message, kind = '') {
  if (!toastBox) {
    toastBox = h('div', { class: 'toasts', role: 'status', 'aria-live': 'polite' });
    document.body.append(toastBox);
  }
  const t = h('div', { class: `toast ${kind}` }, message);
  toastBox.append(t);
  setTimeout(() => t.remove(), 4200);
}

// ---------- shared state blocks ----------
export function stateBlock({ title, message, kind = '', actions = [], headingLevel = 2 }) {
  return h('div', { class: `state ${kind ? `state-${kind}` : ''}`, role: kind === 'error' ? 'alert' : null },
    h(`h${headingLevel}`, {}, title),
    message ? h('p', {}, message) : null,
    actions.length ? h('div', { class: 'actions' }, actions) : null);
}

export function setBusy(el, busy) {
  if (busy) el.setAttribute('aria-busy', 'true');
  else el.removeAttribute('aria-busy');
}

export function slugify(s) {
  return String(s).toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 200);
}
