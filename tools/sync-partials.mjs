// Copies tools/partials/*.html into every public page between marker comments, e.g.
//   <!-- partial:nav -->...<!-- /partial:nav -->
// Pages stay plain static HTML (no build needed to deploy); run this after editing a partial:
//   node tools/sync-partials.mjs
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const partials = Object.fromEntries(['nav', 'footer'].map((n) => [n, readFileSync(join(root, 'tools/partials', `${n}.html`), 'utf8').trim()]));
const dir = join(root, 'frontend');
for (const file of readdirSync(dir).filter((f) => f.endsWith('.html'))) {
  const path = join(dir, file);
  let html = readFileSync(path, 'utf8');
  const before = html;
  for (const [name, body] of Object.entries(partials)) {
    const re = new RegExp(`<!-- partial:${name} -->[\\s\\S]*?<!-- /partial:${name} -->`);
    html = html.replace(re, () => `<!-- partial:${name} -->\n${body}\n<!-- /partial:${name} -->`);
  }
  if (html !== before) { writeFileSync(path, html); console.log('updated', file); }
}
