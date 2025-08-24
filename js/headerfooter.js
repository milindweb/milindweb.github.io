// js/headerfooter.js
// Load header and footer dynamically + initialize functionality
document.addEventListener("DOMContentLoaded", () => {
  /**
   * Load an external HTML component into a placeholder div
   * @param {string} file - Path to the HTML file (header.html / footer.html)
   * @param {string} placeholderId - ID of the target placeholder div
   * @param {function} callback - Function to run after the component is loaded
   */
  async function loadComponent(file, placeholderId, callback) {
    try {
      const response = await fetch(file);
      if (!response.ok) throw new Error(`Failed to load ${file}`);
      const html = await response.text();

      const placeholder = document.getElementById(placeholderId);
      if (placeholder) {
        placeholder.innerHTML = html;
      }

      if (typeof callback === "function") callback();
    } catch (err) {
      console.error("Error loading component:", file, err);
    }
  }

  /**
   * Initialize Header Functionality
   */
  function initHeader() {
    const mobileToggle = document.querySelector(".hf-mobile-toggle");
    const mobileMenu = document.querySelector(".hf-mobile-menu");
    const mobileOverlay = document.querySelector(".hf-mobile-overlay");
    const header = document.querySelector(".hf-header");

    if (!mobileToggle || !mobileMenu || !mobileOverlay || !header) return;

    // Toggle mobile menu
    mobileToggle.addEventListener("click", () => {
      mobileToggle.classList.toggle("active");
      mobileMenu.classList.toggle("active");
      mobileOverlay.classList.toggle("active");

      // Prevent body scroll when menu is open
      document.body.style.overflow = mobileMenu.classList.contains("active")
        ? "hidden"
        : "";
    });

    // Close menu on overlay click
    mobileOverlay.addEventListener("click", closeMenu);

    // Close menu when clicking any nav link
    document.querySelectorAll(".hf-mobile-nav-link").forEach((link) => {
      link.addEventListener("click", closeMenu);
    });

    // Close menu with Escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeMenu();
    });

    // Header scroll effect
    window.addEventListener("scroll", () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      if (scrollTop > 50) {
        header.classList.add("scrolled");
      } else {
        header.classList.remove("scrolled");
      }
    });

    // Smooth scroll for internal anchor links
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", function (e) {
        const target = document.querySelector(this.getAttribute("href"));
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    });

    // Helper to close menu
    function closeMenu() {
      mobileToggle.classList.remove("active");
      mobileMenu.classList.remove("active");
      mobileOverlay.classList.remove("active");
      document.body.style.overflow = "";
    }
  }

  /**
   * Initialize Footer Functionality
   */
  function initFooter() {
    document.querySelectorAll(".hf-footer-links a[href^='#']").forEach((link) => {
      link.addEventListener("click", function (e) {
        const target = document.querySelector(this.getAttribute("href"));
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    });
  }

  // Load header into #header
  loadComponent("header.html", "header", initHeader);

  // Load footer into #footer
  loadComponent("footer.html", "footer", initFooter);
});
