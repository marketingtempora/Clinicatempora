import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(new URL('../src/pages/CMS/index.astro', import.meta.url), 'utf8');

test('el detalle organiza los campos del formulario en grupos visuales', () => {
  for (const title of ['Datos de contacto', 'Preferencias', 'Atribución', 'Contexto']) {
    assert.match(source, new RegExp(`title: '${title}'`));
  }
  assert.match(source, /className = 'detail-group'/);
  assert.match(source, /className = 'landing-pill'/);
  assert.match(source, /classList\.add\('cell--empty'\)/);
});

test('el CMS exporta una hoja de Excel estilizada y segura', () => {
  assert.match(source, /Exportar Excel/);
  assert.match(source, /application\/vnd\.ms-excel;charset=utf-8/);
  assert.match(source, /\.xls`/);
  assert.match(source, /<table>/);
  assert.match(source, /background:\s*#0b292c/);
  assert.match(source, /if \(\/\^\[=\+\\-@\]\//);
  assert.doesNotMatch(source, /text\/csv/);
});
