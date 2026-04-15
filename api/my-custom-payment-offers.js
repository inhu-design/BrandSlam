/**
 * 로그인 사용자 본인에게 발급된 활성 개인 결제창 목록 (대시보드용)
 * GET /api/my-custom-payment-offers
 */
import { createClient } from '@supabase/supabase-js';
import { supabase as supabaseAdmin } from '../server/lib/supabase-server.js';
import { computeCustomPaymentOfferTotal } from '../server/lib/db-custom-payment-offers.js';

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

  const email = String(user.email).toLowerCase().trim();

  try {
    const { data, error } = await supabaseAdmin
      .from('custom_payment_offers')
      .select(
        'id, customer_email, title, seeding_qty, seeding_unit_price, seeding_line_label, visit_qty, visit_unit_price, visit_line_label, vat_rate, is_active, created_at',
      )
      .eq('is_active', true)
      .eq('customer_email', email)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message || 'Lookup failed' });

    const offers = (data || []).map((row) => ({
      ...row,
      expected_total: computeCustomPaymentOfferTotal(row),
    }));

    return res.status(200).json({ ok: true, offers });
  } catch (err) {
    console.error('[my-custom-payment-offers]', err);
    return res.status(500).json({ error: String(err?.message || err) });
  }
}
