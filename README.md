# SpiceMama website

Brand and product showcase for Spice Mama (Andhra Standard Products, Guntur). Phase 1: no cart, no prices.
Planning documents are in `docs/`; the shared API agreement is `contracts/API_CONTRACT.yaml`.

| Folder | Owner | What |
| --- | --- | --- |
| `frontend/` | Claude (frontend) | Plain HTML, CSS and JavaScript pages + admin screens |
| `backend/` | Codex (backend) | PHP 8.4 API and database (not started) |
| `contracts/` | both, by agreement | API contract |
| `tools/` | frontend | Local preview server and the nav/footer copier |

## Run it locally

```bash
node tools/serve.mjs
```

Open http://localhost:4173. On localhost the site uses **sample data** (the mock API in `frontend/mock/`),
shown by a small "Sample data" badge. Admin sign-in in sample mode: any email + a password of 8 or more characters.

- `?api=live` uses the real PHP API at `/api/v1` (once it runs on the same address); `?api=mock` switches back.
- `?mock=error`, `?mock=empty`, `?mock=slow` show the error, empty and slow states; `?mock=off` resets.
- Production (any host that isn't localhost) always uses the real API.

## Pages

Public: `index.html` (home), `products.html` (search, category filter, pages), `product.html?slug=…`,
`about.html`, `contact.html`, `404.html`.
Admin: `admin/login.html`, `admin/index.html`, `admin/products.html`, `admin/product-edit.html`, `admin/categories.html`.

## Editing the menu or footer

The nav and footer live in `tools/partials/`. After changing one, run:

```bash
node tools/sync-partials.mjs
```

It copies them into every public page, so the pages stay plain HTML with no build step.

## Deploying (needs owner approval first)

Copy everything in `frontend/` **except `frontend/mock/`** into `public_html/`. The 404 page needs
`ErrorDocument 404 /404.html` in `.htaccess` (backend team owns `.htaccess`).

## Waiting on the owner / backend

- WhatsApp number (set `business.whatsapp` in `frontend/assets/js/config.js`; buttons appear once set).
- Founding story, real food photos for recipes, office hours, social links, privacy policy and terms.
- Real categories (the sample ones are a guess based on the packs).
- Recipe text and the Telugu headline translation need brand sign-off.
- Contract gaps to agree with backend: a pack colour and brand line per product (now matched by slug in
  `assets/js/product-look.js`), `GET /admin/products/{id}`, and deleting or reordering photos.
