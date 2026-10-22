/* =====================================================
   NÚCLEO COMPARTIDO: enlaces, horarios y utilidades.
   Lo usan la página del cliente y el panel maestro.
   ===================================================== */
(function (w) {
  var QV = w.QV = w.QV || {};

  QV.DIAS = [
    { k: 'lun', n: 'Lunes' }, { k: 'mar', n: 'Martes' }, { k: 'mie', n: 'Miércoles' },
    { k: 'jue', n: 'Jueves' }, { k: 'vie', n: 'Viernes' }, { k: 'sab', n: 'Sábado' }, { k: 'dom', n: 'Domingo' }
  ];
  var IDX = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'];
  var NOMBRE = {}; QV.DIAS.forEach(function (d) { NOMBRE[d.k] = d.n.toLowerCase(); });

  QV.horariosBase = function () {
    var o = {};
    QV.DIAS.forEach(function (d) { o[d.k] = { abierto: false, desde: '09:00', hasta: '18:00' }; });
    ['lun', 'mar', 'mie', 'jue', 'vie'].forEach(function (k) { o[k].abierto = true; });
    o.sab = { abierto: true, desde: '10:00', hasta: '14:00' };
    return o;
  };

  QV.slugify = function (s) {
    return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
  };

  /* ---------- DOM helpers ---------- */
  QV.h = function (tag, attrs, kids) {
    var e = document.createElement(tag), k, v;
    for (k in (attrs || {})) {
      v = attrs[k];
      if (v == null || v === false) continue;
      if (k === 'class') e.className = v;
      else if (k === 'text') e.textContent = v;
      else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v === true ? '' : v);
    }
    (kids || []).forEach(function (c) {
      if (c == null || c === false) return;
      e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return e;
  };
  QV.svg = function (html) {
    var t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild;
  };

  /* ---------- Normalización de enlaces ---------- */
  function soloHttp(u) {
    try { var x = new URL(u); return /^https?:$/.test(x.protocol) ? x.href : ''; } catch (e) { return ''; }
  }
  function conProtocolo(u) {
    u = (u || '').trim(); if (!u) return '';
    return soloHttp(/^[a-z][a-z0-9+.-]*:/i.test(u) ? u : 'https://' + u);
  }
  function usuario(v) {
    v = (v || '').trim().replace(/^@/, '').replace(/\/+$/, '');
    return v.split('/').pop().split('?')[0].replace(/^@/, '');
  }
  QV.numero = function (v) {           // solo dígitos, con código de país (Chile por defecto)
    var d = (v || '').replace(/\D/g, '');
    if (!d) return '';
    if (d.length === 9) d = '56' + d;
    return d;
  };

  var ICONOS = {
    telefono: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h3.2l1.6 4.2-2 1.3a11 11 0 0 0 5.7 5.7l1.3-2L19 14.8V18a2 2 0 0 1-2 2A13 13 0 0 1 3 6a2 2 0 0 1 2-2Z"/></svg>',
    web: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.4 4 5.5 4 9s-1.4 6.6-4 9c-2.6-2.4-4-5.5-4-9s1.4-6.6 4-9Z"/></svg>',
    correo: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m3.8 7 8.2 6.2L20.2 7"/></svg>'
  };

  /* Devuelve la lista de canales que ese cliente realmente usa */
  QV.enlaces = function (c) {
    var out = [], v, href;
    function add(id, nombre, sub, href, img) {
      if (!href) return;
      out.push({ id: id, nombre: nombre, sub: sub, href: href, img: img || '', svg: img ? '' : ICONOS[id] });
    }
    if ((v = QV.numero(c.whatsapp)))
      add('whatsapp', 'WhatsApp', 'Chatea', 'https://wa.me/' + v + (c.whatsapp_mensaje ? '?text=' + encodeURIComponent(c.whatsapp_mensaje) : ''), 'WhatsApp.png');
    if ((v = (c.instagram || '').trim()))
      add('instagram', 'Instagram', 'Síguenos', /instagram\.com/i.test(v) ? conProtocolo(v) : 'https://instagram.com/' + usuario(v), 'Instagram.png');
    if ((v = (c.facebook || '').trim()))
      add('facebook', 'Facebook', 'Comunidad', /(facebook|fb)\.com/i.test(v) ? conProtocolo(v) : 'https://facebook.com/' + usuario(v), 'Facebook.png');
    if ((v = (c.tiktok || '').trim()))
      add('tiktok', 'TikTok', 'Videos', /tiktok\.com/i.test(v) ? conProtocolo(v) : 'https://www.tiktok.com/@' + usuario(v), 'Tiktok.png');
    if ((v = QV.numero(c.telefono)))
      add('telefono', 'Teléfono', 'Llamar', 'tel:+' + v);
    href = conProtocolo(c.maps_url) || ((c.direccion || '').trim() ? 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(c.direccion.trim()) : '');
    add('maps', 'Ubicación', 'Cómo llegar', href, 'Google_Maps.png');
    if ((v = (c.web || '').trim())) add('web', 'Página web', 'Visítanos', conProtocolo(v));
    if ((v = (c.correo || '').trim()) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) add('correo', 'Correo', 'Escríbenos', 'mailto:' + v);
    return out;
  };

  /* ---------- Horarios ---------- */
  function min(s) { var p = (s || '0:0').split(':'); return (+p[0]) * 60 + (+p[1]); }
  QV.hayHorarios = function (h) {
    return !!h && QV.DIAS.some(function (d) { return h[d.k] && h[d.k].abierto; });
  };
  QV.estado = function (h, now) {
    if (!QV.hayHorarios(h)) return null;
    now = now || new Date();
    var d = now.getDay(), m = now.getHours() * 60 + now.getMinutes();
    var hoy = h[IDX[d]], ayer = h[IDX[(d + 6) % 7]], i, x;
    if (ayer && ayer.abierto && min(ayer.hasta) <= min(ayer.desde) && m < min(ayer.hasta))
      return { abierto: true, hasta: ayer.hasta };
    if (hoy && hoy.abierto) {
      var a = min(hoy.desde), b = min(hoy.hasta);
      if (b <= a) { if (m >= a) return { abierto: true, hasta: hoy.hasta }; }
      else if (m >= a && m < b) return { abierto: true, hasta: hoy.hasta };
      else if (m < a) return { abierto: false, abre: hoy.desde, cuando: 'hoy' };
    }
    for (i = 1; i <= 7; i++) {
      x = h[IDX[(d + i) % 7]];
      if (x && x.abierto) return { abierto: false, abre: x.desde, cuando: i === 1 ? 'mañana' : 'el ' + NOMBRE[IDX[(d + i) % 7]] };
    }
    return null;
  };
  QV.hoyKey = function () { return IDX[new Date().getDay()]; };
})(window);
