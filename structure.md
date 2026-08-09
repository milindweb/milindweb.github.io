# Site Structure

Legend:
- **[MOD]** = module of the new modular Apps Script backend
- **[LEGACY]** = kept from the old site, independent of the new backend
- **[SHARED]** = used by every page
- **[CFG]** = configuration / credentials

## Root

```
Milindweb.github.io/
├── index.html                        [SHARED] Landing page (access-aware module cards)
├── 404.html                          [SHARED] Custom 404
├── about.html                        [SHARED] About page
├── blog.html                         [SHARED] Blog index
├── contact.html                      [SHARED] Contact page

├── links/                             [LEGACY] Links hub + tool pages (links/index.html, calculator.html, calendar.html, mp.html, myphoto.html)
├── login.html                         [SHARED] Login page
├── register.html                      [SHARED] Registration page
├── Seniariity_List.html              [LEGACY] Old seniority list page
├── Seniarity_Management.html         [LEGACY] Old seniority management page
├── Test.html                         [LEGACY] Test page
├── _headers                          [SHARED] Security + cache headers (Pages)
├── _redirects                        [SHARED] Clean-URL redirect rules
├── robots.txt                        [SHARED] Search-engine rules
├── sitemap.xml                       [SHARED] Sitemap
├── .env.original                     [CFG] ⚠️ LOCAL ONLY — all IDs/URLs/passwords (gitignored)
├── .gitignore                        [CFG] Protects secrets from being committed
├── README.md                         [SHARED] Project overview + setup guide
└── structure.md                      [SHARED] This file
```

## Apps Script backend

```
├── apps-script/                      [LEGACY] Old combined backend
│   └── Code.gs                       Hospital + Seniority in one file (base for hospital.gs)
│
├── apps-script-v2/                   [MOD] 🚧 New modular backend (built during the project)
│   ├── config.gs                     Sheet IDs + module settings          → paste into Apps Script project
│   ├── utils.gs                      Shared helpers (responses, sheets, ids, logging)
│   ├── auth.gs                       Login / logout / session tokens / roles / module access
│   ├── api.gs                        doGet/doPost router + auth guard
│   ├── hospital.gs                   Hospital business logic
│   ├── seniority.gs                  Seniority business logic
│   ├── finance.gs                    Finance business logic (ported from PFMS, uses Milind-Finance)
│   ├── finance-seed.gs               One-time CSV import (setupFinanceSeed) for Finance sheets
│   └── contact.gs                    Unified contact enquiries (one sheet per module)
```

## Frontend JS

```
├── js/
│   ├── config.js                     [SHARED][CFG] Branding + appsScriptUrl (frontend config)
│   ├── headerfooter.js               [SHARED] Loads header/footer + dark-mode toggle
│   ├── seo-injector.js               [SHARED] Title/description/canonical injection
│   ├── contact-form.js               [SHARED] Contact form → Apps Script
│   ├── api-client.js                 [MOD] Shared API client (token-aware)
│   ├── auth.js                       [MOD] Login/logout/session in browser (localStorage token)
│   ├── hospital-api.js               [MOD] Client for the Apps Script backend (Hospital)
│   ├── finance-api.js                [MOD] Client for the Finance module (token + module guard)
│   ├── blog.js                       [SHARED] Blog rendering
│   └── blog-sidebar.js               [SHARED] Blog sidebar rendering
```

## Shared components & assets

```
├── components/
│   ├── contactform.html              [SHARED] Contact form partial (injected by 6 pages)
│   ├── header.html                   [SHARED] Header ({{PLACEHOLDER}} template) — gets Login/Logout
│   ├── footer.html                   [SHARED] Footer
│   └── hospital-nav.html             [MOD] Hospital sub-nav partial (injected by hospital-nav.js)
├── css/
│   ├── style.css                     [SHARED] Base variables + base styles (design tokens)
│   ├── headerfooter.css              [SHARED] Header/footer styling
│   ├── finance.css                   [MOD] Finance module styling (reuses root tokens)
│   ├── hospital.css                  [MOD] Hospital module styling (reuses root tokens)
│   ├── nadstyle.css                  [LEGACY] Old NAD-style theme (used by legacy pages)
│   └── blog-sidebar.css              [SHARED] Blog sidebar styling
├── fonts/                            [SHARED] Font Awesome, Bootstrap Icons, legacy fonts
├── img/                              [SHARED] Logos, slides, team, services, blog images
└── data/                             [SHARED] Static JSON data
    ├── links.json                    Links hub + resources
    ├── hospital-masters.json         Fallback departments + doctors
    ├── holidays.json                 NAD holiday calendar
    └── (complaint, dept, drname, investigations, labtest, medicines, medlist, symptoms, posts, categories)
```

## Modules (pages)

```
├── hospital/                         [MOD] Hospital Management
│   ├── dashboard.html                Stats + recent visits
│   ├── new-visit.html                Full OPD visit form (patient → billing)
│   ├── patient-list.html             Search + paginated patient list
│   ├── patient-profile.html          Patient detail + visit history
│   ├── appointments.html             Book / complete / cancel appointments
│   └── js/hospital-nav.js            Injects the sub-nav (from /components/hospital-nav.html)
│
├── seniority/                        [MOD] Seniority Management
│   ├── seniority-list.html           (served at /seniority)
│   └── seniority-management.html     (served at /seniority/manage)
│
└── finance/                          [MOD] Finance Management (served at /finance)
    ├── index.html                    Dashboard (served at /finance)
    ├── salary.html                   Monthly salary (served at /finance/salary)
    ├── finyear.html                  Fin. year summary (served at /finance/finyear)
    ├── loans.html                    Loans & insurance (served at /finance/loans)
    ├── transactions.html             Major transactions (served at /finance/transactions)
    ├── reports.html                  Reports & utilities (served at /finance/reports)
    ├── settings.html                 Settings (served at /finance/settings)
    ├── index.original.html           ⚠️ Pre-split backup (do not deploy)
    └── js/                           Split module scripts (finance-*.js)
```

## Old apps-script backups (NOT part of the site)

```
├── PFMS/                              [LEGACY] Raw Payroll & Financial Management System source files (NOT deployed — used as input to build the finance module)
│   ├── index.html                     Old single-file PFMS app
│   ├── code.gs                        Old Apps Script backend
│   ├── salary_monthly.csv             Salary data
│   ├── finyear_summary.csv            Fin-year summary data
│   ├── loans_insurance.csv            Loans & insurance data
│   ├── major_transactions.csv         Major transactions data
│   ├── Excel data.txt                 Source export
│   ├── prompt.md                      Build notes
│   └── .env                           ⚠️ local only
│
├── my old app scripts /              [LEGACY] ⚠️ gitignored — contains real sheet IDs & passwords
│   ├── Contactcform.md               Old contact form doPost
│   ├── patientdsaat.md               Old patient data script (read/update)
│   ├── Personal Finance Management System.json   Old PFMS (salary engine to reuse)
│   ├── DriveFetch.json               Drive + Sheet search API
│   ├── Wedding Album Script.json     Drive photo album API
│   └── employeedata.md               Hide-unused-rows helper
```
