// js/include.js
function includeHTML() {
  document.querySelectorAll('[data-include]').forEach(el => {
    const file = el.getAttribute('data-include');
    fetch(file)
      .then(response => response.text())
      .then(data => {
        el.innerHTML = data;
      })
      .catch(err => console.error('Include failed:', file));
  });
}
window.addEventListener('DOMContentLoaded', includeHTML);
