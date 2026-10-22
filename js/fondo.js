/* =====================================================
   Fondo animado de rayas/puntos que se mueven.

   Corrige los "saltos" y los huecos del fondo:
   - Cada fila tiene dos mitades IDÉNTICAS y el espacio entre piezas va
     DENTRO de la mitad (padding-right), así el desplazamiento de -50% cae
     exacto y el bucle no da tirones.
   - La cantidad de piezas se calcula según el tamaño real de la pantalla
     (diagonal), así nunca quedan huecos en pantallas anchas o verticales.
   - Se reconstruye solo si la pantalla crece de verdad (no con la barra
     del navegador del celular).
   ===================================================== */
(function(){
  var host = document.getElementById('streaks');
  if (!host) return;

  var styles = ['solid','pale','line','solid','dark','pale','dot','solid','pale','line'];
  var widths = [28,15,36,10,22,46,13,18,32,18,40,9,26,16,52,12];   /* en vmin */
  var speeds = [78,60,94,52,72,63,88];                              /* px por segundo */
  var builtDiag = 0, timer;

  function build(){
    var w = window.innerWidth, h = window.innerHeight;
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
        var bw = kind === 'dot' ? Math.max(42, 5.5 * vmax) : widths[(i + r * 5) % widths.length] * vmin;
        if (kind !== 'dot') bar.style.width = bw + 'px';
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
      var d = Math.sqrt(window.innerWidth * window.innerWidth + window.innerHeight * window.innerHeight);
      if (d > builtDiag * 1.02 || d < builtDiag * 0.7) build();
    }, 250);
  });
})();
