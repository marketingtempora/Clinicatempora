import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(new URL('../src/pages/CMS/index.astro', import.meta.url), 'utf8');
const columns = source.slice(source.indexOf('const tableColumns'), source.indexOf('tableHead.replaceChildren'));

test('la tabla principal muestra datos del lead sin duplicar el origen', () => {
  assert.match(columns, /label: 'Landing', field: 'source_form'/);
  assert.doesNotMatch(columns, /field: 'form_version'/);
  assert.doesNotMatch(columns, /label: 'Origen'/);
  assert.doesNotMatch(columns, /field: 'page_url'/);
  assert.doesNotMatch(columns, /field: 'page_path'/);
});

test('el CMS no presenta columnas de Make o Pipedrive', () => {
  for (const field of [
    'make_status',
    'pipedrive_status',
    'pipedrive_person_id',
    'pipedrive_deal_id',
    'attempt_count',
    'last_attempt_at',
    'requeue_requested_at',
    'integration_error',
  ]) {
    assert.doesNotMatch(columns, new RegExp(`field: '${field}'`));
  }
});

test('todos los campos permanecen sincronizados entre tabla, detalle y Excel', () => {
  assert.match(source, /const attributionColumns: TableColumn\[\]/);
  assert.match(source, /const detailColumns = \[\.\.\.tableColumns, \.\.\.attributionColumns\]/);
  assert.match(source, /const displayColumns = detailColumns/);
  assert.match(source, /const fields = detailColumns/);
  assert.match(source, /table \{ width: max-content;/);
});

test('el resumen del CMS se limita a formularios y atribución', () => {
  assert.match(source, /data-metric="lp1"/);
  assert.match(source, /data-metric="lp2"/);
  assert.match(source, /data-metric="attributed"/);
  assert.doesNotMatch(source, /data-metric="success"/);
  assert.doesNotMatch(source, /data-status-filter/);
  assert.doesNotMatch(source, /data-requeue/);
});
