/**
 * KG이니시스 결제창 호출용 파라미터 및 서명 생성
 * - POST /api/inicis/payment-params
 * - Body: { oid, price, goodname, buyername, buyertel, buyeremail }
 * - SignKey는 서버에만 두고, signature/verification/mKey만 반환
 */
import { createHash } from 'crypto';

const INICIS_MID = process.env.INICIS_MID || '';
const INICIS_SIGNKEY = process.env.INICIS_SIGNKEY || '';

function sha256(str) {
  return createHash('sha256').update(str, 'utf8').digest('hex');
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!INICIS_MID || !INICIS_SIGNKEY) {
    return res.status(503).json({
      error: 'INICIS_MID or INICIS_SIGNKEY is not configured. Set env vars and redeploy.',
    });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  const { oid, price, goodname, buyername, buyertel, buyeremail } = body;
  if (!oid || price == null || !goodname || !buyername || !buyertel || !buyeremail) {
    return res.status(400).json({
      error: 'Missing required fields: oid, price, goodname, buyername, buyertel, buyeremail',
    });
  }

  const priceStr = String(Number(price));
  const timestamp = String(Date.now());

  // 이니시스 웹표준: signature = SHA256("oid=...&price=...&timestamp=...")
  const signStr = `oid=${oid}&price=${priceStr}&timestamp=${timestamp}`;
  const signature = sha256(signStr);

  // verification = SHA256(NVP 문자열), NVP: oid=...&price=...&signKey=...&timestamp=...
  const verificationStr = `oid=${oid}&price=${priceStr}&signKey=${INICIS_SIGNKEY}&timestamp=${timestamp}`;
  const verification = sha256(verificationStr);

  // mKey = SHA256(signKey) — signKey 문자열 그대로 해시
  const mKey = sha256(INICIS_SIGNKEY);

  const base = (process.env.INICIS_RETURN_BASE_URL || 'https://www.slam-global.com').replace(/\/$/, '');
  const returnUrl = `${base}/api/inicis/payment-callback`;
  const closeUrl = `${base}/checkout`;

  // 테스트: stgstdpay.inicis.com / 운영: stdpay.inicis.com (기본)
  const paymentUrl = (process.env.INICIS_PAYMENT_URL || 'https://stdpay.inicis.com/stdpay/INIStdPay.php').replace(/\/$/, '');

  return res.status(200).json({
    version: '1.0',
    mid: INICIS_MID,
    paymentUrl,
    oid,
    price: priceStr,
    currency: 'WON',
    goodname: goodname.slice(0, 40),
    buyername,
    buyertel: String(buyertel).replace(/\s/g, ''),
    buyeremail,
    timestamp,
    signature,
    verification,
    mKey,
    returnUrl,
    closeUrl,
    use_chkfake: 'Y',
    gopaymethod: 'Card',  // 이니시스 웹표준 필수: 요청 지불수단 (Card=신용카드)
    acceptmethod: 'card',
  });
}
