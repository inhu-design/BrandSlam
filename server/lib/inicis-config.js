/**
 * KG이니시스 웹표준결제 — 운영/테스트 환경 URL (MID·INICIS_PAYMENT_URL 기준)
 * @see https://www.inicis.com/blog/archives/121299 (실 MID + 테스트 JS = V018)
 */

const PROD_SCRIPT = 'https://stdpay.inicis.com/stdjs/INIStdPay.js';
const STG_SCRIPT = 'https://stgstdpay.inicis.com/stdjs/INIStdPay.js';
const PROD_PAY = 'https://stdpay.inicis.com/stdpay/INIStdPay.php';
const STG_PAY = 'https://stgstdpay.inicis.com/stdpay/INIStdPay.php';

/** @param {string} mid */
export function isInicisTestMid(mid) {
  const m = String(mid || '').trim();
  if (!m) return false;
  return /^INIpayTest/i.test(m);
}

/** @param {string} mid */
export function resolveInicisPayScriptUrl(mid) {
  if (isInicisTestMid(mid)) return STG_SCRIPT;
  return PROD_SCRIPT;
}

/** @param {string} mid */
export function resolveInicisPaymentUrl(mid) {
  if (isInicisTestMid(mid)) {
    const envUrl = (process.env.INICIS_PAYMENT_URL || '').trim();
    if (envUrl) return envUrl.replace(/\/$/, '');
    return STG_PAY;
  }
  return PROD_PAY;
}

/** @param {string} base INICIS_RETURN_BASE_URL */
export function assertInicisReturnBaseUrl(base) {
  const b = String(base || '').trim().toLowerCase();
  if (!b) return;
  if (b.includes('inicis.com')) {
    throw new Error(
      'INICIS_RETURN_BASE_URL must be your website (e.g. https://www.slam-global.com), not KG Inicis stdpay URL.',
    );
  }
}

export const INICIS_SUCCESS_RESULT_CODES = new Set(['00', '0000']);
