/**
 * Cliente de Supabase para el servidor.
 * Usa la SERVICE_ROLE key: ignora RLS y nunca debe salir del backend.
 */
import { createClient } from '@supabase/supabase-js';

let client = null;

export function getSupabase() {
  if (client) return client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    // Sin credenciales la API sigue viva (health check ok) pero /api/leads
    // responde 503 en lugar de reventar al arrancar.
    return null;
  }

  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { 'x-application-name': 'tempora-leads-api' } },
  });

  return client;
}

export const LEADS_TABLE = process.env.SUPABASE_LEADS_TABLE || 'leads';
