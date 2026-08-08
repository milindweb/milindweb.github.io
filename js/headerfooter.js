// js/headerfooter.js
// Load header and footer dynamically + initialize functionality
document.addEventListener("DOMContentLoaded", () => {
  var cfg = typeof SITE_CONFIG !== 'undefined' ? SITE_CONFIG : {};

  var REPLACE_MAP = {
    '{{SITE_NAME}}': cfg.brand ? cfg.brand.name : '',
    '{{SITE_NAME_UPPER}}': cfg.brand ? cfg.brand.nameUppercase : '',
    '{{TAGLINE}}': cfg.brand ? cfg.brand.tagline : '',
    '{{LOGO_ICON}}': cfg.brand ? (cfg.brand.logoIcon || cfg.brand.name.charAt(0)) : '',
    '{{COPYRIGHT}}': cfg.brand ? cfg.brand.copyright : '',
    '{{PHONE}}': cfg.contact ? cfg.contact.phoneDisplay : '',
    '{{PHONE_RAW}}': cfg.contact ? cfg.contact.phone : '',
    '{{PHONE_WA}}': cfg.contact ? cfg.contact.phoneWA : '',
    '{{EMAIL}}': cfg.contact ? cfg.contact.email : '',
    '{{LOCATION}}': cfg.contact ? cfg.contact.location : '',
    '{{HOURS}}': cfg.contact ? cfg.contact.workingHours : '',
    '{{DOMAIN}}': cfg.domain || '',
    '{{URL}}': cfg.url || '',
    '{{SOCIAL_WA}}': cfg.social ? cfg.social.whatsapp : '',
    '{{SOCIAL_TELEGRAM}}': cfg.social ? cfg.social.telegram : '',
    '{{SOCIAL_INSTA}}': cfg.social ? cfg.social.instagram : '',
    '{{SOCIAL_FB}}': cfg.social ? cfg.social.facebook : '',
    '{{SOCIAL_TWITTER}}': cfg.social ? cfg.social.twitter : '',
    '{{SOCIAL_LINKEDIN}}': cfg.social ? cfg.social.linkedin : '',
  };

  function applyReplacements(html) {
    return html.replace(/{{[A-Z_]+}}/g, function (match) {
      return REPLACE_MAP[match] !== undefined ? REPLACE_MAP[match] : match;
    });
  }

  /**
   * Load an external HTML component into a placeholder div
   * @param {string} file - Path to the HTML file
   * @param {string} placeholderId - ID of the target placeholder div
   * @param {function} callback - Run after the component is loaded
   */
  async function loadComponent(file, placeholderId, callback) {
    try {
      const response = await fetch(file);
      if (!response.ok) throw new Error(`Failed to load ${file}`);
      let html = await response.text();
      html = applyReplacements(html);

      const placeholder = document.getElementById(placeholderId);
      if (placeholder) {
        placeholder.innerHTML = html;
      }

      if (typeof callback === "function") callback(placeholder);
    } catch (err) {
      console.error("Error loading component:", file, err);
    }
  }

  /**
   * Initialize Theme Toggle
   */
  function initThemeToggle(headerRoot) {
    const toggle = headerRoot.querySelector(".hf-theme-toggle");
    const mobileToggle = headerRoot.querySelector(".hf-mobile-theme-toggle");
    if (!toggle) return;

    function applyTheme(theme) {
      const isDark = theme === "dark";
      document.documentElement.classList.toggle("dark-mode", isDark);
      localStorage.setItem("theme", theme);
      const icon = toggle.querySelector("i");
      if (icon) icon.className = isDark ? "fas fa-sun" : "fas fa-moon";
      if (mobileToggle) {
        const mobileIcon = mobileToggle.querySelector("i");
        if (mobileIcon) mobileIcon.className = isDark ? "fas fa-sun" : "fas fa-moon";
      }
    }

    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    applyTheme(saved || (prefersDark ? "dark" : "light"));

    toggle.addEventListener("click", () => {
      const isDark = document.documentElement.classList.contains("dark-mode");
      applyTheme(isDark ? "light" : "dark");
    });

    if (mobileToggle) {
      mobileToggle.addEventListener("click", () => {
        const isDark = document.documentElement.classList.contains("dark-mode");
        applyTheme(isDark ? "light" : "dark");
      });
    }
  }

  /**
   * Initialize Header Functionality
   */
  function initHeader(headerRoot) {
    const mobileToggle = headerRoot.querySelector(".hf-mobile-toggle");
    const mobileMenu   = headerRoot.querySelector(".hf-mobile-menu");
    const mobileOverlay= headerRoot.querySelector(".hf-mobile-overlay");
    const header       = headerRoot.querySelector(".hf-header");

    if (!mobileToggle || !mobileMenu || !mobileOverlay || !header) return;

    // Initialize theme toggle
    initThemeToggle(headerRoot);

    // Toggle mobile menu
    mobileToggle.addEventListener("click", () => {
      mobileToggle.classList.toggle("active");
      mobileMenu.classList.toggle("active");
      mobileOverlay.classList.toggle("active");
    });

    // Close menu helper
    function closeMenu() {
      mobileToggle.classList.remove("active");
      mobileMenu.classList.remove("active");
      mobileOverlay.classList.remove("active");
      document.body.style.overflow = "";
    }

    // Close menu on overlay click
    mobileOverlay.addEventListener("click", closeMenu);

    // Close menu when clicking any nav link
    headerRoot.querySelectorAll(".hf-mobile-nav-link").forEach((link) => {
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

    // Smooth scroll for internal anchors
    headerRoot.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", function (e) {
        const href = this.getAttribute("href");
        if (!href || href === "#") return;
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    });
  }

  /**
   * Initialize Auth Buttons in the header
   * Shows LOGIN or LOGOUT depending on the session token.
   */
  function initAuthButtons(headerRoot) {
    if (!window.Auth) return;

    function render() {
      const loggedIn = window.Auth.isLoggedIn();
      const loginEls  = headerRoot.querySelectorAll("[data-auth='login']");
      const logoutEls = headerRoot.querySelectorAll("[data-auth='logout']");
      loginEls.forEach((el) => { el.style.display = loggedIn ? "none" : ""; });
      logoutEls.forEach((el) => { el.style.display = loggedIn ? "" : "none"; });
    }

    var logoutEls = headerRoot.querySelectorAll("[data-auth='logout']");
    logoutEls.forEach((el) => {
      el.addEventListener("click", function (e) {
        e.preventDefault();
        window.Auth.logout();
        render();
        if (window.location.pathname === "/login") window.location.href = "/";
      });
    });

    render();

    // Refresh the token against the backend (silent) so module access is current.
    window.Auth.checkSession().then(render);
  }

  /**
   * Initialize Footer Functionality
   */
  function initFooter(footerRoot) {
    footerRoot.querySelectorAll(".hf-footer-links a[href^='#']").forEach((link) => {
      link.addEventListener("click", function (e) {
        const href = this.getAttribute("href");
        if (!href || href === "#") return;
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    });

    // Scroll to Top Button
    var scrollBtn = document.getElementById("scrollTopBtn");
    if (scrollBtn) {
      window.addEventListener("scroll", function () {
        if (window.scrollY > 400) {
          scrollBtn.classList.add("visible");
        } else {
          scrollBtn.classList.remove("visible");
        }
      });
      scrollBtn.addEventListener("click", function () {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }
  }

  // Load header into #header
  loadComponent("/components/header.html", "header", function (headerRoot) {
    initHeader(headerRoot);
    initAuthButtons(headerRoot);
  });

  // Load footer into #footer
  loadComponent("/components/footer.html", "footer", initFooter);
});
