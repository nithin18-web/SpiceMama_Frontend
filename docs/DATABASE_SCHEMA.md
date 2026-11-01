# SpiceMama — Proposed Phase-1 Data Model

These are logical tables, not yet executed SQL. Codex must propose migration SQL and obtain approval.

## admins
`id BIGINT PK`, `email VARCHAR(254) UNIQUE`, `password_hash VARCHAR(255)`, `display_name VARCHAR(120)`, `role ENUM('admin')`, `is_active BOOLEAN`, `last_login_at DATETIME NULL`, `created_at`, `updated_at`. No plaintext passwords; one-time secure provisioning.

## categories
`id BIGINT PK`, `name VARCHAR(120)`, `slug VARCHAR(160) UNIQUE`, `description TEXT NULL`, `sort_order INT`, `is_active BOOLEAN`, `created_at`, `updated_at`.

## products
`id BIGINT PK`, `category_id BIGINT FK`, `name VARCHAR(180)`, `slug VARCHAR(200) UNIQUE`, `short_description VARCHAR(500)`, `description TEXT`, `pack_size_label VARCHAR(100) NULL`, `ingredients TEXT NULL`, `status ENUM('draft','published','archived')`, `sort_order INT`, `published_at DATETIME NULL`, `created_at`, `updated_at`. Price/stock are not in phase-1 API; add later through migrations if approved.

## product_images
`id BIGINT PK`, `product_id BIGINT FK`, `file_path VARCHAR(255)`, `alt_text VARCHAR(255)`, `sort_order INT`, `is_primary BOOLEAN`, `width INT`, `height INT`, `mime_type VARCHAR(60)`, `file_size_bytes BIGINT`, `created_at`. Use generated filenames, not user-supplied paths.

## admin_audit_logs
`id BIGINT PK`, `admin_id BIGINT FK NULL`, `action VARCHAR(100)`, `entity_type VARCHAR(80)`, `entity_id BIGINT NULL`, `details_json JSON NULL`, `created_at`. Avoid storing credentials or sensitive payloads.

## site_settings
`setting_key VARCHAR(120) PK`, `setting_value TEXT`, `updated_at`. Only approved public-safe settings; secrets belong in server environment/config, never here.

## Indexes and invariants
- Unique `slug` on products/categories.
- Index products `(status,category_id,sort_order)` and `(status,published_at)`.
- Foreign keys and deliberate delete behavior; no accidental cascade loss of catalogue.
- Draft/archived products cannot be fetched from public APIs even by known slug.
- `published_at` set on publish; timestamps in UTC; `utf8mb4` and InnoDB.
- Future phase: product_variants, inventory_movements, customers, carts, orders, order_items, payments, shipments, webhook_events; do not implement now.
