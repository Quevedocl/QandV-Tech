-- Q&V · Endurecimiento de seguridad · PARTE 2
-- EJECUTAR SOLO DESPUÉS de subir js/qv-datos.js nuevo a GitHub y comprobar que un perfil abre bien.
-- Quita la lectura pública de la tabla completa: desde ahora solo se puede pedir un perfil a la vez.

drop policy if exists "publico lee clientes activos" on public.clientes;
