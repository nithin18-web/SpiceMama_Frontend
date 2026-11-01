# SpiceMama — Project Handoff Pack

**Version:** 1.0 | **Date:** 2026-10-28 | **Status:** Planning, no code deployed

This pack is the shared source of truth for the SpiceMama website. Hand `FRONTEND_HANDOFF.md` and `DESIGN_CONTENT_BRIEF.md` to the Claude/frontend developer. Hand `BACKEND_HANDOFF.md`, `API_CONTRACT.yaml`, and `DATABASE_SCHEMA.md` to Codex/backend developer. Both must read `ARCHITECTURE.md` and `DECISIONS_AND_CHECKLIST.md`.

## Confirmed context
- Brand/site: SpiceMama; domain `spicemama.in`.
- Hosting: VapourHost Power Plan 2, Webuzo; PHP 8.4; MariaDB 10.11; public document root `/home/spicemam/public_html`.
- Frontend: HTML, CSS, vanilla JavaScript (unless owner approves a change); Claude/frontend developer owns UI.
- Backend: PHP 8.4 + PDO + MariaDB; Codex/backend developer owns APIs, security, migrations and tests.
- Phase 1: product showcase, categories, product detail, brand/contact information, secure admin product/category/image management; **no online checkout yet**.
- Future: Indian e-commerce (prices, inventory, cart, orders, payment gateway, shipping), designed as a later phase.

## Unknown business facts — obtain owner approval
Official brand description, logo, color references, actual products and categories, pack sizes, ingredients, certifications, photos, address, email, phone/WhatsApp, social profiles, legal policies, shipping plans, tax/GST details, price display policy. Do not invent them or make unsupported claims such as 'organic', 'chemical-free', 'certified', '100% pure', or health benefits.

## Suggested build sequence
1. Approve content and scope; freeze v1 API contract.
2. Frontend developer creates responsive pages and admin UI against local mock JSON matching the contract.
3. Backend developer implements schema, PHP API, admin security, uploads, tests.
4. Integrate, run acceptance/security checks, validate hosting limits and HTTPS.
5. Owner approves deployment; deploy using a documented, reversible release process.

**Do not create hosting resources, modify DNS/settings, deploy or buy services without explicit owner approval.**
