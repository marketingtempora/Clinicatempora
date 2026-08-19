import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('los rastreadores reciben una prohibición explícita para el CMS', async () => {
  const robots = await readFile(new URL('../public/robots.txt', import.meta.url), 'utf8').catch(() => '');

  assert.match(robots, /User-agent:\s*\*/i);
  assert.match(robots, /Disallow:\s*\/CMS\//i);
  assert.match(robots, /Disallow:\s*\/cms\//i);
});
