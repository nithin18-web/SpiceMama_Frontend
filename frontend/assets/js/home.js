// Home page: loads the range from the API and runs the design's scroll scenes.
import { api, describeError } from './api-client.js';
import { h, icon, links } from './ui.js';
import { lookFor, primaryImage } from './product-look.js';
import { initStockist } from './stockist.js';

const HOME_LIMIT = 12;

const root = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const tallEnough = matchMedia('(min-height: 480px)');
const narrow = matchMedia('(max-width: 899px)');

const hero = document.getElementById('hero');
const stage = hero.querySelector('.stage');
const pouch = hero.querySelector('.pouch');
const copy = hero.querySelector('.hero-copy');
const tag = hero.querySelector('.te-tag');
const origin = hero.querySelector('.origin');
const range = document.getElementById('range');
const track = document.getElementById('track');
const pnum = document.getElementById('pnum');
const ptotal = document.getElementById('ptotal');
const rangeStatus = document.getElementById('range-status');
const dishes = [...document.querySelectorAll('.dish img')];
const labels = [...document.querySelectorAll('.label .crop img')];
const posters = document.querySelectorAll('.posters img');

let cards = [];
let VH = innerHeight;
let lastW = innerWidth;
let dist = 0;
let active = -1;
let ticking = false;
let c1 = 0;

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const seg = (p, a, b) => clamp((p - a) / (b - a), 0, 1);
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
// Where on screen the "current" card sits: centre, sliding to the last card near the end.
const target = (q, w) => w * 0.5 + Math.max(0, c1 - w * 0.5) * seg(q, 0.8, 1);
const motionOn = () => root.classList.contains('motion');

// ---------- range cards ----------
function productCard(p, i = 0) {
  const look = lookFor(p);
  const im = primaryImage(p);
  return h('article', { class: 'card', id: `p-${p.slug}`, dataset: { c: look.c, f: look.f }, vars: { '--c': look.c, '--cf': look.f } },
    im
      // First packs load straight away so the shelf isn't blank as it scrolls into view.
      ? h('img', { src: im.url, alt: im.alt_text || p.name, loading: i < 4 ? 'eager' : 'lazy', decoding: 'async' })
      : h('div', { class: 'noimg ph', style: { height: '40vh', display: 'grid', placeItems: 'center', width: '100%' } }, 'Photo to come'),
    look.line ? h('p', { class: 'maker' }, look.line) : h('p', { class: 'maker' }, ''),
    h('h3', {}, h('a', { href: links.product(p.slug) }, p.name)),
    p.short_description ? h('p', {}, p.short_description) : null,
    p.pack_size_label ? h('span', { class: 'size' }, p.pack_size_label) : null,
    h('span', { class: 'go', 'aria-hidden': 'true' }, 'View product', icon('arrow')));
}

function endCard(total) {
  return h('div', { class: 'card end' },
    h('h3', {}, `${total} products in all`),
    h('a', { class: 'btn btn-ivory', href: '/products.html' }, 'See them all', icon('arrow')));
}

function stateCard(title, message, actions) {
  return h('div', { class: 'card state-card', role: 'alert' }, h('h3', {}, title), h('p', {}, message), h('div', { class: 'actions-row' }, actions));
}

function clearCards() {
  track.querySelectorAll('.card').forEach((c) => c.remove());
}

async function loadRange() {
  try {
    const res = await api.products.list({ per_page: HOME_LIMIT, page: 1 });
    const list = res?.data || [];
    const total = res?.meta?.total ?? list.length;
    clearCards();
    if (!list.length) {
      track.append(stateCard('New packs are on their way', 'The range will appear here soon. In the meantime, call or email us to ask about our spices.',
        [h('a', { class: 'btn btn-ivory', href: '/contact.html' }, 'Contact us')]));
      rangeStatus.textContent = 'No products to show yet.';
      ptotal.textContent = '0';
    } else {
      list.forEach((p, i) => track.append(productCard(p, i)));
      if (total > list.length) track.append(endCard(total));
      ptotal.textContent = String(list.length);
      rangeStatus.textContent = `Showing ${list.length} of ${total} products.`;
    }
  } catch (err) {
    const e = describeError(err);
    clearCards();
    const retry = h('button', { class: 'btn btn-ivory', type: 'button' }, 'Try again');
    retry.addEventListener('click', () => {
      clearCards();
      track.append(h('div', { class: 'card is-skel', 'aria-hidden': 'true' }, h('div', { class: 'skel' })));
      rangeStatus.textContent = 'Loading the range…';
      loadRange();
    });
    track.append(stateCard(e.title, 'We couldn’t load the range right now. ' + e.message, [retry]));
    rangeStatus.textContent = e.title;
  }
  cards = [...track.querySelectorAll('.card:not(.is-skel)')];
  track.querySelectorAll('img').forEach((im) => { if (!im.complete) im.addEventListener('load', () => { layout(); onScroll(); }, { once: true }); });
  active = -1;
  if (!motionOn()) cards.forEach((c) => c.classList.add('on'));
  layout();
  update();
}

// ---------- scroll scenes ----------
function setMode() {
  root.classList.toggle('motion', tallEnough.matches && !reduce.matches);
  if (!motionOn()) {
    [stage, pouch, copy, tag, origin, track, range].forEach((el) => el.removeAttribute('style'));
    hero.style.removeProperty('--seam');
    cards.forEach((c) => c.classList.add('on'));
    setActive(0, true);
  } else {
    cards.forEach((c) => c.classList.remove('on'));
    active = -1;
  }
  layout();
  update();
}

function layout() {
  if (!motionOn()) return;
  dist = Math.max(0, track.scrollWidth - innerWidth);
  range.style.height = `${VH + dist}px`;
  const last = cards[cards.length - 1];
  c1 = last ? last.offsetLeft + last.offsetWidth / 2 - dist : innerWidth / 2;
}

function setActive(i, force) {
  if (i === active && !force) return;
  active = i;
  const c = cards[i];
  if (!c) return;
  if (motionOn()) {
    if (c.dataset.c) {
      range.style.setProperty('--bg', c.dataset.c);
      range.style.setProperty('--fg', c.dataset.f);
    }
    cards.forEach((k, j) => k.classList.toggle('on', j === i));
  }
  const productCards = cards.filter((k) => k.dataset.c);
  pnum.textContent = String(Math.min(i + 1, productCards.length || 1));
}

function update() {
  ticking = false;
  if (!motionOn()) return;
  const vh = VH;
  const w = innerWidth;
  const mob = narrow.matches;

  // Hero → origin: the red side sweeps across, the pouch moves aside, the story fades in.
  const r = hero.getBoundingClientRect();
  const p = clamp(-r.top / (r.height - vh), 0, 1);
  const a = ease(seg(p, 0.04, 0.42));
  const b = ease(seg(p, 0.40, 0.64));
  hero.style.setProperty('--seam', mob ? `${55 - 55 * a}%` : `${50 - 50 * a}%`);
  copy.style.opacity = String(1 - seg(p, 0, 0.16));
  copy.style.transform = `translateY(${-40 * seg(p, 0, 0.16)}px)`;
  copy.style.visibility = p > 0.17 ? 'hidden' : 'visible';
  tag.style.opacity = String(1 - seg(p, 0.3, 0.45));
  stage.style.setProperty('--hint', String(1 - seg(p, 0, 0.06)));
  if (mob) {
    pouch.style.setProperty('--px', `${w * 0.24 * b}px`);
    pouch.style.setProperty('--py', `${-vh * 0.08 * a + vh * 0.18 * b}px`);
    pouch.style.setProperty('--pr', `${-5 + 5 * a + 6 * b}deg`);
    pouch.style.setProperty('--ps', (1 - 0.04 * a - 0.42 * b).toFixed(3));
  } else {
    pouch.style.setProperty('--px', `${w * 0.24 * b}px`);
    pouch.style.setProperty('--py', '0px');
    pouch.style.setProperty('--pr', `${-5 + 5 * a + 3 * b}deg`);
    pouch.style.setProperty('--ps', (1 - 0.06 * a - 0.08 * b).toFixed(3));
  }
  stage.style.setProperty('--bwo', (1 - 0.86 * seg(p, 0.38, 0.6)).toFixed(3));
  const o = seg(p, 0.46, 0.64);
  origin.style.setProperty('--oo', o.toFixed(3));
  origin.style.setProperty('--oy', `${30 - 30 * o}px`);
  origin.style.setProperty('--opev', p > 0.55 ? 'auto' : 'none');
  origin.style.setProperty('--ovis', o > 0 ? 'visible' : 'hidden');

  // Range: vertical scroll pans the shelf sideways.
  const rr = range.getBoundingClientRect();
  const q = dist ? clamp(-rr.top / dist, 0, 1) : 0;
  const x = q * dist;
  track.style.transform = `translate3d(${-x}px,0,0)`;
  const t = target(q, w);
  let best = 0;
  let bd = Infinity;
  cards.forEach((c, i) => {
    const cx = c.offsetLeft + c.offsetWidth / 2 - x;
    const d = Math.abs(cx - t);
    if (d < bd) { bd = d; best = i; }
  });
  setActive(best);

  // Gentle parallax on recipe photos, posters, and label zoom.
  dishes.forEach((img) => {
    const box = img.parentNode.getBoundingClientRect();
    if (box.bottom < 0 || box.top > vh) return;
    const k = (box.top + box.height / 2 - vh / 2) / vh;
    img.style.setProperty('--par', `${-k * 40 - 20}px`);
  });
  labels.forEach((img) => {
    const box = img.getBoundingClientRect();
    const k = clamp(1 - (box.top - vh * 0.25) / (vh * 0.65), 0, 1);
    img.style.setProperty('--ls', (0.9 + 0.1 * k).toFixed(3));
  });
  if (posters.length === 2) {
    const box = posters[0].parentNode.getBoundingClientRect();
    const k = (box.top + box.height / 2 - vh / 2) / vh;
    posters[0].style.setProperty('--pa', `${k * 50}px`);
    posters[1].style.setProperty('--pb', `${-k * 30}px`);
  }
}

function onScroll() {
  if (!ticking) { ticking = true; requestAnimationFrame(update); }
}

addEventListener('scroll', onScroll, { passive: true });
addEventListener('resize', () => {
  // Phones fire resize when the address bar hides; ignore unless the width really changed.
  const touch = matchMedia('(pointer: coarse)').matches;
  if (touch && innerWidth === lastW) return;
  lastW = innerWidth;
  VH = innerHeight;
  layout();
  onScroll();
});
reduce.addEventListener('change', setMode);
tallEnough.addEventListener('change', setMode);
narrow.addEventListener('change', () => { VH = innerHeight; setMode(); });

// ---------- recipe tabs (arrow keys, Home, End) ----------
const tabs = [...document.querySelectorAll('[role=tab]')];
function selectTab(t, focus) {
  tabs.forEach((x) => {
    const on = x === t;
    x.setAttribute('aria-selected', String(on));
    x.tabIndex = on ? 0 : -1;
    document.getElementById(x.getAttribute('aria-controls')).hidden = !on;
  });
  if (focus) t.focus();
  onScroll();
}
tabs.forEach((t, i) => {
  t.addEventListener('click', () => selectTab(t));
  t.addEventListener('keydown', (e) => {
    const next = { ArrowRight: tabs[(i + 1) % tabs.length], ArrowLeft: tabs[(i - 1 + tabs.length) % tabs.length], Home: tabs[0], End: tabs[tabs.length - 1] }[e.key];
    if (next) { e.preventDefault(); selectTab(next, true); }
  });
});

initStockist(document.getElementById('stockist-card'));

if (document.fonts?.ready) document.fonts.ready.then(() => { layout(); update(); });
addEventListener('load', () => { layout(); update(); });
setMode();
loadRange();
