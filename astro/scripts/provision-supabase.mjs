import { readFile, writeFile } from 'node:fs/promises';

const accessToken = process.env.SUPABASE_ACCESS_TOKEN?.trim();
const projectRef = process.env.SUPABASE_PROJECT_REF?.trim();
const cmsEmail = process.env.TEMPORA_CMS_EMAIL?.trim().toLowerCase();
const cmsPassword = process.env.TEMPORA_CMS_PASSWORD;
const publicUrl = process.env.PUBLIC_SUPABASE_URL?.trim();
const publicKey = process.env.PUBLIC_SUPABASE_ANON_KEY?.trim();

const hasProvisioningCredentials = Boolean(
  accessToken && projectRef && cmsEmail && cmsPassword,
);

if (!hasProvisioningCredentials) {
  if (publicUrl && publicKey) {
    console.log('Supabase ya está configurado; se usan las variables públicas de Render.');
  } else if (process.env.RENDER) {
    throw new Error(
      'Faltan las variables públicas de Supabase o las credenciales temporales de puesta en marcha.',
    );
  } else {
    console.log('Puesta en marcha de Supabase omitida fuera de Render.');
  }
} else {
  try {
    await provisionSupabase();
    await writeSetupStatus({ ok: true, phase: 'complete' });
  } catch (error) {
    const message = sanitizeError(error);
    console.error(`Puesta en marcha de Supabase falló: ${message}`);
    await writeSetupStatus({ ok: false, phase: 'provision', message });
  }
}

async function provisionSupabase() {
  if (!/^[a-z0-9]{20}$/.test(projectRef)) {
    throw new Error('SUPABASE_PROJECT_REF no tiene un formato válido.');
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(cmsEmail)) {
    throw new Error('TEMPORA_CMS_EMAIL no tiene un formato válido.');
  }
  const projectUrl = `https://${projectRef}.supabase.co`;
  const schema = await readFile(new URL('../supabase/schema.sql', import.meta.url), 'utf8');

  await managementRequest(`/projects/${projectRef}/database/query`, {
    method: 'POST',
    body: { query: schema },
  });
  console.log('Esquema, RLS y funciones del CMS verificados.');

  const keys = await managementRequest(`/projects/${projectRef}/api-keys?reveal=true`);
  const keyList = Array.isArray(keys) ? keys : keys?.api_keys ?? keys?.keys ?? [];
  const legacyAnon = findKey(keyList, ['anon']);
  const publishable = findKey(keyList, ['publishable']);
  const legacyServiceRole = findKey(keyList, ['service_role']);
  const secret = findKey(keyList, ['secret']);
  const browserKey = legacyAnon || publishable;
  const adminKey = legacyServiceRole || secret;

  if (!browserKey || !adminKey) {
    throw new Error('No fue posible obtener las claves pública y administrativa del proyecto.');
  }

  await managementRequest(`/projects/${projectRef}/config/auth`, {
    method: 'PATCH',
    body: {
      disable_signup: true,
      site_url: 'https://landing-tempora.onrender.com/CMS/',
    },
  });
  console.log('Registro público desactivado en Supabase Auth.');

  const escapedEmail = cmsEmail.replaceAll("'", "''");
  const existing = await managementRequest(`/projects/${projectRef}/database/query`, {
    method: 'POST',
    body: {
      query: `select id::text from auth.users where lower(email) = lower('${escapedEmail}') limit 1;`,
      read_only: true,
    },
  });
  const userId = extractFirstId(existing);

  const adminPath = userId ? `/auth/v1/admin/users/${userId}` : '/auth/v1/admin/users';
  const adminMethod = userId ? 'PUT' : 'POST';
  const user = await projectRequest(projectUrl, adminPath, adminKey, {
    method: adminMethod,
    body: {
      email: cmsEmail,
      password: cmsPassword,
      email_confirm: true,
    },
  });
  const confirmedUserId = userId || user?.id || user?.user?.id;
  if (!confirmedUserId) {
    throw new Error('Supabase no confirmó la creación del usuario privado del CMS.');
  }

  const escapedUserId = String(confirmedUserId).replaceAll("'", "''");
  await managementRequest(`/projects/${projectRef}/database/query`, {
    method: 'POST',
    body: {
      query: `insert into public.cms_users (user_id) values ('${escapedUserId}'::uuid) on conflict (user_id) do nothing;`,
    },
  });
  console.log('Usuario privado del CMS creado y autorizado.');

  await writeFile(
    new URL('../.env.production', import.meta.url),
    [
      `PUBLIC_SUPABASE_URL=${projectUrl}`,
      `PUBLIC_SUPABASE_ANON_KEY=${browserKey}`,
      'PUBLIC_SUPABASE_TABLE=leads',
      '',
    ].join('\n'),
    { mode: 0o600 },
  );
  console.log('Variables públicas preparadas para el build.');
}

function findKey(keys, names) {
  const expected = names.map((name) => name.toLowerCase());
  const entry = keys.find((item) => {
    const haystack = [item?.name, item?.type, item?.role, item?.id]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return expected.some((name) => haystack.includes(name));
  });
  return entry?.api_key || entry?.key || entry?.value || null;
}

function extractFirstId(payload) {
  if (Array.isArray(payload)) return payload[0]?.id ?? null;
  if (Array.isArray(payload?.result)) return payload.result[0]?.id ?? null;
  if (Array.isArray(payload?.data)) return payload.data[0]?.id ?? null;
  return payload?.id ?? null;
}

async function managementRequest(path, { method = 'GET', body } = {}) {
  const response = await fetch(`https://api.supabase.com/v1${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return readJson(response, `Management API (${method} ${path.split('?')[0]})`);
}

async function projectRequest(baseUrl, path, key, { method = 'GET', body } = {}) {
  const headers = {
    apikey: key,
    'Content-Type': 'application/json',
  };
  if (key.split('.').length === 3) headers.Authorization = `Bearer ${key}`;

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return readJson(response, `Supabase Auth (${method} ${path})`);
}

async function readJson(response, label) {
  const text = await response.text();
  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }
  if (!response.ok) {
    const detail = payload?.message || payload?.error || payload?.msg || response.statusText;
    throw new Error(`${label} falló (${response.status}): ${detail}`);
  }
  return payload;
}

async function writeSetupStatus(status) {
  await writeFile(
    new URL('../public/cms-setup-status.json', import.meta.url),
    `${JSON.stringify(status)}\n`,
    { mode: 0o600 },
  );
}

function sanitizeError(error) {
  let message = error instanceof Error ? error.message : 'Error desconocido';
  for (const sensitive of [accessToken, cmsPassword]) {
    if (sensitive) message = message.replaceAll(sensitive, '[redacted]');
  }
  return message.slice(0, 500);
}
