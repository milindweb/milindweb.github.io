document.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch("/components/hospital-nav.html");
    if (!res.ok) throw new Error("Failed to load hospital nav");
    const html = await res.text();
    const el = document.getElementById("hospitalNav");
    if (el) el.innerHTML = html;
  } catch (err) {
    console.error("Error loading hospital nav:", err);
  }
});
