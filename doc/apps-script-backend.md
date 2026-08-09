# Google Apps Script Backend — `apps-script-v2/`

Replaces the old single-file backend (`apps-script/Code.gs`, now deleted) with a
**modular, auth-protected** backend. Google Sheets are the database — each
"table" is one sheet inside a spreadsheet, and a `_meta` sheet holds counters.

## File layout

| File | Purpose |
|---|---|
| `api.gs` | `doGet` / `doPost` router with the auth guard + module routing |
| `auth.gs` | Login / register / logout, session tokens, role + module checks |
| `config.gs` | Sheet IDs + module codes (`hospital`, `seniority`, `finance`, `contact`) |
| `utils.gs` | Shared response/sheet/CRUD helpers (`json_`, `fail_`, `tableList_`, …) |
| `finance.gs` | Finance module router + functions (salary, FY summary, loans, transactions) |
| `finance-seed.gs` | Optional seed data for the finance module |
| `seniority.gs` | Seniority module router + functions (employees, sanctioned posts) |
| `contact.gs` | Contact form module |
| `seed.gs` | Users/schema seeding |

## Deploy

1. Create the spreadsheets and put their IDs in `config.gs` (module spreadsheet IDs).
2. **Extensions → Apps Script**, create one file per row above and paste the contents.
3. Only `api.gs` should contain `doGet`/`doPost` (delete the default `Code.gs`).
4. **Deploy → New deployment → Web app**:
   - Execute as: **Me**
   - Access: **Anyone**
5. Copy the `/exec` URL into the site's `js/config.js` → `appsScriptUrl`.

> Pasting new code is not enough — create a **New version** under
> **Deploy → Manage deployments** for the `/exec` URL to serve the changes.

## Auth

- Register / login via `POST { action:'authLogin', username, password }` /
  `POST { action:'authRegister', username, password }`.
- Each session returns a `token`; the frontend sends it with every request.
- Users carry a comma-separated `modules` column; `Auth.hasModule()` gates UI,
  and `api.gs` rejects calls for modules the token lacks.

## API contract (module routes)

Public routes:

```
POST { action:'authLogin', username, password }
POST { action:'authRegister', username, password }
POST { action:'contactSubmit', module, name, mobile, email, subject, message }
```

Authenticated routes (require `token`):

```
POST { action:'authLogout', token }
POST { action:'authCheck', token }
GET  ?action=authStatus&token=...
```

Module routes (require `token` + matching `Users.modules` entry):

```
GET  ?module=hospital&token=...&action=list&table=patients&page=1&limit=50&q=...
POST { token, module:'hospital', action:'insert'|'update'|'delete', table, id?, row? }
POST { module:'finance', token, fn, args }      → finance.gs  (e.g. fn:'getDashboardData')
POST { module:'seniority', token, fn, args }    → seniority.gs (e.g. fn:'getEmployees')
```

`list`/`search` return `{ rows, total, page, pages }`.

### Response envelope

```json
{ "ok": true,  "data": ... }
{ "ok": false, "error": "message", "code": 400 }
```

## Module spreadsheets

| Module | Spreadsheet | Sheets |
|---|---|---|
| hospital | `CONFIG.hospitalSheetId` | `patients`, `visits`, child tables, `_meta` |
| seniority | `CONFIG.senioritySheetId` | `Employees`, `Sanctioned Posts` |
| finance | `CONFIG.financeSheetId` | salary / FY / loans / transactions |
| contact | `CONFIG.contactSheetId` | contact submissions |
| auth | `CONFIG.authSheetId` | `Users`, `Sessions` |

## Concurrency caveat

Apps Script web apps run one request at a time per script project. For a small
site with light traffic this is fine. If you outgrow it, move the same schema
to Supabase/Postgres — the frontend only calls the endpoints above through the
`js/*-api.js` clients, so swapping the backend is easy.
