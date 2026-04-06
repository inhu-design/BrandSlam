/**
 * 개인 맞춤 결제 오퍼 (The Frameless / suyoungkim@theframeless.co)
 * — Checkout·Dashboard에서 공통 사용. 금액 변경 시 서버(server/lib/custom-offers.js)와 반드시 동기화.
 */
export const CUSTOM_OFFER_FRAMELESS_ID = 'frameless-suyoungkim';
export const CUSTOM_OFFER_FRAMELESS_EMAIL = 'suyoungkim@theframeless.co';

export const FRAMELESS_PLAN_IDS = {
  seeding: 'CustomSeedingFrameless',
  visitSeeding: 'CustomVisitSeedingFrameless',
};

export const FRAMELESS_OFFER_PRICING = {
  seedingUnitPrice: 35000,
  seedingQty: 300,
  visitUnitPrice: 240000,
  visitQty: 10,
  vatRate: 0.1,
};

/** 시딩 35,000×300 + 방문형 시딩 240,000×10 (공급가, 부가세 별도) */
export function getFramelessOfferTotals() {
  const supply =
    FRAMELESS_OFFER_PRICING.seedingUnitPrice * FRAMELESS_OFFER_PRICING.seedingQty
    + FRAMELESS_OFFER_PRICING.visitUnitPrice * FRAMELESS_OFFER_PRICING.visitQty;
  const vat = Math.round(supply * FRAMELESS_OFFER_PRICING.vatRate);
  return { supply, vat, total: supply + vat };
}

export function getFramelessOfferCart() {
  return [
    { planId: FRAMELESS_PLAN_IDS.seeding, qty: FRAMELESS_OFFER_PRICING.seedingQty },
    { planId: FRAMELESS_PLAN_IDS.visitSeeding, qty: FRAMELESS_OFFER_PRICING.visitQty },
  ];
}

export function isFramelessOfferForUser(state, userEmail) {
  if (!state || state.customOfferId !== CUSTOM_OFFER_FRAMELESS_ID) return false;
  if (!userEmail || String(userEmail).toLowerCase().trim() !== CUSTOM_OFFER_FRAMELESS_EMAIL) return false;
  return true;
}

/**
 * 결제 완료 후 orders/order_items·캠페인 생성 시 사용 (buildCampaignRowsFromOrderItems와 호환)
 * — 시딩 300건은 supply_amount 합산 1행, 방문형 시딩 10건은 Visit 집계로 1행.
 */
export function getFramelessOrderItemsForDraft() {
  return [
    {
      plan_name: `시딩(건당) x${FRAMELESS_OFFER_PRICING.seedingQty}`,
      qty: 1,
      unit_price: 0,
      content_count: FRAMELESS_OFFER_PRICING.seedingQty,
      is_visit: false,
      supply_amount: FRAMELESS_OFFER_PRICING.seedingUnitPrice * FRAMELESS_OFFER_PRICING.seedingQty,
    },
    {
      plan_name: `방문형 시딩(건당) x${FRAMELESS_OFFER_PRICING.visitQty}`,
      qty: FRAMELESS_OFFER_PRICING.visitQty,
      unit_price: FRAMELESS_OFFER_PRICING.visitUnitPrice,
      content_count: 1,
      is_visit: true,
    },
  ];
}

export function getFramelessOfferContentCount() {
  return FRAMELESS_OFFER_PRICING.seedingQty + FRAMELESS_OFFER_PRICING.visitQty;
}
