/**
 * contact.gs — Unified contact enquiries in the Milind-Contacts spreadsheet.
 *
 * Dual-write model:
 *   1. A master sheet (default "General") stores EVERY enquiry from every site.
 *   2. A per-site sheet (named after the `site` field sent by the frontend)
 *      stores only that site's enquiries and is auto-created on first use.
 *
 * Each row: Date & Time, Site, Module, Name, Mobile, Email, Subject, Message, IP, Status.
 */

function contactSheetFor_(module) {
  var name = CONFIG.contact.sheets[String(module).toLowerCase()] || CONFIG.contact.defaultSheet;
  return getSheet_(ss_(CONFIG.contactSheetId), name);
}

/** Convert a raw site name into a valid Google Sheets tab name. */
function sanitizeSheetName_(raw) {
  var name = String(raw || '').trim();
  name = name.replace(/[\[\]:\*\/\\\?]/g, '').replace(/\s+/g, ' ').trim();
  if (name.length > 100) name = name.slice(0, 100);
  if (!name) name = CONFIG.contact.defaultSheet || 'General';
  return name;
}

function contactSubmit_(body) {
  var module = String(body.module || 'general').toLowerCase();
  var ss = ss_(CONFIG.contactSheetId);

  // Site is the primary routing key (auto-creates the per-site sheet).
  var site = String(body.site || '').trim();
  var siteSheetName = sanitizeSheetName_(site || module);
  var siteSheet = getSheet_(ss, siteSheetName);

  // Master sheet holds everything from all sites.
  var masterName = CONFIG.contact.masterSheet || CONFIG.contact.defaultSheet;
  var master = getSheet_(ss, masterName);

  var headers = ['datetime', 'site', 'module', 'name', 'mobile', 'email', 'subject', 'message', 'ip', 'status'];
  ensureHeader_(siteSheet, headers);
  ensureHeader_(master, headers);

  var name = String(body.name || '').trim();
  var mobile = String(body.mobile || '').trim();
  var email = String(body.email || '').trim();
  var message = String(body.message || '').trim();

  if (!name) return fail_('Name is required');
  if (!message) return fail_('Message is required');

  var row = [
    nowIST_(),          // Date & Time
    siteSheetName,      // Site
    module,             // Module
    name,               // Name
    mobile,             // Mobile
    email,              // Email
    String(body.subject || '').trim(), // Subject
    message,            // Message
    String(body.ip || '').trim(),      // IP (best-effort)
    'new',              // Status
  ];

  // Write to the master sheet first, then the per-site sheet.
  master.appendRow(row);
  if (siteSheet.getName() !== master.getName()) {
    siteSheet.appendRow(row);
  }

  return json_({ ok: true, message: 'Thank you! We will contact you shortly.' });
}
