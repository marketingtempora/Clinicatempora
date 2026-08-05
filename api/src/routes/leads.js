/**
 * Rutas de leads.
 *
 *   POST /api/leads        -> crea un lead (público, lo llama la landing)
 *   GET  /api/leads        -> lista leads   (privado, requiere x-admin-token)
 *   PATCH /api/leads/:id   -> actualiza status/notas (privado)
 */
import { Router } from 'express';
import crypto from 'node:crypto';
import { getSupabase, LEADS_TABLE } from '../supabase.js';
import { validateLead, isBot } from '../validate.js';

export const leadsRouter = Router();

/* ---------------------------------------------------------------- helpers */

function hashIp(req) {
  const salt = process.env.IP_HASH_SALT || 'tempora';
  const ip =
    (req.headers['x-forwarded-for'] || '').toString().split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    '';
  if (!ip) return null;
  return crypto.createHash('sha256').update(salt + ip).digest('hex');
}

function requireAdmin(req, res, next) {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) {
    return res.status(503).json({ error: 'ADMIN_TOKEN no configurado en el servidor.' });
  }
  const given = req.get('x-admin-token') || '';
  // Comparación en tiempo constante
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  const ok = a.length === b.length && crypto.timingSafeEqual(a, b);
  if (!ok) return res.status(401).json({ error: 'No autorizado.' });
  next();
}

/** Notificación opcional a un webhook (Slack, Make, n8n, HubSpot...). */
async function notify(lead) {
  const url = process.env.LEAD_WEBHOOK_URL;
  if (!url) return;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `Nuevo lead: ${lead.nombre} ${lead.apellido} · ${lead.telefono} · ${lead.email} · ${lead.urgencia_cirugia ?? 's/f'}`,
        lead,
      }),
    });
  } catch (err) {
    console.error('[leads] webhook falló:', err.message);
  }
}

/* ------------------------------------------------------------ POST /leads */

leadsRouter.post('/', async (req, res) => {
  // Bot detectado por honeypot: respondemos 200 para no darle señal.
  if (isBot(req.body)) {
    console.warn('[leads] honeypot activado, descartado');
    return res.status(200).json({ ok: true });
  }

  const result = validateLead(req.body);
  if (!result.ok) {
    return res.status(422).json({ error: 'Datos inválidos.', details: result.errors });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return res.status(503).json({
      error: 'Base de datos no configurada. Falta SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.',
    });
  }

  const row = {
    ...result.data,
    user_agent: (req.get('user-agent') || '').slice(0, 400) || null,
    ip_hash: hashIp(req),
  };

  const { data, error } = await supabase
    .from(LEADS_TABLE)
    .insert(row)
    .select('id, created_at')
    .single();

  if (error) {
    console.error('[leads] error de Supabase:', error);
    return res.status(502).json({ error: 'No se pudo guardar el lead.' });
  }

  notify({ ...result.data, id: data.id }); // fire-and-forget

  return res.status(201).json({ ok: true, id: data.id, created_at: data.created_at });
});

/* ------------------------------------------------------------- GET /leads */

leadsRouter.get('/', requireAdmin, async (req, res) => {
  const supabase = getSupabase();
  if (!supabase) return res.status(503).json({ error: 'Base de datos no configurada.' });

  const limit = Math.min(parseInt(req.query.limit ?? '50', 10) || 50, 200);
  const status = req.query.status;

  let query = supabase
    .from(LEADS_TABLE)
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) {
    console.error('[leads] error de Supabase:', error);
    return res.status(502).json({ error: 'No se pudieron leer los leads.' });
  }

  return res.json({ ok: true, count: data.length, leads: data });
});

/* ---------------------------------------------------------- PATCH /leads/:id */

const STATUSES = ['nuevo', 'contactado', 'agendado', 'ganado', 'descartado'];

leadsRouter.patch('/:id', requireAdmin, async (req, res) => {
  const supabase = getSupabase();
  if (!supabase) return res.status(503).json({ error: 'Base de datos no configurada.' });

  const patch = {};
  if (req.body?.status !== undefined) {
    if (!STATUSES.includes(req.body.status)) {
      return res.status(422).json({ error: `status debe ser uno de: ${STATUSES.join(', ')}` });
    }
    patch.status = req.body.status;
    if (req.body.status === 'contactado') patch.contacted_at = new Date().toISOString();
  }
  if (req.body?.notes !== undefined) patch.notes = String(req.body.notes).slice(0, 2000);
  if (req.body?.assigned_to !== undefined) patch.assigned_to = String(req.body.assigned_to).slice(0, 120);

  if (!Object.keys(patch).length) {
    return res.status(422).json({ error: 'Nada que actualizar.' });
  }

  const { data, error } = await supabase
    .from(LEADS_TABLE)
    .update(patch)
    .eq('id', req.params.id)
    .select('id, status, updated_at')
    .single();

  if (error) {
    console.error('[leads] error de Supabase:', error);
    return res.status(502).json({ error: 'No se pudo actualizar el lead.' });
  }

  return res.json({ ok: true, lead: data });
});
