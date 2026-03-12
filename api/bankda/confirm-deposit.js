/**
 * 뱅크다 연동: 입금 확인 처리 API
 * - 뱅크다가 매칭된 주문을 입금 확인 처리할 때 호출
 * - POST /api/bankda/confirm-deposit
 * - Body: { "requests": [{"order_id": "BS-20260312-XXX"}, ...] }
 */
const { supabase } = require('../lib/supabase-server');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!supabase) {
    return res.status(503).json({ error: 'Server configuration error', code: 401 });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body', code: 401 });
  }

  const requests = body.requests;
  if (!Array.isArray(requests) || requests.length === 0) {
    return res.status(400).json({ error: 'requests array is required', code: 401 });
  }

  const orderIds = requests
    .map((r) => (r && r.order_id) || r)
    .filter((id) => id && typeof id === 'string')
    .map((id) => id.trim());

  if (orderIds.length === 0) {
    return res.status(400).json({ error: 'No valid order_id in requests', code: 401 });
  }

  try {
    // orders 테이블: status -> paid (또는 deposit_confirmed 등 사용 중인 값으로 통일)
    const { error: ordersError } = await supabase
      .from('orders')
      .update({ status: 'paid' })
      .in('order_number', orderIds);

    if (ordersError) {
      console.error('[bankda confirm-deposit] orders update', ordersError);
      return res.status(500).json({ error: ordersError.message, code: 401 });
    }

    // campaigns 테이블: PAYMENT_PENDING -> KICKOFF (입금 확인 후 다음 단계)
    const { error: campaignsError } = await supabase
      .from('campaigns')
      .update({ status: 'KICKOFF' })
      .in('order_number', orderIds);

    if (campaignsError) {
      console.error('[bankda confirm-deposit] campaigns update', campaignsError);
      // orders는 이미 반영됐을 수 있으므로 500만 반환
      return res.status(500).json({ error: campaignsError.message, code: 401 });
    }

    return res.status(200).json({ success: true, count: orderIds.length });
  } catch (err) {
    console.error('[bankda confirm-deposit]', err);
    return res.status(500).json({ error: String(err.message), code: 401 });
  }
};
