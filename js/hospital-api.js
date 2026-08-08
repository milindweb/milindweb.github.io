/* Hospital API client — wraps the Google Apps Script backend.
 * Set SITE_CONFIG.appsScriptUrl (in js/config.js) to your deployed web-app URL.
 * Example: "https://script.google.com/macros/s/XXXXX/exec"
 */
(function (window) {
  'use strict';

  function base() {
    var url = (window.SITE_CONFIG && SITE_CONFIG.appsScriptUrl) || '';
    if (!url) {
      console.error('HospitalAPI: SITE_CONFIG.appsScriptUrl is not set.');
    }
    return url;
  }

  // GET request
  function get(params) {
    var url = base();
    var qs = Object.keys(params).map(function (k) {
      return encodeURIComponent(k) + '=' + encodeURIComponent(params[k] === undefined ? '' : params[k]);
    }).join('&');
    return fetch(url + '?' + qs).then(function (r) { return r.json(); });
  }

  // POST request
  function post(body) {
    var url = base();
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then(function (r) { return r.json(); });
  }

  function unwrap(promise) {
    return promise.then(function (res) {
      if (!res.ok) throw new Error(res.error || 'API error');
      return res.data;
    });
  }

  window.HospitalAPI = {
    // ---- reads ----
    list: function (table, opts) {
      opts = opts || {};
      return unwrap(get({ table: table, action: 'list', page: opts.page || 1, limit: opts.limit || 50, q: opts.q || '' }));
    },
    get: function (table, id) {
      return unwrap(get({ table: table, action: 'get', id: id }));
    },
    search: function (table, q) {
      return unwrap(get({ table: table, action: 'search', q: q }));
    },
    searchPatients: function (q) {
      return unwrap(get({ action: 'searchPatients', q: q }));
    },
    listPatients: function (opts) {
      opts = opts || {};
      return unwrap(get({ action: 'listPatients', page: opts.page || 1, limit: opts.limit || 20, q: opts.q || '' }));
    },
    listAppointments: function (date) {
      return unwrap(get({ action: 'listAppointments', date: date || '' }));
    },
    count: function (table, filters) {
      var p = { table: table, action: 'count' };
      for (var k in (filters || {})) p[k] = filters[k];
      return unwrap(get(p));
    },
    profile: function (patientId) {
      return unwrap(get({ table: 'patients', action: 'profile', id: patientId }));
    },
    dashboard: function () {
      return unwrap(get({ action: 'dashboard' }));
    },
    // ---- writes ----
    insert: function (table, row) {
      return unwrap(post({ table: table, action: 'insert', row: row }));
    },
    update: function (table, id, row) {
      return unwrap(post({ table: table, action: 'update', id: id, row: row }));
    },
    remove: function (table, id) {
      return unwrap(post({ table: table, action: 'delete', id: id }));
    },
  };
})(window);
