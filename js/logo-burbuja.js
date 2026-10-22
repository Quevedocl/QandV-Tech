/* =====================================================
   Logo líquido (#genie) que se transforma en la burbuja de
   preguntas al bajar de sección, y vuelve a ser logo arriba.

   Obs: Escucha el evento "qv:seccion" que dispara navegacion.js.
   ===================================================== */

(function(){
  'use strict';

  var genie    = document.getElementById('genie');
  if (!genie) return;

  var total    = document.querySelectorAll('.sections-wrap .section').length;
  var reduce   = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var DUR      = reduce ? 80 : 580;

  var LOGO = '<img src="images/logo.jpg" alt="Q&V Tech">';

  // Si la imagen del logo no carga, se muestra el texto "Q&V"
  function bindLogoFallback(root){
    var img = root.querySelector('img');
    if (!img) return;
    function fallback(){
      var s = document.createElement('span');
      s.className = 'genie-fallback';
      s.textContent = 'Q&V';
      img.replaceWith(s);
    }
    if (img.complete && img.naturalWidth === 0) fallback();
    else img.addEventListener('error', fallback, { once:true });
  }

  var preguntas = [
    '',
    '¿Por qué pasarme a NFC?',
    '¿Cómo funciona?',
    '¿Qué incluye mi perfil?',
    '¿Qué canales puedo mostrar?',
    '¿Qué dicen nuestros clientes?',
    'Preguntas frecuentes',
    '¿Y si me queda una duda?',
    '¿Conversamos?'
  ];

  var logoFx = null;

  function cleanupForming(){
    genie.classList.remove('forming');
    genie.style.removeProperty('--fw');
    genie.style.removeProperty('--fh');
    document.querySelectorAll('.logo-ripple').forEach(function(r){ r.remove(); });
  }

  function cancelLogoLiquid(){
    cleanupForming();
    if (!logoFx) return;
    cancelAnimationFrame(logoFx.raf);
    logoFx.box.remove();
    logoFx = null;
    genie.style.transition = '';
    void genie.offsetWidth;
    genie.style.opacity = '1';
  }

  function logoLiquidDown(rect, drop){
    if (reduce || (!rect && !drop)) return;

    var SVGNS = 'http://www.w3.org/2000/svg';
    var fin = genie.getBoundingClientRect();
    var pw = fin.width, ph = fin.height;
    var x0 = drop ? fin.left : rect.left, w0 = drop ? ph : rect.width, h0 = drop ? ph : rect.height, y0 = drop ? 30 : rect.top;
    var yEnd = fin.top;
    var LIQ_D = 230;
    var C1 = [15, 61, 30];
    var C0 = drop ? C1 : [30, 78, 56];

    var box = document.createElement('div');
    box.className = 'logo-liquid';
    var svg = document.createElementNS(SVGNS, 'svg');
    var path = document.createElementNS(SVGNS, 'path');
    svg.appendChild(path);
    var head = document.createElement('div');
    head.className = 'logo-liquid-head';
    head.innerHTML = drop ? '' : LOGO;
    bindLogoFallback(head);
    var headImg = head.querySelector('img');
    box.appendChild(svg);
    box.appendChild(head);
    document.body.appendChild(box);

    var S = { y:y0, v:0, ty:y0, tv:0, last:performance.now(), raf:0, box:box, born:performance.now() };
    logoFx = S;
    var KH = 115, CH = 21, KT = 48, CT = 9;

    function lerp(a, b, t){ return a + (b - a) * t; }
    function circle(cx, cy, r){
      return 'M' + (cx - r) + ' ' + cy + 'a' + r + ' ' + r + ' 0 1 0 ' + (2*r) + ' 0a' + r + ' ' + r + ' 0 1 0 ' + (-2*r) + ' 0Z';
    }
    function liquid(cx, y1, r1, y2, r2){
      var up = y1 <= y2;
      var yt = up ? y1 : y2, yb = up ? y2 : y1, rt = up ? r1 : r2, rb = up ? r2 : r1;
      var d = yb - yt;
      if (d < 0.8) return '';
      if (d >= LIQ_D) return circle(cx, y1, r1) + circle(cx, y2, r2);
      var wN = ((rt + rb) / 2) * Math.pow(1 - d / LIQ_D, 1.35);
      var ym = (yt + yb) / 2, k = d * 0.38, e = d * 0.16;
      var L = cx - rt, Rr = cx + rt, L2 = cx - rb, R2 = cx + rb, nl = cx - wN, nr = cx + wN;
      return 'M' + L + ' ' + yt +
        'A' + rt + ' ' + rt + ' 0 0 1 ' + Rr + ' ' + yt +
        'C' + Rr + ' ' + (yt + k) + ' ' + nr + ' ' + (ym - e) + ' ' + nr + ' ' + ym +
        'C' + nr + ' ' + (ym + e) + ' ' + R2 + ' ' + (yb - k) + ' ' + R2 + ' ' + yb +
        'A' + rb + ' ' + rb + ' 0 0 1 ' + L2 + ' ' + yb +
        'C' + L2 + ' ' + (yb - k) + ' ' + nl + ' ' + (ym + e) + ' ' + nl + ' ' + ym +
        'C' + nl + ' ' + (ym - e) + ' ' + L + ' ' + (yt + k) + ' ' + L + ' ' + yt + 'Z';
    }

    function render(){
      var m = Math.max(0, Math.min((S.y - y0) / Math.max(60, Math.min(110, (yEnd - y0) * 0.25)), 1));
      var curW = lerp(w0, ph, m), curH = lerp(h0, ph, m);
      var col = 'rgb(' + Math.round(lerp(C0[0], C1[0], m)) + ',' + Math.round(lerp(C0[1], C1[1], m)) + ',' + Math.round(lerp(C0[2], C1[2], m)) + ')';
      var speed = Math.min(Math.abs(S.v) / 1400, 1);
      var st = 1 + speed * 0.16;
      var ap = 1;
      if (drop){ ap = Math.min((performance.now() - S.born) / 260, 1); ap = 1 - Math.pow(1 - ap, 3); }

      head.style.width = curW.toFixed(1) + 'px';
      head.style.height = curH.toFixed(1) + 'px';
      head.style.borderRadius = lerp(drop ? ph / 2 : 12, ph / 2, m).toFixed(1) + 'px';
      head.style.background = col;
      head.style.transform = 'translate3d(' + x0 + 'px,' + S.y.toFixed(2) + 'px,0) scale(' + (ap/Math.sqrt(st)).toFixed(3) + ',' + (ap*st).toFixed(3) + ')';
      if (headImg) headImg.style.opacity = Math.max(0, 1 - m * 1.7).toFixed(2);

      var cx = x0 + curW / 2, R = (Math.min(curW, curH) / 2 - 1) * ap;
      var hc = S.y + curH / 2, tc = S.ty + curH / 2;
      var rTail = R * (1 - 0.55 * Math.min(Math.abs(hc - tc) / LIQ_D, 1));
      path.style.fill = col;
      path.setAttribute('d', liquid(cx, hc, R, tc, rTail));
    }

    function form(){
      S.raf = 0;
      genie.style.setProperty('--fw', pw + 'px');
      genie.style.setProperty('--fh', ph + 'px');
      genie.style.transition = 'none';
      genie.classList.add('forming');
      genie.style.opacity = '1';
      void genie.offsetWidth;
      box.remove();
      genie.style.transition = '';
      logoFx = null;

      [ { w: ph, h: ph, r: ph / 2, delay: 0 },
        { w: pw, h: ph, r: '36px 36px 36px 10px', delay: 520 } ].forEach(function(o){
        var rp = document.createElement('div');
        rp.className = 'logo-ripple';
        rp.style.cssText = 'left:' + fin.left + 'px;top:' + fin.top + 'px;width:' + o.w + 'px;height:' + o.h + 'px;border-radius:' + (typeof o.r === 'number' ? o.r + 'px' : o.r) + ';animation-delay:' + o.delay + 'ms;';
        document.body.appendChild(rp);
        setTimeout(function(){ rp.remove(); }, o.delay + 900);
      });
      setTimeout(cleanupForming, 1100);
    }

    function frame(ts){
      var dt = Math.max(0, Math.min((ts - S.last) / 1000, 0.1));
      S.last = ts;
      var n = Math.max(3, Math.ceil(dt * 240)), hh = dt / n;
      for (var i = 0; i < n; i++){
        S.v  += (KH * (yEnd - S.y) - CH * S.v) * hh;  S.y  += S.v * hh;
        S.tv += (KT * (S.y - S.ty) - CT * S.tv) * hh; S.ty += S.tv * hh;
      }
      render();
      var calm = Math.abs(yEnd - S.y) < 1.2 && Math.abs(S.v) < 18 &&
                 Math.abs(S.y - S.ty) < 6 && Math.abs(S.tv) < 55;
      if (calm){ S.y = S.ty = yEnd; render(); form(); return; }
      S.raf = requestAnimationFrame(frame);
    }
    render();
    S.raf = requestAnimationFrame(frame);
  }

  function ghostOutGenie(){
    var r = genie.getBoundingClientRect();
    if (!r.width) return;
    var g = genie.cloneNode(true);
    g.removeAttribute('id');
    g.className = genie.className.replace(/\b(forming|aladdin-travel)\b/g, '').replace(/\s+/g, ' ').trim() + ' genie-ghost';
    g.style.cssText = 'position:fixed;left:' + r.left + 'px;top:' + r.top + 'px;width:' + r.width + 'px;height:' + r.height +
                      'px;bottom:auto;margin:0;transform:none;transition:none;box-sizing:border-box;';
    document.body.appendChild(g);
    setTimeout(function(){ g.remove(); }, 400);
  }

  function updateGeniePosition(prevIndex, nextIndex){
    cancelLogoLiquid();
    var isDrop = !reduce && prevIndex !== nextIndex && prevIndex >= 1 && nextIndex >= 1 && nextIndex <= total - 2;
    if (isDrop) ghostOutGenie();
    var startRect = (prevIndex === 0 && nextIndex === 1 && !reduce) ? genie.getBoundingClientRect() : null;
    if (startRect || isDrop){ genie.style.transition = 'none'; genie.style.opacity = '0'; }
    genie.classList.remove('reveal-wa');
    genie.classList.toggle('ask', nextIndex > 0);
    genie.classList.toggle('contact', nextIndex === total - 1);
    genie.classList.toggle('is-logo', nextIndex === 0);

    if (!startRect && !isDrop) {
      var isCrossingHome = (prevIndex === 0 || nextIndex === 0);
      if (isCrossingHome && !reduce) {
        genie.classList.remove('aladdin-travel');
        void genie.offsetWidth;
        genie.classList.add('aladdin-travel');
        setTimeout(function(){
          genie.classList.remove('aladdin-travel');
        }, DUR);
      }
    }

    if (nextIndex === 0) {
      genie.style.left = '48px';
      genie.style.top = '30px';
      genie.style.bottom = 'auto';
      genie.style.transform = 'none';
      genie.innerHTML = LOGO;
      bindLogoFallback(genie);
    } else if (nextIndex < total - 1) {
      genie.style.left = '48px';
      genie.style.top = 'auto';
      genie.style.bottom = window.innerWidth > 900 ? '46px' : '24px';
      genie.style.transform = 'none';
      genie.innerHTML = '<span class="q-mark">?</span><span class="genie-text">' + preguntas[nextIndex] + '</span>';
    } else if (nextIndex === total - 1) {
      genie.style.left = '50%';
      genie.style.top = 'auto';
      genie.style.bottom = window.innerWidth > 900 ? '46px' : '24px';
      genie.style.transform = 'translateX(-50%)';
      genie.innerHTML = '<span class="q-mark">?</span><span class="genie-text">' + preguntas[nextIndex] + '</span>';
    } else {
      genie.style.left = '48px';
      genie.style.top = '50%';
      genie.style.bottom = 'auto';
      genie.style.transform = 'translateY(-50%)';
      genie.innerHTML = '<span class="q-mark">?</span><span class="genie-text">' + preguntas[nextIndex] + '</span>';
    }

    if (startRect) logoLiquidDown(startRect);
    else if (isDrop) logoLiquidDown(null, true);
  }

  // Reacciona cada vez que navegacion.js cambia de sección
  document.addEventListener('qv:seccion', function(e){
    updateGeniePosition(e.detail.prev, e.detail.next);
  });

  bindLogoFallback(genie);
})();
