# Q&V Clientes — cómo funciona y cómo ponerlo en marcha

## Cómo entrar al panel maestro (solo tú)
1. **Desde el celular o PC:** abre tu página y baja hasta el final (sección "Contáctanos").
   Toca **5 veces seguidas** el texto "© 2026 Q&V Tech · Tarjetas NFC para negocios". Te lleva al panel.
2. **O directo:** escribe `tudominio.cl/maestro/` en el navegador.
3. Entra con tu correo y clave. Sin eso nadie puede ver ni cambiar nada, aunque conozca la dirección.

Para que la dirección sea más difícil de adivinar, puedes renombrar la carpeta `maestro` (por ejemplo `qv-panel-8k2`)
y cambiar la ruta en `js/acceso-oculto.js` (`location.href = 'maestro/'`).

## Crear el perfil de un cliente
1. Panel → **Nuevo cliente**.
2. Completa nombre, logo (opcional), WhatsApp, teléfono, redes, dirección y horarios.
   A la derecha ves el teléfono con el resultado en vivo.
3. **Guardar cambios** → aparece el **enlace NFC**: `tudominio.cl/cliente/?c=nombre-del-cliente`.
4. Graba ese enlace en la tarjeta NFC (y en el QR de respaldo). Si luego cambias datos, la tarjeta no se toca.

## Puesta en marcha con Supabase (una sola vez)
Sin esto el panel funciona en **modo demostración** (los datos quedan solo en tu navegador, sirve para probar).
1. Crea un proyecto en supabase.com.
2. **Authentication → Users → Add user**: crea tu usuario (correo + clave).
   Luego en **Authentication → Sign In / Providers** desactiva **"Allow new users to sign up"** para que nadie más pueda registrarse.
3. **SQL Editor**: pega `supabase/setup.sql`, cambia `TU_CORREO@ejemplo.cl` (2 veces en el archivo, 3 líneas) por tu correo y ejecuta.
4. **Project Settings → API**: copia la *Project URL* y la clave *anon / publishable*.
5. Pégalas en `js/qv-config.js` y sube todo a tu hosting.

## Archivos nuevos
- `cliente/index.html`, `css/20-cliente.css`, `js/cliente.js`: página del cliente (con animación de Q&V al escanear).
- `maestro/index.html`, `css/30-maestro.css`, `js/maestro.js`: panel maestro.
- `js/qv-core.js`, `js/qv-datos.js`, `js/qv-config.js`: lógica compartida y conexión a la base de datos.
- `js/acceso-oculto.js`: los 5 toques secretos. En `index.html` solo se añadió esa línea.
- `supabase/setup.sql`: tablas y reglas de seguridad.
