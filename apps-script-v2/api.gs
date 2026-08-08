/**
 * api.gs — doGet / doPost router with auth guard.
 *
 * Public routes:
 *   POST { action: 'authLogin', username, password }
 *   POST { action: 'authRegister', username, password }
 *   POST { action: 'contactSubmit', module, name, mobile, email, subject, message }  (public contact form)
 *
 * Authenticated routes (require a valid session token):
 *   POST { action: 'authLogout', token }
 *   POST { action: 'authCheck', token }
 *   GET  ?action=authStatus&token=...    → current user (username/role/modules) or null
 *
 * Module routes (require token + module access via Users.modules):
 *   GET  ?module=hospital&token=...&action=list&table=patients&page=1&limit=50&q=...
 *   POST { token, module:'hospital', action:'insert', table, row }
 *   POST { token, module:'hospital', action:'update', table, id, row }
 *   POST { token, module:'hospital', action:'delete', table, id }
 *   ... same for seniority / finance / contact admin.
 */

// ---------- GET ----------

function doGet(e) {
  try {
    var p = e.parameter || {};

    // Public: current user status (no module gating)
    if (p.action === 'authStatus') {
      var u = currentUserFromToken_(p.token);
      return json_({ ok: true, user: u }); // null when not logged in
    }

    // Everything else needs a token
    var module = p.module || '';
    if (!p.token) return fail_('Login required', 401);
    if (!module) return fail_('Missing module');

    var denied = requireModule_(p.token, module);
    if (denied) return json_({ ok: false, error: denied.error }, denied.code);

    return routeModuleGet_(module, p);
  } catch (err) {
    log_(err.message || err);
    return fail_(err.message || err);
  }
}

function routeModuleGet_(module, p) {
  var ss = moduleSheet_(module);
  switch (p.action || 'list') {
    case 'get': {
      var row = tableGet_(ss, p.table, p.id);
      if (!row) return fail_('Not found', 404);
      return json_({ ok: true, data: row });
    }
    case 'count': {
      var list = rowsToObjects_(getSheet_(ss, p.table));
      return json_({ ok: true, count: list.length });
    }
    case 'list':
    default: {
      var res = tableList_(ss, p.table, p);
      return json_({ ok: true, data: res });
    }
  }
}

// ---------- POST ----------

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents || '{}');
    var action = body.action || '';

    // ---- Public routes ----
    if (action === 'authLogin') return authLogin_(body);
    if (action === 'authRegister') return authRegister_(body);
    if (action === 'contactSubmit') return contactSubmit_(body);

    // ---- Authenticated routes ----
    if (!body.token) return fail_('Login required', 401);
    if (action === 'authLogout') return authLogout_(body);
    if (action === 'authCheck') return authCheck_(body);

    // ---- Module routes (require module access) ----
    var module = body.module || '';
    if (!module) return fail_('Missing module');
    var denied = requireModule_(body.token, module);
    if (denied) return json_({ ok: false, error: denied.error }, denied.code);

    return routeModulePost_(module, body);
  } catch (err) {
    log_(err.message || err);
    return fail_(err.message || err);
  }
}

function routeModulePost_(module, body) {
  var ss = moduleSheet_(module);
  var table = body.table || '';
  if (!table) return fail_('Missing table');

  switch (body.action) {
    case 'insert':
      return json_({ ok: true, data: tableInsert_(ss, table, body.row || {}) });
    case 'update':
      if (!body.id) return fail_('Missing id');
      return json_({ ok: true, data: tableUpdate_(ss, table, body.id, body.row || {}) });
    case 'delete':
      if (!body.id) return fail_('Missing id');
      return json_({ ok: true, data: tableDelete_(ss, table, body.id) });
    default:
      return fail_('Unknown action: ' + body.action);
  }
}

// ---------- Module spreadsheet resolver ----------

function moduleSheet_(module) {
  switch (String(module).toLowerCase()) {
    case 'hospital':  return ss_(CONFIG.hospitalSheetId);
    case 'seniority': return ss_(CONFIG.senioritySheetId);
    case 'finance':   return ss_(CONFIG.financeSheetId);
    case 'contact':   return ss_(CONFIG.contactSheetId);
    default:          throw new Error('Unknown module: ' + module);
  }
}
