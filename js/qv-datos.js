/* =====================================================
   CAPA DE DATOS
   - Con Supabase configurado: base de datos real + login real.
   - Sin configurar: MODO DEMO guardado en este navegador.
   No necesita librerías externas (usa fetch).
   ===================================================== */
(function (w) {
  var QV = w.QV = w.QV || {}, C = w.QV_CONFIG || {};
  var remoto = !!(C.SUPABASE_URL && C.SUPABASE_ANON_KEY);
  var URL_ = (C.SUPABASE_URL || '').replace(/\/+$/, ''), KEY = C.SUPABASE_ANON_KEY || '', BUCKET = C.BUCKET || 'logos';
  var LS = 'qv_demo_clientes', LS_SES = remoto ? 'qv_sesion' : 'qv_demo_sesion';
  var CAMPOS = ['slug', 'nombre', 'logo_url', 'whatsapp', 'whatsapp_mensaje', 'telefono', 'correo', 'instagram', 'facebook', 'tiktok', 'web', 'direccion', 'maps_url', 'horarios', 'activo'];

  function leer() { try { return JSON.parse(localStorage.getItem(LS) || '[]'); } catch (e) { return []; } }
  function escribir(a) { localStorage.setItem(LS, JSON.stringify(a)); }
  function ses() { try { return JSON.parse(localStorage.getItem(LS_SES) || 'null'); } catch (e) { return null; } }

  /* ---------- Sesión (Supabase Auth por REST) ---------- */
  function guardarSesion(j) {
    var s = { access: j.access_token, refresh: j.refresh_token, exp: Math.floor(Date.now() / 1000) + (j.expires_in || 3600), email: (j.user && j.user.email) || '' };
    localStorage.setItem(LS_SES, JSON.stringify(s)); return s;
  }
  function token() {
    var s = ses();
    if (!s) return Promise.reject(new Error('Sesión expirada. Vuelve a entrar.'));
    if (s.exp - 60 > Date.now() / 1000) return Promise.resolve(s.access);
    return fetch(URL_ + '/auth/v1/token?grant_type=refresh_token', {
      method: 'POST', headers: { apikey: KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh_token: s.refresh })
    }).then(function (r) { if (!r.ok) throw new Error('Sesión expirada. Vuelve a entrar.'); return r.json(); })
      .then(function (j) { return guardarSesion(j).access; });
  }
  function api(path, opts) {
    return token().then(function (t) {
      opts = opts || {}; opts.headers = Object.assign({ apikey: KEY, Authorization: 'Bearer ' + t }, opts.headers || {});
      return fetch(URL_ + path, opts);
    });
  }
  function fallo(r) {
    return r.json().catch(function () { return {}; }).then(function (j) {
      throw new Error(j.code === '23505' ? 'Ese enlace ya está en uso por otro cliente.' : (j.message || j.msg || 'Error ' + r.status));
    });
  }
  function fila(c) { var o = {}; CAMPOS.forEach(function (k) { o[k] = c[k] === undefined ? null : c[k]; }); return o; }

  QV.datos = {
    remoto: remoto,

    /* Lectura pública (la usa la página del cliente) */
    obtenerPublico: function (slug) {
      if (!remoto) return Promise.resolve(leer().filter(function (c) { return c.slug === slug && c.activo !== false; })[0] || null);
      return fetch(URL_ + '/rest/v1/clientes?select=*&limit=1&activo=eq.true&slug=eq.' + encodeURIComponent(slug), { headers: { apikey: KEY } })
        .then(function (r) { if (!r.ok) throw new Error('red'); return r.json(); })
        .then(function (a) { return a[0] || null; });
    },

    /* Tema de festividad de la página principal (tabla site_config, clave "tema") */
    obtenerTema: function () {
      if (!remoto) { try { return Promise.resolve(JSON.parse(localStorage.getItem('qv_demo_tema') || '{"modo":"normal"}')); } catch (e) { return Promise.resolve({ modo: 'normal' }); } }
      return fetch(URL_ + '/rest/v1/site_config?select=value&key=eq.tema&limit=1', { headers: { apikey: KEY } })
        .then(function (r) { if (!r.ok) throw new Error('Falta crear la tabla site_config en Supabase (ver supabase/setup.sql).'); return r.json(); })
        .then(function (a) { return (a[0] && a[0].value) || { modo: 'normal' }; });
    },
    guardarTema: function (cfg) {
      if (!remoto) { localStorage.setItem('qv_demo_tema', JSON.stringify(cfg)); return Promise.resolve(cfg); }
      return api('/rest/v1/site_config?on_conflict=key', { method: 'POST', headers: { 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=representation' },
        body: JSON.stringify({ key: 'tema', value: cfg, updated_at: new Date().toISOString() }) })
        .then(function (r) { return r.ok ? r.json() : fallo(r); }).then(function () { return cfg; });
    },

    /* Acceso del dueño */
    sesion: function () { var s = ses(); return Promise.resolve(s ? { email: s.email } : null); },
    entrar: function (email, pass) {
      if (!remoto) {
        if (pass !== 'demo') return Promise.reject(new Error('En modo demostración la clave es: demo'));
        localStorage.setItem(LS_SES, JSON.stringify({ email: email })); return Promise.resolve({ email: email });
      }
      return fetch(URL_ + '/auth/v1/token?grant_type=password', {
        method: 'POST', headers: { apikey: KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email, password: pass })
      }).then(function (r) {
        if (!r.ok) throw new Error('Correo o clave incorrectos.');
        return r.json();
      }).then(function (j) { return { email: guardarSesion(j).email }; });
    },
    salir: function () {
      var s = ses(); localStorage.removeItem(LS_SES);
      if (remoto && s) fetch(URL_ + '/auth/v1/logout', { method: 'POST', headers: { apikey: KEY, Authorization: 'Bearer ' + s.access } }).catch(function () {});
      return Promise.resolve();
    },

    listar: function () {
      if (!remoto) return Promise.resolve(leer().sort(function (a, b) { return (b.creado || '').localeCompare(a.creado || ''); }));
      return api('/rest/v1/clientes?select=*&order=creado.desc').then(function (r) { return r.ok ? r.json() : fallo(r); });
    },
    guardar: function (c) {
      if (!remoto) {
        var a = leer(), i;
        if (a.some(function (x) { return x.slug === c.slug && x.id !== c.id; })) return Promise.reject(new Error('Ese enlace ya está en uso por otro cliente.'));
        if (!c.id) { c.id = 'demo-' + Date.now().toString(36); c.creado = new Date().toISOString(); a.push(c); }
        else { i = a.map(function (x) { return x.id; }).indexOf(c.id); if (i < 0) a.push(c); else a[i] = Object.assign(a[i], c); }
        escribir(a); return Promise.resolve(c);
      }
      var row = fila(c); row.actualizado = new Date().toISOString();
      var req = c.id
        ? api('/rest/v1/clientes?id=eq.' + encodeURIComponent(c.id), { method: 'PATCH', headers: { 'Content-Type': 'application/json', Prefer: 'return=representation' }, body: JSON.stringify(row) })
        : api('/rest/v1/clientes', { method: 'POST', headers: { 'Content-Type': 'application/json', Prefer: 'return=representation' }, body: JSON.stringify(row) });
      return req.then(function (r) { return r.ok ? r.json() : fallo(r); }).then(function (a) { return a[0]; });
    },
    eliminar: function (id) {
      if (!remoto) { escribir(leer().filter(function (x) { return x.id !== id; })); return Promise.resolve(); }
      return api('/rest/v1/clientes?id=eq.' + encodeURIComponent(id), { method: 'DELETE' }).then(function (r) { if (!r.ok) return fallo(r); });
    },

    /* Reduce el logo a 640px máx. y lo sube. Devuelve la URL pública. */
    subirLogo: function (file, slug) {
      return reducir(file, 640).then(function (blob) {
        var ext = blob.type === 'image/webp' ? 'webp' : blob.type === 'image/jpeg' ? 'jpg' : 'png';
        if (!remoto) return new Promise(function (ok) { var fr = new FileReader(); fr.onload = function () { ok(fr.result); }; fr.readAsDataURL(blob); });
        var path = (slug || 'logo') + '-' + Date.now().toString(36) + '.' + ext;
        return api('/storage/v1/object/' + BUCKET + '/' + path, { method: 'POST', headers: { 'Content-Type': blob.type, 'x-upsert': 'true' }, body: blob })
          .then(function (r) { return r.ok ? URL_ + '/storage/v1/object/public/' + BUCKET + '/' + path : fallo(r); });
      });
    }
  };

  function reducir(file, max) {
    return new Promise(function (ok, no) {
      var img = new Image(), u = URL.createObjectURL(file);
      img.onload = function () {
        var s = Math.min(1, max / Math.max(img.width, img.height)), cv = document.createElement('canvas');
        cv.width = Math.round(img.width * s); cv.height = Math.round(img.height * s);
        cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height); URL.revokeObjectURL(u);
        cv.toBlob(function (b) { b ? ok(b) : no(new Error('No se pudo procesar la imagen.')); }, 'image/webp', 0.9);
      };
      img.onerror = function () { no(new Error('Ese archivo no es una imagen válida.')); };
      img.src = u;
    });
  }
})(window);
