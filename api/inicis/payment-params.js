/**
 * KG이니시스 결제창 호출용 파라미터 및 서명 생성
 * - POST /api/inicis/payment-params
 * - Body: { oid, price, goodname, buyername, buyertel, buyeremail }
 * - SignKey는 서버에만 두고, signature/verification/mKey만 반환
 */
import { createHash } from 'crypto';
import { supabase } from '../lib/supabase-server.js';

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

  const { oid, price, goodname, buyername, buyertel, buyeremail, method, order_draft: orderDraft } = body;
  if (!oid || price == null || !goodname || !buyername || !buyertel || !buyeremail) {
    return res.status(400).json({
      error: 'Missing required fields: oid, price, goodname, buyername, buyertel, buyeremail',
    });
  }

  if (orderDraft != null && typeof orderDraft === 'object') {
    if (!supabase) {
      return res.status(503).json({ error: 'Server cannot persist checkout (Supabase service role missing).' });
    }
    if (String(orderDraft.order_number || '') !== String(oid)) {
      return res.status(400).json({ error: 'order_draft.order_number must match oid' });
    }
    if (!orderDraft.user_id || !orderDraft.email) {
      return res.status(400).json({ error: 'order_draft must include user_id and email' });
    }
    const { error: draftErr } = await supabase.from('checkout_drafts').upsert(
      { oid: String(oid), payload: orderDraft },
      { onConflict: 'oid' },
    );
    if (draftErr) {
      console.error('[payment-params] checkout_drafts upsert', draftErr);
      return res.status(500).json({ error: 'Failed to save checkout draft' });
    }
  }
  const payMethod = (method || 'card').toLowerCase();
  const isBank = payMethod === 'bank';
  // Card:Bank = 신용카드 + 실시간 계좌이체만 (무통장입금/가상계좌 제외)
  const gopaymethod = isBank ? 'Card:Bank' : 'Card';
  const acceptmethod = isBank ? 'centerCd(Y)' : 'card';

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

  const payload = {
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
    gopaymethod,
    acceptmethod,
  };
  return res.status(200).json(payload);
}
