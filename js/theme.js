(function () {
  'use strict';

  var TOGGLE_ID = 'themeToggle';
  var ATTR = 'data-theme';
  var STORAGE_KEY = 'bartle-theme';
  var LIGHT = 'light';
  var DARK = 'dark';

  var html = document.documentElement;
  var toggle = document.getElementById(TOGGLE_ID);

  function getStored() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (_) { return null; }
  }

  function setStored(v) {
    try { localStorage.setItem(STORAGE_KEY, v); } catch (_) {}
  }

  function getSystem() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? DARK : LIGHT;
  }

  function apply(theme) {
    html.setAttribute(ATTR, theme);
    if (toggle) {
      toggle.textContent = theme === DARK ? '☀️' : '🌙';
    }
  }

  function toggleTheme() {
    var next = html.getAttribute(ATTR) === DARK ? LIGHT : DARK;
    apply(next);
    setStored(next);
  }

  // Init
  var stored = getStored();
  apply(stored || getSystem());

  // Listen
  if (toggle) {
    toggle.addEventListener('click', toggleTheme);
  }

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
    if (!getStored()) {
      apply(e.matches ? DARK : LIGHT);
    }
  });

})();
