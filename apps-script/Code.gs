/**
 * HOSPITAL + SENIORITY FREE BACKEND — Google Apps Script
 *
 * Replaces the old Supabase backend with a Google Sheet as the database.
 * Each "table" is one sheet inside a single spreadsheet. A `_meta` sheet
 * holds auto-increment counters (IDs, UHID numbers).
 *
 * API contract:
 *   doGet  (reads)   ?table=patients&action=list&page=1&limit=20&q=...
 *                    ?table=patients&action=get&id=...
 *                    ?table=patients&action=search&q=...
 *                    ?table=visits&action=recent&limit=10
 *                    ?table=visits&action=count&status=active&date=2026-08-05
 *                    ?table=appointments&action=count&date=2026-08-05
 *                    ?table=patients&action=count
 *                    ?action=dashboard          (stats + recent visits)
 *                    ?table=patients&action=profile&id=...  (patient + visits + all child rows)
 *
 *   doPost (writes)  JSON body { table, action:'insert', row:{...} }
 *                    JSON body { table, action:'update', id, row:{...} }
 *                    JSON body { table, action:'delete', id }
 *                    action: insert/update/delete
 *
 * Response envelope: { ok:true, rows:[...], row:{...}, total:N, page, pages }
 *                    { ok:false, error:"message" }
 *
 * SETUP
 *   1. Create a Google Sheet. Open Extensions → Apps Script.
 *   2. Paste this file as Code.gs.
 *   3. Paste your spreadsheet ID below (from the sheet URL: /spreadsheets/d/<ID>/edit).
 *   4. Deploy → New deployment → Web app. Execute as: Me. Access: Anyone.
 *   5. Copy the /exec URL into js/config.js as appsScriptUrl.
 */

var SPREADSHEET_ID = ''; // <-- PASTE YOUR SPREADSHEET ID HERE

// ---------- Core helpers ----------

function getSs_() {
  return SPREADSHEET_ID ? SpreadsheetApp.openById(SPREADSHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
}

function json_(obj, code) {
  var out = ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
  if (code) out.setStatusCode(code);
  return out;
}

function fail_(msg, code) {
  return json_({ ok: false, error: String(msg) }, code || 400);
}

function getSheet_(ss, name) {
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    // reserve first column for the internal id (hidden later by apps)
  }
  return sh;
}

// Row helpers: read a sheet into array-of-objects, keyed by header row.
function headers_(sh) {
  var r = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  return r.map(String);
}

function rowsToObjects_(sh) {
  var h = headers_(sh);
  var lr = sh.getLastRow();
  if (lr < 2) return [];
  var vals = sh.getRange(2, 1, lr - 1, sh.getLastColumn()).getValues();
  return vals.map(function (row) {
    var obj = {};
    for (var i = 0; i < h.length; i++) obj[h[i]] = row[i];
    obj._row = 2 + vals.indexOf(row); // remember physical row for updates/deletes
    return obj;
  });
}

// Next integer id for a table, stored in _meta sheet.
function nextId_(ss, table) {
  var meta = getSheet_(ss, '_meta');
  ensureHeader_(meta, ['key', 'value']);
  var key = 'id_' + table;
  var rows = meta.getDataRange().getValues();
  var val = 1, found = false;
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === key) { val = parseInt(rows[i][1], 10) + 1; found = true; }
  }
  if (found) {
    for (var j = 1; j < rows.length; j++) if (rows[j][0] === key) meta.getRange(j + 1, 2).setValue(val);
  } else {
    meta.appendRow([key, val]);
  }
  return String(val);
}

function ensureHeader_(sh, cols) {
  if (sh.getLastRow() === 0) sh.appendRow(cols);
  else if (sh.getLastColumn() < cols.length) sh.getRange(1, sh.getLastColumn() + 1, 1, cols.length - sh.getLastColumn()).setValues([cols.slice(sh.getLastColumn())]);
}

function normalizeRow_(row) {
  // Drop internal keys that must never be stored
  var out = {};
  for (var k in row) {
    if (k === '_row' || k === 'id') continue;
    out[k] = row[k] === undefined ? '' : row[k];
  }
  return out;
}

function findRowNum_(sh, id) {
  // find a row whose `id` column equals id (case-insensitive)
  var lr = sh.getLastRow();
  if (lr < 2) return -1;
  var vals = sh.getRange(2, 1, lr - 1, sh.getLastColumn()).getValues();
  for (var i = 0; i < vals.length; i++) {
    if (String(vals[i][0]) === String(id)) return i + 2;
  }
  return -1;
}

// ---------- Write operations ----------

function insertRow_(ss, table, row) {
  var sh = getSheet_(ss, table);
  var data = normalizeRow_(row);
  // assign id
  if (!data.id) data.id = nextId_(ss, table);
  data.created_at = data.created_at || new Date().toISOString();
  if (table === 'patients' && !data.uhid) data.uhid = makeUhid_(ss);

  // merge with existing headers
  var h = sh.getLastRow() === 0 ? [] : headers_(sh);
  var cols = h.slice();
  for (var k in data) if (cols.indexOf(k) === -1) cols.push(k);
  // ensure header row
  sh.getRange(1, 1, 1, cols.length).setValues([cols]);
  var outRow = cols.map(function (c) { return data[c] === undefined ? '' : data[c]; });
  sh.appendRow(outRow);
  return data;
}

function updateRow_(ss, table, id, row) {
  var sh = getSheet_(ss, table);
  var rnum = findRowNum_(sh, id);
  if (rnum === -1) throw new Error('Record not found in ' + table + ': ' + id);
  var h = headers_(sh);
  var data = normalizeRow_(row);
  data.id = String(id);
  var keys = Object.keys(data);
  for (var i = 0; i < keys.length; i++) {
    var ci = h.indexOf(keys[i]);
    if (ci === -1) {
      // extend headers
      h.push(keys[i]);
      sh.getRange(1, h.length, 1, 1).setValue(keys[i]);
      ci = h.length - 1;
    }
    sh.getRange(rnum, ci + 1).setValue(data[keys[i]]);
  }
  return data;
}

function deleteRow_(ss, table, id) {
  var sh = getSheet_(ss, table);
  var rnum = findRowNum_(sh, id);
  if (rnum === -1) throw new Error('Record not found in ' + table + ': ' + id);
  sh.deleteRow(rnum);
  return { deleted: true };
}

// UHID generator: PAT-YYYY-#### (per-year counter in _meta)
function makeUhid_(ss) {
  var meta = getSheet_(ss, '_meta');
  ensureHeader_(meta, ['key', 'value']);
  var year = new Date().getFullYear();
  var key = 'uhid_' + year;
  var rows = meta.getDataRange().getValues();
  var n = 1, found = false;
  for (var i = 1; i < rows.length; i++) if (rows[i][0] === key) { n = parseInt(rows[i][1], 10) + 1; found = true; }
  if (found) {
    for (var j = 1; j < rows.length; j++) if (rows[j][0] === key) meta.getRange(j + 1, 2).setValue(n);
  } else {
    meta.appendRow([key, n]);
  }
  return 'PAT-' + year + '-' + ('0000' + n).slice(-4);
}

// ---------- Read operations ----------

function listRows_(ss, table, p) {
  var sh = getSheet_(ss, table);
  var all = rowsToObjects_(sh);
  var q = (p.q || '').toLowerCase();
  if (q) {
    all = all.filter(function (r) {
      var s = JSON.stringify(r).toLowerCase();
      return s.indexOf(q) !== -1;
    });
  }
  var total = all.length;
  var limit = parseInt(p.limit, 10) || 50;
  var page = parseInt(p.page, 10) || 1;
  var start = (page - 1) * limit;
  return { rows: all.slice(start, start + limit), total: total, page: page, pages: Math.max(1, Math.ceil(total / limit)) };
}

function searchPatients_(ss, q) {
  var sh = getSheet_(ss, 'patients');
  var all = rowsToObjects_(sh);
  var needle = (q || '').toLowerCase();
  if (!needle) return { rows: [] };
  var hits = all.filter(function (r) {
    return String(r.full_name || '').toLowerCase().indexOf(needle) !== -1 ||
           String(r.uhid || '').toLowerCase().indexOf(needle) !== -1 ||
           String(r.mobile || '').toLowerCase().indexOf(needle) !== -1;
  }).slice(0, 10).map(function (r) {
    return { id: r.id, uhid: r.uhid, full_name: r.full_name, mobile: r.mobile };
  });
  return { rows: hits };
}

function getById_(ss, table, id) {
  var sh = getSheet_(ss, table);
  var all = rowsToObjects_(sh);
  for (var i = 0; i < all.length; i++) if (String(all[i].id) === String(id)) return { row: all[i] };
  return { row: null };
}

// Resolve a patient by id OR uhid (the profile page may receive either).
function getPatient_(ss, id) {
  var byId = getById_(ss, 'patients', id);
  if (byId.row) return byId.row;
  var all = rowsToObjects_(getSheet_(ss, 'patients'));
  for (var i = 0; i < all.length; i++) {
    if (String(all[i].uhid || '') === String(id)) return all[i];
  }
  return null;
}

function countRows_(ss, table, filters) {
  var sh = getSheet_(ss, table);
  var all = rowsToObjects_(sh);
  var n = all.filter(function (r) {
    for (var k in filters) {
      if (String(r[k] || '') !== String(filters[k])) return false;
    }
    return true;
  }).length;
  return { count: n };
}

function recentVisits_(ss, limit) {
  var vs = getSheet_(ss, 'visits');
  var ps = getSheet_(ss, 'patients');
  var rows = rowsToObjects_(vs);
  var pat = rowsToObjects_(ps);
  var patMap = {};
  pat.forEach(function (p) { patMap[p.id] = p; });
  rows.sort(function (a, b) { return String(b.created_at || '').localeCompare(String(a.created_at || '')); });
  return { rows: rows.slice(0, limit || 10).map(function (v) {
    var p = patMap[v.patient_id] || {};
    return { id: v.id, opd_number: v.opd_number, patient_id: v.patient_id,
      patient_name: p.full_name || 'Unknown', visit_type: v.visit_type,
      visit_status: v.visit_status || 'completed', visit_date: v.visit_date || v.created_at,
      created_at: v.created_at };
  }) };
}

// Full patient profile: patient + all visits + each visit's child rows
function patientProfile_(ss, id) {
  var pr = getPatient_(ss, id);
  if (!pr) return { row: null, visits: [] };
  var visits = rowsToObjects_(getSheet_(ss, 'visits')).filter(function (v) { return String(v.patient_id) === String(id); });
  visits.sort(function (a, b) { return String(b.visit_date || '').localeCompare(String(a.visit_date || '')); });

  var childTables = ['vitals', 'complaints', 'histories', 'examinations', 'investigations',
    'diagnoses', 'prescriptions', 'procedures', 'advice', 'followups',
    'special_instructions', 'doctor_notes', 'billing_items', 'billing_summary'];
  var cache = {};
  childTables.forEach(function (t) {
    cache[t] = rowsToObjects_(getSheet_(ss, t));
  });

  visits.forEach(function (v) {
    var vid = v.id;
    childTables.forEach(function (t) {
      v[t] = cache[t].filter(function (c) { return String(c.visit_id) === String(vid); });
    });
    v.department_name = departmentName_(ss, v.department_id);
    v.doctor_name = doctorName_(ss, v.doctor_id);
  });
  return { row: pr, visits: visits };
}

function departmentName_(ss, id) {
  if (!id) return '';
  var dep = getById_(ss, 'departments', id).row;
  return dep ? dep.name : '';
}

function doctorName_(ss, id) {
  if (!id) return '';
  var doc = getById_(ss, 'doctors', id).row;
  return doc ? doc.name : '';
}

function listAppointments_(ss, date) {
  var all = rowsToObjects_(getSheet_(ss, 'appointments'));
  var patMap = {}, depMap = {}, docMap = {};
  rowsToObjects_(getSheet_(ss, 'patients')).forEach(function (r) { patMap[r.id] = r; });
  rowsToObjects_(getSheet_(ss, 'departments')).forEach(function (r) { depMap[r.id] = r; });
  rowsToObjects_(getSheet_(ss, 'doctors')).forEach(function (r) { docMap[r.id] = r; });
  var rows = all.filter(function (a) {
    return !date || (a.appointment_date || '').indexOf(date) === 0;
  }).sort(function (a, b) { return String(a.appointment_date || '').localeCompare(String(b.appointment_date || '')); });
  return { rows: rows.map(function (a) {
    var p = patMap[a.patient_id] || {}, d = depMap[a.department_id] || {}, dr = docMap[a.doctor_id] || {};
    return { id: a.id, patient_id: a.patient_id, doctor_id: a.doctor_id, department_id: a.department_id,
      appointment_date: a.appointment_date, status: a.status || 'scheduled', notes: a.notes,
      patient_name: p.full_name || '', patient_mobile: p.mobile || '', patient_uhid: p.uhid || '',
      department_name: d.name || '', doctor_name: dr.name || '' };
  }) };
}

function listPatients_(ss, p) {
  var res = listRows_(ss, 'patients', p);
  var visits = rowsToObjects_(getSheet_(ss, 'visits'));
  var counts = {}, lastDate = {};
  visits.forEach(function (v) {
    var pid = String(v.patient_id);
    counts[pid] = (counts[pid] || 0) + 1;
    var d = v.visit_date || '';
    if (!lastDate[pid] || d > lastDate[pid]) lastDate[pid] = d;
  });
  res.rows = res.rows.map(function (r) {
    return {
      id: r.id, uhid: r.uhid, full_name: r.full_name, gender: r.gender,
      date_of_birth: r.date_of_birth, mobile: r.mobile, created_at: r.created_at,
      visit_count: counts[String(r.id)] || 0, last_visit: lastDate[String(r.id)] || '',
    };
  });
  return res;
}

function dashboard_(ss) {
  var today = new Date().toISOString().split('T')[0];
  var patients = countRows_(ss, 'patients', {});
  var visits = rowsToObjects_(getSheet_(ss, 'visits'));
  var todayVisits = visits.filter(function (v) { return (v.visit_date || '').indexOf(today) === 0; }).length;
  var pending = visits.filter(function (v) { return String(v.visit_status || '') === 'active'; }).length;
  var appts = rowsToObjects_(getSheet_(ss, 'appointments')).filter(function (a) {
    return (a.appointment_date || '').indexOf(today) === 0;
  }).length;
  var recent = recentVisits_(ss, 10).rows;
  return { stats: { totalPatients: patients.count, todayVisits: todayVisits, pendingVisits: pending, todayAppointments: appts }, recent: recent };
}

// ---------- Entry points ----------

function doGet(e) {
  try {
    var ss = getSs_();
    var p = e.parameter || {};
    var table = p.table || '';
    var action = p.action || 'list';

    if (action === 'dashboard') return json_({ ok: true, data: dashboard_(ss) });
    if (action === 'recentVisits') return json_({ ok: true, data: recentVisits_(ss, parseInt(p.limit, 10) || 10) });
    if (action === 'searchPatients') return json_({ ok: true, data: searchPatients_(ss, p.q || '') });
    if (action === 'listPatients') return json_({ ok: true, data: listPatients_(ss, p) });
    if (action === 'listAppointments') return json_({ ok: true, data: listAppointments_(ss, p.date || '') });
    if (action === 'profile') {
      if (!p.id) return fail_('Missing id');
      return json_({ ok: true, data: patientProfile_(ss, p.id) });
    }

    if (!table) return fail_('Missing table');

    if (action === 'get') {
      if (!p.id) return fail_('Missing id');
      return json_({ ok: true, data: getById_(ss, table, p.id).row });
    }
    if (action === 'count') {
      var filters = {};
      ['status', 'date', 'visit_status', 'appointment_date', 'patient_id'].forEach(function (f) {
        if (p[f] !== undefined) filters[f] = p[f];
      });
      return json_({ ok: true, data: countRows_(ss, table, filters) });
    }
    if (action === 'search') {
      if (table === 'patients') return json_({ ok: true, data: searchPatients_(ss, p.q || '') });
    }
    // default list
    var res = listRows_(ss, table, p);
    return json_({ ok: true, data: res });
  } catch (err) {
    return fail_(err.message || err);
  }
}

function doPost(e) {
  try {
    var ss = getSs_();
    var body = JSON.parse(e.postData.contents || '{}');
    var table = body.table || '';
    var action = body.action || 'insert';
    if (!table) return fail_('Missing table');

    if (action === 'insert') {
      return json_({ ok: true, data: insertRow_(ss, table, body.row || {}) });
    }
    if (action === 'update') {
      if (!body.id) return fail_('Missing id');
      return json_({ ok: true, data: updateRow_(ss, table, body.id, body.row || {}) });
    }
    if (action === 'delete') {
      if (!body.id) return fail_('Missing id');
      return json_({ ok: true, data: deleteRow_(ss, table, body.id) });
    }
    return fail_('Unknown action: ' + action);
  } catch (err) {
    return fail_(err.message || err);
  }
}
