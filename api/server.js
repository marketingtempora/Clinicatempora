/**
 * =============================================================================
 * Clínica Témpora – API de leads
 * -----------------------------------------------------------------------------
 * Servicio Express pensado para Render (Web Service, plan free incluido).
 *
 *   GET  /health       -> healthcheck (Render lo usa para saber si está vivo)
 *   POST /api/leads    -> guarda un lead en Supabase
 *   GET  /api/leads    -> lista leads (requiere header x-admin-token)
 *   PATCH /api/leads/:id -> actualiza status/notas (requiere x-admin-token)
 *
 * Variables de entorno: ver .env.example
 * =============================================================================
 */
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { leadsRouter } from './src/routes/leads.js';
import { getSupabase } from './src/supabase.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1); // Render va detrás de un proxy
app.disable('x-powered-by');

/* ------------------------------------------------------------------- CORS */
const allowed = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((o) => o.trim().replace(/\/+$/, ''))
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Permite herramientas sin Origin (curl, Postman, healthchecks)
      if (!origin) return callback(null, true);
      // Sin lista configurada: modo abierto (útil en desarrollo)
      if (!allowed.length) return callback(null, true);
      const clean = origin.replace(/\/+$/, '');
      if (allowed.includes(clean)) return callback(null, true);
      return callback(new Error(`Origen no permitido: ${origin}`));
    },
    methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'x-admin-token'],
    maxAge: 86400,
  })
);

app.use(express.json({ limit: '32kb' }));

/* ------------------------------------------------- Rate limit en memoria */
/* Suficiente para una landing en un solo servicio. Si escalas a varias
   instancias, cambia esto por Upstash/Redis o el rate limit de Cloudflare. */
const HITS = new Map();
const WINDOW_MS = 60_000;
const MAX_HITS = Number(process.env.RATE_LIMIT_PER_MINUTE || 10);

function rateLimit(req, res, next) {
  const ip =
    (req.headers['x-forwarded-for'] || '').toString().split(',')[0].trim() ||
    req.socket.remoteAddress ||
    'unknown';
  const now = Date.now();
  const entry = HITS.get(ip);

  if (!entry || now - entry.start > WINDOW_MS) {
    HITS.set(ip, { start: now, count: 1 });
    return next();
  }
  entry.count += 1;
  if (entry.count > MAX_HITS) {
    res.set('Retry-After', String(Math.ceil((WINDOW_MS - (now - entry.start)) / 1000)));
    return res.status(429).json({ error: 'Demasiadas solicitudes. Inténtalo en un minuto.' });
  }
  return next();
}

// Limpieza periódica del mapa
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of HITS) {
    if (now - entry.start > WINDOW_MS) HITS.delete(ip);
  }
}, WINDOW_MS).unref();

/* ------------------------------------------------------------------ Rutas */
app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'tempora-leads-api',
    supabase: Boolean(getSupabase()),
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/leads', rateLimit, leadsRouter);

app.use((_req, res) => res.status(404).json({ error: 'Ruta no encontrada.' }));

// Handler de errores (incluye los rechazos de CORS)
app.use((err, _req, res, _next) => {
  const status = /Origen no permitido/.test(err.message) ? 403 : 500;
  if (status === 500) console.error('[api] error no manejado:', err);
  res.status(status).json({ error: err.message || 'Error interno.' });
});

app.listen(PORT, () => {
  console.log(`[api] escuchando en http://localhost:${PORT}`);
  console.log(`[api] supabase: ${getSupabase() ? 'conectado' : 'SIN CONFIGURAR'}`);
  console.log(`[api] orígenes permitidos: ${allowed.length ? allowed.join(', ') : '(todos)'}`);
});
