/**
 * auth.gs — Simple login, persistent session tokens, role & module access.
 *
 * Data lives in the Milind-Auth spreadsheet:
 *   Users    : username | password | role (admin|user) | modules (comma-separated)
 *   Sessions : token | username | role | created
 *
 * No password is stored in the browser — only the session token (localStorage).
 * Tokens persist until logout (no expiry), per requirement.
 */

// ---------- Users ----------

function usersSheet_() {
  var sh = getSheet_(ss_(CONFIG.authSheetId), CONFIG.auth.usersSheet);
  ensureHeader_(sh, ['username', 'password', 'role', 'modules']);
  return sh;
}

function sessionsSheet_() {
  var sh = getSheet_(ss_(CONFIG.authSheetId), CONFIG.auth.sessionsSheet);
  ensureHeader_(sh, ['token', 'username', 'role', 'created']);
  return sh;
}

function findUser_(username) {
  var rows = rowsToObjects_(usersSheet_());
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i].username).toLowerCase() === String(username).toLowerCase()) return rows[i];
  }
  return null;
}

// ---------- Login / logout ----------

function authLogin_(body) {
  var username = String(body.username || '').trim();
  var password = String(body.password || '');
  if (!username || !password) return fail_('Username and password are required');

  var user = findUser_(username);
  if (!user || String(user.password) !== password) return fail_('Invalid username or password', 401);

  var token = Utilities.getUuid();
  sessionsSheet_().appendRow([token, user.username, user.role, nowIST_()]);

  return json_({ ok: true, token: token, user: publicUser_(user) });
}

function authRegister_(body) {
  var username = String(body.username || '').trim();
  var password = String(body.password || '');

  if (username.length < 3) return fail_('Username must be at least 3 characters');
  if (password.length < 4) return fail_('Password must be at least 4 characters');
  if (findUser_(username)) return fail_('Username already exists');

  // New users get role=user and NO module access by default.
  usersSheet_().appendRow([username, password, 'user', '']);
  return json_({ ok: true, message: 'Registered. Contact admin to grant module access.' });
}

function authLogout_(body) {
  var token = String(body.token || '');
  var sh = sessionsSheet_();
  var rows = rowsToObjects_(sh);
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i].token) === token) { sh.deleteRow(rows[i]._row); break; }
  }
  return json_({ ok: true });
}

// ---------- Session verification ----------

function verifyToken_(token) {
  if (!token) return null;
  var rows = rowsToObjects_(sessionsSheet_());
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i].token) === String(token)) return rows[i];
  }
  return null;
}

function publicUser_(user) {
  return { username: user.username, role: user.role || 'user', modules: String(user.modules || '').trim() };
}

function authCheck_(body) {
  var sess = verifyToken_(body.token);
  if (!sess) return fail_('Session expired. Please log in again.', 401);
  var user = findUser_(sess.username);
  if (!user) return fail_('User not found', 401);
  return json_({ ok: true, user: publicUser_(user) });
}

/**
 * Access guard for module routes. Returns null if allowed, else an error object.
 *   admin            → everything
 *   user with module → module listed in modules column
 *   otherwise        → denied
 */
function requireModule_(token, module) {
  var sess = verifyToken_(token);
  if (!sess) return { ok: false, error: 'Login required', code: 401 };
  var user = findUser_(sess.username);
  if (!user) return { ok: false, error: 'User not found', code: 401 };

  var role = String(user.role || '').toLowerCase();
  if (role === 'admin') return null; // admin has full access

  var mods = String(user.modules || '').split(',').map(function (m) { return String(m).trim().toLowerCase(); });
  if (mods.indexOf(String(module).toLowerCase()) !== -1) return null;

  return { ok: false, error: 'You do not have access to this module', code: 403 };
}

/**
 * Fetch current user (username/role/modules) from token — used by pages
 * to decide which cards/links to show. Returns null when not logged in.
 */
function currentUserFromToken_(token) {
  var sess = verifyToken_(token);
  if (!sess) return null;
  var user = findUser_(sess.username);
  return user ? publicUser_(user) : null;
}
