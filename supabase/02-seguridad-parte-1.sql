-- Q&V · Endurecimiento de seguridad · PARTE 1 (segura: no rompe nada, se puede ejecutar varias veces)
-- Supabase → SQL Editor → pega todo → Run.

-- 1) Función para pedir UN perfil por su enlace (así no hace falta que la lista completa sea pública)
create or replace function public.get_cliente(p_slug text)
returns setof public.clientes
language sql stable security definer set search_path = ''
as $$
  select * from public.clientes where slug = lower(p_slug) and activo = true limit 1;
$$;
revoke all on function public.get_cliente(text) from public;
grant execute on function public.get_cliente(text) to anon, authenticated;

-- 2) Límite del bucket de logos: solo imágenes png/jpg/webp de hasta 1 MB
--    (el panel ya reduce los logos a 640px, así que no afecta el uso normal)
update storage.buckets
   set file_size_limit = 1048576,
       allowed_mime_types = array['image/png','image/jpeg','image/webp']
 where id = 'client-logos';

-- 3) Comprobaciones (mira los resultados abajo):
select 'admins' as lista, email from public.admins;           -- debe salir SOLO tu correo real
select 'usuarios' as lista, email from auth.users;            -- no debe haber cuentas que no reconozcas
