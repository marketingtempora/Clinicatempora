import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://implantecapilar.clinicatempora.cl',

  /**
   * 100% estático: `npm run build` deja HTML + CSS + JS en dist/, que es
   * exactamente lo que espera un Static Site de Render (o Netlify, Vercel,
   * Cloudflare Pages, un bucket S3...). No hay servidor ni adapter.
   *
   * El formulario escribe directo en Supabase desde el navegador con la anon
   * key. Si algún día quieres un backend propio, está en ../api y basta con
   * definir PUBLIC_API_BASE_URL: el formulario lo usa en vez de Supabase.
   */
  output: 'static',

  build: { inlineStylesheets: 'auto' },
});
