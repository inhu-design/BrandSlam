/**
 * 관리자 전용: 캠페인 핵심 정보 수정
 * - POST /api/admin/campaign-update
 * - Body: { campaign_id, brand_name?, product_name?, plan?, status?, customer_name?, customer_email?, customer_phone?, start_date?, target_creators?, matched_creators?, plan_price? }
 * - Authorization: Bearer <Supabase JWT>, ADMIN_EMAILS 등록 계정만
 */
import { createClient } from '@supabase/supabase-js';
import { supabase as supabaseAdmin } from '../../server/lib/supabase-server.js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://grlayjybcxrcaufnwysb.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ALLOWED_STRING_FIELDS = [
  'brand_name',
  'product_name',
  'plan',
  'customer_name',
  'customer_email',
  'customer_phone',
];

const ALLOWED_INT_FIELDS = ['target_creators', 'matched_creators', 'plan_price'];
const ALLOWED_DATE_FIELDS = ['start_date'];
const ALLOWED_STATUS = new Set([
  'PAYMENT_PENDING',
  'KICKOFF',
  'CONTACTING',
  'SHIPPING',
  'UPLOADING',
  'TRACKING',
  'COMPLETED',
]);

function parseStringOrNull(v) {
  if (v == null) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
}

function parseIntOrNull(v) {
  if (v == null || v === '') return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return { error: '숫자 형식이 아닙니다.' };
  return Math.round(n);
}

function parseDateOrNull(v) {
  if (v == null || v === '') return null;
  const s = String(v).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return { error: 'YYYY-MM-DD 형식이어야 합니다.' };
  const d = new Date(`${s}T12:00:00`);
  if (Number.isNaN(d.getTime())) return { error: '유효한 날짜가 아닙니다.' };
  return s;
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (req.method !== 'POST') {
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

  const update = {};

  for (const key of ALLOWED_STRING_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(body, key)) continue;
    update[key] = parseStringOrNull(body[key]);
  }

  for (const key of ALLOWED_INT_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(body, key)) continue;
    const parsed = parseIntOrNull(body[key]);
    if (parsed && typeof parsed === 'object' && parsed.error) {
      return res.status(400).json({ error: `${key}: ${parsed.error}` });
    }
    update[key] = parsed;
  }

  for (const key of ALLOWED_DATE_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(body, key)) continue;
    const parsed = parseDateOrNull(body[key]);
    if (parsed && typeof parsed === 'object' && parsed.error) {
      return res.status(400).json({ error: `${key}: ${parsed.error}` });
    }
    update[key] = parsed;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'status')) {
    const status = parseStringOrNull(body.status);
    if (status != null && !ALLOWED_STATUS.has(status)) {
      return res.status(400).json({ error: 'status 값이 허용되지 않습니다.' });
    }
    update.status = status;
  }

  if (Object.keys(update).length === 0) {
    return res.status(400).json({ error: 'No editable fields provided' });
  }

  const { data, error } = await supabaseAdmin
    .from('campaigns')
    .update(update)
    .eq('id', campaignId)
    .select(
      'id, order_number, brand_name, product_name, plan, status, customer_name, customer_email, customer_phone, start_date, target_creators, matched_creators, plan_price',
    )
    .maybeSingle();

  if (error) {
    return res.status(500).json({ error: error.message || 'Update failed' });
  }
  if (!data) {
    return res.status(404).json({ error: 'Campaign not found' });
  }

  return res.status(200).json({ ok: true, campaign: data });
}
