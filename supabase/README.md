# Base de datos – leads de la landing

## Aplicar el schema

**Opción rápida:** Dashboard de Supabase → *SQL Editor* → pega
[`schema.sql`](schema.sql) → **Run**. Es idempotente, se puede repetir sin romper nada.

**Con la CLI:**

```bash
supabase link --project-ref <tu-ref>
supabase db push
```

## La tabla `leads`

| Grupo | Columnas |
|---|---|
| Identidad | `id` (uuid), `created_at`, `updated_at` |
| Formulario | `nombre`, `apellido`, `email`, `telefono`, `urgencia_cirugia`, `medio_evaluacion`, `genero`, `horario_contacto` |
| Atribución | `source_form`, `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `campaign_id`, `page_url`, `referrer` |
| Técnico | `user_agent`, `ip_hash` |
| Gestión | `status`, `assigned_to`, `notes`, `contacted_at` |

Las validaciones están también en la base (`CHECK`), no sólo en el front:
email con formato, teléfono de exactamente 9 dígitos y las opciones de cada
select restringidas a los valores del formulario. Si alguien intenta insertar
basura por la API REST, Postgres lo rechaza.

## RLS

RLS está activo. Las políticas que crea el schema:

| Política | Rol | Permite |
|---|---|---|
| `leads_insert_anon` | `anon`, `authenticated` | sólo INSERT |
| `leads_select_authenticated` | `authenticated` | SELECT |
| `leads_update_authenticated` | `authenticated` | UPDATE |

La `service_role` key ignora RLS, así que un backend (por ejemplo el de `../api`)
siempre puede leer y escribir.

`leads_insert_anon` es la política que hace posible que la landing estática escriba
directo desde el navegador con la anon key. **No la borres** si estás usando el
Static Site: es justo la que necesita el formulario.

Lo importante: con la anon key nadie puede **leer** los leads. Sólo insertar.
Para verlos hay que entrar al dashboard de Supabase, loguearse con un usuario
(`authenticated`) o usar la `service_role` desde un servidor.

## Frenar spam en la tabla (opcional)

Como el endpoint de INSERT es público, alguien podría inyectar leads falsos.
La validación (`CHECK`) evita que entre basura, pero no un volumen alto de envíos.
Si te pasa, este trigger limita a 3 inserciones por hora y por teléfono sin
necesidad de backend:

```sql
create or replace function public.leads_rate_limit()
returns trigger
language plpgsql
as $$
declare
  recientes int;
begin
  select count(*) into recientes
  from public.leads
  where telefono = new.telefono
    and created_at > now() - interval '1 hour';

  if recientes >= 3 then
    raise exception 'Demasiados envíos con este teléfono. Inténtalo más tarde.';
  end if;

  return new;
end;
$$;

create trigger leads_rate_limit_trigger
  before insert on public.leads
  for each row execute function public.leads_rate_limit();
```

Para quitarlo: `drop trigger leads_rate_limit_trigger on public.leads;`

Si el spam viene de muchos teléfonos distintos, ahí conviene el backend de
`../api` (rate limit por IP) o poner Cloudflare delante.

## Consultas útiles

Leads de hoy:

```sql
select created_at, nombre, apellido, telefono, urgencia_cirugia, utm_source
from leads
where created_at >= current_date
order by created_at desc;
```

Rendimiento por campaña:

```sql
select coalesce(utm_campaign, '(directo)') as campana,
       count(*) as leads,
       count(*) filter (where status in ('agendado','ganado')) as convertidos
from leads
group by 1
order by leads desc;
```

Resumen diario (usa la vista que crea el schema):

```sql
select * from leads_daily_summary limit 30;
```

Posibles duplicados (mismo teléfono más de una vez):

```sql
select telefono, count(*), max(created_at) as ultimo
from leads
group by telefono
having count(*) > 1
order by ultimo desc;
```

## Ideas para después

- **Aviso por correo/Slack**: ya está el hook. Define `LEAD_WEBHOOK_URL` en la API
  (Slack incoming webhook, Make, n8n) y avisa en cada lead nuevo.
- **Panel para el equipo comercial**: con `GET /api/leads` y `PATCH /api/leads/:id`
  se puede montar una tabla simple sin tocar la base a mano.
- **Retención**: si quieren borrar leads antiguos por política de datos, se hace con
  un cron (`pg_cron`) que borre lo que pase de X meses.
