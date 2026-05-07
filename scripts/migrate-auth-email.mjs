/**
 * Supabase Auth 이메일 변경 + 동일 고객 이메일이 들어간 public 테이블·JSONB·Auth metadata 갱신.
 * npm run migrate-auth-email -- <이전이메일> <새이메일>
 *
 * 환경변수: SUPABASE_URL 또는 VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

function loadEnvLocal() {
  const p = resolve(process.cwd(), '.env.local');
  if (!existsSync(p)) return;
  const raw = readFileSync(p, 'utf8');
  for (const line of raw.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i <= 0) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (process.env[k] === undefined) process.env[k] = v;
  }
}

/** @param {unknown} obj */
function deepReplaceEmailStrings(obj, fromLc, toRaw) {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') {
    return obj.toLowerCase() === fromLc ? toRaw : obj;
  }
  if (Array.isArray(obj)) return obj.map((x) => deepReplaceEmailStrings(x, fromLc, toRaw));
  if (typeof obj === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      out[k] = deepReplaceEmailStrings(v, fromLc, toRaw);
    }
    return out;
  }
  return obj;
}

loadEnvLocal();

const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
const [, , fromEmailArg, toEmailArg] = process.argv;
const fromNorm = (fromEmailArg || '').trim().toLowerCase();
const fromExact = (fromEmailArg || '').trim();
const toExact = (toEmailArg || '').trim();
const toNorm = toExact.toLowerCase();

if (!url || !serviceKey) {
  console.error('SUPABASE_URL(또는 VITE_SUPABASE_URL)와 SUPABASE_SERVICE_ROLE_KEY가 필요합니다.');
  process.exit(1);
}
if (!fromExact || !toExact || fromNorm === toNorm) {
  console.error('사용법: npm run migrate-auth-email -- <이전이메일> <새이메일>');
  process.exit(1);
}

const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

let found = null;
let page = 1;
for (;;) {
  const { data: pageData, error: listErr } = await admin.auth.admin.listUsers({ page, perPage: 200 });
  if (listErr) {
    console.error('사용자 조회 실패:', listErr.message);
    process.exit(1);
  }
  const batch = pageData?.users || [];
  found = batch.find((x) => (x.email || '').toLowerCase() === fromNorm)
    || batch.find((x) => (x.email || '').toLowerCase() === toNorm);
  if (found || batch.length < 200) break;
  page += 1;
  if (page > 50) break;
}

if (!found?.id) {
  console.error('Auth에서 이전/새 이메일 어느 쪽도 찾지 못했습니다:', fromExact, '/', toExact);
  process.exit(1);
}

const currentEmailLc = (found.email || '').toLowerCase();

if (currentEmailLc === fromNorm) {
  const { data: updated, error: upErr } = await admin.auth.admin.updateUserById(found.id, {
    email: toExact,
    email_confirm: true,
  });
  if (upErr) {
    console.error('Auth 이메일 변경 실패:', upErr.message);
    process.exit(1);
  }
  console.log('Auth 이메일 변경:', fromExact, '→', toExact, '(id:', updated.user?.id, ')');
} else if (currentEmailLc === toNorm) {
  console.log('Auth 이메일 이미 새 주소입니다:', toExact, '(id:', found.id, ')');
} else {
  console.error('예기치 않은 Auth 이메일:', found.email);
  process.exit(1);
}

const userId = found.id;

const { data: freshUserRes, error: freshErr } = await admin.auth.admin.getUserById(userId);
if (freshErr) console.warn('Auth 사용자 재조회 실패(metadata 생략):', freshErr.message);
const fresh = freshUserRes?.user;
if (fresh) {
  const metaUser = deepReplaceEmailStrings(fresh.user_metadata || {}, fromNorm, toExact);
  const metaApp = deepReplaceEmailStrings(fresh.app_metadata || {}, fromNorm, toExact);
  const { error: metaErr } = await admin.auth.admin.updateUserById(userId, {
    user_metadata: metaUser,
    app_metadata: metaApp,
  });
  if (metaErr) console.warn('Auth metadata 갱신(선택):', metaErr.message);
  else console.log('Auth user/app_metadata 내 동일 이메일 문자열 치환 시도함');
}

/** @type {{ name: string; column: string }[]} */
const plainTables = [
  { name: 'campaigns', column: 'customer_email' },
  { name: 'orders', column: 'email' },
  { name: 'custom_payment_offers', column: 'customer_email' },
  { name: 'support_conversations', column: 'customer_email' },
  { name: 'creator_drops', column: 'dropped_by_email' },
  { name: 'diagnoses', column: 'email' },
  { name: 'reference_leads', column: 'email' },
];

for (const { name, column } of plainTables) {
  const { data: before, error: selErr } = await admin.from(name).select('*').ilike(column, fromExact);
  if (selErr) {
    console.warn(`[${name}] 조회 건너뜀:`, selErr.message);
    continue;
  }
  if (!before?.length) {
    console.log(`[${name}.${column}] 일치 행 없음`);
    continue;
  }
  const { error: updErr } = await admin.from(name).update({ [column]: toExact }).ilike(column, fromExact);
  if (updErr) console.warn(`[${name}] 갱신 실패:`, updErr.message);
  else console.log(`[${name}.${column}] ${before.length}행 갱신`);
}

const { data: drafts, error: dErr } = await admin.from('checkout_drafts').select('oid, payload');
if (!dErr && drafts?.length) {
  let n = 0;
  for (const row of drafts) {
    const next = deepReplaceEmailStrings(row.payload, fromNorm, toExact);
    if (JSON.stringify(next) === JSON.stringify(row.payload)) continue;
    const { error: u } = await admin.from('checkout_drafts').update({ payload: next }).eq('oid', row.oid);
    if (!u) n += 1;
    else console.warn('[checkout_drafts] oid', row.oid, u.message);
  }
  if (n) console.log(`[checkout_drafts.payload] ${n}건 갱신`);
  else console.log('[checkout_drafts.payload] 변경 없음');
} else if (dErr && !String(dErr.message || '').includes('does not exist')) {
  console.warn('[checkout_drafts]', dErr.message);
}

const { data: allSubmissions, error: sErr } = await admin.from('campaign_setup_submissions').select('id, form_data, user_id');
if (!sErr && allSubmissions?.length) {
  const touched = allSubmissions.filter(
    (row) =>
      row.user_id === userId || JSON.stringify(row.form_data || '').toLowerCase().includes(fromNorm),
  );
  let n = 0;
  for (const row of touched) {
    const next = deepReplaceEmailStrings(row.form_data, fromNorm, toExact);
    if (JSON.stringify(next) === JSON.stringify(row.form_data)) continue;
    const { error: u } = await admin.from('campaign_setup_submissions').update({ form_data: next }).eq('id', row.id);
    if (!u) n += 1;
  }
  if (n) console.log(`[campaign_setup_submissions.form_data] ${n}건 갱신`);
  else console.log('[campaign_setup_submissions.form_data] 변경 없음');
} else if (sErr && !String(sErr.message || '').includes('does not exist')) {
  console.warn('[campaign_setup_submissions]', sErr.message);
}
