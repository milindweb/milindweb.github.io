/**
 * js/contact-form.js — Contact form → new modular Apps Script backend.
 *
 * Submits to the shared backend (SITE_CONFIG.appsScriptUrl) using the PUBLIC
 * action `contactSubmit` — no login required. Enquiries are saved to the
 * Milind-Contacts spreadsheet under the "General" (or module-specific) sheet.
 */

function initForm() {
  var form = document.getElementById("contactForm");
  if (!form) { setTimeout(initForm, 100); return; }

  var scriptURL = (window.SITE_CONFIG && SITE_CONFIG.appsScriptUrl) || "";
  var responseDiv = document.getElementById("response");
  var phoneInput = document.getElementById("phone");
  var phoneError = document.getElementById("phoneError");

  if (!scriptURL) {
    if (responseDiv) responseDiv.innerHTML = "<div class='alert error'>Contact form is not configured yet. Please try again later.</div>";
    return;
  }

  form.addEventListener("submit", function(e) {
    e.preventDefault();
    var pattern = /^[6-9][0-9]{9}$/;
    if (!pattern.test(phoneInput.value)) { if (phoneError) phoneError.style.display = "block"; return; }
    if (phoneError) phoneError.style.display = "none";

    var module = (form.module && form.module.value) ? form.module.value.toLowerCase() : "general";

    // contact.gs expects: module, site, name, mobile, email, subject, message
    var payload = {
      action: "contactSubmit",
      module: module,
      site: (window.SITE_CONFIG && SITE_CONFIG.contact && SITE_CONFIG.contact.siteName) ? SITE_CONFIG.contact.siteName : "General",
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
      var msg = (res && res.ok) ? "Thank you! We will contact you shortly." : ((res && res.error) || "Something went wrong. Please try again.");
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