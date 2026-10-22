/* Panel maestro: login, lista de clientes y editor */
(function () {
  var h = QV.h, app = document.getElementById('app'), tt = document.getElementById('toast'), D = QV.datos, tm;
  function toast(m) { tt.textContent = m; tt.classList.add('on'); clearTimeout(tm); tm = setTimeout(function () { tt.classList.remove('on'); }, 2400); }
  function limpiar() { app.innerHTML = ''; window.scrollTo(0, 0); }
  function url(slug) { return new URL('cliente.html?c=' + slug, location.href).href; }
  function campo(l, id, v, o) { o = o || {}; return h('label', { class: o.full ? 'full' : '' }, [l, h('input', { type: o.type || 'text', id: id, value: v || '', placeholder: o.ph || '', autocomplete: 'off' }), o.hint ? h('span', { class: 'hint', text: o.hint }) : null]); }
  function cabecera(s) {
    return h('div', { class: 'ad-top' }, [h('img', { src: 'images/logo.jpg', alt: 'Q&V' }), h('div', {}, [h('h1', { text: 'Panel de clientes' }), h('small', { text: s.email + (D.remoto ? '' : ' · modo demostración') })]), h('span', { class: 'sp' }),
      h('button', { class: 'btn2 g', text: 'Salir', onclick: function () { D.salir().then(login); } })]);
  }

  function login() {
    limpiar();
    var e = h('p', { class: 'err' }), em = campo('Correo', 'em', '', { type: 'email' }), pw = campo('Clave', 'pw', '', { type: 'password' });
    var f = h('form', { onsubmit: function (ev) {
      ev.preventDefault(); e.textContent = '';
      D.entrar(em.querySelector('input').value.trim(), pw.querySelector('input').value).then(function (s) { panel(s); }).catch(function (x) { e.textContent = x.message; });
    } }, [em, pw, e, h('button', { class: 'btn2', type: 'submit', text: 'Entrar' })]);
    app.appendChild(h('div', { class: 'panel login' }, [h('img', { src: 'images/logo.jpg', alt: 'Q&V Tech' }), h('h1', { text: 'Acceso privado' }), D.remoto ? null : h('p', { class: 'hint', text: 'Modo demostración: usa cualquier correo y la clave "demo".' }), f]));
  }

  function panel(s) {
    limpiar(); app.appendChild(cabecera(s));
    var box = h('div', { class: 'lista' });
    app.appendChild(h('div', { class: 'acc', style: 'margin:0 0 14px' }, [h('button', { class: 'btn2', text: 'Nuevo cliente', onclick: function () { editor(s, { activo: true, horarios: QV.horariosBase() }); } })]));
    app.appendChild(box);
    D.listar().then(function (a) {
      if (!a.length) box.appendChild(h('div', { class: 'panel vacioad', text: 'Aún no hay clientes. Crea el primero con "Nuevo cliente".' }));
      a.forEach(function (c) {
        box.appendChild(h('div', { class: 'fila' + (c.activo === false ? ' off' : '') }, [
          h('div', { class: 'lg' }, [c.logo_url ? h('img', { src: c.logo_url, alt: '' }) : (c.nombre || '?').charAt(0).toUpperCase()]),
          h('div', { class: 'in' }, [h('b', { text: c.nombre + (c.activo === false ? ' (desactivado)' : '') }), h('small', { text: url(c.slug) })]),
          h('div', { class: 'ac' }, [
            h('button', { class: 'btn2 g', text: 'Copiar enlace', onclick: function () { (navigator.clipboard ? navigator.clipboard.writeText(url(c.slug)) : Promise.reject()).then(function () { toast('Enlace copiado: pégalo en el NFC'); }, function () { prompt('Copia este enlace:', url(c.slug)); }); } }),
            h('a', { class: 'btn2 g', href: url(c.slug), target: '_blank', rel: 'noopener', text: 'Ver' }),
            h('button', { class: 'btn2', text: 'Editar', onclick: function () { editor(s, c); } }),
            h('button', { class: 'btn2 r', text: 'Eliminar', onclick: function () { if (confirm('¿Eliminar a ' + c.nombre + '? No se puede deshacer.')) D.eliminar(c.id).then(function () { toast('Cliente eliminado'); panel(s); }).catch(function (x) { toast(x.message); }); } })
          ])]));
      });
    }).catch(function (x) { box.appendChild(h('div', { class: 'panel vacioad', text: x.message })); });
  }

  function editor(s, c) {
    limpiar(); app.appendChild(cabecera(s));
    var hor = JSON.parse(JSON.stringify(c.horarios || QV.horariosBase())), logo = c.logo_url || '', tocoSlug = !!c.id, err = h('p', { class: 'err' });
    var pv = h('div', { class: 'pv' }), file = h('input', { type: 'file', accept: 'image/*', style: 'display:none' });
    function verLogo() { pv.innerHTML = ''; if (logo) pv.appendChild(h('img', { src: logo, alt: '' })); else pv.textContent = 'Sin logo'; }
    verLogo();
    file.addEventListener('change', function () {
      if (!file.files[0]) return; toast('Subiendo logo…');
      D.subirLogo(file.files[0], get('slug') || 'logo').then(function (u) { logo = u; verLogo(); toast('Logo listo'); }).catch(function (x) { toast(x.message); });
    });
    function el(id) { return document.getElementById(id); }
    function get(id) { var x = el(id); return x ? x.value.trim() : ''; }
    var dias = QV.DIAS.map(function (d) {
      var x = hor[d.k] = hor[d.k] || { abierto: false, desde: '09:00', hasta: '18:00' };
      var row = h('div', { class: 'dia' + (x.abierto ? '' : ' c') });
      var cb = h('input', { type: 'checkbox' }); cb.checked = !!x.abierto;
      var a = h('input', { type: 'time', value: x.desde }), b = h('input', { type: 'time', value: x.hasta });
      cb.addEventListener('change', function () { x.abierto = cb.checked; row.classList.toggle('c', !cb.checked); });
      a.addEventListener('input', function () { x.desde = a.value; }); b.addEventListener('input', function () { x.hasta = b.value; });
      row.appendChild(h('label', {}, [cb, d.n])); row.appendChild(a); row.appendChild(b); return row;
    });
    var nom = campo('Nombre del negocio', 'nombre', c.nombre, { full: true }), slugF = campo('Enlace del perfil', 'slug', c.slug, { full: true, hint: 'Se usa en la dirección: cliente.html?c=este-nombre' });
    nom.querySelector('input').addEventListener('input', function (e) { if (!tocoSlug) slugF.querySelector('input').value = QV.slugify(e.target.value); });
    slugF.querySelector('input').addEventListener('input', function () { tocoSlug = true; });
    var act = h('input', { type: 'checkbox', id: 'activo' }); act.checked = c.activo !== false;
    var f = h('form', { class: 'panel', onsubmit: function (ev) {
      ev.preventDefault(); err.textContent = '';
      var o = { id: c.id, nombre: get('nombre'), slug: QV.slugify(get('slug')), logo_url: logo || null, activo: act.checked, horarios: hor };
      ['whatsapp', 'whatsapp_mensaje', 'telefono', 'correo', 'instagram', 'facebook', 'tiktok', 'web', 'direccion', 'maps_url'].forEach(function (k) { o[k] = get(k) || null; });
      if (!o.nombre || !o.slug) { err.textContent = 'Falta el nombre del negocio.'; return; }
      D.guardar(o).then(function (r) { toast('Guardado'); panel(s); }).catch(function (x) { err.textContent = x.message; });
    } }, [
      h('h2', { class: 'sec', text: c.id ? 'Editar cliente' : 'Nuevo cliente', style: 'margin-top:0' }),
      h('div', { class: 'grid2' }, [nom, slugF]),
      h('h3', { class: 'sec', text: 'Logo' }), h('div', { class: 'logo-ed' }, [pv, h('div', {}, [h('button', { class: 'btn2 g', type: 'button', text: 'Subir logo', onclick: function () { file.click(); } }), ' ', h('button', { class: 'btn2 g', type: 'button', text: 'Quitar', onclick: function () { logo = ''; verLogo(); } }), h('p', { class: 'hint', text: 'Opcional. Sin logo se muestra la inicial del negocio.' })]), file]),
      h('h3', { class: 'sec', text: 'Contacto' }),
      h('div', { class: 'grid2' }, [campo('WhatsApp', 'whatsapp', c.whatsapp, { ph: '9 1234 5678' }), campo('Teléfono', 'telefono', c.telefono, { ph: '9 1234 5678' }), campo('Mensaje de WhatsApp', 'whatsapp_mensaje', c.whatsapp_mensaje, { full: true, ph: 'Hola, quiero hacer un pedido' }), campo('Correo', 'correo', c.correo, { type: 'email', full: true })]),
      h('h3', { class: 'sec', text: 'Redes y web' }),
      h('div', { class: 'grid2' }, [campo('Instagram', 'instagram', c.instagram, { ph: '@usuario o enlace' }), campo('Facebook', 'facebook', c.facebook, { ph: 'usuario o enlace' }), campo('TikTok', 'tiktok', c.tiktok, { ph: '@usuario o enlace' }), campo('Página web', 'web', c.web, { ph: 'www.negocio.cl' })]),
      h('h3', { class: 'sec', text: 'Ubicación' }),
      h('div', { class: 'grid2' }, [campo('Dirección', 'direccion', c.direccion, { full: true }), campo('Enlace de Google Maps', 'maps_url', c.maps_url, { full: true, hint: 'Opcional. Si lo dejas vacío se usa la dirección.' })]),
      h('h3', { class: 'sec', text: 'Horarios' }), h('div', {}, dias),
      h('label', { style: 'display:flex;flex-direction:row;align-items:center;gap:8px;margin-top:18px' }, [act, 'Perfil activo (visible al escanear)']),
      err, h('div', { class: 'acc' }, [h('button', { class: 'btn2', type: 'submit', text: 'Guardar' }), h('button', { class: 'btn2 g', type: 'button', text: 'Cancelar', onclick: function () { panel(s); } })])
    ]);
    app.appendChild(f);
  }

  D.sesion().then(function (s) { s ? panel(s) : login(); });
})();
