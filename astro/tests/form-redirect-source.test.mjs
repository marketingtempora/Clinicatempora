import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(new URL('../src/components/LeadForm.astro', import.meta.url), 'utf8');

test('un campo oculto autocompletado no interrumpe el envío ni la redirección', () => {
  assert.doesNotMatch(
    source,
    /if\s*\(honeypot\)\s*\{[\s\S]*?return;\s*\}/,
    'el formulario todavía sale antes del envío cuando el navegador completa el campo antispam',
  );
});
