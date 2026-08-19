import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(new URL('../src/components/LeadForm.astro', import.meta.url), 'utf8');

test('el formulario guarda el respaldo antes de intentar Make', () => {
  assert.match(source, /async function persistLeadBackup/);
  assert.match(source, /async function notifyMake/);
  const delivery = source.slice(source.indexOf('async function sendLead'));
  assert.ok(delivery.indexOf('await persistLeadBackup') < delivery.indexOf('await notifyMake'));
});

test('el formulario registra el resultado de Make sin perder un lead respaldado', () => {
  assert.match(source, /lead_delivery_events/);
  assert.match(source, /make_success/);
  assert.match(source, /make_failed/);
  assert.match(source, /backupSaved/);
});

test('cada landing identifica inequívocamente el origen del formulario', () => {
  assert.match(source, /const sourceForm = formVersion === 'v2' \? 'lp2' : 'lp1'/);
  assert.match(source, /name="source_form" value=\{sourceForm\}/);
});

test('el formulario limita la atribución a los campos ocultos solicitados', () => {
  const start = source.indexOf('const attributionFields = [');
  const attributionBlock = source.slice(start, source.indexOf('] as const;', start) + '] as const;'.length);

  for (const field of [
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'campaign_id',
  ]) {
    assert.match(attributionBlock, new RegExp(`'${field}'`), `falta ${field}`);
  }

  for (const field of [
    'utm_id', 'utm_source_platform', 'utm_creative_format', 'utm_marketing_tactic',
    'adgroup_id', 'ad_id', 'keyword', 'match_type', 'network', 'device', 'placement',
    'gclid', 'gbraid', 'wbraid', 'fbclid', 'msclkid', 'ttclid',
  ]) {
    assert.doesNotMatch(attributionBlock, new RegExp(`'${field}'`), `sobra ${field}`);
  }
});

test('el respaldo público inserta sin exigir lectura y acepta un reintento duplicado', () => {
  assert.doesNotMatch(source, /on_conflict=submission_id/);
  assert.doesNotMatch(source, /resolution=ignore-duplicates/);
  assert.match(source, /acceptedErrorCodes/);
  assert.match(source, /'23505'/);
});
