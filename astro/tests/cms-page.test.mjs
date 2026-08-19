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
  assert.match(page, /request_lead_requeue/);
  assert.doesNotMatch(page, /method:\s*'PATCH'/);
});

test('la tabla y el CSV incluyen todos los campos visibles y de atribución', async () => {
  const page = await read('../src/pages/CMS/index.astro');

  for (const field of [
    'nombre', 'apellido', 'email', 'telefono', 'urgencia_cirugia',
    'medio_evaluacion', 'genero', 'horario_contacto', 'source_form',
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
    'campaign_id', 'adgroup_id', 'ad_id', 'gclid', 'fbclid',
  ]) {
    assert.match(page, new RegExp(`['\"]${field}['\"]`), `falta la columna ${field}`);
  }
  assert.match(page, /data-table-head/);
});

test('/CMS contiene directamente el panel privado', async () => {
  const page = await read('../src/pages/CMS/index.astro');
  assert.match(page, /data-cms/);
  assert.doesNotMatch(page, /location\.replace/);
});

test('el estado vacío oculta la tabla y las columnas conservan un ancho legible', async () => {
  const page = await read('../src/pages/CMS/index.astro');

  assert.match(page, /data-records-table hidden/);
  assert.match(page, /recordsTable\.hidden = !hasRows/);
  assert.match(page, /empty\.hidden = hasRows/);
  assert.match(page, /table\s*\{[^}]*width:\s*7200px/);
  assert.match(page, /table-layout:\s*fixed/);
});
