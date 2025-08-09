const scriptURL = "https://script.google.com/macros/s/AKfycbwVzlM-VKAMYQnPKlRq4gVvQbJ-0SireCfppxiYXKqeKnVsI_SBU0DRMi9miw_3LV-Bjw/exec";
const form = document.getElementById("contactForm");
const responseDiv = document.getElementById("response");
const phoneInput = document.getElementById("phone");
const phoneError = document.getElementById("phoneError");

form.addEventListener("submit", e => {
  e.preventDefault();

  const phonePattern = /^[6-9][0-9]{9}$/;
  if (!phonePattern.test(phoneInput.value)) {
    phoneError.style.display = "block";
    return;
  } else {
    phoneError.style.display = "none";
  }

  const data = {
    service: form.service.value,
    name: form.name.value,
    email: form.email.value,
    phone: form.phone.value,
    message: form.message.value
  };

  fetch(scriptURL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  })
  .then(() => {
    responseDiv.innerHTML = "<div class='alert success'>✅ Thank you! Your message has been sent successfully and we will contact you shortly.</div>";
    setTimeout(() => { responseDiv.innerHTML = ""; }, 15000);
    form.reset();
  })
  .catch(() => {
    responseDiv.innerHTML = "<div class='alert error'>❌ Oops! Something went wrong. Please try again.</div>";
  });
});