// data/patientform.js
// Place at: js/patientform.js or data/patientform.js (adjust the HTML src accordingly)

(() => {
  "use strict";

  // ---------- CONFIG ----------
  const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbw5Fq8xJeXjPilVb01Iz4lArtrgfq5jd8A55U8Zjp3taVRkni20QrXgHiYa1eEUN1ly/exec";
  // Endpoint: GET ?action=list or ?action=get&id=OPD & ?action=recent&field=Doctor Name
  const MAX_ROWS = 20;

  // JSON lookup files (adjust paths)
  const LOOKUP = {
    complaints: "data/complaint.json",
    dept: "data/dept.json",
    drnames: "data/drname.json",
    labtests: "data/labtest.json",
    medlist: "data/medlist.json"
  };

  // Fields mapping (header names in sheet must match these)
  const sheetHeaders = [
    "Date","OPD No","Mobile No","Patient Name","Gender","Age","Department","Doctor Name",
    "Chief Complaint","Sub-Symptoms","Specific Complaint","Weight","BP","Pulse","Temp","Sugar",
    "Test Category","Test Name","Normal Range / Limit","Reports","Test Remark",
    "Diagnosis","Form Available","Prescription (Generic API Brand Name)","Treatment Note","Advice",
    "Effect After Treatment","Dr. Note / Remarks","Bill / Description","Rate","Quantity","Discount","Amount","Total Amount","Bill Remark"
  ];

  // ---------- UTIL ----------
  const $ = (sel,parent=document) => parent.querySelector(sel);
  const $$ = (sel,parent=document) => Array.from(parent.querySelectorAll(sel));
  function qId(id){ return document.getElementById(id); }

  function show(el){ if(el) el.style.display='block'; }
  function hide(el){ if(el) el.style.display='none'; }

  function formatDateISO(d=new Date()){
    // returns YYYY-MM-DD HH:mm
    const z = n => n.toString().padStart(2,'0');
    return `${d.getFullYear()}-${z(d.getMonth()+1)}-${z(d.getDate())} ${z(d.getHours())}:${z(d.getMinutes())}`;
  }
  function genOPD() {
    const d = new Date();
    const z = n => n.toString().padStart(2,'0');
    // YYMMDDHHmm
    return `${d.getFullYear().toString().slice(-2)}${z(d.getMonth()+1)}${z(d.getDate())}${z(d.getHours())}${z(d.getMinutes())}`;
  }

  function safeFetch(url, opts={}) {
    return fetch(url, opts).then(res => {
      if (!res.ok) throw new Error("Network response wasn't ok: " + res.statusText);
      return res.json().catch(()=> { throw new Error("Invalid JSON in response"); });
    });
  }

  // join array newline safe
  function joinNL(arr) {
    return Array.isArray(arr) ? arr.map(x=>x||"").join("\n") : (arr||"");
  }

  // ---------- STATE ----------
  const STATE = {
    lookups: {},
    investigations: [],
    prescriptions: [],
    billing: []
  };

  // ---------- INIT ----------
  document.addEventListener("DOMContentLoaded", init);

  async function init(){
    try {
      // set date & OPD
      qId('date').value = formatDateISO();
      qId('opdNo').value = genOPD();

      // fetch lookups (non-blocking but robust)
      await Promise.all(Object.keys(LOOKUP).map(k => fetchLookup(k)));
      attachSuggestionHelpers();

      // initialize first rows
      addInvestigationRow();
      addPrescriptionRow();
      addBillingRow();

      // wire up controls
      qId('addInvestigation').addEventListener('click', addInvestigationRow);
      qId('addPrescription').addEventListener('click', addPrescriptionRow);
      qId('addBilling').addEventListener('click', addBillingRow);
      qId('clearInvestigations').addEventListener('click', ()=> { STATE.investigations = []; renderInvestigations(); });
      qId('clearPrescriptions').addEventListener('click', ()=> { STATE.prescriptions = []; renderPrescriptions(); });
      qId('clearBilling').addEventListener('click', ()=> { STATE.billing = []; renderBilling(); recalcTotal(); });

      qId('patientForm').addEventListener('submit', onSubmit);
      qId('previewBtn').addEventListener('click', onPreview);

      // suggestion inputs: department and doctor
      setupAutocompleteInput('department', getDeptList());
      setupAutocompleteInput('doctorName', getDoctorList());
      setupAutocompleteInput('chiefComplaint', getChiefList());
      setupAutocompleteInput('subSymptoms', getSubList());

    } catch (err) {
      console.error("Init error:", err);
      alert("Initialization error: " + err.message);
    }
  }

  // ---------- Lookups ----------
  async function fetchLookup(key) {
    try {
      const url = LOOKUP[key];
      if (!url) return;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`${url} fetch failed: ${res.status}`);
      const json = await res.json();
      STATE.lookups[key] = json;
    } catch (err) {
      console.warn("Lookup fetch failed for", key, err);
      STATE.lookups[key] = null;
    }
  }

  function getDeptList(){
    const d = STATE.lookups.dept || [];
    // if array of objects with property 'department'
    return d.map(x => x.department || (x.department && x.department.trim()) || x).filter(Boolean);
  }
  function getDoctorList(){
    const d = STATE.lookups.drnams || []; // in case of key mismatch
    // fallback check
    if (STATE.lookups.drnams) return STATE.lookups.drnams.doctors || STATE.lookups.drnams;
    if (STATE.lookups.drnname) return STATE.lookups.drnname.doctors || STATE.lookups.drnname;
    if (STATE.lookups.drnames) return STATE.lookups.drnames.doctors || STATE.lookups.drnames;
    if (STATE.lookups.drnames) return STATE.lookups.drnames;
    const alt = STATE.lookups.drnames || STATE.lookups.drname || STATE.lookups.drnname;
    if (Array.isArray(alt)) return alt;
    if (alt && alt.doctors) return alt.doctors;
    return [];
  }
  function getChiefList(){
    const c = STATE.lookups.complaints || STATE.lookups.complaint || {};
    if (c && c.chiefComplaint) return [c.chiefComplaint];
    // if array of objects
    if (Array.isArray(c)) return c.map(x => x.chiefComplaint || x).filter(Boolean);
    if (c.chiefComplaints) return c.chiefComplaints;
    if (c.chiefComplaintList) return c.chiefComplaintList;
    return [];
  }
  function getSubList(){
    const c = STATE.lookups.complaints || STATE.lookups.complaint || {};
    if (c && c.subSymptoms) return c.subSymptoms || [];
    // try structures in lab-like lists
    if (Array.isArray(c)) {
      return c.flatMap(x => x.subSymptoms || []).filter(Boolean);
    }
    return [];
  }
  function getLabTests(){
    const l = STATE.lookups.labtests || STATE.lookups.labtest || {};
    if (l && l.laboratoryTests) return l.laboratoryTests;
    if (Array.isArray(l)) return l;
    return [];
  }

  // ---------- Autocomplete helpers ----------
  function setupAutocompleteInput(id, list) {
    const inp = qId(id);
    if (!inp) return;
    const box = inp.parentElement.querySelector('.suggestion-box');
    inp.addEventListener('input', ()=> {
      const q = inp.value.trim().toLowerCase();
      const arr = (Array.isArray(list) ? list : (typeof list === 'function' ? list() : [])).filter(v => v && v.toLowerCase().includes(q)).slice(0,20);
      renderSuggestions(box,arr, (val)=> { inp.value = val; hide(box); });
    });
    inp.addEventListener('focus', ()=> {
      const arr = (Array.isArray(list) ? list : (typeof list === 'function' ? list() : [])).slice(0,20);
      renderSuggestions(box,arr, (val)=> { inp.value=val; hide(box); });
    });
    document.addEventListener('click', e => { if (!inp.parentElement.contains(e.target)) hide(box); });
  }

  function renderSuggestions(box, list, onSelect) {
    if (!box) return;
    box.innerHTML = "";
    if (!list || list.length === 0) { hide(box); return; }
    list.forEach(v=>{
      const div = document.createElement('div');
      div.textContent = v;
      div.addEventListener('click', ()=> onSelect(v));
      box.appendChild(div);
    });
    show(box);
  }

  function attachSuggestionHelpers(){
    // for department & doctor we already setup, ensure dynamic update if lookups arrive later
    // additional: specific mapping to fill normal range when test selected
  }

  // ---------- Investigations dynamic rows ----------
  function addInvestigationRow(prefill) {
    if (STATE.investigations.length >= MAX_ROWS) return alert("Max investigations reached");
    const record = Object.assign({
      "Test Category": "",
      "Test Name": "",
      "Normal Range / Limit": "",
      "Reports": "",
      "Test Remark": ""
    }, prefill || {});
    STATE.investigations.push(record);
    renderInvestigations();
  }
  function removeInvestigationRow(idx) {
    STATE.investigations.splice(idx,1);
    renderInvestigations();
  }

  function renderInvestigations() {
    const tbody = qId('investigationTable').querySelector('tbody');
    tbody.innerHTML = "";
    STATE.investigations.forEach((r,i) => {
      const tr = document.createElement('tr');

      // Test Category (select from labtests categories)
      const tdCat = document.createElement('td');
      const catInput = document.createElement('input');
      catInput.type = 'text';
      catInput.value = r["Test Category"] || "";
      catInput.placeholder = "Category";
      catInput.addEventListener('input', ()=> {
        r["Test Category"] = catInput.value;
      });
      tdCat.appendChild(catInput);
      tr.appendChild(tdCat);

      // Test Name
      const tdName = document.createElement('td');
      const nameInput = document.createElement('input');
      nameInput.type='text';
      nameInput.value = r["Test Name"] || "";
      nameInput.placeholder = "Test name";
      nameInput.addEventListener('input', ()=> {
        r["Test Name"] = nameInput.value;
        // auto-fill range from labtests lookup
        const lab = findLabTest(catInput.value, nameInput.value);
        if (lab) {
          r["Normal Range / Limit"] = lab.normalRange || lab.normalRange || lab.normalRange;
          nrInput.value = r["Normal Range / Limit"];
        }
      });
      tdName.appendChild(nameInput);
      tr.appendChild(tdName);

      // Normal Range
      const tdNR = document.createElement('td');
      const nrInput = document.createElement('input'); nrInput.type='text';
      nrInput.value = r["Normal Range / Limit"] || "";
      nrInput.placeholder = "Auto / Manual";
      nrInput.addEventListener('input', ()=> r["Normal Range / Limit"] = nrInput.value);
      tdNR.appendChild(nrInput);
      tr.appendChild(tdNR);

      // Reports
      const tdRep = document.createElement('td');
      const repInput = document.createElement('input'); repInput.type='text';
      repInput.value = r["Reports"] || "";
      repInput.addEventListener('input', ()=> r["Reports"] = repInput.value);
      tdRep.appendChild(repInput);
      tr.appendChild(tdRep);

      // Test Remark
      const tdRem = document.createElement('td');
      const remInput = document.createElement('input'); remInput.type='text';
      remInput.value = r["Test Remark"] || "";
      remInput.addEventListener('input', ()=> r["Test Remark"] = remInput.value);
      tdRem.appendChild(remInput);
      tr.appendChild(tdRem);

      // Actions
      const tdAct = document.createElement('td');
      const del = document.createElement('button'); del.type='button';
      del.className='small danger';
      del.textContent='Delete';
      del.addEventListener('click', ()=> removeInvestigationRow(i));
      tdAct.appendChild(del);
      tr.appendChild(tdAct);

      tbody.appendChild(tr);
    });
  }

  function findLabTest(category, testName) {
    const labs = getLabTests();
    if (!labs || labs.length===0) return null;
    const cat = labs.find(c => (c.category||"").toLowerCase() === (category||"").toLowerCase());
    if (cat) {
      const t = (cat.tests||[]).find(tt => (tt.testName||"").toLowerCase() === (testName||"").toLowerCase());
      if (t) return t;
    }
    // fallback search across all tests
    for (const c of labs) {
      const t = (c.tests||[]).find(tt => (tt.testName||"").toLowerCase() === (testName||"").toLowerCase());
      if (t) return t;
    }
    return null;
  }

  // ---------- Prescriptions ----------
  function addPrescriptionRow(prefill){
    if (STATE.prescriptions.length >= MAX_ROWS) return alert("Max prescriptions reached");
    STATE.prescriptions.push({
      "Form Available":"",
      "Prescription":"",
      "Treatment Note":""
    });
    renderPrescriptions();
  }
  function removePrescriptionRow(idx){
    STATE.prescriptions.splice(idx,1); renderPrescriptions();
  }
  function renderPrescriptions() {
    const tbody = qId('prescriptionTable').querySelector('tbody');
    tbody.innerHTML = "";
    STATE.prescriptions.forEach((r,i) => {
      const tr = document.createElement('tr');

      // Form Available
      const tdForm = document.createElement('td');
      const formInput = document.createElement('input'); formInput.type='text';
      formInput.value = r["Form Available"]||"";
      formInput.placeholder="Tablet/Syrup";
      formInput.addEventListener('input', ()=> r["Form Available"]=formInput.value);
      tdForm.appendChild(formInput); tr.appendChild(tdForm);

      // Prescription
      const tdPres = document.createElement('td');
      const presInput = document.createElement('input'); presInput.type='text';
      presInput.value = r["Prescription"]||"";
      presInput.addEventListener('input', ()=> r["Prescription"]=presInput.value);
      tdPres.appendChild(presInput); tr.appendChild(tdPres);

      // Treatment Note
      const tdNote = document.createElement('td');
      const noteInput = document.createElement('input'); noteInput.type='text';
      noteInput.value = r["Treatment Note"]||"";
      noteInput.addEventListener('input', ()=> r["Treatment Note"]=noteInput.value);
      tdNote.appendChild(noteInput); tr.appendChild(tdNote);

      // actions
      const tdAct = document.createElement('td');
      const del = document.createElement('button'); del.type='button';
      del.className='small danger'; del.textContent='Delete';
      del.addEventListener('click', ()=> removePrescriptionRow(i));
      tdAct.appendChild(del); tr.appendChild(tdAct);

      tbody.appendChild(tr);
    });
  }

  // ---------- Billing ----------
  function addBillingRow(prefill) {
    if (STATE.billing.length >= MAX_ROWS) return alert("Max billing rows reached");
    STATE.billing.push({
      "Bill / Description":"",
      "Rate":0,
      "Quantity":1,
      "Discount":0,
      "Amount":0
    });
    renderBilling();
  }
  function removeBillingRow(idx) {
    STATE.billing.splice(idx,1); renderBilling(); recalcTotal();
  }
  function renderBilling(){
    const tbody = qId('billingTable').querySelector('tbody');
    tbody.innerHTML = "";
    STATE.billing.forEach((r,i) => {
      const tr = document.createElement('tr');

      const tdDesc = document.createElement('td');
      const desc = document.createElement('input'); desc.type='text'; desc.value=r["Bill / Description"]||"";
      desc.addEventListener('input', ()=> r["Bill / Description"]=desc.value);
      tdDesc.appendChild(desc); tr.appendChild(tdDesc);

      const tdRate = document.createElement('td');
      const rate = document.createElement('input'); rate.type='number'; rate.min=0; rate.step='0.01'; rate.value=r["Rate"]||0;
      rate.addEventListener('input', ()=> { r["Rate"]=parseFloat(rate.value)||0; computeRowAmount(i); });
      tdRate.appendChild(rate); tr.appendChild(tdRate);

      const tdQty = document.createElement('td');
      const qty = document.createElement('input'); qty.type='number'; qty.min=0; qty.value=r["Quantity"]||1;
      qty.addEventListener('input', ()=> { r["Quantity"]=parseFloat(qty.value)||0; computeRowAmount(i);});
      tdQty.appendChild(qty); tr.appendChild(tdQty);

      const tdDisc = document.createElement('td');
      const disc = document.createElement('input'); disc.type='number'; disc.min=0; disc.value=r["Discount"]||0;
      disc.addEventListener('input', ()=> { r["Discount"]=parseFloat(disc.value)||0; computeRowAmount(i);});
      tdDisc.appendChild(disc); tr.appendChild(tdDisc);

      const tdAmt = document.createElement('td');
      const amt = document.createElement('input'); amt.type='number'; amt.readOnly=true; amt.value=r["Amount"]||0;
      tdAmt.appendChild(amt); tr.appendChild(tdAmt);

      const tdAct = document.createElement('td');
      const del = document.createElement('button'); del.type='button'; del.className='small danger'; del.textContent='Delete';
      del.addEventListener('click', ()=> removeBillingRow(i));
      tdAct.appendChild(del); tr.appendChild(tdAct);

      tbody.appendChild(tr);
    });
    recalcTotal();
  }

  function computeRowAmount(i) {
    const r = STATE.billing[i];
    if (!r) return;
    const amount = (Number(r.Rate)||0) * (Number(r.Quantity)||0);
    const discount = Number(r.Discount)||0;
    const final = Math.max(0, amount - discount);
    r.Amount = Number(final.toFixed(2));
    renderBilling(); // re-render to reflect values
  }

  function recalcTotal() {
    const total = STATE.billing.reduce((s,r)=> s + (Number(r.Amount)||0), 0);
    qId('totalAmount').value = total.toFixed(2);
  }

  // ---------- Preview & Submission ----------
  function collectFormData() {
    // collect fields from DOM + join multi-row sections with newline
    const data = {};
    // basic fields (use sheet header names)
    sheetHeaders.forEach(h => data[h] = "");
    // date & OPD
    data["Date"] = qId('date').value;
    data["OPD No"] = qId('opdNo').value;
    data["Mobile No"] = qId('mobile').value.trim();
    data["Patient Name"] = qId('patientName').value.trim();
    data["Gender"] = qId('gender').value;
    data["Age"] = qId('age').value;
    data["Department"] = qId('department').value.trim();
    data["Doctor Name"] = qId('doctorName').value.trim();

    data["Chief Complaint"] = qId('chiefComplaint').value.trim();
    data["Sub-Symptoms"] = qId('subSymptoms').value.trim();
    data["Specific Complaint"] = qId('specificComplaint').value.trim();

    data["Weight"] = qId('weight').value;
    data["BP"] = qId('bp').value;
    data["Pulse"] = qId('pulse').value;
    data["Temp"] = qId('temp').value;
    data["Sugar"] = qId('sugar').value;

    // Investigations — each column joined by newline
    const invCols = {
      "Test Category": STATE.investigations.map(i => i["Test Category"]||""),
      "Test Name": STATE.investigations.map(i => i["Test Name"]||""),
      "Normal Range / Limit": STATE.investigations.map(i => i["Normal Range / Limit"]||""),
      "Reports": STATE.investigations.map(i => i["Reports"]||""),
      "Test Remark": STATE.investigations.map(i => i["Test Remark"]||"")
    };
    data["Test Category"] = joinNL(invCols["Test Category"]);
    data["Test Name"] = joinNL(invCols["Test Name"]);
    data["Normal Range / Limit"] = joinNL(invCols["Normal Range / Limit"]);
    data["Reports"] = joinNL(invCols["Reports"]);
    data["Test Remark"] = joinNL(invCols["Test Remark"]);

    // Treatment / Prescriptions
    data["Diagnosis"] = qId('diagnosis').value;
    data["Form Available"] = joinNL(STATE.prescriptions.map(p=>p["Form Available"]||""));
    data["Prescription (Generic API Brand Name)"] = joinNL(STATE.prescriptions.map(p=>p["Prescription"]||""));
    data["Treatment Note"] = joinNL(STATE.prescriptions.map(p=>p["Treatment Note"]||""));
    data["Advice"] = qId('advice').value;
    data["Effect After Treatment"] = qId('effectAfter').value;
    data["Dr. Note / Remarks"] = qId('drRemarks').value;

    // Billing -> join each column
    data["Bill / Description"] = joinNL(STATE.billing.map(b=>b["Bill / Description"]||""));
    data["Rate"] = joinNL(STATE.billing.map(b=>b["Rate"]||""));
    data["Quantity"] = joinNL(STATE.billing.map(b=>b["Quantity"]||""));
    data["Discount"] = joinNL(STATE.billing.map(b=>b["Discount"]||""));
    data["Amount"] = joinNL(STATE.billing.map(b=>b["Amount"]||""));
    data["Total Amount"] = qId('totalAmount').value || "0";
    data["Bill Remark"] = qId('billRemark').value;

    return data;
  }

  async function onPreview(e) {
    try {
      const data = collectFormData();
      // perform basic required validation
      const missing = [];
      if (!data["Mobile No"]) missing.push("Mobile No");
      if (!data["Patient Name"]) missing.push("Patient Name");
      if (!data["Gender"]) missing.push("Gender");
      if (missing.length) {
        alert("Please fill required: " + missing.join(", "));
        return;
      }
      // open preview in new tab
      const w = window.open("", "_blank");
      const html = buildPreviewHTML(data);
      w.document.open();
      w.document.write(html);
      w.document.close();
    } catch (err) {
      console.error("Preview error", err);
      alert("Preview error: " + err.message);
    }
  }

  function buildPreviewHTML(data) {
    const rows = Object.entries(data).map(([k,v]) => `<tr><th style="text-align:left;padding:6px;border-bottom:1px solid #eee;width:260px">${k}</th><td style="padding:6px;border-bottom:1px solid #eee">${escapeHtml(String(v||""))}</td></tr>`).join("");
    return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Preview - ${escapeHtml(data["Patient Name"]||"")}</title>
      <style>body{font-family:system-ui,Arial;padding:12px;background:#f8fbff;color:#111}table{border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 8px 20px rgba(20,30,60,0.06)}th,td{padding:8px}</style>
      </head><body>
      <h2>Patient Preview</h2>
      <table>${rows}</table>
      <div style="margin-top:12px"><button id="edit">Edit</button><button id="submit" style="margin-left:8px">Submit to Server</button></div>
      <script>
        const data = ${JSON.stringify(data)};
        document.getElementById('edit').addEventListener('click', ()=> { window.close(); });
        document.getElementById('submit').addEventListener('click', async ()=> {
          document.getElementById('submit').disabled=true;
          try {
            const res = await fetch("${WEB_APP_URL}", {
              method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(Object.assign({action:"create"}, data))
            });
            const json = await res.json();
            alert("Server response: "+ JSON.stringify(json));
            window.close();
          } catch (e) { alert("Submit error: "+ e.message); document.getElementById('submit').disabled=false; }
        });
      </script>
      </body></html>`;
  }

  function escapeHtml(s){ return s.replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

  async function onSubmit(e) {
    e.preventDefault();
    try {
      const data = collectFormData();
      // required validation
      const missing = [];
      if (!data["Mobile No"]) missing.push("Mobile No");
      if (!data["Patient Name"]) missing.push("Patient Name");
      if (!data["Gender"]) missing.push("Gender");
      if (missing.length) return alert("Please fill required: " + missing.join(", "));
      // prepare payload
      const payload = Object.assign({action:"create"}, data);
      qId('submitBtn').disabled = true;
      qId('submitBtn').textContent = "Submitting...";

      const resp = await fetch(WEB_APP_URL, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)});
      const json = await resp.json();
      if (json && json.code === 200) {
        alert("Saved successfully: " + JSON.stringify(json.body));
        // remember recent suggestions to localStorage for quick re-use
        saveRecentLocal(data);
        // reset form for new entry
        resetFormAfterSubmit();
      } else {
        // try to show server message
        const msg = (json && json.body) ? JSON.stringify(json.body) : "Unknown server response";
        alert("Server error: " + msg);
      }
    } catch (err) {
      console.error("Submit error", err);
      alert("Submit failed: " + err.message);
    } finally {
      qId('submitBtn').disabled = false;
      qId('submitBtn').textContent = "Submit";
    }
  }

  function saveRecentLocal(data) {
    try {
      const key = "patient_recent";
      const existing = JSON.parse(localStorage.getItem(key) || "{}");
      // store a few fields
      existing.lastMobile = data["Mobile No"];
      existing.lastDoctor = data["Doctor Name"];
      existing.lastDept = data["Department"];
      existing.lastChief = data["Chief Complaint"];
      localStorage.setItem(key, JSON.stringify(existing));
    } catch (e) { /* ignore */ }
  }

  function resetFormAfterSubmit() {
    // keep recent mobile maybe; for now generate new OPD & date and clear non-compulsory fields
    qId('date').value = formatDateISO();
    qId('opdNo').value = genOPD();
    qId('mobile').value = "";
    qId('patientName').value = "";
    qId('gender').value = "";
    qId('age').value = "";
    qId('department').value = "";
    qId('doctorName').value = "";
    qId('chiefComplaint').value = "";
    qId('subSymptoms').value = "";
    qId('specificComplaint').value = "";
    qId('weight').value = ""; qId('bp').value=""; qId('pulse').value=""; qId('temp').value=""; qId('sugar').value="";
    STATE.investigations = []; STATE.prescriptions = []; STATE.billing = [];
    addInvestigationRow(); addPrescriptionRow(); addBillingRow();
    renderInvestigations(); renderPrescriptions(); renderBilling();
  }

})();
