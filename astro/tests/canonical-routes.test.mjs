import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const exists = (path) => access(new URL(path, import.meta.url)).then(() => true, () => false);

test('LP1 y LP2 son las únicas rutas públicas de las landings', async () => {
  assert.equal(await exists('../src/pages/lp1/index.astro'), true);
  assert.equal(await exists('../src/pages/lp2/index.astro'), true);
  assert.equal(await exists('../src/pages/version1/index.astro'), false);
  assert.equal(await exists('../src/pages/version2/index.astro'), false);

  const lp1 = await readFile(new URL('../src/pages/lp1/index.astro', import.meta.url), 'utf8');
  const lp2 = await readFile(new URL('../src/pages/lp2/index.astro', import.meta.url), 'utf8');
  assert.doesNotMatch(lp1, /pages\/version1|\.\.\/version1/);
  assert.doesNotMatch(lp2, /pages\/version2|\.\.\/version2/);
});

test('solo permanecen las páginas de gracias vigentes', async () => {
  assert.equal(await exists('../src/pages/lp1/gracias-agendamiento/index.astro'), true);
  assert.equal(await exists('../src/pages/lp2/gracias-agendamiento/index.astro'), true);
  assert.equal(await exists('../src/pages/lp1/gracias-reserva/index.astro'), false);
  assert.equal(await exists('../src/pages/lp2/gracias-reserva/index.astro'), false);
});
