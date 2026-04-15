/**
 * 로그인 사용자: 본인에게 발급된 활성 개인 결제창 조회
 * GET /api/custom-payment-offer?id=<uuid>
 */
import { createClient } from '@supabase/supabase-js';
import { supabase as supabaseAdmin } from '../server/lib/supabase-server.js';
import {
  computeCustomPaymentOfferTotal,
  buildOrderItemsFromCustomPaymentOfferRow,
  getCustomPaymentOfferContentCount,
} from '../server/lib/db-custom-payment-offers.js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!supabaseAnonKey) return res.status(503).json({ error: 'SUPABASE_ANON_KEY required' });
  if (!supabaseAdmin) return res.status(503).json({ error: 'Server configuration error' });

  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'Authorization required' });

  const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
  const {
    data: { user },
    error: authError,
  } = await supabaseAuth.auth.getUser(token);
  if (authError || !user?.email) return res.status(401).json({ error: 'Invalid or expired token' });

  const id = String(req.query?.id || '').trim();
  if (!id) return res.status(400).json({ error: 'id query required' });

  try {
    const { data, error } = await supabaseAdmin
      .from('custom_payment_offers')
      .select(
        'id, customer_email, title, seeding_qty, seeding_unit_price, seeding_line_label, visit_qty, visit_unit_price, visit_line_label, vat_rate, is_active, created_at',
      )
      .eq('id', id)
      .eq('is_active', true)
      .maybeSingle();

    if (error) return res.status(500).json({ error: error.message || 'Lookup failed' });
    if (!data) return res.status(404).json({ error: 'Offer not found' });

    const viewer = String(user.email).toLowerCase().trim();
    if (viewer !== String(data.customer_email).toLowerCase().trim()) {
      return res.status(403).json({ error: '이 결제창에 접근할 수 없습니다.' });
    }

    return res.status(200).json({
      ok: true,
      offer: {
        ...data,
        expected_total: computeCustomPaymentOfferTotal(data),
        order_items_template: buildOrderItemsFromCustomPaymentOfferRow(data),
        content_count: getCustomPaymentOfferContentCount(data),
      },
    });
  } catch (err) {
    console.error('[custom-payment-offer]', err);
    return res.status(500).json({ error: String(err?.message || err) });
  }
}
