import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const layout = await readFile(new URL('../src/layouts/Layout.astro', import.meta.url), 'utf8');
const form = await readFile(new URL('../src/components/LeadForm.astro', import.meta.url), 'utf8');
const cms = await readFile(new URL('../src/pages/CMS/index.astro', import.meta.url), 'utf8');

test('las páginas públicas cargan el contenedor oficial de GTM', () => {
  assert.match(layout, /GTM-58K95WQ/);
  assert.match(layout, /googletagmanager\.com\/gtm\.js/);
  assert.match(layout, /googletagmanager\.com\/ns\.html/);
  assert.match(layout, /tracking = true/);
});

test('el CMS privado no carga etiquetas publicitarias', () => {
  assert.match(cms, /tracking=\{false\}/);
});

test('el formulario acepta el script UTM antiguo de Elementor sin cambiar el payload', () => {
  assert.match(form, /const gtmLegacyFields = \[/);
  assert.match(form, /name=\{`form_fields\[\$\{name\}\]`\}/);
  assert.match(form, /disabled data-gtm-legacy/);
  assert.match(form, /function syncLegacyAttribution/);
  assert.ok(form.indexOf('syncLegacyAttribution(target)') < form.indexOf('const data = new FormData(target)'));
});
