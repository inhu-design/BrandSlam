/**
 * 계좌이체 결제 완료 확인
 * - POST /api/checkout/confirm-bank-transfer
 * - Body: { order_number } + Authorization: Bearer <Supabase JWT>
 * - 주문 이메일과 로그인 사용자 이메일 일치 시 orders만 paid로 갱신 (campaigns는 PAYMENT_PENDING 유지 → 송장·캠페인 세팅 후 착수)
 */
import { createClient } from '@supabase/supabase-js';
import { supabase as supabaseAdmin } from '../lib/supabase-server.js';
import { buildCampaignRowsFromOrderItems } from '../lib/build-campaign-rows-from-order-items.js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://grlayjybcxrcaufnwysb.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdybGF5anliY3hyY2F1Zm53eXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzNDM4NzksImV4cCI6MjA4MDkxOTg3OX0.Voj60xKccEl2_r8EzLVO-fot5WiEiUHb6UTfya2ql8Q';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) {
    return res.status(401).json({ error: '로그인이 필요합니다.' });
  }

  const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
  const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
  if (authError || !user) {
    return res.status(401).json({ error: '로그인 세션이 만료되었습니다.' });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const orderNumber = (body.order_number || '').toString().trim();
  if (!orderNumber || !orderNumber.startsWith('BS-')) {
    return res.status(400).json({ error: 'order_number가 필요합니다.' });
  }

  if (!supabaseAdmin) {
    return res.status(503).json({ error: '서버 설정 오류' });
  }

  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .select('id, email, status, user_id, order_items, plan_name, name, phone, company, client_address, client_biz_reg_no')
    .eq('order_number', orderNumber)
    .single();

  if (orderError || !order) {
    return res.status(404).json({ error: '주문을 찾을 수 없습니다.' });
  }

  if (order.status === 'paid') {
    return res.status(200).json({ ok: true, order_number: orderNumber });
  }

  const orderEmail = (order.email || '').toLowerCase().trim();
  const userEmail = (user.email || '').toLowerCase().trim();
  if (orderEmail !== userEmail) {
    return res.status(403).json({ error: '본인 주문만 결제 완료 처리할 수 있습니다.' });
  }

  try {
    // 결제 완료 시 order_items로 campaigns 생성 (캠페인은 입금 확인 시점에만 생성)
    const orderItems = Array.isArray(order.order_items) ? order.order_items : [];
    const userId = order.user_id || user.id;
    if (userId && orderItems.length > 0) {
      const campaignRows = buildCampaignRowsFromOrderItems(
        orderItems,
        {
          user_id: userId,
          order_number: orderNumber,
          status: 'PAYMENT_PENDING',
          brand_name: order.company || '',
          customer_name: order.name || '',
          customer_email: order.email || '',
          customer_phone: order.phone || '',
          client_address: order.client_address || null,
          client_biz_reg_no: order.client_biz_reg_no || null,
        },
        { orderPlanName: order.plan_name },
      );
      if (campaignRows.length > 0) {
        await supabaseAdmin.from('campaigns').insert(campaignRows);
      }
    }
    await supabaseAdmin.from('orders').update({ status: 'paid' }).eq('order_number', orderNumber);
    return res.status(200).json({ ok: true, order_number: orderNumber });
  } catch (err) {
    console.error('[confirm-bank-transfer]', err);
    return res.status(500).json({ error: String(err.message) });
  }
}
