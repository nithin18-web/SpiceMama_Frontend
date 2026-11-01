// Add / edit a product, change its status, upload photos.
// The contract has no "get one admin product" endpoint, so an existing product is found in the admin list.
import { api } from '../api-client.js';
import { config } from '../config.js';
import { h, toast, slugify, links } from '../ui.js';
import { requireAdmin, reportError, setFieldErrors, errorSummary, busy, statusBadge, confirmDialog, handleAuthError } from './admin-core.js';

await requireAdmin();

const $ = (id) => document.getElementById(id);
const form = $('product-form');
const alertBox = $('form-alert');
const saveBtn = $('save-btn');
const saveMsg = $('save-msg');
const nameIn = $('f-name');
const slugIn = $('f-slug');
const catIn = $('f-category');
const shortIn = $('f-short');
const shortCount = $('c-short');

let product = null;
let slugTouched = false;
let savedSnapshot = '';
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const id = Number(new URLSearchParams(location.search).get('id')) || null;

// ---------- form values ----------
function readForm() {
  const v = (n) => form.elements[n].value;
  const optional = (n) => (v(n).trim() ? v(n).trim() : null);
  return {
    name: v('name').trim(),
    slug: v('slug').trim(),
    category_id: Number(v('category_id')) || null,
    short_description: v('short_description').trim(),
    description: v('description').trim(),
    pack_size_label: optional('pack_size_label'),
    ingredients: optional('ingredients'),
    sort_order: Number.parseInt(v('sort_order'), 10) || 0,
  };
}
function fillForm(p) {
  form.elements.name.value = p.name || '';
  form.elements.slug.value = p.slug || '';
  form.elements.category_id.value = p.category_id ? String(p.category_id) : '';
  form.elements.short_description.value = p.short_description || '';
  form.elements.description.value = p.description || '';
  form.elements.pack_size_label.value = p.pack_size_label || '';
  form.elements.ingredients.value = p.ingredients || '';
  form.elements.sort_order.value = String(p.sort_order ?? 0);
  updateCounter();
}
const snapshot = () => JSON.stringify(readForm());
const isDirty = () => snapshot() !== savedSnapshot;

function updateCounter() {
  const n = shortIn.value.length;
  shortCount.textContent = `${n} / 500`;
  shortCount.classList.toggle('over', n > 500);
}

function validate(data) {
  const f = {};
  if (!data.name) f.name = 'Enter a product name.';
  if (!data.slug) f.slug = 'Enter a web address.';
  else if (!SLUG_RE.test(data.slug)) f.slug = 'Use lowercase letters, numbers and dashes only (e.g. turmeric-powder).';
  if (!data.category_id) f.category_id = 'Choose a category.';
  if (data.short_description.length > 500) f.short_description = 'Keep this under 500 characters.';
  return f;
}

// ---------- page state ----------
function renderMeta() {
  const isNew = !product;
  $('edit-title').textContent = isNew ? 'Add a product' : product.name;
  $('crumb-name').textContent = isNew ? 'New product' : product.name;
  document.title = `${isNew ? 'Add a product' : product.name} · Spice Mama admin`;
  $('edit-sub').textContent = isNew
    ? 'New products start as drafts. They only show on the website once you publish them.'
    : product.status === 'published'
      ? 'This product is on the website. Saved changes show there straight away.'
      : 'Hidden from the website until you publish it.';
  saveBtn.textContent = isNew ? 'Save draft' : 'Save changes';
  document.body.dataset.page = isNew ? 'new-product' : 'products';
  document.querySelectorAll('.side nav a').forEach((a) => a.toggleAttribute('aria-current', a.dataset.nav === document.body.dataset.page));

  const live = $('view-live');
  live.hidden = !(product && product.status === 'published');
  if (product) live.href = links.product(product.slug);

  $('status-panel').hidden = isNew;
  $('photos-locked').hidden = !isNew;
  $('photos').hidden = isNew;
  if (!isNew) { renderStatus(); renderImages(); }
}

const STATUS_HELP = {
  draft: 'Hidden from the website. Publish when the details and photo are ready.',
  published: 'Showing on the website now.',
  archived: 'Hidden from the website and out of the main list.',
};

function renderStatus() {
  $('status-badge').replaceChildren(statusBadge(product.status));
  $('status-help').textContent = STATUS_HELP[product.status] || '';
  const acts = $('status-acts');
  acts.replaceChildren();
  const add = (status, label, cls, confirm) => {
    const b = h('button', { class: `btn btn-sm ${cls}`, type: 'button' }, label);
    b.addEventListener('click', async () => {
      if (isDirty()) {
        toast('Save your changes first.', 'bad');
        saveBtn.focus();
        return;
      }
      if (confirm && !(await confirmDialog(confirm))) return;
      busy(b, true, 'Saving…');
      try {
        const res = await api.admin.products.setStatus(product.id, status);
        product = res?.data || { ...product, status };
        toast(status === 'published' ? 'Published. It’s on the website now.' : status === 'draft' ? 'Moved to drafts. Hidden from the website.' : 'Archived.', 'ok');
        renderMeta();
      } catch (err) {
        busy(b, false);
        reportError(err);
      }
    });
    acts.append(b);
  };
  if (product.status !== 'published') {
    add('published', 'Publish', 'btn-green', product.images?.length ? null
      : { title: 'Publish without a photo?', message: 'This product has no photo yet. It will show with a “photo to come” box.', confirmLabel: 'Publish anyway' });
  }
  if (product.status === 'published') add('draft', 'Unpublish', 'btn-line', { title: 'Unpublish this product?', message: 'It will be hidden from the website straight away.', confirmLabel: 'Unpublish', danger: true });
  if (product.status !== 'archived') add('archived', 'Archive', 'btn-line', { title: 'Archive this product?', message: 'It will be hidden from the website and moved out of your main list.', confirmLabel: 'Archive', danger: true });
  if (product.status === 'archived') add('draft', 'Restore to drafts', 'btn-line');
}

function renderImages() {
  const list = $('img-list');
  const imgs = [...(product.images || [])].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  list.replaceChildren(...imgs.map((im, i) => h('figure', {},
    h('img', { src: im.url, alt: im.alt_text || '', loading: 'lazy' }),
    h('figcaption', {}, i === 0 ? h('b', {}, 'Main photo · ') : null, im.alt_text || 'No description'))));
  list.hidden = !imgs.length;
}

// ---------- save ----------
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  alertBox.hidden = true;
  const data = readForm();
  const local = validate(data);
  const entries = setFieldErrors(form, local);
  if (entries.length) return errorSummary(alertBox, 'Please fix these before saving:', entries, form);

  busy(saveBtn, true, 'Saving…');
  saveMsg.textContent = '';
  try {
    if (product) {
      const res = await api.admin.products.update(product.id, data);
      product = res?.data || { ...product, ...data };
      toast('Changes saved.', 'ok');
    } else {
      const res = await api.admin.products.create(data);
      product = res.data;
      history.replaceState(null, '', `?id=${product.id}`);
      toast('Draft saved. Now add a photo.', 'ok');
    }
    slugTouched = true;
    fillForm(product);
    savedSnapshot = snapshot();
    saveMsg.textContent = `Saved at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`;
    renderMeta();
  } catch (err) {
    if (err.status === 422) {
      const fieldEntries = setFieldErrors(form, err.fields);
      errorSummary(alertBox, err.message || 'Please check the form:', fieldEntries, form);
    } else {
      reportError(err, alertBox);
    }
  } finally {
    busy(saveBtn, false);
    saveBtn.textContent = product ? 'Save changes' : 'Save draft';
  }
});

nameIn.addEventListener('input', () => { if (!slugTouched) slugIn.value = slugify(nameIn.value); });
slugIn.addEventListener('input', () => { slugTouched = true; });
slugIn.addEventListener('blur', () => { if (slugIn.value) slugIn.value = slugify(slugIn.value); });
shortIn.addEventListener('input', updateCounter);
addEventListener('beforeunload', (e) => { if (isDirty()) { e.preventDefault(); e.returnValue = ''; } });

// ---------- photo upload ----------
const fileIn = $('f-file');
const drop = $('drop');
const preview = $('upload-preview');
const upForm = $('upload-form');
const upBtn = $('up-btn');
const upMsg = $('up-msg');
const bar = $('up-bar');
let chosen = null;
let previewUrl = null;

function resetUpload() {
  chosen = null;
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = null;
  fileIn.value = '';
  upForm.elements.alt_text.value = '';
  preview.hidden = true;
  bar.hidden = true;
  bar.firstElementChild.style.width = '0';
  setFieldErrors(upForm, {});
}

function choose(file) {
  setFieldErrors(upForm, {});
  upMsg.textContent = '';
  if (!file) return;
  if (!config.uploadTypes.includes(file.type)) {
    setFieldErrors(upForm, { file: 'Only JPEG, PNG or WebP photos can be uploaded.' });
    return;
  }
  if (file.size > config.maxUploadBytes) {
    setFieldErrors(upForm, { file: `This photo is ${(file.size / 1048576).toFixed(1)} MB. Please use one under 5 MB.` });
    return;
  }
  chosen = file;
  previewUrl = URL.createObjectURL(file);
  $('prev-img').src = previewUrl;
  $('prev-meta').textContent = `${file.name} · ${(file.size / 1024).toFixed(0)} KB`;
  preview.hidden = false;
  if (!upForm.elements.alt_text.value) upForm.elements.alt_text.value = `${product?.name || ''} pack`.trim();
  upForm.elements.alt_text.focus();
  upForm.elements.alt_text.select();
}

fileIn.addEventListener('change', () => choose(fileIn.files[0]));
['dragenter', 'dragover'].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.add('over'); }));
['dragleave', 'drop'].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.remove('over'); }));
drop.addEventListener('drop', (e) => choose(e.dataTransfer?.files?.[0]));
$('up-cancel').addEventListener('click', () => { resetUpload(); fileIn.focus(); });

upForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!chosen || !product) return;
  const alt = upForm.elements.alt_text.value.trim();
  if (!alt) {
    setFieldErrors(upForm, { alt_text: 'Describe the photo in a few words.' });
    upForm.elements.alt_text.focus();
    return;
  }
  busy(upBtn, true, 'Uploading…');
  bar.hidden = false;
  upMsg.textContent = 'Uploading…';
  try {
    const res = await api.admin.images.upload({ product_id: product.id, file: chosen, alt_text: alt }, (p) => {
      bar.firstElementChild.style.width = `${Math.round(p * 100)}%`;
    });
    product.images = [...(product.images || []), res.data];
    renderImages();
    renderStatus();
    resetUpload();
    upMsg.textContent = 'Photo uploaded.';
    toast('Photo uploaded.', 'ok');
  } catch (err) {
    bar.hidden = true;
    upMsg.textContent = '';
    if (handleAuthError(err)) return;
    if (err.status === 422 && Object.keys(err.fields || {}).length) setFieldErrors(upForm, err.fields);
    else reportError(err);
  } finally {
    busy(upBtn, false);
  }
});

// ---------- load ----------
try {
  const [cats, prods] = await Promise.all([api.admin.categories.list(), id ? api.admin.products.list() : Promise.resolve(null)]);
  const categories = cats?.data || [];
  catIn.append(...categories.map((c) => h('option', { value: String(c.id) }, c.is_active ? c.name : `${c.name} (hidden)`)));
  if (!categories.length) {
    alertBox.hidden = false;
    alertBox.className = 'alert warn';
    alertBox.replaceChildren('You need a category before adding products. ', h('a', { href: '/admin/categories.html' }, 'Add a category'));
  }
  if (id) {
    product = (prods?.data || []).find((p) => p.id === id) || null;
    if (!product) {
      $('loading').replaceChildren(h('div', { class: 'list-empty' }, h('p', {}, 'This product doesn’t exist or was removed.'), h('a', { class: 'btn btn-red btn-sm', href: '/admin/products.html' }, 'Back to products')));
      throw null;
    }
    slugTouched = true;
    fillForm(product);
  }
  savedSnapshot = snapshot();
  $('loading').hidden = true;
  $('editor').hidden = false;
  renderMeta();
  if (!product) nameIn.focus();
} catch (err) {
  if (err) {
    $('loading').hidden = true;
    reportError(err, alertBox);
  }
}
