/// <reference types="astro/client" />

/**
 * Todas son PUBLIC_* porque el build es estático: viajan al navegador.
 * En un Static Site de Render se definen en Environment y Astro las inlinea
 * durante el build (hay que redeployar para que un cambio tome efecto).
 */
interface ImportMetaEnv {
  /** URL de Supabase. Ej: https://xxxxxxxx.supabase.co */
  readonly PUBLIC_SUPABASE_URL?: string;
  /** anon/public key de Supabase. NUNCA la service_role. */
  readonly PUBLIC_SUPABASE_ANON_KEY?: string;
  /** Tabla destino. Por defecto: leads */
  readonly PUBLIC_SUPABASE_TABLE?: string;
  /** Opcional: si defines un backend propio (../api), el form postea ahí en vez de Supabase. */
  readonly PUBLIC_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  /** Google Tag Manager, si está instalado en la página. */
  dataLayer?: Record<string, unknown>[];
}
