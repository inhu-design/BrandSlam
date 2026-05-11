/**
 * Hobby: /api/cpm/* 를 단일 함수로 라우팅 — URL 불변 (예: GET /api/cpm/rate-cards)
 */
import { segmentsAfterNamespace } from '../../server/lib/api-catch-all-segments.js';
import rateCards from '../../server/cpm-handlers/rate-cards.js';
import quote from '../../server/cpm-handlers/quote.js';
import orders from '../../server/cpm-handlers/orders.js';
import reviewWebhook from '../../server/cpm-handlers/review-webhook.js';

const handlers = {
  'rate-cards': rateCards,
  quote,
  orders,
  'review-webhook': reviewWebhook,
};

export default async function handler(req, res) {
  const segments = segmentsAfterNamespace(req, 'cpm');
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
