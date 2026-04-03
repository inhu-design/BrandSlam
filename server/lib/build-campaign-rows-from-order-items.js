/**
 * order_items -> campaigns INSERT용 행 배열
 * - Visit(is_visit): 동일 주문 안의 모든 Visit 라인을 수량·금액 합산해 캠페인 1행
 * - 그 외 플랜: 기존처럼 qty만큼 캠페인 행 분할
 */

/**
 * @param {Array<object>} orderItems
 * @param {object} common - user_id, order_number, status, brand_name, customer_*, client_*
 * @param {{ orderPlanName?: string }} [opts] - orders.plan_name (있으면 통합 Visit 행의 product_name 우선)
 */
export function buildCampaignRowsFromOrderItems(orderItems, common, opts = {}) {
  if (!Array.isArray(orderItems) || orderItems.length === 0) return [];

  let visitTotalQty = 0;
  let visitTotalPrice = 0;
  let visitPlanLabel = '';
  const nonVisit = [];

  for (const item of orderItems) {
    if (!item || typeof item !== 'object') continue;
    if (item.is_visit) {
      const qty = Math.max(1, Number(item.qty) || 1);
      const unitPrice = Number(item.unit_price) || 0;
      const unitTotal = unitPrice > 0 ? Math.round(unitPrice * 1.1) : 0;
      if (!visitPlanLabel) visitPlanLabel = (item.plan_name || '').trim() || 'Visit Content';
      visitTotalQty += qty;
      visitTotalPrice += unitTotal * qty;
    } else {
      nonVisit.push(item);
    }
  }

  const rows = [];

  if (visitTotalQty > 0) {
    const orderPn = opts.orderPlanName && String(opts.orderPlanName).trim();
    const productName = orderPn
      ? orderPn
      : visitTotalQty > 1
        ? `${visitPlanLabel} x ${visitTotalQty}`
        : visitPlanLabel;
    rows.push({
      ...common,
      plan: visitPlanLabel,
      product_name: productName,
      target_creators: visitTotalQty,
      content_count: visitTotalQty,
      plan_price: visitTotalPrice,
      matched_creators: 0,
    });
  }

  for (const item of nonVisit) {
    const planName = item.plan_name || '';
    const qty = Math.max(1, Number(item.qty) || 1);
    const unitPrice = Number(item.unit_price) || 0;
    const unitTotal =
      unitPrice > 0
        ? Math.round(unitPrice * 1.1)
        : Math.round((Number(item.supply_amount) || 0) * 1.1);
    const unitCount = Math.max(1, Number(item.content_count) || 1);
    for (let i = 0; i < qty; i++) {
      rows.push({
        ...common,
        plan: planName,
        product_name: planName,
        target_creators: unitCount,
        content_count: unitCount,
        plan_price: unitTotal,
        matched_creators: 0,
      });
    }
  }

  return rows;
}
