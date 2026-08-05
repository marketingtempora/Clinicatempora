/**
 * Validación del formulario. Corre en el navegador (la importa el <script> de
 * LeadForm.astro) y usa las mismas reglas que los CHECK de supabase/schema.sql
 * y que la API opcional de ../api. Si cambias una regla, cámbiala en los tres.
 */

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;

/** Opciones válidas de cada select, iguales a los CHECK de la base. */
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
} as const;

/**
 * Valida un campo y devuelve el mensaje de error, o null si está bien.
 * Es el que se usa paso a paso mientras la persona avanza.
 */
export function validateField(input: HTMLInputElement | HTMLSelectElement | null): string | null {
  if (!input) return null;
  const value = (input.value ?? '').trim();

  if (input.required && !value) return 'Este campo es obligatorio.';

  if (input instanceof HTMLInputElement) {
    if (input.type === 'email' && !EMAIL_RE.test(value)) {
      return 'Ingresa un email válido.';
    }
    if (input.type === 'tel' && value.replace(/\D/g, '').length !== 9) {
      return 'El teléfono debe tener 9 dígitos (ej: 912345678).';
    }
  }

  if ((input.name === 'nombre' || input.name === 'apellido') && value.length < 2) {
    return 'Ingresa al menos 2 caracteres.';
  }

  return null;
}

/**
 * Normaliza el payload antes de enviarlo:
 *   - teléfono sólo dígitos
 *   - email en minúsculas y sin espacios
 *   - se omiten los campos vacíos, así quedan NULL en la base en vez de ''
 *     (importante para los índices parciales y para filtrar por utm_source)
 */
export function normalizePayload(raw: Record<string, string>): Record<string, string> {
  const payload: Record<string, string> = {};

  for (const [key, value] of Object.entries(raw)) {
    const clean = (value ?? '').trim();
    if (clean === '') continue;
    payload[key] = clean;
  }

  if (payload.telefono) payload.telefono = payload.telefono.replace(/\D/g, '');
  if (payload.email) payload.email = payload.email.toLowerCase();

  return payload;
}
