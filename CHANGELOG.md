# Changelog

## 2026-06-10 — Centralized Configuration

### Added
- `frontend/shared/js/config.js` — Single source of truth for brand name, domain, contact info, social links
- `frontend/shared/js/seo-injector.js` — Dynamic injection of `<title>`, OG/Twitter meta tags, canonical URL, and JSON-LD from config

### Changed
- All 14 HTML pages — removed hardcoded title, meta, OG, Twitter, JSON-LD; now use `config.js` + per-page `PAGE_CONFIG`
- `header.html` — logo, brand name, tagline driven by config placeholders (`{{SITE_NAME_UPPER}}`, `{{TAGLINE}}`)
- `footer.html` — phone, email, location, hours, social links, copyright driven by config placeholders
- `headerfooter.js` — now replaces `{{PLACEHOLDERS}}` with values from `config.js` at runtime
- `sitemap.xml` / `robots.txt` — added comments noting manual domain update requirement

### Fixed
- `blog.html` OG url was pointing to `milindweb.pages.dev` (wrong domain) — now correctly uses domain from config
- `contact.html` used `Milindweb` (inconsistent lowercase) — now consistent from config
- `seniority-list.html` used `Milindweb` (inconsistent lowercase) — now consistent from config

### Documentation
- `README.md` — updated structure, features, and getting started to reflect centralized config
- `structure.md` — added config.js, seo-injector.js to file tree; new Site Configuration section
- `docs/DEPLOYMENT.md` — created with deployment steps and config notes
- `docs/ROADMAP.md` — created with completed/in-progress/planned items
