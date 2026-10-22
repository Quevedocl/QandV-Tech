/* =====================================================
   Ajustes SOLO para celular vertical (≤720px):
   - Preguntas frecuentes en acordeón (toca una pregunta para ver la respuesta)
   - Puntos indicadores del carrusel de reseñas
   En computador y tablet este archivo no hace nada: sale apenas detecta
   que la pantalla no es de celular, y el CSS móvil tampoco se aplica ahí.
   ===================================================== */
(function(){
  'use strict';

  var mq = window.matchMedia('(max-width:720px) and (orientation:portrait)');
  var iniciado = false;

  function iniciar(){
    if (iniciado) return;
    iniciado = true;

    /* ---------- FAQ: acordeón (una respuesta abierta a la vez) ---------- */
    var cards = Array.prototype.slice.call(document.querySelectorAll('.sec-faq .card'));
    function abrir(card, abrirla){
      card.classList.toggle('is-open', abrirla);
      card.setAttribute('aria-expanded', abrirla ? 'true' : 'false');
    }
    cards.forEach(function(card, i){
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      abrir(card, i === 0);                       /* la primera viene abierta */
      function alternar(){
        var estaba = card.classList.contains('is-open');
        cards.forEach(function(c){ abrir(c, false); });
        abrir(card, !estaba);
      }
      card.addEventListener('click', alternar);
      card.addEventListener('keydown', function(e){
        if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); alternar(); }
      });
    });

    /* ---------- Reseñas: puntos del carrusel ---------- */
    var grid = document.querySelector('.sec-reviews .grid');
    var items = grid ? grid.querySelectorAll('.review-card') : [];
    if (grid && items.length > 1 && !document.querySelector('.rv-dots')){
      var dots = document.createElement('div');
      dots.className = 'rv-dots';
      dots.setAttribute('aria-hidden', 'true');
      for (var i = 0; i < items.length; i++){
        dots.appendChild(document.createElement('i'));
      }
      var hint = document.createElement('small');
      hint.className = 'rv-hint';
      hint.textContent = 'Desliza hacia el lado para ver más';
      grid.parentNode.insertBefore(dots, grid.nextSibling);
      grid.parentNode.insertBefore(hint, dots.nextSibling);

      var marcas = dots.children;
      function actualizar(){
        var paso = items[1].offsetLeft - items[0].offsetLeft || 1;
        var idx = Math.round(grid.scrollLeft / paso);
        idx = Math.max(0, Math.min(items.length - 1, idx));
        for (var k = 0; k < marcas.length; k++){
          marcas[k].classList.toggle('on', k === idx);
        }
      }
      grid.addEventListener('scroll', actualizar, { passive: true });
      actualizar();
    }
  }

  if (mq.matches) iniciar();
  var cambio = function(e){ if (e.matches) iniciar(); };
  if (mq.addEventListener) mq.addEventListener('change', cambio);
  else if (mq.addListener) mq.addListener(cambio);
})();
