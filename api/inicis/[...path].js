/**
 * Hobby: /api/inicis/* 를 단일 함수로 라우팅 — URL 불변 (payment-params 의 returnUrl 도 동일 유지)
 */
import { segmentsAfterNamespace } from '../../server/lib/api-catch-all-segments.js';
import paymentParams from '../../server/inicis-handlers/payment-params.js';
import paymentCallback from '../../server/inicis-handlers/payment-callback.js';

const handlers = {
  'payment-params': paymentParams,
  'payment-callback': paymentCallback,
};

export default async function handler(req, res) {
  const segments = segmentsAfterNamespace(req, 'inicis');
  if (segments.length !== 1) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.status(404).json({ error: 'Not found' });
  }
  const key = String(segments[0] || '').trim();
  const fn = handlers[key];
  if (!fn) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.status(404).json({ error: 'Not found' });
  }
  return fn(req, res);
}
