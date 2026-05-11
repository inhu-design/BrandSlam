/**
 * Bearer Supabase JWT → auth.users 사용자 조회 (서버 전용)
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (process.env.SUPABASE_URL || '').trim();
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

export async function getBearerUser(req) {
  if (!supabaseUrl || !supabaseAnonKey) return { error: null, user: null, statusCode: 503 };
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) return { error: 'Authorization required', user: null, statusCode: 401 };
  const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  });
  const { data: { user }, error } = await supabaseAuth.auth.getUser(token);
  if (error || !user) {
    return { error: 'Invalid or expired token', user: null, statusCode: 401 };
  }
  return { error: null, user, statusCode: 200 };
}
