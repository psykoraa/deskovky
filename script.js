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
  var TZ = 'Europe/Prague';
  var tzFmt = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ, hourCycle: 'h23', year: 'numeric', month: 'numeric',
    day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric'
  });

  function tzOffset(ms) {
    var p = {};
    tzFmt.formatToParts(new Date(ms)).forEach(function (x) { p[x.type] = +x.value; });
    return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(ms / 1000) * 1000;
  }
  // Pražský čas -> UTC milisekundy (včetně letního/zimního času)
  function pragueToMs(y, m, d, h, min) {
    var guess = Date.UTC(y, m - 1, d, h, min);
    var ms = guess - tzOffset(guess);
    return guess - tzOffset(ms);
  }
  function sessionAt(k) {
    return pragueToMs(FIRST.y, FIRST.m, FIRST.d + k * STEP_DAYS, FIRST.h, FIRST.min);
  }
  function nextSession(now) {
    var k = 0;
    while (sessionAt(k) <= now) k++;
    return sessionAt(k);
  }

  var cd = {
    box: document.getElementById('countdown'),
    date: document.getElementById('cd-date'),
    d: document.getElementById('cd-d'),
    h: document.getElementById('cd-h'),
    m: document.getElementById('cd-m'),
    s: document.getElementById('cd-s')
  };
  var target = null;

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  function tick() {
    var now = Date.now();
    if (target === null || now >= target) {
      target = nextSession(now);
      cd.date.textContent = new Intl.DateTimeFormat('cs-CZ', {
        timeZone: TZ, weekday: 'long', day: 'numeric', month: 'numeric', year: 'numeric'
      }).format(new Date(target)) + ' od 16:01';
    }
    var left = Math.max(0, Math.floor((target - now) / 1000));
    cd.d.textContent = Math.floor(left / 86400);
    cd.h.textContent = pad(Math.floor(left % 86400 / 3600));
    cd.m.textContent = pad(Math.floor(left % 3600 / 60));
    cd.s.textContent = pad(left % 60);
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
