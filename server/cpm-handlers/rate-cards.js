/**
 * GET /api/cpm/rate-cards — 공개 가능한 카드 목록(JSON)
 */
import { supabase } from '../lib/supabase-server.js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=60');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!supabase) {
    return res.status(503).json({ error: 'Server not configured' });
  }

  const { data, error } = await supabase
    .from('cpm_rate_cards')
    .select(
      'id, sku, country_code, channel, creative_format, cpm_floor_krw, summary, effective_from, effective_to, is_published',
    )
    .eq('is_published', true);

  if (error) {
    console.error('[cpm/rate-cards]', error);
    return res.status(500).json({ error: 'Failed to load rate cards' });
  }

  const now = Date.now();
  const rows = (data || []).filter((r) => {
    if (!r.effective_from) return true;
    return new Date(r.effective_from).getTime() <= now;
  });

  return res.status(200).json({ cards: rows });
}
