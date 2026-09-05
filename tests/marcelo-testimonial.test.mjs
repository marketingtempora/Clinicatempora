import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const content = fs.readFileSync(new URL('../astro/src/data/content.ts', import.meta.url), 'utf8');
const rootTestimonials = fs.readFileSync(
  new URL('../astro/src/components/TestimonialsVersion1.astro', import.meta.url),
  'utf8',
);
const lp2 = fs.readFileSync(
  new URL('../astro/src/components/Version2Landing.astro', import.meta.url),
  'utf8',
);

test('Marcelo aparece primero y conserva el orden relativo de los otros testimonios', () => {
  const order = ['pLiwFyqZ71U', 'P7t6AGGPv48', 'h08RqUihV1I', 'gAZ2xNm--Bo'];
  let previous = -1;
  for (const id of order) {
    const current = content.indexOf(id);
    assert.ok(current > previous, `${id} debe aparecer después del testimonio anterior`);
    previous = current;
  }
});

test('la página principal usa un carrusel de tres testimonios visibles', () => {
  assert.match(rootTestimonials, /import Carousel from '.\/Carousel\.astro'/);
  assert.match(rootTestimonials, /perView=\{3\}/);
  assert.match(rootTestimonials, /class="carousel__slide voices-v1__card reveal"/);
  assert.match(rootTestimonials, /\.voices-v1__card:nth-child\(even\) \{ transform: translateY\(28px\); \}/);
});

test('LP2 abre con Marcelo, su portada y el texto solicitado', () => {
  assert.match(lp2, /v2-media__slide is-active[^>]*>[\s\S]*?id="pLiwFyqZ71U"/);
  assert.match(lp2, /thumb="\/assets\/img\/v2\/MARCELO\.jpg"/);
  assert.match(lp2, /Marcelo · Santiago/);
  assert.match(lp2, /«Un mensaje del Marcelo del pasado»/);
  assert.match(lp2, /Marcelo relata su experiencia como paciente de Clínica Témpora\./);
  assert.match(lp2, /data-media-dot="3"/);
});
