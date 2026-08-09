// js/seniority-init.js — auto init (site auth gate) for seniority pages.

function seniorityNextPath() {
  var p = window.location.pathname;
  if (p.indexOf('/seniority/manage') === 0) return '/seniority/manage';
  return '/seniority';
}

function showSeniorityApp() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('seniorityApp').style.display = 'block';
  // Ensure sheets exist (idempotent — safe to run every load)
  window.SeniorityAPI.call('setupSheets', []).catch(function() {});
}

function showSeniorityDenied() {
  document.getElementById('gateLoading').style.display = 'none';
  document.getElementById('gateDenied').style.display = 'block';
}

document.addEventListener('DOMContentLoaded', function() {
  // config/api-client/auth/seniority-api loaded synchronously in <head>.
  if (!window.Auth || !window.Auth.isLoggedIn()) {
    window.location.href = '/login?next=' + seniorityNextPath();
    return;
  }
  if (window.Auth.hasModule('seniority')) {
    showSeniorityApp();
    return;
  }
  // Stale cache? Refresh the session once before denying access.
  showSeniorityDenied();
  window.Auth.checkSession().then(function (ok) {
    if (ok && window.Auth.hasModule('seniority')) showSeniorityApp();
    else if (!ok) window.location.href = '/login?next=' + seniorityNextPath();
  }).catch(function () {});
});
