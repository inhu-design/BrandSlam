/**
 * 관리자 전용: 결제 프로세스 스킵 (테스트용)
 * - POST /api/checkout/admin-skip-payment
 * - Body: { order_number, plan_name, plan_price, content_count, ... } + Authorization: Bearer <Supabase JWT>
 * - ADMIN_EMAILS 환경변수에 등록된 이메일만 호출 가능
 */
import { createClient } from '@supabase/supabase-js';
import { supabase as supabaseAdmin } from '../../server/lib/supabase-server.js';
import { buildCampaignRowsFromOrderItems } from '../../server/lib/build-campaign-rows-from-order-items.js';

const supabaseUrl = (process.env.SUPABASE_URL || '').trim();
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (ADMIN_EMAILS.length === 0) {
    return res.status(503).json({ error: 'ADMIN_EMAILS not configured' });
  }
  if (!supabaseUrl) {
    return res.status(503).json({ error: 'SUPABASE_URL not configured' });
  }
  if (!supabaseAnonKey) {
    return res.status(503).json({ error: 'SUPABASE_ANON_KEY required' });
  }

  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) {
    return res.status(401).json({ error: 'Authorization required' });
  }

  const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
  const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
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

  const orderNumber = (body.order_number || '').toString().trim();
  const planName = body.plan_name || '';
  const planPrice = Number(body.plan_price) || 0;
  const contentCount = Number(body.content_count) || 0;
  const orderItems = Array.isArray(body.order_items) ? body.order_items : null;
  const emailVal = body.email || user.email;
  const name = body.name || '';
  const phone = body.phone || '';
  const company = body.company || '';
  const clientAddress = body.client_address || '';
  const clientBizRegNo = body.client_biz_reg_no || '';

  if (!orderNumber || !orderNumber.startsWith('BS-') || !planName || planPrice <= 0) {
    return res.status(400).json({ error: 'order_number, plan_name, plan_price required' });
  }

  if (!supabaseAdmin) {
    return res.status(503).json({ error: 'Server not configured' });
  }

  try {
    await supabaseAdmin.from('orders').insert([{
      order_number: orderNumber,
      plan_name: planName,
      plan_price: planPrice,
      content_count: contentCount,
      email: emailVal,
      name,
      phone,
      company,
      status: 'paid',
    }]);

    let campaignRows = [];
    if (orderItems && orderItems.length > 0) {
      campaignRows = buildCampaignRowsFromOrderItems(
        orderItems,
        {
          user_id: user.id,
          order_number: orderNumber,
          status: 'KICKOFF',
          brand_name: company,
          customer_name: name,
          customer_email: emailVal,
          customer_phone: phone,
          client_address: clientAddress || null,
          client_biz_reg_no: clientBizRegNo || null,
        },
        { orderPlanName: planName },
      );
    } else {
      campaignRows.push({
        user_id: user.id,
        order_number: orderNumber,
        plan: planName,
        status: 'KICKOFF',
        brand_name: company,
        product_name: planName,
        target_creators: contentCount,
        matched_creators: 0,
        plan_price: planPrice,
        content_count: contentCount,
        customer_name: name,
        customer_email: emailVal,
        customer_phone: phone,
      });
    }
    if (campaignRows.length > 0) {
      await supabaseAdmin.from('campaigns').insert(campaignRows);
    }
    return res.status(200).json({ ok: true, order_number: orderNumber });
  } catch (err) {
    console.error('[admin-skip-payment]', err);
    return res.status(500).json({ error: String(err.message) });
  }
}
