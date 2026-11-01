// Admin sign-in. Generic failure message on purpose (never says which part was wrong).
import { api, ApiError, describeError } from '../api-client.js';
import { config } from '../config.js';
import { h } from '../ui.js';

const form = document.getElementById('login-form');
const alertBox = document.getElementById('login-alert');
const btn = document.getElementById('login-btn');
const pass = document.getElementById('l-pass');
const toggle = document.getElementById('pw-toggle');

// Only allow going back to an admin page on this site (no open redirects).
function nextUrl() {
  const n = new URLSearchParams(location.search).get('next') || '';
  return /^\/admin\/(?!login\.html)[\w\-./?=&%]*$/.test(n) && !n.includes('//') ? n : '/admin/';
}

function showAlert(kind, text) {
  alertBox.hidden = false;
  alertBox.className = `alert ${kind}`;
  alertBox.setAttribute('role', 'alert');
  alertBox.textContent = text;
}

function fieldError(name, msg) {
  const input = form.elements[name];
  const err = form.querySelector(`[data-err="${name}"]`);
  input.toggleAttribute('aria-invalid', Boolean(msg));
  if (msg) input.setAttribute('aria-invalid', 'true');
  err.textContent = msg || '';
}

toggle.addEventListener('click', () => {
  const show = pass.type === 'password';
  pass.type = show ? 'text' : 'password';
  toggle.textContent = show ? 'Hide' : 'Show';
  toggle.setAttribute('aria-pressed', String(show));
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  alertBox.hidden = true;
  const email = form.elements.email.value.trim();
  const password = form.elements.password.value;
  fieldError('email', !email ? 'Enter your email.' : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? 'Enter a valid email, like name@example.com.' : '');
  fieldError('password', password ? '' : 'Enter your password.');
  const firstBad = form.querySelector('[aria-invalid="true"]');
  if (firstBad) return firstBad.focus();

  btn.disabled = true;
  btn.replaceChildren(h('span', { class: 'spin', 'aria-hidden': 'true' }), ' Signing in…');
  try {
    await api.admin.login(email, password);
    location.replace(nextUrl());
  } catch (err) {
    pass.value = '';
    if (err instanceof ApiError && err.status === 401) showAlert('bad', 'That email and password don’t match. Please try again.');
    else if (err instanceof ApiError && err.status === 429) showAlert('warn', 'Too many attempts. Please wait a few minutes, then try again.');
    else if (err instanceof ApiError && err.status === 403) showAlert('bad', 'Your sign-in page expired. Reload the page and try again.');
    else { const d = describeError(err); showAlert('bad', `${d.title}. ${d.message}`); }
    pass.focus();
  } finally {
    btn.disabled = false;
    btn.textContent = 'Sign in';
  }
});

// Already signed in? Skip the form.
api.admin.me().then(() => location.replace(nextUrl())).catch(() => {});

if (config.apiMode === 'mock') {
  form.append(h('p', { class: 'alert warn', style: { margin: 0, fontSize: '.88rem' } }, 'Sample mode: any email with a password of 8 or more characters signs in. Nothing is saved to a server.'));
}
