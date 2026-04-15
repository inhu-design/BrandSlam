/**
 * 관리자: 신규 캠페인 1건 생성
 * - POST /api/admin/campaign-create
 * - Body: {
 *     customer_email (필수, 가입 이메일 — user_id 연결),
 *     brand_name?, product_name?, plan (기본 '수동 생성'),
 *     customer_name?, customer_phone?,
 *     order_number? (없으면 BS-YYYYMMDD-xxxxxxxx 자동),
 *     status? (기본 PAYMENT_PENDING),
 *     target_creators?, content_count?, plan_price?, matched_creators?, start_date?
 *   }
 */
import { createClient } from '@supabase/supabase-js';
import { supabase as supabaseAdmin } from '../lib/supabase-server.js';
import { resolveAuthUserIdByEmail } from '../lib/resolve-auth-user-by-email.js';

const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

const ALLOWED_STATUS = new Set([
  'PAYMENT_PENDING',
  'KICKOFF',
  'CONTACTING',
  'SHIPPING',
  'UPLOADING',
  'TRACKING',
  'COMPLETED',
]);

function randomOrderSuffix() {
  const hex = '0123456789abcdef';
  let s = '';
  for (let i = 0; i < 8; i += 1) s += hex[Math.floor(Math.random() * 16)];
  return s.toUpperCase();
}

function defaultOrderNumber() {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `BS-${y}${m}${day}-${randomOrderSuffix()}`;
}

function parseStringOrNull(v) {
  if (v == null) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
}

function parseIntOrZero(v) {
  if (v == null || v === '') return 0;
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.round(n));
}

function parseDateOrNull(v) {
  if (v == null || v === '') return null;
  const s = String(v).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(`${s}T12:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return s;
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (ADMIN_EMAILS.length === 0) return res.status(503).json({ error: 'ADMIN_EMAILS not configured' });
  if (!supabaseAnonKey) return res.status(503).json({ error: 'SUPABASE_ANON_KEY required' });
  if (!supabaseAdmin) return res.status(503).json({ error: 'SUPABASE_SERVICE_ROLE_KEY required' });

  const supabaseUrl = (process.env.SUPABASE_URL || '').trim();
  if (!supabaseUrl) return res.status(503).json({ error: 'SUPABASE_URL not configured' });

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
    return res.status(400).json({ error: 'customer_email(가입 이메일)이 필요합니다.' });
  }

  let userId;
  try {
    userId = await resolveAuthUserIdByEmail(supabaseAdmin, customerEmail);
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
  if (!userId) {
    return res.status(404).json({
      error:
        '해당 이메일로 가입한 Auth 사용자가 없습니다. 고객이 먼저 사이트에 가입한 뒤 다시 시도하거나, 기존 「고객 연결」 도구로 user_id를 맞춰 주세요.',
    });
  }

  let orderNumber = parseStringOrNull(body.order_number);
  if (!orderNumber) orderNumber = defaultOrderNumber();

  const { data: dup } = await supabaseAdmin.from('campaigns').select('id').eq('order_number', orderNumber).maybeSingle();
  if (dup?.id) {
    return res.status(409).json({ error: `이미 사용 중인 주문번호입니다: ${orderNumber}` });
  }

  const plan = parseStringOrNull(body.plan) || '수동 생성';
  let status = parseStringOrNull(body.status) || 'PAYMENT_PENDING';
  if (!ALLOWED_STATUS.has(status)) {
    return res.status(400).json({ error: 'status 값이 허용되지 않습니다.' });
  }

  const targetCreators = parseIntOrZero(body.target_creators);
  const contentCount = body.content_count != null && body.content_count !== '' ? parseIntOrZero(body.content_count) : targetCreators;
  const matchedCreators = parseIntOrZero(body.matched_creators);
  const planPrice = parseIntOrZero(body.plan_price);

  const row = {
    user_id: userId,
    order_number: orderNumber,
    plan,
    status,
    brand_name: parseStringOrNull(body.brand_name),
    product_name: parseStringOrNull(body.product_name),
    customer_name: parseStringOrNull(body.customer_name),
    customer_email: customerEmail,
    customer_phone: parseStringOrNull(body.customer_phone),
    client_address: parseStringOrNull(body.client_address),
    client_biz_reg_no: parseStringOrNull(body.client_biz_reg_no),
    target_creators: targetCreators || 0,
    content_count: contentCount || 0,
    matched_creators: matchedCreators,
    plan_price: planPrice || null,
    start_date: parseDateOrNull(body.start_date),
  };

  const { data: created, error: insErr } = await supabaseAdmin
    .from('campaigns')
    .insert([row])
    .select('*, creators (*), contents (*)')
    .single();

  if (insErr) {
    return res.status(500).json({ error: insErr.message || '캠페인 생성 실패' });
  }

  return res.status(200).json({ ok: true, campaign: created });
}
