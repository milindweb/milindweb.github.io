# Deployment

## Architecture

```
Frontend → GitHub → Cloudflare Pages → mk9.in
Backend  → Supabase Edge Functions (Deno/TypeScript)
Database → Supabase PostgreSQL
Auth     → Supabase Auth
Storage  → Supabase Storage
```

## Frontend (Cloudflare Pages)

### Build Settings
- **Framework preset:** None (static HTML/CSS/JS)
- **Build command:** None
- **Build output:** `frontend/`
- **Root directory:** `frontend/`

### Configuration Files
| File | Purpose |
|------|---------|
| `frontend/_headers` | Security headers & cache rules |
| `frontend/_redirects` | Clean URL rewrites (e.g. `/seo-digital-marketing` → `/pages/services/...`) |

### Site Configuration
All branding, domain, contact, and SEO values are centralized in:
- **`frontend/shared/js/config.js`** — Change brand name, domain, phone, social links, etc. here
- **`frontend/shared/js/seo-injector.js`** — Reads config + per-page PAGE_CONFIG to inject meta tags at runtime

No build step is required — updates to `config.js` take effect immediately on next deploy.

**Note:** `sitemap.xml` and `robots.txt` are static files and must be updated manually when the domain changes.

### Deployment Steps
1. Push changes to the GitHub repository
2. Cloudflare Pages auto-deploys from the configured branch
3. Site is live at `https://mk9.in`

### DNS
- Domain: `mk9.in`
- Managed via Cloudflare DNS (proxied through Cloudflare)

## Backend (Supabase)

### Edge Functions
```bash
supabase functions deploy blog-posts
supabase functions deploy <function-name>
```

### Database Migrations
```bash
supabase db push
```

### Environment Variables
- Copy `backend/.env.example` → `.env.local`
- Set `SITE_URL`, `SITE_NAME`, `SMTP_*` values
- Keep `.env.local` out of version control

## Future Subdomains (planned)
```
mk9.in         → Main Portal
blog.mk9.in    → Blog Module
seniority.mk9.in → Seniority Management
```
