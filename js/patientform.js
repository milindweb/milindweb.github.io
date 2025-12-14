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
  const yy = String(now.getFullYear()).slice(-2);         // year (2 digits)
  const mm = String(now.getMonth() + 1).padStart(2, "0"); // month
  const dd = String(now.getDate()).padStart(2, "0");      // day
  const hh = String(now.getHours()).padStart(2, "0");     // hour
  const min = String(now.getMinutes()).padStart(2, "0");  // minute
  const ss = String(now.getSeconds()).padStart(2, "0");   // second
  return `${yy}${mm}${dd}${hh}${min}${ss}`;               // final OPD No
}


// ============================================================
// ✅ INITIAL OPD NUMBER ON PAGE LOAD
// ============================================================

// OPD No input field
const opdNoField = document.getElementById("opdNo");

// Generate OPD No when page loads
opdNoField.value = generateOPDNo();


// ============================================================
// ✅ FORM SUBMISSION HANDLER
// ============================================================

// Handle OPD form submission
form.addEventListener("submit", e => {
  e.preventDefault(); // stop default form reload

  // Collect all form inputs
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());

  // Generate fresh OPD No at submission time
  const opdNo = generateOPDNo();
  opdNoField.value = opdNo;

  // Attach OPD No to submitted data
  data.opdNo = opdNo;

  // Send data to Google Apps Script
  fetch(scriptURL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  })
  .then(() => {

    // Show success message
    responseDiv.innerHTML = `
      <div class='alert success'>
        ✅ Patient record saved successfully.<br>
        <strong>OPD No:</strong> ${opdNo}
      </div>
    `;

    // Auto-hide message after 15 seconds
    setTimeout(() => responseDiv.innerHTML = "", 15000);

    // Reset form after successful submission
    form.reset();

    // Generate new OPD No for next patient
    opdNoField.value = generateOPDNo();
  })
  .catch(() => {

    // Show error message on failure
    responseDiv.innerHTML =
      "<div class='alert error'>❌ Error saving data. Try again.</div>";
  });
});


// ============================================================
// ✅ DEPARTMENT & SYMPTOMS (JSON-BASED, NON-INTRUSIVE)
// ============================================================

// Department dropdown element
const departmentSelect = document.getElementById("departmentSelect");

// Symptoms textarea (will be enhanced later)
const symptomsInput = document.getElementById("symptomsInput");
const symptomReference = document.getElementById("symptomReference");


// Load departments and symptoms from JSON file
fetch("data/dept.json")
  .then(res => res.json())
  .then(json => {

    // Extract department array from JSON
    const departments = json.department;

    // Populate department dropdown dynamically
    departments.forEach((deptObj, index) => {
      const option = document.createElement("option");
      option.value = deptObj.dept;
      option.textContent = deptObj.dept;
      departmentSelect.appendChild(option);

      // Auto-select first department (MED)
      // if (index === 0) departmentSelect.value = deptObj.dept;
    });

    // Store department data globally for later use
    window.deptData = departments;
  });


// ============================================================
// ✅ LOAD SYMPTOMS BASED ON SELECTED DEPARTMENT
// ============================================================

// Listen for department selection change
departmentSelect.addEventListener("change", () => {

  // clear textarea
  symptomsInput.value = "";

  // clear old reference text
  symptomReference.textContent = "";

  // get selected department
  const selectedDept = departmentSelect.value;

  // find department object
  const deptObj = window.deptData?.find(d => d.dept === selectedDept);

  // show reference symptoms (text only)
  if (deptObj && Array.isArray(deptObj.symptoms)) {
    symptomReference.textContent =
      "Common symptoms: " + deptObj.symptoms.join(", ");
  }
});

// ============================================================
// ✅ PRESCRIPTION AUTO-SUGGEST (GENERIC / BRAND / CATEGORY)
// ============================================================

// Prescription textarea
const prescriptionInput = document.getElementById("prescriptionInput");

// Suggestion container
const medicineSuggestions = document.getElementById("medicineSuggestions");

// Store medicine list globally
let medicineData = [];

// Load medicine list JSON
fetch("data/medlist.json")
  .then(res => res.json())
  .then(json => {
    medicineData = json;
  });

// Listen while typing in prescription textarea
prescriptionInput.addEventListener("input", () => {

  // const query = prescriptionInput.value.trim().toLowerCase();
  const query = prescriptionInput.value.split(/\s+/).pop().toLowerCase();

  medicineSuggestions.innerHTML = "";

  // Do nothing if input is too small
  if (query.length < 2) return;

  // Loop through medicine list
  medicineData.forEach(item => {

    const category = (item["Main Category"] || "").toLowerCase();
    const generic = (item["Generic "]?.[" API (Single or Combination)"] || "").toLowerCase();
    const brands = (item["Common Brand Names (India)"] || "").toLowerCase();

    // Match query with category OR generic OR brand
    if (
      category.includes(query) ||
      generic.includes(query) ||
      brands.includes(query)
    ) {
      const suggestion = document.createElement("div");

      // Display clean suggestion text
      suggestion.textContent =
        generic +
        (brands ? " (" + item["Common Brand Names (India)"] + ")" : "");

      // On click, add medicine to textarea
      suggestion.addEventListener("click", () => {
        const current = prescriptionInput.value.trim();
        prescriptionInput.value = current
          ? current + "\n" + generic
          : generic;
        medicineSuggestions.innerHTML = "";
      });

      medicineSuggestions.appendChild(suggestion);
    }
  });
});

// Hide suggestions when clicking outside
document.addEventListener("click", e => {
  if (!medicineSuggestions.contains(e.target) && e.target !== prescriptionInput) {
    medicineSuggestions.innerHTML = "";
  }
});





