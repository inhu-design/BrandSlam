/**
 * 신용카드 결제창 오픈 실패 시 생성된 주문/캠페인 롤백
 * - POST /api/checkout/rollback-order
 * - Body: { order_number: "BS-..." }
 * - 해당 order_number의 campaigns, orders 삭제 (서비스 롤)
 */
import { supabase } from '../lib/supabase-server.js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!supabase) {
    return res.status(503).json({ error: 'Server not configured' });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const orderNumber = (body.order_number || '').toString().trim();
  if (!orderNumber || !orderNumber.startsWith('BS-')) {
    return res.status(400).json({ error: 'order_number required (BS-...)' });
  }

  try {
    await supabase.from('campaigns').delete().eq('order_number', orderNumber);
    await supabase.from('orders').delete().eq('order_number', orderNumber);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[rollback-order]', err);
    return res.status(500).json({ error: String(err.message) });
  }
}
