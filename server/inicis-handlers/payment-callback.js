/**
 * KG이니시스 결제 결과 수신 (returnUrl)
 * - 이니시스가 결제 완료 후 이 URL로 POST
 * - resultCode "00" 또는 "0000" 등 성공 시 orders만 paid로 갱신 (campaigns는 PAYMENT_PENDING 유지 → 송장·캠페인 세팅 후 착수)
 */
import { supabase } from '../lib/supabase-server.js';
import { buildCampaignRowsFromOrderItems } from '../lib/build-campaign-rows-from-order-items.js';
import { INICIS_SUCCESS_RESULT_CODES } from '../lib/inicis-config.js';

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
  const isSuccess = INICIS_SUCCESS_RESULT_CODES.has(resultCode);
  const tid = (body.tid || body.TID || '').toString().trim();
  const totPrice = (body.TotPrice || body.totPrice || body.price || '').toString().trim();

  console.info('[inicis payment-callback]', {
    method: req.method,
    resultCode,
    resultMsg: body.resultMsg || body.resultmsg || '',
    orderId,
    tid: tid || null,
    totPrice: totPrice || null,
    payMethod: body.payMethod || body.PAYMETHOD || null,
    isSuccess,
  });

  // 결제 실패·취소: 임시 초안만 제거 (orders 행은 없음); CPM은 대기 상태 제거
  if (!isSuccess && orderId && supabase) {
    try {
      await supabase.from('checkout_drafts').delete().eq('oid', orderId);
      if (String(orderId).startsWith('CPM-')) {
        await supabase.from('cpm_orders').delete().eq('order_number', orderId).eq('status', 'pending_payment');
      }
    } catch (err) {
      console.error('[inicis payment-callback] draft delete', err);
    }
  }

  // 결제 성공: orders 없으면 checkout_drafts → orders INSERT 후 캠페인 생성, paid 처리
  if (isSuccess && orderId && supabase) {
    try {
      let { data: order } = await supabase
        .from('orders')
        .select('user_id, order_items, plan_name, name, email, phone, company, client_address, client_biz_reg_no, status')
        .eq('order_number', orderId)
        .maybeSingle();

      if (!order?.user_id) {
        const { data: draftRow } = await supabase.from('checkout_drafts').select('payload').eq('oid', orderId).maybeSingle();
        const p = draftRow?.payload;
        if (
          p &&
          String(p.flow || '').toLowerCase() === 'cpm' &&
          p.user_id &&
          orderId.startsWith('CPM-')
        ) {
          await supabase
            .from('cpm_orders')
            .update({ status: 'paid', updated_at: new Date().toISOString() })
            .eq('order_number', orderId)
            .eq('status', 'pending_payment');
          await supabase.from('checkout_drafts').delete().eq('oid', orderId);
        } else if (p && p.user_id && Array.isArray(p.order_items) && p.order_items.length > 0) {
          const insertRow = {
            order_number: orderId,
            plan_name: p.plan_name,
            plan_price: Number(p.plan_price) || 0,
            content_count: p.content_count,
            email: p.email,
            name: p.name,
            phone: p.phone,
            company: p.company || '',
            status: 'paid',
            user_id: p.user_id,
            client_address: p.client_address ?? null,
            client_biz_reg_no: p.client_biz_reg_no ?? null,
            order_items: p.order_items,
          };
          const { error: insErr } = await supabase.from('orders').insert([insertRow]);
          if (!insErr) {
            await supabase.from('checkout_drafts').delete().eq('oid', orderId);
            order = insertRow;
          } else {
            console.error('[inicis payment-callback] orders insert from draft', insErr);
          }
        }
      }

      if (order?.user_id && Array.isArray(order.order_items) && order.order_items.length > 0) {
        const { data: existingCamp } = await supabase.from('campaigns').select('id').eq('order_number', orderId).limit(1);
        if (!existingCamp?.length) {
          const campaignRows = buildCampaignRowsFromOrderItems(
            order.order_items,
            {
              user_id: order.user_id,
              order_number: orderId,
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
            await supabase.from('campaigns').insert(campaignRows);
          }
        }
      }

      if (order?.user_id) {
        await supabase.from('orders').update({ status: 'paid' }).eq('order_number', orderId);
      }
    } catch (err) {
      console.error('[inicis payment-callback]', err);
    }
  }

  const q = new URLSearchParams({
    order_number: orderId || '',
    success: isSuccess ? '1' : '0',
  });
  if (body.resultMsg) q.set('msg', String(body.resultMsg));
  if (tid && isSuccess) q.set('tid', tid);
  const resultPath = (orderId || '').startsWith('CPM-') ? '/cpm/result' : '/checkout/result';
  res.setHeader('Location', `${baseUrl}${resultPath}?${q.toString()}`);
  return res.status(302).end();
}
