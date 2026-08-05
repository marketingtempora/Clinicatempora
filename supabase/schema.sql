-- =============================================================================
-- Clínica Témpora – Implante capilar
-- Esquema de base de datos para capturar los leads de la landing.
--
-- Cómo aplicarlo:
--   Opción A (rápida): Supabase Dashboard -> SQL Editor -> pega este archivo -> Run
--   Opción B (CLI):    supabase db push   (con el archivo en supabase/migrations/)
--
-- Es idempotente: se puede volver a ejecutar sin romper nada.
-- =============================================================================

-- Extensión para gen_random_uuid()
create extension if not exists "pgcrypto";

-- =============================================================================
-- TABLA: leads
-- =============================================================================
create table if not exists public.leads (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  -- Datos del formulario (los 8 pasos)
  nombre            text not null,
  apellido          text not null,
  email             text not null,
  telefono          text not null,
  urgencia_cirugia  text,
  medio_evaluacion  text,
  genero            text,
  horario_contacto  text,

  -- Origen / atribución
  source_form       text default 'Providencia',
  utm_source        text,
  utm_medium        text,
  utm_campaign      text,
  utm_content       text,
  utm_term          text,
  campaign_id       text,
  page_url          text,
  referrer          text,

  -- Metadatos técnicos (los rellena la API, no el navegador)
  user_agent        text,
  ip_hash           text,

  -- Gestión comercial
  status            text not null default 'nuevo',
  assigned_to       text,
  notes             text,
  contacted_at      timestamptz,

  -- Validaciones a nivel de base de datos
  constraint leads_email_check
    check (email ~* '^[^@\s]+@[^@\s]+\.[a-z]{2,}$'),
  constraint leads_telefono_check
    check (telefono ~ '^[0-9]{9}$'),
  constraint leads_status_check
    check (status in ('nuevo', 'contactado', 'agendado', 'ganado', 'descartado')),
  constraint leads_urgencia_check
    check (urgencia_cirugia is null or urgencia_cirugia in (
      'Lo antes posible', 'Dentro de 6 meses', 'Entre 6 y 12 meses',
      'Después de un año', 'Sin fecha aún')),
  constraint leads_medio_check
    check (medio_evaluacion is null or medio_evaluacion in (
      'Presencial', 'A distancia', 'Busca información')),
  constraint leads_genero_check
    check (genero is null or genero in ('Hombre', 'Mujer', 'Otro')),
  constraint leads_horario_check
    check (horario_contacto is null or horario_contacto in (
      'Entre 9:00 y 14:00 hrs', 'Entre 14:00 y 18:00 hrs'))
);

comment on table public.leads is
  'Leads del formulario de la landing de implante capilar.';
comment on column public.leads.ip_hash is
  'Hash SHA-256 de la IP + salt. No guardamos la IP en claro.';
comment on column public.leads.status is
  'Estado comercial: nuevo -> contactado -> agendado -> ganado / descartado.';

-- =============================================================================
-- ÍNDICES
-- =============================================================================
create index if not exists leads_created_at_idx  on public.leads (created_at desc);
create index if not exists leads_status_idx      on public.leads (status);
create index if not exists leads_email_idx       on public.leads (lower(email));
create index if not exists leads_telefono_idx    on public.leads (telefono);
create index if not exists leads_utm_source_idx  on public.leads (utm_source)
  where utm_source is not null;

-- =============================================================================
-- TRIGGER: mantener updated_at
-- =============================================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists leads_set_updated_at on public.leads;
create trigger leads_set_updated_at
  before update on public.leads
  for each row execute function public.set_updated_at();

-- =============================================================================
-- RLS (Row Level Security)
-- -----------------------------------------------------------------------------
-- La service_role key (la que usa la API en Render) ignora RLS, así que la API
-- siempre puede insertar y leer.
--
-- La política de INSERT para anon existe SOLO para el modo "Supabase directo"
-- del front (config.js -> supabase.anonKey). Si vas a usar siempre la API de
-- Render, borra esa política: es más seguro.
-- =============================================================================
alter table public.leads enable row level security;

-- Insertar: permitido para anon y usuarios autenticados. Nada más.
drop policy if exists "leads_insert_anon" on public.leads;
create policy "leads_insert_anon"
  on public.leads
  for insert
  to anon, authenticated
  with check (true);

-- Leer: sólo usuarios autenticados (equipo comercial con login en Supabase).
-- El público con anon key NO puede leer los leads.
drop policy if exists "leads_select_authenticated" on public.leads;
create policy "leads_select_authenticated"
  on public.leads
  for select
  to authenticated
  using (true);

-- Actualizar: sólo usuarios autenticados (para cambiar status / notas).
drop policy if exists "leads_update_authenticated" on public.leads;
create policy "leads_update_authenticated"
  on public.leads
  for update
  to authenticated
  using (true)
  with check (true);

-- =============================================================================
-- VISTA: resumen diario para reportes
-- =============================================================================
create or replace view public.leads_daily_summary as
select
  date_trunc('day', created_at)::date        as dia,
  count(*)                                   as total,
  count(*) filter (where status = 'nuevo')       as nuevos,
  count(*) filter (where status = 'contactado')  as contactados,
  count(*) filter (where status = 'agendado')    as agendados,
  count(*) filter (where status = 'ganado')      as ganados,
  count(*) filter (where urgencia_cirugia = 'Lo antes posible') as urgentes,
  count(distinct utm_campaign)               as campanas
from public.leads
group by 1
order by 1 desc;

comment on view public.leads_daily_summary is
  'Leads por día con desglose de estados. Útil para el dashboard comercial.';
