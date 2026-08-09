# MilindWeb — CHANGELOG

> Tracks all changes to this project (site + backend).
>
> **Backend rule:** whenever a `.gs` file in `apps-script-v2/` changes, re-paste
> it into your Google Apps Script project (Milind-Auth → Extensions → Apps Script)
> and re-deploy (Deploy → Manage deployments → Edit → New version → Deploy).

Format: `YYYY-MM-DD — [Area] File: what changed`

---

## 2026-08-09 — Docs cleanup + unused file removal

- Moved all `.md` files into `doc/`; only `README.md` remains at root. Renamed generics: `hospital/prompt.md` → `doc/hospital-prompt.md`, `PFMS/prompt.md` → `doc/pfms-prompt.md`, `structure.md` → `doc/site-structure.md`, `apps-script/README.md` → `doc/apps-script-backend.md`, `my old app scripts/*.md` → `doc/contact-form-script.md` / `employee-data-script.md` / `patient-data-script.md`.
- Removed unused files: `Test.html`, `finance/index.original.html`, `apps-script/Code.gs` (superseded by `apps-script-v2/`). Kept `blog/posts/_template.html` as the reference template for new posts.
- `doc/apps-script-backend.md` — rewritten to document the modular `apps-script-v2/` backend (auth + module routing).

---

## 2026-08-09 — Fix: Apps Script backend crashed on every error response

- `apps-script-v2/utils.gs` — `json_()` called `out.setStatusCode(code)`, but `ContentService.TextOutput` has **no** `setStatusCode` method in Apps Script. Any error path (`fail_`, access-denied, login failure, finance errors) threw `TypeError: out.setStatusCode is not a function` and returned an HTML error page instead of JSON — which is why finance/login errored. Removed the call; HTTP status is now carried inside the JSON body (`code`). ⚠️ Re-paste this file into Apps Script + redeploy (New version).
- `apps-script-v2/api.gs` — the two `json_({...}, denied.code)` access-denied responses updated to embed `code` in the body to match the new signature. ⚠️ Re-paste + redeploy.
- `apps-script/Code.gs` (legacy single-file backend) — removed; superseded by the modular `apps-script-v2/` backend.

---

## 2026-08-09 — Copyright link fix + footer polish

- `js/config.js` — copyright credit link corrected to `https://aartitechservices.pages.dev` (was the broken `AartiTechService.pages.dev`).
- `css/headerfooter.css` — `.hf-copyright` font reduced to `0.75rem` (was 0.9rem), added `.hf-copyright a` styling (slate link, blue hover + underline) with matching dark-mode rules.

## 2026-08-09 — Seniority module: fix blank rows + date parsing

- `seniority/seniority-list.html` — data now filtered to drop comma-only separator rows that `skipEmptyLines:true` misses (the sheet has blank row separators); the table previously showed 4 empty rows (44 → 40 employees). `parseDate()` extended to handle the sheet's `MM/YYYY` and `YYYY` formats so date-column sorting works.
- `seniority/seniority-management.html` — promotion timeline showed `Retirement → NaN` because dates are `MM/YYYY` (e.g. `06/2026`) or `YYYY` (e.g. `1988`) and `new Date()` can't parse them. Added `parseSeniorityDate()` / `dateValue()` / `yearOf()` helpers; promotion estimates and seniority-list ordering now compute correctly (no unstable NaN sorts).

## 2026-08-09 — Footer: add back WhatsApp/Telegram icons

- `components/footer.html` — re-added WhatsApp + Telegram social icons (were removed during the privacy pass) using `{{SOCIAL_WA}}` / `{{SOCIAL_TELEGRAM}}` placeholders.
- `js/headerfooter.js` — added `{{SOCIAL_WA}}` and `{{SOCIAL_TELEGRAM}}` to the replacement map (map to `cfg.social.whatsapp` / `cfg.social.telegram`).

## 2026-08-09 — Footer: reorder columns + rebrand copyright

- `components/footer.html` — columns reordered to **QUICK LINKS | LEGAL | CONTACT**.
- `components/footer.html` + `js/config.js` — copyright rebranded to `Designed By AartiTechServices` + `© 2027`.
- `contact.html` — WhatsApp/Telegram cards are now clickable without showing the raw handles.

## 2026-08-09 — Index: heading rename, blog button, CTA background

- `index.html` — section headings renamed; "Read the blog" styled as a button; CTA background updated.
- `css/headerfooter.css` — supporting styles for the above.

## 2026-08-09 — Remove module links from header/links

- `components/header.html` — dropped HOSPITAL/SENIORITY module nav links.
- `data/links.json` — removed "Site Pages" category and module links; `links.html` content deduped.

## 2026-08-09 — Links hub redesign

- `links/index.html` (was `links.html`) — 2-column card grid layout, one collapsible card per category with zebra rows.
- `css/accordion.css` — reusable collapsible-card CSS extracted (matches the contact-page accordion look).
- `links/calculator.html`, `links/calendar.html`, `links/mp.html`, `links/myphoto.html` — moved into `links/` (from root) and converted to absolute asset paths + `/links/*` canonicals.

## 2026-08-09 — Site restructure: shared assets + finance app split

- Moved `finance/css/finance.css` → `css/finance.css`, `hospital/css/hospital.css` → `css/hospital.css`; updated all page references. Both now reuse root design tokens (no duplicate `:root`, no global `*` reset, scoped module variables).
- Moved `hospital/data/masters.json` → `data/hospital-masters.json` and `hospital/components/hospital-nav.html` → `components/hospital-nav.html`; updated references.
- Finance SPA split into separate pages (`finance/salary.html`, `finyear.html`, `loans.html`, `transactions.html`, `reports.html`, `settings.html` + split `finance/js/*`) served under `/finance/*`.
- `css/style.css` — added semantic tokens (`--success`, `--warning`, `--danger`, `--info`) + aliases (`--bg`, `--card`, `--text`, `--text-light`).

---

*Add new entries above this line with the date + files changed.*

## 2026-08-08 — Registration: add Name, Email & Mobile No. fields

- `register.html` — added **Name**, **Email** and **Mobile No.** fields with client-side validation (valid email; valid 10-digit Indian mobile starting 6-9).
- `js/auth.js` — `Auth.register()` now sends `name`, `email`, `mobile` to the backend.
- `apps-script-v2/auth.gs` — `authRegister_` validates email/mobile, rejects duplicate email/mobile, and stores them. `Users` sheet header is now `username | password | role | modules | name | email | mobile`. ⚠️ Re-paste this file into Apps Script + redeploy (New version).
- `README.md` — updated `Users` sheet docs to the 7-column table.

## 2026-08-08 — Domain fix: this site is milindweb.pages.dev

- `js/config.js` / `.env.original` — domain/url/primaryDomain/primaryUrl corrected back to **`milindweb.pages.dev`** (this repo is the MilindWeb site). The `aartitechservices.pages.dev` domain belongs to the *other* website that will reuse the shared contact form.
- `js/config.js` — `contact.siteName: 'MilindWeb'` stays; the shared backend auto-creates a `MilindWeb` sheet for this site (and an `AartiTechServices` sheet when the other site submits with its own `siteName`).
- `CONTACT-FORM-SETUP.md` — added a working example block with the live shared URL and `siteName` for the AartiTechServices site.

## 2026-08-08 — Contact backend: new deployment URL

- `js/config.js` / `.env.original` — `appsScriptUrl` updated to the new deployment: `https://script.google.com/macros/s/AKfycbyO87cybPXuwXOGBMj7OdMf8VXNPtNFW8055qcTzizXHpwIvbD_9kSBFZQIBXFHGzMs/exec`. Verified `contactSubmit` returns ok (dual-write to General + per-site sheet).

## 2026-08-08 — Contact backend: dual-write (master + per-site sheets)

- `apps-script-v2/contact.gs` — `contactSubmit_` now writes each enquiry **twice**: always to the master sheet (`General`, holds every site's data) and to a **per-site sheet** auto-created from the `site` field. Added `sanitizeSheetName_()` (valid sheet names only). Headers now `['datetime','site','module','name','mobile','email','subject','message','ip','status']`. ⚠️ Re-paste this file into Apps Script + redeploy (New version).
- `apps-script-v2/config.gs` — added `contact.masterSheet: 'General'`; `sheets` map kept as legacy fallback (site now takes priority). ⚠️ Re-paste + redeploy.
- `js/config.js` — added `contact.siteName: 'MilindWeb'` — the single per-site setting.
- `js/contact-form.js` — payload now sends `site` from `SITE_CONFIG.contact.siteName` (default `General`).
- `CONTACT-FORM-SETUP.md` — rewritten as a reuse guide: shared backend, change `siteName` per site, sheets auto-create.

## 2026-08-08 — Contact privacy: remove contact info from all pages except Contact page

- **Domain** — website is now `aartitechservices.pages.dev` (updated `js/config.js` domain/url/primaryDomain/primaryUrl and `.env.original` SITE_URL). Schema.org JSON-LD still references `cfg.url` (domain) via seo-injector.
- `js/config.js` — removed `contact.phone/phoneDisplay/phoneWA`; email replaced with obfuscated parts `emailUser: 'kmi9'` + `emailDomain: 'pm.me'` (reassembled only in JS, never in HTML source); WhatsApp `waHandle: 'makhandare'`, Telegram `tgHandle: 'itsmakk'`. `social.whatsapp/telegram` URLs updated accordingly. Removed `organization.telephone`.
- `components/footer.html` — removed the CONTACT INFO column (phone/email/location/hours) and the WhatsApp/Telegram social icons from the footer so no contact details leak on any page.
- `css/headerfooter.css` — `.hf-footer-grid` changed to `repeat(3, 1fr)` for the remaining 3 footer columns.
- `js/headerfooter.js` — dropped `{{PHONE}}`, `{{PHONE_RAW}}`, `{{PHONE_WA}}`, `{{EMAIL}}`, `{{SOCIAL_WA}}`, `{{SOCIAL_TELEGRAM}}` from the replacement map.
- `js/seo-injector.js` — removed `cfg.social.whatsapp` from `sameAs` and `organization.telephone` from the Organization schema so bots/schema scrapers don't find the handles.
- `privacy.html`, `terms.html` — Contact Us sections now link to `/contact` instead of listing email/phone.
- `blog/posts/website-for-your-business.html` — CTA box now links to `/contact` instead of phone/email/wa.me.
- `contact.html` — **only page that reveals contact info**: WhatsApp, Telegram, Email shown as click-to-reveal buttons (`@makhandare`, `@itsmakk`, `kmi9@pm.me`), plus Location. Inline email links in Privacy/Feedback cards are click-to-reveal buttons too. Info grid is now 4 columns (2 on tablet, 1 on mobile). Contact details exist only in `js/config.js` (split into parts) and are assembled client-side.

## 2026-08-08 — Calendar: grid layout matching holiday border

- `calendar.html` — replaced flex-wrap with a CSS grid: `repeat(4, 1fr)` up to 1000px so each month box fills the row edge-to-edge and always lines up with the holiday-list border. Responsive: 3 cols ≤900px, 2 cols ≤700px, 1 col ≤480px.

## 2026-08-08 — Theme fixes: dark-mode contrast + calendar width

- `calendar.html` — `.cy-month` no longer capped at `max-width: 250px`; now `min-width: 230px` with `flex-grow`, so month columns stretch to fill the full 1000px row width and align with the holiday-list border (also at 3 columns).
- `Seniariity_List.html` — `--gray` was mapped to `var(--text-secondary)` (light in dark mode) but used as button/tag *background* with white text → invisible. Now fixed `#6c757d`; dark overrides for `.filter-tag`, `.filter-tag-inactive`, `.clear-filter-btn`, text colors, and `tr:hover`.
- `calculator.html` — same `--gray` fix for `.back-button`; dark overrides for headings, results, calc-item icons, borders.
- `calendar.html` — `.cy-calendar`, `.cy-controls`, and headings now capped at `max-width: 1000px` to match the holiday-list border, so calendar months no longer overflow past the holiday list boundary.

## 2026-08-08 — Theme consistency: legacy pages now match modern design

All legacy pages updated to the modern theme (css/style.css CSS variables + light/dark mode via `js/headerfooter.js` toggle):

- `Seniariity_List.html` — added style.css + config/seo-injector; hardcoded colors → CSS variables; dark overrides for table/filter/scrollbar.
- `Seniarity_Management.html` — added modern theme + styled card layout (search, suggestions, employee details table); highlight uses accent.
- `calculator.html` — added style.css; cards/inputs/results/tables → CSS variables; dark overrides.
- `links.html` — removed old Poppins `:root`; now uses theme variables; dark mode works.
- `myphoto.html` — added style.css; album cards/controls/actions → CSS variables.
- `mp.html` — fully rebuilt: added shared header/footer, modern card UI, dark mode; errors use theme class.
- `Test.html` — fully rebuilt: added shared header/footer, modern card form, dark mode.
- `calendar.html` — design kept; added style.css + `.dark-mode` overrides so it follows the theme toggle.

## 2026-08-08 — Fix: logout crash (querySelector '#')

- `js/headerfooter.js` — smooth-scroll handlers now skip links with `href="#"` (the LOGOUT buttons). Previously `document.querySelector("#")` threw `DOMException: '#' is not a valid selector` when clicking LOGOUT.

## 2026-08-08 — Fix: CORS preflight (OPTIONS 405) on POST

- `js/api-client.js`, `js/contact-form.js`, `js/hospital-api.js` — changed `Content-Type: application/json` → `text/plain;charset=utf-8`. Google Apps Script does not answer CORS preflight OPTIONS, so `application/json` was blocked in the browser ("CORS header Access-Control-Allow-Origin missing"). `text/plain` is a simple request, no preflight, and the JSON body still parses server-side.

## 2026-08-08 — Fix: footer 4th column wrapping

- `css/headerfooter.css` — `.hf-footer-grid` changed from `repeat(3, 1fr)` to `repeat(4, 1fr)` so the CONTACT INFO column stays on the same row (footer has 4 columns).

## 2026-08-08 — Fix: SITE_CONFIG not exposed on window

- `js/config.js` — added `window.SITE_CONFIG = SITE_CONFIG;`. Fixes "API: SITE_CONFIG.appsScriptUrl is not set" error — `const` declarations don't attach to `window`, breaking `api-client.js`, `contact-form.js`, and `hospital-api.js`.

## 2026-08-08 — Legal pages + 404 (professional)

- `privacy.html` — rewritten: badge header, table of contents, 12 sections (info, usage, legal basis, sharing, storage, security, rights, cookies, children, third-party, changes, contact), consistent card styling.
- `terms.html` — rewritten: badge header, table of contents, 13 sections (acceptance, eligibility, accounts, access, acceptable use, IP, user content, privacy, disclaimers, liability, termination, changes, contact), links to privacy policy.
- `404.html` — rewritten: gradient 404, Go Home + Contact buttons, popular sections quick links.

## 2026-08-08 — Backend initial build (v1)

Created `apps-script-v2/` — modular backend:

| File | Purpose | In your Apps Script project? |
|---|---|---|
| `config.gs` | 5 spreadsheet IDs + module settings | ✅ pasted |
| `utils.gs` | Shared helpers (json, sheets, CRUD, IDs, logging) | 🔧 paste |
| `auth.gs` | Login, register, session tokens, roles | 🔧 paste |
| `api.gs` | doGet/doPost router + auth guard | 🔧 paste |
| `contact.gs` | Public contact form handler | 🔧 paste |
| `seed.gs` | One-time admin setup (`setupSeed`) | 🔧 paste + run once |

Setup notes:
- `hospital.gs`, `seniority.gs`, `finance.gs` not yet created — module logic comes later. Keep empty (comment only) in your project.
- Delete the default `Code.gs` — only `api.gs` should contain `doGet`/`doPost`.
- After pasting: run `setupSeed()` once, then Deploy (Execute as: Me, Access: Anyone).

## 2026-08-08 — Frontend: auth + index + contact

- `js/api-client.js` — new shared API client (token-aware, IIFE pattern).
- `js/auth.js` — new browser session handler (token in localStorage, login/register/logout/checkSession/hasModule).
- `login.html`, `register.html` — new auth pages.
- `index.html` — rewritten: links to all pages + auth-aware module cards.
- `components/header.html` — added LOGIN/LOGOUT buttons (desktop + mobile).
- `js/headerfooter.js` — session-aware login/logout buttons + silent token refresh.
- `js/contact-form.js` — renamed from `form-handler.js`; now posts to new backend (`contactSubmit`, no login).
- `README.md` — rewritten for modular backend + roles guide.
- `structure.md` — new; documents full site layout.
- `.env.original` — expanded reference; `APPS_SCRIPT_URL` set.
- `.gitignore` — new; protects `.env.original`, old scripts folder, `apps-script-v2/config.gs`.
- `js/config.js` — `appsScriptUrl` set to deployed URL.

---

*Add new entries above this line with the date + files changed.*
