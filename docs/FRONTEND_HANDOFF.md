# Frontend Developer Handoff — Claude

## Mission
Build the complete **frontend** for SpiceMama's premium Indian spices product showcase. Backend will be written separately by Codex using PHP 8.4 and MariaDB. Do not build a competing backend, invent API paths, create a database or deploy to hosting.

## Read before coding
Read `README.md`, `DESIGN_CONTENT_BRIEF.md`, `ARCHITECTURE.md`, and `API_CONTRACT.yaml`. Treat the API contract as authoritative. Ask for approval before changing data shapes or endpoint names.

## Deliverables
- Responsive HTML/CSS/vanilla JS pages: Home, Catalogue, Product Detail, About, Contact, 404.
- Admin UI: Login, Dashboard, Product List, Add/Edit Product, Category List/Add/Edit, image uploader, publish/unpublish controls.
- Reusable design tokens, nav/footer, product cards, breadcrumbs, modals/toasts, form controls and error components.
- Centralized `api-client.js` with same-origin `fetch('/api/v1/...')`, credentials for sessions, CSRF handling, error/timeout handling and no hardcoded secrets.
- Development-only mock API adapter/data matching exact contract, switchable via config. No mock data in production builds.
- Accessibility: keyboard navigation, labels, focus states, alt text, WCAG-conscious contrast, reduced motion.
- SEO: title/meta, Open Graph placeholders, semantic headings, canonical links when domain verified, sitemap/robots proposal.
- Performance: mobile-first, responsive images, lazy loading, compressed images, low JS overhead.
- Documentation for local preview and frontend/backend integration.

## UI behaviors
- Catalogue loads published products from GET `/api/v1/products`; categories from `/api/v1/categories`.
- Product detail resolves slug from query string, e.g. `/product.html?slug=andhra-chilli-powder` (simple static hosting routing). Do not assume pretty URLs until rewrites are approved.
- Admin login POST `/api/v1/admin/login`; CSRF GET `/api/v1/admin/csrf`; admin session GET `/api/v1/admin/me`; logout POST `/api/v1/admin/logout`.
- Admin creates/edits products with API, uploads image with multipart form, publishes/unpublishes via API. Do not pretend a save succeeded until server confirms.
- For HTTP 401, show login; 403, show permission/CSRF error; 422, show field errors; 429, rate-limit notice; 5xx, retryable error state.
- Never render raw product descriptions as HTML; use safe text rendering unless a separately approved sanitization strategy is introduced.

## Visual direction
Premium contemporary Indian spices: warm cream, rich chilli red, turmeric gold, restrained green, strong product photography, minimal but elegant motion. These are **proposed**, not finalized brand assets. Do not fabricate certification logos, testimonials, product claims or real business details. Use placeholder content clearly marked as mock.

## Collaboration boundaries
Own `frontend/**` only. Do not edit `backend/**` or the API contract without approval. Submit code to a dedicated frontend branch/PR. Provide screenshots for desktop and mobile, a list of unfinished placeholders, and a manual QA checklist.

## Definition of done
All pages responsive; navigation works; mocked API and real API modes both function; all forms have validation and error states; admin UI does not expose secrets; no console errors; no unapproved claims; no checkout/cart functionality in phase 1.
