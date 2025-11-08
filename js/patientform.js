/*******************************************************
 * data/patientform.js (ES Module)
 * Patient Form Frontend Logic — dynamic headers, offline,
 * retry/backoff, suggestions, mobile auto-fill.
 *
 * Requirements satisfied:
 *  - Fetch /meta/headers -> dynamic JSON mapping
 *  - Fetch /meta/departments (fallback list if needed)
 *  - Request /meta/opd for safe, unique OPD numbers
 *  - POST/PUT /records with retry & offline queue
 *  - Auto-fill by Mobile from cache/server
 *  - Recent suggestions via localStorage
 *  - Strong error handling with user-friendly toasts
 *******************************************************/

/* ==============================
   SECTION 1 — Config & Utilities
   ============================== */
// ======== backend base url ========
const BASE_URL = "https://script.google.com/macros/s/AKfycbyfWMwKwuEsztaCTuQaL4tLda2u7Zl974RBngPqyYxjahdoWPCVsX_iDU5dV7eKNGtk/exec";
window.APP_CONFIG = { BASE_URL };



// static department list (frontend master)
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


// Read global config injected by patientform.html
const CFG = window.APP_CONFIG || {
  BASE_URL: "",
  ENDPOINTS: {
    HEADERS: "/meta/headers",
    DEPARTMENTS: "/meta/departments",
    GENERATE_OPD: "/meta/opd",
    RECORDS: "/records"
  },
  STORAGE_KEYS: {
    RECENTS: "pm_recent_values",
    RECORD_CACHE: "pm_record_cache",
    QUEUE: "pm_offline_queue"
  }
};

// Normalizer: make header/field names comparable across variants.
// - lowercase
// - trim
// - remove spaces, dots, symbols
// - normalize unicode (spO₂ -> spO2)
function normalizeKey(s) {
  return String(s || "")
    .normalize("NFKD")               // split diacritics/subscripts
    .replace(/[\u2080-\u2089]/g, d => String("0123456789"["₀₁₂₃₄₅₆₇₈₉".indexOf(d)] || "")) // subscript digits -> normal
    .replace(/[^\x00-\x7F]/g, c => { // specific replacements (subscript ₂)
      if (c === "₂") return "2";
      return ""; // drop other non-ascii
    })
    .toLowerCase()
    .replace(/[\s._\-\/()&]+/g, "")  // remove separators & punctuation
    .trim();
}

// Small sleep helper for backoff
const delay = (ms) => new Promise(res => setTimeout(res, ms));

function show(msg, type = "ok", sub = "") { try { window.toast(msg, type, sub); } catch (_) {} }
function overlay(on = true) { try { on ? window.showOverlay() : window.hideOverlay(); } catch (_) {} }

function isOnline() { return navigator.onLine; }

// Safe JSON parse
function safeJSON(str, fallback = null) {
  try { return JSON.parse(str); } catch { return fallback; }
}

/* ==========================================
   SECTION 2 — Local Storage Data Management
   ========================================== */

const KEYS = CFG.STORAGE_KEYS;

// Recent suggestions store: { fieldKey(normalized): [value1, value2, ...] }
function loadRecents() { return safeJSON(localStorage.getItem(KEYS.RECENTS), {} ) || {}; }
function saveRecents(obj) { localStorage.setItem(KEYS.RECENTS, JSON.stringify(obj || {})); }

// Record cache for quick lookups (array of records)
function loadRecordCache() { return safeJSON(localStorage.getItem(KEYS.RECORD_CACHE), [] ) || []; }
function saveRecordCache(arr) { localStorage.setItem(KEYS.RECORD_CACHE, JSON.stringify(arr || [])); }

// Offline queue of pending submissions [{payload, tries, nextAt}]
function loadQueue() { return safeJSON(localStorage.getItem(KEYS.QUEUE), [] ) || []; }
function saveQueue(arr) { localStorage.setItem(KEYS.QUEUE, JSON.stringify(arr || [])); }

// Update recents for a field (dedupe, keep newest first, cap N)
function pushRecent(fieldNorm, value, N = 8) {
  if (!value) return;
  const rec = loadRecents();
  const list = rec[fieldNorm] || [];
  const idx = list.findIndex(v => String(v).toLowerCase() === String(value).toLowerCase());
  if (idx >= 0) list.splice(idx, 1);
  list.unshift(value);
  rec[fieldNorm] = list.slice(0, N);
  saveRecents(rec);
}

/* ==================================
   SECTION 3 — DOM & Field Collection
   ================================== */

// Collect all fields declared in HTML via data-key (matches Sheet headers logically)
const form = document.getElementById("patientForm");
const btnSubmit = document.getElementById("btnSubmit");
const btnGenOpd = document.getElementById("btnGenOpd");
const btnSaveLocal = document.getElementById("btnSaveLocal");

// Build field map: normalized data-key -> input/textarea/select element
function buildFieldMap() {
  const fields = {};
  document.querySelectorAll("[data-key]").forEach(box => {
    const key = box.getAttribute("data-key");
    const input = box.querySelector("input, textarea, select");
    if (!key || !input) return;
    fields[normalizeKey(key)] = { key, input, box };
  });
  return fields;
}

let FIELD_MAP = buildFieldMap();

/* ===========================================================
   SECTION 4 — Dynamic Headers & Tolerant Field/Header Mapping
   =========================================================== */

let SHEET_HEADERS = [];          // actual headers returned by backend
let HEADER_INDEX = {};           // normalized header -> actual header string

async function fetchHeaders() {
  const url = CFG.BASE_URL + CFG.ENDPOINTS.HEADERS;
  const res = await fetch(url, { method: "GET" });
  if (!res.ok) throw new Error(`Headers fetch failed: ${res.status}`);
  const j = await res.json();
  // Expect { status, success, data: [headers...] } from backend
  const list = Array.isArray(j?.data) ? j.data : Array.isArray(j) ? j : [];
  SHEET_HEADERS = list;
  HEADER_INDEX = {};
  list.forEach(h => HEADER_INDEX[normalizeKey(h)] = h);
}

// Lookup actual sheet header for a DOM field data-key
function resolveHeaderForField(fieldNorm) {
  // Direct normalized match
  if (HEADER_INDEX[fieldNorm]) return HEADER_INDEX[fieldNorm];

  // Special aliasing: tolerate common variants
  const aliases = {
    // Examples: 'spO₂' vs 'spO2'
    "spo2": ["spO2", "spO₂", "spo₂", "spo 2"],
    "drremarks": ["drremarks", "dr.remarks", "dr. remarks", "doctorremarks"],
    "opdno": ["opdno", "opd no", "opd-number", "opd"],
    "mobileno": ["mobile", "mobile no", "phone", "phone no"],
    "doctorname": ["doctor", "drname", "dr name"],
    "effectaftertreatment": ["effect", "treatment effect"],
    "prescriptiongenericapibrandname": [
      "prescription", "prescription (generic api brand name)", "rx"
    ],
    "reservedoptionalfutureuse": ["reserved", "reserved (optional future use)"],
  };

  for (const [norm, altArr] of Object.entries(aliases)) {
    if (fieldNorm === norm || altArr.some(a => normalizeKey(a) === fieldNorm)) {
      // Find any sheet header that normalizes to this alias group
      for (const [normHeader, actual] of Object.entries(HEADER_INDEX)) {
        if (normHeader === norm) return actual;
      }
    }
  }

  // Fallback: try fuzzy from header list by equality post-normalization
  for (const h of SHEET_HEADERS) {
    if (normalizeKey(h) === fieldNorm) return h;
  }

  // As a last resort, return null (field will be ignored on submit)
  return null;
}

/* =====================================
   SECTION 5 — Department List Management
   ===================================== */
function populateDeptStatic(){
  const datalist = document.getElementById("deptList");
  if(!datalist) return;
  datalist.innerHTML = "";
  DEPARTMENT_LIST.forEach(d=>{
    const opt = document.createElement("option");
    opt.value = d;
    datalist.appendChild(opt);
  });
}

// list added at top after config

/* =========================================
   SECTION 6 — OPD Generation & Field Helpers
   ========================================= */

async function generateOPD() {
  overlay(true);
  try {
    const res = await fetch(CFG.BASE_URL + CFG.ENDPOINTS.GENERATE_OPD, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });
    const j = await res.json();
    if (!j?.success) throw new Error(j?.error?.message || "OPD generation failed");

    const opd = j.data?.opd || j.opd || j?.data;
    const fld = FIELD_MAP[normalizeKey("OPD No")]?.input || document.getElementById("opdNo");
    if (fld) fld.value = opd;
    show("OPD generated", "ok", opd);
    return opd;
  } catch (err) {
    show("Failed to generate OPD", "error", err.message);
    throw err;
  } finally {
    overlay(false);
  }
}

/* =======================================
   SECTION 7 — Build Payload (Dynamic Map)
   ======================================= */

function collectPayload() {
  const payload = {};
  // Iterate UI fields, map to actual headers
  Object.entries(FIELD_MAP).forEach(([fieldNorm, { key, input }]) => {
    const header = resolveHeaderForField(fieldNorm);
    if (!header) return; // header not present in sheet; ignore field
    let val = input.type === "number" ? (input.value === "" ? "" : Number(input.value)) : input.value;

    // Special: add ₹ prefix visually but store plain number/string
    if (normalizeKey(header) === "drfees") {
      // Keep as numeric/empty; Sheets may format with ₹
      if (val === "") { /* leave empty */ }
    }

    payload[header] = val;
  });
  return payload;
}

/* ===========================================
   SECTION 8 — Validation for Required A..G
   =========================================== */

function validateRequired(payload) {
  // Required headers list (normalized) in order A..G
  const requiredKeys = [
    "opdno",
    "patientname",
    "mobileno",
    "gender",
    "age",
    "doctorname",
    "department"
  ];
  const missing = [];
  for (const rk of requiredKeys) {
    // Map to actual header present
    let actual = HEADER_INDEX[rk];
    if (!actual) {
      // try resolving from UI
      const uiHeader = resolveHeaderForField(rk);
      if (uiHeader) actual = uiHeader;
    }
    if (!actual) {
      // if header doesn't exist in sheet, skip (sheet mismatch)
      continue;
    }
    const v = payload[actual];
    if (v === undefined || v === null || v === "") {
      missing.push(actual);
    }
  }
  return missing;
}

/* ==========================================================
   SECTION 9 — Suggestions & Auto-fill (Local + Remote Lookup)
   ========================================================== */

// Which fields to remember for suggestions
const SUGGEST_FIELDS = [
  "Doctor Name",
  "Department",
  "Diagnosis",
  "Prescription (Generic API Brand Name)",
  "Treatment Note",
  "Advice"
].map(normalizeKey);

function applySuggestionsToDatalist() {
  const rec = loadRecents();
  // For inputs with data-suggest="true", attach datalist dynamically if not present
  document.querySelectorAll("[data-suggest='true']").forEach(inp => {
    const normKey = normalizeKey(inp.closest("[data-key]")?.getAttribute("data-key"));
    const values = rec[normKey] || [];
    // ensure a datalist exists
    let dl = inp.getAttribute("list") ? document.getElementById(inp.getAttribute("list")) : null;
    if (!dl) {
      const id = `${inp.id || normKey}List`;
      dl = document.createElement("datalist");
      dl.id = id;
      document.body.appendChild(dl);
      inp.setAttribute("list", id);
    }
    // fill items
    dl.innerHTML = "";
    values.forEach(v => {
      const opt = document.createElement("option");
      opt.value = v;
      dl.appendChild(opt);
    });
  });
}

// Auto-fill by Mobile No.
async function autofillByMobile(mobileVal) {
  if (!mobileVal) return;
  const mobileNorm = String(mobileVal).trim();

  // 1) Local cache first
  const cache = loadRecordCache();
  const hit = cache.find(r => {
    const key = Object.keys(r).find(h => normalizeKey(h) === "mobileno");
    return key && String(r[key]).trim() === mobileNorm;
  });
  if (hit) {
    fillFormFromRecord(hit);
    show("Auto-filled from local history", "ok");
    return;
  }

  // 2) Server fetch (all records) — then cache them for future
  try {
    overlay(true);
    const res = await fetch(CFG.BASE_URL + CFG.ENDPOINTS.RECORDS);
    const j = await res.json();
    const list = Array.isArray(j?.data) ? j.data : [];
    if (list.length) saveRecordCache(list);

    const found = list.find(r => {
      const key = Object.keys(r).find(h => normalizeKey(h) === "mobileno");
      return key && String(r[key]).trim() === mobileNorm;
    });
    if (found) {
      fillFormFromRecord(found);
      show("Auto-filled from server records", "ok");
      return;
    }
  } catch (_) {
    // silent; will still allow manual entry
  } finally {
    overlay(false);
  }
}

function fillFormFromRecord(record) {
  // For each UI field, if matching header exists in record, set value
  Object.entries(FIELD_MAP).forEach(([norm, { input }]) => {
    const header = resolveHeaderForField(norm);
    if (!header) return;
    if (record.hasOwnProperty(header)) {
      input.value = record[header];
    }
  });
}

/* ===========================================
   SECTION 10 — Networking with Retry/Backoff
   =========================================== */

async function safeFetchJSON(url, options = {}, { retries = 3, baseDelay = 600 } = {}) {
  let attempt = 0;
  let lastErr = null;
  while (attempt <= retries) {
    try {
      const res = await fetch(url, options);
      const isJSON = (res.headers.get("content-type") || "").includes("application/json");
      const data = isJSON ? await res.json() : await res.text();
      if (!res.ok || (isJSON && data?.success === false)) {
        const msg = isJSON ? (data?.error?.message || `HTTP ${res.status}`) : `HTTP ${res.status}`;
        throw new Error(msg);
      }
      return data;
    } catch (err) {
      lastErr = err;
      if (attempt === retries) break;
      const wait = Math.round(baseDelay * Math.pow(2, attempt) + Math.random() * 250);
      await delay(wait);
      attempt++;
    }
  }
  throw lastErr || new Error("Network error");
}

/* ==================================
   SECTION 11 — Submit & Offline Queue
   ================================== */

async function submitNow(payload) {
  const url = CFG.BASE_URL + CFG.ENDPOINTS.RECORDS;
  const data = await safeFetchJSON(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  }, { retries: 3, baseDelay: 800 });
  return data;
}

function queueSubmit(payload) {
  const q = loadQueue();
  q.push({
    payload,
    tries: 0,
    nextAt: Date.now()
  });
  saveQueue(q);
}

async function processQueue() {
  if (!isOnline()) return;
  let q = loadQueue();
  if (!q.length) return;

  // Process a copy to avoid racing with saves
  const next = q[0];
  if (Date.now() < (next.nextAt || 0)) return;

  try {
    await submitNow(next.payload);
    // Success: drop the first and continue
    q.shift();
    saveQueue(q);
    show("Queued form synced", "ok");
    // try process next immediately
    processQueue();
  } catch (err) {
    // Exponential backoff
    next.tries = (next.tries || 0) + 1;
    const delayMs = Math.min(15 * 60 * 1000, 1000 * Math.pow(2, next.tries)); // up to 15 min
    next.nextAt = Date.now() + delayMs;
    q[0] = next;
    saveQueue(q);
    show("Sync failed, will retry", "warn", err.message);
  }
}

// Kick queue processing on connectivity changes & periodically
window.addEventListener("online", () => processQueue());
setInterval(processQueue, 20_000);

/* =======================================
   SECTION 12 — Form Event Wiring / Handlers
   ======================================= */

async function handleSubmit(ev) {
  ev.preventDefault();
  overlay(true);
  btnSubmit.disabled = true;
  toggleSubmitWaiting(true);

  try {

     // Build payload based on current headers mapping
    const payload = collectPayload();

    // Validate required A..G
    const missing = validateRequired(payload);
    if (missing.length) {
      show("Missing required fields", "error", missing.join(", "));
      return;
    }

    // Save recents for selected fields
    for (const [norm, { input }] of Object.entries(FIELD_MAP)) {
      if (SUGGEST_FIELDS.includes(norm)) {
        pushRecent(norm, input.value);
      }
    }
    applySuggestionsToDatalist();

   // Attempt submit (online) or queue (offline/error)
if (isOnline()) {
  try {
    const res = await submitNow(payload);

    // final acknowledge (NO OPD display)
    show("Submitted Successfully", "ok");

    // update cache + reset
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

/* ===========================================
   SECTION 13 — Boot Sequence (DOMContentLoaded)
   =========================================== */

document.addEventListener("DOMContentLoaded", async () => {
  try {
    overlay(true);

    // Rebuild field map (in case DOM changed)
    FIELD_MAP = buildFieldMap();

    // 1) Fetch headers and build tolerant index
    await fetchHeaders();

    // 2) Departments from static list (frontend master)
    populateDeptStatic();

    // 3) Apply saved suggestions to datalists
    applySuggestionsToDatalist();

    // 4) Wire events
    form?.addEventListener("submit", handleSubmit);

    // Save Offline button
    btnSaveLocal?.addEventListener("click", () => {
      const payload = collectPayload();
      const missing = validateRequired(payload);
      if (missing.length) {
        show("Missing required fields", "error", missing.join(", "));
        return;
      }
      queueSubmit(payload);
      // Also push recents now
      for (const [norm, { input }] of Object.entries(FIELD_MAP)) {
        if (SUGGEST_FIELDS.includes(norm)) {
          pushRecent(norm, input.value);
        }
      }
      applySuggestionsToDatalist();
      show("Saved offline for later sync", "ok");
    });

    // Mobile auto-fill as user types (debounced)
    const mobileInput = FIELD_MAP[normalizeKey("Mobile No.")]?.input || document.getElementById("mobile");
    if (mobileInput) {
      let timer = null;
      mobileInput.addEventListener("input", () => {
        clearTimeout(timer);
        const val = mobileInput.value.trim();
        if (!val || val.length < 5) return; // basic threshold
        timer = setTimeout(() => autofillByMobile(val), 400);
      });
    }

    // If online, try a quick queue flush on load
    processQueue();

    show("Form ready", "ok");
  } catch (err) {
    show("Init failed", "error", err.message);
  } finally {
    overlay(false);
  }
});

/* ==================================================
   SECTION 14 — Optional: PUT/DELETE helpers (unused)
   ================================================== */

// Example update (PUT via method override, if needed later)
export async function updateRecordById(opdNo, partial) {
  const url = `${CFG.BASE_URL}/records/${encodeURIComponent(opdNo)}`;
  const data = await safeFetchJSON(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...partial, _method: "PUT" })
  }, { retries: 2, baseDelay: 700 });
  return data;
}

// Example delete (DELETE via method override)
export async function deleteRecordById(opdNo) {
  const url = `${CFG.BASE_URL}/records/${encodeURIComponent(opdNo)}`;
  const data = await safeFetchJSON(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ _method: "DELETE" })
  }, { retries: 2, baseDelay: 700 });
  return data;
}


