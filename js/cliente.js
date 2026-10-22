/* Perfil del cliente: ?c=slug  ·  animación de entrada Q&V + enlaces con efecto "inflar" */
(function () {
  var h = QV.h, page = document.getElementById('page'), sp = document.getElementById('splash');
  var slug = (new URLSearchParams(location.search).get('c') || '').toLowerCase(), t0 = Date.now(), key = 'qv_splash_' + slug;
  var visto = false; try { visto = !!sessionStorage.getItem(key); } catch (e) {}
  function cerrar() { sp.classList.add('out'); page.classList.add('ready'); setTimeout(function () { sp.remove(); }, 1000); }
  function listo() {
    if (visto) { sp.remove(); page.classList.add('ready'); return; }
    try { sessionStorage.setItem(key, 1); } catch (e) {}
    setTimeout(cerrar, Math.max(0, 2600 - (Date.now() - t0)));
  }
  sp.addEventListener('click', cerrar);
  function vacio(t, p) { page.appendChild(h('div', { class: 'vacio' }, [h('h1', { text: t }), h('p', { text: p })])); listo(); }

  function tile(l, i) {
    var wa = l.id === 'whatsapp', a = h('a', { class: 'tile' + (wa ? ' wide wa' : ''), href: l.href }, [
      h('span', { class: 't-i' }, [l.img ? h('img', { src: 'images/' + l.img, alt: '' }) : QV.svg(l.svg)]),
      h('span', {}, [h('span', { class: 't-n', text: l.nombre }), h('span', { class: 't-s', text: l.sub })])
    ]);
    a.addEventListener('pointerdown', function () { a.classList.add('press'); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) { a.addEventListener(ev, function () { a.classList.remove('press'); }); });
    a.addEventListener('click', function (e) {
      e.preventDefault(); if (a.classList.contains('sel')) return;
      var r = a.getBoundingClientRect(); a.style.setProperty('--rx', (e.clientX - r.left) + 'px'); a.style.setProperty('--ry', (e.clientY - r.top) + 'px');
      a.classList.add('sel'); if (navigator.vibrate) navigator.vibrate(18);
      setTimeout(function () { location.href = l.href; }, 460);
    });
    return a;
  }

  function pintar(c) {
    document.title = c.nombre + ' — Q&V Tech';
    var kids = [h('div', { class: 'cl-logo' }, [c.logo_url ? h('img', { src: c.logo_url, alt: c.nombre }) : h('b', { text: (c.nombre || '?').trim().charAt(0).toUpperCase() })]), h('h1', { text: c.nombre })];
    var est = QV.estado(c.horarios);
    if (est) kids.push(h('div', { class: 'cl-estado' + (est.abierto ? ' on' : '') }, [h('i'), est.abierto ? 'Abierto · hasta las ' + est.hasta : 'Cerrado · abre ' + est.cuando + ' a las ' + est.abre]));
    var ls = QV.enlaces(c), g = h('div', { class: 'tiles' }, ls.map(tile));
    var rest = ls.filter(function (l) { return l.id !== 'whatsapp'; }).length;
    if (rest % 2 && g.lastChild && !g.lastChild.classList.contains('wa')) g.lastChild.classList.add('wide');
    kids.push(g);
    if (QV.hayHorarios(c.horarios)) {
      var hoy = QV.hoyKey();
      kids.push(h('div', { class: 'card' }, [h('h2', { text: 'Horarios' })].concat(QV.DIAS.map(function (d) {
        var x = c.horarios[d.k];
        return h('div', { class: 'hr' + (d.k === hoy ? ' hoy' : '') }, [h('span', { text: d.n }), h('span', { text: x && x.abierto ? x.desde + ' – ' + x.hasta : 'Cerrado' })]);
      }))));
    }
    if ((c.direccion || '').trim()) kids.push(h('div', { class: 'card' }, [h('h2', { text: 'Dirección' }), h('p', { class: 'dir', text: c.direccion })]));
    kids.push(h('a', { class: 'cl-foot', href: 'index.html' }, [h('img', { src: 'images/logo.jpg', alt: 'Q&V Tech' }), 'Tu perfil digital, por Q&V Tech']));
    kids.forEach(function (k) { page.appendChild(k); });
    listo();
  }
  window.addEventListener('pageshow', function () { document.querySelectorAll('.tile.sel').forEach(function (t) { t.classList.remove('sel'); }); });
  if (!slug) return vacio('Perfil no indicado', 'Falta el nombre del perfil en el enlace.');
  QV.datos.obtenerPublico(slug).then(function (c) { c ? pintar(c) : vacio('No encontramos este perfil', 'El enlace puede estar mal escrito o el perfil está desactivado.'); })
    .catch(function () { vacio('Sin conexión', 'Revisa tu internet y vuelve a escanear.'); });
})();
