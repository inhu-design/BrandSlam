/**
 * DB 개인 결제창 — Checkout/Dashboard 표시용 (금액은 서버 db-custom-payment-offers.js 와 동일 공식)
 */

export function isDbOfferForUser(row, userEmail) {
  if (!row?.customer_email || !userEmail) return false;
  return String(row.customer_email).toLowerCase().trim() === String(userEmail).toLowerCase().trim();
}

export function computeDbOfferTotals(row) {
  const supply =
    (Number(row.seeding_unit_price) || 0) * (Number(row.seeding_qty) || 0)
    + (Number(row.visit_unit_price) || 0) * (Number(row.visit_qty) || 0);
  const r = Number(row.vat_rate);
  const vatRate = Number.isFinite(r) && r >= 0 && r <= 1 ? r : 0.1;
  const vat = Math.round(supply * vatRate);
  return { supply, vat, total: supply + vat, vatRate };
}

export function getDbOfferOrderItemsForDraft(row) {
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

export function getDbOfferContentCount(row) {
  return (Number(row.seeding_qty) || 0) + (Number(row.visit_qty) || 0);
}

/** Checkout lineItems[] 와 동일 형태 */
export function buildDbCustomOfferLineItems(row) {
  const items = [];
  const sQty = Number(row.seeding_qty) || 0;
  const sUnit = Number(row.seeding_unit_price) || 0;
  if (sQty > 0) {
    const name = String(row.seeding_line_label || '시딩(건당)').trim() || '시딩(건당)';
    items.push({
      planId: 'DbCustomSeeding',
      plan: {
        id: 'DbCustomSeeding',
        name,
        price: sUnit.toLocaleString(),
        priceNum: sUnit,
        count: 1,
        desc: '',
        hiddenFromPicker: true,
      },
      qty: sQty,
      unitPrice: sUnit,
      supplyAmount: sQty * sUnit,
      count: sQty,
      isVisit: false,
    });
  }
  const vQty = Number(row.visit_qty) || 0;
  const vUnit = Number(row.visit_unit_price) || 0;
  if (vQty > 0) {
    const name = String(row.visit_line_label || '방문형 시딩(건당)').trim() || '방문형 시딩(건당)';
    items.push({
      planId: 'DbCustomVisit',
      plan: {
        id: 'DbCustomVisit',
        name,
        pricePerPerson: vUnit,
        isVisit: true,
        desc: '',
        hiddenFromPicker: true,
      },
      qty: vQty,
      unitPrice: vUnit,
      supplyAmount: vQty * vUnit,
      count: vQty,
      isVisit: true,
    });
  }
  return items;
}
