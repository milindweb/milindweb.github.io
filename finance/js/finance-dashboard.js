// finance/js/finance-dashboard.js — dashboard view

var _dashData = null;
var _salaryRecords = [];

function loadDashboard() {
  google.script.run
    .withSuccessHandler(function(data) {
      _dashData = data;
      renderDashboard();
    })
    .getDashboardData();
  google.script.run
    .withSuccessHandler(function(years) {
      var sel = document.getElementById('fyChartYear');
      sel.innerHTML = '<option value="">-- All --</option>';
      years.forEach(function(y) { sel.innerHTML += '<option value="' + y + '">' + y + '</option>'; });
      var ysel = document.getElementById('dashYear');
      ysel.innerHTML = '<option value="">All Years</option>';
      years.forEach(function(y) { ysel.innerHTML += '<option value="' + y + '">' + y + '</option>'; });
    })
    .getAvailableAssessmentYears();
  google.script.run
    .withSuccessHandler(function(records) {
      _salaryRecords = records || [];
    })
    .getMonthlySalary();
}

function renderDashboard() {
  if (!_dashData) return;
  var month = document.getElementById('dashMonth').value;
  var year = document.getElementById('dashYear').value;
  if (month && year && _salaryRecords.length) {
    var record = null;
    for (var i = 0; i < _salaryRecords.length; i++) {
      var r = _salaryRecords[i];
      if (r.Month === month && String(r.Year) === year) { record = r; break; }
    }
    if (record) {
      renderMonthCards(record);
      renderPerMonthDonut(record);
      renderFinYearChart();
      return;
    }
  }
  renderStatCards(_dashData);
  renderAllCharts(_dashData);
}

function onDashFilterChange() { renderDashboard(); }

function mcard(label, value, cls, pct) {
  var pctHtml = pct !== undefined ? '<div class="mpct" style="color:' + (pct < 30 ? '#e94560' : '#27ae60') + ';">' + pct.toFixed(1) + '%</div>' : '';
  return '<div class="mcard ' + cls + '"><div class="mlabel">' + label + '</div><div class="mvalue">' + value + '</div>' + pctHtml + '</div>';
}

function renderStatCards(data) {
  var s = data.salary || {};
  var g = Number(s.totalGross) || 1;
  document.getElementById('statCards').innerHTML =
    mcard('Total Gross', fmt(s.totalGross), 'gross') +
    mcard('Total Deductions', fmt(s.totalDeduction), 'ded', (s.totalDeduction/g)*100) +
    mcard('Net Pay', fmt(s.totalNetPay), 'net', (s.totalNetPay/g)*100) +
    mcard('Home Pay', fmt(s.totalHomePay), 'home', (s.totalHomePay/g)*100);
}

function renderMonthCards(r) {
  var g = Number(r.GROSS_EARN) || 0;
  var d = Number(r.DEDUCTION_TOTAL) || 0;
  var n = Number(r.NET_PAY) || 0;
  var h = Number(r.HOME_PAY) || 0;
  document.getElementById('statCards').innerHTML =
    mcard('Gross', fmt(g), 'gross') +
    mcard('Deduction', fmt(d), 'ded', g ? (d/g)*100 : 0) +
    mcard('Net Pay', fmt(n), 'net', g ? (n/g)*100 : 0) +
    mcard('Home Pay', fmt(h), 'home', g ? (h/g)*100 : 0);
}

function renderPerMonthDonut(r) {
  drawDonutChart('chartDonut', [
    { label: 'Home Pay', value: Number(r.HOME_PAY) || 0, color: '#27ae60' },
    { label: 'Recovery', value: Number(r.RECOVERY_TOTAL) || 0, color: '#f39c12' },
    { label: 'Deductions', value: Number(r.DEDUCTION_TOTAL) || 0, color: '#e94560' }
  ]);
}

function renderAllCharts(data) {
  var s = data.salary || {};
  drawDonutChart('chartDonut', [
    { label: 'Home Pay', value: Number(s.totalHomePay) || 0, color: '#27ae60' },
    { label: 'Recovery', value: Number(s.totalRecovery) || 0, color: '#f39c12' },
    { label: 'Deductions', value: Number(s.totalDeduction) || 0, color: '#e94560' }
  ]);
  renderFinYearChart();
}

function renderFinYearChart() {
  var year = document.getElementById('fyChartYear').value;
  var noDataEl = document.getElementById('fyChartNoData');
  if (noDataEl) noDataEl.style.display = 'none';

  var canvas = document.getElementById('chartFinYear');
  if (canvas) {
    var ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  google.script.run
    .withSuccessHandler(function(data) {
      if (!data || data.length === 0) {
        if (noDataEl) noDataEl.style.display = 'block';
        return;
      }
      var labels = data.map(function(r){ return r.month ? r.month.substr(0,3) : ''; });
      var grossD = data.map(function(r){ return r.gross; });
      var netD = data.map(function(r){ return r.netPay; });
      var homeD = data.map(function(r){ return r.homePay; });
      drawLineChart('chartFinYear', labels, [
        { label: 'Gross', data: grossD, color: '#0f3460', fill: 'rgba(15,52,96,0.08)' },
        { label: 'Net Pay', data: netD, color: '#e94560', fill: 'rgba(233,69,96,0.08)' },
        { label: 'Home Pay', data: homeD, color: '#27ae60', fill: 'rgba(39,174,96,0.08)' }
      ]);
    })
    .getFinYearMonthlyData(year);
}
