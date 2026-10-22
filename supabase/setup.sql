-- Pega esto en Supabase > SQL Editor > Run (una sola vez)
create table if not exists clientes (
  id uuid primary key default gen_random_uuid(),
  creado timestamptz default now(), actualizado timestamptz default now(),
  slug text unique not null, nombre text not null, logo_url text,
  whatsapp text, whatsapp_mensaje text, telefono text, correo text,
  instagram text, facebook text, tiktok text, web text,
  direccion text, maps_url text, horarios jsonb, activo boolean default true
);
alter table clientes enable row level security;
create policy "publico lee activos" on clientes for select to anon using (activo = true);
create policy "dueno todo" on clientes for all to authenticated using (true) with check (true);

insert into storage.buckets (id, name, public) values ('logos','logos',true) on conflict do nothing;
create policy "logos publicos" on storage.objects for select using (bucket_id = 'logos');
create policy "dueno sube logos" on storage.objects for insert to authenticated with check (bucket_id = 'logos');
create policy "dueno edita logos" on storage.objects for update to authenticated using (bucket_id = 'logos');
create policy "dueno borra logos" on storage.objects for delete to authenticated using (bucket_id = 'logos');
