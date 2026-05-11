/**
 * 계좌이체 결제 완료 확인
 * - POST /api/checkout/confirm-bank-transfer
 * - Body: { order_number } + Authorization: Bearer <Supabase JWT>
 * - 주문 이메일과 로그인 사용자 이메일 일치 시 orders만 paid로 갱신 (campaigns는 PAYMENT_PENDING 유지 → 송장·캠페인 세팅 후 착수)
 */
import { createClient } from '@supabase/supabase-js';
import { supabase as supabaseAdmin } from '../lib/supabase-server.js';
import { buildCampaignRowsFromOrderItems } from '../lib/build-campaign-rows-from-order-items.js';
import { assertFramelessBankPayload } from '../lib/custom-offers.js';
import { assertDbCustomPaymentBankPayload } from '../lib/db-custom-payment-offers.js';

const supabaseUrl = (process.env.SUPABASE_URL || '').trim();
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!supabaseUrl || !supabaseAnonKey) {
    return res.status(503).json({ error: 'Supabase 환경변수(SUPABASE_URL, SUPABASE_ANON_KEY)가 설정되지 않았습니다.' });
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

  const orderPayload = body.order_payload;

  if (!supabaseAdmin) {
    return res.status(503).json({ error: '서버 설정 오류' });
  }

  const userEmail = (user.email || '').toLowerCase().trim();

  let { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .select('id, email, status, user_id, order_items, plan_name, name, phone, company, client_address, client_biz_reg_no')
    .eq('order_number', orderNumber)
    .maybeSingle();

  if (orderError) {
    return res.status(500).json({ error: '주문 조회에 실패했습니다.' });
  }

  // 무통장: 입금 확인 전까지 orders에 행이 없음 → 클라이언트가 보낸 order_payload로 최초 INSERT
  if (!order) {
    if (!orderPayload || typeof orderPayload !== 'object') {
      return res.status(404).json({ error: '주문을 찾을 수 없습니다. 계좌 안내를 다시 받아 주세요.' });
    }
    if (String(orderPayload.order_number || '') !== orderNumber) {
      return res.status(400).json({ error: 'order_payload.order_number가 일치하지 않습니다.' });
    }
    const payloadEmail = (orderPayload.email || '').toLowerCase().trim();
    if (!payloadEmail || payloadEmail !== userEmail) {
      return res.status(403).json({ error: '본인 주문만 결제 완료 처리할 수 있습니다.' });
    }
    if (orderPayload.user_id && orderPayload.user_id !== user.id) {
      return res.status(403).json({ error: '본인 주문만 결제 완료 처리할 수 있습니다.' });
    }
    let bankCheck;
    if (orderPayload.custom_payment_offer_id) {
      bankCheck = await assertDbCustomPaymentBankPayload(orderPayload, supabaseAdmin);
    } else {
      bankCheck = assertFramelessBankPayload(orderPayload);
    }
    if (!bankCheck.ok) {
      return res.status(bankCheck.status || 400).json({ error: bankCheck.error });
    }
    const items = Array.isArray(orderPayload.order_items) ? orderPayload.order_items : [];
    if (items.length === 0) {
      return res.status(400).json({ error: 'order_items가 비어 있습니다.' });
    }
    const insertRow = {
      order_number: orderNumber,
      plan_name: orderPayload.plan_name,
      plan_price: Number(orderPayload.plan_price) || 0,
      content_count: orderPayload.content_count,
      email: orderPayload.email,
      name: orderPayload.name,
      phone: orderPayload.phone,
      company: orderPayload.company || '',
      status: 'paid',
      user_id: user.id,
      client_address: orderPayload.client_address ?? null,
      client_biz_reg_no: orderPayload.client_biz_reg_no ?? null,
      order_items: items,
    };
    const { error: insErr } = await supabaseAdmin.from('orders').insert([insertRow]);
    if (insErr) {
      console.error('[confirm-bank-transfer] insert', insErr);
      return res.status(500).json({ error: '주문 생성에 실패했습니다.' });
    }
    const { data: order2 } = await supabaseAdmin
      .from('orders')
      .select('id, email, status, user_id, order_items, plan_name, name, phone, company, client_address, client_biz_reg_no')
      .eq('order_number', orderNumber)
      .single();
    order = order2;
  }

  if (!order) {
    return res.status(404).json({ error: '주문을 찾을 수 없습니다.' });
  }

  const orderEmail = (order.email || '').toLowerCase().trim();
  if (orderEmail !== userEmail) {
    return res.status(403).json({ error: '본인 주문만 결제 완료 처리할 수 있습니다.' });
  }

  if (order.status === 'paid') {
    const orderItems = Array.isArray(order.order_items) ? order.order_items : [];
    const userId = order.user_id || user.id;
    if (userId && orderItems.length > 0) {
      const { data: existingCamp } = await supabaseAdmin.from('campaigns').select('id').eq('order_number', orderNumber).limit(1);
      if (!existingCamp?.length) {
        try {
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
        } catch (err) {
          console.error('[confirm-bank-transfer] idempotent campaigns', err);
        }
      }
    }
    return res.status(200).json({ ok: true, order_number: orderNumber });
  }

  try {
    const orderItems = Array.isArray(order.order_items) ? order.order_items : [];
    const userId = order.user_id || user.id;
    if (userId && orderItems.length > 0) {
      const { data: existingCamp } = await supabaseAdmin.from('campaigns').select('id').eq('order_number', orderNumber).limit(1);
      if (!existingCamp?.length) {
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
    }
    await supabaseAdmin.from('orders').update({ status: 'paid' }).eq('order_number', orderNumber);
    return res.status(200).json({ ok: true, order_number: orderNumber });
  } catch (err) {
    console.error('[confirm-bank-transfer]', err);
    return res.status(500).json({ error: String(err.message) });
  }
}
