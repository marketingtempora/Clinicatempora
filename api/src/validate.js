/**
 * Validación y normalización del payload del formulario.
 * Sin dependencias: las mismas reglas que valida el front y que valida Postgres.
 */

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[a-zA-Z]{2,}$/;

/** Opciones permitidas por cada select del formulario. */
export const ALLOWED = {
  urgencia_cirugia: [
    'Lo antes posible',
    'Dentro de 6 meses',
    'Entre 6 y 12 meses',
    'Después de un año',
    'Sin fecha aún',
  ],
  medio_evaluacion: ['Presencial', 'A distancia', 'Busca información'],
  genero: ['Hombre', 'Mujer', 'Otro'],
  horario_contacto: ['Entre 9:00 y 14:00 hrs', 'Entre 14:00 y 18:00 hrs'],
};

const TEXT_FIELDS = [
  'source_form',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'campaign_id',
  'page_url',
  'referrer',
];

function str(value, max = 500) {
  if (value === null || value === undefined) return null;
  const clean = String(value).trim().slice(0, max);
  return clean === '' ? null : clean;
}

/**
 * @param {Record<string, unknown>} body
 * @returns {{ ok: true, data: Record<string, unknown> } | { ok: false, errors: string[] }}
 */
export function validateLead(body) {
  const errors = [];
  const input = body && typeof body === 'object' ? body : {};

  const nombre = str(input.nombre, 80);
  const apellido = str(input.apellido, 80);
  const email = str(input.email, 160)?.toLowerCase() ?? null;
  const telefono = str(input.telefono, 20)?.replace(/\D/g, '') ?? null;

  if (!nombre || nombre.length < 2) errors.push('nombre: mínimo 2 caracteres.');
  if (!apellido || apellido.length < 2) errors.push('apellido: mínimo 2 caracteres.');
  if (!email || !EMAIL_RE.test(email)) errors.push('email: formato inválido.');
  if (!telefono || telefono.length !== 9) errors.push('telefono: debe tener 9 dígitos.');

  const data = { nombre, apellido, email, telefono };

  for (const [field, options] of Object.entries(ALLOWED)) {
    const value = str(input[field], 80);
    if (value === null) {
      data[field] = null;
      continue;
    }
    if (!options.includes(value)) {
      errors.push(`${field}: valor no permitido.`);
      continue;
    }
    data[field] = value;
  }

  for (const field of TEXT_FIELDS) {
    data[field] = str(input[field], field === 'page_url' || field === 'referrer' ? 800 : 200);
  }
  if (!data.source_form) data.source_form = 'Providencia';

  return errors.length ? { ok: false, errors } : { ok: true, data };
}

/** Detecta si el honeypot viene relleno (bot). */
export function isBot(body) {
  const trap = body?.honeypot ?? body?.empresa_web ?? '';
  return String(trap).trim() !== '';
}
