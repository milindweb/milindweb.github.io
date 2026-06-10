function initForm() {
  var form = document.getElementById("contactForm");
  if (!form) { setTimeout(initForm, 100); return; }

  var scriptURL = "https://script.google.com/macros/s/AKfycbwVzlM-VKAMYQnPKlRq4gVvQbJ-0SireCfppxiYXKqeKnVsI_SBU0DRMi9miw_3LV-Bjw/exec";
  var responseDiv = document.getElementById("response");
  var phoneInput = document.getElementById("phone");
  var phoneError = document.getElementById("phoneError");

  form.addEventListener("submit", function(e) {
    e.preventDefault();
    var pattern = /^[6-9][0-9]{9}$/;
    if (!pattern.test(phoneInput.value)) { phoneError.style.display = "block"; return; }
    phoneError.style.display = "none";
    fetch(scriptURL, {
      method: "POST", mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service: form.service.value, name: form.name.value,
        email: form.email.value, phone: form.phone.value,
        message: form.message.value
      })
    })
    .then(function() {
      responseDiv.innerHTML = "<div class='alert success'>Thank you! We will contact you shortly.</div>";
      setTimeout(function() { responseDiv.innerHTML = ""; }, 15000);
      form.reset();
    })
    .catch(function() {
      responseDiv.innerHTML = "<div class='alert error'>Something went wrong. Please try again.</div>";
    });
  });
}

initForm();
