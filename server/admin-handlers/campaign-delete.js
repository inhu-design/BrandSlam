/**
 * 관리자: 캠페인 및 연관 고아 레코드 삭제
 * - POST /api/admin/campaign-delete
 * - Body: { campaign_id: UUID, confirm_order_number: string } — confirm_order_number 는 해당 캠페인의 order_number 와 정확히 일치해야 함
 */
import { createClient } from '@supabase/supabase-js';
import { supabase as supabaseAdmin } from '../lib/supabase-server.js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

  const campaignId = String(body.campaign_id || '').trim();
  if (!campaignId || !UUID_RE.test(campaignId)) {
    return res.status(400).json({ error: 'Valid campaign_id (UUID) required' });
  }

  const confirm = String(body.confirm_order_number || '').trim();
  if (!confirm) {
    return res.status(400).json({ error: 'confirm_order_number 에 삭제할 캠페인의 주문번호를 그대로 입력해야 합니다.' });
  }

  const { data: camp, error: fetchErr } = await supabaseAdmin
    .from('campaigns')
    .select('id, order_number')
    .eq('id', campaignId)
    .maybeSingle();

  if (fetchErr) return res.status(500).json({ error: fetchErr.message || '조회 실패' });
  if (!camp?.id) return res.status(404).json({ error: '캠페인을 찾을 수 없습니다.' });

  const on = String(camp.order_number || '').trim();
  if (!on || on !== confirm) {
    return res.status(400).json({ error: 'confirm_order_number 가 이 캠페인의 주문번호와 일치하지 않습니다.' });
  }

  const refId = String(camp.id);

  const { error: dropErr } = await supabaseAdmin
    .from('creator_drops')
    .delete()
    .eq('reference_type', 'campaign')
    .eq('reference_id', refId);
  if (dropErr) {
    return res.status(500).json({ error: `creator_drops 삭제 실패: ${dropErr.message}` });
  }

  const { error: sessErr } = await supabaseAdmin
    .from('delivery_list_sessions')
    .delete()
    .eq('reference_type', 'campaign')
    .eq('reference_id', refId);
  if (sessErr) {
    const msg = String(sessErr.message || '').toLowerCase();
    const missing =
      msg.includes('delivery_list_sessions') && (msg.includes('does not exist') || msg.includes('schema cache'));
    if (!missing) {
      return res.status(500).json({ error: `delivery_list_sessions 삭제 실패: ${sessErr.message}` });
    }
  }

  const { error: delErr } = await supabaseAdmin.from('campaigns').delete().eq('id', campaignId);
  if (delErr) {
    return res.status(500).json({ error: delErr.message || '캠페인 삭제 실패' });
  }

  return res.status(200).json({ ok: true, deleted_id: campaignId, order_number: on });
}
