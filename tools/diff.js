// Compara las huellas de layout del original y de la réplica.
const fs = require('fs');
const A = JSON.parse(fs.readFileSync(__dirname + '/fp-' + (process.argv[3] || 'orig') + '.json', 'utf8'));
const B = JSON.parse(fs.readFileSync(__dirname + '/fp-' + (process.argv[2] || 'replica') + '.json', 'utf8'));

const SECTIONS = ['header', 'hero', 'claim', 'testimonios', 'resultados', 'como-funciona', 'porque', 'cta', 'cuotas', 'footer'];

// imágenes equivalentes (renombré los archivos)
const IMG_MAP = {
  'LOGO-2-1536x260.png': 'logo-tempora.png',
  'LOGO-2-scaled.png': 'logo-tempora.png',
  'LOGO-2-1024x174.png': 'logo-tempora.png',
  'LOGO-1.webp': 'logo-tempora-blanco.webp',
  'LOGO-1-300x51.webp': 'logo-tempora-blanco.webp',
  '7d48ca2d-implante-uno.png': 'resultado-1-mes.png',
  '21114f43-implante-dos.png': 'resultado-6-meses.png',
  '07caf53e-implante-tres.png': 'resultado-9-meses.png',
  '144aab6a-implante-cuatro.png': 'resultado-12-meses.png',
  'CONSULTA-MEDICA-5-768x513.webp': 'clinica-consulta-1.webp',
  'PRECIRUGIA-5-768x513.webp': 'clinica-precirugia.webp',
  'CONSULTA-MEDICA-23-768x513.webp': 'clinica-consulta-2.webp',
};

const mapKey = (it) => {
  let key = it.key;
  if (it.k === 'img') key = IMG_MAP[key] ?? key;
  if (it.k === 'img' && /hqdefault|maxresdefault/.test(key)) key = 'thumb-yt';
  return `${it.k}|${it.s}|${key}`;
};

function index(fp) {
  const map = new Map();
  for (const it of fp.items) {
    const k = mapKey(it);
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(it);
  }
  return map;
}

const ia = index(A);
const ib = index(B);

console.log('==================== RESUMEN ====================');
console.log(`viewport      orig=${A.vw}  replica=${B.vw}`);
console.log(`documento     orig=${A.docH}px  replica=${B.docH}px  (delta ${B.docH - A.docH})`);
console.log(`elementos     orig=${A.items.length}  replica=${B.items.length}`);
console.log('\nalto por sección:');
SECTIONS.forEach((s, i) => {
  const a = A.sections[i], b = B.sections[i];
  if (!a || !b) { console.log(`  ${s.padEnd(14)} FALTA`); return; }
  const d = b[1] - a[1];
  console.log(`  ${s.padEnd(14)} orig=${String(a[1]).padStart(5)}  replica=${String(b[1]).padStart(5)}  ${d === 0 ? '=' : (d > 0 ? '+' : '') + d}`);
});

// ---------------------------------------------------------------- faltantes
const onlyA = [], onlyB = [];
for (const [k, list] of ia) if (!ib.has(k)) onlyA.push([k, list[0]]);
for (const [k, list] of ib) if (!ia.has(k)) onlyB.push([k, list[0]]);

if (onlyA.length) {
  console.log('\n==================== FALTA EN LA RÉPLICA (' + onlyA.length + ') ====================');
  for (const [k, it] of onlyA) console.log(`  [${SECTIONS[it.s]}] ${it.k}: "${it.key}"  (orig x=${it.x} y=${it.y} ${it.w}x${it.h} ${it.fs}/${it.fw})`);
}
if (onlyB.length) {
  console.log('\n==================== SOBRA EN LA RÉPLICA (' + onlyB.length + ') ====================');
  for (const [k, it] of onlyB) console.log(`  [${SECTIONS[it.s]}] ${it.k}: "${it.key}"  (x=${it.x} y=${it.y} ${it.w}x${it.h} ${it.fs}/${it.fw})`);
}

// ------------------------------------------------------------------ deltas
const TOL = { x: 4, y: 6, w: 6, h: 6 };
const diffs = [];
for (const [k, la] of ia) {
  const lb = ib.get(k);
  if (!lb) continue;
  const n = Math.min(la.length, lb.length);
  for (let i = 0; i < n; i++) {
    const a = la[i], b = lb[i];
    const problems = [];
    for (const prop of ['x', 'y', 'w', 'h']) {
      const d = b[prop] - a[prop];
      if (Math.abs(d) > TOL[prop]) problems.push(`${prop}: ${a[prop]}→${b[prop]} (${d > 0 ? '+' : ''}${d})`);
    }
    for (const prop of ['ff', 'fs', 'fw', 'c', 'ta']) {
      if (a[prop] !== b[prop]) problems.push(`${prop}: ${a[prop]} → ${b[prop]}`);
    }
    for (const prop of ['rad', 'bg', 'pad', 'nat']) {
      if (a[prop] !== undefined && b[prop] !== undefined && a[prop] !== b[prop]) {
        problems.push(`${prop}: ${a[prop]} → ${b[prop]}`);
      }
    }
    if (problems.length) diffs.push({ s: a.s, k: a.k, key: a.key, problems, a, b });
  }
}

diffs.sort((p, q) => p.s - q.s || q.problems.length - p.problems.length);
console.log(`\n==================== DIFERENCIAS (${diffs.length}) ====================`);
let last = -1;
for (const d of diffs) {
  if (d.s !== last) { console.log(`\n--- ${SECTIONS[d.s]} ---`); last = d.s; }
  console.log(`  ${d.k} "${d.key.slice(0, 52)}"`);
  for (const p of d.problems) console.log(`      ${p}`);
}
