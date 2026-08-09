/**
 * js/seniority-api.js — Seniority module API client for the MilindWeb backend.
 *
 * Calls the shared Apps Script backend. Every call sends the session token +
 * module:'seniority' and maps the function name + positional args to the
 * seniorityRoutePost_ handler (see apps-script-v2/seniority.gs).
 *
 * Load AFTER js/config.js and js/auth.js.
 */
(function (window) {
  'use strict';

  function base() {
    var url = (window.SITE_CONFIG && SITE_CONFIG.appsScriptUrl) || '';
    if (!url) {
      console.error('SeniorityAPI: SITE_CONFIG.appsScriptUrl is not set.');
    }
    return url;
  }

  /**
   * Call a backend function with positional args.
   * Returns a promise resolving to the unwrapped result (the `data` payload).
   */
  function call(fn, args) {
    var body = {
      module: 'seniority',
      action: 'seniority',
      fn: fn,
      args: Array.isArray(args) ? args : [],
    };
    if (window.Auth && window.Auth.getToken) body.token = window.Auth.getToken();

    return fetch(base(), {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(body),
    })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res || res.ok === false) {
          throw new Error((res && res.error) || 'Seniority API error');
        }
        return res.data;
      })
      .catch(function (err) {
        throw err instanceof Error ? err : new Error('Network error');
      });
  }

  /**
   * google.script.run-style bridge so the existing PFMS-era UI keeps using
   * `google.script.run.withSuccessHandler(cb).functionName(args...)`.
   */
  function gsRun() {
    return {
      withSuccessHandler: function (cb) {
        var target = {};
        return new Proxy(target, {
          get: function (_, fnName) {
            return function () {
              var args = Array.prototype.slice.call(arguments);
              call(fnName, args).then(
                function (data) { if (typeof cb === 'function') cb(data); },
                function (err) {
                  console.error('[SeniorityAPI] ' + fnName, err);
                  if (typeof cb === 'function') {
                    cb({ success: false, message: (err && err.message) || 'Request failed' });
                  }
                }
              );
            };
          },
        });
      },
      withFailureHandler: function () { return gsRun().withSuccessHandler(function () {}); },
    };
  }

  window.SeniorityAPI = {
    base: base,
    call: call,
    run: gsRun(),
  };
})(window);
