import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const layout = await readFile(new URL('../src/layouts/Layout.astro', import.meta.url), 'utf8');
const form = await readFile(new URL('../src/components/LeadForm.astro', import.meta.url), 'utf8');
const cms = await readFile(new URL('../src/pages/CMS/index.astro', import.meta.url), 'utf8');
const lp1 = await readFile(new URL('../src/components/Version1Page.astro', import.meta.url), 'utf8');
const lp2 = await readFile(new URL('../src/pages/lp2/index.astro', import.meta.url), 'utf8');
const old = await readFile(new URL('../src/pages/old/index.astro', import.meta.url), 'utf8');

test('las páginas públicas cargan el contenedor oficial de GTM', () => {
  assert.match(layout, /GTM-58K95WQ/);
  assert.match(layout, /googletagmanager\.com\/gtm\.js/);
  assert.match(layout, /googletagmanager\.com\/ns\.html/);
  assert.match(layout, /tracking = true/);
});

test('GTM ocupa las posiciones prioritarias indicadas por Google', () => {
  const headOpen = layout.indexOf('<head>');
  const headScript = layout.indexOf('{tracking && <script');
  const firstMeta = layout.indexOf('<meta charset');
  const bodyOpen = layout.indexOf('<body>');
  const bodyFallback = layout.indexOf('{tracking && (', bodyOpen);
  const firstVisibleContent = layout.indexOf('<a class="skip-link"', bodyOpen);

  assert.ok(headOpen < headScript && headScript < firstMeta);
  assert.ok(bodyOpen < bodyFallback && bodyFallback < firstVisibleContent);
});

test('el CMS privado no carga etiquetas publicitarias', () => {
  assert.match(cms, /tracking=\{false\}/);
});

test('LP1 y LP2 ocultan LeadBooster sin retirarlo del home anterior', () => {
  assert.match(layout, /html:root body #LeadboosterContainer/);
  assert.match(layout, /leadbooster-chat\.pipedrive\.com/);
  assert.match(lp1, /<Layout suppressLeadBooster>/);
  assert.match(lp2, /suppressLeadBooster/);
  assert.doesNotMatch(old, /suppressLeadBooster/);
});

test('el formulario acepta el script UTM antiguo de Elementor sin cambiar el payload', () => {
  assert.match(form, /const gtmLegacyFields = \[/);
  assert.match(form, /name=\{`form_fields\[\$\{name\}\]`\}/);
  assert.match(form, /disabled data-gtm-legacy/);
  assert.match(form, /function syncLegacyAttribution/);
  assert.ok(form.indexOf('syncLegacyAttribution(target)') < form.indexOf('const data = new FormData(target)'));
});
