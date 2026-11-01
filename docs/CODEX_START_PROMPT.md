# Copy this prompt into Codex when backend development begins

You are the backend lead for SpiceMama. Read ALL handoff documents, especially `ARCHITECTURE.md`, `BACKEND_HANDOFF.md`, `DATABASE_SCHEMA.md`, and `API_CONTRACT.yaml`.

The frontend is separately owned by Claude. Build a secure PHP 8.4 + MariaDB 10.11 backend compatible with VapourHost Power Plan 2 / Webuzo shared hosting. The production document root is `/home/spicemam/public_html`, but PHP application code, configuration and secrets must remain outside the public web root. Current constraints: PHP memory 64 MB, post_max_size 8 MB, upload_max_filesize 20 MB, max_execution_time 30 seconds. No Node runtime, Docker, Redis or root access requirement.

Start with a review of the proposed API contract and database schema, identify ambiguities and security risks, then propose a phased implementation plan and exact deployment mapping. Wait for owner approval before coding. Do not create or change production resources, DNS, SSL settings, databases, or deploy without approval. Build locally first with tests, migrations, admin sessions/CSRF, public and admin APIs, image validation and upload safety. Never modify frontend files or change the API contract unilaterally. Provide test results, deployment/rollback guide and known limitations.
