/**
 * KG이니시스 결제 결과 수신 (returnUrl)
 * STEP2 인증결과 수신 → STEP3 authUrl 승인요청 → STEP4 승인결과(tid) 기준으로 주문 paid 처리
 */
import { supabase } from '../lib/supabase-server.js';
import { buildCampaignRowsFromOrderItems } from '../lib/build-campaign-rows-from-order-items.js';
import { INICIS_SUCCESS_RESULT_CODES, resolveInicisReturnBaseUrl } from '../lib/inicis-config.js';
import {
  extractInicisAuthStep,
  extractInicisPayResult,
  parseInicisCallbackBody,
  requestInicisApproval,
} from '../lib/inicis-approval.js';

const baseUrl = resolveInicisReturnBaseUrl(process.env.INICIS_RETURN_BASE_URL);
const INICIS_MID = process.env.INICIS_MID || '';
const INICIS_SIGNKEY = process.env.INICIS_SIGNKEY || '';

function isPayApproved(pay) {
  return INICIS_SUCCESS_RESULT_CODES.has(pay.resultCode) && Boolean(pay.tid);
}

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.setHeader('Location', `${baseUrl}/checkout/result?success=0&msg=invalid_method`);
    return res.status(302).end();
  }

  const rawBody = parseInicisCallbackBody(req);
  const authStep = extractInicisAuthStep(rawBody);

  let pay = extractInicisPayResult(rawBody);
  let orderId = pay.orderId || authStep.orderId;

  console.info('[inicis payment-callback] auth', {
    method: req.method,
    resultCode: authStep.resultCode,
    resultMsg: authStep.resultMsg || null,
    orderId: orderId || null,
    hasAuthToken: Boolean(authStep.authToken),
    hasAuthUrl: Boolean(authStep.authUrl),
    idcName: authStep.idcName || null,
  });

  if (authStep.authToken && authStep.authUrl) {
    if (!INICIS_SUCCESS_RESULT_CODES.has(authStep.resultCode)) {
      pay = { ...pay, resultCode: authStep.resultCode, resultMsg: authStep.resultMsg, tid: '' };
    } else if (!INICIS_MID || !INICIS_SIGNKEY) {
      console.error('[inicis payment-callback] missing MID/SIGNKEY for approval');
      pay = { ...pay, resultCode: 'CONFIG', resultMsg: '결제 설정 오류', tid: '' };
    } else {
      try {
        const approvalRaw = await requestInicisApproval({
          mid: INICIS_MID || authStep.mid,
          signKey: INICIS_SIGNKEY,
          authToken: authStep.authToken,
          authUrl: authStep.authUrl,
          price: authStep.price || undefined,
        });
        pay = extractInicisPayResult(approvalRaw);
        orderId = pay.orderId || orderId;
        console.info('[inicis payment-callback] approval', {
          resultCode: pay.resultCode,
          resultMsg: pay.resultMsg || null,
          orderId: orderId || null,
          tid: pay.tid || null,
          applNum: pay.applNum || null,
          totPrice: pay.totPrice || null,
          payMethod: pay.payMethod || null,
        });
      } catch (err) {
        console.error('[inicis payment-callback] approval request failed', err);
        pay = {
          resultCode: 'APPROVAL_ERR',
          resultMsg: '승인 요청 실패',
          tid: '',
          orderId,
          totPrice: '',
          applNum: '',
          payMethod: '',
        };
      }
    }
  }

  const isSuccess = isPayApproved(pay);
  const tid = pay.tid;
  const resultMsg = pay.resultMsg;

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
  if (resultMsg) q.set('msg', resultMsg);
  if (tid && isSuccess) q.set('tid', tid);
  if (pay.applNum && isSuccess) q.set('appl_num', pay.applNum);

  const resultPath = (orderId || '').startsWith('CPM-') ? '/cpm/result' : '/checkout/result';
  res.setHeader('Location', `${baseUrl}${resultPath}?${q.toString()}`);
  return res.status(302).end();
}
