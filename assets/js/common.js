(function () {
  "use strict";

  var SITE_NAME = "YOS Tools";
  var CURRENT_YEAR = new Date().getFullYear();

  /**
   * Site root relative to the current page.
   * Set data-root on <body> (e.g. "./" or "../") so every page links correctly.
   */
  function getRootPath() {
    var root = document.body.getAttribute("data-root");
    return root !== null && root !== "" ? root : "./";
  }

  function renderHeader() {
    var el = document.getElementById("site-header");
    if (!el) return;

    var root = getRootPath();
    el.innerHTML =
      '<header class="site-header">' +
      '  <div class="site-header__inner">' +
      '    <a class="site-header__logo" href="' + root + '">' + SITE_NAME + "</a>" +
      '    <div class="site-header__actions">' +
      '      <nav class="site-header__nav" aria-label="Main">' +
      '        <a href="' + root + '">Home</a>' +
      '        <a href="' + root + 'time-conversion/">Time</a>' +
      '        <a href="' + root + 'json-tools/">JSON</a>' +
      '        <a href="' + root + 'regex-tools/">Regex</a>' +
      '        <a href="' + root + 'about/">About</a>' +
      "      </nav>" +
      '      <button type="button" class="theme-toggle" id="theme-toggle" aria-label="Switch to dark mode" aria-pressed="false">Dark mode</button>' +
      "    </div>" +
      "  </div>" +
      "</header>";
  }

  function renderFooter() {
    var el = document.getElementById("site-footer");
    if (!el) return;

    var root = getRootPath();
    el.innerHTML =
      '<footer class="site-footer">' +
      '  <nav class="site-footer__nav" aria-label="Footer">' +
      '    <a href="' + root + 'time-conversion/">Time Conversion</a>' +
      '    <a href="' + root + 'json-tools/">JSON Tools</a>' +
      '    <a href="' + root + 'regex-tools/">Regex Tools</a>' +
      '    <a href="' + root + 'about/">About</a>' +
      '    <a href="' + root + 'privacy/">Privacy</a>' +
      '    <a href="https://github.com/yos-tools-29t/yos-tools" target="_blank" rel="noreferrer">GitHub</a>' +
      '    <a href="' + root + 'sitemap.html">Sitemap</a>' +
      "  </nav>" +
      "  <p>&copy; " + CURRENT_YEAR + " " + SITE_NAME + ". All rights reserved.</p>" +
      "</footer>";
  }

  function getPreferredTheme() {
    var stored = null;
    try {
      stored = window.localStorage.getItem("theme");
    } catch (e) {
      stored = null;
    }
    if (stored === "light" || stored === "dark") {
      return stored;
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function applyTheme(theme) {
    if (!theme) return;
    document.documentElement.dataset.theme = theme;

    var button = document.getElementById("theme-toggle");
    if (button) {
      var isDark = theme === "dark";
      button.textContent = isDark ? "Light mode" : "Dark mode";
      button.setAttribute("aria-pressed", isDark ? "true" : "false");
      button.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
    }
  }

  function saveTheme(theme) {
    try {
      window.localStorage.setItem("theme", theme);
    } catch (e) {
      // Ignore storage errors
    }
  }

  function toggleTheme() {
    var current = document.documentElement.dataset.theme || getPreferredTheme();
    var next = current === "dark" ? "light" : "dark";
    applyTheme(next);
    saveTheme(next);
  }

  function loadAnalytics() {
    if (document.getElementById("ga-script")) return;

    var root = getRootPath();
    var script = document.createElement("script");
    script.id = "ga-script";
    script.src = root + "assets/ga.js";
    script.async = true;
    document.head.appendChild(script);
  }

  function init() {
    loadAnalytics();
    renderHeader();
    applyTheme(getPreferredTheme());
    renderFooter();

    var toggleButton = document.getElementById("theme-toggle");
    if (toggleButton) {
      toggleButton.addEventListener("click", toggleTheme);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
