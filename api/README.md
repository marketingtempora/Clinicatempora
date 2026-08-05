# API de leads – Clínica Témpora (opcional)

> **Esto no hace falta para el Static Site.** La landing escribe directo en Supabase
> con la anon key y funciona sin ningún servidor.
>
> Este backend está acá por si más adelante lo necesitas. Lo que suma sobre el modo
> directo: rate limit por IP, la `service_role` key fuera del navegador, hash de la
> IP, webhook de aviso al entrar un lead y endpoints para que el equipo comercial
> liste y actualice leads.
>
> Para activarlo: despliégalo como **Web Service** en Render y pon su URL en
> `PUBLIC_API_BASE_URL` (Astro) o `apiBaseUrl` (vanilla). El formulario lo detecta
> y deja de hablar con Supabase directamente. Si nunca lo vas a usar, puedes borrar
> esta carpeta.

Servicio Express que recibe el formulario de la landing, lo valida y lo guarda en Supabase.
Pensado para Render, pero corre en cualquier host con Node 20+.

## Local

```bash
cd api
npm install
cp .env.example .env    # rellena SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY
npm run dev
```

Queda en <http://localhost:3000>.

## Endpoints

### `GET /health`

Healthcheck. Render lo usa para saber si el servicio está vivo.

```bash
curl http://localhost:3000/health
# {"ok":true,"service":"tempora-leads-api","supabase":true,"uptime":12,...}
```

### `POST /api/leads` — público

Lo llama la landing. Límite de 10 envíos por IP por minuto.

```bash
curl -X POST http://localhost:3000/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Ignacio",
    "apellido": "Tapia",
    "email": "ignacio@ejemplo.cl",
    "telefono": "912345678",
    "urgencia_cirugia": "Lo antes posible",
    "medio_evaluacion": "Presencial",
    "genero": "Hombre",
    "horario_contacto": "Entre 9:00 y 14:00 hrs",
    "utm_source": "google",
    "utm_campaign": "implante-capilar-brand"
  }'
```

Respuestas:

| Código | Cuándo |
|---|---|
| `201` | Lead guardado. Devuelve `{ ok, id, created_at }` |
| `200` | Honeypot relleno (bot). No guarda nada, pero no le avisa al bot |
| `422` | Datos inválidos. Devuelve `details` con el detalle campo por campo |
| `429` | Se pasó del límite por IP |
| `502` | Supabase devolvió error |
| `503` | Faltan `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` |

### `GET /api/leads` — privado

Requiere el header `x-admin-token`. Acepta `?limit=50&status=nuevo`.

```bash
curl http://localhost:3000/api/leads?limit=20 -H "x-admin-token: $ADMIN_TOKEN"
```

### `PATCH /api/leads/:id` — privado

Actualiza la gestión comercial del lead.

```bash
curl -X PATCH http://localhost:3000/api/leads/<uuid> \
  -H "x-admin-token: $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"contactado","notes":"Llamada 04/08, agenda para el 12"}'
```

`status` acepta: `nuevo`, `contactado`, `agendado`, `ganado`, `descartado`.
Al pasar a `contactado` se sella `contacted_at` automáticamente.

## Desplegar en Render

**Con blueprint** (recomendado): sube el repo, en Render entra a
**New → Blueprint**, elige el repo y confirma. Render lee `render.yaml`.

**A mano**: **New → Web Service** y configura

| Campo | Valor |
|---|---|
| Root Directory | `api` |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Health Check Path | `/health` |

Después rellena las variables de entorno del dashboard (ver `.env.example`).
`ADMIN_TOKEN` e `IP_HASH_SALT` los genera Render solo si usas el blueprint.

⚠️ Acuérdate de poner el dominio de la landing en `ALLOWED_ORIGINS`, o el navegador
bloqueará los envíos por CORS.

## Notas de seguridad

- La `service_role` key sólo vive acá. Nunca en el front.
- El token de admin se compara en tiempo constante (`crypto.timingSafeEqual`).
- No se guarda la IP: se guarda `sha256(salt + ip)` para poder detectar abuso
  sin almacenar un dato personal.
- El rate limit es en memoria: si algún día escalas a varias instancias, muévelo
  a Redis/Upstash o al rate limit del CDN.
