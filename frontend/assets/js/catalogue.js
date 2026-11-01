// Catalogue: GET /products with category, q and page, kept in the address bar so it can be shared.
import { api, describeError } from './api-client.js';
import { config } from './config.js';
import { h, stateBlock } from './ui.js';
import { productCard, skeletonCards } from './cards.js';
import { observeReveals } from './site.js';

const grid = document.getElementById('grid');
const chips = document.getElementById('chips');
const count = document.getElementById('count');
const pager = document.getElementById('pager');
const form = document.getElementById('search-form');
const input = document.getElementById('q');
const clearBtn = document.getElementById('q-clear');
const title = document.getElementById('page-title');
const catIntro = document.getElementById('cat-intro');

let categories = [];
let requestNo = 0;
let state = readUrl();

function readUrl() {
  const qs = new URLSearchParams(location.search);
  return {
    category: qs.get('category') || '',
    q: (qs.get('q') || '').slice(0, 100),
    page: Math.max(1, parseInt(qs.get('page'), 10) || 1),
  };
}

function writeUrl(push) {
  const qs = new URLSearchParams();
  if (state.category) qs.set('category', state.category);
  if (state.q) qs.set('q', state.q);
  if (state.page > 1) qs.set('page', String(state.page));
  const url = `${location.pathname}${qs.toString() ? `?${qs}` : ''}`;
  history[push ? 'pushState' : 'replaceState'](null, '', url);
}

function currentCategory() {
  return categories.find((c) => c.slug === state.category) || null;
}

function renderHeading() {
  const cat = currentCategory();
  title.textContent = cat ? cat.name : 'Our products';
  document.title = `${cat ? cat.name : 'Products'} · Spice Mama`;
  catIntro.hidden = !cat?.description;
  catIntro.textContent = cat?.description || '';
}

function renderChips() {
  chips.classList.remove('is-skel');
  chips.replaceChildren();
  if (!categories.length) { chips.hidden = true; return; }
  const all = [{ slug: '', name: 'All' }, ...categories];
  all.forEach((c) => {
    const b = h('button', { class: 'chip', type: 'button', 'aria-pressed': String(c.slug === state.category) }, c.name);
    b.addEventListener('click', () => {
      if (state.category === c.slug) return;
      state = { ...state, category: c.slug, page: 1 };
      writeUrl(true);
      sync();
      load();
    });
    chips.append(b);
  });
}

function sync() {
  input.value = state.q;
  clearBtn.hidden = !state.q;
  chips.querySelectorAll('.chip').forEach((b, i) => {
    const slug = i === 0 ? '' : categories[i - 1]?.slug;
    b.setAttribute('aria-pressed', String(slug === state.category));
  });
  renderHeading();
}

function renderPager(meta) {
  const pages = meta?.total_pages || 1;
  pager.replaceChildren();
  pager.hidden = pages <= 1;
  if (pages <= 1) return;
  const go = (p) => {
    state = { ...state, page: p };
    writeUrl(true);
    load(true);
  };
  const btn = (label, p, aria) => {
    const b = h('button', { type: 'button', 'aria-label': aria || `Page ${p}`, disabled: p < 1 || p > pages }, label);
    b.addEventListener('click', () => go(p));
    return b;
  };
  pager.append(btn('‹', state.page - 1, 'Previous page'));
  const shown = new Set([1, pages, state.page - 1, state.page, state.page + 1].filter((p) => p >= 1 && p <= pages));
  let prev = 0;
  [...shown].sort((a, b) => a - b).forEach((p) => {
    if (p - prev > 1) pager.append(h('span', { class: 'gap', 'aria-hidden': 'true' }, '…'));
    pager.append(p === state.page ? h('span', { class: 'cur', 'aria-current': 'page' }, String(p)) : btn(String(p), p));
    prev = p;
  });
  pager.append(btn('›', state.page + 1, 'Next page'));
}

function clearFilters() {
  state = { category: '', q: '', page: 1 };
  writeUrl(true);
  sync();
  load();
}

async function load(scroll = false) {
  const my = ++requestNo;
  grid.setAttribute('aria-busy', 'true');
  grid.replaceChildren(...skeletonCards(Math.min(config.catalogPageSize, 6)));
  count.textContent = 'Loading products…';
  pager.hidden = true;
  if (scroll) document.querySelector('.toolbar').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });

  try {
    const res = await api.products.list({ category: state.category, q: state.q, page: state.page, per_page: config.catalogPageSize });
    if (my !== requestNo) return; // a newer search started; drop this answer
    const list = res?.data || [];
    const meta = res?.meta || { page: 1, total: list.length, total_pages: 1 };

    if (!list.length && state.page > 1 && meta.total > 0) {
      // Asked for a page past the end (old link): go to the last real page.
      state = { ...state, page: meta.total_pages };
      writeUrl(false);
      return load();
    }

    grid.setAttribute('aria-busy', 'false');
    if (!list.length) {
      const filtered = state.q || state.category;
      grid.replaceChildren(stateBlock(filtered
        ? { title: state.q ? `Nothing matches “${state.q}”` : 'No products here yet', message: 'Try another word or category, or see everything we make.', actions: [h('button', { class: 'btn btn-red', type: 'button', onclick: clearFilters }, 'Show all products')] }
        : { title: 'New packs are on their way', message: 'Our products will appear here soon. Call or email us to ask about our spices.', actions: [h('a', { class: 'btn btn-red', href: '/contact.html' }, 'Contact us')] }));
      grid.firstChild.style.gridColumn = '1 / -1';
      count.textContent = filtered ? 'No products found.' : '';
      return;
    }

    grid.replaceChildren(...list.map((p, i) => productCard(p, { headingLevel: 2, eager: i < 4 })));
    observeReveals(grid);
    const from = (meta.page - 1) * (meta.per_page || config.catalogPageSize) + 1;
    count.textContent = meta.total_pages > 1
      ? `Showing ${from}–${from + list.length - 1} of ${meta.total} products`
      : `${meta.total} ${meta.total === 1 ? 'product' : 'products'}`;
    renderPager(meta);
  } catch (err) {
    if (my !== requestNo) return;
    const e = describeError(err);
    grid.setAttribute('aria-busy', 'false');
    const retry = h('button', { class: 'btn btn-red', type: 'button' }, 'Try again');
    retry.addEventListener('click', () => load());
    grid.replaceChildren(stateBlock({ title: e.title, message: e.message, kind: 'error', actions: e.retry ? [retry] : [] }));
    grid.firstChild.style.gridColumn = '1 / -1';
    count.textContent = '';
  }
}

// Search: update as the visitor types (short pause), and on submit.
let typing;
input.addEventListener('input', () => {
  clearBtn.hidden = !input.value;
  clearTimeout(typing);
  typing = setTimeout(() => {
    const q = input.value.trim().slice(0, 100);
    if (q === state.q) return;
    state = { ...state, q, page: 1 };
    writeUrl(false);
    load();
  }, 350);
});
form.addEventListener('submit', (e) => {
  e.preventDefault();
  clearTimeout(typing);
  state = { ...state, q: input.value.trim().slice(0, 100), page: 1 };
  writeUrl(true);
  load();
  input.blur();
});
clearBtn.addEventListener('click', () => {
  input.value = '';
  state = { ...state, q: '', page: 1 };
  writeUrl(true);
  sync();
  load();
  input.focus();
});
addEventListener('popstate', () => { state = readUrl(); sync(); load(); });

async function loadCategories() {
  try {
    const res = await api.categories.list();
    categories = res?.data || [];
  } catch {
    categories = []; // filters are optional; the product list still works
  }
  renderChips();
  sync();
}

sync();
loadCategories();
load();
