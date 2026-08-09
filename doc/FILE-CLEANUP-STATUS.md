# File Cleanup Status

> Record of unused files removed from the site (and files deliberately kept).
> **Keep this file up to date** — update status any time a file is deleted, kept, or restored.

Date of cleanup: 2026-08-09

---

## Status legend

- `DELETED` — file was unused (no reference in any HTML/CSS/JS) and removed from the repo.
- `KEPT` — file is unused today but intentionally retained (data/feature not yet migrated to the new modular structure).

---

## Deleted files (unused + superseded)

### Superseded legacy pages

| File | Status | Why |
|---|---|---|
| `Seniariity_List.html` | DELETED | Converted to `seniority/seniority-list.html` (same data, served at `/seniority`) |
| `Seniarity_Management.html` | DELETED | Converted to `seniority/seniority-management.html` (served at `/seniority/manage`) |
| `Test.html` | DELETED | Legacy test page — no references |
| `finance/index.original.html` | DELETED | Pre-split backup — no references |

### Unused stylesheet

| File | Status | Why |
|---|---|---|
| `css/nadstyle.css` | DELETED | No page references it (all legacy pages now use `css/style.css`) |

### Unused images (no reference in any HTML/CSS/JS)

| File | Status |
|---|---|
| `img/pattern.jpg` | DELETED |
| `img/project.png` | DELETED |
| `img/service1.png` | DELETED |
| `img/service2.png` | DELETED |
| `img/service3.png` | DELETED |
| `img/service4.png` | DELETED |
| `img/slide-one.jpg` | DELETED |
| `img/slide-two.jpg` | DELETED |
| `img/slide-three.jpg` | DELETED |
| `img/slide-four.jpg` | DELETED |
| `img/slide-five.jpg` | DELETED |
| `img/slide-six.jpg` | DELETED |
| `img/SocCal01.png` | DELETED |
| `img/SocCal02.png` | DELETED |
| `img/SocCal03.png` | DELETED |
| `img/SocCal04.png` | DELETED |
| `img/telegram-icon.png` | DELETED |
| `img/blog/arduino.png` | DELETED |
| `img/blog/blog.jpg` | DELETED |
| `img/blog/esp32.png` | DELETED |
| `img/blog/uc.jpg` | DELETED |
| `img/blog/ucpin.jpg` | DELETED |
| `img/blog/up.jpg` | DELETED |
| `img/blog.jpg` | DELETED |
| `img/btn-bg.jpg` | DELETED |
| `img/graphics/birthday.svg` | DELETED |
| `img/graphics/logo.svg` | DELETED |
| `img/graphics/video.svg` | DELETED |
| `img/graphics/wedding.svg` | DELETED |
| `img/icons8-project-96.png` | DELETED |
| `img/item1.jpg` | DELETED |
| `img/item2.jpg` | DELETED |
| `img/item3.jpg` | DELETED |
| `img/logo.png` | DELETED |
| `img/member1.jpg` | DELETED |
| `img/member1.png` | DELETED |
| `img/member2.jpg` | DELETED |
| `img/member3.jpg` | DELETED |
| `img/member4.jpg` | DELETED |
| `img/member5.jpg` | DELETED |
| `img/member6.jpg` | DELETED |

---

## Kept on purpose (unused now, but NOT yet converted)

These are still needed later — either data is still being migrated or they are backups/references.

| File | Status | Why |
|---|---|---|
| `blog/posts/_template.html` | KEPT | Template for creating new blog posts (not linked from any page, needed as reference) |
| `data/complaint.json` | KEPT | Legacy hospital master data — not yet folded into the new data files |
| `data/dept.json` | KEPT | Legacy hospital master data — not yet folded into the new data files |
| `data/drname.json` | KEPT | Legacy hospital master data — not yet folded into the new data files |
| `data/labtest.json` | KEPT | Legacy hospital master data — not yet folded into the new data files |
| `data/medlist.json` | KEPT | Legacy hospital master data — not yet folded into the new data files |

---

## Actively used images (keep — do not delete)

`img/hero.svg`, `img/blog.svg`, `img/og-default.svg`, `img/favicon.png`,
`img/services/app-development.svg`, `img/services/software-development.svg`,
`img/services/web-development.svg`,
`img/blog/ai-in-daily-life.svg`, `img/blog/full-stack-developer.svg`,
`img/blog/modern-full-stack-ecosystem.svg`.

## Actively used data files (keep — do not delete)

`data/holidays.json`, `data/hospital-masters.json`, `data/investigations.json`,
`data/links.json`, `data/medicines.json`, `data/posts.json`,
`data/symptoms.json`, `data/categories.json`.

---

*Update the Status column whenever a file is removed, added, or restored.*
