import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const exists = (path) => access(new URL(path, import.meta.url)).then(() => true, () => false);

test('LP1 y LP2 son las únicas rutas públicas de las landings', async () => {
  assert.equal(await exists('../src/pages/lp1/index.astro'), true);
  assert.equal(await exists('../src/pages/lp2/index.astro'), true);

  const lp1 = await readFile(new URL('../src/pages/lp1/index.astro', import.meta.url), 'utf8');
  const lp2 = await readFile(new URL('../src/pages/lp2/index.astro', import.meta.url), 'utf8');
  assert.doesNotMatch(lp1, /pages\/version1|\.\.\/version1/);
  assert.doesNotMatch(lp2, /pages\/version2|\.\.\/version2/);
});

test('el home redirige a LP1 y el home anterior permanece en hold', async () => {
  const home = await readFile(new URL('../src/pages/index.astro', import.meta.url), 'utf8');
  const hold = await readFile(new URL('../src/pages/hold/index.astro', import.meta.url), 'utf8');

  assert.match(home, /LegacyRedirect/);
  assert.match(home, /destination="\/lp1\/"/);
  assert.doesNotMatch(home, /<Hero\s*\/>/);

  assert.match(hold, /<Hero\s*\/>/);
  assert.match(hold, /<Testimonials\s*\/>/);
  assert.match(hold, /<Footer\s*\/>/);
});

test('las URL antiguas solo redirigen y no duplican las landings', async () => {
  const redirects = [
    ['../src/pages/version1/index.astro', '/lp1/'],
    ['../src/pages/version2/index.astro', '/lp2/'],
    ['../src/pages/lp1/gracias-reserva/index.astro', '/lp1/gracias-agendamiento/'],
    ['../src/pages/lp2/gracias-reserva/index.astro', '/lp2/gracias-agendamiento/'],
  ];

  for (const [path, destination] of redirects) {
    const source = await readFile(new URL(path, import.meta.url), 'utf8');
    assert.match(source, /LegacyRedirect/);
    assert.match(source, new RegExp(`destination="${destination}"`));
    assert.doesNotMatch(source, /Version1Page|Version2Landing|ReservationThanks/);
  }
});

test('permanecen las páginas de gracias vigentes', async () => {
  assert.equal(await exists('../src/pages/lp1/gracias-agendamiento/index.astro'), true);
  assert.equal(await exists('../src/pages/lp2/gracias-agendamiento/index.astro'), true);
});
