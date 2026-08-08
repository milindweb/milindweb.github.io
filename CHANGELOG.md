# MilindWeb — CHANGELOG

> Tracks all changes to this project (site + backend).
>
> **Backend rule:** whenever a `.gs` file in `apps-script-v2/` changes, re-paste
> it into your Google Apps Script project (Milind-Auth → Extensions → Apps Script)
> and re-deploy (Deploy → Manage deployments → Edit → New version → Deploy).

Format: `YYYY-MM-DD — [Area] File: what changed`

---

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
