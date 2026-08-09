/**
 * seniority.gs — MilindWeb Seniority module backend.
 *
 * Serves employee seniority records + sanctioned posts behind the shared
 * site auth + module guard (mirrors the finance.gs pattern). Data lives in
 * the Milind-Seniority spreadsheet (CONFIG.senioritySheetId).
 *
 * Columns are kept identical to the published Google Sheet the frontend used
 * to read via CSV, so existing data imports as-is.
 */

// ---------- Schema ----------

var SENIORITY_SHEETS = {
  EMPLOYEES: 'Employees',
  SANCTIONED_POSTS: 'Sanctioned_Posts'
};

var SENIORITY_EMPLOYEE_HEADERS = [
  'Sr No.','Tokan No.','Name','Post','Rank','Category','Location',
  'Date of Birth','Date of Retirement','Date of Appointment','Date of Regular',
  'Dept Qualify Examination','Date of Tradesman Mate','Date of USL','Date of SSK',
  'Date of SK','Date of HSK II','Date of HSK I','Date of MCM','Mobile No.','Email','Remark'
];

var SENIORITY_SANCTIONED_HEADERS = ['Post','Rank','Total Vacancy','Sactioned vacancy','Remark'];

var SENIORITY_RANK_ORDER = ['USL','SSK','Tradesman Mate','SK','HSK II','HSK I','MCM'];

// ---------- Spreadsheet / sheet helpers ----------

function senioritySS_() {
  return SpreadsheetApp.openById(CONFIG.senioritySheetId);
}

function seniorityList_(sheetName, headers) {
  var sheet = senioritySS_().getSheetByName(sheetName);
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  var result = [];
  for (var i = 1; i < data.length; i++) {
    var row = {};
    for (var j = 0; j < headers.length; j++) row[headers[j]] = data[i][j] || '';
    result.push(row);
  }
  return result;
}

function seniorityFind_(sheetName, headers, idKey, id) {
  var all = seniorityList_(sheetName, headers);
  for (var i = 0; i < all.length; i++) {
    if (String(all[i][idKey] || '').trim() === String(id).trim()) return all[i];
  }
  return null;
}

function seniorityUpdate_(sheetName, headers, idKey, id, data) {
  var sheet = senioritySS_().getSheetByName(sheetName);
  if (!sheet) throw new Error('Sheet not found: ' + sheetName);
  var values = sheet.getDataRange().getValues();
  var col = headers.indexOf(idKey);
  if (col === -1) throw new Error('Key column not found: ' + idKey);
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][col]).trim() === String(id).trim()) {
      headers.forEach(function (h) {
        var ci = headers.indexOf(h);
        if (data[h] !== undefined) sheet.getRange(i + 1, ci + 1).setValue(data[h]);
      });
      return true;
    }
  }
  return false;
}

function seniorityDelete_(sheetName, headers, idKey, id) {
  var sheet = senioritySS_().getSheetByName(sheetName);
  if (!sheet) throw new Error('Sheet not found: ' + sheetName);
  var values = sheet.getDataRange().getValues();
  var col = headers.indexOf(idKey);
  if (col === -1) throw new Error('Key column not found: ' + idKey);
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][col]).trim() === String(id).trim()) {
      sheet.deleteRow(i + 1);
      return true;
    }
  }
  return false;
}

// ---------- Initialization ----------

function seniorityEnsureSheets_() {
  var ss = senioritySS_();
  getSheet_(ss, SENIORITY_SHEETS.EMPLOYEES);
  ensureHeader_(ss.getSheetByName(SENIORITY_SHEETS.EMPLOYEES), SENIORITY_EMPLOYEE_HEADERS);
  getSheet_(ss, SENIORITY_SHEETS.SANCTIONED_POSTS);
  ensureHeader_(ss.getSheetByName(SENIORITY_SHEETS.SANCTIONED_POSTS), SENIORITY_SANCTIONED_HEADERS);
}

// Public: idempotent sheet setup (safe to run every load).
function senioritySetupSheets() {
  seniorityEnsureSheets_();
  return 'Seniority sheets ready';
}

// ---------- Date helpers ----------
// The published sheet uses MM/YYYY, M/YYYY or YYYY; tolerate DD/MM/YYYY too.

function seniorityParseDate_(str) {
  if (!str) return null;
  str = String(str).trim();
  var m = str.match(/^(\d{1,2})\/(\d{4})$/);             // MM/YYYY
  if (m) return new Date(+m[2], +m[1] - 1, 1);
  m = str.match(/^(\d{4})$/);                             // YYYY
  if (m) return new Date(+m[1], 0, 1);
  m = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);       // DD/MM/YYYY
  if (m) return new Date(+m[3], +m[2] - 1, +m[1]);
  return null;
}

function seniorityDateValue_(str) {
  var d = seniorityParseDate_(str);
  return d ? d.getTime() : 0;
}

function seniorityYear_(str) {
  var d = seniorityParseDate_(str);
  return d ? d.getFullYear() : null;
}

// ---------- CRUD — Employees ----------

function seniorityEmployeesList() {
  return seniorityList_(SENIORITY_SHEETS.EMPLOYEES, SENIORITY_EMPLOYEE_HEADERS);
}

function seniorityEmployeeGet(token) {
  return seniorityFind_(SENIORITY_SHEETS.EMPLOYEES, SENIORITY_EMPLOYEE_HEADERS, 'Tokan No.', token);
}

function seniorityEmployeeSave(data) {
  data = data || {};
  if (!data['Tokan No.']) throw new Error('Tokan No. is required');
  if (String(data['Tokan No.']).trim() === '') throw new Error('Tokan No. is required');
  var exists = seniorityFind_(SENIORITY_SHEETS.EMPLOYEES, SENIORITY_EMPLOYEE_HEADERS, 'Tokan No.', data['Tokan No.']);
  if (exists) {
    seniorityUpdate_(SENIORITY_SHEETS.EMPLOYEES, SENIORITY_EMPLOYEE_HEADERS, 'Tokan No.', data['Tokan No.'], data);
    return { success: true, token: data['Tokan No.'], action: 'updated' };
  }
  var sheet = senioritySS_().getSheetByName(SENIORITY_SHEETS.EMPLOYEES);
  var row = SENIORITY_EMPLOYEE_HEADERS.map(function (h) { return data[h] !== undefined ? data[h] : ''; });
  sheet.appendRow(row);
  return { success: true, token: data['Tokan No.'], action: 'created' };
}

function seniorityEmployeeDelete(token) {
  return { success: seniorityDelete_(SENIORITY_SHEETS.EMPLOYEES, SENIORITY_EMPLOYEE_HEADERS, 'Tokan No.', token) };
}

// ---------- CRUD — Sanctioned posts ----------

function senioritySanctionedList() {
  return seniorityList_(SENIORITY_SHEETS.SANCTIONED_POSTS, SENIORITY_SANCTIONED_HEADERS);
}

function senioritySanctionedSave(data) {
  data = data || {};
  var key = String(data['Post'] || '').trim() + '|' + String(data['Rank'] || '').trim();
  if (key === '|') throw new Error('Post and Rank are required');
  var exists = null;
  var all = seniorityList_(SENIORITY_SHEETS.SANCTIONED_POSTS, SENIORITY_SANCTIONED_HEADERS);
  for (var i = 0; i < all.length; i++) {
    if (String(all[i]['Post'] || '').trim() + '|' + String(all[i]['Rank'] || '').trim() === key) { exists = all[i]; break; }
  }
  if (exists) {
    seniorityUpdate_(SENIORITY_SHEETS.SANCTIONED_POSTS, SENIORITY_SANCTIONED_HEADERS, 'Post', data['Post'], data);
    return { success: true, key: key, action: 'updated' };
  }
  var sheet = senioritySS_().getSheetByName(SENIORITY_SHEETS.SANCTIONED_POSTS);
  var row = SENIORITY_SANCTIONED_HEADERS.map(function (h) { return data[h] !== undefined ? data[h] : ''; });
  sheet.appendRow(row);
  return { success: true, key: key, action: 'created' };
}

function senioritySanctionedDelete(post, rank) {
  var all = seniorityList_(SENIORITY_SHEETS.SANCTIONED_POSTS, SENIORITY_SANCTIONED_HEADERS);
  var key = String(post || '').trim() + '|' + String(rank || '').trim();
  for (var i = 0; i < all.length; i++) {
    if (String(all[i]['Post'] || '').trim() + '|' + String(all[i]['Rank'] || '').trim() === key) {
      return { success: seniorityDelete_(SENIORITY_SHEETS.SANCTIONED_POSTS, SENIORITY_SANCTIONED_HEADERS, 'Post', all[i]['Post']) };
    }
  }
  return { success: false };
}

// ---------- Business logic ----------

// Promotion timeline for a given employee token.
function seniorityPromotionTimeline(token) {
  var employees = seniorityEmployeesList();
  var posts = senioritySanctionedList();
  var emp = null;
  for (var i = 0; i < employees.length; i++) {
    if (String(employees[i]['Tokan No.']).trim() === String(token).trim()) { emp = employees[i]; break; }
  }
  if (!emp) return { found: false, error: 'No employee found with token: ' + token };

  var idx = SENIORITY_RANK_ORDER.indexOf(emp['Rank']);
  var timeline = [];
  var retirementYear = seniorityYear_(emp['Date of Retirement']);

  if (idx !== -1) {
    for (var r = idx + 1; r < SENIORITY_RANK_ORDER.length; r++) {
      var nextRank = SENIORITY_RANK_ORDER[r];
      var vacancyInfo = null;
      for (var p = 0; p < posts.length; p++) {
        if (String(posts[p]['Rank']).trim() === nextRank && String(posts[p]['Post']).trim() === String(emp['Post']).trim()) {
          vacancyInfo = posts[p]; break;
        }
      }
      var sanctioned = vacancyInfo ? (parseInt(vacancyInfo['Sactioned vacancy'], 10) || 0) : 0;

      var peers = employees.filter(function (e) {
        return String(e['Post']).trim() === String(emp['Post']).trim() && String(e['Rank']).trim() === nextRank;
      });
      peers.sort(function (a, b) {
        return seniorityDateValue_(a['Date of ' + nextRank]) - seniorityDateValue_(b['Date of ' + nextRank]);
      });

      var position = 1;
      for (var q = 0; q < peers.length; q++) {
        if (String(peers[q]['Tokan No.']).trim() === String(emp['Tokan No.']).trim()) { position = q + 1; break; }
      }
      var estimateYear = new Date().getFullYear() + Math.ceil(position / (sanctioned || 1));

      timeline.push({
        rank: nextRank,
        sanctioned: sanctioned,
        position: position,
        peers: peers.length,
        estimateYear: estimateYear,
        achievable: retirementYear === null ? true : estimateYear <= retirementYear
      });
      if (retirementYear !== null && estimateYear > retirementYear) break;
    }
  }

  return {
    found: true,
    token: emp['Tokan No.'],
    name: emp['Name'],
    post: emp['Post'],
    rank: emp['Rank'],
    retirementYear: retirementYear,
    timeline: timeline
  };
}

// Ordered seniority list for employees in the same Post + Rank.
function seniorityList(post, rank) {
  var employees = seniorityEmployeesList();
  var peers = employees.filter(function (e) {
    return String(e['Post']).trim() === String(post || '').trim() && String(e['Rank']).trim() === String(rank || '').trim();
  });
  peers.sort(function (a, b) {
    return seniorityDateValue_(a['Date of ' + (rank || '')]) - seniorityDateValue_(b['Date of ' + (rank || '')]);
  });
  return peers.map(function (e) {
    return { token: e['Tokan No.'], name: e['Name'], date: e['Date of ' + (rank || '')] };
  });
}

// Dashboard stats.
function seniorityDashboard() {
  var employees = seniorityEmployeesList();
  var posts = senioritySanctionedList();

  var rankCounts = {};
  var postCounts = {};
  var categoryCounts = {};
  var locationCounts = {};
  var upcomingRetirement = [];

  employees.forEach(function (e) {
    var r = String(e['Rank'] || '—').trim();
    var p = String(e['Post'] || '—').trim();
    var c = String(e['Category'] || '—').trim();
    var l = String(e['Location'] || '—').trim();
    rankCounts[r] = (rankCounts[r] || 0) + 1;
    postCounts[p] = (postCounts[p] || 0) + 1;
    categoryCounts[c] = (categoryCounts[c] || 0) + 1;
    locationCounts[l] = (locationCounts[l] || 0) + 1;

    var ry = seniorityYear_(e['Date of Retirement']);
    if (ry && ry - new Date().getFullYear() <= 5) {
      upcomingRetirement.push({ token: e['Tokan No.'], name: e['Name'], post: p, rank: r, retirementYear: ry });
    }
  });

  upcomingRetirement.sort(function (a, b) { return a.retirementYear - b.retirementYear; });

  return {
    totalEmployees: employees.length,
    totalSanctionedPosts: posts.length,
    rankCounts: rankCounts,
    postCounts: postCounts,
    categoryCounts: categoryCounts,
    locationCounts: locationCounts,
    upcomingRetirement: upcomingRetirement.slice(0, 20)
  };
}

// ---------- Router ----------

function seniorityRoutePost_(body) {
  try {
    seniorityEnsureSheets_();
    var fn = String(body.fn || '');
    var args = body.args || [];

    var map = {
      setupSheets: senioritySetupSheets,
      getDashboardData: seniorityDashboard,
      getEmployees: seniorityEmployeesList,
      getEmployee: seniorityEmployeeGet,
      saveEmployee: seniorityEmployeeSave,
      deleteEmployee: seniorityEmployeeDelete,
      getSanctionedPosts: senioritySanctionedList,
      saveSanctionedPost: senioritySanctionedSave,
      deleteSanctionedPost: senioritySanctionedDelete,
      getPromotionTimeline: seniorityPromotionTimeline,
      getSeniorityList: seniorityList
    };

    var handler = map[fn];
    if (!handler) return fail_('Unknown seniority action: ' + fn);

    var result = handler.apply(null, args);
    return json_({ ok: true, data: result });
  } catch (err) {
    log_(err.message || err);
    return fail_(err.message || err);
  }
}
