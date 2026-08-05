/* =============================================================================
   CONFIGURACIÓN – Clínica Témpora (versión vanilla)
   -----------------------------------------------------------------------------
   Este es el único archivo que hay que tocar para conectar el formulario.

   Como esta versión no tiene build, no hay variables de entorno: los valores
   van escritos acá. Es el modo normal para un Static Site de Render.

   Prioridad (se elige solo):

   1) Supabase directo  ->  rellena `supabase.url` y `supabase.anonKey`.
                            El navegador inserta en la tabla con la anon key.
                            La política RLS de supabase/schema.sql sólo permite
                            INSERT, así que esa key no puede leer nada.
                            👉 Es lo que corresponde para un sitio estático.

   2) Backend propio    ->  si algún día levantas la API de ../api en Render,
                            pon su URL en `apiBaseUrl` y tiene prioridad sobre
                            Supabase (así la service_role key queda en el
                            servidor y puedes sumar rate limit real).

   3) Modo demo         ->  sin ninguno de los dos, el formulario valida,
                            muestra el mensaje de éxito e imprime el payload en
                            la consola. Útil para maquetar o mostrar al cliente.
   ========================================================================== */

window.TEMPORA_CONFIG = {
  /* -------------------------------------------------------------- SUPABASE */
  supabase: {
    url: "",        // Ej: "https://xxxxxxxxxxxx.supabase.co"
    anonKey: "",    // anon/public key. NUNCA la service_role
    table: "leads"
  },

  /* ------------------------------------------------- BACKEND PROPIO (opc.) */
  // Ej: "https://tempora-leads-api.onrender.com"  (sin slash final)
  apiBaseUrl: "",
  leadsPath: "/api/leads",

  /* -------------------------------------------------------------- OPCIONES */
  options: {
    // Mensajes de la UI
    successMessage: "¡Listo! Recibimos tus datos y te llamaremos muy pronto.",
    errorMessage: "No pudimos enviar tus datos. Inténtalo de nuevo en un momento.",
    // Redirección opcional tras enviar (ej: "/gracias.html"). Vacío = sin redirección.
    redirectTo: "",
    // Evento de conversión: se dispara en window.dataLayer si existe GTM
    dataLayerEvent: "lead_form_submit",
    // Guarda el lead en localStorage si la red falla, para reintentar al volver
    retryOnReconnect: true
  }
};
