// Shared behaviour for every public page: phone menu, current-page link, reveal on scroll.
import { config } from './config.js';
import { h } from './ui.js';

function initMenu() {
  const btn = document.querySelector('.menu-btn');
  const panel = document.getElementById('menu-panel');
  if (!btn || !panel) return;
  const close = (focusBtn) => {
    btn.setAttribute('aria-expanded', 'false');
    panel.dataset.open = 'false';
    if (focusBtn) btn.focus();
  };
  btn.addEventListener('click', () => {
    const open = btn.getAttribute('aria-expanded') !== 'true';
    btn.setAttribute('aria-expanded', String(open));
    panel.dataset.open = String(open);
    if (open) panel.querySelector('a')?.focus();
  });
  panel.addEventListener('click', (e) => { if (e.target.closest('a')) close(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') close(true); });
  document.addEventListener('click', (e) => {
    if (btn.getAttribute('aria-expanded') === 'true' && !panel.contains(e.target) && !btn.contains(e.target)) close(false);
  });
}

function markCurrent() {
  const page = document.body.dataset.page;
  if (!page) return;
  document.querySelectorAll(`[data-nav="${page}"]`).forEach((a) => a.setAttribute('aria-current', 'page'));
}

let observer = null;
export function observeReveals(root = document) {
  const els = root.querySelectorAll('.reveal:not(.in)');
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    els.forEach((el) => el.classList.add('in'));
    return;
  }
  observer ??= new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('in'); observer.unobserve(en.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  els.forEach((el) => observer.observe(el));
}

function mockBadge() {
  if (config.apiMode !== 'mock') return;
  document.body.append(h('p', {
    class: 'mock-badge',
    style: { position: 'fixed', right: '12px', bottom: 'calc(env(safe-area-inset-bottom,0px) + 12px)', zIndex: 80, margin: 0, background: '#2B1510', color: '#FBF4E6', fontSize: '12px', fontWeight: 600, padding: '5px 10px 3px', borderRadius: '999px', opacity: '.85', pointerEvents: 'none' },
  }, 'Sample data (mock API)'));
}

document.documentElement.classList.add('js-reveal');
initMenu();
markCurrent();
observeReveals();
mockBadge();
document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = String(new Date().getFullYear()); });
