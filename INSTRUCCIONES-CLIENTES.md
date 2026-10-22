# Q&V Clientes — cómo funciona y cómo ponerlo en marcha

## Cómo entrar al panel maestro (solo tú)
1. **Desde el celular o PC:** abre tu página.
   Toca **5 veces seguidas el logo Q&V de la esquina superior izquierda**. Te lleva al panel.
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

## Puesta en marcha con Supabase
Este proyecto ya viene conectado (`js/qv-config.js`) al proyecto **QandV-Tech** de Supabase, con las tablas, permisos y el bucket `client-logos` creados.
Solo puede entrar al panel el correo que esté en la tabla `admins`.
Si algún día lo montas en otro proyecto de Supabase: ejecuta `supabase/setup.sql` (cambiando `TU_CORREO@ejemplo.cl`),
crea tu usuario en **Authentication → Users**, desactiva **Allow new users to sign up** y pega la URL y la clave publishable en `js/qv-config.js`.

## Archivos nuevos
- `cliente/index.html`, `css/20-cliente.css`, `js/cliente.js`: página del cliente (con animación de Q&V al escanear).
- `maestro/index.html`, `css/30-maestro.css`, `js/maestro.js`: panel maestro.
- `js/qv-core.js`, `js/qv-datos.js`, `js/qv-config.js`: lógica compartida y conexión a la base de datos.
- `js/acceso-oculto.js`: los 5 toques secretos al logo de la esquina.
- `perfil.html`: formato anterior (`?id=...`, tabla `client_profiles`). Los enlaces antiguos `?d=...` están apagados por seguridad (se activan con `PERMITIR_ENLACES_ANTIGUOS` dentro del archivo).
- `supabase/setup.sql`: tablas y reglas de seguridad.
