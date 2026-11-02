// Shared admin behaviour: session check, sidebar, sign-out, error handling, form field errors.
// Hiding admin pages is not security: the API enforces sessions and roles on every request.
import { api, ApiError, describeError } from '../api-client.js';
import { h, toast } from '../ui.js';

export function loginUrl() {
  const next = location.pathname + location.search;
  return `/admin/login.html?next=${encodeURIComponent(next)}`;
}

// Any 401 anywhere in admin sends the person back to sign in, keeping where they were.
export function handleAuthError(err) {
  if (err instanceof ApiError && err.status === 401) {
    location.replace(loginUrl());
    return true;
  }
  return false;
}

export async function requireAdmin() {
  try {
    const res = await api.admin.me();
    const admin = res?.data;
    document.querySelectorAll('[data-admin-name]').forEach((el) => { el.textContent = admin?.display_name || admin?.email || 'Admin'; });
    document.querySelectorAll('[data-admin-email]').forEach((el) => { el.textContent = admin?.email || ''; });
    document.body.dataset.auth = 'ok';
    return admin;
  } catch (err) {
    if (handleAuthError(err)) return new Promise(() => {}); // stop the page while redirecting
    const e = describeError(err);
    document.querySelector('.boot').replaceChildren(h('div', { class: 'state state-error', role: 'alert' },
      h('h1', {}, e.title), h('p', {}, e.message),
      h('div', { class: 'actions' }, h('button', { class: 'btn btn-red', type: 'button', onclick: () => location.reload() }, 'Try again'))));
    return new Promise(() => {});
  }
}

function initShell() {
  const page = document.body.dataset.page;
  document.querySelectorAll(`.side nav a[data-nav="${page}"]`).forEach((a) => a.setAttribute('aria-current', 'page'));

  const side = document.querySelector('.side');
  const open = document.querySelector('[data-open-side]');
  if (side && open) {
    const set = (v) => { side.dataset.open = String(v); open.setAttribute('aria-expanded', String(v)); };
    open.addEventListener('click', () => set(side.dataset.open !== 'true'));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') set(false); });
    side.addEventListener('click', (e) => { if (e.target.closest('a')) set(false); });
  }

  document.querySelectorAll('[data-logout]').forEach((b) => b.addEventListener('click', async () => {
    b.disabled = true;
    try { await api.admin.logout(); } catch { /* signing out anyway */ }
    location.replace('/admin/login.html');
  }));
}

// Shows a field's server message (422) next to it, and links the message for screen readers.
export function setFieldErrors(form, fields = {}) {
  form.querySelectorAll('[aria-invalid="true"]').forEach((el) => el.removeAttribute('aria-invalid'));
  form.querySelectorAll('.err').forEach((el) => { el.textContent = ''; });
  const entries = Object.entries(fields);
  for (const [name, msg] of entries) {
    const input = form.querySelector(`[name="${name}"]`);
    const err = form.querySelector(`[data-err="${name}"]`);
    if (input) input.setAttribute('aria-invalid', 'true');
    if (err) err.textContent = msg;
  }
  return entries;
}

export function errorSummary(box, title, entries, form) {
  box.hidden = false;
  box.className = 'alert bad';
  box.replaceChildren(h('strong', {}, title),
    entries.length ? h('ul', {}, entries.map(([name, msg]) => h('li', {}, h('a', { href: `#f-${name}`, onclick: (e) => { e.preventDefault(); form.querySelector(`[name="${name}"]`)?.focus(); } }, msg)))) : null);
  box.setAttribute('tabindex', '-1');
  box.focus();
}

// Reports any API failure in plain words. Returns true if handled as sign-in redirect.
export function reportError(err, fallbackBox) {
  if (handleAuthError(err)) return true;
  const e = describeError(err);
  if (fallbackBox) {
    fallbackBox.hidden = false;
    fallbackBox.className = 'alert bad';
    fallbackBox.replaceChildren(h('strong', {}, e.title), ' ', e.message);
  } else {
    toast(`${e.title}. ${e.message}`, 'bad');
  }
  return false;
}

export function busy(btn, on, label) {
  if (on) {
    btn.dataset.label = btn.textContent;
    btn.disabled = true;
    btn.replaceChildren(h('span', { class: 'spin', 'aria-hidden': 'true' }), ' ', label || 'Saving…');
  } else {
    btn.disabled = false;
    if (btn.dataset.label) btn.textContent = btn.dataset.label;
  }
}

// Mirrors the server's publishing rules so the Publish button can say what is missing.
// The server still decides; its 422 field messages are shown if this ever disagrees.
const blank = (s) => !s || !/[^\p{Z}\s]/u.test(s);
export function publishProblems(p, category) {
  const out = [];
  if (blank(p.short_description)) out.push('add a short description');
  if (blank(p.description)) out.push('add a full description');
  if (!(p.images || []).some((im) => !blank(im.alt_text))) out.push('add a photo with a description');
  if (category && !category.is_active) out.push(`make the “${category.name}” category visible`);
  return out;
}

// Plain sentence from a publishing 422 (fields) or the local check above.
export function publishMessage(problems) {
  const list = problems.join(', ');
  return `To publish, ${list.replace(/, ([^,]*)$/, ' and $1')}.`;
}

export function publishFailure(err) {
  if (err?.status === 422 && err.fields && Object.keys(err.fields).length) {
    return `Can’t publish yet: ${Object.values(err.fields).join(' ')}`;
  }
  return null;
}

export const STATUS_LABEL ={ draft: 'Draft', published: 'Published', archived: 'Archived' };
export const statusBadge = (s) => h('span', { class: `badge ${s}` }, STATUS_LABEL[s] || s);

export function confirmDialog({ title, message, confirmLabel = 'Confirm', danger = false }) {
  return new Promise((resolve) => {
    const dlg = h('dialog', { 'aria-labelledby': 'cd-title' });
    const form = h('form', { method: 'dialog' },
      h('h2', { id: 'cd-title' }, title),
      h('p', { style: { margin: 0, color: 'var(--ink-soft)' } }, message),
      h('div', { class: 'dlg-acts' },
        h('button', { class: 'btn btn-line btn-sm', value: 'cancel' }, 'Cancel'),
        h('button', { class: `btn ${danger ? 'btn-red' : 'btn-green'} btn-sm`, value: 'ok' }, confirmLabel)));
    dlg.append(form);
    document.body.append(dlg);
    dlg.addEventListener('close', () => { resolve(dlg.returnValue === 'ok'); dlg.remove(); });
    dlg.showModal();
  });
}

initShell();
