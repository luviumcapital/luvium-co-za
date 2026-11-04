/* Luvium site behaviour. Progressive enhancement only: every page works with JavaScript off.
   The only thing ever stored in the browser is the light/dark choice. */
(function () {
  'use strict';
  var doc = document;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var MAIL = 'admin@luviumcapital.com';

  function $(s, c) { return (c || doc).querySelector(s); }
  function $all(s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); }

  /* ---------- theme ---------- */
  var root = doc.documentElement;
  var toggle = $('#theme-toggle');
  function currentTheme() {
    var t = root.getAttribute('data-theme');
    if (t) return t;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  if (toggle) {
    toggle.setAttribute('aria-pressed', String(currentTheme() === 'light'));
    toggle.addEventListener('click', function () {
      var next = currentTheme() === 'light' ? 'dark' : 'light';
      root.setAttribute('data-theme', next);
      toggle.setAttribute('aria-pressed', String(next === 'light'));
      try { localStorage.setItem('lv-theme', next); } catch (e) { /* storage blocked, fine */ }
    });
  }

  /* ---------- nav ---------- */
  var nav = $('.nav');
  var sentinel = $('#top-sentinel');
  if (nav && sentinel && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (en) {
      nav.classList.toggle('is-stuck', !en[0].isIntersecting);
    }).observe(sentinel);
  } else if (nav) { nav.classList.add('is-stuck'); }

  var burger = $('#burger');
  var menu = $('#menu');
  if (burger && menu) {
    var setMenu = function (open) {
      menu.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      var use = $('use', burger);
      if (use) use.setAttribute('href', '/img/icons.svg#' + (open ? 'i-x' : 'i-list'));
    };
    burger.addEventListener('click', function () { setMenu(!menu.classList.contains('open')); });
    $all('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
  }

  /* ---------- hero headline word reveal ---------- */
  var h1 = $('h1.display');
  if (h1 && !reduce) {
    var i = 0;
    (function split(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = doc.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(doc.createTextNode(' ')); return; }
            var s = doc.createElement('span');
            s.className = 'word'; s.style.setProperty('--i', i++); s.textContent = part;
            frag.appendChild(s);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.classList.contains('hl')) {
          n.classList.add('word'); n.style.setProperty('--i', i++);
        }
      });
    })(h1);
  }

  /* ---------- reveal on scroll ---------- */
  var rvs = $all('.rv');
  if (rvs.length) {
    if ('IntersectionObserver' in window && !reduce) {
      var io = new IntersectionObserver(function (en) {
        en.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
      rvs.forEach(function (el) { io.observe(el); });
    } else { rvs.forEach(function (el) { el.classList.add('in'); }); }
  }

  /* ---------- counters ---------- */
  function fmt(n) { return Math.round(n).toLocaleString('en-ZA').replace(/ /g, ' '); }
  function tween(el, to, prefix, suffix, ms) {
    if (reduce) { el.textContent = prefix + fmt(to) + suffix; return; }
    var from = parseFloat(el.getAttribute('data-now')) || 0;
    var t0 = null;
    function step(t) {
      if (t0 === null) t0 = t;
      var p = Math.min(1, (t - t0) / ms);
      var e = 1 - Math.pow(1 - p, 3);
      var v = from + (to - from) * e;
      el.textContent = prefix + fmt(v) + suffix;
      if (p < 1) { requestAnimationFrame(step); } else { el.setAttribute('data-now', to); }
    }
    requestAnimationFrame(step);
  }
  var counters = $all('[data-count]');
  if (counters.length) {
    var co = 'IntersectionObserver' in window ? new IntersectionObserver(function (en) {
      en.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        tween(el, parseFloat(el.getAttribute('data-count')), '', el.getAttribute('data-suffix') || '', 1100);
        co.unobserve(el);
      });
    }) : null;
    counters.forEach(function (el) {
      if (co) co.observe(el); else el.textContent = el.getAttribute('data-count') + (el.getAttribute('data-suffix') || '');
    });
  }

  /* ---------- why items highlight ---------- */
  var items = $all('.why-item');
  if (items.length && 'IntersectionObserver' in window) {
    var wo = new IntersectionObserver(function (en) {
      en.forEach(function (e) { e.target.classList.toggle('on', e.isIntersecting); });
    }, { rootMargin: '-38% 0px -38% 0px' });
    items.forEach(function (el) { wo.observe(el); });
  } else { items.forEach(function (el) { el.classList.add('on'); }); }

  /* ---------- illustrative stock value calculator ---------- */
  var units = $('#est-units');
  var value = $('#est-value');
  if (units && value) {
    var out = $('#est-total');
    var uo = $('#est-units-out');
    var vo = $('#est-value-out');
    var first = true;
    var paint = function (el) {
      var min = parseFloat(el.min), max = parseFloat(el.max);
      el.style.setProperty('--p', ((el.value - min) / (max - min) * 100) + '%');
    };
    var update = function () {
      var u = parseInt(units.value, 10), v = parseInt(value.value, 10);
      uo.textContent = u + (u === 1 ? ' vehicle' : ' vehicles');
      vo.textContent = 'R' + fmt(v);
      paint(units); paint(value);
      var total = u * v;
      if (first) { out.textContent = 'R' + fmt(total); out.setAttribute('data-now', total); first = false; }
      else { tween(out, total, 'R', '', 450); }
    };
    units.addEventListener('input', update);
    value.addEventListener('input', update);
    update();
  }

  /* ---------- forms ---------- */
  function collect(form) {
    var o = {};
    new FormData(form).forEach(function (v, k) {
      if (typeof v !== 'string') return;
      v = v.trim();
      if (v) o[k] = v;
    });
    $all('input[type=checkbox]', form).forEach(function (c) { o[c.name] = c.checked; });
    return o;
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  function mailtoFor(form, data) {
    var subject = form.getAttribute('data-subject') || 'Enquiry from luvium.co.za';
    var lines = [];
    $all('[name]', form).forEach(function (f) {
      if (!f.name || f.name === 'website' || f.type === 'checkbox' || f.type === 'submit') return;
      var lab = form.querySelector('label[for="' + f.id + '"]');
      var name = lab ? lab.textContent.replace(/\s*\(optional\)\s*$/i, '').replace(/\*/g, '').trim() : f.name;
      if (data[f.name]) lines.push(name + ': ' + data[f.name]);
    });
    var body = lines.join('\n').slice(0, 1500);
    return 'mailto:' + MAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  }

  function show(msg, kind, html) {
    msg.className = 'msg show ' + kind;
    msg.innerHTML = '<svg class="ico" aria-hidden="true"><use href="/img/icons.svg#i-' + (kind === 'ok' ? 'check-circle' : 'warning-circle') + '"/></svg><div>' + html + '</div>';
  }

  function initForm(form) {
    var msg = $('.msg', form);
    var btn = $('button[type=submit]', form);
    var label = btn ? btn.innerHTML : '';
    form.setAttribute('novalidate', 'novalidate');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      $all('[aria-invalid]', form).forEach(function (f) { f.removeAttribute('aria-invalid'); });
      if (!form.checkValidity()) {
        var bad = form.querySelector(':invalid');
        if (bad) { bad.setAttribute('aria-invalid', 'true'); bad.focus(); }
        show(msg, 'err', 'Please complete the highlighted field: ' + esc(bad && bad.validationMessage ? bad.validationMessage : 'it looks incomplete') + '.');
        return;
      }
      var data = collect(form);
      if (data.website) { show(msg, 'ok', 'Thank you. We have your details.'); form.reset(); return; } /* honeypot */

      if (btn) { btn.disabled = true; btn.setAttribute('aria-busy', 'true'); btn.textContent = 'Sending'; }
      var ctl = ('AbortController' in window) ? new AbortController() : null;
      var timer = setTimeout(function () { if (ctl) ctl.abort(); }, 12000);

      function done() { clearTimeout(timer); if (btn) { btn.disabled = false; btn.removeAttribute('aria-busy'); btn.innerHTML = label; } }
      function fallback() {
        var href = mailtoFor(form, data);
        show(msg, 'err', 'Our online form could not send your message right now, and nothing was lost. <a href="' + href + '">Send it by email instead</a>. Your email app should open with everything filled in.');
        try { window.location.href = href; } catch (x) { /* link above still works */ }
      }

      fetch(form.getAttribute('data-endpoint'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(Object.assign({ subject: form.getAttribute('data-subject') || '' }, data)),
        credentials: 'same-origin',
        signal: ctl ? ctl.signal : undefined
      }).then(function (r) {
        if (r.ok) {
          show(msg, 'ok', esc(form.getAttribute('data-success') || 'Thank you. We have your details and will be in touch.'));
          form.reset(); return;
        }
        if (r.status === 400 || r.status === 422) {
          return r.json().then(function (j) {
            if (j && j.fields) { Object.keys(j.fields).forEach(function (k) { var f = form.elements[k]; if (f && f.setAttribute) f.setAttribute('aria-invalid', 'true'); }); }
            show(msg, 'err', esc((j && j.message) || 'Please check your details and try again.'));
          }, function () { show(msg, 'err', 'Please check your details and try again.'); });
        }
        if (r.status === 429) { show(msg, 'err', 'That is a lot of attempts in a short time. Please wait a few minutes, or <a href="' + mailtoFor(form, data) + '">email us directly</a>.'); return; }
        fallback();
      }).catch(fallback).then(done, done);
    });

    /* clear invalid mark while typing */
    form.addEventListener('input', function (e) { if (e.target && e.target.removeAttribute) e.target.removeAttribute('aria-invalid'); });
  }
  $all('form[data-endpoint]').forEach(initForm);

  /* current year in footer */
  $all('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear() < 2026 ? 2026 : new Date().getFullYear(); });
})();
