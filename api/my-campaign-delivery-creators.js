/**
 * 고객 본인 캠페인의 인플루언서 납품 명단 (RLS로 list_slug 풀 조회가 막힌 경우 대비)
 * GET /api/my-campaign-delivery-creators?campaign_id=<uuid>
 * Authorization: Bearer <Supabase access token>
 */
import { createClient } from '@supabase/supabase-js';
import { supabase as supabaseAdmin } from '../server/lib/supabase-server.js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const LINKED_LIST_SLUG_FARMSKIN = 'BS-US-FARMSKIN';
const LINKED_LIST_SLUG_FARMSKIN_VISIT = 'BS-US-FARMSKIN-VISIT';
const LINKED_LIST_SLUG_WELCOS_MX = 'BS-MX-WELCOS';
const HEATHER_FARMSKIN_EMAIL = 'heather@fromom.net';
const WELCOS_MKT_EMAIL = 'mkt01@welcos.com';

const isTroublessPdrnSunscreenCampaign = (campaign) => {
  const hay = `${campaign?.product_name || ''} ${campaign?.brand_name || ''}`.toLowerCase();
  return hay.includes('troubless') && hay.includes('pdrn') && hay.includes('sunscreen');
};

const isFarmskinVisitOrderCampaign = (campaign) => {
  if (!campaign?.id) return false;
  const plan = String(campaign?.plan || '').toLowerCase();
  if (!plan.includes('visit')) return false;
  const on = String(campaign?.order_number || '').trim().toUpperCase();
  return on === 'BS-20260324-FC62D99F';
};

const isKwailnaraVisitLinkedCampaign = (campaign) => {
  if (!campaign?.id) return false;
  const hay = `${campaign?.product_name || ''} ${campaign?.brand_name || ''}`.toLowerCase();
  const plan = String(campaign?.plan || '').toLowerCase();
  if (!plan.includes('visit')) return false;
  const customerEmail = String(campaign?.customer_email || '').toLowerCase().trim();
  return hay.includes('kwailnara') || customerEmail === WELCOS_MKT_EMAIL;
};

function resolveLinkedListSlug(campaign, settingsRow) {
  if (!campaign?.id) return null;
  const runtimeSlug = String(settingsRow?.linked_list_slug || '').trim();
  if (runtimeSlug) return runtimeSlug;

  const envId = String(
    process.env.VITE_LINKED_DELIVERY_CAMPAIGN_ID || process.env.LINKED_DELIVERY_CAMPAIGN_ID || '',
  ).trim();
  const envSlug = String(
    process.env.VITE_LINKED_DELIVERY_LIST_SLUG || process.env.LINKED_DELIVERY_LIST_SLUG || LINKED_LIST_SLUG_FARMSKIN,
  ).trim();
  if (envId && String(campaign.id) === envId) return envSlug;

  const campaignEmail = String(campaign?.customer_email || '').toLowerCase().trim();
  const isHeatherOwner = campaignEmail === HEATHER_FARMSKIN_EMAIL;

  if (isKwailnaraVisitLinkedCampaign(campaign)) return LINKED_LIST_SLUG_WELCOS_MX;
  if (isFarmskinVisitOrderCampaign(campaign)) return LINKED_LIST_SLUG_FARMSKIN_VISIT;
  if (isHeatherOwner && String(campaign?.plan || '').toLowerCase().includes('visit')) {
    return LINKED_LIST_SLUG_FARMSKIN_VISIT;
  }
  if (
    isHeatherOwner &&
    isTroublessPdrnSunscreenCampaign(campaign) &&
    !String(campaign?.plan || '').toLowerCase().includes('visit')
  ) {
    return LINKED_LIST_SLUG_FARMSKIN;
  }
  return null;
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!supabaseAnonKey) return res.status(503).json({ error: 'SUPABASE_ANON_KEY required' });
  if (!supabaseAdmin) return res.status(503).json({ error: 'Server configuration error' });

  const campaignId = String(req.query.campaign_id || '').trim();
  if (!campaignId) return res.status(400).json({ error: 'campaign_id required' });

  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'Authorization required' });

  const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
  const {
    data: { user },
    error: authError,
  } = await supabaseAuth.auth.getUser(token);
  if (authError || !user?.id) return res.status(401).json({ error: 'Invalid or expired token' });

  try {
    const { data: campaign, error: campErr } = await supabaseAdmin
      .from('campaigns')
      .select(
        'id, user_id, plan, product_name, brand_name, customer_email, order_number, customer_name, status',
      )
      .eq('id', campaignId)
      .maybeSingle();

    if (campErr) return res.status(500).json({ error: campErr.message || 'Campaign lookup failed' });
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    if (String(campaign.user_id) !== String(user.id)) {
      return res.status(403).json({ error: 'Not allowed for this campaign' });
    }

    const { data: settingsRow } = await supabaseAdmin
      .from('campaign_admin_settings')
      .select('linked_list_slug')
      .eq('campaign_id', campaignId)
      .maybeSingle();

    const slug = resolveLinkedListSlug(campaign, settingsRow || null);
    /** @type {unknown[]} */
    let rows = [];

    const { data: byCampaign, error: e1 } = await supabaseAdmin
      .from('admin_delivery_creators')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: true });

    if (e1) return res.status(500).json({ error: e1.message || 'Delivery lookup failed' });
    rows = byCampaign || [];

    if ((!rows || rows.length === 0) && slug) {
      const { data: bySlug, error: e2 } = await supabaseAdmin
        .from('admin_delivery_creators')
        .select('*')
        .eq('list_slug', slug)
        .order('created_at', { ascending: true });
      if (e2) return res.status(500).json({ error: e2.message || 'Delivery pool lookup failed' });
      rows = bySlug || [];
    }

    return res.status(200).json({
      ok: true,
      campaign_id: campaignId,
      list_slug: slug || null,
      creators: rows || [],
    });
  } catch (err) {
    console.error('[my-campaign-delivery-creators]', err);
    return res.status(500).json({ error: String(err?.message || err) });
  }
}
