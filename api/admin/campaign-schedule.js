/**
 * 관리자 전용: 임의 캠페인의 착수 일정(마일스톤) 조회·저장
 * - GET  /api/admin/campaign-schedule?campaign_id=<uuid>
 * - POST /api/admin/campaign-schedule
 *   Body: { campaign_id, schedule_list_delivery_date?, ... } — 빈 문자열/null이면 해당 컬럼 NULL로 초기화
 * - Authorization: Bearer <Supabase JWT>, ADMIN_EMAILS에 등록된 계정만
 */
import { createClient } from '@supabase/supabase-js';
import { supabase as supabaseAdmin } from '../lib/supabase-server.js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://grlayjybcxrcaufnwysb.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

const SCHEDULE_COLUMNS = [
  'schedule_list_delivery_date',
  'schedule_shipping_date',
  'schedule_upload_start_date',
  'schedule_upload_deadline_date',
  'schedule_tracking_end_date',
  'schedule_visit_content_guide_date',
  'schedule_visit_reannounce_1_date',
  'schedule_visit_reannounce_2_date',
  'schedule_visit_notice_start_date',
  'schedule_visit_notice_end_date',
  'schedule_visit_festival_start_date',
  'schedule_visit_festival_end_date',
];

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function parseDateOrNull(v) {
  if (v === undefined) return undefined;
  if (v === null) return null;
  const s = String(v).trim();
  if (!s) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return { error: '날짜는 YYYY-MM-DD 형식이어야 합니다.' };
  const d = new Date(s + 'T12:00:00');
  if (Number.isNaN(d.getTime())) return { error: '유효하지 않은 날짜입니다.' };
  return s;
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (!['GET', 'POST'].includes(req.method)) {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (ADMIN_EMAILS.length === 0) {
    return res.status(503).json({ error: 'ADMIN_EMAILS not configured' });
  }

  if (!supabaseAnonKey) {
    return res.status(503).json({ error: 'SUPABASE_ANON_KEY required' });
  }

  if (!supabaseAdmin) {
    return res.status(503).json({ error: 'SUPABASE_SERVICE_ROLE_KEY required' });
  }

  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) {
    return res.status(401).json({ error: 'Authorization required' });
  }

  const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
  const {
    data: { user },
    error: authError,
  } = await supabaseAuth.auth.getUser(token);
  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const email = (user.email || '').toLowerCase();
  if (!ADMIN_EMAILS.includes(email)) {
    return res.status(403).json({ error: 'Admin only' });
  }

  let postBody;
  if (req.method === 'POST') {
    try {
      postBody = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    } catch {
      return res.status(400).json({ error: 'Invalid JSON' });
    }
  }

  const campaignId =
    req.method === 'GET'
      ? ((req.query || {}).campaign_id || '').toString().trim()
      : (postBody.campaign_id || '').toString().trim();

  if (!campaignId || !UUID_RE.test(campaignId)) {
    return res.status(400).json({ error: 'Valid campaign_id (UUID) required' });
  }

  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('campaigns')
      .select(
        `id, brand_name, product_name, order_number, plan, ${SCHEDULE_COLUMNS.join(', ')}`,
      )
      .eq('id', campaignId)
      .maybeSingle();

    if (error) {
      return res.status(500).json({ error: error.message || 'Query failed' });
    }
    if (!data) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    return res.status(200).json({ campaign: data });
  }

  const body = postBody;
  const update = {};
  for (const col of SCHEDULE_COLUMNS) {
    if (!Object.prototype.hasOwnProperty.call(body, col)) continue;
    const parsed = parseDateOrNull(body[col]);
    if (parsed && typeof parsed === 'object' && parsed.error) {
      return res.status(400).json({ error: `${col}: ${parsed.error}` });
    }
    update[col] = parsed;
  }

  if (Object.keys(update).length === 0) {
    return res.status(400).json({ error: 'No schedule fields to update' });
  }

  const { data, error } = await supabaseAdmin
    .from('campaigns')
    .update(update)
    .eq('id', campaignId)
    .select(SCHEDULE_COLUMNS.join(', '))
    .maybeSingle();

  if (error) {
    return res.status(500).json({ error: error.message || 'Update failed' });
  }
  if (!data) {
    return res.status(404).json({ error: 'Campaign not found' });
  }

  return res.status(200).json({ ok: true, campaign_id: campaignId, schedule: data });
}
