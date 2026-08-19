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
