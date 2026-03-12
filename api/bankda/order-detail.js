/**
 * 뱅크다 연동: 주문 상세 API
 * - POST /api/bankda/order-detail
 * - Body: { "order_id": "BS-20260312-XXXXXXXX" }
 */
import { supabase } from '../lib/supabase-server.js';

const BANK_ACCOUNT_NO = '32520322490';
const BANK_CODE_NAME = 'SC제일';

function formatOrderDate(isoString) {
  if (!isoString) return null;
  const d = new Date(isoString);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  return `${y}-${m}-${day} ${h}:${min}:${s}`;
}

function toBankdaOrder(row) {
  const orderPrice = Number(row.plan_price) || 0;
  const productName = row.plan_name && row.content_count
    ? `${row.plan_name} ${row.content_count}개`
    : (row.plan_name || '주문');

  return {
    order_id: row.order_number,
    buyer_name: row.name || row.customer_name || '',
    billing_name: row.name || row.customer_name || '',
    bank_account_no: BANK_ACCOUNT_NO,
    bank_code_name: BANK_CODE_NAME,
    order_price_amount: orderPrice,
    order_date: formatOrderDate(row.created_at),
    items: [{ product_name: productName }],
  };
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

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

  const orderId = body.order_id;
  if (!orderId || typeof orderId !== 'string') {
    return res.status(400).json({ error: 'order_id is required', code: 401 });
  }

  try {
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('order_number', orderId.trim())
      .maybeSingle();

    if (error) {
      console.error('[bankda order-detail]', error);
      return res.status(500).json({ error: error.message, code: 401 });
    }

    if (!order) {
      return res.status(404).json({ error: 'Order not found', code: 401 });
    }

    return res.status(200).json(toBankdaOrder(order));
  } catch (err) {
    console.error('[bankda order-detail]', err);
    return res.status(500).json({ error: String(err.message), code: 401 });
  }
}
