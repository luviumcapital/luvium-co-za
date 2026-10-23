/* Runs first, in <head>. Marks JS support and restores the saved theme before paint, so there is no flash. */
document.documentElement.classList.add('js');
try {
  var t = localStorage.getItem('lv-theme');
  if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t);
} catch (e) { /* storage unavailable, follow the system theme */ }
