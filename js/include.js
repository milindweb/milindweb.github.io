// js/include.js

document.addEventListener("DOMContentLoaded", () => {
  // Load external HTML file into container
  function loadComponent(id, file, callback) {
    fetch(file)
      .then(response => {
        if (!response.ok) throw new Error(`Failed to load ${file}`);
        return response.text();
      })
      .then(data => {
        document.getElementById(id).innerHTML = data;
        if (typeof callback === "function") callback();
      })
      .catch(error => console.error(error));
  }

  // Attach mobile menu toggle
  function initMenuToggle() {
    const menuToggle = document.getElementById("menu-toggle");
    const mobileMenu = document.getElementById("mobile-menu");

    if (menuToggle && mobileMenu) {
      menuToggle.addEventListener("click", () => {
        mobileMenu.classList.toggle("open");
      });

      // Optional: close menu when a link is clicked
      mobileMenu.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", () => {
          mobileMenu.classList.remove("open");
        });
      });
    }
  }

  // Load header first, then init menu
  loadComponent("header", "header.html", initMenuToggle);

  // Load footer
  loadComponent("footer", "footer.html");
});
