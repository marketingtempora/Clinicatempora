# Versión Astro

Build 100% estático: `npm run build` deja HTML + CSS + JS en `dist/`, que es lo que
espera un **Static Site** de Render. No hay servidor, ni adapter, ni endpoints.

```bash
npm install
cp .env.example .env    # pega la URL y la anon key de Supabase
npm run dev             # http://localhost:4321
npm run build           # genera dist/
npm run preview         # sirve dist/ para revisarlo
```

## Estructura

```
src/
├── pages/index.astro      la página: importa y ordena las 8 secciones
├── layouts/Layout.astro   <head>, metas, JSON-LD + scripts de reveal y contadores
├── data/content.ts        todo el copy, videos, imágenes y los 8 pasos del form
├── lib/validation.ts      reglas de validación (mismas que los CHECK de la base)
├── styles/global.css      tokens, reset y primitivos (botones, carrusel, video)
└── components/
    ├── Header.astro       logo + menú (hamburguesa <=1024px)
    ├── Hero.astro         banner, titulares y la tarjeta del formulario
    ├── LeadForm.astro     formulario de 8 pasos + envío a Supabase
    ├── Claim.astro        franja verde
    ├── Testimonials.astro carrusel de shorts
    ├── Results.astro      timeline 1/6/9/12 meses
    ├── HowItWorks.astro   features + video
    ├── WhyUs.astro        galería + tarjetas de estadísticas
    ├── CtaBand.astro      CTA final
    ├── Installments.astro cuotas
    ├── Footer.astro       dirección y horario
    ├── Carousel.astro     carrusel reutilizable (slot de slides)
    ├── YouTubeFacade.astro miniatura que carga el iframe al hacer click
    └── ShapeDivider.astro corte diagonal tipo Elementor
```

Los estilos de cada sección viven en el `<style>` de su componente; en `global.css`
está sólo el sistema de diseño y lo que se comparte entre secciones.

Para cambiar textos, videos o fotos casi nunca hay que abrir un componente:
está todo en [`src/data/content.ts`](src/data/content.ts).

## Variables de entorno

Ver [`.env.example`](.env.example). Todas son `PUBLIC_*` porque el build es estático:
Astro las inlinea en el JS que llega al navegador.

| Variable | Para qué |
|---|---|
| `PUBLIC_SUPABASE_URL` | proyecto de Supabase |
| `PUBLIC_SUPABASE_ANON_KEY` | anon key (pública por diseño, RLS sólo permite INSERT) |
| `PUBLIC_SUPABASE_TABLE` | tabla destino, por defecto `leads` |
| `PUBLIC_API_BASE_URL` | opcional: si defines un backend propio (`../api`), el form postea ahí en vez de Supabase |

Sin ninguna configurada, el formulario queda en modo demo: valida, muestra el
mensaje de éxito y escribe el payload en la consola.

⚠️ Nunca pongas la `service_role` key acá: acabaría dentro del JS público.

## Desplegar en Render

**New → Static Site** con:

| Campo | Valor |
|---|---|
| Root Directory | `astro` |
| Build Command | `npm ci && npm run build` |
| Publish Directory | `dist` |

Después las variables en **Environment**. Como se resuelven en build time, un
cambio necesita **Manual Deploy → Clear build cache & deploy**.

El blueprint [`../render.yaml`](../render.yaml) ya trae esta configuración con
headers de cache para `/_astro/*` y `/assets/*`.
