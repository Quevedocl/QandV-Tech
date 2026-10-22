/* =====================================================
   Reloj en tiempo real del teléfono de demostración.
   Independiente: solo necesita #liveClock y #liveDate.
   ===================================================== */

function updateLiveClock() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');

  const options = { weekday: 'long', day: 'numeric', month: 'short' };
  let dateStr = now.toLocaleDateString('es-CL', options);
  dateStr = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

  const clockEl = document.getElementById('liveClock');
  const dateEl = document.getElementById('liveDate');

  if (clockEl && dateEl) {
    clockEl.firstChild.nodeValue = `${hours}:${minutes}`;
    dateEl.textContent = dateStr;
  }
}
updateLiveClock();
(function tick(){
  setTimeout(function(){ updateLiveClock(); tick(); }, 60000 - (Date.now() % 60000) + 50);
})();
