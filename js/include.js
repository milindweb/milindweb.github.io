document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ MilindWeb: include.js started");

  // Utility: log messages
  function log(msg, type = "info") {
    const prefix = "MilindWeb:";
    if (type === "error") console.error("❌ " + prefix, msg);
    else console.log("ℹ️ " + prefix, msg);
  }

  // Utility: fetch & inject file into element
  async function loadFile(targetEl, file, placeholder) {
    if (!targetEl) {
      log(`No element found for ${placeholder}`, "error");
      return;
    }

    // Add skeleton loader
    targetEl.classList.add(`${placeholder}-loading`);
    targetEl.innerHTML = `<div class="skeleton">Loading ${placeholder}...</div>`;

    try {
      const res = await fetch(file);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const html = await res.text();
      targetEl.innerHTML = html;
      targetEl.classList.remove(`${placeholder}-loading`);
      log(`Loaded ${placeholder} from ${file}`);
    } catch (err) {
      targetEl.innerHTML = `<div class="error">⚠️ Failed to load ${placeholder}</div>`;
      log(`Error loading ${placeholder}: ${err.message}`, "error");
    }
  }

  // === Load header ===
  const headerEl = document.getElementById("header-placeholder") 
                || document.querySelector('[data-include="header.html"]');
  loadFile(headerEl, "header.html", "header");

  // === Load footer ===
  const footerEl = document.getElementById("footer-placeholder") 
                || document.querySelector('[data-include="footer.html"]');
  loadFile(footerEl, "footer.html", "footer");
});
