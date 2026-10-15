(function () {
  var nav = document.getElementById('nav');
  var burger = document.getElementById('burger');
  var menu = document.getElementById('menu');

  burger.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    burger.setAttribute('aria-expanded', open);
  });
  menu.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') {
      nav.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
    }
  });

  function onScroll() { nav.classList.toggle('scrolled', window.scrollY > 10); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Odpočet na nejbližší hraní ---------- */
  // První hraní: 19. 10. 2026 16:01 (pražský čas), pak každých 14 dní.
  var FIRST = { y: 2026, m: 10, d: 19, h: 16, min: 1 };
  var STEP_DAYS = 14;

  // Poslední neděle v měsíci v 01:00 UTC = přechod na letní / zimní čas (EU)
  function lastSundayUtc(y, month) {
    var d = new Date(Date.UTC(y, month + 1, 0, 1));
    return d.getTime() - d.getUTCDay() * 864e5;
  }
  // Posun Prahy od UTC v ms (bez závislosti na Intl)
  function pragueOffset(utcMs) {
    var y = new Date(utcMs).getUTCFullYear();
    var dst = utcMs >= lastSundayUtc(y, 2) && utcMs < lastSundayUtc(y, 9);
    return (dst ? 2 : 1) * 36e5;
  }
  // Pražský čas -> UTC milisekundy
  function pragueToMs(y, m, d, h, min) {
    var local = Date.UTC(y, m - 1, d, h, min);
    var ms = local - pragueOffset(local - 36e5);
    return local - pragueOffset(ms);
  }
  function sessionAt(k) {
    return pragueToMs(FIRST.y, FIRST.m, FIRST.d + k * STEP_DAYS, FIRST.h, FIRST.min);
  }
  function nextSession(now) {
    var k = 0;
    while (sessionAt(k) <= now) k++;
    return sessionAt(k);
  }
  function formatDate(ms) {
    var d = new Date(ms + pragueOffset(ms));
    var days = ['neděle', 'pondělí', 'úterý', 'středa', 'čtvrtek', 'pátek', 'sobota'];
    return days[d.getUTCDay()] + ' ' + d.getUTCDate() + '. ' + (d.getUTCMonth() + 1) + '. ' +
      d.getUTCFullYear() + ' od ' + d.getUTCHours() + ':' + pad(d.getUTCMinutes());
  }

  var cd = {
    box: document.getElementById('countdown'),
    date: document.getElementById('cd-date'),
    d: document.getElementById('cd-d'), h: document.getElementById('cd-h'),
    m: document.getElementById('cd-m'), s: document.getElementById('cd-s'),
    dl: document.getElementById('cd-d-l'), hl: document.getElementById('cd-h-l'),
    ml: document.getElementById('cd-m-l'), sl: document.getElementById('cd-s-l'),
    rd: document.getElementById('ring-d'), rh: document.getElementById('ring-h'),
    rm: document.getElementById('ring-m'), rs: document.getElementById('ring-s')
  };
  var target = null;

  // Česká čísla: 1 den, 2–4 dny, 0 a 5+ dní
  var UNITS = {
    d: ['den', 'dny', 'dní'], h: ['hodina', 'hodiny', 'hodin'],
    m: ['minuta', 'minuty', 'minut'], s: ['sekunda', 'sekundy', 'sekund']
  };
  function plural(n, f) { return n === 1 ? f[0] : (n >= 2 && n <= 4 ? f[1] : f[2]); }

  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function setVal(el, text) {
    if (el.textContent === text) return;
    el.textContent = text;
    el.classList.remove('bump');
    void el.offsetWidth;
    el.classList.add('bump');
  }
  function setRing(el, frac) { el.style.strokeDashoffset = String(100 - Math.max(0, Math.min(1, frac)) * 100); }

  function tick() {
    var now = Date.now();
    if (target === null || now >= target) {
      target = nextSession(now);
      cd.date.textContent = formatDate(target);
    }
    var left = Math.max(0, Math.floor((target - now) / 1000));
    var d = Math.floor(left / 86400), h = Math.floor(left % 86400 / 3600),
        m = Math.floor(left % 3600 / 60), s = left % 60;
    setVal(cd.d, String(d)); setVal(cd.h, pad(h)); setVal(cd.m, pad(m)); setVal(cd.s, pad(s));
    cd.dl.textContent = plural(d, UNITS.d); cd.hl.textContent = plural(h, UNITS.h);
    cd.ml.textContent = plural(m, UNITS.m); cd.sl.textContent = plural(s, UNITS.s);
    setRing(cd.rd, left / (STEP_DAYS * 86400));
    setRing(cd.rh, h / 24);
    setRing(cd.rm, m / 60);
    setRing(cd.rs, s / 60);
  }
  if (cd.box) {
    tick();
    setInterval(tick, 1000);
  }

  var items = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    items.forEach(function (el) { el.classList.add('in'); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    });
  }, { threshold: 0.15 });
  items.forEach(function (el, i) {
    el.style.transitionDelay = (i % 4) * 70 + 'ms';
    io.observe(el);
  });
})();
