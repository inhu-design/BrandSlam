/**
 * KG이니시스 웹표준결제 STEP3 승인요청 (returnUrl 인증결과 → authUrl POST)
 * @see https://manual.inicis.com/pay/stdpay_pc.html
 */
import { inicisSha256 } from './inicis-crypto.js';

/** @param {import('http').IncomingMessage} req */
export function parseInicisCallbackBody(req) {
  if (req.method === 'GET') return req.query || {};

  const contentType = (req.headers['content-type'] || '').toLowerCase();
  let body = req.body;

  if (typeof body === 'string' && body.length > 0) {
    if (contentType.includes('application/json')) {
      try {
        return JSON.parse(body);
      } catch {
        return {};
      }
    }
    return Object.fromEntries(new URLSearchParams(body));
  }

  if (body && typeof body === 'object' && !Array.isArray(body)) {
    return body;
  }

  return {};
}

/** @param {Record<string, unknown>} body */
export function extractInicisAuthStep(body) {
  const resultCode = String(
    body.resultCode ?? body.resultcode ?? body.RESULT_CODE ?? body.result_code ?? '',
  ).trim();
  const resultMsg = String(body.resultMsg ?? body.resultmsg ?? body.RESULT_MSG ?? '').trim();
  const authToken = String(body.authToken ?? body.authtoken ?? body.AUTH_TOKEN ?? '').trim();
  const authUrl = String(body.authUrl ?? body.authurl ?? body.AUTH_URL ?? '').trim();
  const idcName = String(body.idc_name ?? body.idcName ?? body.IDC_NAME ?? '').trim();
  const orderId = String(
    body.MOID ?? body.moid ?? body.orderNumber ?? body.order_number ?? body.oid ?? body.OID ?? '',
  ).trim();
  const price = String(body.price ?? body.TotPrice ?? body.totPrice ?? '').trim();
  const mid = String(body.mid ?? body.MID ?? '').trim();

  return { resultCode, resultMsg, authToken, authUrl, idcName, orderId, price, mid };
}

/** @param {string} text */
function parseApprovalResponseText(text) {
  const trimmed = String(text || '').trim();
  if (!trimmed) return {};
  try {
    const json = JSON.parse(trimmed);
    if (json && typeof json === 'object') return json;
  } catch {
    /* NVP fallback */
  }
  return Object.fromEntries(new URLSearchParams(trimmed));
}

/**
 * @param {{ mid: string; signKey: string; authToken: string; authUrl: string; price?: string }}
 */
export async function requestInicisApproval({ mid, signKey, authToken, authUrl, price }) {
  const timestamp = String(Date.now());
  const signature = inicisSha256(`authToken=${authToken}&timestamp=${timestamp}`);
  const verification = inicisSha256(`authToken=${authToken}&signKey=${signKey}&timestamp=${timestamp}`);

  const params = new URLSearchParams({
    mid,
    authToken,
    timestamp,
    signature,
    verification,
    charset: 'UTF-8',
    format: 'JSON',
  });
  if (price) params.set('price', price);

  const res = await fetch(authUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
    body: params.toString(),
  });

  const text = await res.text();
  if (!res.ok) {
    console.error('[inicis approval] HTTP', res.status, text.slice(0, 500));
    throw new Error(`Inicis approval HTTP ${res.status}`);
  }

  return parseApprovalResponseText(text);
}

/** @param {Record<string, unknown>} body */
export function extractInicisPayResult(body) {
  const resultCode = String(
    body.resultCode ?? body.resultcode ?? body.RESULT_CODE ?? body.result_code ?? '',
  ).trim();
  const resultMsg = String(body.resultMsg ?? body.resultmsg ?? body.RESULT_MSG ?? '').trim();
  const tid = String(body.tid ?? body.TID ?? '').trim();
  const orderId = String(
    body.MOID ?? body.moid ?? body.orderNumber ?? body.order_number ?? body.oid ?? body.OID ?? '',
  ).trim();
  const totPrice = String(body.TotPrice ?? body.totPrice ?? body.price ?? '').trim();
  const applNum = String(body.applNum ?? body.APPL_NUM ?? body.applnum ?? '').trim();
  const payMethod = String(body.payMethod ?? body.PAYMETHOD ?? '').trim();

  return { resultCode, resultMsg, tid, orderId, totPrice, applNum, payMethod };
}
