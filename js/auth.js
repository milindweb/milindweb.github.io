/**
 * js/auth.js — Simple login/session handling for the browser.
 *
 * - Stores ONLY the session token in localStorage (never the password).
 * - Persistent: once logged in, stays logged in until Logout.
 * - Exposes Auth.user(), Auth.hasModule(), Auth.login(), Auth.logout(),
 *   Auth.register(), Auth.checkSession().
 *
 * Load AFTER js/api-client.js.
 */
(function (window) {
  'use strict';

  var TOKEN_KEY = 'mw_token';
  var USER_KEY = 'mw_user';

  function getToken() {
    try { return localStorage.getItem(TOKEN_KEY) || ''; } catch (e) { return ''; }
  }

  function getUser() {
    try {
      var u = JSON.parse(localStorage.getItem(USER_KEY) || 'null');
      return u && u.username ? u : null;
    } catch (e) { return null; }
  }

  function saveSession(res) {
    try {
      localStorage.setItem(TOKEN_KEY, res.token || '');
      localStorage.setItem(USER_KEY, JSON.stringify(res.user || null));
    } catch (e) {}
  }

  function clearSession() {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch (e) {}
  }

  function isAdmin() {
    var u = getUser();
    return !!(u && String(u.role || '').toLowerCase() === 'admin');
  }

  /** Does the current user have access to the given module? */
  function hasModule(module) {
    var u = getUser();
    if (!u) return false;
    if (isAdmin()) return true;
    var mods = String(u.modules || '').split(',').map(function (m) { return String(m).trim().toLowerCase(); });
    return mods.indexOf(String(module).toLowerCase()) !== -1;
  }

  function login(username, password) {
    return window.API.post({ action: 'authLogin', username: username, password: password })
      .then(function (res) {
        if (!res.ok) throw new Error(res.error || 'Login failed');
        saveSession(res);
        return res.user;
      });
  }

  function register(username, password, name, email, mobile) {
    return window.API.post({
      action: 'authRegister',
      username: username,
      password: password,
      name: name,
      email: email,
      mobile: mobile
    })
      .then(function (res) {
        if (!res.ok) throw new Error(res.error || 'Registration failed');
        return res;
      });
  }

  function logout() {
    var token = getToken();
    clearSession();
    if (token) window.API.post({ action: 'authLogout', token: token });
  }

  /** Validate the stored token against the backend; refresh cached user. */
  function checkSession() {
    var token = getToken();
    if (!token) return Promise.resolve(false);
    return window.API.post({ action: 'authCheck', token: token })
      .then(function (res) {
        if (res.ok && res.user) {
          saveSession({ token: token, user: res.user });
          return true;
        }
        clearSession();
        return false;
      })
      .catch(function () { clearSession(); return false; });
  }

  window.Auth = {
    getToken: getToken,
    user: getUser,
    isLoggedIn: function () { return !!getUser(); },
    isAdmin: isAdmin,
    hasModule: hasModule,
    login: login,
    register: register,
    logout: logout,
    checkSession: checkSession,
  };
})(window);
