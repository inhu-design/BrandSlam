/**
 * 서버 전용 Supabase 클라이언트 (Service Role).
 * 뱅크다 API 등 서버에서만 사용하고, 클라이언트에 노출하지 마세요.
 */
const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL || 'https://grlayjybcxrcaufnwysb.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.warn('SUPABASE_SERVICE_ROLE_KEY is not set. Bankda API will not work.');
}

const supabase = serviceRoleKey
  ? createClient(url, serviceRoleKey, { auth: { persistSession: false } })
  : null;

module.exports = { supabase };
