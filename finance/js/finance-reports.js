// finance/js/finance-reports.js — reports & utilities view

function exportCSV() {
  var sheet = document.getElementById('exportSheet').value;
  google.script.run
    .withSuccessHandler(function(csv) {
      var blob = new Blob([csv], { type: 'text/csv' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url; a.download = sheet + '_export.csv'; a.click();
      URL.revokeObjectURL(url);
      showToast('Exported ' + sheet, 'success');
    })
    .exportSheetAsCSV(sheet);
}

function importCSV() {
  var sheet = document.getElementById('importSheet').value;
  var csv = document.getElementById('importCSVText').value;
  if (!csv.trim()) { showToast('Paste CSV data first', 'error'); return; }
  google.script.run
    .withSuccessHandler(function(res) {
      if (res.success) { showToast('Imported ' + res.count + ' rows', 'success'); document.getElementById('importCSVText').value = ''; }
      else { showToast(res.message || 'Import failed', 'error'); }
    })
    .importCSV(sheet, csv);
}

function initApp() {
  if (!confirm('Initialize sheets? This will create any missing sheets and default data.')) return;
  google.script.run
    .withSuccessHandler(function(msg) {
      showToast(msg, 'success');
    })
    .setupSheets();
}
