/**
 * 관리자 전용: 전체 캠페인 + 납품 연동 + 고객 세팅 요약 조회
 * - GET /api/admin/dashboard-overview
 * - Authorization: Bearer <Supabase JWT>, ADMIN_EMAILS 등록 계정만
 */
import { createClient } from '@supabase/supabase-js';
import { supabase as supabaseAdmin } from '../lib/supabase-server.js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://grlayjybcxrcaufnwysb.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

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

const resolveLinkedDeliveryListSlug = (campaign) => {
  if (!campaign?.id) return null;
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
};

const pickSetupSummary = (row) => {
  const fd = row?.form_data || {};
  return {
    created_at: row?.created_at || null,
    company_name: fd.companyName || null,
    contact_name: fd.contactName || null,
    contact_email: fd.contactEmail || null,
    contact_phone: fd.contactPhone || null,
    product_name: fd.productName || null,
    target_country: fd.targetAudienceCountry || fd.countryRange || null,
    event_name: fd.eventName || null,
    event_venue: fd.eventVenue || null,
    event_schedule: Array.isArray(fd.eventSchedule)
      ? fd.eventSchedule.join(', ')
      : (fd.eventSchedule || null),
    requested_shipping_date: fd.requestedShippingDate || null,
    guideline_status: fd.guidelineStatus || null,
  };
};

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (ADMIN_EMAILS.length === 0) return res.status(503).json({ error: 'ADMIN_EMAILS not configured' });
  if (!supabaseAnonKey) return res.status(503).json({ error: 'SUPABASE_ANON_KEY required' });
  if (!supabaseAdmin) return res.status(503).json({ error: 'SUPABASE_SERVICE_ROLE_KEY required' });

  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'Authorization required' });

  const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
  const {
    data: { user },
    error: authError,
  } = await supabaseAuth.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: 'Invalid or expired token' });

  const email = (user.email || '').toLowerCase();
  if (!ADMIN_EMAILS.includes(email)) return res.status(403).json({ error: 'Admin only' });

  try {
    const { data: campaigns, error: campaignsError } = await supabaseAdmin
      .from('campaigns')
      .select('*, creators (*), contents (*)')
      .order('created_at', { ascending: false });
    if (campaignsError) return res.status(500).json({ error: campaignsError.message || 'Failed to load campaigns' });

    const linkedSlugs = [...new Set((campaigns || []).map((c) => resolveLinkedDeliveryListSlug(c)).filter(Boolean))];
    const creatorsBySlug = {};
    if (linkedSlugs.length > 0) {
      const { data: creators, error: creatorsError } = await supabaseAdmin
        .from('admin_delivery_creators')
        .select('*')
        .in('list_slug', linkedSlugs)
        .order('created_at', { ascending: true });
      if (creatorsError) return res.status(500).json({ error: creatorsError.message || 'Failed to load delivery creators' });
      for (const slug of linkedSlugs) creatorsBySlug[slug] = [];
      for (const row of creators || []) {
        const slug = row?.list_slug;
        if (!slug) continue;
        if (!creatorsBySlug[slug]) creatorsBySlug[slug] = [];
        creatorsBySlug[slug].push(row);
      }
    }

    const orderNumbers = [...new Set((campaigns || []).map((c) => c.order_number).filter(Boolean))];
    const orderSummaryByNumber = {};
    if (orderNumbers.length > 0) {
      const { data: orderRows, error: ordersError } = await supabaseAdmin
        .from('orders')
        .select('order_number, plan_name, plan_price, order_items, content_count')
        .in('order_number', orderNumbers);
      if (ordersError) return res.status(500).json({ error: ordersError.message || 'Failed to load order summaries' });
      for (const row of orderRows || []) {
        if (row?.order_number) orderSummaryByNumber[row.order_number] = row;
      }
    }

    const campaignIds = (campaigns || []).map((c) => c.id).filter(Boolean);
    const setupByCampaignId = {};
    if (campaignIds.length > 0) {
      const { data: setupRows, error: setupError } = await supabaseAdmin
        .from('campaign_setup_submissions')
        .select('campaign_id, created_at, form_data')
        .in('campaign_id', campaignIds)
        .order('created_at', { ascending: false });
      if (setupError) return res.status(500).json({ error: setupError.message || 'Failed to load setup submissions' });
      for (const row of setupRows || []) {
        const campaignId = row?.campaign_id;
        if (!campaignId) continue;
        if (!setupByCampaignId[campaignId]) {
          setupByCampaignId[campaignId] = pickSetupSummary(row);
        }
      }
    }

    return res.status(200).json({
      ok: true,
      campaigns: campaigns || [],
      creators_by_slug: creatorsBySlug,
      order_summary_by_number: orderSummaryByNumber,
      setup_by_campaign_id: setupByCampaignId,
    });
  } catch (err) {
    console.error('[dashboard-overview]', err);
    return res.status(500).json({ error: String(err?.message || err) });
  }
}
