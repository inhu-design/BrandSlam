/**
 * POST /api/cpm/quote — 서버 측 CPM 역산 (조작 방지용; DB 영속 선택)
 * Body: { budget_krw?, target_impressions?, cpm_floor_krw (number) }
 * budget_krw xor target_impressions 중 하나 필요
 */
export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  const cpm = Number(body.cpm_floor_krw ?? body.cpm_krw ?? body.cpm);
  const budgetRaw = body.budget_krw;
  const impressionsRaw = body.target_impressions ?? body.estimated_impressions;

  if (!Number.isFinite(cpm) || cpm <= 0) {
    return res.status(400).json({ error: 'Valid cpm_floor_krw required' });
  }

  const hasBudget = budgetRaw != null && budgetRaw !== '';
  const hasImpressions = impressionsRaw != null && impressionsRaw !== '';

  if (hasBudget === hasImpressions) {
    return res.status(400).json({
      error: 'Provide exactly one of budget_krw or target_impressions',
    });
  }

  /** @returns {bigint} */
  function floorPositive(x) {
    const n = typeof x === 'bigint' ? x : BigInt(Math.floor(Number(x)));
    return n <= 0n ? 1n : n;
  }

  try {
    if (hasBudget) {
      const budget = floorPositive(budgetRaw);
      const cpm_scaled = Number((cpm * 1000).toFixed(6));
      if (!Number.isFinite(cpm_scaled) || cpm_scaled <= 0) {
        return res.status(400).json({ error: 'Invalid CPM' });
      }
      const budgetNum = Number(budget);
      const impressions = BigInt(Math.floor(budgetNum * 1000 / cpm_scaled));
      const impressionsSafe = impressions <= 0n ? 1n : impressions;
      return res.status(200).json({
        budget_krw: String(budget),
        quoted_cpm_krw: cpm,
        estimated_impressions: String(impressionsSafe),
      });
    }

    const impressions = floorPositive(impressionsRaw);
    const budget = (BigInt(Math.ceil(Number(impressions) * cpm)) + 999n) / 1000n;
    const budgetSafe = budget <= 0n ? 1n : budget;

    return res.status(200).json({
      budget_krw: String(budgetSafe),
      quoted_cpm_krw: cpm,
      estimated_impressions: String(impressions),
    });
  } catch (e) {
    console.error('[cpm/quote]', e);
    return res.status(400).json({ error: 'Invalid numeric input' });
  }
}
