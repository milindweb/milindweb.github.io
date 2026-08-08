# Google Apps Script Backend — `Code.gs`

Replaces the old Supabase backend with a **Google Sheet as the database**.
Each "table" is one sheet inside a single spreadsheet. A `_meta` sheet holds
auto-increment counters (IDs + yearly UHID numbers).

## Deploy

1. Create a Google Sheet.
2. **Extensions → Apps Script**, paste this file as `Code.gs`.
3. Set `SPREADSHEET_ID` at the top of the file to your sheet's ID
   (from `https://docs.google.com/spreadsheets/d/<ID>/edit`).
4. **Deploy → New deployment → Web app**:
   - Execute as: **Me**
   - Access: **Anyone**
5. Copy the `/exec` URL into the site's `js/config.js` → `appsScriptUrl`.

Sheets are auto-created on first write. Optionally pre-create a `departments`
sheet (`id`, `name`) and a `doctors` sheet (`id`, `name`) to populate the
dropdowns from the sheet.

## API contract

Base URL = your deployed `/exec` URL.

### Reads (GET)

```
?table=patients&action=list&page=1&limit=20&q=...
?table=patients&action=get&id=1
?table=patients&action=search&q=name
?action=searchPatients&q=name|uhid|mobile
?action=listPatients&page=1&limit=20&q=...       → patients + visit_count + last_visit
?action=listAppointments&date=2026-08-05         → appointments joined with names
?table=visits&action=count&visit_status=active
?action=dashboard                                → stats + recent visits
?table=patients&action=profile&id=1             → patient + visits + all child rows
```

`list`/`search` return `{ rows, total, page, pages }`.

### Writes (POST, JSON body)

```
{ "table": "patients",  "action": "insert", "row": { "full_name": "..." } }
{ "table": "visits",    "action": "update", "id": 12, "row": { "visit_status": "completed" } }
{ "table": "visits",    "action": "delete", "id": 12 }
```

### Response envelope

```json
{ "ok": true,  "data": ... }
{ "ok": false, "error": "message" }
```

## Table → sheet mapping

| Sheet | Notes |
|-------|-------|
| `patients` | auto UHID `PAT-YYYY-####` |
| `visits` | has `patient_id`, `opd_number`, `department_id`, `doctor_id`, `visit_status` |
| `vitals`, `complaints`, `histories`, `examinations`, `investigations`, `diagnoses`, `prescriptions`, `procedures`, `advice`, `followups`, `special_instructions`, `doctor_notes` | child tables of `visits`, keyed by `visit_id` |
| `billing_items`, `billing_summary` | billing, keyed by `visit_id` |
| `appointments` | `patient_id`, `doctor_id`, `department_id`, `appointment_date`, `status` |
| `departments`, `doctors` | master lists |
| `_meta` | internal counters — do not delete |

## Concurrency caveat

Apps Script web apps run one request at a time per script project. For a small
clinic with light traffic this is fine. If you outgrow it, move the same schema
to a Supabase/Postgres instance — the frontend only calls `list/get/search/
insert/update` through `js/hospital-api.js`, so swapping the backend is easy.
