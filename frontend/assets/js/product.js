// Product detail: reads ?slug=, loads GET /products/{slug}, then a few more from the same category.
import { api, ApiError, describeError } from './api-client.js';
import { config } from './config.js';
import { h, icon, links, stateBlock } from './ui.js';
import { lookFor } from './product-look.js';
import { productCard } from './cards.js';
import { observeReveals } from './site.js';

const box = document.getElementById('product');
const crumbs = document.getElementById('crumbs');
const status = document.getElementById('pd-status');
const related = document.getElementById('related');
const relatedGrid = document.getElementById('related-grid');
const relatedTitle = document.getElementById('related-title');

const slug = (new URLSearchParams(location.search).get('slug') || '').trim();

function setMeta(name, content) {
  document.querySelector(`meta[name="${name}"]`)?.setAttribute('content', content);
  document.querySelector(`meta[property="og:${name}"]`)?.setAttribute('content', content);
}

function gallery(p, look) {
  const imgs = [...(p.images || [])].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const stagebox = h('div', { class: 'stagebox', vars: { '--c': look.c, '--cf': look.f } });
  const show = (im) => {
    stagebox.replaceChildren(im
      ? h('img', { src: im.url, alt: im.alt_text || p.name, decoding: 'async', fetchpriority: 'high' })
      : h('p', { class: 'noimg' }, 'Photo to come'));
  };
  show(imgs[0]);
  const wrap = h('div', { class: 'gallery' }, stagebox);
  if (imgs.length > 1) {
    const thumbs = h('div', { class: 'thumbs', role: 'group', 'aria-label': 'Product photos' });
    imgs.forEach((im, i) => {
      const b = h('button', { type: 'button', 'aria-current': String(i === 0), 'aria-label': `Photo ${i + 1} of ${imgs.length}` },
        h('img', { src: im.url, alt: '', loading: 'lazy' }));
      b.addEventListener('click', () => {
        thumbs.querySelectorAll('button').forEach((x) => x.setAttribute('aria-current', String(x === b)));
        show(im);
      });
      thumbs.append(b);
    });
    wrap.append(thumbs);
  }
  return wrap;
}

function askBlock(p) {
  const subject = `About ${p.name}`;
  const body = `Hello Spice Mama team,\n\nI'd like to know more about ${p.name}${p.pack_size_label ? ` (${p.pack_size_label})` : ''}.\n\n`;
  const wa = links.whatsapp(`Hello, I'd like to know more about ${p.name}.`);
  return h('div', { class: 'ask' },
    h('h2', {}, 'Ask about this product'),
    h('p', {}, 'Where to buy, pack sizes or bulk orders: call or email us and we’ll help.'),
    h('div', { class: 'actions-row' },
      h('a', { class: 'btn btn-red', href: links.tel() }, icon('phone'), `Call ${config.business.phoneDisplay}`),
      wa ? h('a', { class: 'btn btn-green', href: wa, target: '_blank', rel: 'noopener' }, icon('whatsapp'), 'WhatsApp') : null,
      h('a', { class: 'btn btn-line', href: links.mail(subject, body) }, icon('mail'), 'Email us')));
}

function render(p, category) {
  const look = lookFor(p);
  const info = h('div', { class: 'pd-info' },
    look.line ? h('p', { class: 'maker' }, look.line) : null,
    h('h1', {}, p.name),
    p.short_description ? h('p', { class: 'short' }, p.short_description) : null,
    h('div', { class: 'pills' },
      p.pack_size_label ? h('span', { class: 'pill' }, p.pack_size_label) : null,
      category ? h('a', { class: 'pill soft', href: `/products.html?category=${encodeURIComponent(category.slug)}`, style: { textDecoration: 'none' } }, category.name) : null),
    p.description && p.description !== p.short_description ? [h('h2', {}, 'About this pack'), h('p', { class: 'desc' }, p.description)] : null,
    p.ingredients ? [h('h2', {}, 'Ingredients'), h('p', {}, p.ingredients)] : null,
    askBlock(p));
  box.replaceChildren(h('div', { class: 'pd' }, gallery(p, look), info));
  box.setAttribute('aria-busy', 'false');

  crumbs.replaceChildren(
    h('li', {}, h('a', { href: '/' }, 'Home')),
    h('li', {}, h('a', { href: '/products.html' }, 'Products')),
    category ? h('li', {}, h('a', { href: `/products.html?category=${encodeURIComponent(category.slug)}` }, category.name)) : null,
    h('li', {}, h('span', { 'aria-current': 'page' }, p.name)));

  document.title = `${p.name} · Spice Mama`;
  setMeta('description', p.short_description || `${p.name} from Spice Mama, made in Guntur.`);
  document.querySelector('meta[property="og:title"]')?.setAttribute('content', `${p.name} · Spice Mama`);
  if (p.images?.[0]) document.querySelector('meta[property="og:image"]')?.setAttribute('content', p.images[0].url);
  status.textContent = `${p.name} loaded.`;
}

async function loadRelated(p, category) {
  try {
    const res = await api.products.list(category ? { category: category.slug, per_page: 5 } : { per_page: 5 });
    let list = (res?.data || []).filter((x) => x.slug !== p.slug);
    if (list.length < 2 && category) {
      const more = await api.products.list({ per_page: 6 });
      list = [...list, ...(more?.data || []).filter((x) => x.slug !== p.slug && !list.some((y) => y.slug === x.slug))];
    } else if (category) {
      relatedTitle.textContent = `More ${category.name.toLowerCase()}`;
    }
    list = list.slice(0, 4);
    if (!list.length) return;
    relatedGrid.replaceChildren(...list.map((x) => productCard(x)));
    related.hidden = false;
    observeReveals(relatedGrid);
  } catch { /* extra suggestions only; stay hidden on failure */ }
}

function notFound() {
  document.title = 'Product not found · Spice Mama';
  box.setAttribute('aria-busy', 'false');
  box.replaceChildren(stateBlock({
    title: 'We couldn’t find that product',
    message: 'It may have been renamed or is no longer shown. Have a look at the full range.',
    headingLevel: 1,
    actions: [h('a', { class: 'btn btn-red', href: '/products.html' }, 'See all products'), h('a', { class: 'btn btn-line', href: '/contact.html' }, 'Ask us')],
  }));
  status.textContent = 'Product not found.';
}

async function load() {
  if (!slug) return notFound();
  try {
    const [res, cats] = await Promise.all([
      api.products.get(slug),
      api.categories.list().catch(() => ({ data: [] })),
    ]);
    const p = res?.data;
    if (!p) return notFound();
    const category = (cats?.data || []).find((c) => c.id === p.category_id) || null;
    render(p, category);
    loadRelated(p, category);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return notFound();
    const e = describeError(err);
    const retry = h('button', { class: 'btn btn-red', type: 'button' }, 'Try again');
    retry.addEventListener('click', () => location.reload());
    box.setAttribute('aria-busy', 'false');
    box.replaceChildren(stateBlock({ title: e.title, message: e.message, kind: 'error', headingLevel: 1, actions: e.retry ? [retry] : [] }));
    status.textContent = e.title;
  }
}

load();
