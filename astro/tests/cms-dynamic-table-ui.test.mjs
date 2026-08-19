import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(new URL('../src/pages/CMS/index.astro', import.meta.url), 'utf8');

test('los elementos creados por JavaScript reciben los estilos del CMS', () => {
  assert.match(source, /<style is:global>/);
  assert.match(source, /th \{[^}]*background: #0b292c;[^}]*color: #fff;/s);
  assert.match(source, /\.row-action \{[^}]*background: var\(--lime\);/s);
  assert.match(source, /table \{[^}]*width: max-content;[^}]*table-layout: auto;/s);
});

test('la tabla principal presenta todos los campos de formulario y atribución', () => {
  assert.match(source, /const displayColumns = detailColumns;/);
  assert.match(source, /displayColumns\.forEach\(\(column\) =>/);
  assert.match(source, /displayColumns\.map\(\(column\) => lead\[column\.field\]\)/);

  for (const field of [
    'utm_id', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
    'utm_source_platform', 'utm_creative_format', 'utm_marketing_tactic', 'campaign_id',
    'adgroup_id', 'ad_id', 'keyword', 'match_type', 'network', 'device', 'placement',
    'gclid', 'gbraid', 'wbraid', 'fbclid', 'msclkid', 'ttclid', 'page_url',
  ]) {
    assert.match(source, new RegExp(`field: '${field}'`), `falta la columna ${field}`);
  }
});
