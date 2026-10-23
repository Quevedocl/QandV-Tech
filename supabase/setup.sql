-- Q&V Clientes · configuración de Supabase (se puede ejecutar varias veces sin romper nada)
-- Seguridad: solo los correos de la tabla "admins" pueden crear/editar/borrar. El público solo LEE clientes activos.

create table if not exists public.admins (
  email text primary key check (email = lower(email)),
  created_at timestamptz default now()
);
alter table public.admins enable row level security;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admins a where a.email = lower(auth.jwt() ->> 'email'));
$$;

drop policy if exists "admins read admins" on public.admins;
create policy "admins read admins" on public.admins for select to authenticated using ((select public.is_admin()));

-- >>> CAMBIA ESTE CORREO por el tuyo (el mismo con el que entras al panel) <<<
insert into public.admins (email) values (lower('TU_CORREO@ejemplo.cl')) on conflict do nothing;

create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  creado timestamptz default now(), actualizado timestamptz default now(),
  slug text unique not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 2 and 40),
  nombre text not null check (char_length(nombre) between 1 and 160),
  logo_url text, whatsapp text, whatsapp_mensaje text, telefono text, correo text,
  instagram text, facebook text, tiktok text, web text,
  direccion text, maps_url text,
  horarios jsonb check (horarios is null or jsonb_typeof(horarios) = 'object'),
  activo boolean default true
);
alter table public.clientes enable row level security;

drop policy if exists "publico lee clientes activos" on public.clientes;
-- (La lectura pública ya no es sobre la tabla completa: el público pide un perfil con get_cliente)
create or replace function public.get_cliente(p_slug text)
returns setof public.clientes
language sql stable security definer set search_path = ''
as $$ select * from public.clientes where slug = lower(p_slug) and activo = true limit 1; $$;
revoke all on function public.get_cliente(text) from public;
grant execute on function public.get_cliente(text) to anon, authenticated;
drop policy if exists "admins leen clientes" on public.clientes;
create policy "admins leen clientes" on public.clientes for select to authenticated using ((select public.is_admin()));
drop policy if exists "admins crean clientes" on public.clientes;
create policy "admins crean clientes" on public.clientes for insert to authenticated with check ((select public.is_admin()));
drop policy if exists "admins editan clientes" on public.clientes;
create policy "admins editan clientes" on public.clientes for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists "admins borran clientes" on public.clientes;
create policy "admins borran clientes" on public.clientes for delete to authenticated using ((select public.is_admin()));

-- Logos (bucket público para leer; solo admins suben)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values ('client-logos', 'client-logos', true, 1048576, array['image/png','image/jpeg','image/webp']) on conflict (id) do update set file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
drop policy if exists "admins upload logos" on storage.objects;
create policy "admins upload logos" on storage.objects for insert to authenticated with check (bucket_id = 'client-logos' and (select public.is_admin()));
drop policy if exists "admins update logos" on storage.objects;
create policy "admins update logos" on storage.objects for update to authenticated using (bucket_id = 'client-logos' and (select public.is_admin())) with check (bucket_id = 'client-logos' and (select public.is_admin()));
drop policy if exists "admins delete logos" on storage.objects;
create policy "admins delete logos" on storage.objects for delete to authenticated using (bucket_id = 'client-logos' and (select public.is_admin()));
drop policy if exists "admins list logos" on storage.objects;
create policy "admins list logos" on storage.objects for select to authenticated using (bucket_id = 'client-logos' and (select public.is_admin()));

-- ============ Tema de la página principal (Halloween, Navidad, etc.) ============
-- El público LEE el tema; solo los admins lo pueden cambiar. Se puede ejecutar varias veces.
create table if not exists public.site_config (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);
alter table public.site_config enable row level security;
drop policy if exists "publico lee config" on public.site_config;
create policy "publico lee config" on public.site_config for select to anon, authenticated using (true);
drop policy if exists "admins crean config" on public.site_config;
create policy "admins crean config" on public.site_config for insert to authenticated with check ((select public.is_admin()));
drop policy if exists "admins editan config" on public.site_config;
create policy "admins editan config" on public.site_config for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
insert into public.site_config (key, value) values ('tema', '{"modo":"auto"}'::jsonb) on conflict do nothing;
