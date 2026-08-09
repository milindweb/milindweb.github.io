// finance/js/finance-transactions.js — major transactions view

function loadTx() {
  google.script.run
    .withSuccessHandler(function(data) {
      var html = '<table><thead><tr><th>Date</th><th>Description</th><th>Amount</th><th>Category</th><th>Notes</th><th>Actions</th></tr></thead><tbody>';
      var total = 0;
      data.forEach(function(r) {
        var amt = Number(r.Amount) || 0;
        total += amt;
        html += '<tr><td>' + (r.Date||'') + '</td><td>' + (r.Description||'') + '</td><td class="text-right">' + fmt(amt) + '</td><td>' + (r.Category||'') + '</td><td>' + (r.Notes||'') + '</td>';
        html += '<td><button class="btn btn-sm btn-primary" onclick="editTx(' + r.ID + ')">Edit</button> <button class="btn btn-sm btn-danger" onclick="deleteTx(' + r.ID + ')">Del</button></td></tr>';
      });
      html += '<tr class="total-row"><td colspan="2"><strong>TOTAL</strong></td><td class="text-right">' + fmt(total) + '</td><td></td><td></td><td></td></tr>';
      html += '</tbody></table>';
      document.getElementById('txTableWrap').innerHTML = html;
    })
    .getMajorTransactions();
}

function openTxForm(data) {
  document.getElementById('txFormCard').classList.remove('hidden');
  var html = '';
  html += '<div class="form-group"><label>Date</label><input type="date" id="tfield-Date" value="' + formatDateForInput(data && data.Date) + '"></div>';
  html += '<div class="form-group"><label>Description</label><input type="text" id="tfield-Description" value="' + ((data && data.Description) || '') + '"></div>';
  html += '<div class="form-group"><label>Amount</label><input type="text" id="tfield-Amount" value="' + ((data && data.Amount) || '') + '"></div>';
  html += '<div class="form-group"><label>Category</label><input type="text" id="tfield-Category" value="' + ((data && data.Category) || '') + '"></div>';
  html += '<div class="form-group"><label>Notes</label><input type="text" id="tfield-Notes" value="' + ((data && data.Notes) || '') + '"></div>';
  document.getElementById('txFields').innerHTML = html;
  if (data && data.ID) {
    txFormMode = 'edit'; txFormId = data.ID;
    document.getElementById('txFormTitle').textContent = 'Edit Transaction';
  } else {
    txFormMode = 'add'; txFormId = null;
    document.getElementById('txFormTitle').textContent = 'Add Transaction';
  }
}

function collectTxForm() {
  var data = {};
  ['Date','Description','Amount','Category','Notes'].forEach(function(f) {
    var el = document.getElementById('tfield-' + f);
    data[f] = el ? el.value : '';
  });
  if (txFormId) data.ID = txFormId;
  return data;
}

function saveTx() {
  var data = collectTxForm();
  google.script.run
    .withSuccessHandler(function(res) {
      if (res.success) { showToast('Transaction ' + res.action, 'success'); closeTxForm(); loadTx(); }
      else { showToast(res.message || 'Error', 'error'); }
    })
    .saveMajorTransaction(data);
}

function editTx(id) {
  google.script.run
    .withSuccessHandler(function(data) {
      for (var i = 0; i < data.length; i++) { if (Number(data[i].ID) === Number(id)) { openTxForm(data[i]); return; } }
      showToast('Not found','error');
    })
    .getMajorTransactions();
}

function deleteTx(id) {
  if (!confirm('Delete this transaction?')) return;
  google.script.run
    .withSuccessHandler(function() { showToast('Deleted','info'); loadTx(); })
    .deleteMajorTransaction(id);
}

function closeTxForm() {
  document.getElementById('txFormCard').classList.add('hidden');
  txFormMode = 'add'; txFormId = null;
}
