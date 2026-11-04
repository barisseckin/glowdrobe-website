(function () {
  var cfg = window.GD_CONFIG;
  var T = JSON.parse(document.getElementById('gd-i18n').textContent);
  var motion = window.matchMedia('(prefers-reduced-motion: no-preference)').matches;

  document.querySelectorAll('[data-store-link]').forEach(function (a) { a.href = cfg.appStoreUrl; });

  /* Notify form */
  function say(form, text, state) {
    var msg = form.querySelector('.notify-msg');
    msg.textContent = text;
    msg.dataset.state = state;
  }
  /* utm_source travels with the signup, so the admin list shows which ad brought it. */
  var utm = (new URLSearchParams(location.search).get('utm_source') || '').replace(/[^\w-]/g, '').slice(0, 20);
  function leadSource(form) {
    var place = form.dataset.source || 'site';
    return utm ? utm + ':' + place : place;
  }
  document.querySelectorAll('form.notify').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = form.querySelector('input[type=email]');
      var button = form.querySelector('button');
      var email = input.value.trim();
      if (!email || !input.checkValidity()) {
        say(form, T.err_email, 'error');
        input.focus();
        return;
      }
      if (!cfg.waitlistEndpoint) {
        location.href = 'mailto:contact@glowdrobe.ai?subject=' + encodeURIComponent(T.mail_subject) +
          '&body=' + encodeURIComponent(T.mail_body + ' ' + email);
        say(form, T.mail_opened, 'ok');
        return;
      }
      button.disabled = true;
      say(form, T.adding, 'busy');
      fetch(cfg.waitlistEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, source: leadSource(form), lang: document.documentElement.lang, website: form.querySelector('.hp').value })
      }).then(function (r) {
        if (!r.ok) throw new Error(r.status);
        form.classList.add('is-done');
        say(form, T.added, 'ok');
        document.dispatchEvent(new CustomEvent('gd:lead'));
      }).catch(function () {
        say(form, T.err_send, 'error');
      }).finally(function () { button.disabled = false; });
    });
  });

  /* Phone CTA: appears after the hero, steps aside at the closing CTA */
  var dock = document.querySelector('.dock');
  var hero = document.querySelector('[data-hero] .cta');
  var close = document.querySelector('[data-close]');
  if (dock && hero && 'IntersectionObserver' in window) {
    var heroGone = false, closeShown = false;
    var sync = function () { dock.classList.toggle('is-on', heroGone && !closeShown); };
    new IntersectionObserver(function (es) { heroGone = !es[0].isIntersecting; sync(); }).observe(hero);
    new IntersectionObserver(function (es) { closeShown = es[0].isIntersecting; sync(); }).observe(close);
  }

  /* Language menu closes when you click elsewhere */
  var langs = document.querySelector('.langs');
  document.addEventListener('click', function (e) { if (langs.open && !langs.contains(e.target)) langs.open = false; });

  /* Closet check demo */
  var P = {
    plaid: { img: 'quilted_jacket', name: 'p_plaid', head: 'similar_two', sim: [['leather_jacket', 'i_leather'], ['cream_coat', 'i_shirt']], go: [['cream_top', 'i_tee'], ['dark_jeans', 'i_navy'], ['boots', 'i_boots']] },
    jeans: { img: 'grey_jeans', name: 'p_jeans', head: 'similar_two', sim: [['dark_jeans', 'i_navy'], ['light_jeans', 'i_light']], go: [['black_top', 'i_henley'], ['boots', 'i_boots'], ['leather_jacket', 'i_leather']] },
    hoodie: { img: 'bag', name: 'p_hoodie', head: 'similar_none', sim: [], go: [['cream_top', 'i_tee'], ['dark_jeans', 'i_navy'], ['loafers', 'i_sneakers']] }
  };
  var SIZE = { quilted_jacket: [979, 1000], grey_jeans: [395, 779], leather_jacket: [443, 522], cream_coat: [482, 585], cream_top: [274, 434], dark_jeans: [505, 771], boots: [589, 610], light_jeans: [409, 774], black_top: [651, 1000], loafers: [425, 157], bag: [798, 1000] };
  var tabs = Array.prototype.slice.call(document.querySelectorAll('[data-p]'));
  var box = document.querySelector('.scan');
  var cart = document.getElementById('cart-img');
  var head = document.getElementById('r-head');
  var sim = document.getElementById('r-similar');
  var go = document.getElementById('r-goes');
  var timer;

  function fill(row, list) {
    row.textContent = '';
    list.forEach(function (x) {
      var li = document.createElement('li');
      var name = document.createElement('span');
      var im = new Image(SIZE[x[0]][0], SIZE[x[0]][1]);
      name.textContent = T[x[1]];
      im.src = '/assets/items/' + x[0] + '.webp';
      im.alt = '';
      li.appendChild(name);
      li.appendChild(document.createElement('i'));
      li.appendChild(im);
      row.appendChild(li);
    });
    row.hidden = !list.length;
  }
  function run(tab, focus) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
    });
    var d = P[tab.dataset.p];
    cart.width = SIZE[d.img][0];
    cart.height = SIZE[d.img][1];
    cart.src = '/assets/items/' + d.img + '.webp';
    cart.alt = T[d.name];
    box.classList.remove('is-done');
    box.classList.add('is-scanning');
    clearTimeout(timer);
    timer = setTimeout(function () {
      head.textContent = T[d.head];
      fill(sim, d.sim);
      fill(go, d.go);
      box.classList.remove('is-scanning');
      box.classList.add('is-done');
    }, motion ? 950 : 0);
    if (focus) tab.focus();
  }
  tabs.forEach(function (t, i) {
    t.tabIndex = i ? -1 : 0;
    t.addEventListener('click', function () { run(t); });
    t.addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (d) {
        if (document.documentElement.dir === 'rtl') d = -d;
        e.preventDefault();
        run(tabs[(i + d + tabs.length) % tabs.length], true);
      }
    });
  });
  box.classList.add('is-done');
  /* The scan plays once, when the receipt's cart is actually on screen. */
  if (motion && 'IntersectionObserver' in window) {
    var once = new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) { once.disconnect(); setTimeout(function () { run(tabs[0]); }, 250); }
    }, { threshold: 0.6 });
    once.observe(document.getElementById('r-head'));
  }
})();
