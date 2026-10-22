/* =====================================================
   Fondo animado de rayas/puntos que se mueven.
   ===================================================== */

(function(){
  var host = document.getElementById('streaks');
  if (!host) return;

  var styles = ['solid','pale','line','solid','dark','pale','dot','solid','pale','line'];
  var widths = [28,15,36,10,22,46,13,1,32,18,40,9,26,16,52,12];

  for (var r = 0; r < 7; r++){
    var track = document.createElement('div');
    track.className = 'track t' + (r + 1);

    var half = document.createElement('span');
    half.style.display = 'flex';
    half.style.alignItems = 'center';
    half.style.gap = '3.5vmax';

    for (var i = 0; i < 12; i++){
      var bar = document.createElement('i');
      var kind = styles[(i + r * 3) % styles.length];
      bar.className = kind;
      if (kind !== 'dot'){
        bar.style.width = widths[(i + r * 5) % widths.length] + 'vmin';
      }
      half.appendChild(bar);
    }
    track.appendChild(half);
    track.appendChild(half.cloneNode(true));
    track.style.animationDelay = (-r * 5) + 's';
    host.appendChild(track);
  }
})();
