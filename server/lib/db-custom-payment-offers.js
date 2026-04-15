/**
 * DB 기반 개인 결제창 — 금액·order_items 검증 (클라이언트 조작 방지)
 * 테이블: custom_payment_offers
 */

function normEmail(v) {
  return String(v || '').toLowerCase().trim();
}

export function computeCustomPaymentOfferSupply(row) {
  const seed = (Number(row.seeding_unit_price) || 0) * (Number(row.seeding_qty) || 0);
  const visit = (Number(row.visit_unit_price) || 0) * (Number(row.visit_qty) || 0);
  return seed + visit;
}

export function computeCustomPaymentOfferTotal(row) {
  const supply = computeCustomPaymentOfferSupply(row);
  const vatRate = Number(row.vat_rate);
  const rate = Number.isFinite(vatRate) && vatRate >= 0 ? vatRate : 0.1;
  const vat = Math.round(supply * rate);
  return supply + vat;
}

export function buildOrderItemsFromCustomPaymentOfferRow(row) {
  const seedLabel = String(row.seeding_line_label || '시딩(건당)').trim() || '시딩(건당)';
  const visitLabel = String(row.visit_line_label || '방문형 시딩(건당)').trim() || '방문형 시딩(건당)';
  const sQty = Number(row.seeding_qty) || 0;
  const sUnit = Number(row.seeding_unit_price) || 0;
  const vQty = Number(row.visit_qty) || 0;
  const vUnit = Number(row.visit_unit_price) || 0;
  const items = [];
  if (sQty > 0) {
    items.push({
      plan_name: `${seedLabel} x${sQty}`,
      qty: 1,
      unit_price: 0,
      content_count: sQty,
      is_visit: false,
      supply_amount: sUnit * sQty,
    });
  }
  if (vQty > 0) {
    items.push({
      plan_name: `${visitLabel} x${vQty}`,
      qty: vQty,
      unit_price: vUnit,
      content_count: 1,
      is_visit: true,
    });
  }
  return items;
}

export function getCustomPaymentOfferContentCount(row) {
  return (Number(row.seeding_qty) || 0) + (Number(row.visit_qty) || 0);
}

function itemsMatchPayload(expected, actual) {
  if (!Array.isArray(actual) || actual.length !== expected.length) return false;
  for (let i = 0; i < expected.length; i += 1) {
    const e = expected[i];
    const a = actual[i];
    if (!a || typeof a !== 'object') return false;
    if (String(a.plan_name || '') !== String(e.plan_name || '')) return false;
    if (Number(a.qty) !== Number(e.qty)) return false;
    if (Number(a.unit_price) !== Number(e.unit_price)) return false;
    if (Number(a.content_count) !== Number(e.content_count)) return false;
    if (!!a.is_visit !== !!e.is_visit) return false;
    if (Number(a.supply_amount || 0) !== Number(e.supply_amount || 0)) return false;
  }
  return true;
}

export async function fetchActiveCustomPaymentOfferById(supabaseAdmin, id) {
  if (!supabaseAdmin || !id) return null;
  const { data, error } = await supabaseAdmin
    .from('custom_payment_offers')
    .select('*')
    .eq('id', id)
    .eq('is_active', true)
    .maybeSingle();
  if (error) {
    console.error('[custom_payment_offers] fetch', error);
    return null;
  }
  return data || null;
}

/**
 * @param {object} orderDraft
 * @param {string|number} requestedPrice
 */
export async function assertDbCustomPaymentOfferPrice(orderDraft, requestedPrice, supabaseAdmin) {
  const offerId = orderDraft?.custom_payment_offer_id;
  if (!offerId) return { ok: true };
  const row = await fetchActiveCustomPaymentOfferById(supabaseAdmin, String(offerId));
  if (!row) {
    return { ok: false, status: 400, error: '개인 결제 정보를 찾을 수 없거나 비활성화되었습니다.' };
  }
  const em = normEmail(orderDraft.email);
  if (!em || em !== normEmail(row.customer_email)) {
    return { ok: false, status: 403, error: '이 개인 결제창은 지정된 계정에서만 이용할 수 있습니다.' };
  }
  const expected = computeCustomPaymentOfferTotal(row);
  if (Number(requestedPrice) !== expected) {
    return { ok: false, status: 400, error: '결제 금액이 견적과 일치하지 않습니다. 페이지를 새로고침 후 다시 시도해 주세요.' };
  }
  const expectedItems = buildOrderItemsFromCustomPaymentOfferRow(row);
  if (!itemsMatchPayload(expectedItems, orderDraft.order_items)) {
    return { ok: false, status: 400, error: '주문 품목이 견적과 일치하지 않습니다.' };
  }
  const cc = getCustomPaymentOfferContentCount(row);
  if (Number(orderDraft.content_count) !== cc) {
    return { ok: false, status: 400, error: '콘텐츠 수량 정보가 올바르지 않습니다.' };
  }
  return { ok: true };
}

/**
 * 계좌이체 order_payload 검증
 */
export async function assertDbCustomPaymentBankPayload(orderPayload, supabaseAdmin) {
  const offerId = orderPayload?.custom_payment_offer_id;
  if (!offerId) return { ok: true };
  const row = await fetchActiveCustomPaymentOfferById(supabaseAdmin, String(offerId));
  if (!row) {
    return { ok: false, status: 400, error: '개인 결제 정보를 찾을 수 없거나 비활성화되었습니다.' };
  }
  const em = normEmail(orderPayload.email);
  if (!em || em !== normEmail(row.customer_email)) {
    return { ok: false, status: 403, error: '이 개인 결제창은 지정된 계정에서만 이용할 수 있습니다.' };
  }
  const expected = computeCustomPaymentOfferTotal(row);
  if (Number(orderPayload.plan_price) !== expected) {
    return { ok: false, status: 400, error: '맞춤 결제 금액이 올바르지 않습니다.' };
  }
  const expectedItems = buildOrderItemsFromCustomPaymentOfferRow(row);
  if (!itemsMatchPayload(expectedItems, orderPayload.order_items)) {
    return { ok: false, status: 400, error: '주문 품목이 견적과 일치하지 않습니다.' };
  }
  return { ok: true };
}
