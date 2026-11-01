// Admin categories: list, add, edit (the contract has no delete; hide a category instead).
import { api } from '../api-client.js';
import { h, toast, slugify } from '../ui.js';
import { requireAdmin, reportError, setFieldErrors, errorSummary, busy } from './admin-core.js';

await requireAdmin();

const box = document.getElementById('cats');
const alertBox = document.getElementById('cat-alert');
const dlg = document.getElementById('cat-dialog');
const form = document.getElementById('cat-form');
const formAlert = document.getElementById('cat-form-alert');
const saveBtn = document.getElementById('cat-save');
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

let categories = [];
let productCounts = new Map();
let editing = null;
let slugTouched = false;

function render() {
  box.setAttribute('aria-busy', 'false');
  if (!categories.length) {
    box.replaceChildren(h('div', { class: 'list-empty' }, h('p', {}, 'No categories yet. Add one before adding products.')));
    return;
  }
  box.replaceChildren(h('table', { class: 'list' },
    h('thead', {}, h('tr', {}, h('th', {}, 'Name'), h('th', {}, 'Products'), h('th', {}, 'Order'), h('th', {}, 'On website'), h('th', {}, h('span', { class: 'sr' }, 'Actions')))),
    h('tbody', {}, categories.map((c) => {
      const edit = h('button', { class: 'btn btn-sm btn-line', type: 'button', 'aria-label': `Edit ${c.name}` }, 'Edit');
      edit.addEventListener('click', () => open(c));
      return h('tr', {},
        h('td', { class: 'name' }, h('a', { href: `/products.html?category=${encodeURIComponent(c.slug)}`, target: '_blank', rel: 'noopener' }, c.name), h('small', {}, c.slug)),
        h('td', { 'data-label': 'Products' }, String(productCounts.get(c.id) || 0)),
        h('td', { 'data-label': 'Order' }, String(c.sort_order ?? 0)),
        h('td', { 'data-label': 'On website' }, h('span', { class: `badge ${c.is_active ? 'active' : 'inactive'}` }, c.is_active ? 'Shown' : 'Hidden')),
        h('td', {}, h('div', { class: 'acts' }, edit)));
    }))));
}

function open(cat) {
  editing = cat;
  slugTouched = Boolean(cat);
  form.reset();
  formAlert.hidden = true;
  setFieldErrors(form, {});
  document.getElementById('cat-dlg-title').textContent = cat ? `Edit ${cat.name}` : 'Add a category';
  form.elements.name.value = cat?.name || '';
  form.elements.slug.value = cat?.slug || '';
  form.elements.description.value = cat?.description || '';
  form.elements.sort_order.value = String(cat?.sort_order ?? 0);
  form.elements.is_active.checked = cat ? Boolean(cat.is_active) : true;
  dlg.showModal();
  form.elements.name.focus();
}

form.elements.name.addEventListener('input', () => { if (!slugTouched) form.elements.slug.value = slugify(form.elements.name.value); });
form.elements.slug.addEventListener('input', () => { slugTouched = true; });
document.getElementById('cat-cancel').addEventListener('click', () => dlg.close());
document.getElementById('add-cat').addEventListener('click', () => open(null));

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = {
    name: form.elements.name.value.trim(),
    slug: slugify(form.elements.slug.value),
    description: form.elements.description.value.trim() || null,
    sort_order: Number.parseInt(form.elements.sort_order.value, 10) || 0,
    is_active: form.elements.is_active.checked,
  };
  const local = {};
  if (!data.name) local.name = 'Enter a category name.';
  if (!data.slug || !SLUG_RE.test(data.slug)) local.slug = 'Use lowercase letters, numbers and dashes only.';
  const entries = setFieldErrors(form, local);
  if (entries.length) return errorSummary(formAlert, 'Please fix these:', entries, form);

  busy(saveBtn, true, 'Saving…');
  try {
    if (editing) {
      const res = await api.admin.categories.update(editing.id, data);
      Object.assign(editing, res?.data || data);
    } else {
      const res = await api.admin.categories.create(data);
      categories.push(res.data);
    }
    categories.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.id - b.id);
    dlg.close();
    toast(editing ? 'Category saved.' : 'Category added.', 'ok');
    render();
  } catch (err) {
    if (err.status === 422) errorSummary(formAlert, err.message || 'Please check the form:', setFieldErrors(form, err.fields), form);
    else reportError(err, formAlert);
  } finally {
    busy(saveBtn, false);
  }
});

try {
  const [cats, prods] = await Promise.all([api.admin.categories.list(), api.admin.products.list().catch(() => ({ data: [] }))]);
  categories = cats?.data || [];
  (prods?.data || []).forEach((p) => productCounts.set(p.category_id, (productCounts.get(p.category_id) || 0) + 1));
  render();
} catch (err) {
  box.setAttribute('aria-busy', 'false');
  box.replaceChildren(h('p', { class: 'list-empty' }, 'Couldn’t load categories.'));
  reportError(err, alertBox);
}
