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
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!supabase) {
    return res.status(503).json({
      return_code: '1',
      description: 'Server configuration error',
      orders: [],
    });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
  } catch {
    return res.status(400).json({
      return_code: '1',
      description: 'Invalid JSON body',
      orders: [],
    });
  }

  const requests = body.requests;
  if (!Array.isArray(requests) || requests.length === 0) {
    return res.status(400).json({
      return_code: '1',
      description: 'requests 배열이 필요합니다.',
      orders: [],
    });
  }

  const orderIds = requests
    .map((r) => (r && r.order_id) || r)
    .filter((id) => id && typeof id === 'string')
    .map((id) => id.trim());

  if (orderIds.length === 0) {
    return res.status(400).json({
      return_code: '1',
      description: '유효한 order_id가 없습니다.',
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
      return res.status(500).json({
        return_code: '1',
        description: ordersError.message || '주문 상태 업데이트 실패',
        orders: [],
      });
    }

    const { error: campaignsError } = await supabase
      .from('campaigns')
      .update({ status: 'KICKOFF' })
      .in('order_number', orderIds);

    if (campaignsError) {
      console.error('[bankda confirm-deposit] campaigns update', campaignsError);
      return res.status(500).json({
        return_code: '1',
        description: campaignsError.message || '캠페인 상태 업데이트 실패',
        orders: [],
      });
    }

    // 뱅크다 스펙: return_code, description, orders 세 항목만 반환 (그 외 항목은 처리되지 않음)
    return res.status(200).json({
      return_code: '0',
      description: '정상 처리되었습니다',
      orders: orderIds.map((order_id) => ({ order_id, description: '입금확인완료' })),
    });
  } catch (err) {
    console.error('[bankda confirm-deposit]', err);
    return res.status(500).json({
      return_code: '1',
      description: String(err.message),
      orders: [],
    });
  }
}
