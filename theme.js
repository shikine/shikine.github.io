(function () {
  'use strict';
  var key = 'shikine-theme';
  var media = window.matchMedia('(prefers-color-scheme: dark)');
  var choice = 'system';
  function valid(value) { return ['system', 'light', 'dark'].indexOf(value) !== -1; }
  try { var saved = localStorage.getItem(key); if (valid(saved)) choice = saved; } catch (e) {}
  function apply() {
    document.documentElement.dataset.theme = choice === 'system' ? (media.matches ? 'dark' : 'light') : choice;
    var select = document.getElementById('theme-select');
    if (select) select.value = choice;
  }
  apply();
  if (media.addEventListener) media.addEventListener('change', apply);
  else media.addListener(apply);
  window.addEventListener('storage', function (event) {
    if (event.key === key || event.key === null) {
      choice = valid(event.newValue) ? event.newValue : 'system';
      apply();
    }
  });
  document.addEventListener('DOMContentLoaded', function () {
    var select = document.getElementById('theme-select');
    if (!select) return;
    apply();
    select.addEventListener('change', function () {
      choice = select.value;
      try { localStorage.setItem(key, choice); } catch (e) {}
      apply();
    });
  });
})();
