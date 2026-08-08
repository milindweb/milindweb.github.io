/**
 * contact.gs — Unified contact enquiries in the Milind-Contacts spreadsheet.
 *
 * One sheet per module (Hospital, Seniority, Finance, General).
 * Each row: Date & Time, Module, Name, Mobile, Email, Subject, Message, IP, Status.
 */

function contactSheetFor_(module) {
  var name = CONFIG.contact.sheets[String(module).toLowerCase()] || CONFIG.contact.defaultSheet;
  return getSheet_(ss_(CONFIG.contactSheetId), name);
}

function contactSubmit_(body) {
  var module = String(body.module || 'general').toLowerCase();
  var sh = contactSheetFor_(module);

  var headers = ['datetime', 'module', 'name', 'mobile', 'email', 'subject', 'message', 'ip', 'status'];
  ensureHeader_(sh, headers);

  var name = String(body.name || '').trim();
  var mobile = String(body.mobile || '').trim();
  var email = String(body.email || '').trim();
  var message = String(body.message || '').trim();

  if (!name) return fail_('Name is required');
  if (!message) return fail_('Message is required');

  sh.appendRow([
    nowIST_(),          // Date & Time
    module,             // Module
    name,               // Name
    mobile,             // Mobile
    email,              // Email
    String(body.subject || '').trim(), // Subject
    message,            // Message
    String(body.ip || '').trim(),      // IP (best-effort)
    'new',              // Status
  ]);

  return json_({ ok: true, message: 'Thank you! We will contact you shortly.' });
}
