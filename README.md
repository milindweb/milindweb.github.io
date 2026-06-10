# MilindWeb (MK9)

Multi-service business portal with static HTML/CSS/JS frontend, Supabase backend, and Cloudflare Pages hosting.

## Tech Stack

- **Frontend:** HTML5, CSS3 (custom properties, dark/light mode), JavaScript (ES6 modules)
- **Hosting:** Cloudflare Pages (static, no build step)
- **Backend:** Supabase Edge Functions (TypeScript/Deno)
- **Database:** Supabase PostgreSQL with Row Level Security
- **Auth:** Supabase Auth (email/password, magic link, OAuth)
- **Storage:** Supabase Storage
- **CDN:** Font Awesome 6.4, PapaParse, SheetJS, jsPDF, jsPDF-AutoTable

## Project Structure

```
├── frontend/              # Static website (Cloudflare Pages)
│   ├── index.html         # Homepage
│   ├── pages/             # Site pages
│   │   ├── blog.html
│   │   ├── contact.html
│   │   └── services/      # 8 service pages
│   ├── modules/           # Business domain modules
│   │   └── seniority/     # Seniority management
│   ├── services/          # API service classes
│   └── shared/            # Shared components, CSS, JS, assets
│       └── js/
│           ├── config.js        # Centralized site config (brand, domain, contact)
│           └── seo-injector.js  # Dynamic SEO meta tag injection
├── backend/               # Database schema & configuration
│   ├── schema/            # Full DB schema, RLS policies, docs
│   └── seed/              # Seed data
├── supabase/
│   └── functions/         # Edge Functions
│       └── blog-posts/    # Blog CRUD API
```

## Features

### Implemented
- **Homepage** with hero, service cards, premium services, team section
- **6 Service Pages:** Digital Marketing & SEO, Web & Software Development, College Projects & Training, Graphics/Photography & Branding, Electrical, Automotive
- **Centralized Configuration** (`shared/js/config.js`) — brand name, domain, contact, social links in one file
- **Dynamic SEO Injection** — titles, meta, OG/Twitter tags, JSON-LD generated from config at runtime
- **Blog System** with Supabase-powered listing, search, categories, tags
- **Seniority Management** module with CSV/Excel/PDF export
- **Contact Form** integrated with Google Apps Script, dynamically loaded per-page (no labels, placeholders only)
- **Shared component classes** (`p-*`) in `style.css` — consistent dark gradient hero, white cards, blue gradient icons across all service pages
- **Dark/Light Theme** toggle with localStorage persistence
- **Responsive Design** with mobile hamburger navigation
- **SEO:** robots.txt, sitemap.xml, dynamic Open Graph / JSON-LD

### Planned
- Full blog CRUD with comments
- Hospital management (departments, doctors, appointments)
- Society management (groups, members, events)
- Admin panel (settings, audit logs, user management)
- Authentication (login, register, password reset)
- Additional Supabase Edge Functions (auth, comments, hospital, society, etc.)
- Automated sitemap generation

## Getting Started

1. Clone the repo
2. Edit `frontend/shared/js/config.js` with your brand name, domain, and contact info
3. Configure `backend/.env.example` with your Supabase project credentials
4. Run `backend/schema/schema.sql` against your Supabase database
5. Deploy the `frontend/` directory to Cloudflare Pages
6. Deploy Edge Functions from `supabase/functions/`
