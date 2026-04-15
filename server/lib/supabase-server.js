/**
 * 서버 전용 Supabase 클라이언트 (Service Role).
 * KG 이니시스 결제 콜백·입금통보 등 서버에서만 사용하고, 클라이언트에 노출하지 마세요.
 */
import { createClient } from '@supabase/supabase-js';

const url = (process.env.SUPABASE_URL || '').trim();
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.warn('SUPABASE_SERVICE_ROLE_KEY is not set. Inicis payment APIs will not work.');
}

const supabase = serviceRoleKey
  ? createClient(url, serviceRoleKey, { auth: { persistSession: false } })
  : null;

export { supabase };
