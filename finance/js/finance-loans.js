// finance/js/finance-loans.js — loans & insurance view

function loadLoans() {
  google.script.run
    .withSuccessHandler(function(data) {
      var html = '<table><thead><tr><th>Type</th><th>Amount</th><th>Start Date</th><th>End Date</th><th>Notes</th><th>Actions</th></tr></thead><tbody>';
      var total = 0;
      data.forEach(function(r) {
        var amt = Number(r.Amount) || 0;
        total += amt;
        html += '<tr><td><span class="badge ' + (r.Type==='LIC'?'badge-info':r.Type==='Loan'?'badge-warning':'badge-success') + '">' + (r.Type||'') + '</span></td>';
        html += '<td class="text-right">' + fmt(amt) + '</td>';
        html += '<td>' + (r.Start_Date||'') + '</td><td>' + (r.End_Date||'') + '</td><td>' + (r.Notes||'') + '</td>';
        html += '<td><button class="btn btn-sm btn-primary" onclick="editLoan(' + r.ID + ')">Edit</button> <button class="btn btn-sm btn-danger" onclick="deleteLoan(' + r.ID + ')">Del</button></td></tr>';
      });
      html += '<tr class="total-row"><td><strong>TOTAL</strong></td><td class="text-right">' + fmt(total) + '</td><td></td><td></td><td></td><td></td></tr>';
      html += '</tbody></table>';
      document.getElementById('loanTableWrap').innerHTML = html;
    })
    .getLoansInsurance();
}

var LOAN_TYPES = ['LIC','Term_Insurance','Health_Insurance','Loan','Other'];

function openLoanForm(data) {
  document.getElementById('loanFormCard').classList.remove('hidden');
  var html = '';
  html += '<div class="form-group"><label>Type</label><select id="lfield-Type">';
  LOAN_TYPES.forEach(function(t) {
    var sel = (data && data.Type === t) ? 'selected' : '';
    html += '<option value="' + t + '" ' + sel + '>' + t.replace(/_/g,' ') + '</option>';
  });
  html += '</select></div>';
  html += '<div class="form-group"><label>Amount</label><input type="text" id="lfield-Amount" value="' + ((data && data.Amount) || '') + '"></div>';
  html += '<div class="form-group"><label>Start Date</label><input type="date" id="lfield-Start_Date" value="' + formatDateForInput(data && data.Start_Date) + '"></div>';
  html += '<div class="form-group"><label>End Date</label><input type="date" id="lfield-End_Date" value="' + formatDateForInput(data && data.End_Date) + '"></div>';
  html += '<div class="form-group"><label>Notes</label><input type="text" id="lfield-Notes" value="' + ((data && data.Notes) || '') + '"></div>';
  document.getElementById('loanFields').innerHTML = html;
  if (data && data.ID) {
    loanFormMode = 'edit'; loanFormId = data.ID;
    document.getElementById('loanFormTitle').textContent = 'Edit Entry';
  } else {
    loanFormMode = 'add'; loanFormId = null;
    document.getElementById('loanFormTitle').textContent = 'Add Loan / Insurance';
  }
}

function collectLoanForm() {
  var data = {};
  data.Type = document.getElementById('lfield-Type') ? document.getElementById('lfield-Type').value : '';
  ['Amount','Start_Date','End_Date','Notes'].forEach(function(f) {
    var el = document.getElementById('lfield-' + f);
    data[f] = el ? el.value : '';
  });
  if (loanFormId) data.ID = loanFormId;
  return data;
}

function saveLoan() {
  var data = collectLoanForm();
  google.script.run
    .withSuccessHandler(function(res) {
      if (res.success) { showToast('Entry ' + res.action, 'success'); closeLoanForm(); loadLoans(); }
      else { showToast(res.message || 'Error', 'error'); }
    })
    .saveLoanInsurance(data);
}

function editLoan(id) {
  google.script.run
    .withSuccessHandler(function(data) {
      for (var i = 0; i < data.length; i++) { if (Number(data[i].ID) === Number(id)) { openLoanForm(data[i]); return; } }
      showToast('Not found','error');
    })
    .getLoansInsurance();
}

function deleteLoan(id) {
  if (!confirm('Delete this entry?')) return;
  google.script.run
    .withSuccessHandler(function() { showToast('Deleted','info'); loadLoans(); })
    .deleteLoanInsurance(id);
}

function closeLoanForm() {
  document.getElementById('loanFormCard').classList.add('hidden');
  loanFormMode = 'add'; loanFormId = null;
}
