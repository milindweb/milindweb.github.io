/**
 * js/api-client.js — Shared API client for the modular Apps Script backend.
 * Follows the same IIFE pattern as js/hospital-api.js.
 *
 * Requires SITE_CONFIG.appsScriptUrl (js/config.js) to be set to the deployed
 * web-app URL, e.g. "https://script.google.com/macros/s/XXXXX/exec".
 */
(function (window) {
  'use strict';

  function base() {
    var url = (window.SITE_CONFIG && SITE_CONFIG.appsScriptUrl) || '';
    if (!url) {
      console.error('API: SITE_CONFIG.appsScriptUrl is not set.');
    }
    return url;
  }

  // GET request → expects { ok, data | user | count | error }
  function get(params) {
    var url = base();
    var qs = Object.keys(params).map(function (k) {
      return encodeURIComponent(k) + '=' + encodeURIComponent(params[k] === undefined ? '' : params[k]);
    }).join('&');
    return fetch(url + (qs ? '?' + qs : ''))
      .then(function (r) { return r.json(); })
      .catch(function () { return { ok: false, error: 'Network error' }; });
  }

  // POST request → expects { ok, data | token | user | error }
  function post(body) {
    var url = base();
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then(function (r) { return r.json(); })
      .catch(function () { return { ok: false, error: 'Network error' }; });
  }

  // Convenience: reject on !ok
  function unwrap(promise) {
    return promise.then(function (res) {
      if (!res.ok) throw new Error(res.error || 'API error');
      return res.data;
    });
  }

  window.API = {
    base: base,
    get: get,
    post: post,
    unwrap: unwrap,
  };
})(window);
