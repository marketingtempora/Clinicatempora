import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('Render impide indexar, cachear o embeber el CMS', async () => {
  const render = await readFile(new URL('../../render.yaml', import.meta.url), 'utf8').catch(() => '');

  assert.match(render, /path:\s*\/CMS\/\*/);
  assert.match(render, /name:\s*X-Robots-Tag[\s\S]*?value:\s*noindex, nofollow, noarchive/);
  assert.match(render, /name:\s*Cache-Control[\s\S]*?value:\s*no-store/);
  assert.match(render, /name:\s*X-Frame-Options[\s\S]*?value:\s*DENY/);
});
