// finance/js/finance-salary.js — monthly salary view

var SALARY_FIELDS = {
  earnings: [
    {key:'BASIC', label:'BASIC'}, {key:'DA', label:'DA'}, {key:'TPTA', label:'TPTA'},
    {key:'TPTADA', label:'TPTADA'}, {key:'SOT', label:'SOT'}, {key:'DOT', label:'DOT'},
    {key:'NPS_GC_EARN', label:'NPS GC'}, {key:'TADA', label:'TADA'}, {key:'AO_PA', label:'A/O P&A'},
    {key:'AO_TPTADA', label:'A/O TPTA&DA'}, {key:'OTARRS', label:'OTARRS'}, {key:'BONUS', label:'BONUS'},
    {key:'EXTRA_EARN', label:'EXTRA'}
  ],
  deductions: [
    {key:'NPS', label:'NPS'}, {key:'NPS_GC_DED', label:'NPS GC'}, {key:'CGHS', label:'CGHS'},
    {key:'CGEIS', label:'CGEIS'}, {key:'LFEE', label:'LFEE'}, {key:'ELWC', label:'ELWC'},
    {key:'LATE', label:'LATE'}, {key:'IT', label:'IT'}, {key:'CESS', label:'CESS'},
    {key:'ABSCENT', label:'ABSCENT'}, {key:'R_OT', label:'R/OT'}, {key:'EXTRA_DED', label:'EXTRA'}
  ],
  recoveries: [
    {key:'NADKSF', label:'NADKSF'}, {key:'DCRB', label:'DCRB'}, {key:'NCHCF', label:'NCHCF'},
    {key:'NDCB', label:'NDCB'}, {key:'LWFL', label:'LWFL'}, {key:'RCOURT', label:'RCOURT'},
    {key:'EXTRA_REC', label:'EXTRA'}
  ],
  ot: [
    {key:'SINGLE_OT', label:'SINGLE OT'}, {key:'DOUBLE_OT', label:'DOUBLE OT'}
  ],
  summary: [
    {key:'GROSS_EARN', label:'GROSS', readonly:true},
    {key:'DEDUCTION_TOTAL', label:'DEDUCTION', readonly:true},
    {key:'NET_PAY', label:'NET PAY', readonly:true},
    {key:'RECOVERY_TOTAL', label:'RECOVERY', readonly:true},
    {key:'HOME_PAY', label:'HOME PAY', readonly:true},
    {key:'REMARK', label:'REMARK'}
  ]
};

function loadSalary() {
  var sel = document.getElementById('salaryYearSelect');
  google.script.run
    .withSuccessHandler(function(years) {
      var cur = sel.value;
      sel.innerHTML = '<option value="">All Years</option>';
      years.forEach(function(y) { sel.innerHTML += '<option value="' + y + '">' + y + '</option>'; });
      if (cur) sel.value = cur;
      renderSalaryTable(sel.value);
    })
    .getSalaryYears();
}

function renderSalaryTable(year) {
  google.script.run
    .withSuccessHandler(function(data) {
      if (year) data = data.filter(function(r) { return String(r.Year) === String(year); });
      var html = '<table><thead><tr><th>Month</th><th>Year</th><th>BASIC</th><th>DA</th><th>TPTA</th><th>SOT</th><th>DOT</th><th>GROSS</th><th>DED</th><th>NET</th><th>REC</th><th>HOME</th><th>Remark</th><th>Actions</th></tr></thead><tbody>';
      var totalGross = 0, totalDed = 0, totalNet = 0, totalHome = 0;
      data.forEach(function(r) {
        var g = Number(r.GROSS_EARN)||0, d = Number(r.DEDUCTION_TOTAL)||0, n = Number(r.NET_PAY)||0, h = Number(r.HOME_PAY)||0;
        totalGross += g; totalDed += d; totalNet += n; totalHome += h;
        html += '<tr>';
        html += '<td>' + (r.Month||'') + '</td><td>' + (r.Year||'') + '</td>';
        html += '<td class="text-right">' + (r.BASIC||'') + '</td>';
        html += '<td class="text-right">' + (r.DA||'') + '</td>';
        html += '<td class="text-right">' + (r.TPTA||'') + '</td>';
        html += '<td class="text-right">' + (r.SOT||'') + '</td>';
        html += '<td class="text-right">' + (r.DOT||'') + '</td>';
        html += '<td class="text-right">' + fmt(g) + '</td>';
        html += '<td class="text-right">' + fmt(d) + '</td>';
        html += '<td class="text-right">' + fmt(n) + '</td>';
        html += '<td class="text-right">' + (r.RECOVERY_TOTAL||'') + '</td>';
        html += '<td class="text-right">' + fmt(h) + '</td>';
        html += '<td>' + (r.REMARK||'') + '</td>';
        html += '<td><button class="btn btn-sm btn-primary" onclick="editSalary(' + r.ID + ')">Edit</button> <button class="btn btn-sm btn-danger" onclick="deleteSalary(' + r.ID + ')">Del</button></td>';
        html += '</tr>';
      });
      html += '<tr class="total-row"><td colspan="6"><strong>TOTAL</strong></td><td class="text-right">' + fmt(totalGross) + '</td><td class="text-right">' + fmt(totalDed) + '</td><td class="text-right">' + fmt(totalNet) + '</td><td></td><td class="text-right">' + fmt(totalHome) + '</td><td></td><td></td></tr>';
      html += '</tbody></table>';
      document.getElementById('salaryTableWrap').innerHTML = html;
    })
    .getMonthlySalary(year);
}

function buildSlipFields(containerId, defs, data) {
  var html = '';
  defs.forEach(function(fd) {
    var key = fd.key;
    var val = (data && data[key] !== undefined && data[key] !== null) ? data[key] : '';
    var ro = fd.readonly ? 'readonly class="readonly"' : '';
    html += '<div class="form-group"><label>' + fd.label + '</label><input type="text" id="field-' + key + '" value="' + val + '" ' + ro + '></div>';
  });
  document.getElementById(containerId).innerHTML = html;
}

function openSalaryForm(data) {
  document.getElementById('salaryFormCard').classList.remove('hidden');
  buildSlipFields('earningsFields', SALARY_FIELDS.earnings, data);
  buildSlipFields('deductionsFields', SALARY_FIELDS.deductions, data);
  buildSlipFields('recoveriesFields', SALARY_FIELDS.recoveries, data);
  buildSlipFields('otFields', SALARY_FIELDS.ot, data);
  buildSlipFields('summaryFields', SALARY_FIELDS.summary, data);

  if (data && data.ID) {
    document.getElementById('field-Month').value = data.Month || '';
    document.getElementById('field-Year').value = data.Year || '';
    salaryFormMode = 'edit'; salaryFormId = data.ID;
    document.getElementById('salaryFormTitle').textContent = 'Edit Salary - ' + (data.Month||'') + ' ' + (data.Year||'');
  } else {
    salaryFormMode = 'add'; salaryFormId = null;
    document.getElementById('salaryFormTitle').textContent = 'Add Monthly Salary';
  }
  addCalcListeners();
  recalcSalary();
}

function addCalcListeners() {
  var allKeys = [];
  SALARY_FIELDS.earnings.forEach(function(fd) { if (!fd.readonly) allKeys.push(fd.key); });
  SALARY_FIELDS.deductions.forEach(function(fd) { if (!fd.readonly) allKeys.push(fd.key); });
  SALARY_FIELDS.recoveries.forEach(function(fd) { if (!fd.readonly) allKeys.push(fd.key); });
  allKeys.forEach(function(k) {
    var el = document.getElementById('field-' + k);
    if (el) el.addEventListener('input', recalcSalary);
  });
}

function recalcSalary() {
  function sumKeys(keys) {
    var t = 0;
    keys.forEach(function(f) {
      var el = document.getElementById('field-' + f);
      t += Number(el ? el.value : 0) || 0;
    });
    return t;
  }

  var earnKeys = ['BASIC','DA','TPTA','TPTADA','SOT','DOT','NPS_GC_EARN','TADA','AO_PA','AO_TPTADA','OTARRS','BONUS','EXTRA_EARN'];
  var dedKeys = ['NPS','NPS_GC_DED','CGHS','CGEIS','LFEE','ELWC','LATE','IT','CESS','ABSCENT','R_OT','EXTRA_DED'];
  var recKeys = ['NADKSF','DCRB','NCHCF','NDCB','LWFL','RCOURT','EXTRA_REC'];

  var gross = sumKeys(earnKeys);
  var ded = sumKeys(dedKeys);
  var rec = sumKeys(recKeys);
  var net = gross - ded;
  var home = net - rec;

  var setVal = function(key, val) {
    var el = document.getElementById('field-' + key);
    if (el) el.value = val;
  };

  setVal('GROSS_EARN', gross);
  setVal('DEDUCTION_TOTAL', ded);
  setVal('RECOVERY_TOTAL', rec);
  setVal('NET_PAY', net);
  setVal('HOME_PAY', home);
}

function collectSalaryForm() {
  var allKeys = ['Month','Year'];
  SALARY_FIELDS.earnings.forEach(function(fd) { allKeys.push(fd.key); });
  SALARY_FIELDS.deductions.forEach(function(fd) { allKeys.push(fd.key); });
  SALARY_FIELDS.recoveries.forEach(function(fd) { allKeys.push(fd.key); });
  SALARY_FIELDS.ot.forEach(function(fd) { allKeys.push(fd.key); });
  SALARY_FIELDS.summary.forEach(function(fd) { allKeys.push(fd.key); });
  allKeys = allKeys.filter(function(v,i,a) { return a.indexOf(v) === i; });

  var data = {};
  allKeys.forEach(function(f) {
    var el = document.getElementById('field-' + f);
    data[f] = el ? el.value : '';
  });
  if (salaryFormId) data.ID = salaryFormId;
  return data;
}

function saveSalary() {
  var data = collectSalaryForm();
  if (!data.Month || !data.Year) { showToast('Month and Year are required', 'error'); return; }
  google.script.run
    .withSuccessHandler(function(res) {
      if (res.success) {
        showToast('Salary ' + res.action + ' successfully', 'success');
        closeSalaryForm();
        loadSalary();
      }
    })
    .saveMonthlySalary(data);
}

function editSalary(id) {
  google.script.run
    .withSuccessHandler(function(data) {
      if (data) openSalaryForm(data);
      else showToast('Record not found', 'error');
    })
    .getMonthlySalaryById(id);
}

function deleteSalary(id) {
  if (!confirm('Delete this salary record?')) return;
  google.script.run
    .withSuccessHandler(function() {
      showToast('Record deleted', 'info');
      loadSalary();
    })
    .deleteMonthlySalary(id);
}

function closeSalaryForm() {
  document.getElementById('salaryFormCard').classList.add('hidden');
  salaryFormMode = 'add'; salaryFormId = null;
}
