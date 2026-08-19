import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

async function read(path) {
  return readFile(new URL(path, import.meta.url), 'utf8').catch(() => '');
}

test('el esquema conserva leads y restringe la lectura a usuarios CMS autorizados', async () => {
  const schema = await read('../supabase/schema.sql');

  assert.match(schema, /create table(?: if not exists)? public\.leads/i);
  assert.match(schema, /submission_id text not null unique/i);
  assert.match(schema, /for insert\s+to anon/i);
  assert.match(schema, /for select\s+to authenticated/i);
  assert.doesNotMatch(schema, /for select\s+to anon/i);
  assert.match(schema, /create table(?: if not exists)? public\.cms_users/i);
  assert.match(schema, /create or replace function public\.is_cms_user/i);
  assert.match(schema, /using \(public\.is_cms_user\(\)\)/i);
  assert.doesNotMatch(schema, /grant select, update on public\.leads to authenticated/i);
  assert.match(schema, /create or replace function public\.request_lead_requeue/i);
  assert.match(schema, /grant execute on function public\.request_lead_requeue\(text\) to authenticated/i);
  assert.match(schema, /delivery_status = 'received'/i);
  assert.match(schema, /pipedrive_status in \('pending', 'not_configured'\)/i);
});
