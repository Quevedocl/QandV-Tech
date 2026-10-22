/* =====================================================
   Fondo animado de rayas/puntos que se mueven.

   Corrige los "saltos" y los huecos del fondo:
   - Cada fila tiene dos mitades IDÉNTICAS y el espacio entre piezas va
     DENTRO de la mitad (padding-right), así el desplazamiento de -50% cae
     exacto y el bucle no da tirones.
   - La cantidad de piezas se calcula según el tamaño real de la pantalla
     (diagonal), así nunca quedan huecos en pantallas anchas o verticales.
   - En el celular NO se reconstruye cuando aparece/desaparece la barra del
     navegador (iPhone/Android): antes eso reiniciaba todo el fondo y se veía
     como un parpadeo. Se usa el tamaño real de la pantalla, que no cambia.
   ===================================================== */
(function(){
  var host = document.getElementById('streaks');
  if (!host) return;

  var styles = ['solid','pale','line','solid','dark','pale','dot','solid','pale','line'];
  var widths = [28,15,36,10,22,46,13,18,32,18,40,9,26,16,52,12];   /* en vmin */
  var speeds = [78,60,94,52,72,63,88];                              /* px por segundo */
  var builtDiag = 0, timer;
  var coarse = window.matchMedia && window.matchMedia('(pointer:coarse)').matches;

  /* Tamaño de referencia: en pantallas táctiles, el de la pantalla completa (estable aunque la barra
     del navegador suba o baje); en computador, el de la ventana. */
  function viewport(){
    var w = window.innerWidth, h = window.innerHeight;
    if (coarse && window.screen){
      var a = Math.max(screen.width || 0, screen.height || 0), b = Math.min(screen.width || 0, screen.height || 0);
      if (a && b){
        if (w <= h){ w = Math.max(w, b); h = Math.max(h, a); } else { w = Math.max(w, a); h = Math.max(h, b); }
      }
    }
    return { w: w, h: h };
  }

  function build(){
    var vp = viewport(), w = vp.w, h = vp.h;
    var vmin = Math.min(w, h) / 100, vmax = Math.max(w, h) / 100;
    var diag = Math.sqrt(w * w + h * h);
    var barH = Math.max(42, 5.5 * vmax), gap = 3.5 * vmax;
    var need = diag * 1.15;                    /* ancho mínimo de cada mitad */
    var rows = Math.max(7, Math.ceil(need / (barH + gap)) + 1);
    builtDiag = diag;

    host.style.width = need + 'px';
    host.style.height = need + 'px';
    host.style.gap = gap + 'px';
    host.textContent = '';

    var frag = document.createDocumentFragment();
    for (var r = 0; r < rows; r++){
      var track = document.createElement('div');
      track.className = 'track';

      var half = document.createElement('span');
      half.className = 'half';
      half.style.paddingRight = gap + 'px';
      half.style.gap = gap + 'px';

      var total = 0, i = 0;
      while (total < need){
        var kind = styles[(i + r * 3) % styles.length];
        var bar = document.createElement('i');
        bar.className = kind;
        var bw = kind === 'dot' ? barH : widths[(i + r * 5) % widths.length] * vmin;
        /* medidas en px fijos: así no cambian cuando el navegador del celular redimensiona la ventana */
        bar.style.width = bw + 'px';
        bar.style.height = barH + 'px';
        half.appendChild(bar);
        total += bw + gap; i++;
      }
      track.appendChild(half);
      track.appendChild(half.cloneNode(true));

      /* velocidad constante en px/s sin importar el tamaño de pantalla */
      track.style.animationDuration = (total / speeds[r % speeds.length]).toFixed(1) + 's';
      track.style.animationDelay = (-(r * 5.3) % (total / speeds[r % speeds.length])).toFixed(1) + 's';
      frag.appendChild(track);
    }
    host.appendChild(frag);
  }

  build();
  window.addEventListener('resize', function(){
    clearTimeout(timer);
    timer = setTimeout(function(){
      var vp = viewport(), d = Math.sqrt(vp.w * vp.w + vp.h * vp.h);
      if (d > builtDiag * 1.02 || d < builtDiag * 0.7) build();
    }, 250);
  });
})();
