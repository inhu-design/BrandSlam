/**
 * 관리자: 최근 주문 전역 조회 (정산·CS·중복 확인)
 * GET /api/admin/recent-orders?limit=80
 */
import { createClient } from '@supabase/supabase-js';
import { supabase as supabaseAdmin } from '../lib/supabase-server.js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (ADMIN_EMAILS.length === 0) return res.status(503).json({ error: 'ADMIN_EMAILS not configured' });
  if (!supabaseAnonKey) return res.status(503).json({ error: 'SUPABASE_ANON_KEY required' });
  if (!supabaseAdmin) return res.status(503).json({ error: 'SUPABASE_SERVICE_ROLE_KEY required' });

  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'Authorization required' });

  const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
  const {
    data: { user },
    error: authError,
  } = await supabaseAuth.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: 'Invalid or expired token' });

  if (!ADMIN_EMAILS.includes((user.email || '').toLowerCase())) {
    return res.status(403).json({ error: 'Admin only' });
  }

  const raw = Number(req.query?.limit);
  const limit = Number.isFinite(raw) ? Math.min(200, Math.max(1, Math.floor(raw))) : 60;

  try {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('order_number, plan_name, plan_price, content_count, email, name, phone, company, status, user_id, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) return res.status(500).json({ error: error.message || 'Failed to load orders' });
    return res.status(200).json({ ok: true, orders: data || [] });
  } catch (err) {
    console.error('[admin/recent-orders]', err);
    return res.status(500).json({ error: String(err?.message || err) });
  }
}
