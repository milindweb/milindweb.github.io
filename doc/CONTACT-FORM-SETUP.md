# Contact Form — Reuse Guide

Drop this contact form onto **any static website** using the **already-deployed**
Google Apps Script backend. No new backend, no server, no database.

> This guide is generic. The backend is shared, so the only thing you edit per
> site is the `siteName` value in the config (which names the site's own sheet).

> **Working example (AartiTechServices):** the shared backend is live at
> `https://script.google.com/macros/s/AKfycbyO87cybPXuwXOGBMj7OdMf8VXNPtNFW8055qcTzizXHpwIvbD_9kSBFZQIBXFHGzMs/exec`
> and the MilindWeb site (this repo) uses `siteName: "MilindWeb"`. To add the
> form to `aartitechservices.pages.dev`, set `siteName: "AartiTechServices"` —
> that sheet is created automatically on the first submission.

---

## 1. How it works

```
[Your website]  --POST JSON (with site name)-->  [shared Apps Script URL]  -->  [Google Spreadsheet]
```

The form posts to a single deployed Apps Script URL. The backend writes each
enquiry **twice**:

1. **Master sheet (General)** — every enquiry from *every* site. Gives you one
   overview of all sites.
2. **Per-site sheet** — auto-created on first use, named after the `siteName`
   from the config. Holds only that site's enquiries.

So: change the site name in the config, and your rows automatically get their
own sheet. No setup in Google Sheets required.

---

## 2. What you need

| Item | Purpose |
|------|---------|
| The shared backend URL | Already deployed — paste it into your config |
| Any web host | Your HTML + JS (Cloudflare Pages, GitHub Pages, Netlify, etc.) |

That's it. The spreadsheet and Apps Script already exist.

---

## 3. Frontend setup (per website)

### 3.1 Form HTML

```html
<form id="contactForm">
  <!-- Change the options to match your services -->
  <select id="service" name="service" required>
    <option value="">Select Service</option>
    <option>Business Enquiry</option>
    <option>Digital Marketing &amp; SEO</option>
    <option>Graphics Design</option>
    <option>Feedback</option>
    <option>Other</option>
  </select>

  <input type="text" id="name" name="name" placeholder="Your Name" required>
  <input type="email" id="email" name="email" placeholder="Your Email" required>
  <input type="tel" id="phone" name="phone" pattern="^[6-9][0-9]{9}$" placeholder="Mobile No." required>
  <textarea id="message" name="message" placeholder="Your Message" required></textarea>

  <button type="submit">Send</button>
  <div id="response"></div>
</form>
```

### 3.2 Config — the ONLY thing you change per site

```html
<script>
  window.SITE_CONFIG = {
    appsScriptUrl: "APPS_SCRIPT_URL",      // <-- the shared backend URL
    contact: {
      siteName: "MySiteName"               // <-- names this site's sheet (auto-created)
    }
  };
</script>
```

The `siteName` controls which sheet the per-site copy of your enquiries lands
in. On this site it is `MilindWeb`. Pick any name for your site — the tab is
created automatically on the first submission.

### 3.3 Form logic

Copy the contents of `contact-form.js` into your project and include it:

```html
<script src="contact-form.js" defer></script>
```

The script reads `SITE_CONFIG.appsScriptUrl` and
`SITE_CONFIG.contact.siteName` and sends them with every submission.

---

## 4. Where data goes

| Sheet (tab) | Contents |
|-------------|----------|
| `General` (master) | **All** enquiries from **all** sites, each with a `Site` column |
| `MySiteName` (per-site) | Only enquiries from the site that sent `siteName: "MySiteName"` |

The `Site` column in the master sheet shows the source site for each row.

---

## 5. Customization

- **Success message** — change the string in `contact-form.js`.
- **Phone format** — update the regex `^[6-9][0-9]{9}$` (HTML pattern + JS) for other countries.
- **Services list** — edit the `<option>` elements in the form HTML.
- **Spam honeypot** — add a hidden empty field and reject submissions where it
  is filled (in the backend's `contactSubmit_`).

---

## 6. Backend changes (only if the shared backend itself must change)

The backend is shared across all sites. If you change any `.gs` file:

1. Open the Apps Script project (from the spreadsheet: **Extensions → Apps Script**).
2. Re-paste the changed `.gs` file(s).
3. **Deploy → Manage deployments → Edit → New version → Deploy**.
4. The URL stays the same, so no frontend changes are needed.

### How the per-site routing works (backend)

In `contact.gs`, `contactSubmit_`:

1. Reads `site` from the payload (falls back to `General`).
2. Sanitizes it into a valid sheet name (`sanitizeSheetName_`).
3. `getSheet_` auto-creates the per-site tab if missing.
4. Appends the row to the **master sheet** (`General`) and then to the
   **per-site sheet**.

---

## 7. Testing checklist

1. Submit a test entry from the new site.
2. In the spreadsheet: the per-site tab (named after your `siteName`) is created
   with the row, AND the same row appears in the `General` master tab.
3. Check **Apps Script → Executions** if nothing appears.
4. Confirm the deployment URL ends in `/exec` (not `/dev`).
5. Confirm the site is HTTPS (mixed content blocks fetch to the script URL).
