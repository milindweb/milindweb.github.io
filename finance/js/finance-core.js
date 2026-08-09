// finance/js/finance-core.js — shared state, toast, auth bridge, navigation

// ===================== STATE =====================
var currentUser = null;
var currentView = 'dashboard';
var salaryFormMode = 'add';
var salaryFormId = null;
var finyearFormMode = 'add';
var finyearFormId = null;
var loanFormMode = 'add';
var loanFormId = null;
var txFormMode = 'add';
var txFormId = null;

var MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ===================== TOAST =====================
function showToast(msg, type) {
  var t = document.getElementById('toast');
  t.textContent = msg; t.className = 'toast toast-' + type + ' show';
  setTimeout(function(){ t.className = 'toast'; }, 3000);
}

// ===================== ACCESS GATE / SITE AUTH =====================
// Bridge the PFMS UI's google.script.run calls to the MilindWeb backend.
window.google = window.google || {};
window.google.script = window.google.script || {};
window.google.script.run = window.FinanceAPI.run;

function logout() {
  currentUser = null;
  if (window.Auth) window.Auth.logout();
  window.location.href = '/';
}

// ===================== NAVIGATION =====================
function showView(name) {
  currentView = name;
  document.querySelectorAll('.sidebar-nav a').forEach(function(a) { a.classList.remove('active'); });
  document.querySelectorAll('.sidebar-nav a').forEach(function(a) {
    if (a.getAttribute('onclick').indexOf(name) >= 0) a.classList.add('active');
  });
  loadView(name);
}

var VALID_VIEWS = ['dashboard', 'salary', 'finyear', 'loans', 'transactions', 'reports', 'settings'];
function viewFromHash() {
  var h = window.location.hash.replace('#', '');
  return VALID_VIEWS.indexOf(h) >= 0 ? h : null;
}
window.addEventListener('hashchange', function () {
  var v = viewFromHash();
  if (v) showView(v);
});

function loadView(name) {
  var viewEl = document.getElementById('view-' + name);
  if (!viewEl) { name = 'dashboard'; viewEl = document.getElementById('view-dashboard'); }
  if (!viewEl) return;
  var titles = { dashboard:'Dashboard', salary:'Monthly Salary', finyear:'Financial Year Summary', loans:'Loans & Insurance', transactions:'Major Transactions', reports:'Reports & Utilities', settings:'Settings' };
  document.getElementById('pageTitle').textContent = titles[name] || name;
  document.querySelectorAll('.view').forEach(function(v) { v.classList.add('hidden'); });
  viewEl.classList.remove('hidden');
  if (name === 'dashboard') loadDashboard();
  else if (name === 'salary') loadSalary();
  else if (name === 'finyear') loadFinYear();
  else if (name === 'loans') loadLoans();
  else if (name === 'transactions') loadTx();
  else if (name === 'reports') {}
  else if (name === 'settings') loadSettings();
}
