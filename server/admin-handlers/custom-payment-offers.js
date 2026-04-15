/**
 * 관리자: 개인 결제창(custom_payment_offers) 생성·목록·비활성화
 * GET /api/admin/custom-payment-offers?limit=50
 * POST /api/admin/custom-payment-offers
 * PATCH /api/admin/custom-payment-offers
 */
import { createClient } from '@supabase/supabase-js';
import { supabase as supabaseAdmin } from '../lib/supabase-server.js';
import {
  computeCustomPaymentOfferTotal,
  buildOrderItemsFromCustomPaymentOfferRow,
  getCustomPaymentOfferContentCount,
} from '../lib/db-custom-payment-offers.js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

function parseIntSafe(v, fallback = 0) {
  const n = Number.parseInt(String(v), 10);
  return Number.isFinite(n) ? n : fallback;
}

function parseBigIntSafe(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : fallback;
}

function parseVatRate(v) {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0 || n > 1) return 0.1;
  return n;
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (!['GET', 'POST', 'PATCH'].includes(req.method)) {
    return res.status(405).json({ error: 'Method not allowed' });
  }
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

  const adminEmail = (user.email || '').toLowerCase();
  if (!ADMIN_EMAILS.includes(adminEmail)) return res.status(403).json({ error: 'Admin only' });

  try {
    if (req.method === 'GET') {
      const limit = Math.min(200, Math.max(1, parseIntSafe(req.query?.limit, 50)));
      const { data, error } = await supabaseAdmin
        .from('custom_payment_offers')
        .select(
          'id, customer_email, title, seeding_qty, seeding_unit_price, seeding_line_label, visit_qty, visit_unit_price, visit_line_label, vat_rate, is_active, created_by_admin_email, note, created_at, updated_at',
        )
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) return res.status(500).json({ error: error.message || 'Failed to list offers' });
      const rows = (data || []).map((r) => ({
        ...r,
        expected_total: computeCustomPaymentOfferTotal(r),
        content_count: getCustomPaymentOfferContentCount(r),
      }));
      return res.status(200).json({ ok: true, offers: rows });
    }

    let body;
    try {
      body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    } catch {
      return res.status(400).json({ error: 'Invalid JSON' });
    }

    if (req.method === 'PATCH') {
      const id = String(body.id || '').trim();
      if (!id) return res.status(400).json({ error: 'id required' });
      const is_active = body.is_active;
      if (typeof is_active !== 'boolean') {
        return res.status(400).json({ error: 'is_active (boolean) required' });
      }
      const { data, error } = await supabaseAdmin
        .from('custom_payment_offers')
        .update({ is_active, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .maybeSingle();
      if (error) return res.status(500).json({ error: error.message || 'Update failed' });
      if (!data) return res.status(404).json({ error: 'Offer not found' });
      return res.status(200).json({ ok: true, offer: data });
    }

    const customer_email = String(body.customer_email || '').trim().toLowerCase();
    if (!customer_email || !customer_email.includes('@')) {
      return res.status(400).json({ error: 'Valid customer_email required' });
    }
    const seeding_qty = parseIntSafe(body.seeding_qty, 0);
    const seeding_unit_price = parseBigIntSafe(body.seeding_unit_price, 0);
    const visit_qty = parseIntSafe(body.visit_qty, 0);
    const visit_unit_price = parseBigIntSafe(body.visit_unit_price, 0);
    if (!((seeding_qty > 0 && seeding_unit_price > 0) || (visit_qty > 0 && visit_unit_price > 0))) {
      return res.status(400).json({ error: '시딩 또는 방문형 중 최소 한 줄은 수량·단가가 0보다 커야 합니다.' });
    }

    const row = {
      customer_email,
      title: body.title ? String(body.title).trim().slice(0, 200) : null,
      seeding_qty,
      seeding_unit_price,
      seeding_line_label: String(body.seeding_line_label || '시딩(건당)').trim().slice(0, 120) || '시딩(건당)',
      visit_qty,
      visit_unit_price,
      visit_line_label: String(body.visit_line_label || '방문형 시딩(건당)').trim().slice(0, 120) || '방문형 시딩(건당)',
      vat_rate: parseVatRate(body.vat_rate),
      is_active: true,
      created_by_admin_email: adminEmail,
      note: body.note ? String(body.note).trim().slice(0, 2000) : null,
    };

    const dry = { ...row, id: '00000000-0000-0000-0000-000000000000' };
    const items = buildOrderItemsFromCustomPaymentOfferRow(dry);
    if (items.length === 0) {
      return res.status(400).json({ error: '유효한 결제 라인이 없습니다.' });
    }

    const { data, error } = await supabaseAdmin.from('custom_payment_offers').insert([row]).select().single();
    if (error) return res.status(500).json({ error: error.message || 'Insert failed' });
    return res.status(200).json({
      ok: true,
      offer: {
        ...data,
        expected_total: computeCustomPaymentOfferTotal(data),
        checkout_path: `/checkout?offer=${data.id}`,
      },
    });
  } catch (err) {
    console.error('[admin/custom-payment-offers]', err);
    return res.status(500).json({ error: String(err?.message || err) });
  }
}
