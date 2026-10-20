-- ============================================================
--  Regalo IA Montblanc · registro de solicitudes en Supabase
--  Pegar y ejecutar en:  Supabase → SQL Editor → New query → Run
-- ============================================================

-- 1) Tabla donde caen los registros de los clientes
create table if not exists public.solicitudes (
  id          bigint generated always as identity primary key,
  creado_en   timestamptz not null default now(),
  nombre      text not null,
  email       text not null,
  empresa     text not null,
  tema        text,
  herramienta text,
  nivel_ia    text,
  nivel_tema  text,
  curso       text,
  url_curso   text
);

-- 2) Activar Row Level Security (sin políticas, por defecto todo queda PROHIBIDO)
alter table public.solicitudes enable row level security;

-- 3) Única política: permitir SOLO insertar desde el navegador (rol anónimo).
--    No creamos política de SELECT/UPDATE/DELETE => nadie puede leer ni modificar
--    los datos desde la página. Tú los lees en el dashboard (rol service, salta RLS).
drop policy if exists "registro publico: solo insert" on public.solicitudes;
create policy "registro publico: solo insert"
  on public.solicitudes
  for insert
  to anon
  with check (true);

-- 4) Asegurar el permiso de INSERT para el rol anónimo (y el autenticado).
grant insert on public.solicitudes to anon, authenticated;

-- ----------------------------------------------------------------
-- Para revisar los registros manualmente (como dueño), desde el SQL Editor:
--   select creado_en, nombre, empresa, email, curso from public.solicitudes order by creado_en desc;
-- ----------------------------------------------------------------
