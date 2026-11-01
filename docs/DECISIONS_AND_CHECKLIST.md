# Decisions, Release Gates and Owner Checklist

## Pending business approvals
- [ ] Confirm brand logo, identity, colors and imagery.
- [ ] Confirm product catalogue and categories; approved copy and claims.
- [ ] Confirm which contact channels to publish and whether a form is needed.
- [ ] Confirm whether product prices and pack sizes are shown in v1.
- [ ] Approve privacy/legal pages and actual business details.
- [ ] Confirm admin users and who is authorized to publish products.

## Pending hosting checks (read-only until approved)
- [ ] SSL expiry, hostname coverage, renewal and public HTTPS verified; then owner approves HTTPS redirect.
- [ ] `fileinfo` PHP extension confirmed.
- [ ] Check effective PHP `post_max_size`, `upload_max_filesize`, memory; decide whether to increase.
- [ ] Confirm filesystem write permissions for PHP uploads; forbid script execution in upload folder.
- [ ] Confirm MariaDB connection/resource limits and effective disk/inode quotas.
- [ ] Confirm CPU, RAM, I/O and concurrent process limits.
- [ ] Confirm Backuply automatic schedule, retention, offsite backup and tested restore.
- [ ] Confirm SSH/SFTP access if desired; test GitHub authentication and deployment path.
- [ ] Verify DNS public delegation, email delivery limits, DKIM/SPF/DMARC suitability.
- [ ] Validate Webuzo Apache rewrite rules and PHP private include path.

## Phase 1 acceptance
- [ ] Responsive mobile and desktop pages; no fake product facts.
- [ ] Product list and detail read published products from API.
- [ ] Categories, pagination/filtering, empty and error states work.
- [ ] Admin login/logout, sessions, CSRF and permission checks tested.
- [ ] Admin creates/edits/drafts/publishes/unpublishes products.
- [ ] Image uploads validated and inaccessible as executable scripts.
- [ ] SQL injection, XSS, CSRF, auth bypass and upload abuse tests pass.
- [ ] No private files/credentials publicly reachable.
- [ ] HTTPS and backups validated; documented rollback available.
- [ ] Owner approves deployment and verifies final content.

## Working agreement
One GitHub repo; frontend developer owns `frontend/`, backend developer owns `backend/`; shared `contracts/` is changed only through agreed review. Use separate branches/PRs, never commit `.env`, database dumps, credentials or actual customer data. Do not modify live hosting or purchase services without approval.

## Suggested timeline (not a promise)
Phase A: content/design and API freeze. Phase B: frontend with mocks. Phase C: backend APIs/security. Phase D: integration and security testing. Phase E: approved deployment. Estimate only after catalogue size and content are known.
