# SpiceMama — Technical Architecture and Repository Structure

## Architecture
Same-origin website at `https://spicemama.in`:

Browser (HTML/CSS/JS) -> `/api/v1/*` -> PHP 8.4 application -> PDO prepared statements -> MariaDB 10.11.
Admin uses secure same-origin PHP sessions and CSRF protection. Product photos served from a non-executable public uploads directory; upload processing/validation in PHP. No WordPress, Node server, Redis, Docker or long-running worker required on hosting.

## Repository (source, NOT a literal public_html mirror)
```
spicemama/
├── frontend/
│   ├── index.html
│   ├── products.html
│   ├── product.html
│   ├── about.html
│   ├── contact.html
│   ├── admin/
│   │   ├── login.html
│   │   ├── index.html
│   │   ├── products.html
│   │   ├── product-edit.html
│   │   └── categories.html
│   └── assets/
│       ├── css/
│       ├── js/
│       │   ├── api-client.js
│       │   ├── catalogue.js
│       │   └── admin/
│       └── images/  # approved brand/static assets
├── backend/
│   ├── public/
│   │   ├── api/index.php       # API front controller
│   │   └── .htaccess           # routing and protections
│   ├── src/
│   │   ├── Controllers/
│   │   ├── Middleware/
│   │   ├── Repositories/
│   │   ├── Services/
│   │   ├── Validation/
│   │   └── Support/
│   ├── config/
│   ├── database/migrations/
│   ├── tests/
│   ├── composer.json
│   └── .env.example
├── contracts/API_CONTRACT.yaml
├── docs/
├── deploy/
│   ├── README.md
│   └── release-manifest.example.md
├── AGENTS.md
├── .gitignore
└── README.md
```

## Production layout (illustrative, verify with Webuzo)
```
/home/spicemam/
├── app/                     # PRIVATE: backend/src, config, vendor, env, logs
├── releases/                # optional versioned release directories, PRIVATE
├── storage-private/         # PRIVATE: temporary/quarantined uploads, logs
└── public_html/             # PUBLIC document root
    ├── index.html
    ├── products.html
    ├── product.html
    ├── about.html
    ├── contact.html
    ├── admin/               # admin UI files, API must enforce auth
    ├── assets/
    ├── uploads/products/    # images only, PHP execution disabled
    ├── api/index.php        # public PHP entry point requiring private app
    └── .htaccess
```
Actual PHP include paths and rewrite rules must be tested on Webuzo before release. Do not put `.env`, `vendor`, SQL dumps, Git metadata or source/config files under public_html. Admin HTML being accessible is not itself security; API endpoints enforce sessions/roles.

## Hosting observations from owner-supplied inspection
PHP 8.4 active; PDO MySQL/MySQLi, cURL, OpenSSL, mbstring, GD, Imagick, intl, ZIP, OPcache enabled; fileinfo unconfirmed. PHP memory 64 MB; max execution 30 s; max input 60 s; max input vars 1000. MariaDB 10.11; no DB yet. `upload_max_filesize=20M`, `post_max_size=8M` => effective multipart upload must be below 8 MB including overhead. SSL installed but certificate validity/renewal unverified; Force HTTPS OFF. Backuply one restore point observed 2026-10-22; schedule/retention unknown. Git cloning supported, auto deployment unverified. Hosting disk quota advertised 25 GB vs panel unlimited; bandwidth ~976.56 GiB; CPU/RAM/I/O limits unknown.

## Architecture rules
- Use same-origin `/api/v1` to avoid CORS complexity.
- Keep a versioned API specification; change it only by agreement of both developers.
- All public product queries must return only published records; drafts are never publicly retrievable.
- No browser access to DB credentials or private server files.
- Do not rely on client-side validation for security.
- No PHP execution from uploads; random server-generated filenames; validate MIME by content, decode and re-encode where feasible, bound dimensions/size; verify fileinfo and GD/Imagick behavior.
- Use password_hash/password_verify, session regeneration at login, secure HttpOnly SameSite cookies on HTTPS, CSRF tokens for admin mutations, login throttling and server-side permissions.
- Use PDO bound parameters, output encoding, security headers, restrictive file permissions and minimal database privileges.
- Store all timestamps in UTC, render in user locale. Use utf8mb4.
- Future e-commerce must have server-side price calculations, signed payment webhooks, idempotent order transitions and audited stock changes. Not implemented in v1.
