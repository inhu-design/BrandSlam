/**
 * 관리자 여부만 서버에서 확인 (클라이언트에 ADMIN 이메일 목록을 숨기기 위함)
 * - GET /api/admin/admin-session
 * - Authorization: Bearer <Supabase JWT>
 * - 응답: { ok: true, is_admin: boolean, email: string|null }
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (process.env.SUPABASE_URL || '').trim();
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!supabaseUrl) return res.status(503).json({ error: 'SUPABASE_URL not configured' });
  if (!supabaseAnonKey) return res.status(503).json({ error: 'SUPABASE_ANON_KEY required' });
  if (ADMIN_EMAILS.length === 0) return res.status(503).json({ error: 'ADMIN_EMAILS not configured' });

  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) {
    return res.status(200).json({ ok: true, is_admin: false, email: null });
  }

  const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
  const {
    data: { user },
    error: authError,
  } = await supabaseAuth.auth.getUser(token);
  if (authError || !user) {
    return res.status(200).json({ ok: true, is_admin: false, email: null });
  }

  const email = (user.email || '').toLowerCase();
  const isAdmin = ADMIN_EMAILS.includes(email);
  return res.status(200).json({ ok: true, is_admin: isAdmin, email: user.email || null });
}
