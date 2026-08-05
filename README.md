# Clínica Témpora – Landing de implante capilar

Réplica en código de <https://implantecapilar.clinicatempora.cl/> (WordPress + Elementor),
en **dos versiones** que renderizan idéntico, más la base de datos en **Supabase**
para guardar los leads del formulario.

Las dos versiones son **sitios estáticos**: se despliegan como *Static Site* en Render
sin ningún servidor corriendo.

---

## Cómo está ordenado el repo

```
Clinica Tempora/
│
├── README.md              este archivo
├── render.yaml            blueprint de Render con los dos Static Site
├── .gitignore
│
├── vanilla/               ── VERSIÓN 1: HTML + CSS + JS, sin build ────────────
│   ├── index.html             la landing completa (una sola página)
│   ├── README.md
│   └── assets/
│       ├── css/styles.css     hoja única, con índice de secciones arriba
│       ├── js/config.js       👈 acá van las keys de Supabase
│       ├── js/main.js         menú, animaciones, carruseles, videos, formulario
│       └── img/               13 imágenes del sitio original
│
├── astro/                 ── VERSIÓN 2: Astro 5, build estático ──────────────
│   ├── README.md
│   ├── package.json           única dependencia: astro
│   ├── astro.config.mjs       output: 'static' (sin adapter, sin servidor)
│   ├── .env.example           👈 acá van las keys de Supabase
│   ├── public/assets/img/     las mismas 13 imágenes
│   └── src/
│       ├── pages/index.astro      la página: ordena las 8 secciones
│       ├── layouts/Layout.astro   <head>, metas, JSON-LD, reveals y contadores
│       ├── data/content.ts        👈 todo el copy, videos, fotos y los 8 pasos
│       ├── styles/global.css      tokens + primitivos (botones, carrusel, video)
│       ├── lib/validation.ts      reglas de validación del formulario
│       └── components/            13 componentes, uno por bloque
│           ├── Header · Hero · LeadForm · Claim · Testimonials
│           ├── Results · HowItWorks · WhyUs · CtaBand · Installments · Footer
│           └── Carousel · YouTubeFacade · ShapeDivider   (reutilizables)
│
├── supabase/              ── BASE DE DATOS ──────────────────────────────────
│   ├── schema.sql             tabla leads + validaciones + índices + RLS
│   └── README.md              cómo aplicarlo y consultas útiles
│
├── tools/                 ── UTILIDADES ─────────────────────────────────────
│   ├── optimize-assets.mjs    genera webp/srcset, fuentes y miniaturas
│   ├── fingerprint.js         saca la huella de layout de una página
│   ├── collector.js           la recibe y la guarda
│   ├── diff.js                compara dos huellas y lista diferencias
│   └── README.md              cómo volver a verificar la fidelidad
│
└── api/                   ── BACKEND OPCIONAL (no hace falta) ───────────────
    ├── server.js              Express para Render Web Service
    ├── src/                   validación, cliente de Supabase, rutas
    ├── render.yaml
    └── README.md
```

**La regla para orientarse:** cada versión de la landing es autosuficiente y no
depende de la otra. `supabase/` es común a las dos. `api/` sólo entra en juego si
algún día quieres un backend propio; para el Static Site **no se usa**.

### Dónde tocar según lo que quieras cambiar

| Quiero… | vanilla | astro |
|---|---|---|
| cambiar un texto | `index.html` | `src/data/content.ts` |
| cambiar un color / tamaño | `assets/css/styles.css` (bloque 01, tokens) | `src/styles/global.css` (bloque 01, tokens) |
| cambiar el estilo de una sección | `styles.css`, bloque numerado de esa sección | el `<style>` de su componente |
| cambiar un video de YouTube | el `data-video-id` en `index.html` | `src/data/content.ts` |
| conectar el formulario | `assets/js/config.js` | variables `PUBLIC_*` en `.env` / Render |
| agregar GTM o píxeles | `<head>` de `index.html` | `src/layouts/Layout.astro` |

### Cuál usar

| | `vanilla/` | `astro/` |
|---|---|---|
| Build | ninguno | `npm run build` |
| Publish dir en Render | `vanilla` | `dist` |
| Config del form | escrita en `config.js` | variables de entorno del build |
| Ideal para | subir y listo, o pegarla dentro de un WordPress | mantenerla, hacer variantes A/B, sumar páginas |

Ambas producen **la misma maqueta**: mismos tokens, mismas proporciones de columna,
mismos breakpoints (1024px y 767px) y el mismo alto de sección que el original.

---

## Desplegar en Render (Static Site)

### Versión Astro

**New → Static Site**, conectas el repo y configuras:

| Campo | Valor |
|---|---|
| Root Directory | `astro` |
| Build Command | `npm ci && npm run build` |
| Publish Directory | `dist` |

Y en **Environment**:

```
PUBLIC_SUPABASE_URL        = https://xxxxxxxx.supabase.co
PUBLIC_SUPABASE_ANON_KEY   = eyJhbGci...   (anon key, no la service_role)
PUBLIC_SUPABASE_TABLE      = leads
```

> Al ser un build estático, esas variables se "cocinan" dentro del JS durante el
> build. Si cambias una en Render hay que hacer **Manual Deploy → Clear build cache
> & deploy** para que tome efecto.

### Versión vanilla

**New → Static Site**:

| Campo | Valor |
|---|---|
| Root Directory | *(vacío)* |
| Build Command | *(vacío)* |
| Publish Directory | `vanilla` |

Acá no hay variables de entorno porque no hay build: las keys van escritas en
[`vanilla/assets/js/config.js`](vanilla/assets/js/config.js).

### Con el blueprint

También puedes hacer **New → Blueprint** apuntando al repo: [`render.yaml`](render.yaml)
ya define los dos sitios con sus headers de cache. Sólo tendrás que rellenar las
keys de Supabase en el dashboard.

---

## Conectar el formulario a Supabase

El formulario son 8 pasos (uno por pregunta) con barra de progreso, igual que el
original: nombre → apellido → email → teléfono → cuándo → medio de evaluación →
género → horario.

### 1. Crear la base

1. Proyecto nuevo en <https://supabase.com>.
2. *SQL Editor* → pega [`supabase/schema.sql`](supabase/schema.sql) → **Run**.
3. De *Project Settings → API* copia la `URL` y la `anon key`.

### 2. Pegar las keys

- **vanilla** → `assets/js/config.js`:

  ```js
  supabase: {
    url: "https://xxxxxxxx.supabase.co",
    anonKey: "eyJhbGci...",
    table: "leads"
  }
  ```

- **astro** → variables de entorno en Render (o `.env` en local).

Con eso el navegador inserta directo en la tabla. Si no configuras nada, el
formulario queda en **modo demo**: valida, muestra el mensaje de éxito y escribe
el payload en la consola. Sirve para maquetar y para revisar con el cliente.

### Sobre la anon key en el navegador

Es pública por diseño y no es un descuido: la política RLS del schema le permite
**sólo INSERT** en `leads`. Con esa key nadie puede leer, editar ni borrar leads
(para leerlos hay que entrar a Supabase o usar la `service_role`, que nunca sale
del lado servidor).

Lo que sí queda expuesto es que alguien podría **inyectar leads falsos** llamando
al endpoint. Mitigaciones que ya están: honeypot anti-bot, validación en el
navegador y `CHECK` en la base (email con formato, teléfono de 9 dígitos, opciones
de los selects restringidas), así que no se puede meter basura en la tabla.

Si en algún momento el spam se vuelve un problema, hay dos caminos:

1. **Trigger de rate limit en Postgres** (sigue siendo estático) — hay un snippet
   listo en [`supabase/README.md`](supabase/README.md).
2. **Levantar el backend de [`api/`](api/README.md)** como Web Service en Render y
   apuntar el formulario ahí (`PUBLIC_API_BASE_URL` / `apiBaseUrl`). Suma rate limit
   por IP, hash de IP, webhook de aviso y deja la `service_role` en el servidor.
   El código ya está y probado; sólo hay que desplegarlo.

---

## Desarrollo local

```bash
# vanilla
npx serve vanilla

# astro
cd astro && npm install && npm run dev     # http://localhost:4321
```

---

## Qué incluye la réplica

- **Header** con logo y menú (bajo 1024px pasa a hamburguesa, que **se despliega
  animada**: el panel crece, los ítems entran escalonados y el icono gira a una X).
- **Hero** con banner distinto en escritorio y móvil, overlay al 28%, corte diagonal
  (*shape divider*) y la tarjeta del formulario multi-paso.
- **Franja** "Recupera tu confianza sin dolor."
- **Testimonios**: carrusel de 3 shorts de YouTube (3 visibles en escritorio, 2 en
  tablet, 1 en móvil), con flechas, puntos, teclado y **arrastre con mouse y con el
  dedo** (Pointer Events + `touch-action: pan-y`, así el scroll vertical sigue intacto).
- **Resultados**: línea de tiempo 1 / 6 / 9 / 12 meses con el conector y los puntos verdes.
- **Cómo funciona**: 5 features con check, video 16:9 y barra con el título.
- **Por qué elegirnos**: carrusel de fotos con autoplay y arrastre, y las dos tarjetas
  de estadísticas con contador animado (10+ años, 2k+ cirugías).
- **CTA**, **cuotas** y **footer** con dirección y horario.
- Animaciones de entrada (`fadeIn` / `fadeInRight` / `fadeInUp`) con IntersectionObserver.
- `prefers-reduced-motion` respetado en animaciones, contadores y carruseles.

### Optimización de assets

Todo lo que se sirve al navegador lo genera [`tools/optimize-assets.mjs`](tools/optimize-assets.mjs)
(`node tools/optimize-assets.mjs`), y escribe en las dos versiones a la vez:

- **`srcset` en toda imagen con más de un tamaño útil.** El logo del header pasó de
  un PNG de 2560px (25 KB) a 229px/458px en webp (4,6 / 9,7 KB): se servía once veces
  más grande de lo que se muestra. La galería tiene 400w y 768w, así que un teléfono
  baja 8 KB por foto en vez de 25 KB.
- **Fuentes autoalojadas y subseteadas.** Nada de Google Fonts: los woff2 viven en
  `assets/fonts/` recortados al repertorio del español (ASCII imprimible + acentos +
  signos + el ✓ del hero). Las dos caras de la primera pantalla van con `rel=preload`.
  Si algún día el copy necesita un carácter fuera de ese juego, hay que ampliar
  `CHARSET` en el script y volver a correrlo.
- **Miniaturas de YouTube servidas en local**, en webp. Antes eran 4 peticiones a
  `i.ytimg.com`.

Resultado: las imágenes bajo el pliegue bajaron de 247 KB a 79 KB y la página no hace
**ninguna** petición a un dominio externo. Comprobado que la maqueta no se movió: las
dos versiones siguen midiendo 3709px con 3px de desvío, y el texto del footer mide los
mismos 434px que con las fuentes de Google (son las mismas caras, mismas métricas).

### Mejoras respecto al original

Cosas que cambié a propósito, no por descuido:

- **Videos con *facade***: se carga la miniatura y el iframe de YouTube sólo al hacer
  click. El original monta 4 embeds en la carga inicial (~1,5 MB de JS de terceros).
- **Sin jQuery, sin Swiper, sin Elementor**: el carrusel son ~120 líneas propias.
  La versión Astro pesa 4,3 kB de JS (2 kB gzip).
- **Formulario endurecido**: honeypot, validación por paso, teléfono sólo dígitos,
  campos vacíos omitidos (quedan `NULL`, no `''`), reintento automático si se cae la
  red (cola en `localStorage`) y evento `lead_form_submit` para `dataLayer` si hay GTM.
  El mensaje de error va **debajo** del campo (como en Elementor), el foco vuelve al
  campo al pulsar «Volver», y el paso activo está acotado y se re-muestra en cada
  render: el formulario no puede quedarse sin ningún campo visible.
- **Accesibilidad**: `skip-link`, labels reales en todos los campos (los tres primeros
  visualmente ocultos, como en el original), foco visible, `aria-live` en los mensajes.
- **SEO**: metas, Open Graph y JSON-LD de `MedicalClinic` con dirección y horario.

### Desviaciones deliberadas (medidas y documentadas)

Tres cosas donde **no** copié el original, y por qué:

1. **Testimonios en tablet (768–1024px)**: el original calcula el ancho de los slides
   desde la sección y no desde su columna, así que los videos se salen del contenedor
   (quedan de 350px en una columna de ~526px) y el recorte los tapa. La réplica ajusta
   dos slides al ancho real. Eso hace la sección 163px más baja que el original en ese
   rango. Replicar el desborde habría sido copiar un bug.
2. **Un espacio suelto**: el párrafo de la franja verde termina con un espacio antes de
   `</p>` en el WordPress original, lo que corre el texto centrado 2,5px a la izquierda.
   La réplica queda centrada de verdad.
3. **Nota legal de cuotas en móvil**: en el original ocupa el 80% del ancho y parte en
   3 líneas; lo replico, pero la sección queda 9px más baja por cómo Elementor anida
   contenedores.

### Lo que no está (y hay que decidir)

- **Píxeles y tags**: el original carga GTM (`GTM-58K95WQ`), GA4, Google Ads,
  Meta Pixel y Microsoft Clarity. No los incluí para no dejar IDs de terceros
  pegados en el código. Cuando definas cuáles van, se agregan en el `<head>`
  (`vanilla/index.html` o `astro/src/layouts/Layout.astro`).
- **Imágenes de resultados en retina**: se sirven a 219×147 px porque así las tiene el
  original y no hay fuente mayor. Si el cliente pasa los archivos originales, basta
  añadirlas a `PHOTOS` en `tools/optimize-assets.mjs` para tener la versión 2x.
- **Página de gracias**: `config.js → options.redirectTo` está listo pero apunta a nada.

---

## Cómo se verificó

El método: un script recorre el DOM de las tres páginas (original, vanilla, Astro) y
saca una **huella de layout** — para cada texto, imagen, campo y botón registra su
posición exacta (rect real de los glifos vía `Range`), tamaño, tipografía y color,
relativos a su sección. Después se diferencian elemento por elemento.

**Escritorio (1440×900)** — documento: **3709px en las tres**.

| Sección | Original | Réplica |
|---|---|---|
| header | 100 | 100 |
| hero | 470 | 470 |
| franja verde | 212 | 213 |
| testimonios | 564 | 564 |
| resultados | 618 | 618 |
| cómo funciona | 581 | 581 |
| por qué elegirnos | 534 | 533 |
| CTA | 254 | 254 |
| cuotas | 186 | 185 |
| footer | 190 | 190 |

Desvío total: **3px** en toda la página. En el diff elemento por elemento no queda
ninguna diferencia real de posición, tamaño, tipografía ni color.

**Tablet (900px)**: desvío total 56px sobre 3700 (1,5%).
**Móvil (390px)**: desvío total 53px sobre 6458 (0,8%).

**Barrido de anchos**: 320, 360, 390, 414, 480, 600, 700, 767, 768, 834, 900, 1024,
1025, 1180, 1280, 1440 y 1920px. En ninguno hay scroll horizontal ni un solo elemento
que se salga del viewport.

**Peso en móvil** (versión Astro construida):

| | |
|---|---|
| Primera pantalla | **142 KB** — HTML+CSS+JS 62, dos fuentes precargadas 56, banner + logo 24 |
| Resto de fuentes | 54 KB |
| Imágenes bajo el pliegue (lazy) | 79 KB |
| **Total** | **275 KB** |
| Peticiones a dominios externos | **0** |

El JS son 4,3 KB (2 KB gzip).
- **Formulario**: probado de punta a punta en las dos versiones. Validación por paso,
  progreso 12→25→37→50→62→75→87→100%, teléfono `"9 8765 4321"` → `987654321`,
  email con espacios y mayúsculas normalizado, UTMs y `gclid` leídos de la URL.
- **Envío a Supabase**: verificado contra un stub que imita su API REST. Las dos
  versiones mandan `POST /rest/v1/leads` con `apikey`, `Authorization: Bearer` y
  `Prefer: return=minimal`, sin el honeypot y sin campos vacíos.
- **API opcional**: probada en local (`health`, alta válida, 422 con detalle, honeypot,
  401 sin token, 403 por CORS, 429 al pasar los 10 envíos/minuto por IP).
