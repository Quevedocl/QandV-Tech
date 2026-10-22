/* Evita el zoom por doble toque / pellizco cuando la página se usa como app instalada */
(function(){
  'use strict';
  var last = 0;
  document.addEventListener('touchend', function(e){
    var now = Date.now();
    if (now - last < 350 && e.cancelable) e.preventDefault();   /* 2º toque rápido: no hace zoom (los clics siguen funcionando) */
    last = now;
  }, { passive:false });
  ['gesturestart','gesturechange','gestureend'].forEach(function(n){
    document.addEventListener(n, function(e){ e.preventDefault(); });
  });
  document.addEventListener('dblclick', function(e){ e.preventDefault(); }, { passive:false });
})();
