/**
 * POST /api/cpm/review-webhook — 검수 SaaS(플랜 2번) 콜백 진입점
 * Header: x-cpm-review-secret (또는 Authorization: Bearer <CPMS_REVIEW_WEBHOOK_SECRET>)
 * Body 예시 및 상태 전이는 docs/cpm-review-api-contract.md 참고
 */
import { createHash, timingSafeEqual } from 'crypto';
import { supabase } from '../lib/supabase-server.js';

function safeEqual(a, b) {
  const ba = Buffer.from(String(a || ''), 'utf8');
  const bb = Buffer.from(String(b || ''), 'utf8');
  if (ba.length !== bb.length) return false;
  try {
    return timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const expected = process.env.CPMS_REVIEW_WEBHOOK_SECRET || '';
  if (!expected || !supabase) {
    return res.status(503).json({ error: 'Webhook not configured' });
  }

  const headerSecret =
    (req.headers['x-cpm-review-secret'] ||
      req.headers['x-review-secret'] ||
      '').toString() || '';

  let bearerSecret = '';
  const authHeader = (req.headers.authorization || '').trim();
  if (/^Bearer\s+/i.test(authHeader)) bearerSecret = authHeader.replace(/^Bearer\s+/i, '').trim();

  const provided =
    headerSecret ||
    bearerSecret ||
    (() => {
      try {
        const body =
          typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
        return typeof body.secret === 'string' ? body.secret : '';
      } catch {
        return '';
      }
    })();

  if (!safeEqual(provided, expected)) {
    return res.status(401).json({ error: 'Invalid secret' });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  delete body.secret;

  const orderNumber =
    body.order_number || body.order_ref || body.cpm_order_number || '';
  const correlationId = body.correlation_id || body.correlationId || '';

  const normalizedResultRaw =
    typeof body.result === 'object'
      ? JSON.stringify(body.result)
      : (
          body.result ||
          body.verdict ||
          body.status ||
          ''
        ).toString();
  const normalizedResult = normalizedResultRaw.toLowerCase();

  const allowed = ['review_passed', 'review_failed', 'review_pending', 'cleared'];
  let nextStatus =
    typeof body.next_status === 'string' ? body.next_status.trim() : null;
  if (nextStatus && !allowed.includes(nextStatus)) {
    nextStatus = null;
  }

  if (!nextStatus && normalizedResult) {
    nextStatus =
      normalizedResult.includes('fail') ?
        'review_failed'
      : normalizedResult.includes('pass') ?
        'review_passed'
      : null;
  }

  const compactResult = normalizedResult.replace(/\s+/g, '').replace(/^"|"$/g, '');
  if (
    compactResult &&
    ['pass', 'passed', 'ok', 'success', 'clear', 'approved'].includes(compactResult)
  ) {
    nextStatus = 'review_passed';
  }
  if (
    compactResult &&
    ['fail', 'failed', 'reject', 'rejected'].includes(compactResult)
  ) {
    nextStatus = 'review_failed';
  }

  if (!orderNumber || typeof orderNumber !== 'string' || !orderNumber.startsWith('CPM-')) {
    return res.status(400).json({ error: 'order_number (CPM-...) required' });
  }
  if (!nextStatus || !['review_passed', 'review_failed', 'review_pending', 'cleared'].includes(nextStatus)) {
    return res.status(400).json({ error: 'Could not derive next_status / result' });
  }

  const { data: ord, error: ordErr } = await supabase
    .from('cpm_orders')
    .select('id, status')
    .eq('order_number', orderNumber)
    .maybeSingle();

  if (ordErr || !ord) {
    console.error('[cpm/review-webhook] lookup', ordErr);
    return res.status(404).json({ error: 'Order not found' });
  }

  const reviewerNote =
    typeof body.message === 'string'
      ? body.message
      : typeof body.reason === 'string'
        ? body.reason
        : null;

  const { error: upErr } = await supabase
    .from('cpm_orders')
    .update({
      status: nextStatus,
      updated_at: new Date().toISOString(),
      ...(reviewerNote ? { reviewer_note: reviewerNote } : {}),
    })
    .eq('id', ord.id);

  if (upErr) {
    console.error('[cpm/review-webhook] update', upErr);
    return res.status(500).json({ error: 'Update failed' });
  }

  const payloadHash =
    correlationId ?
      createHash('sha256')
        .update(JSON.stringify(body))
        .digest('hex')
        .slice(0, 32)
    : null;

  const { error: hookErr } = await supabase.from('cpm_review_hooks').insert([
    {
      order_id: ord.id,
      correlation_id: correlationId || payloadHash || 'anonymous',
      event_type: body.event_type || 'review_result',
      payload: body,
    },
  ]);

  if (hookErr) {
    console.error('[cpm/review-webhook] hook insert', hookErr);
  }

  return res.status(200).json({ ok: true, order_number: orderNumber, status: nextStatus });
}
