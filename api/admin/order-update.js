/**
 * 관리자: 주문 상태·금액 보정 (환불 표기, 오타 수정 등)
 * POST /api/admin/order-update
 * Body: { order_number, status?, plan_price? }
 */
import { createClient } from '@supabase/supabase-js';
import { supabase as supabaseAdmin } from '../../server/lib/supabase-server.js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

const ALLOWED_STATUS = new Set(['paid', 'pending_payment', 'refunded', 'cancelled']);

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
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

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const orderNumber = String(body.order_number || '').trim();
  if (!orderNumber || !orderNumber.startsWith('BS-')) {
    return res.status(400).json({ error: 'order_number (BS-...) required' });
  }

  const patch = {};
  if (Object.prototype.hasOwnProperty.call(body, 'status')) {
    const s = String(body.status || '').trim();
    if (!ALLOWED_STATUS.has(s)) {
      return res.status(400).json({ error: `status must be one of: ${[...ALLOWED_STATUS].join(', ')}` });
    }
    patch.status = s;
  }
  if (Object.prototype.hasOwnProperty.call(body, 'plan_price')) {
    const n = Number(body.plan_price);
    if (!Number.isFinite(n) || n < 0) {
      return res.status(400).json({ error: 'plan_price must be a non-negative number' });
    }
    patch.plan_price = Math.round(n);
  }

  if (Object.keys(patch).length === 0) {
    return res.status(400).json({ error: 'Provide status and/or plan_price' });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .update(patch)
      .eq('order_number', orderNumber)
      .select('order_number, plan_name, plan_price, status, email, user_id, created_at')
      .maybeSingle();

    if (error) return res.status(500).json({ error: error.message || 'Update failed' });
    if (!data) return res.status(404).json({ error: 'Order not found' });
    return res.status(200).json({ ok: true, order: data });
  } catch (err) {
    console.error('[admin/order-update]', err);
    return res.status(500).json({ error: String(err?.message || err) });
  }
}
