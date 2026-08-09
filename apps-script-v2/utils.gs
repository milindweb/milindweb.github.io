/**
 * utils.gs — Shared helpers used by every module.
 * Reuses the proven core from the old apps-script/Code.gs.
 */

// ---------- Response helpers ----------

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function fail_(msg, code) {
  return json_({ ok: false, error: String(msg), code: code || 400 });
}

function log_(msg) {
  Logger.log(String(msg));
}

// ---------- Spreadsheet / sheet access ----------

function ss_(id) {
  return SpreadsheetApp.openById(id);
}

function getSheet_(ss, name) {
  var sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  return sh;
}

// ---------- Row helpers ----------

function headers_(sh) {
  if (sh.getLastRow() < 1) return [];
  var r = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  return r.map(String);
}

function ensureHeader_(sh, cols) {
  if (sh.getLastRow() === 0) {
    sh.appendRow(cols);
  } else if (sh.getLastColumn() < cols.length) {
    var add = cols.slice(sh.getLastColumn());
    sh.getRange(1, sh.getLastColumn() + 1, 1, add.length).setValues([add]);
  }
}

function rowsToObjects_(sh) {
  var h = headers_(sh);
  var lr = sh.getLastRow();
  if (lr < 2) return [];
  var vals = sh.getRange(2, 1, lr - 1, sh.getLastColumn()).getValues();
  return vals.map(function (row, idx) {
    var obj = {};
    for (var i = 0; i < h.length; i++) obj[h[i]] = row[i];
    obj._row = idx + 2; // physical sheet row
    return obj;
  });
}

function findRowNum_(sh, colName, value) {
  var h = headers_(sh);
  var ci = h.indexOf(colName);
  if (ci === -1) return -1;
  var lr = sh.getLastRow();
  if (lr < 2) return -1;
  var vals = sh.getRange(2, ci + 1, lr - 1, 1).getValues();
  for (var i = 0; i < vals.length; i++) {
    if (String(vals[i][0]) === String(value)) return i + 2;
  }
  return -1;
}

// Auto-increment id stored in a _meta sheet.
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

// ---------- Generic table CRUD (per module spreadsheet) ----------

function tableInsert_(ss, table, row) {
  var sh = getSheet_(ss, table);
  var data = normalizeRow_(row);
  if (!data.id) data.id = nextId_(ss, table);
  data.created_at = data.created_at || new Date().toISOString();

  var h = sh.getLastRow() === 0 ? [] : headers_(sh);
  var cols = h.slice();
  for (var k in data) if (cols.indexOf(k) === -1) cols.push(k);
  sh.getRange(1, 1, 1, cols.length).setValues([cols]);
  var outRow = cols.map(function (c) { return data[c] === undefined ? '' : data[c]; });
  sh.appendRow(outRow);
  return data;
}

function tableUpdate_(ss, table, id, row) {
  var sh = getSheet_(ss, table);
  var rnum = findRowNum_(sh, 'id', id);
  if (rnum === -1) throw new Error('Record not found in ' + table + ': ' + id);
  var h = headers_(sh);
  var data = normalizeRow_(row);
  data.id = String(id);
  var keys = Object.keys(data);
  for (var i = 0; i < keys.length; i++) {
    var ci = h.indexOf(keys[i]);
    if (ci === -1) {
      h.push(keys[i]);
      sh.getRange(1, h.length, 1, 1).setValue(keys[i]);
      ci = h.length - 1;
    }
    sh.getRange(rnum, ci + 1).setValue(data[keys[i]]);
  }
  return data;
}

function tableDelete_(ss, table, id) {
  var sh = getSheet_(ss, table);
  var rnum = findRowNum_(sh, 'id', id);
  if (rnum === -1) throw new Error('Record not found in ' + table + ': ' + id);
  sh.deleteRow(rnum);
  return { deleted: true };
}

function tableList_(ss, table, p) {
  var sh = getSheet_(ss, table);
  var all = rowsToObjects_(sh);
  var q = (p.q || '').toLowerCase();
  if (q) all = all.filter(function (r) { return JSON.stringify(r).toLowerCase().indexOf(q) !== -1; });
  var total = all.length;
  var limit = parseInt(p.limit, 10) || 50;
  var page = parseInt(p.page, 10) || 1;
  var start = (page - 1) * limit;
  return { rows: all.slice(start, start + limit), total: total, page: page, pages: Math.max(1, Math.ceil(total / limit)) };
}

function tableGet_(ss, table, id) {
  var sh = getSheet_(ss, table);
  var all = rowsToObjects_(sh);
  for (var i = 0; i < all.length; i++) if (String(all[i].id) === String(id)) return all[i];
  return null;
}

function normalizeRow_(row) {
  var out = {};
  for (var k in row) {
    if (k === '_row' || k === 'id') continue;
    out[k] = row[k] === undefined ? '' : row[k];
  }
  return out;
}

function nowIST_() {
  return Utilities.formatDate(new Date(), CONFIG.timeZone, 'yyyy-MM-dd HH:mm:ss');
}
