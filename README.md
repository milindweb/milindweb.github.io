# Milind Web — Static Site + Modular Google Apps Script Backend

A free, self-hosted site with a **modular backend built on Google Apps Script + Google Sheets**.

- **Hosting:** Cloudflare Pages (free) — or any static host (GitHub Pages, Netlify, etc.)
- **Database:** Google Sheets (free), one spreadsheet **per module**
- **Backend:** ONE Google Apps Script web app with one `.gs` file per module
- **No backend server, no Supabase, no paid services**
- **Auth:** simple username/password login with persistent sessions + per-module access

> ⚠️ `.env.original` holds all spreadsheet IDs, script URLs and passwords.
> It is **local-only** (see `.gitignore`) — never commit it to GitHub.

---

## Architecture

```
        Static site (Cloudflare Pages)
        ┌───────────┬───────────┬───────────┬───────────┐
        │  Hospital │ Seniority │  Finance  │  Contact  │   ...future modules
        └─────┬─────┴─────┬─────┴─────┬─────┴─────┬─────┘
              │           │           │           │
              └───── ONE Google Apps Script web app ─────┐
                    config.gs  utils.gs  auth.gs  api.gs
                    hospital.gs  seniority.gs  finance.gs  contact.gs
              ┌──────────┼──────────┼──────────┼──────────┐
        Google Sheets:   │          │          │          │
        Milind-Auth  Milind-Hospital Milind-Seniority Milind-Finance Milind-Contacts
```

- **One spreadsheet per module** (Auth, Hospital, Seniority, Finance, Contacts).
- **One Apps Script project** attached to the Auth spreadsheet, containing all module files.
- Shared code lives in `config.gs` (settings/IDs), `utils.gs` (helpers), `auth.gs` (login/sessions/roles), and `api.gs` (router + auth guard).
- Each module file (e.g. `hospital.gs`) contains **only** that module's business logic.
- **Adding a future module** = create one new sheet + one new `.gs` file + one route line. Auth/sessions/errors/logging are reused automatically.

---

## Spreadsheets (the database)

| Spreadsheet | Sheets auto-created by code |
|---|---|
| **Milind-Auth** | `Users` (username, password, role, modules), `Sessions` (token, username, role, created) |
| **Milind-Hospital** | `patients`, `visits`, `appointments`, `departments`, `doctors`, `billing_items`, … + `_meta` |
| **Milind-Seniority** | `employees` (or imported list), `_meta` |
| **Milind-Finance** | `Users`-independent; `Salary_Monthly`, `Salary_Verify`, `FinYear_Summary`, `Loans_Insurance`, `Major_Transactions`, `Settings` |
| **Milind-Contacts** | one sheet **per module**: `Hospital`, `Seniority`, `Finance`, `General` |

Leave spreadsheets **blank** — the code creates sheets and headers on first use.

---

## What's inside

```
├── index.html                      Landing page (access-aware module cards)
├── login.html  register.html       Auth pages (planned)
├── hospital/                       Hospital Management module
│   ├── dashboard.html  new-visit.html  patient-list.html
│   ├── patient-profile.html  appointments.html
│   ├── components/hospital-nav.html  js/hospital-nav.js  css/hospital.css
│   └── data/masters.json           Fallback departments + doctors
├── seniority/                      Seniority module pages
│   ├── seniority-list.html
│   └── seniority-management.html
├── finance/                        Finance Management module (served at /finance)
│   └── index.html                  PFMS-style SPA: monthly salary, fin-year, loans & insurance, transactions
├── apps-script/                    ⚙️ Old combined Code.gs (reference/base for hospital.gs)
├── js/
│   ├── config.js                   ⚙️ ALL branding + appsScriptUrl (frontend config)
│   ├── api-client.js  auth.js      Shared API client + browser session (token in localStorage)
│   ├── hospital-api.js             Client for the Apps Script backend
│   ├── finance-api.js              Client for the Finance module (token + module guard)
│   ├── headerfooter.js             Loads shared header/footer + theme toggle
│   ├── seo-injector.js             Title/description/canonical injection
│   ├── contact-form.js         Contact form → Apps Script
│   ├── blog.js  blog-sidebar.js
├── components/header.html  footer.html   Shared header + footer ({{PLACEHOLDER}})
├── css/  fonts/  img/  data/       Shared assets + static JSON data
├── blog/                           Blog posts + template
├── calculator.html  calendar.html  links.html  mp.html  myphoto.html
│   ├── Seniariity_List.html  Seniarity_Management.html  Test.html   (legacy pages)
├── _redirects  _headers           Clean URLs + security headers
├── sitemap.xml  robots.txt
└── .env.original                  ⚙️ LOCAL ONLY — all IDs/URLs/passwords (gitignored)
```

---

## Setup — new backend (one-time)

### 1. Create the spreadsheets in Google Drive
Create 5 empty Google Sheets: `Milind-Auth`, `Milind-Hospital`, `Milind-Seniority`, `Milind-Finance`, `Milind-Contacts`.
Copy their IDs (from URL: `/spreadsheets/d/<ID>/edit`) into `.env.original`.

### 2. Create ONE Apps Script project
1. Open **Milind-Auth** → **Extensions → Apps Script**.
2. Add 9 files via **+ → Script**: `config.gs`, `utils.gs`, `auth.gs`, `api.gs`, `hospital.gs`, `seniority.gs`, `finance.gs`, `finance-seed.gs`, `contact.gs`.
3. Paste the corresponding code into each (from `apps-script-v2/` in this repo — generated during the build).

### 3. Configure `config.gs`
```js
var CONFIG = {
  authSheetId:      '<Milind-Auth ID>',
  hospitalSheetId:  '<Milind-Hospital ID>',
  senioritySheetId: '<Milind-Seniority ID>',
  financeSheetId:   '<Milind-Finance ID>',
  contactSheetId:   '<Milind-Contacts ID>',
};
```

### 4. Deploy the web app
1. **Deploy → New deployment → Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
2. Copy the **/exec** URL.
3. Paste it into `js/config.js` → `appsScriptUrl`.

### 5. Seed the Finance data (once)
Run `setupFinanceSeed()` from the Apps Script editor (**Run ▶ setupFinanceSeed**).
It creates the `Milind-Finance` sheets and imports the legacy PFMS data
(salary slips, loans & insurance, major transactions, financial year summaries).
Safe to re-run — matching rows are updated, not duplicated.

---

## Auth & roles (simple)

- **Login** → server checks `Users` sheet → issues a **session token** (stored in `Sessions` sheet).
- **Browser** keeps only the token (localStorage) — no password stored client-side.
- **Persistent:** once logged in on a PC, stays logged in until **Logout** (which invalidates the token).
- **Register:** creates a `user` with **no module access** (can browse the general site).

### Manage roles — no coding, just edit the sheet

1. Open the **Milind-Auth** spreadsheet → **`Users`** tab.
2. It's a 7-column table:

| username | password | role   | modules                                   | name | email | mobile |
|----------|----------|--------|-------------------------------------------|------|-------|--------|
| admin    | admin123 | admin  | hospital, seniority, finance, contact     | Admin | admin@example.com | 98xxxxxx75 |
| rahul    | rahul123 | user   | hospital:admin, seniority                  | Rahul | rahul@example.com | 98xxxxxx76 |
| priya    | priya123 | user   | finance:admin, hospital:admin              | Priya | priya@example.com | 98xxxxxx77 |
| sonam    | sonam123 | user   | hospital, seniority, finance, contact      | Sonam | sonam@example.com | 98xxxxxx78 |

| Column | What to type | Example |
|---|---|---|
| `username` | login name | `rahul` |
| `password` | login password (plain) | `rahul123` |
| `role` | `admin` = everything, or `user` = only what's in `modules` | `user` |
| `modules` | comma-separated module list | `hospital:admin, seniority` |
| `name` | full name (filled at registration) | `Rahul` |
| `email` | email address (filled at registration) | `rahul@example.com` |
| `mobile` | 10-digit mobile number (filled at registration) | `9876543210` |

### `modules` column cheat sheet

| You type in `modules` | User gets |
|---|---|
| *(empty)* | **No module access** (only general site) |
| `hospital` | Read Hospital |
| `hospital, seniority` | Read Hospital + Seniority |
| `hospital:admin` | **Admin** of Hospital (read + write) |
| `finance:admin, hospital:admin` | **Admin of 2 modules** |
| `hospital:admin, seniority, finance` | Admin of Hospital, read Seniority + Finance |

- `module` = **read only**
- `module:admin` = **read + write** (manage that module)
- `role = admin` = **global**, sees everything (the `modules` column is then ignored)

### Everyday tasks (manual edits)

- **Make a user a Hospital admin:** edit their `modules` cell → type `hospital:admin`
- **Give 3 modules with 1 admin:** `seniority:admin, hospital, finance`
- **Remove all access:** clear the `modules` cell (empty) — they can still browse the site
- **Make someone global admin:** change `role` from `user` → `admin`

### Important notes

- Changes take effect **immediately** — access is re-checked on every API call. No redeploy, no logout needed.
- **Registration always creates** `role=user` + empty `modules` → new users get nothing until you edit their row.
- The **`Sessions`** tab is auto-managed by the code (tokens) — **do not edit it**.

---

## Module build status

| Module | Backend (.gs) | Frontend | Status |
|---|---|---|---|
| Auth | `auth.gs` + `api.gs` | `login.html`, `register.html`, header buttons | ✅ live |
| Contact | `contact.gs` | existing contact form (updated) | ✅ live |
| Hospital | `hospital.gs` (from `apps-script/Code.gs`) | existing `hospital/` pages | 🔨 planned |
| Seniority | `seniority.gs` | existing `seniority/` pages | 🔨 planned |
| Finance | `finance.gs` + `finance-seed.gs` (from PFMS engine) | `finance/index.html` at `/finance` | 🔨 code ready — **not deployed yet** (files not pasted into Apps Script; `setupFinanceSeed()` not run) |

---

## Legacy pages (kept, independent)

- `calculator.html`, `calendar.html`, `links.html`, `mp.html`, `myphoto.html`
- `Seniariity_List.html`, `Seniarity_Management.html`, `Test.html`
- Old apps-script backups live in `my old app scripts /` (gitignored — contains real sheet IDs and passwords)

These are separate from the new modular backend and work as-is.

---

## Editing branding / contact details

Everything is in `js/config.js`: site name, tagline, phone, email, social links, domain and the Apps Script URL.

## Notes

- The Apps Script web app is public by design (access = Anyone). Auth tokens gate module data; treat the endpoint like a public API and avoid storing highly sensitive data.
- Tables are sheets; a `_meta` sheet holds ID counters. Patient UHIDs auto-generate as `PAT-YYYY-####`.
- Designed for easy future migration to Supabase/MySQL: each module's data access is isolated in its own `.gs` file behind a common API layer.
