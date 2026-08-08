# Contact Form Integration Guide

A drop-in, self-hosted contact form that stores enquiries in a **Google Spreadsheet**
via **Google Apps Script**. Works on any static site — no database, no server.

> This is a generic guide. Replace every `<PLACEHOLDER>` with values for the
> specific deployment before shipping.

---

## 1. How it works

```
[Your website]  --POST JSON-->  [Google Apps Script URL]  -->  [Google Spreadsheet]
```

1. The visitor fills the form in your HTML.
2. `contact-form.js` sends a JSON payload to a Google Apps Script deployment URL.
3. The Apps Script backend saves the row into a sheet named after the module
   (default `General`).
4. The response text is shown in `#response` on the page.

No login, no API key, no CORS setup required (the script accepts
`text/plain` POST bodies precisely to avoid preflight).

---

## 2. What you need

| Item | Purpose |
|------|---------|
| A Google account | Hosts the Apps Script + spreadsheet |
| A Google Spreadsheet | Where enquiries are stored |
| Any web host | Your HTML + JS (Cloudflare Pages, GitHub Pages, Netlify, etc.) |

---

## 3. Backend setup (do this once)

### 3.1 Create the spreadsheet

1. Create a new Google Sheet, e.g. `Website Contacts`.
2. Add one sheet/tab per contact channel, e.g. `General`, `Business`,
   `StudentSection`, `Feedback`. If you only need one channel, keep `General`.
   **You do not need to pre-create columns** — the script writes the header row.

### 3.2 Create the Apps Script project

1. In the spreadsheet: **Extensions → Apps Script**.
2. Delete any starter code. Paste the two files below.

**`Code.gs`** (single-file version — no dependencies):

```javascript
var CONFIG = {
  contactSheetId: 'PUT_THE_SPREADSHEET_ID_HERE', // long id from the Sheet URL
  contact: {
    // module name  →  sheet/tab name
    sheets: { general: 'General', business: 'Business', feedback: 'Feedback' },
    defaultSheet: 'General'
  }
};

function doPost(e) {
  try {
    var body = parseBody_(e);
    if (body.action === 'contactSubmit') return contactSubmit_(body);
    return fail_('Unknown action: ' + body.action);
  } catch (err) {
    return fail_(String(err && err.message || err));
  }
}

function doGet(e) {
  return ContentService.createTextOutput('OK').setMimeType(ContentService.MimeType.TEXT);
}

// ---- helpers ----

function parseBody_(e) {
  var raw = e.postData && e.postData.contents || '';
  try { return JSON.parse(raw); } catch (err) { return {}; }
}

function json_(obj, code) {
  var out = ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
  if (code) out.setStatusCode(code);
  return out;
}

function fail_(error, code) {
  return json_({ ok: false, error: String(error) }, code || 400);
}

function ss_(id) { return SpreadsheetApp.openById(id); }

function getSheet_(ss, name) {
  var sh = ss.getSheetByName(name);
  if (sh) return sh;
  return ss.insertSheet(name);
}

function ensureHeader_(sh, headers) {
  if (sh.getLastRow() > 0) return;
  sh.appendRow(headers);
}

function nowIST_() {
  return Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyyy-MM-dd HH:mm:ss');
}

function contactSubmit_(body) {
  var module = String(body.module || 'general').toLowerCase();
  var sh = getSheet_(ss_(CONFIG.contactSheetId),
    CONFIG.contact.sheets[module] || CONFIG.contact.defaultSheet);

  var headers = ['datetime', 'module', 'name', 'mobile', 'email', 'subject', 'message', 'ip', 'status'];
  ensureHeader_(sh, headers);

  var name = String(body.name || '').trim();
  var message = String(body.message || '').trim();
  if (!name) return fail_('Name is required');
  if (!message) return fail_('Message is required');

  sh.appendRow([
    nowIST_(),
    module,
    name,
    String(body.mobile || '').trim(),
    String(body.email || '').trim(),
    String(body.subject || '').trim(),
    message,
    String(body.ip || '').trim(),
    'new'
  ]);

  return json_({ ok: true, message: 'Thank you! We will contact you shortly.' });
}
```

> **Production note:** the full backend in this repo (`api.gs`, `auth.gs`,
> `contact.gs`, `utils.gs`, `config.gs`) has more features (login, multiple
> modules, sessions). For a standalone contact form on another site, the single
> `Code.gs` above is all you need. To reuse the full modular backend instead,
> copy all `apps-script-v2/*.gs` files and adjust `config.gs`.

### 3.3 Deploy

1. Click **Deploy → New deployment**.
2. Type: **Web app**.
3. **Execute as:** *Me*.
4. **Who has access:** *Anyone*.
5. **Deploy**, then copy the **Web app URL** — this is your
   `APPS_SCRIPT_URL`. It looks like:
   `https://script.google.com/macros/s/XXXXX/exec`.

> Every time you change the backend, do **Manage deployments → Edit → New
> version → Deploy** to get a fresh working URL.

---

## 4. Frontend setup (on your other site)

### 4.1 Form HTML

Put this wherever the contact section should appear:

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
  <input type="tel" id="phone" name="phone" pattern="^[0-9]{7,15}$" placeholder="Mobile No." required>
  <textarea id="message" name="message" placeholder="Your Message" required></textarea>

  <!-- Optional: route enquiries to a specific sheet (must exist in CONFIG.contact.sheets) -->
  <!-- <input type="hidden" id="module" name="module" value="general"> -->

  <button type="submit">Send</button>
  <div id="response"></div>
</form>
```

### 4.2 Configuration + JS

Before the form script, set the backend URL (replace the placeholder):

```html
<script>
  window.SITE_CONFIG = {
    appsScriptUrl: "APPS_SCRIPT_URL"  // <-- paste your Web app URL here
  };
</script>
```

Then load the form logic. Copy `contact-form.js` into your project and include it:

```html
<script src="contact-form.js" defer></script>
```

The script (this is the whole logic — copy it as-is into your own file):

```javascript
function initForm() {
  var form = document.getElementById("contactForm");
  if (!form) { setTimeout(initForm, 100); return; }

  var scriptURL = (window.SITE_CONFIG && SITE_CONFIG.appsScriptUrl) || "";
  var responseDiv = document.getElementById("response");
  var phoneInput = document.getElementById("phone");
  var phoneError = document.getElementById("phoneError");

  if (!scriptURL) {
    if (responseDiv) responseDiv.innerHTML = "<div class='alert error'>Contact form is not configured yet.</div>";
    return;
  }

  form.addEventListener("submit", function(e) {
    e.preventDefault();
    var pattern = /^[0-9]{7,15}$/;
    if (!pattern.test(phoneInput.value)) {
      if (phoneError) phoneError.style.display = "block";
      return;
    }
    if (phoneError) phoneError.style.display = "none";

    var module = (form.module && form.module.value) ? form.module.value.toLowerCase() : "general";

    var payload = {
      action: "contactSubmit",
      module: module,
      name: form.name ? form.name.value : "",
      mobile: form.phone ? form.phone.value : "",
      email: form.email ? form.email.value : "",
      subject: form.service ? form.service.value : "",
      message: form.message ? form.message.value : ""
    };

    fetch(scriptURL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    })
    .then(function(res) { return res.json().catch(function() { return { ok: false, error: "Invalid response" }; }); })
    .then(function(res) {
      var msg = (res && res.ok) ? "Thank you! We will contact you shortly."
                                : ((res && res.error) || "Something went wrong. Please try again.");
      var cls = (res && res.ok) ? "alert success" : "alert error";
      if (responseDiv) {
        responseDiv.innerHTML = "<div class='" + cls + "'>" + msg + "</div>";
        setTimeout(function() { responseDiv.innerHTML = ""; }, 15000);
      }
      if (res && res.ok) form.reset();
    })
    .catch(function() {
      if (responseDiv) {
        responseDiv.innerHTML = "<div class='alert error'>Something went wrong. Please try again.</div>";
        setTimeout(function() { responseDiv.innerHTML = ""; }, 15000);
      }
    });
  });
}

initForm();
```

---

## 5. Configuration reference

| Setting | Where | Purpose |
|---------|-------|---------|
| `APPS_SCRIPT_URL` | `window.SITE_CONFIG.appsScriptUrl` | The deployed Web app URL |
| `CONFIG.contactSheetId` | `Code.gs` | Which spreadsheet receives the data |
| `CONFIG.contact.sheets` | `Code.gs` | Maps a `module` name → sheet/tab name |
| `module` | hidden input (optional) | Routes the enquiry to a specific sheet |
| `pattern` on the phone input | HTML + JS `pattern` var | Phone validation for your country |

### Routing enquiries to a different sheet

Add a tab in the spreadsheet, register it in `Code.gs`:

```javascript
sheets: {
  general: 'General',
  business: 'Business',   // new tab called "Business"
  feedback: 'Feedback'
}
```

Then in the form set the module:

```html
<input type="hidden" id="module" name="module" value="business">
```

Enquiries now land in the `Business` tab. **You must redeploy the Apps Script
after editing `Code.gs`** (Deploy → Manage deployments → New version).

---

## 6. Customization

- **Success message** — change the string in `contact-form.js`
  (`"Thank you! We will contact you shortly."`).
- **Phone format** — update the regex `^[0-9]{7,15}$` for other countries.
- **Spam honeypot** — add a hidden empty field (e.g. `<input type="text" name="website" style="display:none">`) and reject submissions where it is filled, in `contactSubmit_`.
- **Rate limiting** — the full backend adds IP + status columns; you can add
  simple spam filtering in `contactSubmit_` before `appendRow`.

---

## 7. Testing checklist

1. Open the form page and submit a test entry.
2. Check the spreadsheet — a new row (with a header row on first use) should appear.
3. If nothing appears, open **Apps Script → Executions** and look for errors.
4. Confirm the deployment URL ends in `/exec` (not `/dev`).
5. Confirm the site is HTTPS (mixed content blocks fetch to the script URL).
