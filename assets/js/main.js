/* Glowdrobe landing — vanilla JS, no dependencies */
(function () {
  'use strict';
  var root = document.documentElement;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var TR = window.GD_TR || {};
  var EN = {};
  var lang = root.lang === 'tr' ? 'tr' : 'en';

  /* ---------- extra EN strings that are not in the markup ---------- */
  var EN_EXTRA = {
    'meta.title': document.title,
    'meta.desc': (document.querySelector('meta[name="description"]') || {}).content || '',
    'ph.ai': 'AI stylist', 'ph.outfit': 'Outfit ready', 'ph.tryon': 'Try it on',
    'ph.wardrobe': 'Your closet', 'ph.plan': 'Plan the week', 'ph.community': 'Post the fit',
    'tour.st.0': '💬 Ask anything', 'tour.st.1': '🌤 Weather-ready', 'tour.st.2': '🪞 See it on you',
    'tour.st.3': '🏷 Auto-tagged', 'tour.st.4': '📅 Planned', 'tour.st.5': '🔥 Get the hype',
    'tour.pause': 'Pause tour', 'tour.play': 'Play tour', 'tour.live': 'Step {n} of {t}: {s}'
  };

  function t(key) {
    if (lang === 'tr' && TR[key] != null) return TR[key];
    return EN[key] != null ? EN[key] : '';
  }

  /* snapshot the English copy from the DOM so TR can be swapped back */
  document.querySelectorAll('[data-i18n]').forEach(function (el) {
    var k = el.getAttribute('data-i18n');
    if (EN[k] == null) EN[k] = el.innerHTML;
  });
  document.querySelectorAll('[data-i18n-attr]').forEach(function (el) {
    el.getAttribute('data-i18n-attr').split(';').forEach(function (pair) {
      var p = pair.split(':');
      if (EN[p[1]] == null) EN[p[1]] = el.getAttribute(p[0]) || '';
    });
  });
  Object.keys(EN_EXTRA).forEach(function (k) { EN[k] = EN_EXTRA[k]; });

  function applyLang(next, persist) {
    lang = next === 'tr' ? 'tr' : 'en';
    root.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var v = t(el.getAttribute('data-i18n'));
      if (el.innerHTML !== v) el.innerHTML = v;
    });
    document.querySelectorAll('[data-i18n-attr]').forEach(function (el) {
      el.getAttribute('data-i18n-attr').split(';').forEach(function (pair) {
        var p = pair.split(':');
        el.setAttribute(p[0], t(p[1]));
      });
    });
    document.title = t('meta.title');
    var md = document.querySelector('meta[name="description"]');
    if (md) md.setAttribute('content', t('meta.desc'));
    document.querySelectorAll('.lang [data-lang]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-lang') === lang));
    });
    if (persist) { try { localStorage.setItem('gd-lang', lang); } catch (e) { /* storage unavailable */ } }
    applyScreens();
    if (story) story.refresh();
    root.classList.remove('lang-pending');
  }

  document.querySelectorAll('.lang [data-lang]').forEach(function (b) {
    b.addEventListener('click', function () { applyLang(b.getAttribute('data-lang'), true); });
  });

  /* ---------- screenshots (only request files listed in the manifest) ---------- */
  function applyScreens() {
    var manifest = window.GD_SCREENS || {};
    document.querySelectorAll('img[data-screen]').forEach(function (img) {
      var key = img.getAttribute('data-screen');
      var holder = img.parentElement;
      holder.setAttribute('data-label', t('ph.' + key));
      var name = manifest[key + '-' + lang] ? key + '-' + lang : (manifest[key + '-en'] ? key + '-en' : null);
      if (!name) {
        img.removeAttribute('src'); img.classList.remove('loaded'); holder.classList.remove('has-img');
        img.hidden = true;
        return;
      }
      var src = 'assets/screens/' + name + '.' + manifest[name];
      if (img.getAttribute('src') === src) return;
      img.hidden = false;
      img.classList.remove('loaded');
      img.onload = function () { img.classList.add('loaded'); holder.classList.add('has-img'); };
      img.onerror = function () { img.hidden = true; img.removeAttribute('src'); holder.classList.remove('has-img'); };
      img.src = src;
    });
  }

  /* ---------- story-style interactive tour ---------- */
  var story = (function () {
    var el = document.getElementById('story');
    if (!el) return null;
    var slides = el.querySelectorAll('.story-slide');
    var bars = el.querySelectorAll('.story-bars i');
    var steps = document.querySelectorAll('#tour-steps [data-step]');
    var sticker = document.getElementById('story-sticker');
    var live = document.getElementById('story-live');
    var playBtn = document.getElementById('story-play');
    var screen = el.querySelector('.story-screen');
    var DURATION = 4800;
    var n = slides.length, i = 0, elapsed = 0, last = 0, raf = 0;
    var userPaused = reduceMotion, hovering = false, focused = false, visible = false;

    function running() { return !userPaused && !hovering && !focused && visible && !document.hidden; }

    function paint() {
      for (var j = 0; j < n; j++) {
        slides[j].classList.toggle('active', j === i);
        slides[j].setAttribute('aria-hidden', String(j !== i));
        bars[j].style.transform = 'scaleX(' + (j < i ? 1 : j > i ? 0 : (reduceMotion ? 1 : elapsed / DURATION)) + ')';
      }
      steps.forEach(function (s, j) {
        if (j === i) s.setAttribute('aria-current', 'step'); else s.removeAttribute('aria-current');
      });
      sticker.textContent = t('tour.st.' + i);
      sticker.style.animation = 'none'; void sticker.offsetWidth; sticker.style.animation = '';
    }

    function go(k, announce) {
      i = (k + n) % n; elapsed = 0;
      paint();
      if (announce) {
        var step = steps[i] && steps[i].querySelector('strong');
        live.textContent = t('tour.live').replace('{n}', i + 1).replace('{t}', n).replace('{s}', step ? step.textContent : '');
      }
    }

    function tick(now) {
      raf = 0;
      if (!running()) { last = 0; return; }
      if (last) elapsed += now - last;
      last = now;
      if (elapsed >= DURATION) { go(i + 1, false); last = now; }
      else bars[i].style.transform = 'scaleX(' + (elapsed / DURATION) + ')';
      raf = requestAnimationFrame(tick);
    }
    function kick() { if (!raf && running()) { last = 0; raf = requestAnimationFrame(tick); } }

    function syncPlayBtn() {
      playBtn.classList.toggle('paused', userPaused);
      playBtn.setAttribute('aria-label', t(userPaused ? 'tour.play' : 'tour.pause'));
      playBtn.setAttribute('aria-pressed', String(userPaused));
    }

    el.querySelector('.tap-prev').addEventListener('click', function () { go(i - 1, true); kick(); });
    el.querySelector('.tap-next').addEventListener('click', function () { go(i + 1, true); kick(); });
    document.getElementById('story-prev').addEventListener('click', function () { go(i - 1, true); kick(); });
    document.getElementById('story-next').addEventListener('click', function () { go(i + 1, true); kick(); });
    playBtn.addEventListener('click', function () { userPaused = !userPaused; syncPlayBtn(); kick(); });
    steps.forEach(function (s) {
      s.addEventListener('click', function () { go(+s.getAttribute('data-step'), true); kick(); });
    });

    el.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { go(i + 1, true); e.preventDefault(); }
      else if (e.key === 'ArrowLeft') { go(i - 1, true); e.preventDefault(); }
    });

    /* pause while hovered (mouse) or while keyboard focus is inside */
    el.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') { hovering = true; } });
    el.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') { hovering = false; kick(); } });
    function kbFocus(t) { try { return t.matches(':focus-visible'); } catch (e) { return false; } }
    el.addEventListener('focusin', function (e) { focused = kbFocus(e.target); });
    el.addEventListener('focusout', function () { focused = false; kick(); });

    /* touch swipe */
    var sx = 0, sy = 0, swiped = false;
    screen.addEventListener('pointerdown', function (e) { sx = e.clientX; sy = e.clientY; swiped = false; });
    screen.addEventListener('pointerup', function (e) {
      var dx = e.clientX - sx, dy = e.clientY - sy;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.2) { swiped = true; go(i + (dx < 0 ? 1 : -1), true); kick(); }
    });
    screen.addEventListener('click', function (e) { if (swiped) { e.stopPropagation(); e.preventDefault(); swiped = false; } }, true);

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) { visible = entries[0].isIntersecting; kick(); }, { threshold: 0.35 }).observe(el);
    } else { visible = true; }
    document.addEventListener('visibilitychange', kick);

    syncPlayBtn();
    go(0, false);
    kick();
    return { refresh: function () { paint(); syncPlayBtn(); } };
  })();

  /* ---------- nav border + mobile download dock ---------- */
  var nav = document.querySelector('.nav');
  var dock = document.getElementById('dock');
  var dockLink = dock && dock.querySelector('a');
  var heroCta = document.getElementById('hero-cta');
  var finalSec = document.getElementById('download');
  var pastHero = false, atFinal = false;
  function syncDock() {
    var show = pastHero && !atFinal;
    dock.classList.toggle('show', show);
    dock.setAttribute('aria-hidden', String(!show));
    dockLink.tabIndex = show ? 0 : -1;
  }
  if ('IntersectionObserver' in window && dock) {
    new IntersectionObserver(function (en) {
      pastHero = !en[0].isIntersecting && en[0].boundingClientRect.top < 0; syncDock();
    }).observe(heroCta);
    new IntersectionObserver(function (en) { atFinal = en[0].isIntersecting; syncDock(); }).observe(finalSec);
  }
  window.addEventListener('scroll', function () { nav.classList.toggle('scrolled', window.scrollY > 8); }, { passive: true });

  /* ---------- reveal on scroll ---------- */
  if (!reduceMotion && 'IntersectionObserver' in window) {
    var targets = document.querySelectorAll('.tour-head, .f-copy, .f-media, .step, .plan, .priv-card, .qa, .final-card, .center-head');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    targets.forEach(function (el) { el.classList.add('reveal'); io.observe(el); });
  }

  applyLang(lang, false);
})();
