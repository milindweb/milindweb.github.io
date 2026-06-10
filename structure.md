# MK9 PROJECT STRUCTURE

## Architecture

Frontend : GitHub + Cloudflare Pages + mk9.in
Backend  : Supabase Edge Functions (JavaScript/TypeScript)
Database : Supabase PostgreSQL (via `backend/schema/` + `backend/migrations/`)
Storage  : Supabase Storage (via client SDK)
Auth     : Supabase Auth (Login / Registration / Forgot Password / Reset Password)

## Future Subdomains

mk9.in                → Main Portal (deployed from `frontend/`)
blog.mk9.in           → Blog Module
society.mk9.in        → Society Management
seniority.mk9.in      → Seniority Management
hospital.mk9.in       → Hospital Management
admin.mk9.in          → Admin Panel

## Repository Structure

mk9/
│
├── README.md
├── CHANGELOG.md
├── LICENSE
├── .gitignore
├── .env.example
├── .env.local (⚠️ DO NOT COMMIT)
├── package.json
├── package-lock.json
│
├── supabase/
│   │
│   ├── config.toml
│   │
│   └── functions/
│       │
│       ├── auth-handler/
│       │   └── index.ts
│       │
│       ├── blog-posts/
│       │   └── index.ts
│       │
│       ├── blog-comments/
│       │   └── index.ts
│       │
│       ├── hospital-appointments/
│       │   └── index.ts
│       │
│       ├── hospital-doctors/
│       │   └── index.ts
│       │
│       ├── society-groups/
│       │   └── index.ts
│       │
│       ├── society-posts/
│       │   └── index.ts
│       │
│       ├── seniority-records/
│       │   └── index.ts
│       │
│       ├── seniority-promotions/
│       │   └── index.ts
│       │
│       ├── admin-audit/
│       │   └── index.ts
│       │
│       └── admin-settings/
│           └── index.ts
│
├── docs/
│   │
│   ├── SRS/
│   │   ├── website-srs.md
│   │   ├── blog-srs.md
│   │   ├── hospital-srs.md
│   │   ├── society-srs.md
│   │   └── seniority-srs.md
│   │
│   ├── DATABASE/
│   │   ├── database-design.md
│   │   ├── er-diagram.md
│   │   └── schema-notes.md
│   │
│   ├── API/
│   │   └── api-documentation.md
│   │
│   ├── DEPLOYMENT.md
│   └── ROADMAP.md
│
├── frontend/
│   │
│   ├── package.json
│   ├── .env.example
│   ├── .env.local (⚠️ DO NOT COMMIT)
│   ├── .htaccess                ↤ Apache security & caching
│   ├── _headers                 ↤ Cloudflare headers & caching
│   ├── _redirects               ↤ Cloudflare URL rewrites
│   │
│   ├── index.html
│   │
│   ├── pages/
│   │   │
│   │   ├── about.html
│   │   ├── contact.html
│   │   ├── contactform.html
│   │   ├── blog.html
│   │   ├── links.html
│   │   ├── login.html
│   │   ├── register.html
│   │   ├── forgot-password.html
│   │   │
│   │   └── services/
│   │       │
│   │       ├── freelance_seo_consultant.html
│   │       ├── website-tech-solutions.html
│   │       ├── project-training.html
│   │       ├── graphics.html
│   │       ├── electrical.html
│   │       ├── automotive.html
│   │       └── future-services.html
│   │
│   ├── modules/
│   │   │
│   │   ├── blog/
│   │   │   ├── pages/
│   │   │   ├── components/
│   │   │   ├── css/
│   │   │   └── js/
│   │   │
│   │   ├── hospital/
│   │   │   ├── pages/
│   │   │   ├── components/
│   │   │   ├── css/
│   │   │   └── js/
│   │   │
│   │   ├── society/
│   │   │   ├── pages/
│   │   │   ├── components/
│   │   │   ├── css/
│   │   │   └── js/
│   │   │
│   │   ├── seniority/
│   │   │   ├── pages/
│   │   │   ├── components/
│   │   │   ├── css/
│   │   │   └── js/
│   │   │
│   │   └── admin/
│   │       ├── pages/
│   │       ├── components/
│   │       ├── css/
│   │       └── js/
│   │
│   ├── shared/
│   │   │
│   │   ├── components/
│   │   │   ├── header.html
│   │   │   ├── footer.html
│   │   │   ├── navbar.html
│   │   │   ├── sidebar.html
│   │   │   └── loader.html
│   │   │
│   │   ├── css/
│   │   │   ├── style.css          # Shared base styles (variables, utilities, cards, buttons, animations) — load before headerfooter.css & page CSS
│   │   │   ├── headerfooter.css
│   │   │   ├── variables.css
│   │   │   └── responsive.css
│   │   │
│   │   ├── js/
│   │   │   ├── config.js           # Centralized site config (brand, domain, contact, social) — one file to rule all
│   │   │   ├── seo-injector.js     # Reads config + per-page PAGE_CONFIG; injects <title>, meta, OG, Twitter, JSON-LD
│   │   │   ├── app.js
│   │   │   ├── auth.js
│   │   │   ├── navbar.js
│   │   │   ├── headerfooter.js     # Loads header/footer HTML + replaces {{PLACEHOLDERS}} from config.js
│   │   │   ├── form-handler.js
│   │   │   └── utils.js
│   │   │
│   │   └── assets/
│   │       ├── img/
│   │       │   ├── og-default.svg
│   │       │   └── graphics/
│   │       │       ├── birthday.svg
│   │       │       ├── wedding.svg
│   │       │       ├── logo.svg
│   │       │       └── video.svg
│   │       ├── icons/
│   │       ├── fonts/
│   │       └── data/
│   │
│   ├── services/
│   │   │
│   │   ├── supabaseClient.js
│   │   ├── api.js
│   │   ├── authService.js
│   │   ├── blogService.js
│   │   ├── hospitalService.js
│   │   ├── societyService.js
│   │   ├── seniorityService.js
│   │   ├── storageService.js
│   │   └── adminService.js
│   │
│   └── config/
│       ├── supabase.js
│       ├── env.js
│       ├── routes.js
│       └── constants.js
│
├── backend/
│   │
│   ├── .env.example
│   ├── .env.local (⚠️ DO NOT COMMIT)
│   │
│   ├── schema/
│   │   ├── schema.sql
│   │   ├── database-design.md
│   │   └── rls-policies.sql
│   │
│   ├── seed/
│   │   ├── seed.sql
│   │   └── seed-data.json
│   │
│   ├── migrations/
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_blog_module.sql
│   │   ├── 003_hospital_module.sql
│   │   ├── 004_society_module.sql
│   │   ├── 005_seniority_module.sql
│   │   └── migration-status.md
│   │
│   ├── modules/
│   │   │
│   │   ├── auth/
│   │   │   ├── schema/
│   │   │   │   └── auth-schema.sql
│   │   │   └── policies/
│   │   │       └── auth-policies.sql
│   │   │
│   │   ├── blog/
│   │   │   ├── schema/
│   │   │   │   └── blog-schema.sql
│   │   │   ├── policies/
│   │   │   │   └── blog-policies.sql
│   │   │   └── seed/
│   │   │       └── blog-seed.sql
│   │   │
│   │   ├── hospital/
│   │   │   ├── schema/
│   │   │   │   └── hospital-schema.sql
│   │   │   ├── policies/
│   │   │   │   └── hospital-policies.sql
│   │   │   └── seed/
│   │   │       └── hospital-seed.sql
│   │   │
│   │   ├── society/
│   │   │   ├── schema/
│   │   │   │   └── society-schema.sql
│   │   │   ├── policies/
│   │   │   │   └── society-policies.sql
│   │   │   └── seed/
│   │   │       └── society-seed.sql
│   │   │
│   │   ├── seniority/
│   │   │   ├── schema/
│   │   │   │   └── seniority-schema.sql
│   │   │   ├── policies/
│   │   │   │   └── seniority-policies.sql
│   │   │   └── seed/
│   │   │       └── seniority-seed.sql
│   │   │
│   │   └── admin/
│   │       ├── schema/
│   │       │   └── admin-schema.sql
│   │       └── policies/
│   │           └── admin-policies.sql
│   │
│   ├── shared/
│   │   │
│   │   ├── config/
│   │   │   ├── supabase-config.ts
│   │   │   └── constants.ts
│   │   │
│   │   ├── middleware/
│   │   │   ├── auth-middleware.ts
│   │   │   ├── rate-limit.ts
│   │   │   └── error-handler.ts
│   │   │
│   │   ├── utils/
│   │   │   ├── validators.ts
│   │   │   ├── formatters.ts
│   │   │   ├── logger.ts
│   │   │   └── helpers.ts
│   │   │
│   │   └── types/
│   │       ├── index.ts
│   │       ├── database.ts
│   │       └── api.ts
│   │
│   └── scripts/
│       ├── backup.sh
│       ├── deploy.sh
│       ├── setup.sh
│       └── reset-db.sh
│
├── storage/
│   │
│   ├── blog/
│   │   └── featured/
│   ├── hospital/
│   │   ├── documents/
│   │   └── prescriptions/
│   ├── society/
│   ├── seniority/
│   ├── documents/
│   ├── reports/
│   └── templates/
│
├── .github/
│   └── workflows/
│       ├── deploy-frontend.yml
│       └── deploy-functions.yml
│
└── (scripts/ at root removed — use backend/scripts/ instead)

## Key Files & Configuration

### Root Level
- **package.json** - Project dependencies & scripts (includes `supabase` CLI)
- **.env.example** - Template for environment variables (version control safe)
- **.env.local** - Actual secrets & keys (⚠️ add to .gitignore)
- **.gitignore** - Prevent node_modules, .env.local, build files from repo

### Supabase (Edge Functions)
- **supabase/config.toml** - Project ID, function settings, auth config
- **supabase/functions/<name>/index.ts** - Each Edge Function as a standalone module
- Functions are named `{module}-{entity}` (e.g., `blog-posts`)
- Deploy with: `supabase functions deploy <name>`

### Cloudflare Pages
- **frontend/_redirects** - URL rewrites for clean paths (see file for full rules)
- **frontend/_headers** - Security headers and cache control
  ```
  /           /pages/index.html   200
  /about      /pages/about.html   200
  /contact    /pages/contact.html 200
  /blog       /pages/blog.html    200
  /login      /pages/login.html   200
  /seo-digital-marketing  /pages/services/freelance_seo_consultant.html  200
  /website-development    /pages/services/website-tech-solutions.html    200
  /project-training       /pages/services/project-training.html          200
  /graphics-branding      /pages/services/graphics.html                 200
  /electrical             /pages/services/electrical.html                200
  /automotive             /pages/services/automotive.html                200
  /workshop.html          /pages/services/project-training.html          301
  ...
  ```
- Publish directory: `frontend/`
- No build step required for static HTML

### Site Configuration (Centralized)
- **frontend/shared/js/config.js** — Single source of truth: brand name, domain, contact info, social links, OG image path
- **frontend/shared/js/seo-injector.js** — Reads `SITE_CONFIG` + per-page `PAGE_CONFIG`; dynamically generates `<title>`, all meta/OG/Twitter tags, canonical URL, and JSON-LD (Organization + BreadcrumbList)
- **Each HTML page** defines only a small `PAGE_CONFIG = { title, description, canonical }` block — no hardcoded meta tags
- **header.html / footer.html** — Use `{{PLACEHOLDER}}` syntax (e.g., `{{SITE_NAME_UPPER}}`, `{{PHONE}}`, `{{SOCIAL_WA}}`); replaced at runtime by `headerfooter.js` using values from `config.js`
- Change brand name, domain, phone, email, or social links in **one file** (`config.js`) and it propagates to every page, header, footer, and JSON-LD automatically
- Static XML/text files (`sitemap.xml`, `robots.txt`) still require manual domain updates

### Frontend Config
- **frontend/config/supabase.js** - Supabase client initialization with ANON_KEY
- **frontend/services/authService.js** - Auth operations (login, register, logout)
- **frontend/services/supabaseClient.js** - Shared Supabase client instance

### Backend Schema
- **backend/schema/schema.sql** - Core tables, indexes, RLS policies
- **backend/schema/rls-policies.sql** - Detailed row-level security documentation
- **backend/seed/seed.sql** - Initial data for categories, departments, groups
- **backend/migrations/** - Versioned database changes

## Navigation Menu

Home
About
Services
Blog
Login

## Services Menu

Digital Marketing & SEO
Website & Software Development
College Projects & Training
Graphics, Photography & Branding
Electrical Services
Automotive Services

## Future Services

Any future service should be added as a new page inside:

frontend/pages/services/

No CSS modification should be required.
The service card layout must be reusable and data-driven.

## Future Modules

Blog Module
Hospital Management
Society Management
Seniority Management
Admin Panel

To add a new module:

  1. Create `frontend/modules/<name>/` (pages/, components/, css/, js/)
  2. Create `supabase/functions/<name>-*/index.ts` for each edge function
  3. Create `backend/modules/<name>/` (schema/, policies/, seed/)
  4. Add migration file in `backend/migrations/`
  5. Register routes in `frontend/config/routes.js`

All future modules should use:

* Supabase Auth
* Supabase PostgreSQL
* Supabase Storage
* Supabase Edge Functions

without changing the main architecture.
