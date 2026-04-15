/**
 * 관리자: 고객 이메일로 캠페인·주문의 user_id 일괄 연결
 * - 결제는 됐는데 Auth 가입 이메일과 달라 user_id가 비었거나, 대시보드에 캠페인이 안 보일 때
 * POST /api/admin/link-customer-user
 * Body: { customer_email: string, user_id?: string }  — user_id 생략 시 Auth에서 이메일로 조회
 */
import { createClient } from '@supabase/supabase-js';
import { supabase as supabaseAdmin } from '../../server/lib/supabase-server.js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function resolveAuthUserIdByEmail(adminClient, emailNorm) {
  let page = 1;
  const perPage = 1000;
  for (; page <= 25; page += 1) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(error.message || 'listUsers failed');
    const batch = data?.users || [];
    const hit = batch.find((u) => (u.email || '').toLowerCase().trim() === emailNorm);
    if (hit?.id) return hit.id;
    if (batch.length < perPage) break;
  }
  return null;
}

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

  const customerEmail = String(body.customer_email || '').trim().toLowerCase();
  if (!customerEmail || !customerEmail.includes('@')) {
    return res.status(400).json({ error: 'Valid customer_email required' });
  }

  let uid = String(body.user_id || '').trim();
  if (uid && !UUID_RE.test(uid)) {
    return res.status(400).json({ error: 'user_id must be a UUID when provided' });
  }
  if (!uid) {
    try {
      uid = await resolveAuthUserIdByEmail(supabaseAdmin, customerEmail);
    } catch (e) {
      return res.status(500).json({ error: String(e?.message || e) });
    }
    if (!uid) {
      return res.status(404).json({ error: 'Auth에서 해당 이메일 사용자를 찾지 못했습니다. user_id를 직접 넣어 주세요.' });
    }
  }

  try {
    let campIds = [];
    const { data: campEq, error: cEqErr } = await supabaseAdmin
      .from('campaigns')
      .select('id')
      .eq('customer_email', customerEmail);
    if (cEqErr) return res.status(500).json({ error: cEqErr.message || 'campaigns select failed' });
    campIds = (campEq || []).map((r) => r.id).filter(Boolean);

    if (campIds.length === 0) {
      const { data: campScan, error: cScanErr } = await supabaseAdmin
        .from('campaigns')
        .select('id, customer_email')
        .limit(4000);
      if (cScanErr) return res.status(500).json({ error: cScanErr.message || 'campaigns scan failed' });
      campIds = (campScan || [])
        .filter((r) => (r.customer_email || '').toLowerCase().trim() === customerEmail)
        .map((r) => r.id);
    }
    let campaignsUpdated = 0;
    if (campIds.length > 0) {
      const { error: cUpErr } = await supabaseAdmin.from('campaigns').update({ user_id: uid }).in('id', campIds);
      if (cUpErr) return res.status(500).json({ error: cUpErr.message || 'campaigns update failed' });
      campaignsUpdated = campIds.length;
    }

    let ordIds = [];
    const { data: ordEq, error: oEqErr } = await supabaseAdmin
      .from('orders')
      .select('id')
      .eq('email', customerEmail);
    if (oEqErr) return res.status(500).json({ error: oEqErr.message || 'orders select failed' });
    ordIds = (ordEq || []).map((r) => r.id).filter(Boolean);

    if (ordIds.length === 0) {
      const { data: ordScan, error: oScanErr } = await supabaseAdmin.from('orders').select('id, email').limit(4000);
      if (oScanErr) return res.status(500).json({ error: oScanErr.message || 'orders scan failed' });
      ordIds = (ordScan || [])
        .filter((r) => (r.email || '').toLowerCase().trim() === customerEmail)
        .map((r) => r.id);
    }
    let ordersUpdated = 0;
    if (ordIds.length > 0) {
      const { error: oUpErr } = await supabaseAdmin.from('orders').update({ user_id: uid }).in('id', ordIds);
      if (oUpErr) return res.status(500).json({ error: oUpErr.message || 'orders update failed' });
      ordersUpdated = ordIds.length;
    }

    return res.status(200).json({
      ok: true,
      user_id: uid,
      customer_email: customerEmail,
      campaigns_updated: campaignsUpdated,
      orders_updated: ordersUpdated,
    });
  } catch (err) {
    console.error('[admin/link-customer-user]', err);
    return res.status(500).json({ error: String(err?.message || err) });
  }
}
