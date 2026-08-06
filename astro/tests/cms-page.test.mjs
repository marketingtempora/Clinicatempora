import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

async function read(path) {
  return readFile(new URL(path, import.meta.url), 'utf8').catch(() => '');
}

test('el CMS exige autenticación y no expone credenciales administrativas', async () => {
  const page = await read('../src/pages/CMS/index.astro');

  assert.match(page, /grant_type=password/);
  assert.match(page, /sessionStorage/);
  assert.match(page, /robots="noindex, nofollow"/);
  assert.match(page, /\.cms\s+\[hidden\]\s*\{\s*display:\s*none\s*!important/);
  assert.doesNotMatch(page, /service_role/i);
});

test('el CMS permite consultar, filtrar, exportar y reencolar formularios', async () => {
  const page = await read('../src/pages/CMS/index.astro');

  assert.match(page, /lead_delivery_events/);
  assert.match(page, /data-search/);
  assert.match(page, /data-status-filter/);
  assert.match(page, /Exportar CSV/);
  assert.match(page, /requeue_requested_at/);
});

test('/CMS contiene directamente el panel privado', async () => {
  const page = await read('../src/pages/CMS/index.astro');
  assert.match(page, /data-cms/);
  assert.doesNotMatch(page, /location\.replace/);
});
