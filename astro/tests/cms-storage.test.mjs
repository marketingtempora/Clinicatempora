import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

async function read(path) {
  return readFile(new URL(path, import.meta.url), 'utf8').catch(() => '');
}

test('el esquema conserva leads y restringe la lectura a usuarios autenticados', async () => {
  const schema = await read('../supabase/schema.sql');

  assert.match(schema, /create table(?: if not exists)? public\.leads/i);
  assert.match(schema, /submission_id text not null unique/i);
  assert.match(schema, /for insert\s+to anon/i);
  assert.match(schema, /for select\s+to authenticated/i);
  assert.doesNotMatch(schema, /for select\s+to anon/i);
  assert.match(schema, /delivery_status = 'received'/i);
  assert.match(schema, /pipedrive_status in \('pending', 'not_configured'\)/i);
});
