// js/include.js
document.addEventListener("DOMContentLoaded", () => {
  // Load external file into placeholder
  async function loadComponent(file, placeholderId, callback) {
    try {
      const response = await fetch(file);
      const html = await response.text();
      document.getElementById(placeholderId).innerHTML = html;

      if (typeof callback === "function") callback();
    } catch (err) {
      console.error("Error loading", file, err);
    }
  }

  // Load header + footer
  loadComponent("header.html", "header-placeholder", () => {
    if (window.initHeaderFooter) {
      window.initHeaderFooter(); // call from headerfooter.js
    }
  });

  loadComponent("footer.html", "footer-placeholder", () => {
    if (window.initFooter) {
      window.initFooter(); // optional if footer has JS
    }
  });
});
