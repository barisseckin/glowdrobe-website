/* Meta and TikTok pixels. Nothing loads, and no cookie is set, until the visitor accepts.
   Ids come from _src/site.json; with both empty this file does nothing. */
(function () {
  var cfg = window.GD_CONFIG, KEY = 'gd-ad-consent';
  if (!cfg || (!cfg.metaPixelId && !cfg.tiktokPixelId)) return;
  var T = JSON.parse(document.getElementById('gd-i18n').textContent);

  function read() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function write(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }

  function loadMeta(id) {
    /* eslint-disable */
    !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v;
      s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s); }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', id);
    window.fbq('track', 'PageView');
  }

  function loadTikTok(id) {
    !function (w, d, t) { w.TiktokAnalyticsObject = t; var ttq = w[t] = w[t] || [];
      ttq.methods = ['page', 'track', 'identify', 'instances', 'debug', 'on', 'off', 'once', 'ready', 'alias', 'group', 'enableCookie', 'disableCookie', 'holdConsent', 'revokeConsent', 'grantConsent'];
      ttq.setAndDefer = function (o, m) { o[m] = function () { o.push([m].concat(Array.prototype.slice.call(arguments, 0))); }; };
      for (var i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
      ttq.load = function (e, n) { var r = 'https://analytics.tiktok.com/i18n/pixel/events.js';
        ttq._i = ttq._i || {}; ttq._i[e] = []; ttq._i[e]._u = r; ttq._t = ttq._t || {}; ttq._t[e] = +new Date; ttq._o = ttq._o || {}; ttq._o[e] = n || {};
        var s = d.createElement('script'); s.type = 'text/javascript'; s.async = !0; s.src = r + '?sdkid=' + e + '&lib=' + t;
        var f = d.getElementsByTagName('script')[0]; f.parentNode.insertBefore(s, f); };
      ttq.load(id); ttq.page(); }(window, document, 'ttq');
  }

  var on = false;
  function start() {
    if (on) return;
    on = true;
    if (cfg.metaPixelId) loadMeta(cfg.metaPixelId);
    if (cfg.tiktokPixelId) loadTikTok(cfg.tiktokPixelId);
  }

  /* Fired by site.js after the backend accepts the signup. No email or hash is sent. */
  document.addEventListener('gd:lead', function () {
    if (!on) return;
    if (window.fbq) window.fbq('track', 'Lead');
    if (window.ttq) window.ttq.track('CompleteRegistration');
  });

  var saved = read();
  if (saved === 'yes') { start(); return; }
  if (saved === 'no') return;

  var box = document.createElement('div');
  box.className = 'consent';
  box.setAttribute('role', 'region');
  box.setAttribute('aria-label', T.consent_policy);
  var p = document.createElement('p');
  p.textContent = T.consent_text + ' ';
  var a = document.createElement('a');
  a.href = 'https://legal.glowdrobe.ai/privacy-policy'; a.target = '_blank'; a.rel = 'noopener'; a.textContent = T.consent_policy;
  p.appendChild(a);
  var row = document.createElement('div');
  [['no', T.consent_decline], ['yes', T.consent_accept]].forEach(function (x) {
    var b = document.createElement('button');
    b.type = 'button'; b.dataset.c = x[0]; b.textContent = x[1];
    b.addEventListener('click', function () { write(x[0]); box.remove(); if (x[0] === 'yes') start(); });
    row.appendChild(b);
  });
  box.appendChild(p); box.appendChild(row);
  document.body.appendChild(box);
})();
