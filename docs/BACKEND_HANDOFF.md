# Backend Developer Handoff — Codex

## Mission
Build a secure, production-oriented, **shared-hosting-compatible PHP 8.4 backend** for SpiceMama. Claude owns frontend. Do not build/replace frontend design. Work locally first. Never modify live hosting, DNS, databases, credentials or deployment without explicit owner approval.

## Stack and constraints
PHP 8.4, MariaDB 10.11, PDO MySQL, Composer dependencies only if compatible with Webuzo and deployment process. No Node server, Redis, Docker, daemon, queue or root access requirement. Memory 64 MB; execution 30 s; multipart POST 8 MB effective cap until changed. Web root `/home/spicemam/public_html`, application code and secrets outside it.

## Implement in phases
1. Review repo and agree on `API_CONTRACT.yaml` and DB schema. Produce migration plan; do not implement until approved.
2. Bootstrap small PHP app: front controller, router, JSON response/error handling, config loader, PDO connection, logging, health endpoint with no secrets.
3. Database migrations: admins, categories, products, product_images, admin_audit_logs, site_settings. Index slug, category/status, sort order; foreign keys; unique constraints.
4. Admin auth: password_hash/verify, secure sessions, CSRF for state changes, rate limiting, admin-only middleware, generic login failure messages, logout invalidation.
5. Public GET APIs: published products/categories and product by slug; bounded pagination and validation.
6. Admin CRUD: draft/publish/unpublish, category management, image association/reorder; audit logging.
7. Upload pipeline: verify fileinfo; allow only JPEG/PNG/WebP, safe MIME detection and decode/re-encode if feasible, max <= 5 MB until server POST limit adjusted, dimensions limits, random names, non-executable upload folder, safe deletion and cleanup. No SVG uploads.
8. Automated tests (PHPUnit or lightweight alternative), SQL injection/XSS/CSRF/auth regression, concurrency and upload edge cases.
9. Deployment documentation and rollback; verify SSL, backups, permissions, rewrite rules and provider limits before any release.

## API contract
Use `API_CONTRACT.yaml` exactly. Admin endpoints require same-origin session cookie; mutating requests additionally require `X-CSRF-Token` except login where login-CSRF strategy must be documented. Return consistent `{data,meta}` or `{error:{code,message,fields}}`. Return no drafts to unauthenticated visitors. Ensure errors don't leak SQL or server paths.

## Database design
Read `DATABASE_SCHEMA.md`; use InnoDB and utf8mb4. Use transactions for multi-row updates, parameterized queries everywhere, no silent destructive deletes. Provide seed script for *development only*, not fabricated production content. Create initial admin through secure one-time CLI/approved provisioning, never default credentials.

## Deployment and ops
Prepare documented mapping from repo to private app and public document root. Git clone is supported but automatic deploy is unconfirmed; never assume Git push deploys production. Include migration dry-run, backup verification, health check, post-deploy smoke tests, and rollback instructions. Keep credentials out of Git and frontend. Never deploy without approval.

## Security gates
Require HTTPS before admin use, validate active certificate and renewal. Secure/HttpOnly/SameSite session cookie; regenerate ID after auth; restrict session lifetime; CSRF; login throttling; security headers; output escaping; deny listing/execution in uploads; protect private paths; log errors without PII/secrets; DB user minimum privileges. Contact forms or email sending are **out of scope** unless explicitly approved.

## Deliverables
Code, migrations, tests, OpenAPI conformance checklist, `.env.example` without secrets, local setup instructions, deployment/rollback runbook, documented known risks and unverified hosting assumptions.
