// Admin product list: filter by status, search, publish / unpublish / archive.
import { api } from '../api-client.js';
import { h, toast } from '../ui.js';
import { primaryImage } from '../product-look.js';
import { requireAdmin, reportError, statusBadge, busy, confirmDialog, publishProblems, publishMessage, publishFailure } from './admin-core.js';

await requireAdmin();

const listBox = document.getElementById('list');
const alertBox = document.getElementById('list-alert');
const liveStatus = document.getElementById('list-status');
const q = document.getElementById('filter-q');
const tabs = [...document.querySelectorAll('#status-tabs button')];

let products = [];
let categories = new Map();
let filter = { status: new URLSearchParams(location.search).get('status') || '', q: '' };

function actionsFor(p) {
  const acts = [];
  const go = (status, label, confirm) => {
    const b = h('button', { class: `btn btn-sm ${status === 'published' ? 'btn-green' : 'btn-line'}`, type: 'button' }, label);
    b.addEventListener('click', async () => {
      if (status === 'published') {
        const problems = publishProblems(p, categories.get(p.category_id));
        if (problems.length) return toast(`${p.name}: ${publishMessage(problems)}`, 'bad');
      }
      if (confirm && !(await confirmDialog(confirm))) return;
      busy(b, true, 'Saving…');
      try {
        const res = await api.admin.products.setStatus(p.id, status);
        Object.assign(p, res?.data || { status });
        toast(`${p.name}: ${status === 'published' ? 'now on the website' : status === 'draft' ? 'moved to drafts' : 'archived'}.`, 'ok');
        render();
      } catch (err) {
        busy(b, false);
        const why = publishFailure(err);
        if (why) toast(why, 'bad'); else reportError(err);
      }
    });
    return b;
  };
  if (p.status !== 'published') {
    acts.push(go('published', 'Publish'));
  }
  if (p.status === 'published') acts.push(go('draft', 'Unpublish', { title: `Unpublish ${p.name}?`, message: 'It will be hidden from the website straight away. You can publish it again any time.', confirmLabel: 'Unpublish', danger: true }));
  if (p.status !== 'archived') acts.push(go('archived', 'Archive', { title: `Archive ${p.name}?`, message: 'Archived products are hidden from the website and moved out of your main list.', confirmLabel: 'Archive', danger: true }));
  if (p.status === 'archived') acts.push(go('draft', 'Restore to drafts'));
  acts.push(h('a', { class: 'btn btn-sm btn-line', href: `/admin/product-edit.html?id=${p.id}` }, 'Edit'));
  return acts;
}

function render() {
  const counts = { '': products.length, published: 0, draft: 0, archived: 0 };
  products.forEach((p) => { counts[p.status] += 1; });
  document.querySelectorAll('[data-n]').forEach((el) => { el.textContent = String(counts[el.dataset.n] ?? 0); });
  tabs.forEach((t) => t.setAttribute('aria-pressed', String(t.dataset.status === filter.status)));

  const term = filter.q.toLowerCase();
  const shown = products.filter((p) => (!filter.status || p.status === filter.status) && (!term || p.name.toLowerCase().includes(term) || p.slug.includes(term)));
  listBox.setAttribute('aria-busy', 'false');
  liveStatus.textContent = `${shown.length} ${shown.length === 1 ? 'product' : 'products'} shown.`;

  if (!products.length) {
    listBox.replaceChildren(h('div', { class: 'list-empty' }, h('p', {}, 'No products yet.'), h('a', { class: 'btn btn-red btn-sm', href: '/admin/product-edit.html' }, 'Add your first product')));
    return;
  }
  if (!shown.length) {
    listBox.replaceChildren(h('p', { class: 'list-empty' }, 'No products match. Try another status or search.'));
    return;
  }
  listBox.replaceChildren(h('table', { class: 'list' },
    h('thead', {}, h('tr', {}, h('th', {}, h('span', { class: 'sr' }, 'Photo')), h('th', {}, 'Product'), h('th', {}, 'Category'), h('th', {}, 'Status'), h('th', {}, h('span', { class: 'sr' }, 'Actions')))),
    h('tbody', {}, shown.map((p) => {
      const im = primaryImage(p);
      return h('tr', {},
        h('td', { class: 'c-thumb' }, h('div', { class: 'thumb' }, im ? h('img', { src: im.url, alt: '', loading: 'lazy' }) : h('span', { class: 'none' }, 'No photo'))),
        h('td', { class: 'name' }, h('a', { href: `/admin/product-edit.html?id=${p.id}` }, p.name), h('small', {}, [p.pack_size_label, `/${p.slug}`].filter(Boolean).join(' · '))),
        h('td', { 'data-label': 'Category' }, categories.get(p.category_id)?.name || '—'),
        h('td', { 'data-label': 'Status' }, statusBadge(p.status)),
        h('td', {}, h('div', { class: 'acts' }, actionsFor(p))));
    }))));
}

tabs.forEach((t) => t.addEventListener('click', () => {
  filter.status = t.dataset.status;
  const url = new URL(location.href);
  if (filter.status) url.searchParams.set('status', filter.status); else url.searchParams.delete('status');
  history.replaceState(null, '', url);
  render();
}));
q.addEventListener('input', () => { filter.q = q.value.trim(); render(); });

try {
  const [prod, cats] = await Promise.all([api.admin.products.all(), api.admin.categories.list()]);
  products = prod?.data || [];
  categories = new Map((cats?.data || []).map((c) => [c.id, c]));
  render();
} catch (err) {
  listBox.setAttribute('aria-busy', 'false');
  listBox.replaceChildren(h('p', { class: 'list-empty' }, 'Couldn’t load products.'));
  reportError(err, alertBox);
}
