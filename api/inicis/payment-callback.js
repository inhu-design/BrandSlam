/**
 * KG이니시스 결제 결과 수신 (returnUrl)
 * - 이니시스가 결제 완료 후 이 URL로 POST
 * - resultCode "00" 또는 "0000" 등 성공 시 orders만 paid로 갱신 (campaigns는 PAYMENT_PENDING 유지 → 송장·캠페인 세팅 후 착수)
 */
import { supabase } from '../lib/supabase-server.js';

const baseUrl = (process.env.INICIS_RETURN_BASE_URL || 'https://www.slam-global.com').replace(/\/$/, '');

function parseBody(req) {
  const contentType = (req.headers['content-type'] || '').toLowerCase();
  if (contentType.includes('application/json')) {
    return typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  }
  if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart')) {
    if (typeof req.body === 'string') {
      const params = new URLSearchParams(req.body);
      return Object.fromEntries(params.entries());
    }
    return req.body || {};
  }
  return typeof req.body === 'string' ? {} : (req.body || {});
}

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.setHeader('Location', `${baseUrl}/checkout/result?success=0&msg=invalid_method`);
    return res.status(302).end();
  }

  const body = req.method === 'GET' ? (req.query || {}) : parseBody(req);
  const resultCode = (body.resultCode || body.resultcode || body.RESULT_CODE || body.result_code || '').toString().trim();
  const orderId = (body.MOID || body.moid || body.orderNumber || body.oid || body.order_number || body.OID || '').toString().trim();
  const successCodes = ['00', '0000', '0', '000'];
  const isSuccess = successCodes.includes(resultCode);

  // 결제 완료 시: 1) order_items로 campaigns 생성, 2) orders를 paid로 갱신
  if (isSuccess && orderId && supabase) {
    try {
      const { data: order } = await supabase
        .from('orders')
        .select('user_id, order_items, name, email, phone, company, client_address, client_biz_reg_no')
        .eq('order_number', orderId)
        .single();

      if (order?.user_id && Array.isArray(order.order_items) && order.order_items.length > 0) {
        const campaignRows = [];
        for (const item of order.order_items) {
          const planName = item.plan_name || '';
          const qty = Math.max(1, Number(item.qty) || 1);
          const unitPrice = Number(item.unit_price) || 0;
          const unitTotal = unitPrice > 0 ? Math.round(unitPrice * 1.1) : 0;
          const unitCount = item.is_visit ? 1 : Math.max(1, Number(item.content_count) || 1);
          for (let i = 0; i < qty; i++) {
            campaignRows.push({
              user_id: order.user_id,
              order_number: orderId,
              plan: planName,
              status: 'PAYMENT_PENDING',
              brand_name: order.company || '',
              product_name: planName,
              target_creators: unitCount,
              matched_creators: 0,
              plan_price: unitTotal,
              content_count: unitCount,
              customer_name: order.name || '',
              customer_email: order.email || '',
              customer_phone: order.phone || '',
              client_address: order.client_address || null,
              client_biz_reg_no: order.client_biz_reg_no || null,
            });
          }
        }
        if (campaignRows.length > 0) {
          await supabase.from('campaigns').insert(campaignRows);
        }
      }
      await supabase.from('orders').update({ status: 'paid' }).eq('order_number', orderId);
    } catch (err) {
      console.error('[inicis payment-callback]', err);
    }
  }

  const q = new URLSearchParams({
    order_number: orderId || '',
    success: isSuccess ? '1' : '0',
  });
  if (body.resultMsg) q.set('msg', body.resultMsg);
  res.setHeader('Location', `${baseUrl}/checkout/result?${q.toString()}`);
  return res.status(302).end();
}
