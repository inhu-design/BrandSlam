import { supabase } from './supabase-server.js';

export async function assertCpmOrderPrice(orderDraft, price, supabaseClient = supabase) {
  const p = orderDraft || {};
  if (!p.flow || String(p.flow) !== 'cpm') {
    return { ok: false, status: 400, error: 'Not a CPM draft' };
  }
  const oid = (p.order_number || '').trim();
  const userId = p.user_id;
  if (!oid || !userId || !String(oid).startsWith('CPM-')) {
    return { ok: false, status: 400, error: 'cpm draft: order_number (CPM-...) and user_id required' };
  }
  const priceNum = Number(price);
  if (!Number.isFinite(priceNum) || priceNum <= 0) {
    return { ok: false, status: 400, error: 'invalid price' };
  }

  if (!supabaseClient) {
    return { ok: false, status: 503, error: 'Server cannot validate CPM order (service role missing).' };
  }

  const { data: row, error } = await supabaseClient
    .from('cpm_orders')
    .select('id, order_number, user_id, status, budget_krw, sku')
    .eq('order_number', oid)
    .maybeSingle();

  if (error) {
    console.error('[assertCpmOrderPrice]', error);
    return { ok: false, status: 500, error: 'CPM order lookup failed' };
  }
  if (!row) {
    return { ok: false, status: 404, error: 'CPM order not found' };
  }
  if (String(row.user_id) !== String(userId)) {
    return { ok: false, status: 403, error: 'CPM order user mismatch' };
  }
  if (String(row.status) !== 'pending_payment') {
    return { ok: false, status: 400, error: 'CPM order is not awaiting payment' };
  }
  if (Number(row.budget_krw) !== priceNum) {
    return { ok: false, status: 400, error: 'CPM payment amount mismatch' };
  }

  return { ok: true };
}
