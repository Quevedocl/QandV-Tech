/* =====================================================
   Efectos varios de las secciones:
   - año del pie de página
   - efectos de puntero que usa el CSS (--mx/--my, --gx/--gy, --tx/--ty)
   - imágenes de canales que se ocultan si no cargan
   - pausa/reanuda la órbita de canales según la sección visible
     (escucha el evento "qv:seccion" de navegacion.js)
   ===================================================== */

(function(){
  'use strict';

  var sections = document.querySelectorAll('.sections-wrap .section');
  var reduce   = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Año del pie de página ---------- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Órbita de canales: solo anima cuando su sección está visible ---------- */
  function toggleOrbit(index){
    var o = document.querySelector('.ch-orbit');
    if (!o || !o.pauseAnimations) return;
    if (sections[index] && sections[index].classList.contains('sec-channels')) o.unpauseAnimations();
    else o.pauseAnimations();
  }
  toggleOrbit(0);
  document.addEventListener('qv:seccion', function(e){ toggleOrbit(e.detail.next); });

  /* ---------- Efecto de luz que sigue al puntero en las tarjetas ---------- */
  Array.prototype.forEach.call(document.querySelectorAll('.card'), function(c){
    c.addEventListener('pointermove', function(e){
      var r = c.getBoundingClientRect();
      c.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      c.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  /* ---------- Brillo de los íconos de canales ---------- */
  Array.prototype.forEach.call(document.querySelectorAll('.ch-tile'), function(t){
    t.addEventListener('pointermove', function(e){
      var r = t.getBoundingClientRect();
      t.style.setProperty('--gx', (e.clientX - r.left) + 'px');
      t.style.setProperty('--gy', (e.clientY - r.top) + 'px');
    });
    t.addEventListener('pointerleave', function(){
      t.style.removeProperty('--gx'); t.style.removeProperty('--gy');
    });
  });

  /* ---------- Paralaje del escenario de canales ---------- */
  var chStage = document.querySelector('.ch-stage');
  if (chStage && !reduce){
    chStage.addEventListener('pointermove', function(e){
      var r = chStage.getBoundingClientRect();
      chStage.style.setProperty('--tx', (((e.clientX - r.left) / r.width - .5) * 2).toFixed(3));
      chStage.style.setProperty('--ty', (((e.clientY - r.top) / r.height - .5) * 2).toFixed(3));
    });
    chStage.addEventListener('pointerleave', function(){
      chStage.style.setProperty('--tx', 0); chStage.style.setProperty('--ty', 0);
    });
  }

  /* ---------- Si la imagen de un canal no carga, se oculta ---------- */
  Array.prototype.forEach.call(document.querySelectorAll('.ch-ico img'), function(img){
    function hide(){ img.style.display = 'none'; }
    if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) hide();
    else img.addEventListener('error', hide, { once:true });
  });
})();
