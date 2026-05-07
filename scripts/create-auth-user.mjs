/**
 * Supabase Auth에 비밀번호 로그인 가능한 사용자를 생성합니다 (관리자/일회성).
 * 사용: npm run create-auth-user -- greenical@example.com mypassword
 * 또는: node scripts/create-auth-user.mjs greenical@example.com mypassword
 *
 * 환경변수: SUPABASE_URL(또는 VITE_SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY
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

loadEnvLocal();

const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

const [, , emailArg, passwordArg] = process.argv;
const email = (emailArg || '').trim();
const password = passwordArg || '';

if (!url || !serviceKey) {
  console.error('SUPABASE_URL(또는 VITE_SUPABASE_URL)와 SUPABASE_SERVICE_ROLE_KEY가 필요합니다.');
  process.exit(1);
}
if (!email || !password) {
  console.error('사용법: node scripts/create-auth-user.mjs <이메일> <비밀번호>');
  process.exit(1);
}

const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

const { data, error } = await admin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
});

if (error) {
  const exists =
    error.message?.includes('already been registered') ||
    error.code === 'email_exists' ||
    String(error.message || '').toLowerCase().includes('already registered');
  if (exists) {
    let page = 1;
    let found = null;
    for (;;) {
      const { data: pageData, error: listErr } = await admin.auth.admin.listUsers({ page, perPage: 200 });
      if (listErr) {
        console.error('사용자 조회 실패:', listErr.message);
        process.exit(1);
      }
      const batch = pageData?.users || [];
      found = batch.find((x) => (x.email || '').toLowerCase() === email.toLowerCase());
      if (found || batch.length < 200) break;
      page += 1;
      if (page > 50) break;
    }
    if (!found?.id) {
      console.error('이미 등록된 이메일이나, 목록에서 사용자를 찾지 못했습니다.');
      process.exit(1);
    }
    const { error: uErr } = await admin.auth.admin.updateUserById(found.id, {
      password,
      email_confirm: true,
    });
    if (uErr) {
      console.error('기존 사용자 비밀번호 갱신 실패:', uErr.message);
      process.exit(1);
    }
    console.log('기존 계정 비밀번호·이메일 확인 상태를 갱신했습니다:', email);
    process.exit(0);
  }
  console.error('createUser 실패:', error.message);
  process.exit(1);
}

console.log('생성 완료:', data.user?.id, data.user?.email);
