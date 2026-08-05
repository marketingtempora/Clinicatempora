/**
 * =============================================================================
 * Optimización de assets
 * -----------------------------------------------------------------------------
 * Genera todo lo que la landing sirve al navegador y que no conviene versionar
 * a mano:
 *
 *   1. Variantes de imagen (webp + tamaños 1x/2x) para poder usar srcset.
 *   2. Miniaturas de los videos de YouTube, servidas en local en webp.
 *   3. Las fuentes de Google autoalojadas (woff2 latin + latin-ext) y su
 *      fonts.css con los @font-face.
 *
 * Todo se escribe en las dos versiones (vanilla/ y astro/public/) para que
 * rendericen idéntico.
 *
 * Uso:  node tools/optimize-assets.mjs
 * =============================================================================
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const require = createRequire(path.join(ROOT, 'astro/'));
const sharp = require('sharp'); // viene con astro

const DESTS = [path.join(ROOT, 'vanilla/assets'), path.join(ROOT, 'astro/public/assets')];
const SRC_IMG = path.join(ROOT, 'vanilla/assets/img');

const log = (...a) => console.log(...a);
const kb = (f) => (fs.statSync(f).size / 1024).toFixed(1) + ' KB';

function outDirs(sub) {
  return DESTS.map((d) => {
    const p = path.join(d, sub);
    fs.mkdirSync(p, { recursive: true });
    return p;
  });
}

function writeAll(sub, name, buf) {
  for (const dir of outDirs(sub)) fs.writeFileSync(path.join(dir, name), buf);
}

/* ============================================================ 1. IMÁGENES */

/** Fotos: webp a los anchos que realmente se muestran (1x y 2x). */
const PHOTOS = [
  // galería de "por qué elegirnos": 513px en escritorio, ~380 en móvil
  { src: 'clinica-consulta-1.webp', widths: [400, 768] },
  { src: 'clinica-precirugia.webp', widths: [400, 768] },
  { src: 'clinica-consulta-2.webp', widths: [400, 768] },
  // resultados: el original ya los sirve a 219x147, no hay fuente mayor
  { src: 'resultado-1-mes.png', widths: [219] },
  { src: 'resultado-6-meses.png', widths: [219] },
  { src: 'resultado-9-meses.png', widths: [219] },
  { src: 'resultado-12-meses.png', widths: [219] },
];

/** Logos: mantienen alfa, así que se generan en webp y png. */
const LOGOS = [
  { src: 'logo-tempora.png', widths: [229, 458], png: true },
  { src: 'logo-tempora-blanco.webp', widths: [321, 642], png: false },
];

async function buildImages() {
  log('\n=== 1. Variantes de imagen ===');
  for (const { src, widths } of PHOTOS) {
    const base = src.replace(/\.(png|webp|jpg)$/i, '');
    const meta = await sharp(path.join(SRC_IMG, src)).metadata();
    for (const w of widths) {
      if (w > meta.width) continue; // nunca escalar hacia arriba
      const buf = await sharp(path.join(SRC_IMG, src))
        .resize({ width: w, withoutEnlargement: true })
        .webp({ quality: 82, effort: 6 })
        .toBuffer();
      writeAll('img', `${base}-${w}.webp`, buf);
      log(`  ${base}-${w}.webp`.padEnd(38) + (buf.length / 1024).toFixed(1) + ' KB');
    }
  }

  for (const { src, widths, png } of LOGOS) {
    const base = src.replace(/\.(png|webp)$/i, '');
    const meta = await sharp(path.join(SRC_IMG, src)).metadata();
    for (const w of widths) {
      if (w > meta.width) continue;
      const pipe = () => sharp(path.join(SRC_IMG, src)).resize({ width: w, withoutEnlargement: true });
      const webp = await pipe().webp({ quality: 90, effort: 6, alphaQuality: 100 }).toBuffer();
      writeAll('img', `${base}-${w}.webp`, webp);
      log(`  ${base}-${w}.webp`.padEnd(38) + (webp.length / 1024).toFixed(1) + ' KB');
      if (png) {
        const p = await pipe().png({ compressionLevel: 9, palette: true }).toBuffer();
        writeAll('img', `${base}-${w}.png`, p);
        log(`  ${base}-${w}.png`.padEnd(38) + (p.length / 1024).toFixed(1) + ' KB');
      }
    }
  }
}

/* ================================================== 2. MINIATURAS DE YOUTUBE */

const THUMBS = [
  // shorts de testimonios: se muestran recortados en 9:16
  { id: 'gAZ2xNm--Bo', name: 'testimonio-1', from: 'hqdefault', widths: [480] },
  { id: 'h08RqUihV1I', name: 'testimonio-2', from: 'hqdefault', widths: [480] },
  { id: 'P7t6AGGPv48', name: 'testimonio-3', from: 'hqdefault', widths: [480] },
  // video 16:9 de "así funciona": 600px en escritorio -> 1x y 2x
  { id: 'BW9bjbc_21U', name: 'como-funciona', from: 'maxresdefault', widths: [600, 1200] },
];

async function buildThumbs() {
  log('\n=== 2. Miniaturas de YouTube (servidas en local) ===');
  for (const t of THUMBS) {
    const url = `https://i.ytimg.com/vi/${t.id}/${t.from}.jpg`;
    const res = await fetch(url);
    if (!res.ok) {
      log(`  ⚠ ${t.name}: ${res.status} en ${url}`);
      continue;
    }
    const input = Buffer.from(await res.arrayBuffer());
    for (const w of t.widths) {
      const buf = await sharp(input).resize({ width: w, withoutEnlargement: true }).webp({ quality: 80, effort: 6 }).toBuffer();
      writeAll('img', `yt-${t.name}-${w}.webp`, buf);
      log(`  yt-${t.name}-${w}.webp`.padEnd(38) + (buf.length / 1024).toFixed(1) + ' KB');
    }
  }
}

/* ========================================================= 3. FUENTES */

/**
 * Familias y pesos que usa la maqueta.
 * Lato en Google sólo existe en 300/400/700/900: los pesos 600 y 800 del diseño
 * los sintetiza el navegador a partir de 700 y 900, igual que en el original.
 * Inter es variable, así que un solo archivo cubre 400, 500 y 600.
 */
const FAMILIES = [
  { name: 'Lato', axis: 'wght@300;400;700;900', faces: [300, 400, 700, 900] },
  { name: 'Inter', axis: 'wght@400..600', faces: ['400 600'] },
];

/**
 * Juego de caracteres del subset. Va más allá de lo que hay hoy en la landing
 * (todo el ASCII imprimible + acentos y signos del español + los símbolos que
 * usa la maqueta) para que se pueda editar el copy sin regenerar nada.
 * Si algún día entra un carácter raro (ª, º, comillas curvas exóticas, emoji),
 * hay que añadirlo aquí y volver a correr el script.
 */
const CHARSET = [
  ' !"#$%&\'()*+,-./0123456789:;<=>?@',
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`',
  'abcdefghijklmnopqrstuvwxyz{|}~',
  'áéíóúüñÁÉÍÓÚÜÑ', // español
  '¿¡ºª€°',
  '–—…‘’“”•·',
  '✓', // el bullet del hero
].join('');

async function buildFonts() {
  log('\n=== 3. Fuentes autoalojadas y subseteadas ===');

  const out = [
    '/* =============================================================================',
    '   Fuentes autoalojadas (generado por tools/optimize-assets.mjs, no editar a mano)',
    '',
    '   Están subseteadas al juego de caracteres de CHARSET en ese script: todo el',
    '   ASCII imprimible, los acentos y signos del español y los símbolos de la',
    '   maqueta. Si añades copy con un carácter fuera de ese juego, vuelve a correr',
    '   el script o ese carácter se verá con la fuente de sistema.',
    '',
    '   Lato en Google sólo existe en 300/400/700/900: los pesos 600 y 800 del',
    '   diseño los sintetiza el navegador, igual que en el sitio original.',
    '   ========================================================================== */',
    '',
  ];

  let total = 0;

  for (const fam of FAMILIES) {
    // El parámetro text= hace que Google devuelva el woff2 ya subseteado
    const url =
      `https://fonts.googleapis.com/css2?family=${fam.name.replace(/\s+/g, '+')}:${fam.axis}` +
      `&text=${encodeURIComponent(CHARSET)}&display=swap`;

    const css = await (
      await fetch(url, {
        headers: {
          // sin un UA moderno Google devuelve ttf en vez de woff2
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      })
    ).text();

    const blocks = [...css.matchAll(/@font-face\s*\{([^}]+)\}/g)].map((m) => m[1]);
    if (!blocks.length) throw new Error(`Google no devolvió @font-face para ${fam.name}:\n${css.slice(0, 400)}`);

    for (const body of blocks) {
      const weight = (body.match(/font-weight:\s*([\d ]+)/) || [])[1].trim();
      const style = (body.match(/font-style:\s*(\w+)/) || [])[1] ?? 'normal';
      const src = (body.match(/url\(([^)]+)\)/) || [])[1];

      const slug = fam.name.toLowerCase().replace(/\s+/g, '-');
      const file = `${slug}-${weight.replace(/\s+/g, '_')}.woff2`;
      const bin = Buffer.from(await (await fetch(src)).arrayBuffer());
      writeAll('fonts', file, bin);
      total += bin.length;
      log(`  ${file}`.padEnd(30) + (bin.length / 1024).toFixed(1) + ' KB');

      out.push(
        '@font-face {',
        `  font-family: '${fam.name}';`,
        `  font-style: ${style};`,
        `  font-weight: ${weight};`,
        '  font-display: swap;',
        `  src: url('../fonts/${file}') format('woff2');`,
        '}',
        ''
      );
    }
  }

  const cssOut = out.join('\n');
  // sólo la versión vanilla necesita el css suelto; Astro importa src/styles/fonts.css
  fs.writeFileSync(path.join(ROOT, 'vanilla/assets/css/fonts.css'), cssOut);
  log(`  fonts.css listo — ${(total / 1024).toFixed(1)} KB de fuentes en total`);

  // La versión Astro importa el CSS desde src/styles
  const astroFonts = path.join(ROOT, 'astro/src/styles/fonts.css');
  fs.writeFileSync(astroFonts, cssOut.replace(/\.\.\/fonts\//g, '/assets/fonts/'));
  log('  astro/src/styles/fonts.css (rutas absolutas para el build)');
}

/* ================================================================== MAIN */

await buildImages();
await buildThumbs();
await buildFonts();

log('\n=== Resumen ===');
for (const d of DESTS) {
  let total = 0;
  for (const sub of ['img', 'fonts', 'css']) {
    const p = path.join(d, sub);
    if (!fs.existsSync(p)) continue;
    for (const f of fs.readdirSync(p)) total += fs.statSync(path.join(p, f)).size;
  }
  log('  ' + path.relative(ROOT, d).padEnd(22) + (total / 1024).toFixed(0) + ' KB en assets');
}
log('\nListo. Recuerda: el HTML/los componentes ya apuntan a estos archivos.');
