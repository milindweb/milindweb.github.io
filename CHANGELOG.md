# Changelog

## 2026-06-11 — Page consolidation & CSS overhaul

### Added
- Shared `p-*` component classes (`p-hero`, `p-section`, `p-card`, `p-card-icon`, `p-grid-3/4`, `p-stat-num`, `p-badge`, `p-cta`) in `style.css`
- Contact form heading + subtitle on all service pages (`contact-intro` section)
- Scroll-to-top button in footer (appears after 400px scroll)
- Expanded legal content (Privacy Policy, Terms of Use, Disclaimer, Feedback) on `contact.html`

### Changed
- Pages rewritten: `graphics.html`, `website-tech-solutions.html`, `project-training.html` — now use shared `p-*` classes instead of per-page CSS
- Gradient changed from blue→purple (`#2563eb`→`#7c3aed`) to blue→blue (`#2563eb`→`#3b82f6`) matching M logo color
- Stat numbers changed from solid blue to plain text color
- All section headings uppercased
- Team avatar background from gradient to solid `#3b82f6`
- Contact info softcoded from `config.js` (no hardcoded phone/email in HTML)
- CTA sections removed from service pages (redundant above contact form)
- Footer top gradient line removed
- README updated with consolidated service list

### Fixed
- Accordion bug on `contact.html` — missing CSS rule `ct-card.active .ct-card-body { display: block }`
- Missing `</section>` close tags on service pages
- `var(--p-secondary)` replaced with `var(--accent)` across all pages

### Removed
- `business-automation.html` — merged into `website-tech-solutions.html`
- `photography.html` — merged into `graphics.html`

## 2026-06-11 — Contact form fix

### Fixed
- Contact form not submitting — scripts inside dynamically loaded HTML are ignored by browsers. Moved contact form out of `footer.html` into its own component.
- `headerfooter.js` now loads `contact-form.html` dynamically into a placeholder at the end of `<body>`, then appends `form-handler.js` which polls for the form element and attaches the submit handler.

### Changed
- `headerfooter.js` — removed inline `initForm()`, now loads contact form component + handler script
- `form-handler.js` — restored as standalone file with polling init

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
