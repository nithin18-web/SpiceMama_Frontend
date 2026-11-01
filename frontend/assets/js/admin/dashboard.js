import { api } from '../api-client.js';
import { h } from '../ui.js';
import { requireAdmin, reportError, statusBadge } from './admin-core.js';

await requireAdmin();

const alertBox = document.getElementById('dash-alert');
const drafts = document.getElementById('drafts');

try {
  const [prod, cats] = await Promise.all([api.admin.products.list(), api.admin.categories.list()]);
  const list = prod?.data || [];
  const counts = { published: 0, draft: 0, archived: 0 };
  list.forEach((p) => { counts[p.status] = (counts[p.status] || 0) + 1; });
  counts.categories = (cats?.data || []).length;
  for (const [k, v] of Object.entries(counts)) {
    const el = document.querySelector(`[data-stat="${k}"]`);
    if (el) el.textContent = String(v);
  }
  document.getElementById('stats').setAttribute('aria-busy', 'false');

  const waiting = list.filter((p) => p.status === 'draft');
  drafts.replaceChildren(waiting.length
    ? h('table', { class: 'list' },
      h('thead', {}, h('tr', {}, h('th', {}, 'Product'), h('th', {}, 'Status'), h('th', {}, 'Photos'))),
      h('tbody', {}, waiting.map((p) => h('tr', {},
        h('td', { class: 'name' }, h('a', { href: `/admin/product-edit.html?id=${p.id}` }, p.name)),
        h('td', { 'data-label': 'Status' }, statusBadge(p.status)),
        h('td', { 'data-label': 'Photos' }, String(p.images?.length || 0))))))
    : h('p', { class: 'list-empty' }, 'No drafts. Everything is either published or archived.'));
} catch (err) {
  reportError(err, alertBox);
  drafts.replaceChildren(h('p', { class: 'list-empty' }, 'Couldn’t load this right now.'));
}
