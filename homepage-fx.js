/* ============================================================
   HARAPAN Homepage — Behaviour (FX) terpisah, vanilla JS.
   Muat sebelum </body>: <script src="homepage-fx.js" defer></script>
   Tidak ada dependency. Mengikat ke elemen lewat class/id/atribut:
     - tombol tema      : [data-tk="dark"], [data-tk="light"]
     - hamburger        : .hamburger  + #mobileMenu
     - tombol tema mobil: #menuThemeBtn
     - logo (swap)      : img.logo
     - angka count-up   : .stat-num[data-target][data-suffix]
     - reveal on-scroll : .reveal  -> .reveal.in
     - partikel hero    : #heroCanvas (di dalam wrapper ber-position)
     - ikon terbang     : #floatCradle (#floatIcon di dalamnya)
     - dock progres     : #scrollDock (#dockRing, #dockIcon)
   Tema disimpan di localStorage key "harapan_home_theme".
   ============================================================ */
(function () {
  var LOGO_LIGHT = 'https://portal.harapanmu.id/assets/Logo%20Harapan_full_for%20BG%20White.png';
  var LOGO_DARK  = 'https://portal.harapanmu.id/assets/Logo%20Harapan_full_For%20BG%20Dark.png';

  function applyTheme(dark) {
    document.body.classList.toggle('dark', dark);
    document.querySelectorAll('.logo').forEach(function (i) { i.src = dark ? LOGO_DARK : LOGO_LIGHT; });
    document.querySelectorAll('[data-tk]').forEach(function (b) {
      var on = b.getAttribute('data-tk') === (dark ? 'dark' : 'light');
      b.style.background = on ? 'var(--grad)' : 'transparent';
      b.style.color = on ? '#fff' : 'var(--text2)';
      b.style.boxShadow = on ? '4px 4px 10px rgba(123,63,228,.35), -3px -3px 8px var(--shl)' : 'none';
    });
    try { localStorage.setItem('harapan_home_theme', dark ? 'dark' : 'light'); } catch (e) {}
  }
  function toggleTheme() { applyTheme(!document.body.classList.contains('dark')); }

  function initMenu() {
    var ham = document.querySelector('.hamburger');
    var m = document.getElementById('mobileMenu');
    if (ham && m) ham.addEventListener('click', function () { m.style.display = (m.style.display !== 'flex') ? 'flex' : 'none'; });
    if (m) m.querySelectorAll('.navlink').forEach(function (a) { a.addEventListener('click', function () { m.style.display = 'none'; }); });
    var mt = document.getElementById('menuThemeBtn');
    if (mt) mt.addEventListener('click', toggleTheme);
  }

  function countUp(el, reduce) {
    var target = parseFloat(el.getAttribute('data-target')) || 0;
    var suffix = el.getAttribute('data-suffix') || '';
    if (reduce) { el.textContent = target + suffix; return; }
    var dur = 1400, t0 = performance.now();
    (function step(now) {
      var p = Math.min((now - t0) / dur, 1);
      var e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * e) + suffix;
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  }

  function initScrollFX(reduce) {
    var heroIcon = document.getElementById('floatIcon');
    var cradle   = document.getElementById('floatCradle');
    var dock     = document.getElementById('scrollDock');
    var dockRing = document.getElementById('dockRing');
    var dockIcon = document.getElementById('dockIcon');
    var C = 169.6;

    function getScrollParent(el) {
      while (el && el !== document.body && el !== document.documentElement) {
        var s = getComputedStyle(el);
        if (/(auto|scroll|overlay)/.test(s.overflowY + ' ' + s.overflow) && el.scrollHeight > el.clientHeight + 4) return el;
        el = el.parentElement;
      }
      return null;
    }
    var navEl = document.querySelector('nav');
    var scroller = (navEl && getScrollParent(navEl)) || null;

    var anchor = null;
    function captureAnchor() {
      if (!cradle) return;
      var pos = cradle.style.position, l = cradle.style.left, t = cradle.style.top, rg = cradle.style.right, tf = cradle.style.transform, op = cradle.style.opacity;
      cradle.style.position = ''; cradle.style.left = ''; cradle.style.top = ''; cradle.style.right = ''; cradle.style.transform = 'scale(1)';
      var r = cradle.getBoundingClientRect();
      var sy = scroller ? scroller.scrollTop : (window.scrollY || 0);
      anchor = { x: r.left + r.width / 2, y: r.top + sy + r.height / 2 };
      cradle.style.position = pos; cradle.style.left = l; cradle.style.top = t; cradle.style.right = rg; cradle.style.transform = tf; cradle.style.opacity = op;
    }
    captureAnchor();
    window.addEventListener('resize', captureAnchor);
    setTimeout(captureAnchor, 700);

    function onScroll() {
      var y = scroller ? scroller.scrollTop : (window.scrollY || window.pageYOffset || 0);
      var FLIGHT = 440;
      var p = reduce ? 0 : Math.min(y / FLIGHT, 1);
      if (cradle) {
        if (reduce || p <= 0) {
          cradle.style.position = ''; cradle.style.left = ''; cradle.style.top = ''; cradle.style.right = ''; cradle.style.zIndex = ''; cradle.style.transform = 'scale(1)'; cradle.style.opacity = '1';
        } else if (p >= 1) {
          cradle.style.opacity = '0';
        } else if (anchor) {
          var dr = dock ? dock.getBoundingClientRect() : null;
          var dx = dr ? (dr.left + dr.width / 2) : (window.innerWidth - 55);
          var dy = dr ? (dr.top + dr.height / 2) : (window.innerHeight - 55);
          var natVX = anchor.x, natVY = anchor.y - y;
          var cx = natVX + (dx - natVX) * p, cy = natVY + (dy - natVY) * p;
          var sc = 1 + (0.553 - 1) * p;
          cradle.style.position = 'fixed'; cradle.style.right = 'auto';
          cradle.style.left = cx + 'px'; cradle.style.top = cy + 'px';
          cradle.style.zIndex = '130';
          cradle.style.transform = 'translate(-50%,-50%) scale(' + sc + ')';
          cradle.style.opacity = '1';
        }
      }
      if (heroIcon && !reduce) heroIcon.style.transform = 'rotate(' + (y * 0.22) + 'deg)';
      if (dock) {
        var show = reduce ? (y > 340) : (p >= 1);
        dock.style.opacity = show ? '1' : '0';
        dock.style.transform = show ? 'scale(1)' : 'scale(.5)';
        dock.style.pointerEvents = show ? 'auto' : 'none';
        var docH = scroller ? (scroller.scrollHeight - scroller.clientHeight) : (document.documentElement.scrollHeight - window.innerHeight);
        var prog = docH > 0 ? Math.min(y / docH, 1) : 0;
        if (dockRing) dockRing.style.strokeDashoffset = String(C * (1 - prog));
        if (dockIcon && !reduce) dockIcon.style.transform = 'rotate(' + (y * 0.14) + 'deg)';
      }
    }
    (scroller || window).addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true, capture: true });
    onScroll();
    if (dock) dock.addEventListener('click', function () { (scroller || window).scrollTo({ top: 0, behavior: 'smooth' }); });
  }

  function initParticles() {
    var cv = document.getElementById('heroCanvas');
    if (!cv) return;
    var host = cv.parentElement, ctx = cv.getContext('2d'), dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = 0, h = 0, pts = [], mouse = { x: -9999, y: -9999 };
    function resize() {
      var r = host.getBoundingClientRect();
      if (!r.width) return;
      w = r.width; h = r.height; cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var count = Math.max(26, Math.min(56, Math.round((w * h) / 24000)));
      pts = [];
      for (var i = 0; i < count; i++) pts.push({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - .5) * .18, vy: (Math.random() - .5) * .18 });
    }
    window.addEventListener('resize', resize);
    host.addEventListener('mousemove', function (e) { var r = host.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
    host.addEventListener('mouseleave', function () { mouse.x = -9999; mouse.y = -9999; });
    resize();
    (function tick() {
      if (w && h) {
        var dark = document.body.classList.contains('dark');
        var a = dark ? 0.4 : 0.26;
        var rgb = dark ? '167,125,255' : '123,63,228';
        ctx.clearRect(0, 0, w, h);
        var i, j, p;
        for (i = 0; i < pts.length; i++) {
          p = pts[i];
          var dx = mouse.x - p.x, dy = mouse.y - p.y, d2 = dx * dx + dy * dy;
          if (d2 < 24000) { p.vx += dx * 0.00005; p.vy += dy * 0.00005; }
          p.vx *= 0.99; p.vy *= 0.99;
          var sp = Math.hypot(p.vx, p.vy);
          if (sp > 0.45) { p.vx *= 0.45 / sp; p.vy *= 0.45 / sp; }
          p.x += p.vx; p.y += p.vy;
          if (p.x < 0) p.x += w; if (p.x > w) p.x -= w;
          if (p.y < 0) p.y += h; if (p.y > h) p.y -= h;
        }
        for (i = 0; i < pts.length; i++) for (j = i + 1; j < pts.length; j++) {
          var ax = pts[i].x - pts[j].x, ay = pts[i].y - pts[j].y, dist = Math.hypot(ax, ay);
          if (dist < 124) { ctx.strokeStyle = 'rgba(' + rgb + ',' + ((1 - dist / 124) * 0.22 * a) + ')'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y); ctx.stroke(); }
        }
        for (i = 0; i < pts.length; i++) {
          p = pts[i];
          var dd = Math.hypot(mouse.x - p.x, mouse.y - p.y);
          if (dd < 168) { ctx.strokeStyle = 'rgba(' + rgb + ',' + ((1 - dd / 168) * 0.6 * a) + ')'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(mouse.x, mouse.y); ctx.lineTo(p.x, p.y); ctx.stroke(); }
        }
        ctx.fillStyle = 'rgba(' + rgb + ',' + (a * 0.85) + ')';
        for (i = 0; i < pts.length; i++) { ctx.beginPath(); ctx.arc(pts[i].x, pts[i].y, 1.5, 0, 6.2832); ctx.fill(); }
      }
      requestAnimationFrame(tick);
    })();
  }

  function init() {
    document.querySelectorAll('[data-tk]').forEach(function (b) {
      b.addEventListener('click', function () { applyTheme(b.getAttribute('data-tk') === 'dark'); });
    });
    initMenu();

    // tema: simpanan > otomatis by jam (18:00–05:59 = dark)
    var dark;
    try { var s = localStorage.getItem('harapan_home_theme'); if (s) dark = (s === 'dark'); } catch (e) {}
    if (dark === undefined) { var hr = new Date().getHours(); dark = (hr >= 18 || hr < 6); }
    applyTheme(dark);

    var cy = document.getElementById('copyYear');
    if (cy) cy.textContent = '© ' + new Date().getFullYear() + ' PT Anugrah Tumbuh Kharunia. Semua hak dilindungi.';

    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          en.target.querySelectorAll('.stat-num').forEach(function (el) { countUp(el, reduce); });
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.14 });
    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
    setTimeout(function () { document.querySelectorAll('.reveal:not(.in)').forEach(function (el) { el.classList.add('in'); }); }, 2500);

    initScrollFX(reduce);
    if (!reduce) initParticles();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
