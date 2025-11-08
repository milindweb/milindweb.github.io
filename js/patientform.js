/*******************************************************
 * data/patientform.js (Final Fixed Version)
 * Clean, tested for: milindweb.github.io
 *******************************************************/

// ==============================
// SECTION 1 — Config & Utilities
// ==============================

// Static department list
const DEPARTMENT_LIST = [
  "General Medicine / Physician",
  "General Surgery",
  "Cardiology (Heart Specialist)",
  "Dental / Oral Surgery",
  "Dermatology (Skin & Hair)",
  "Endocrinology (Diabetes / Thyroid)",
  "ENT (Ear, Nose, Throat)",
  "Gastroenterology (Digestive System)",
  "Nephrology (Kidney)",
  "Neurology (Brain & Nerves)",
  "Obstetrics & Gynecology (Gynac)",
  "Oncology (Cancer)",
  "Ophthalmology (Eye)",
  "Orthopedics",
  "Pediatrics (Child Specialist)",
  "Physiotherapy / Rehabilitation",
  "Plastic & Reconstructive Surgery",
  "Psychiatry (Mental Health)",
  "Pulmonology / Chest Medicine",
  "Radiology & Imaging",
  "Urology (Urinary / Male Reproductive)",
  "Others / Not Listed"
];

// Load config from HTML or fallback
const CFG = window.APP_CONFIG || {
  BASE_URL: "https://script.google.com/macros/s/AKfycbyfWMwKwuEsztaCTuQaL4tLda2u7Zl974RBngPqyYxjahdoWPCVsX_iDU5dV7eKNGtk/exec",
  ENDPOINTS: {
    HEADERS: "meta/headers",
    DEPARTMENTS: "meta/departments",
    GENERATE_OPD: "meta/opd",
    RECORDS: "records"
  },
  STORAGE_KEYS: {
    RECENTS: "pm_recent_values",
    RECORD_CACHE: "pm_record_cache",
    QUEUE: "pm_offline_queue"
  }
};

// Safe URL joiner (prevents // errors)
function makeUrl(endpoint) {
  return `${CFG.BASE_URL.replace(/\/+$/, '')}/${endpoint.replace(/^\/+/, '')}`;
}

// Utility helpers
const delay = (ms) => new Promise(res => setTimeout(res, ms));
const isOnline = () => navigator.onLine;
const show = (msg, type = "ok", sub = "") => { try { window.toast(msg, type, sub); } catch {} };
const overlay = (on = true) => { try { on ? window.showOverlay() : window.hideOverlay(); } catch {} };
const safeJSON = (str, fallback = null) => { try { return JSON.parse(str); } catch { return fallback; } };

// Normalize keys for flexible mapping
function normalizeKey(s) {
  return String(s || "")
    .normalize("NFKD")
    .replace(/[^\x00-\x7F]/g, c => (c === "₂" ? "2" : ""))
    .toLowerCase()
    .replace(/[\s._\-\/()&]+/g, "")
    .trim();
}

// ================================
// SECTION 2 — Local Storage Mgmt
// ================================
const KEYS = CFG.STORAGE_KEYS;
const loadRecents = () => safeJSON(localStorage.getItem(KEYS.RECENTS), {}) || {};
const saveRecents = (obj) => localStorage.setItem(KEYS.RECENTS, JSON.stringify(obj || {}));
const loadRecordCache = () => safeJSON(localStorage.getItem(KEYS.RECORD_CACHE), []) || [];
const saveRecordCache = (arr) => localStorage.setItem(KEYS.RECORD_CACHE, JSON.stringify(arr || []));
const loadQueue = () => safeJSON(localStorage.getItem(KEYS.QUEUE), []) || [];
const saveQueue = (arr) => localStorage.setItem(KEYS.QUEUE, JSON.stringify(arr || []));

// Update recents (deduped)
function pushRecent(fieldNorm, value, N = 8) {
  if (!value) return;
  const rec = loadRecents();
  const list = rec[fieldNorm] || [];
  const idx = list.findIndex(v => v.toLowerCase() === value.toLowerCase());
  if (idx >= 0) list.splice(idx, 1);
  list.unshift(value);
  rec[fieldNorm] = list.slice(0, N);
  saveRecents(rec);
}

// ==================================
// SECTION 3 — DOM & Field Collection
// ==================================
const form = document.getElementById("patientForm");
const btnSubmit = document.getElementById("btnSubmit");
const btnSaveLocal = document.getElementById("btnSaveLocal");

function buildFieldMap() {
  const fields = {};
  document.querySelectorAll("[data-key]").forEach(box => {
    const key = box.getAttribute("data-key");
    const input = box.querySelector("input, textarea, select");
    if (key && input) fields[normalizeKey(key)] = { key, input, box };
  });
  return fields;
}
let FIELD_MAP = buildFieldMap();

// ===========================================================
// SECTION 4 — Dynamic Headers & Mapping
// ===========================================================
let SHEET_HEADERS = [];
let HEADER_INDEX = {};

async function fetchHeaders() {
  const res = await fetch(makeUrl(CFG.ENDPOINTS.HEADERS));
  if (!res.ok) throw new Error(`Headers fetch failed: ${res.status}`);
  const j = await res.json();
  const list = Array.isArray(j?.data) ? j.data : Array.isArray(j) ? j : [];
  SHEET_HEADERS = list;
  HEADER_INDEX = {};
  list.forEach(h => HEADER_INDEX[normalizeKey(h)] = h);
}

function resolveHeaderForField(fieldNorm) {
  if (HEADER_INDEX[fieldNorm]) return HEADER_INDEX[fieldNorm];
  const aliases = {
    spo2: ["spO2", "spO₂", "spo₂", "spo 2"],
    drremarks: ["drremarks", "dr.remarks", "dr remarks"],
    opdno: ["opdno", "opd no", "opd-number", "opd"],
    mobileno: ["mobile", "mobile no", "phone"],
    doctorname: ["doctor", "drname", "dr name"],
    effectaftertreatment: ["effect", "treatment effect"],
    prescriptiongenericapibrandname: ["prescription", "rx"],
    reservedoptionalfutureuse: ["reserved"]
  };
  for (const [norm, variants] of Object.entries(aliases)) {
    if (fieldNorm === norm || variants.some(v => normalizeKey(v) === fieldNorm)) {
      for (const [normHeader, actual] of Object.entries(HEADER_INDEX)) {
        if (normHeader === norm) return actual;
      }
    }
  }
  for (const h of SHEET_HEADERS) {
    if (normalizeKey(h) === fieldNorm) return h;
  }
  return null;
}

// =====================================
// SECTION 5 — Department List Management
// =====================================
function populateDeptStatic() {
  const dl = document.getElementById("deptList");
  if (!dl) return;
  dl.innerHTML = "";
  DEPARTMENT_LIST.forEach(d => {
    const opt = document.createElement("option");
    opt.value = d;
    dl.appendChild(opt);
  });
}

// =========================================
// SECTION 6 — OPD Generation & Field Helpers
// =========================================
async function generateOPD() {
  overlay(true);
  try {
    const res = await fetch(makeUrl(CFG.ENDPOINTS.GENERATE_OPD), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });
    const j = await res.json();
    if (!j?.success) throw new Error(j?.error?.message || "OPD generation failed");
    const opd = j.data?.opd || j.opd || j?.data;
    const fld = FIELD_MAP[normalizeKey("OPD No")]?.input;
    if (fld) fld.value = opd;
    show("OPD generated", "ok", opd);
    return opd;
  } catch (err) {
    show("Failed to generate OPD", "error", err.message);
  } finally { overlay(false); }
}

// =======================================
// SECTION 7 — Build Payload (Dynamic Map)
// =======================================
function collectPayload() {
  const payload = {};
  for (const [norm, { key, input }] of Object.entries(FIELD_MAP)) {
    const header = resolveHeaderForField(norm);
    if (!header) continue;
    const val = input.type === "number"
      ? (input.value === "" ? "" : Number(input.value))
      : input.value;
    payload[header] = val;
  }
  return payload;
}

// ===========================================
// SECTION 8 — Validation for Required Fields
// ===========================================
function validateRequired(payload) {
  const required = ["opdno","patientname","mobileno","gender","age","doctorname","department"];
  const missing = [];
  for (const rk of required) {
    let actual = HEADER_INDEX[rk] || resolveHeaderForField(rk);
    if (!actual) continue;
    const v = payload[actual];
    if (v === undefined || v === null || v === "") missing.push(actual);
  }
  return missing;
}

// ==========================================================
// SECTION 9 — Suggestions & Auto-fill
// ==========================================================
const SUGGEST_FIELDS = ["Doctor Name","Department","Diagnosis","Prescription (Generic API Brand Name)","Treatment Note","Advice"].map(normalizeKey);

function applySuggestionsToDatalist() {
  const rec = loadRecents();
  document.querySelectorAll("[data-suggest='true']").forEach(inp => {
    const normKey = normalizeKey(inp.closest("[data-key]")?.getAttribute("data-key"));
    const values = rec[normKey] || [];
    let dl = inp.getAttribute("list") ? document.getElementById(inp.getAttribute("list")) : null;
    if (!dl) {
      const id = `${inp.id || normKey}List`;
      dl = document.createElement("datalist");
      dl.id = id;
      document.body.appendChild(dl);
      inp.setAttribute("list", id);
    }
    dl.innerHTML = "";
    values.forEach(v => {
      const opt = document.createElement("option");
      opt.value = v;
      dl.appendChild(opt);
    });
  });
}

// ===========================================
// SECTION 10 — Networking with Retry/Backoff
// ===========================================
async function safeFetchJSON(url, options = {}, { retries = 3, baseDelay = 600 } = {}) {
  let attempt = 0;
  while (attempt <= retries) {
    try {
      const res = await fetch(url, options);
      const isJSON = (res.headers.get("content-type") || "").includes("application/json");
      const data = isJSON ? await res.json() : await res.text();
      if (!res.ok || (isJSON && data?.success === false)) {
        throw new Error(data?.error?.message || `HTTP ${res.status}`);
      }
      return data;
    } catch (err) {
      if (attempt === retries) throw err;
      await delay(baseDelay * Math.pow(2, attempt) + Math.random() * 250);
      attempt++;
    }
  }
}

// ==================================
// SECTION 11 — Submit & Offline Queue
// ==================================
async function submitNow(payload) {
  return safeFetchJSON(makeUrl(CFG.ENDPOINTS.RECORDS), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  }, { retries: 3, baseDelay: 800 });
}

function queueSubmit(payload) {
  const q = loadQueue();
  q.push({ payload, tries: 0, nextAt: Date.now() });
  saveQueue(q);
}

async function processQueue() {
  if (!isOnline()) return;
  const q = loadQueue();
  if (!q.length) return;
  const next = q[0];
  if (Date.now() < (next.nextAt || 0)) return;
  try {
    await submitNow(next.payload);
    q.shift(); saveQueue(q);
    show("Queued form synced", "ok");
    processQueue();
  } catch (err) {
    next.tries = (next.tries || 0) + 1;
    next.nextAt = Date.now() + Math.min(15 * 60 * 1000, 1000 * Math.pow(2, next.tries));
    q[0] = next; saveQueue(q);
    show("Sync failed, will retry", "warn", err.message);
  }
}
window.addEventListener("online", () => processQueue());
setInterval(processQueue, 20000);

// =======================================
// SECTION 12 — Form Event Wiring / Submit
// =======================================
async function handleSubmit(ev) {
  ev.preventDefault();
  overlay(true);
  btnSubmit.disabled = true;
  toggleSubmitWaiting(true);
  try {
    const payload = collectPayload();
    const missing = validateRequired(payload);
    if (missing.length) {
      show("Missing required fields", "error", missing.join(", "));
      toggleSubmitWaiting(false);
      btnSubmit.disabled = false;
      overlay(false);
      return;
    }
    for (const [norm, { input }] of Object.entries(FIELD_MAP))
      if (SUGGEST_FIELDS.includes(norm)) pushRecent(norm, input.value);
    applySuggestionsToDatalist();

    if (isOnline()) {
      try {
        await submitNow(payload);
        show("Submitted Successfully", "ok");
        const cache = loadRecordCache();
        cache.unshift(payload);
        saveRecordCache(cache.slice(0, 500));
        form.reset();
      } catch (err) {
        queueSubmit(payload);
        show("Server issue — saved to queue", "warn", err.message);
      }
    } else {
      queueSubmit(payload);
      show("Offline — saved to queue", "warn");
    }
  } finally {
    toggleSubmitWaiting(false);
    btnSubmit.disabled = false;
    overlay(false);
  }
}

function toggleSubmitWaiting(waiting) {
  const t = document.getElementById("submitText");
  const w = document.getElementById("submitWait");
  if (t && w) {
    t.style.display = waiting ? "none" : "inline";
    w.style.display = waiting ? "inline" : "none";
  }
}

// ===========================================
// SECTION 13 — Boot Sequence
// ===========================================
document.addEventListener("DOMContentLoaded", async () => {
  try {
    overlay(true);
    FIELD_MAP = buildFieldMap();
    await fetchHeaders();
    populateDeptStatic();
    applySuggestionsToDatalist();
    form?.addEventListener("submit", handleSubmit);
    btnSaveLocal?.addEventListener("click", () => {
      const payload = collectPayload();
      const missing = validateRequired(payload);
      if (missing.length) {
        show("Missing required fields", "error", missing.join(", "));
        return;
      }
      queueSubmit(payload);
      for (const [norm, { input }] of Object.entries(FIELD_MAP))
        if (SUGGEST_FIELDS.includes(norm)) pushRecent(norm, input.value);
      applySuggestionsToDatalist();
      show("Saved offline for later sync", "ok");
    });
    const mobileInput = FIELD_MAP[normalizeKey("Mobile No.")]?.input;
    if (mobileInput) {
      let timer = null;
      mobileInput.addEventListener("input", () => {
        clearTimeout(timer);
        const val = mobileInput.value.trim();
        if (val.length < 5) return;
        timer = setTimeout(() => autofillByMobile(val), 400);
      });
    }
    processQueue();
    show("Form ready", "ok");
  } catch (err) {
    show("Init failed", "error", err.message);
  } finally {
    overlay(false);
  }
});
