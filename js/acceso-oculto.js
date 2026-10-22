/* Acceso secreto: toca 5 veces seguidas el logo de la esquina (arriba a la izquierda) y se abre el panel maestro (pide correo y clave). */
(function () {
  var n = 0, t;
  document.addEventListener('click', function (e) {
    var g = e.target.closest && e.target.closest('#genie');
    if (!g || !g.classList.contains('is-logo')) return;
    clearTimeout(t); t = setTimeout(function () { n = 0; }, 2500);
    if (++n >= 5) { n = 0; location.href = 'maestro/'; }
  });
})();
