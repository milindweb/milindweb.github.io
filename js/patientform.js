// ============================================================
// ✅ GOOGLE APPS SCRIPT BACKEND URL
// ============================================================

// Backend endpoint where OPD form data is submitted
const scriptURL = "https://script.google.com/macros/s/AKfycbzlI-y3orZji_GQALezywPOQaZ3RNQR79jxJYQ9T4Gpk1U5ot7rUcOgrtQRKFOTBuGwxw/exec";


// ============================================================
// ✅ FORM & RESPONSE ELEMENTS
// ============================================================

// Main OPD form element
const form = document.getElementById("patientForm");

// Response message container
const responseDiv = document.getElementById("response");


// ============================================================
// ✅ OPD NUMBER GENERATION LOGIC
// ============================================================

// Generates OPD No in YYMMDDHHMMSS format
function generateOPDNo() {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  return `${yy}${mm}${dd}${hh}${min}${ss}`;
}


// ============================================================
// ✅ INITIAL OPD NUMBER ON PAGE LOAD
// ============================================================

const opdNoField = document.getElementById("opdNo");
opdNoField.value = generateOPDNo();


// ============================================================
// ✅ FORM SUBMISSION HANDLER
// ============================================================

form.addEventListener("submit", e => {
  e.preventDefault();

  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());

  const opdNo = generateOPDNo();
  opdNoField.value = opdNo;
  data.opdNo = opdNo;

  fetch(scriptURL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  })
  .then(() => {
    responseDiv.innerHTML = `
      <div class='alert success'>
        ✅ Patient record saved successfully.<br>
        <strong>OPD No:</strong> ${opdNo}
      </div>
    `;
    setTimeout(() => responseDiv.innerHTML = "", 15000);
    form.reset();
    opdNoField.value = generateOPDNo();
  })
  .catch(() => {
    responseDiv.innerHTML =
      "<div class='alert error'>❌ Error saving data. Try again.</div>";
  });
});


// ============================================================
// ✅ DEPARTMENT & SYMPTOMS (JSON-BASED, NON-INTRUSIVE)
// ============================================================

const departmentSelect = document.getElementById("departmentSelect");
const symptomsInput = document.getElementById("symptomsInput");
const symptomReference = document.getElementById("symptomReference");

fetch("data/dept.json")
  .then(res => res.json())
  .then(json => {
    const departments = json.department;

    departments.forEach(deptObj => {
      const option = document.createElement("option");
      option.value = deptObj.dept;
      option.textContent = deptObj.dept;
      departmentSelect.appendChild(option);
    });

    window.deptData = departments;
  });

departmentSelect.addEventListener("change", () => {
  symptomsInput.value = "";
  symptomReference.textContent = "";

  const selectedDept = departmentSelect.value;
  const deptObj = window.deptData?.find(d => d.dept === selectedDept);

  if (deptObj && Array.isArray(deptObj.symptoms)) {
    symptomReference.textContent =
      "Common symptoms: " + deptObj.symptoms.join(", ");
  }
});


// ============================================================
// ✅ PRESCRIPTION AUTO-SUGGEST (GENERIC / BRAND / CATEGORY)
// ============================================================

const prescriptionInput = document.getElementById("prescriptionInput");
const medicineSuggestions = document.getElementById("medicineSuggestions");

let medicineData = [];

fetch("data/medlist.json")
  .then(res => res.json())
  .then(json => {
    medicineData = json;
  });

prescriptionInput.addEventListener("input", () => {

  // ✅ ONLY current line is searched (important)
  const lines = prescriptionInput.value.split("\n");
  const query = lines[lines.length - 1].trim().toLowerCase();

  medicineSuggestions.innerHTML = "";
  if (query.length < 2) return;

  medicineData.forEach(item => {

    const category = (item["Main Category"] || "").toLowerCase();
    const generic = (item["Generic "]?.[" API (Single or Combination)"] || "").toLowerCase();
    const brands = (item["Common Brand Names (India)"] || "").toLowerCase();

    if (
      category.includes(query) ||
      generic.includes(query) ||
      brands.includes(query)
    ) {
      const suggestion = document.createElement("div");

      suggestion.textContent =
        generic +
        (brands ? " (" + item["Common Brand Names (India)"] + ")" : "");

      suggestion.addEventListener("click", () => {
        const lines = prescriptionInput.value.split("\n");
        lines[lines.length - 1] = generic;
        prescriptionInput.value = lines.join("\n") + "\n";
        medicineSuggestions.innerHTML = "";
      });

      medicineSuggestions.appendChild(suggestion);
    }
  });
});

document.addEventListener("click", e => {
  if (!medicineSuggestions.contains(e.target) && e.target !== prescriptionInput) {
    medicineSuggestions.innerHTML = "";
  }
});
