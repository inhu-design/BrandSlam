/**
 * KG이니시스 결제 결과 수신 (returnUrl)
 * - 이니시스가 결제 완료 후 이 URL로 POST
 * - resultCode "00" 또는 "0000" 등 성공 시 orders/campaigns 상태를 paid·KICKOFF로 갱신 후 리다이렉트
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

  // 카드·실시간 계좌이체 모두 즉시 완료 → paid/KICKOFF 갱신
  if (isSuccess && orderId && supabase) {
    try {
      await supabase.from('orders').update({ status: 'paid' }).eq('order_number', orderId);
      await supabase.from('campaigns').update({ status: 'KICKOFF' }).eq('order_number', orderId);
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
