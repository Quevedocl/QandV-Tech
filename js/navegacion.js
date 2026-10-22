/* =====================================================
   Scroll entre secciones (rueda, teclado, táctil, data-goto)
   + navegación lateral con orbe, línea de progreso y efecto dock.

   Obs: Cada vez que cambia la sección dispara el evento
   "qv:seccion" en document con detail = { prev, next, total },
   para que otros archivos (logo-burbuja.js, efectos.js)
   reaccionen sin depender de este.
   ===================================================== */

(function(){
  'use strict';

  var wrap         = document.getElementById('wrap');
  var sections     = document.querySelectorAll('.sections-wrap .section');
  var dots         = Array.prototype.slice.call(document.querySelectorAll('.dot.nav-dot'));
  var neonLineFill = document.getElementById('neonLineFill');
  var hint         = document.getElementById('hint');
  var total        = sections.length;

  var current = 0, isAnimating = false;
  var DUR = 580;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) DUR = 80;

  /* ---------- Orbe, línea y efecto dock de la navegación lateral ---------- */
  var navHost = document.getElementById('dots');
  var navOrb = document.createElement('div');
  navOrb.className = 'nav-orb';
  navOrb.innerHTML = '<i></i>';
  navHost.appendChild(navOrb);
  var navCore = navOrb.firstChild;

  var THIN = 0.11;
  var DOCK_MAX = 0.6, DOCK_RANGE = 4;
  var NAV = { y:0, from:0, to:0, t0:0, dur:1, raf:0, lead:.12, sx:1, sy:1, sx0:1, sy0:1, sY:1.6, running:false, rippled:false, idx:0 };
  var reached = dots.map(function(){ return false; });
  var ys = [];

  function measure(){ ys = dots.map(function(d){ return d.offsetTop + d.offsetHeight / 2; }); }
  function spacing(){ return Math.abs((ys[1] || 0) - (ys[0] || 0)) || 34; }
  function clamp01(x){ return x < 0 ? 0 : (x > 1 ? 1 : x); }
  function mix(a, b, t){ return a + (b - a) * t; }
  function easeInOut(t){ return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function easeOutBack(t){ var c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); }

  function dockScale(y, i){
    var u = Math.abs(y - ys[i]) / spacing();
    return 1 + DOCK_MAX * Math.pow(Math.max(0, 1 - u / DOCK_RANGE), 1.5);
  }

  /* ---------- Efecto dock tipo macOS ----------
     Al acercar el mouse a los círculos, los más cercanos al cursor se agrandan y los vecinos
     se apartan para hacerles lugar (como el dock del Mac). Es una "lente" continua:
       tamaño(d)        = 1 + LENS_MAX · e^-(d/σ)²
       desplazamiento   = LENS_MAX · σ · (√π/2) · erf(d/σ)   (con el signo de d)
     donde d es la distancia vertical al cursor. La zona de activación es más ancha que los
     círculos: empieza a crecer apenas te acercas y se relaja suave al alejarte. */
  var LENS_MAX = 0.95, LENS_SIGMA = 46, LENS_ZONE = 150, LENS_CORE = 40;
  var dock = { cy:0, cyT:0, amt:0, amtT:0, raf:0 };

  function erf(x){                                   /* aproximación de Abramowitz-Stegun */
    var t = 1 / (1 + 0.3275911 * x);
    return 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  }
  /* Solo zoom: las esferas vecinas ya NO se separan al acercar el cursor (desplazamiento = 0). */
  function lensDisp(y){ return 0; }
  function lensScale(y){ var d = (y - dock.cy) / LENS_SIGMA; return 1 + LENS_MAX * Math.exp(-d * d); }

  function renderNav(){
    var y = NAV.y, amt = dock.amt, n = dots.length;

    for (var i = 0; i < n; i++){
      var want = ys[i] <= y + 6;
      if (want !== reached[i]){
        reached[i] = want;
        dots[i].classList.toggle('is-reached', want);
        if (want && !reduce){
          (function(d){
            d.classList.remove('pop'); void d.offsetWidth; d.classList.add('pop');
            setTimeout(function(){ d.classList.remove('pop'); }, 720);
          })(dots[i]);
        }
      }
      var rest = dockScale(y, i), sc, dy = 0;
      if (amt < 0.001){ sc = rest; }
      else { sc = rest * (1 - amt) + lensScale(ys[i]) * amt; dy = lensDisp(ys[i]); }
      var tr = dy ? 'translate3d(0,' + dy.toFixed(2) + 'px,0) scale(' + sc.toFixed(3) + ')' : 'scale(' + sc.toFixed(3) + ')';
      if (dots[i]._sc !== tr){
        dots[i]._sc = tr; dots[i].style.transform = tr;
        dots[i].style.setProperty('--s', sc.toFixed(3));     /* el CSS lo usa para que la etiqueta no crezca */
      }
    }

    /* El orbe y la línea siguen a su círculo aunque la lente lo mueva */
    var oy = y + lensDisp(y), top = ys[0] + lensDisp(ys[0]);
    var os = amt < 0.001 ? 1 : (1 - amt) + lensScale(y) * amt;
    navOrb.style.transform = 'translate3d(0,' + oy.toFixed(2) + 'px,0)';
    navCore.style.transform = 'scale(' + (NAV.sx * os).toFixed(3) + ',' + (NAV.sy * os).toFixed(3) + ')';
    neonLineFill.style.top = top.toFixed(2) + 'px';
    neonLineFill.style.height = Math.max(0, oy - top).toFixed(2) + 'px';
    /* la guía gris también se estira con los extremos */
    navHost.style.setProperty('--rt', (lensDisp(ys[0])).toFixed(2) + 'px');
    navHost.style.setProperty('--rb', (-lensDisp(ys[n - 1])).toFixed(2) + 'px');
  }

  function dockLoop(){
    dock.cy  += (dock.cyT  - dock.cy)  * 0.30;
    dock.amt += (dock.amtT - dock.amt) * 0.20;
    var still = Math.abs(dock.cyT - dock.cy) < 0.3 && Math.abs(dock.amtT - dock.amt) < 0.004;
    if (still){ dock.cy = dock.cyT; dock.amt = dock.amtT; }
    renderNav();
    if (still && dock.amt === 0){ dock.raf = 0; return; }
    dock.raf = still ? 0 : requestAnimationFrame(dockLoop);
  }
  function dockKick(){ if (!dock.raf) dock.raf = requestAnimationFrame(dockLoop); }

  function ringAt(i){
    var d = dots[i]; if (!d || reduce) return;
    d.classList.remove('pulse'); void d.offsetWidth; d.classList.add('pulse');
    setTimeout(function(){ d.classList.remove('pulse'); }, 720);
  }

  function navFrame(){
    var p = clamp01((performance.now() - NAV.t0) / NAV.dur);
    var pm = easeInOut(clamp01((p - NAV.lead) / (0.80 - NAV.lead)));
    NAV.y = NAV.from + (NAV.to - NAV.from) * pm;

    if (p < 0.74){
      var c = easeInOut(clamp01(p / 0.26));
      NAV.sx = mix(NAV.sx0, THIN, c);
      NAV.sy = mix(NAV.sy0, NAV.sY, c);
    } else {
      var e = easeOutBack(clamp01((p - 0.74) / 0.26));
      NAV.sx = mix(THIN, 1, e);
      NAV.sy = mix(NAV.sY, 1, e);
    }
    if (!NAV.rippled && p >= 0.8){ NAV.rippled = true; ringAt(NAV.idx); }

    if (p >= 1){
      NAV.raf = 0; NAV.running = false;
      NAV.y = NAV.to; NAV.sx = NAV.sy = 1;
      renderNav();
      setTimeout(function(){ if (!NAV.running) navHost.classList.remove('traveling'); }, 120);
      return;
    }
    renderNav();
    NAV.raf = requestAnimationFrame(navFrame);
  }

  function placeNav(i){
    if (NAV.raf){ cancelAnimationFrame(NAV.raf); NAV.raf = 0; }
    measure();
    NAV.running = false; NAV.idx = i;
    navHost.classList.remove('traveling');
    NAV.y = NAV.from = NAV.to = ys[i];
    NAV.sx = NAV.sy = 1;
    dots.forEach(function(d, idx){
      reached[idx] = idx <= i;
      d.classList.toggle('is-reached', idx <= i);
    });
    renderNav();
  }

  function updateIndicator(prevIndex, nextIndex){
    if (!dots[nextIndex]) return;
    dots.forEach(function(d, idx){ d.classList.toggle('is-current', idx === nextIndex); });
    if (reduce){ placeNav(nextIndex); return; }
    measure();
    var to = ys[nextIndex];
    if (!NAV.running && Math.abs(to - NAV.y) < 0.5) return;

    var steps = Math.max(1, Math.round(Math.abs(to - NAV.y) / spacing()));
    NAV.from = NAV.y; NAV.to = to; NAV.idx = nextIndex;
    NAV.dur  = Math.min(920, 520 + 75 * (steps - 1));
    NAV.sY   = Math.min(2.0, 1.3 + 0.12 * steps);
    NAV.lead = NAV.running ? 0 : 0.12;
    NAV.sx0  = NAV.sx; NAV.sy0 = NAV.sy;
    NAV.t0   = performance.now(); NAV.rippled = false; NAV.running = true;
    navHost.classList.add('traveling');
    if (!NAV.raf) NAV.raf = requestAnimationFrame(navFrame);
  }

  window.__qvNav = { scaleOf: function(i){ return dockScale(NAV.y, i); }, render: renderNav };

  /* ---------- Cambio de sección ---------- */
  function moveWrap(){
    var unit = CSS.supports('height','100dvh') ? 'dvh' : 'vh';
    wrap.style.transform = 'translate3d(0,-' + (current * 100) + unit + ',0)';
  }

  function goTo(index){
    var next = ((index % total) + total) % total;
    if (isAnimating || next === current) return;
    isAnimating = true;

    sections[current].classList.remove('is-active');
    var prevIndex = current;
    current = next;
    sections[current].classList.add('is-active');

    moveWrap();
    updateIndicator(prevIndex, current);

    // Avisa a los demás archivos (logo/burbuja, órbita de canales, etc.)
    document.dispatchEvent(new CustomEvent('qv:seccion', {
      detail: { prev: prevIndex, next: current, total: total }
    }));

    hint.classList.toggle('hide', current !== 0);

    setTimeout(function(){ isAnimating = false; }, DUR);
  }

  /* ---------- Rueda del mouse ---------- */
  var wheelLock = false;
  window.addEventListener('wheel', function(e){
    if (Math.abs(e.deltaY) < 6) return;
    if (wheelLock || isAnimating) return;
    wheelLock = true;
    goTo(current + (e.deltaY > 0 ? 1 : -1));
    setTimeout(function(){ wheelLock = false; }, DUR + 40);
  }, { passive:true });

  /* ---------- Teclado ---------- */
  window.addEventListener('keydown', function(e){
    var k = e.key;
    if (k === 'ArrowDown' || k === 'PageDown' || k === ' '){ e.preventDefault(); goTo(current + 1); }
    else if (k === 'ArrowUp' || k === 'PageUp'){ e.preventDefault(); goTo(current - 1); }
    else if (k === 'Home'){ e.preventDefault(); goTo(0); }
  });

  /* ---------- Clic en los círculos de la navegación lateral ---------- */
  dots.forEach(function(d){
    d.addEventListener('click', function(){
      goTo(parseInt(d.getAttribute('data-index'), 10));
      d.blur();
    });
  });

  /* ---------- Botones con data-goto (número de sección o id de sección) ---------- */
  function sectionIndex(target){
    if (/^\d+$/.test(target)) return parseInt(target, 10);
    for (var i = 0; i < sections.length; i++){ if (sections[i].id === target) return i; }
    return -1;
  }
  Array.prototype.forEach.call(document.querySelectorAll('[data-goto]'), function(btn){
    btn.addEventListener('click', function(){
      var idx = sectionIndex(btn.getAttribute('data-goto'));
      if (idx >= 0) goTo(idx);
    });
  });

  /* ---------- Efecto dock: reacciona cuando el mouse se ACERCA a los círculos ---------- */
  if (!reduce && window.matchMedia('(hover:hover) and (pointer:fine)').matches){
    window.addEventListener('pointermove', function(e){
      if (e.pointerType && e.pointerType !== 'mouse') return;
      var r = navHost.getBoundingClientRect();
      var dx = Math.abs(e.clientX - (r.left + r.width / 2));
      var cy = e.clientY - r.top;                              /* mismas coordenadas que ys[] */
      var hz = dx <= LENS_CORE ? 1 : clamp01(1 - (dx - LENS_CORE) / (LENS_ZONE - LENS_CORE));
      hz = hz * hz * (3 - 2 * hz);                             /* entrada suave */
      var out = Math.max(0, ys[0] - cy, cy - ys[ys.length - 1]);
      var vz = clamp01(1 - out / 90);
      dock.amtT = hz * vz;
      dock.cyT = Math.min(ys[ys.length - 1] + 30, Math.max(ys[0] - 30, cy));
      if (dock.amt < 0.001 && dock.amtT > 0) dock.cy = dock.cyT;   /* al entrar, la lente nace bajo el cursor */
      dockKick();
    }, { passive:true });
    document.documentElement.addEventListener('mouseleave', function(){ dock.amtT = 0; dockKick(); });
    window.addEventListener('blur', function(){ dock.amtT = 0; dockKick(); });
  }

  /* ---------- Gesto de deslizar en pantallas táctiles ---------- */
  var touchY = null, touchX = null, scroller = null, startTop = true, startBottom = true;
  function scrollableParent(el){
    while (el && el !== document.body){
      if (el.scrollHeight > el.clientHeight + 2 && /(auto|scroll)/.test(getComputedStyle(el).overflowY)) return el;
      el = el.parentElement;
    }
    return null;
  }
  window.addEventListener('touchstart', function(e){
    var t = e.touches[0];
    touchY = t.clientY; touchX = t.clientX;
    /* Se anota si el contenido YA estaba en su borde al empezar el gesto:
       así un deslizamiento largo que solo hace scroll no cambia de sección por accidente. */
    scroller = scrollableParent(e.target);
    startTop    = !scroller || scroller.scrollTop <= 24;   /* margen: un desborde pequeño no atrapa al usuario */
    startBottom = !scroller || scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 24;
  }, { passive:true });
  window.addEventListener('touchend', function(e){
    if (touchY === null) return;
    var t = e.changedTouches[0];
    var dy = touchY - t.clientY, dx = touchX - t.clientX;
    touchY = touchX = null;
    if (Math.abs(dy) < 55 || Math.abs(dy) < Math.abs(dx) * 1.2) return;
    if (dy > 0 && !startBottom) return;   /* deslizó hacia abajo en contenido que aún tenía más por ver */
    if (dy < 0 && !startTop) return;
    goTo(current + (dy > 0 ? 1 : -1));
  }, { passive:true });

  /* ---------- Arranque: el orbe y la línea empiezan en el círculo actual ---------- */
  measure();
  placeNav(0);
  dots[0].classList.add('is-current');
  window.addEventListener('resize', function(){
    placeNav(current);
    dots.forEach(function(d, idx){ d.classList.toggle('is-current', idx === current); });
  });
})();
