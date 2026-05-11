/**
 * POST /api/cpm/orders — 신규 CPM 오더 초안 생성 (pending_payment 까지)
 * Body: { sku, budget_krw } 또는 { sku, target_impressions } — 서버가 레이트카드 플로어와 일치 검증 후 견적
 */
import { randomUUID } from 'crypto';
import { supabase } from '../../server/lib/supabase-server.js';
import { getBearerUser } from '../../server/lib/cpm-auth.js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { error: auErr, user, statusCode } = await getBearerUser(req);
  if (auErr) {
    return res.status(statusCode).json({ error: auErr });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  const sku = (body.sku || '').trim();
  if (!sku || !supabase) {
    return res.status(!sku ? 400 : 503).json({ error: sku ? 'Server not configured' : 'sku required' });
  }

  const budgetRaw = body.budget_krw;
  const impressionsRaw = body.target_impressions ?? body.estimated_impressions;
  const hasBudget = budgetRaw != null && budgetRaw !== '';
  const hasImpressions = impressionsRaw != null && impressionsRaw !== '';

  if (hasBudget === hasImpressions) {
    return res.status(400).json({
      error: 'Provide exactly one of budget_krw or target_impressions',
    });
  }

  const { data: card, error: cardErr } = await supabase
    .from('cpm_rate_cards')
    .select('sku, cpm_floor_krw')
    .eq('sku', sku)
    .eq('is_published', true)
    .maybeSingle();

  if (cardErr) {
    console.error('[cpm/orders] card load', cardErr);
    return res.status(500).json({ error: 'Rate card lookup failed' });
  }
  if (!card?.cpm_floor_krw) {
    return res.status(404).json({ error: 'Unknown or unpublished SKU' });
  }

  const cpmFloor = Number(card.cpm_floor_krw);
  if (!Number.isFinite(cpmFloor) || cpmFloor <= 0) {
    return res.status(500).json({ error: 'Invalid rate card' });
  }

  let budgetBig;
  let impressionsBig;

  try {
    if (hasBudget) {
      budgetBig = BigInt(String(Math.floor(Number(budgetRaw))));
      if (budgetBig <= 0n) throw new Error('budget');
      const cpmScale = Number((cpmFloor * 1000).toFixed(6));
      const estim = BigInt(Math.floor(Number(budgetBig) * 1000 / cpmScale));
      impressionsBig = estim <= 0n ? 1n : estim;
    } else {
      impressionsBig = BigInt(String(Math.floor(Number(impressionsRaw))));
      if (impressionsBig <= 0n) throw new Error('impressions');
      const budgetScaled = impressionsBig * BigInt(Math.ceil(cpmFloor * 1000)) / 1000n;
      budgetBig = budgetScaled <= 0n ? 1n : budgetScaled;
    }
  } catch {
    return res.status(400).json({ error: 'Invalid budget or impressions' });
  }

  const orderNumber = `CPM-${randomUUID()}`;

  const insertPayload = {
    order_number: orderNumber,
    user_id: user.id,
    sku,
    budget_krw: Number(budgetBig),
    quoted_cpm_krw: cpmFloor,
    estimated_impressions: Number(impressionsBig),
    currency: 'KRW',
    status: 'pending_payment',
  };

  const { data: inserted, error: insErr } = await supabase
    .from('cpm_orders')
    .insert([insertPayload])
    .select('id, order_number, sku, budget_krw, quoted_cpm_krw, estimated_impressions, status')
    .maybeSingle();

  if (insErr) {
    console.error('[cpm/orders] insert', insErr);
    return res.status(500).json({ error: 'Failed to create order' });
  }

  return res.status(201).json({ order: inserted });
}
