/**
 * 뱅크다 연동: 입금 확인 처리 API
 * - POST /api/bankda/confirm-deposit
 * - Body: { "requests": [{"order_id": "BS-20260312-XXX"}, ...] }
 */
import { supabase } from '../lib/supabase-server.js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({
      return_code: 400,
      description: 'Method not allowed',
      orders: [],
    });
  }

  if (!supabase) {
    return res.status(503).json({
      return_code: 401,
      description: 'Server configuration error',
      orders: [],
    });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
  } catch {
    return res.status(400).json({
      return_code: 400,
      description: '요청 format 오류',
      orders: [],
    });
  }

  const requests = body.requests;
  if (!Array.isArray(requests) || requests.length === 0) {
    return res.status(400).json({
      return_code: 400,
      description: '요청 format 오류',
      orders: [],
    });
  }

  const orderIds = requests
    .map((r) => (r && r.order_id) || r)
    .filter((id) => id && typeof id === 'string')
    .map((id) => id.trim());

  if (orderIds.length === 0) {
    return res.status(400).json({
      return_code: 400,
      description: '요청 format 오류',
      orders: [],
    });
  }

  try {
    const { error: ordersError } = await supabase
      .from('orders')
      .update({ status: 'paid' })
      .in('order_number', orderIds);

    if (ordersError) {
      console.error('[bankda confirm-deposit] orders update', ordersError);
      return res.status(200).json({
        return_code: 415,
        description: 'order id 오류',
        orders: orderIds.map((order_id) => ({ order_id, description: '주문 상태 업데이트 실패' })),
      });
    }

    const { error: campaignsError } = await supabase
      .from('campaigns')
      .update({ status: 'KICKOFF' })
      .in('order_number', orderIds);

    if (campaignsError) {
      console.error('[bankda confirm-deposit] campaigns update', campaignsError);
      return res.status(200).json({
        return_code: 415,
        description: 'order id 오류',
        orders: orderIds.map((order_id) => ({ order_id, description: '캠페인 상태 업데이트 실패' })),
      });
    }

    // 뱅크다 API 연동 가이드: 정상 시 return_code 200, description "정상", orders[].description "성공"
    const payload = {
      return_code: 200,
      description: '정상',
      orders: orderIds.map((order_id) => ({ order_id, description: '성공' })),
    };
    res.status(200).setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.end(JSON.stringify(payload));
  } catch (err) {
    console.error('[bankda confirm-deposit]', err);
    return res.status(200).json({
      return_code: 400,
      description: String(err.message),
      orders: [],
    });
  }
}
