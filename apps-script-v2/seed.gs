/**
 * seed.gs — One-time setup for the MilindWeb backend.
 *
 * Run `setupSeed()` ONCE from the Apps Script editor (the ▶ Run button)
 * after pasting all files and before first use. It will:
 *   1. Create the Users and Sessions sheets (with headers) in Milind-Auth.
 *   2. Create the default admin user (from ADMIN_* below) if no users exist.
 *
 * Afterwards you can delete this file or keep it — it's safe to re-run
 * (it never overwrites existing users).
 */

var ADMIN_USERNAME = 'admin';
var ADMIN_PASSWORD = 'admin123';
var ADMIN_ROLE     = 'admin';
var ADMIN_MODULES  = 'hospital, seniority, finance, contact';

function setupSeed() {
  var ss = SpreadsheetApp.openById(CONFIG.authSheetId);

  // 1. Users sheet with headers
  var users = ss.getSheetByName(CONFIG.auth.usersSheet);
  if (!users) users = ss.insertSheet(CONFIG.auth.usersSheet);
  ensureHeader_(users, ['username', 'password', 'role', 'modules']);

  // 2. Sessions sheet with headers
  var sessions = ss.getSheetByName(CONFIG.auth.sessionsSheet);
  if (!sessions) sessions = ss.insertSheet(CONFIG.auth.sessionsSheet);
  ensureHeader_(sessions, ['token', 'username', 'role', 'created']);

  // 3. Seed default admin (only if Users sheet is empty of real users)
  var userRows = rowsToObjects_(users);
  var hasAdmin = userRows.some(function (r) {
    return String(r.username).toLowerCase() === String(ADMIN_USERNAME).toLowerCase();
  });
  if (!hasAdmin) {
    users.appendRow([ADMIN_USERNAME, ADMIN_PASSWORD, ADMIN_ROLE, ADMIN_MODULES]);
    Logger.log('Created default admin: ' + ADMIN_USERNAME + ' / ' + ADMIN_PASSWORD);
  } else {
    Logger.log('Admin "' + ADMIN_USERNAME + '" already exists — skipped.');
  }

  Logger.log('Setup complete. Users rows: ' + users.getLastRow());
}
