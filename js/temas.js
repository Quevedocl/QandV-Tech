/* =====================================================
   TEMAS DE FESTIVIDAD (Halloween, Navidad, Año Nuevo, Fiestas Patrias)

   - El tema se elige en el panel admin y se guarda en Supabase (tabla site_config),
     así lo ven todos los visitantes sin subir archivos.
   - Modo "auto": se enciende solo en las fechas de cada festividad.
   - Modo manual: tú eliges uno (o "Normal" para apagarlo).
   - Vista previa privada: index.html?tema=navidad (no cambia nada para los demás).
   - Solo suma detalles (colores de acento, adornos, un cartelito): la estructura,
     el logo y la tarjeta NFC no cambian. Los estilos están en css/40-temas.css.
   ===================================================== */
(function (w, d) {
  'use strict';
  var KEY = 'qv_tema_cfg';
  var TEMAS = {
    halloween: { nombre: 'Halloween', pill: '🎃 Feliz Halloween', eyebrow: '🎃 Especial Halloween', desde: '10-24', hasta: '11-01' },
    navidad: { nombre: 'Navidad', pill: '🎄 Feliz Navidad', eyebrow: '🎄 Especial Navidad', desde: '12-01', hasta: '12-26' },
    'anio-nuevo': { nombre: 'Año Nuevo', pill: '🎆 Feliz Año Nuevo', eyebrow: '🎆 Especial Año Nuevo', desde: '12-27', hasta: '01-03' },
    'fiestas-patrias': { nombre: 'Fiestas Patrias', pill: '★ Felices Fiestas Patrias', eyebrow: '★ Especial Fiestas Patrias', desde: '09-10', hasta: '09-20' }
  };

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function dentro(t, f) {
    var md = pad(f.getMonth() + 1) + '-' + pad(f.getDate());
    return t.desde <= t.hasta ? (md >= t.desde && md <= t.hasta) : (md >= t.desde || md <= t.hasta);
  }
  /* cfg: {modo:'auto'} | {modo:'manual', tema:'halloween'|'normal'}  →  id del tema a mostrar */
  function resolver(cfg, f) {
    cfg = cfg || {};
    if (cfg.modo === 'manual') return TEMAS[cfg.tema] ? cfg.tema : 'normal';
    if (cfg.modo === 'auto') {
      for (var id in TEMAS) if (dentro(TEMAS[id], f || new Date())) return id;
    }
    return 'normal';
  }
  w.QVTemas = { lista: TEMAS, resolver: resolver };

  var html = d.documentElement;
  if (html.hasAttribute('data-temas-off')) return;      /* el panel admin solo usa la lista */

  function leerCache() { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; } }
  function guardarCache(c) { try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) {} }
  var preview = (location.search.match(/[?&]tema=([a-z-]+)/) || [])[1];
  var actual = null, eyebrowOriginal = null;

  /* ---------- adornos ---------- */
  var reduce = w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  var DECOR = {
    halloween: [
      { n: 6, tipo: 'fly', g: ['🦇'], s: [20, 34], d: [14, 26] },
      { n: 5, tipo: 'rise', g: ['👻', '🎃', '🕷️'], s: [22, 34], d: [22, 38] }
    ],
    navidad: [
      { n: 20, tipo: 'fall', g: ['❄'], c: ['#9cc7e8', '#7fb4dc', '#b9d9ef'], s: [12, 26], d: [9, 18] },
      { n: 3, tipo: 'fall', g: ['🎄'], s: [22, 28], d: [16, 24] }
    ],
    'anio-nuevo': [
      { n: 22, tipo: 'fall', g: ['●', '■', '✦', '★'], c: ['#e0b100', '#f2c94c', '#c9a227', '#7a8794', '#d6b3ff'], s: [9, 18], d: [8, 16] }
    ],
    'fiestas-patrias': [
      { n: 22, tipo: 'fall', g: ['●', '■', '★'], c: ['#d52b1e', '#0039a6', '#e8eefc', '#d52b1e', '#0039a6'], s: [9, 18], d: [8, 16] }
    ]
  };
  var layer = null, pill = null, pillTimer = 0;
  function quitar() {
    if (layer) { layer.remove(); layer = null; }
    if (pill) { pill.remove(); pill = null; clearTimeout(pillTimer); }
    var e = d.querySelector('.eyebrow');
    if (e && eyebrowOriginal !== null) e.textContent = eyebrowOriginal;
  }
  function montar(id) {
    quitar();
    var T = TEMAS[id]; if (!T || !d.body) return;
    var movil = w.innerWidth < 720, esc = movil ? 0.55 : 1;

    var e = d.querySelector('.eyebrow');
    if (e) { if (eyebrowOriginal === null) eyebrowOriginal = e.textContent; e.textContent = T.eyebrow; }

    pill = d.createElement('div'); pill.className = 'qv-tema-pill'; pill.textContent = T.pill; pill.setAttribute('aria-hidden', 'true');
    d.body.appendChild(pill);
    pillTimer = setTimeout(function () { if (pill) pill.classList.add('out'); }, 7000);

    if (reduce) return;
    layer = d.createElement('div'); layer.className = 'qv-tema-layer'; layer.setAttribute('aria-hidden', 'true');
    (DECOR[id] || []).forEach(function (g) {
      var n = Math.max(2, Math.round(g.n * esc));
      for (var i = 0; i < n; i++) {
        var p = d.createElement('span'), dur = rnd(g.d[0], g.d[1]);
        p.className = 'qv-p ' + g.tipo;
        p.textContent = pick(g.g);
        p.style.setProperty('--x', rnd(0, 100).toFixed(1) + '%');
        p.style.setProperty('--y', rnd(6, 80).toFixed(1) + '%');
        p.style.setProperty('--s', rnd(g.s[0], g.s[1]).toFixed(0) + 'px');
        p.style.setProperty('--d', dur.toFixed(1) + 's');
        p.style.setProperty('--dl', (-rnd(0, dur)).toFixed(1) + 's');
        p.style.setProperty('--dr', rnd(-12, 12).toFixed(1) + 'vw');
        p.style.setProperty('--dy', rnd(-14, 14).toFixed(1) + 'vh');
        p.style.setProperty('--rot', rnd(-360, 360).toFixed(0) + 'deg');
        if (g.c) p.style.color = pick(g.c);
        layer.appendChild(p);
      }
    });
    d.body.appendChild(layer);
  }

  function aplicar(id) {
    if (id === actual) return;
    actual = id;
    if (id === 'normal') html.removeAttribute('data-tema'); else html.setAttribute('data-tema', id);
    if (d.body) montar(id === 'normal' ? '' : id);
  }

  /* ---------- 1) al instante, con lo último que se guardó (evita parpadeo) ---------- */
  aplicar(preview && (TEMAS[preview] || preview === 'normal') ? preview : resolver(leerCache()));
  if (!d.body) d.addEventListener('DOMContentLoaded', function () { var a = actual; actual = null; aplicar(a); });

  /* ---------- 2) y se actualiza con lo que diga Supabase ---------- */
  if (preview) return;                                   /* en vista previa no se consulta nada */
  var C = w.QV_CONFIG || {};
  if (!C.SUPABASE_URL || !C.SUPABASE_ANON_KEY || !w.fetch) return;
  var ctl = w.AbortController ? new AbortController() : null, to = setTimeout(function () { ctl && ctl.abort(); }, 5000);
  fetch(C.SUPABASE_URL.replace(/\/+$/, '') + '/rest/v1/site_config?select=value&key=eq.tema&limit=1', { headers: { apikey: C.SUPABASE_ANON_KEY }, signal: ctl ? ctl.signal : undefined })
    .then(function (r) { if (!r.ok) throw 0; return r.json(); })
    .then(function (a) {
      clearTimeout(to);
      var cfg = (a[0] && a[0].value) || { modo: 'normal' };
      guardarCache(cfg); aplicar(resolver(cfg));
    })
    .catch(function () { clearTimeout(to); });
})(window, document);
