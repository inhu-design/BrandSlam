/**
 * 개인 맞춤 결제 — 서버 측 금액 검증 (클라이언트 조작 방지)
 * src/lib/customOffers.js 와 금액·이메일·ID를 동일하게 유지할 것.
 */
export const CUSTOM_OFFER_FRAMELESS_ID = 'frameless-suyoungkim';
export const CUSTOM_OFFER_FRAMELESS_EMAIL = 'suyoungkim@theframeless.co';

const FRAMELESS_OFFER_PRICING = {
  seedingUnitPrice: 35000,
  seedingQty: 300,
  visitUnitPrice: 240000,
  visitQty: 10,
  vatRate: 0.1,
};

export function getFramelessOfferExpectedTotal() {
  const supply =
    FRAMELESS_OFFER_PRICING.seedingUnitPrice * FRAMELESS_OFFER_PRICING.seedingQty
    + FRAMELESS_OFFER_PRICING.visitUnitPrice * FRAMELESS_OFFER_PRICING.visitQty;
  const vat = Math.round(supply * FRAMELESS_OFFER_PRICING.vatRate);
  return supply + vat;
}

/**
 * @param {{ email?: string, custom_offer_id?: string, plan_price?: number }} orderDraft
 * @param {string|number} requestedPrice - payment-params body.price
 */
export function assertFramelessOfferPrice(orderDraft, requestedPrice) {
  if (!orderDraft || orderDraft.custom_offer_id !== CUSTOM_OFFER_FRAMELESS_ID) {
    return { ok: true };
  }
  const email = String(orderDraft.email || '').toLowerCase().trim();
  if (email !== CUSTOM_OFFER_FRAMELESS_EMAIL) {
    return { ok: false, status: 403, error: '이 맞춤 결제는 지정된 계정에서만 이용할 수 있습니다.' };
  }
  const expected = getFramelessOfferExpectedTotal();
  if (Number(requestedPrice) !== expected) {
    return { ok: false, status: 400, error: '맞춤 결제 금액이 올바르지 않습니다. 페이지를 새로고침 후 다시 시도해 주세요.' };
  }
  return { ok: true };
}

/**
 * 계좌이체 완료 처리 시 order_payload 검증
 */
export function assertFramelessBankPayload(orderPayload) {
  if (!orderPayload || orderPayload.custom_offer_id !== CUSTOM_OFFER_FRAMELESS_ID) {
    return { ok: true };
  }
  const email = String(orderPayload.email || '').toLowerCase().trim();
  if (email !== CUSTOM_OFFER_FRAMELESS_EMAIL) {
    return { ok: false, status: 403, error: '이 맞춤 결제는 지정된 계정에서만 이용할 수 있습니다.' };
  }
  const expected = getFramelessOfferExpectedTotal();
  if (Number(orderPayload.plan_price) !== expected) {
    return { ok: false, status: 400, error: '맞춤 결제 금액이 올바르지 않습니다.' };
  }
  return { ok: true };
}
