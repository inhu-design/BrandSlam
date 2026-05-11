/**
 * Hobby: /api/checkout/* 를 단일 함수로 라우팅 — URL 불변
 */
import { segmentsAfterNamespace } from '../../server/lib/api-catch-all-segments.js';
import rollbackOrder from '../../server/checkout-handlers/rollback-order.js';
import confirmBankTransfer from '../../server/checkout-handlers/confirm-bank-transfer.js';
import adminSkipPayment from '../../server/checkout-handlers/admin-skip-payment.js';

const handlers = {
  'rollback-order': rollbackOrder,
  'confirm-bank-transfer': confirmBankTransfer,
  'admin-skip-payment': adminSkipPayment,
};

export default async function handler(req, res) {
  const segments = segmentsAfterNamespace(req, 'checkout');
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
