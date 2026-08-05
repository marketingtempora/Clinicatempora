# Versión vanilla

HTML + CSS + JS, sin build ni dependencias. Va tal cual a un **Static Site** de
Render (Publish Directory: `vanilla`), a un bucket, a un hosting por FTP o pegada
dentro de una plantilla de WordPress.

```
vanilla/
├── index.html            toda la landing
└── assets/
    ├── css/styles.css    hoja única, con índice de secciones arriba
    ├── js/config.js      ← el único archivo que hay que tocar
    ├── js/main.js        menú, reveals, contadores, carruseles, videos y formulario
    └── img/              imágenes del sitio original
```

## Probar en local

```bash
npx serve .
```

Abrir `index.html` directo también funciona, pero el formulario sólo puede enviar
de verdad si la página se sirve por HTTP.

## Conectar el formulario

Todo en [`assets/js/config.js`](assets/js/config.js). Como no hay build, no hay
variables de entorno: los valores van escritos ahí.

```js
window.TEMPORA_CONFIG = {
  supabase: {
    url: "https://xxxxxxxx.supabase.co",
    anonKey: "eyJhbGci...",   // anon key, NUNCA la service_role
    table: "leads"
  },
  apiBaseUrl: "",             // opcional: backend propio (../api)
  options: { redirectTo: "", successMessage: "...", /* ... */ }
};
```

Prioridad: `apiBaseUrl` → `supabase` → modo demo (valida y loguea en consola).

La anon key es pública por diseño: la política RLS del schema le permite sólo
INSERT, así que no puede leer ni modificar leads.

## Desplegar en Render

**New → Static Site**:

| Campo | Valor |
|---|---|
| Root Directory | *(vacío)* |
| Build Command | *(vacío)* |
| Publish Directory | `vanilla` |

## Detalles de implementación

- **CSS**: variables en `:root` con la paleta y la escala tipográfica del original.
  Breakpoints en 1199px (padding de seguridad), 1024px (tablet) y 767px (móvil),
  los mismos que usa Elementor en el sitio real. El archivo abre con un índice de
  las 15 secciones.
- **JS**: un solo IIFE, sin dependencias ni build. Sintaxis ES5 (`var`, sin arrow
  functions ni optional chaining) y APIs modernas (`fetch`, `Promise`,
  `IntersectionObserver`, `URLSearchParams`), o sea Chrome/Edge/Firefox/Safari
  de 2017 en adelante. ~540 líneas comentadas por bloques.
- **Videos**: se carga la miniatura y el `<iframe>` de YouTube sólo al hacer click.
- **Formulario**: 8 pasos, validación por paso, teléfono normalizado a 9 dígitos,
  campos vacíos omitidos (quedan `NULL` en la base), honeypot anti-bot, UTMs leídos
  de la URL y cola en `localStorage` para reintentar si falla la red.
- **Accesibilidad**: `skip-link`, labels en todos los campos, `aria-live` en los
  mensajes de error/éxito, foco visible y navegación por teclado en los carruseles.
