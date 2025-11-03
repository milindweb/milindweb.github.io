const APP_URL = "https://script.google.com/macros/s/AKfycbw5Fq8xJeXjPilVb01Iz4lArtrgfq5jd8A55U8Zjp3taVRkni20QrXgHiYa1eEUN1ly/exec";

let investigations = [];
let prescriptions = [];

let complaints = [];
let labTests = [];
let medicines = [];

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("date").value = new Date().toLocaleDateString('en-GB');
  document.getElementById("opd").value = generateOPD();
  loadDoctors();
  loadComplaints();
  loadLabTests();
  loadMedicines();
});

// --- BASIC UTILITIES ---
function val(id){ return document.getElementById(id).value.trim(); }
function clear(ids){ ids.forEach(i=>document.getElementById(i).value=""); }
function toggleSection(id){ document.getElementById(id).classList.toggle("hidden"); }

function generateOPD(){
  const now = new Date();
  return `${now.getFullYear().toString().slice(2)}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}`;
}

// --- LOADERS ---
function loadDoctors(){
  fetch("data/drname.json")
    .then(r=>r.json())
    .then(data=>{
      const sel = document.getElementById("doctor");
      sel.innerHTML = "";
      data.doctors.forEach(d=>{
        const opt=document.createElement("option");
        opt.textContent=d;
        sel.appendChild(opt);
      });
    });
}

function loadComplaints(){
  fetch("data/complaint.json")
    .then(r=>r.json())
    .then(data=>{
      complaints = data;
      const chief = document.getElementById("chief");
      chief.innerHTML = "";
      complaints.forEach(c=>{
        const opt=document.createElement("option");
        opt.textContent = c.chiefComplaint;
        chief.appendChild(opt);
      });

      // On chief change, fill sub-symptoms
      chief.addEventListener("change", ()=>{
        const selected = complaints.find(x=>x.chiefComplaint===chief.value);
        const subSel = document.getElementById("subsym");
        subSel.innerHTML = "";
        if(selected && selected.subSymptoms){
          selected.subSymptoms.forEach(s=>{
            const opt=document.createElement("option");
            opt.textContent=s;
            subSel.appendChild(opt);
          });
        }
      });
    });
}

function loadLabTests(){
  fetch("data/labtest.json")
    .then(r=>r.json())
    .then(data=>{
      labTests = data.laboratoryTests || [];
      const catInput = document.getElementById("testcat");
      const nameInput = document.getElementById("testname");

      // Category autocomplete
      const catList = labTests.map(l=>l.category);
      autocomplete(catInput, catList);

      // On category change → update test name list
      catInput.addEventListener("input", ()=>{
        const category = labTests.find(x=>x.category.toLowerCase()===catInput.value.toLowerCase());
        const names = category ? category.tests.map(t=>t.testName) : [];
        autocomplete(nameInput, names);

        nameInput.addEventListener("input", ()=>{
          const t = category?.tests.find(tt=>tt.testName.toLowerCase()===nameInput.value.toLowerCase());
          if(t) document.getElementById("range").value = t.normalRange;
        });
      });
    });
}

function loadMedicines(){
  fetch("data/medlist.json")
    .then(r=>r.json())
    .then(data=>{
      medicines = data;
      const formInput = document.getElementById("formavail");
      const genericInput = document.getElementById("generic");

      const forms = [...new Set(medicines.map(m=>m["Forms Available"]))];
      const generics = medicines.map(m=>m["Generic "][" API (Single or Combination)"]);

      autocomplete(formInput, forms);
      autocomplete(genericInput, generics);
    });
}

// --- AUTOCOMPLETE FUNCTION ---
function autocomplete(inp, arr){
  inp.addEventListener("input", function(){
    closeAllLists();
    if(!this.value) return false;
    const val = this.value.toLowerCase();
    const list = document.createElement("div");
    list.setAttribute("class", "autocomplete-items");
    this.parentNode.appendChild(list);
    arr.filter(a=>a && a.toLowerCase().includes(val)).slice(0,10).forEach(a=>{
      const item = document.createElement("div");
      item.innerHTML = "<strong>"+a.substr(0,this.value.length)+"</strong>"+a.substr(this.value.length);
      item.addEventListener("click", ()=>{
        inp.value = a;
        closeAllLists();
      });
      list.appendChild(item);
    });
  });

  inp.addEventListener("blur", ()=>setTimeout(closeAllLists, 200));
}

function closeAllLists(){
  document.querySelectorAll(".autocomplete-items").forEach(el=>el.remove());
}

// --- TABLE MANAGEMENT ---
function addInvestigation(){
  const t=[val("testcat"), val("testname"), val("reports"), val("range"), val("drremark")];
  if(!t[1]) return alert("Enter test name");
  investigations.push(t);
  renderTable("investTable", investigations);
  clear(["testcat","testname","reports","range","drremark"]);
}

function addPrescription(){
  const t=[val("formavail"), val("generic"), val("comment")];
  if(!t[1]) return alert("Enter medicine name");
  prescriptions.push(t);
  renderTable("rxTable", prescriptions);
  clear(["formavail","generic","comment"]);
}

function renderTable(id, data){
  const tbody = document.querySelector(`#${id} tbody`);
  tbody.innerHTML = "";
  data.forEach(r=>{
    const tr=document.createElement("tr");
    r.forEach(c=>{
      const td=document.createElement("td");
      td.textContent=c;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
}



function collectFormData(){
  // ---- INVESTIGATION TABLE ----
  const inv = [];
  document.querySelectorAll("#investTable tbody tr").forEach(tr=>{
    const tds = [...tr.children].map(td=>td.textContent.trim());
    inv.push(tds);
  });

  // Convert multiple investigation rows → newline-separated strings
  const testCategory = inv.map(r => r[0]).join('\n');
  const testName     = inv.map(r => r[1]).join('\n');
  const reports      = inv.map(r => r[2]).join('\n');
  const normalRange  = inv.map(r => r[3]).join('\n');
  const drRemark     = inv.map(r => r[4]).join('\n');

  // ---- PRESCRIPTION TABLE ----
  const rx = [];
  document.querySelectorAll("#rxTable tbody tr").forEach(tr=>{
    const tds = [...tr.children].map(td=>td.textContent.trim());
    rx.push(tds);
  });

  // Convert multiple prescription rows → newline-separated strings
  const formAvail = rx.map(r => r[0]).join('\n');
  const medicine  = rx.map(r => r[1]).join('\n');
  const comment   = rx.map(r => r[2]).join('\n');

  // ---- RETURN FINAL DATA ----
  return {
    date: val("date"),
    opd: val("opd"),
    patientName: val("pname"),
    mobile: val("mobile"),
    gender: val("gender"),
    age: val("age"),
    department: val("dept"),
    doctor: val("doctor"),
    chiefComplaint: val("chief"),
    subSymptoms: val("subsym"),
    specificComplaint: val("specific"),
    weight: val("weight"),
    bp: val("bp"),
    pulse: val("pulse"),
    temp: val("temp"),
    sugar: val("sugar"),
    // New flattened multiline fields
    testCategory, testName, reports, normalRange, drRemark,
    formAvail, medicine, comment,
    diagnosis: val("diagnosis"),
    advice: val("advice"),
    effect: val("effect"),
    drRemarks: val("remarks")
  };
}


