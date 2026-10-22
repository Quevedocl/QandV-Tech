/* =====================================================
   PANEL MAESTRO: login, lista de clientes y editor
   con vista previa en vivo del teléfono.
   ===================================================== */
(function () {
  var h = QV.h, D = QV.datos;
  var vista = document.getElementById('vista'), top = document.getElementById('top');

  function toast(msg, err) {
    var t = h('div', { class: 'toast' + (err ? ' err' : ''), text: msg });
    document.getElementById('toasts').appendChild(t);
    setTimeout(function () { t.remove(); }, 2800);
  }
  function confirmar(titulo, texto, boton) {
    return new Promise(function (ok) {
      var d = h('dialog', {}, [h('h2', { text: titulo }), h('p', { text: texto }), h('div', { class: 'fila' }, [
        h('button', { class: 'btn ghost sm', type: 'button', onclick: function () { d.close('no'); } }, ['Cancelar']),
        h('button', { class: 'btn danger sm', type: 'button', onclick: function () { d.close('si'); } }, [boton])])]);
      d.addEventListener('close', function () { ok(d.returnValue === 'si'); d.remove(); });
      document.body.appendChild(d); d.showModal();
    });
  }
  function enlaceNFC(slug) { return new URL('../cliente/?c=' + slug, location.href).href; }
  function copiar(txt) {
    var fin = function () { toast('Enlace copiado'); };
    if (navigator.clipboard) navigator.clipboard.writeText(txt).then(fin, function () { prompt('Copia este enlace:', txt); });
    else prompt('Copia este enlace:', txt);
  }
  function iniciales(n) { return (n || '?').trim().split(/\s+/).slice(0, 2).map(function (p) { return p[0]; }).join('').toUpperCase(); }
  function campo(label, input, ayuda) { return h('div', { class: 'campo' }, [h('label', { text: label }), input, ayuda ? h('small', { text: ayuda }) : null]); }

  /* ---------- Sesión ---------- */
  document.getElementById('salir').addEventListener('click', function () { D.salir().then(vistaLogin); });
  function entrarPanel(s) { top.hidden = false; document.getElementById('quien').textContent = s.email; vistaLista(); }

  function vistaLogin() {
    top.hidden = true; vista.replaceChildren();
    var email = h('input', { type: 'email', required: true, autocomplete: 'username', placeholder: 'tu@correo.cl', id: 'em' });
    var pass = h('input', { type: 'password', required: true, autocomplete: 'current-password', id: 'pw' });
    var err = h('p', { class: 'error', role: 'alert' }), btn = h('button', { class: 'btn primary', type: 'submit' }, ['Entrar']);
    var f = h('form', { class: 'login-card', onsubmit: function (e) {
      e.preventDefault(); err.textContent = ''; btn.disabled = true;
      D.entrar(email.value.trim(), pass.value).then(entrarPanel, function (x) { err.textContent = x.message; btn.disabled = false; pass.select(); });
    } }, [
      h('img', { src: '../images/logo.jpg', alt: 'Q&V Tech' }), h('h1', { text: 'Panel maestro' }), h('p', { class: 'sub', text: 'Acceso privado de Q&V Tech' }),
      !D.remoto ? h('p', { class: 'aviso', text: 'Modo demostración: aún no hay base de datos conectada. Entra con cualquier correo y la clave "demo". Los datos se guardan solo en este navegador.' }) : null,
      h('div', { class: 'campo' }, [h('label', { for: 'em', text: 'Correo' }), email]),
      h('div', { class: 'campo' }, [h('label', { for: 'pw', text: 'Clave' }), pass]),
      err, btn]);
    vista.appendChild(h('div', { class: 'login' }, [f])); email.focus();
  }

  /* ---------- Lista ---------- */
  function vistaLista() {
    vista.replaceChildren(h('p', { text: 'Cargando clientes…' }));
    D.listar().then(function (lista) {
      var grid = h('div', { class: 'grid-cli' }), buscar = h('input', { type: 'search', placeholder: 'Buscar cliente…', 'aria-label': 'Buscar cliente' });
      function pintar() {
        var q = buscar.value.toLowerCase(), v = lista.filter(function (c) { return (c.nombre + c.slug).toLowerCase().indexOf(q) > -1; });
        grid.replaceChildren.apply(grid, v.length ? v.map(tarjeta) : [h('div', { class: 'vacio' }, [
          h('h2', { text: lista.length ? 'Sin resultados' : 'Aún no tienes clientes' }),
          h('p', { text: lista.length ? 'Prueba con otro nombre.' : 'Crea el primero y copia su enlace para grabarlo en la tarjeta NFC.' })])]);
      }
      function tarjeta(c) {
        var canales = QV.enlaces(c).length;
        return h('article', { class: 'cli' }, [
          h('div', { class: 'cli-top' }, [
            c.logo_url ? h('div', { class: 'av' }, [h('img', { src: c.logo_url, alt: '' })]) : h('div', { class: 'av mono', text: iniciales(c.nombre) }),
            h('div', {}, [h('h3', { text: c.nombre }), h('div', { class: 'slug', text: '?c=' + c.slug })])]),
          h('div', { class: 'chips' }, [h('span', { class: 'chip', text: canales + (canales === 1 ? ' canal' : ' canales') }),
            c.activo === false ? h('span', { class: 'chip off', text: 'Oculto' }) : null]),
          h('div', { class: 'cli-acc' }, [
            h('button', { class: 'btn primary sm', type: 'button', onclick: function () { vistaEditor(c); } }, ['Editar']),
            h('button', { class: 'btn ghost sm', type: 'button', onclick: function () { copiar(enlaceNFC(c.slug)); } }, ['Copiar enlace NFC']),
            h('a', { class: 'btn ghost sm', href: enlaceNFC(c.slug), target: '_blank', rel: 'noopener' }, ['Abrir']),
            h('button', { class: 'btn danger sm', type: 'button', onclick: function () {
              confirmar('¿Eliminar a ' + c.nombre + '?', 'Su perfil dejará de funcionar y la tarjeta NFC mostrará un aviso. No se puede deshacer.', 'Eliminar')
                .then(function (si) { if (si) D.eliminar(c.id).then(function () { toast('Cliente eliminado'); vistaLista(); }, function (e) { toast(e.message, true); }); });
            } }, ['Eliminar'])])]);
      }
      buscar.addEventListener('input', pintar); pintar();
      vista.replaceChildren(
        h('div', { class: 'cab-lista' }, [
          h('div', {}, [h('h1', { text: 'Clientes' }), h('p', { text: lista.length + (lista.length === 1 ? ' perfil creado' : ' perfiles creados') })]),
          h('div', { class: 'acciones' }, [buscar, h('button', { class: 'btn primary', type: 'button', onclick: function () { vistaEditor(null); } }, ['Nuevo cliente'])])]),
        grid);
    }, function (e) { vista.replaceChildren(h('p', { class: 'error', text: e.message }), h('button', { class: 'btn ghost', onclick: vistaLogin }, ['Volver a entrar'])); });
  }

  /* ---------- Editor ---------- */
  function vistaEditor(c) {
    var nuevo = !c, slugManual = !nuevo, guardando = false;
    var d = Object.assign({ nombre: '', slug: '', logo_url: '', whatsapp: '', whatsapp_mensaje: '', telefono: '', correo: '', instagram: '', facebook: '', tiktok: '', web: '', direccion: '', maps_url: '', activo: true }, c || {});
    d.horarios = JSON.parse(JSON.stringify(d.horarios || QV.horariosBase()));
    QV.DIAS.forEach(function (x) { d.horarios[x.k] = Object.assign({ abierto: false, desde: '09:00', hasta: '18:00' }, d.horarios[x.k]); });

    var frame = h('iframe', { src: '../cliente/?preview=1', title: 'Vista previa del perfil' }), tm;
    function enviar() { if (frame.contentWindow) frame.contentWindow.postMessage({ tipo: 'qv-preview', cliente: d }, '*'); }
    function cambio() { clearTimeout(tm); tm = setTimeout(enviar, 120); }
    window.onmessage = function (e) { if (e.source === frame.contentWindow && e.data && e.data.tipo === 'qv-listo') enviar(); };

    function inp(k, attrs, ayuda, label) {
      var i = h('input', Object.assign({ type: 'text', value: d[k] || '' }, attrs));
      i.addEventListener('input', function () { d[k] = i.value; cambio(); });
      return label ? campo(label, i, ayuda) : i;
    }
    var avatar = h('div', { class: 'logo-prev' }), nombre = inp('nombre', { required: true, placeholder: 'Ej: Panadería Doña Rosa', autocomplete: 'off' }, '', 'Nombre del negocio');
    var slugI = inp('slug', { placeholder: 'dona-rosa', autocapitalize: 'none', autocomplete: 'off' });
    function pintarLogo() { avatar.className = 'logo-prev' + (d.logo_url ? '' : ' mono'); avatar.replaceChildren(d.logo_url ? h('img', { src: d.logo_url, alt: '' }) : document.createTextNode(iniciales(d.nombre))); }
    pintarLogo();
    nombre.querySelector('input').addEventListener('input', function () {
      if (!slugManual) { d.slug = QV.slugify(d.nombre); slugI.value = d.slug; }
      if (!d.logo_url) pintarLogo();
    });
    slugI.addEventListener('input', function () { slugManual = true; slugI.value = d.slug = QV.slugify(slugI.value); cambio(); });

    var archivo = h('input', { type: 'file', accept: 'image/*', hidden: true, onchange: function () {
      var f = archivo.files[0]; if (!f) return; btnLogo.disabled = true; btnLogo.textContent = 'Subiendo…';
      D.subirLogo(f, d.slug || QV.slugify(d.nombre)).then(function (u) { d.logo_url = u; pintarLogo(); cambio(); toast('Logo cargado'); },
        function (e) { toast(e.message, true); }).then(function () { btnLogo.disabled = false; btnLogo.textContent = 'Subir logo'; archivo.value = ''; });
    } });
    var btnLogo = h('button', { class: 'btn ghost sm', type: 'button', onclick: function () { archivo.click(); } }, ['Subir logo']);
    var btnQuitar = h('button', { class: 'btn ghost sm', type: 'button', onclick: function () { d.logo_url = ''; pintarLogo(); cambio(); } }, ['Quitar']);

    var activo = h('input', { type: 'checkbox' }); activo.checked = d.activo !== false;
    activo.addEventListener('change', function () { d.activo = activo.checked; });

    /* Horarios */
    var filas = h('div');
    function pintarHorarios() {
      filas.replaceChildren.apply(filas, QV.DIAS.map(function (x) {
        var hr = d.horarios[x.k], fila = h('div', { class: 'dia' + (hr.abierto ? '' : ' cerrado') });
        var sw = h('input', { type: 'checkbox', 'aria-label': x.n + ' abierto' }); sw.checked = hr.abierto;
        var t1 = h('input', { type: 'time', value: hr.desde, 'aria-label': 'Abre ' + x.n }), t2 = h('input', { type: 'time', value: hr.hasta, 'aria-label': 'Cierra ' + x.n });
        sw.addEventListener('change', function () { hr.abierto = sw.checked; fila.classList.toggle('cerrado', !sw.checked); cambio(); });
        t1.addEventListener('input', function () { hr.desde = t1.value; cambio(); }); t2.addEventListener('input', function () { hr.hasta = t2.value; cambio(); });
        fila.append(h('label', { class: 'sw' }, [sw, h('i'), h('span', { class: 'dia-n', text: x.n })]),
          h('div', { class: 'dia-h' }, [t1, h('span', { text: 'a' }), t2]));
        return fila;
      }));
    }
    pintarHorarios();

    var msg = h('span', { class: 'msg' }), linkBox = h('div');
    function mostrarEnlace() {
      linkBox.replaceChildren(); if (!d.id) return;
      linkBox.appendChild(h('div', { class: 'enlace' }, [h('code', { text: enlaceNFC(d.slug) }),
        h('button', { class: 'btn ghost sm', type: 'button', onclick: function () { copiar(enlaceNFC(d.slug)); } }, ['Copiar']),
        h('a', { class: 'btn ghost sm', href: enlaceNFC(d.slug), target: '_blank', rel: 'noopener' }, ['Abrir'])]));
    }
    mostrarEnlace();

    var btnG = h('button', { class: 'btn primary', type: 'button', onclick: function () {
      if (guardando) return;
      d.nombre = d.nombre.trim();
      if (!d.nombre) { toast('Escribe el nombre del negocio', true); nombre.querySelector('input').focus(); return; }
      d.slug = QV.slugify(d.slug || d.nombre);
      if (d.slug.length < 2) { toast('El enlace debe tener al menos 2 letras', true); return; }
      slugI.value = d.slug; guardando = true; btnG.disabled = true; msg.textContent = 'Guardando…';
      D.guardar(d).then(function (r) { d.id = r.id; d.creado = r.creado || d.creado; msg.textContent = 'Guardado'; toast('Cambios guardados'); mostrarEnlace(); },
        function (e) { msg.textContent = ''; toast(e.message, true); }).then(function () { guardando = false; btnG.disabled = false; });
    } }, ['Guardar cambios']);

    var ed = h('div', { class: 'ed', 'data-tab': 'editar' });
    var tabs = h('div', { class: 'tabs', role: 'group', 'aria-label': 'Vista' }, ['editar', 'previa'].map(function (t) {
      return h('button', { type: 'button', 'aria-pressed': t === 'editar' ? 'true' : 'false', onclick: function () {
        ed.dataset.tab = t; [].forEach.call(tabs.children, function (b) { b.setAttribute('aria-pressed', b === this ? 'true' : 'false'); }, this); if (t === 'previa') enviar();
      }, text: t === 'editar' ? 'Editar' : 'Vista previa' });
    }));

    var form = h('div', { class: 'form' }, [
      h('section', { class: 'sec' }, [h('h2', { text: 'Identidad' }),
        h('div', { class: 'logo-fila' }, [avatar, h('div', { class: 'campo' }, [h('span', { class: 'lbl', text: 'Logo del cliente' }),
          h('div', { class: 'acciones' }, [btnLogo, btnQuitar, archivo]), h('small', { text: 'Opcional. Si no tiene, se muestran sus iniciales.' })])]),
        nombre,
        h('div', { class: 'campo' }, [h('label', { text: 'Enlace del perfil' }), h('div', { class: 'prefijo' }, [h('span', { text: '/cliente/?c=' }), slugI]), h('small', { text: 'Es lo que se graba en la tarjeta NFC. Evita cambiarlo después.' })]),
        h('label', { class: 'sw' }, [activo, h('i'), h('span', { text: 'Perfil visible' })]),
        linkBox]),
      h('section', { class: 'sec' }, [h('h2', { text: 'Contacto' }),
        h('div', { class: 'par' }, [
          inp('whatsapp', { type: 'tel', placeholder: '+56 9 1234 5678', inputmode: 'tel' }, 'Con código de país si no es de Chile.', 'WhatsApp'),
          inp('telefono', { type: 'tel', placeholder: '+56 2 2345 6789', inputmode: 'tel' }, '', 'Teléfono')]),
        inp('whatsapp_mensaje', { placeholder: 'Hola, vi su tarjeta y quisiera consultar…' }, 'Mensaje que aparece escrito al abrir WhatsApp (opcional).', 'Mensaje de WhatsApp'),
        inp('correo', { type: 'email', placeholder: 'contacto@negocio.cl', inputmode: 'email' }, '', 'Correo')]),
      h('section', { class: 'sec' }, [h('h2', { text: 'Redes sociales' }), h('p', { class: 'ayuda', text: 'Pega el usuario o el enlace completo. Solo se muestran las que completes.' }),
        h('div', { class: 'par' }, [
          inp('instagram', { placeholder: '@usuario', autocapitalize: 'none' }, '', 'Instagram'), inp('facebook', { placeholder: 'nombre de la página o enlace', autocapitalize: 'none' }, '', 'Facebook'),
          inp('tiktok', { placeholder: '@usuario', autocapitalize: 'none' }, '', 'TikTok'), inp('web', { placeholder: 'www.negocio.cl', autocapitalize: 'none', inputmode: 'url' }, '', 'Página web')])]),
      h('section', { class: 'sec' }, [h('h2', { text: 'Ubicación' }),
        inp('direccion', { placeholder: 'Av. Providencia 1234, Santiago' }, '', 'Dirección'),
        inp('maps_url', { placeholder: 'https://maps.app.goo.gl/…', inputmode: 'url' }, 'Opcional. Si lo dejas vacío, se abre Google Maps con la dirección.', 'Enlace de Google Maps')]),
      h('section', { class: 'sec' }, [h('h2', { text: 'Horarios' }), filas,
        h('div', { class: 'acciones' }, [h('button', { class: 'btn ghost sm', type: 'button', onclick: function () {
          var b = d.horarios.lun; QV.DIAS.forEach(function (x) { d.horarios[x.k] = { abierto: b.abierto, desde: b.desde, hasta: b.hasta }; }); pintarHorarios(); cambio(); toast('Lunes copiado a todos los días');
        } }, ['Copiar lunes a todos los días'])])])]);

    var prev = h('aside', { class: 'prev' }, [h('div', { class: 'tel' }, [frame]),
      h('button', { class: 'btn ghost sm', type: 'button', onclick: function () { frame.src = '../cliente/?preview=1&intro=1'; } }, ['Ver animación de entrada'])]);

    ed.append(form, prev);
    vista.replaceChildren(
      h('div', { class: 'ed-cab' }, [h('button', { class: 'btn ghost sm', type: 'button', onclick: function () { window.onmessage = null; vistaLista(); } }, ['← Clientes']),
        h('h1', { text: nuevo ? 'Nuevo cliente' : d.nombre })]),
      tabs, ed, h('div', { class: 'barra-g' }, [msg, btnG]));
    window.scrollTo(0, 0);
  }

  /* ---------- Arranque ---------- */
  D.sesion().then(function (s) { s ? entrarPanel(s) : vistaLogin(); });
})();
