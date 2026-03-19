/* ══════════════════════════════════════════════════════════════
   NodeGrid Design System — theme-toggle.js v1.0
   Dark / Light mode toggle with localStorage + system preference
   ══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var STORAGE_KEY = 'nodegrid-theme';

  function getPreferredTheme() {
    var stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
    updateButton(theme);
  }

  function toggleTheme() {
    var current = document.documentElement.getAttribute('data-theme') || 'dark';
    applyTheme(current === 'dark' ? 'light' : 'dark');
  }

  function updateButton(theme) {
    var btn = document.getElementById('theme-toggle');
    if (!btn) return;
    var isDark = theme === 'dark';
    btn.setAttribute('aria-label', isDark ? 'Mudar para modo claro' : 'Mudar para modo escuro');
    btn.setAttribute('title', isDark ? 'Modo claro' : 'Modo escuro');
    var sun  = btn.querySelector('.icon-sun');
    var moon = btn.querySelector('.icon-moon');
    if (sun)  sun.style.display  = isDark ? 'block' : 'none';
    if (moon) moon.style.display = isDark ? 'none'  : 'block';
  }

  /* Apply immediately — prevents flash of wrong theme */
  applyTheme(getPreferredTheme());

  /* Wire button after DOM is ready */
  document.addEventListener('DOMContentLoaded', function () {
    var btn = document.getElementById('theme-toggle');
    if (btn) {
      btn.addEventListener('click', toggleTheme);
      updateButton(document.documentElement.getAttribute('data-theme') || 'dark');
    }
  });

  /* Sync across tabs */
  window.addEventListener('storage', function (e) {
    if (e.key === STORAGE_KEY && e.newValue) applyTheme(e.newValue);
  });
})();
