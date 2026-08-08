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
├── contactform.html                  [SHARED] Contact form partial (injected)
├── links.html                        [LEGACY] Links page (kept)
├── calculator.html                   [LEGACY] Calculator tool (kept)
├── calendar.html                     [LEGACY] Calendar tool (kept)
├── mp.html                           [LEGACY] My Portal — Drive/Sheet search (kept)
├── myphoto.html                      [LEGACY] Photo album viewer (kept)
├── portfolio.html                    [SHARED] Portfolio page
├── privacy.html                      [SHARED] Privacy policy
├── terms.html                        [SHARED] Terms
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
│   ├── finance.gs                    Finance business logic
│   └── contact.gs                    Unified contact enquiries (one sheet per module)
```

## Frontend JS

```
├── js/
│   ├── config.js                     [SHARED][CFG] Branding + appsScriptUrl (frontend config)
│   ├── headerfooter.js               [SHARED] Loads header/footer + dark-mode toggle
│   ├── seo-injector.js               [SHARED] Title/description/canonical injection
│   ├── contact-form.js               [SHARED] Contact form → Apps Script
│   ├── hospital-api.js               [MOD] Client for the Apps Script backend (Hospital)
│   ├── blog.js                       [SHARED] Blog rendering
│   └── blog-sidebar.js               [SHARED] Blog sidebar rendering
│
│   🚧 to be added:
│   ├── api-client.js                 [MOD] Shared API client (token-aware)
│   ├── auth.js                       [MOD] Login/logout/session in browser (localStorage token)
│   └── module-access.js              [MOD] Hides/show module nav by user access
```

## Shared components & assets

```
├── components/
│   ├── header.html                   [SHARED] Header ({{PLACEHOLDER}} template) — gets Login/Logout
│   └── footer.html                   [SHARED] Footer
├── css/
│   ├── style.css                     [SHARED] Base variables + base styles
│   ├── headerfooter.css              [SHARED] Header/footer styling
│   ├── nadstyle.css                  [LEGACY] Old NAD-style theme (used by legacy pages)
│   └── blog-sidebar.css              [SHARED] Blog sidebar styling
├── fonts/                            [SHARED] Font Awesome, Bootstrap Icons, legacy fonts
├── img/                              [SHARED] Logos, slides, team, services, blog images
└── data/                             [SHARED] Static JSON data
```

## Modules (pages)

```
├── hospital/                         [MOD] Hospital Management
│   ├── index.html                    Minimal redirect/landing
│   ├── dashboard.html                Stats + recent visits
│   ├── new-visit.html                Full OPD visit form (patient → billing)
│   ├── patient-list.html             Search + paginated patient list
│   ├── patient-profile.html          Patient detail + visit history
│   ├── appointments.html             Book / complete / cancel appointments
│   ├── components/hospital-nav.html  Hospital sub-nav
│   ├── js/hospital-nav.js            Injects the sub-nav
│   ├── css/hospital.css              Module styling
│   └── data/masters.json             Fallback departments + doctors
│
├── seniority/                        [MOD] Seniority Management
│   ├── seniority-list.html           (served at /seniority)
│   └── seniority-management.html     (served at /seniority/manage)
│
└── finance/                          [MOD] 🚧 planned
    └── dashboard.html  salary.html  loans.html  …  (from old PFMS engine)
```

## Old apps-script backups (NOT part of the site)

```
├── my old app scripts /              [LEGACY] ⚠️ gitignored — contains real sheet IDs & passwords
│   ├── Contactcform.md               Old contact form doPost
│   ├── patientdsaat.md               Old patient data script (read/update)
│   ├── Personal Finance Management System.json   Old PFMS (salary engine to reuse)
│   ├── DriveFetch.json               Drive + Sheet search API
│   ├── Wedding Album Script.json     Drive photo album API
│   └── employeedata.md               Hide-unused-rows helper
```
