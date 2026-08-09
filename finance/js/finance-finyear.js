// finance/js/finance-finyear.js — financial year summary view

function loadFinYear() {
  google.script.run
    .withSuccessHandler(function(data) {
      var html = '<table><thead><tr><th>Period</th><th>Assessment Year</th><th>Excel Gross</th><th>Form16</th><th>Home Pay</th><th>NPS</th><th>EMI Total</th><th>Actions</th></tr></thead><tbody>';
      data.forEach(function(r) {
        html += '<tr><td>' + (r.Period||'') + '</td><td>' + (r.Assessment_Year||'') + '</td>';
        html += '<td class="text-right">' + fmt(r.Excel_Gross_Salary) + '</td><td class="text-right">' + fmt(r.Form16_Gross_Salary) + '</td>';
        html += '<td class="text-right">' + fmt(r.Home_Pay_Salary) + '</td><td class="text-right">' + fmt(r.NPS) + '</td>';
        html += '<td class="text-right">' + fmt(r.Total_EMI_Loan_Insurance_Major) + '</td>';
        html += '<td><button class="btn btn-sm btn-primary" onclick="editFinYear(' + r.ID + ')">Edit</button> <button class="btn btn-sm btn-success" onclick="recalcFinYear(' + r.ID + ')">&#8635;</button> <button class="btn btn-sm btn-danger" onclick="deleteFinYear(' + r.ID + ')">Del</button></td></tr>';
      });
      html += '</tbody></table>';
      document.getElementById('finyearTableWrap').innerHTML = html;
    })
    .getFinYearSummary();
}

var FINYEAR_FIELDS = [
  'Period','Assessment_Year','Excel_Gross_Salary','Cumulative_Gross_Salary','Form16_Gross_Salary','Home_Pay_Salary',
  'NPS','NPS_GC','Karanja_Society','Dockyard_Bank','DCRB','ELWC','Over_Time',
  'Amount_Paid_Credited','Amount_Tax_Deducted','Amount_Tax_Deposited','Claimed_Amount','Returned_Amount',
  'LIC','Term_Insurance','Health_Insurance','Loan','Other','Major_Transactions',
  'Total_EMI_Loan_Insurance_Major','Bulk_Other_Income','Home_Pay_Minus_EMI_Loan_Kharcha'
];

function openFinYearForm(data) {
  document.getElementById('finyearFormCard').classList.remove('hidden');
  document.getElementById('finyearAutoSection').style.display = 'block';
  document.getElementById('finyearNoData').classList.add('hidden');

  if (data && data.ID) {
    finyearFormMode = 'edit'; finyearFormId = data.ID;
    document.getElementById('finyearFormTitle').textContent = 'Edit Financial Year';
    document.getElementById('finyearAutoSection').style.display = 'none';
    buildFinYearFields(FINYEAR_FIELDS, data);
  } else {
    finyearFormMode = 'add'; finyearFormId = null;
    document.getElementById('finyearFormTitle').textContent = 'Add Financial Year';
    buildFinYearFields(FINYEAR_FIELDS, null);
    google.script.run
      .withSuccessHandler(function(years) {
        var sel = document.getElementById('finyearYearSelect');
        sel.innerHTML = '<option value="">-- Select Year --</option>';
        years.forEach(function(y) { sel.innerHTML += '<option value="' + y + '">' + y + '</option>'; });
      })
      .getAvailableAssessmentYears();
  }
}

function buildFinYearFields(fields, data) {
  var html = '';
  fields.forEach(function(f) {
    var val = (data && data[f] !== undefined && data[f] !== null) ? data[f] : '';
    html += '<div class="form-group"><label>' + f.replace(/_/g,' ') + '</label><input type="text" id="ffield-' + f + '" value="' + val + '"></div>';
  });
  document.getElementById('finyearFields').innerHTML = html;
}

function autoFillFinYear() {
  var year = document.getElementById('finyearYearSelect').value;
  if (!year) { showToast('Select an assessment year first', 'error'); return; }
  document.getElementById('finyearNoData').classList.add('hidden');
  google.script.run
    .withSuccessHandler(function(computed) {
      var hasSalaryData = computed.Excel_Gross_Salary > 0 || computed.Home_Pay_Salary > 0;
      if (!hasSalaryData) {
        document.getElementById('finyearNoData').classList.remove('hidden');
      }
      FINYEAR_FIELDS.forEach(function(f) {
        var el = document.getElementById('ffield-' + f);
        if (el) el.value = (computed[f] !== undefined && computed[f] !== null) ? computed[f] : '';
      });
      showToast('Auto-filled from salary, loans & transactions data', 'info');
    })
    .autoComputeFinYear(year);
}

function collectFinYearForm() {
  var data = {};
  FINYEAR_FIELDS.forEach(function(f) {
    var el = document.getElementById('ffield-' + f);
    data[f] = el ? el.value : '';
  });
  if (finyearFormId) data.ID = finyearFormId;
  return data;
}

function saveFinYear() {
  var data = collectFinYearForm();
  if (!data.Period && !data.Assessment_Year) { showToast('Assessment Year is required', 'error'); return; }
  google.script.run
    .withSuccessHandler(function(res) {
      if (res.success) { showToast('Fin Year ' + res.action, 'success'); closeFinYearForm(); loadFinYear(); }
    })
    .saveFinYearSummary(data);
}

function recalcFinYear(id) {
  if (!confirm('Recalculate this record from current data?')) return;
  google.script.run
    .withSuccessHandler(function(all) {
      var record = null;
      for (var i = 0; i < all.length; i++) { if (Number(all[i].ID) === Number(id)) { record = all[i]; break; } }
      if (!record) { showToast('Not found', 'error'); return; }
      google.script.run
        .withSuccessHandler(function(computed) {
          var merged = {};
          FINYEAR_FIELDS.forEach(function(f) {
            if (computed[f] !== undefined && computed[f] !== null && computed[f] !== 0) {
              merged[f] = computed[f];
            } else {
              merged[f] = (record[f] !== undefined && record[f] !== null) ? record[f] : '';
            }
          });
          merged.ID = id;
          google.script.run
            .withSuccessHandler(function(res) {
              showToast('Recalculated', 'success');
              loadFinYear();
            })
            .saveFinYearSummary(merged);
        })
        .autoComputeFinYear(record.Assessment_Year);
    })
    .getFinYearSummary();
}

function editFinYear(id) {
  google.script.run
    .withSuccessHandler(function(data) {
      for (var i = 0; i < data.length; i++) { if (Number(data[i].ID) === Number(id)) { openFinYearForm(data[i]); return; } }
      showToast('Not found','error');
    })
    .getFinYearSummary();
}

function deleteFinYear(id) {
  if (!confirm('Delete this record?')) return;
  google.script.run
    .withSuccessHandler(function() { showToast('Deleted','info'); loadFinYear(); })
    .deleteFinYearSummary(id);
}

function closeFinYearForm() {
  document.getElementById('finyearFormCard').classList.add('hidden');
  finyearFormMode = 'add'; finyearFormId = null;
}
