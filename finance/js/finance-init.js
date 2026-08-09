// finance/js/finance-init.js — auto init (site auth gate)

function showFinanceApp(user) {
  currentUser = user.username;
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('app').style.display = 'block';
  document.getElementById('userDisplay').textContent = 'Signed in as ' + currentUser + (user.role ? ' (' + user.role + ')' : '');
  loadView(window.FINANCE_PAGE || 'dashboard');
  // Ensure sheets exist (idempotent — safe to run every load)
  window.FinanceAPI.call('setupSheets', []).catch(function() {});
}

function showFinanceDenied() {
  document.getElementById('gateLoading').style.display = 'none';
  document.getElementById('gateDenied').style.display = 'block';
}

document.addEventListener('DOMContentLoaded', function() {
  // config/api-client/auth/finance-api loaded synchronously in <head>.
  if (!window.Auth || !window.Auth.isLoggedIn()) {
    window.location.href = '/login?next=/finance' + (window.FINANCE_PAGE && window.FINANCE_PAGE !== 'dashboard' ? '/' + window.FINANCE_PAGE : '');
    return;
  }
  var user = window.Auth.user();
  if (window.Auth.hasModule('finance')) {
    showFinanceApp(user);
    var v = viewFromHash();
    if (v) showView(v);
    return;
  }
  // Stale cache? Refresh the session once before denying access.
  showFinanceDenied();
  window.Auth.checkSession().then(function (ok) {
    if (ok && window.Auth.hasModule('finance')) showFinanceApp(window.Auth.user());
    else if (!ok) window.location.href = '/login?next=/finance' + (window.FINANCE_PAGE && window.FINANCE_PAGE !== 'dashboard' ? '/' + window.FINANCE_PAGE : '');
  }).catch(function () {});
});
