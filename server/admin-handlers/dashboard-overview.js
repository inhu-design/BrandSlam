/**
 * 관리자 전용: 전체 캠페인 + 납품 연동 + 고객 세팅 요약 조회
 * - GET /api/admin/dashboard-overview
 * - Authorization: Bearer <Supabase JWT>, ADMIN_EMAILS 등록 계정만
 */
import { createClient } from '@supabase/supabase-js';
import { supabase as supabaseAdmin } from '../lib/supabase-server.js';

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

const resolveLinkedDeliveryListSlug = (campaign, settingsByCampaignId = null) => {
  if (!campaign?.id) return null;
  const runtime = settingsByCampaignId?.[campaign.id];
  const runtimeSlug = String(runtime?.linked_list_slug || '').trim();
  if (runtimeSlug) return runtimeSlug;
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
  const photos = Array.isArray(fd.productPhotoUrls)
    ? fd.productPhotoUrls
        .map((u) => {
          if (typeof u === 'string' && u.trim()) return u.trim();
          if (u && typeof u.url === 'string' && u.url.trim()) return u.url.trim();
          return null;
        })
        .filter(Boolean)
    : [];
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
    product_photo_urls: photos,
    /** 고객 캠페인 세팅 화면(KickoffView)과 동일한 요약을 위해 전체 폼 페이로드 포함 */
    form_data: row?.form_data ?? null,
  };
};

const pickRuntimeSettings = (row) => ({
  linked_list_slug: row?.linked_list_slug || null,
  notion_guideline_url: row?.notion_guideline_url || null,
  notion_guideline_title: row?.notion_guideline_title || null,
  notion_guideline_description: row?.notion_guideline_description || null,
  force_drop_complete_message: !!row?.force_drop_complete_message,
  updated_at: row?.updated_at || null,
});

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (ADMIN_EMAILS.length === 0) return res.status(503).json({ error: 'ADMIN_EMAILS not configured' });
  if (!supabaseAnonKey) return res.status(503).json({ error: 'SUPABASE_ANON_KEY required' });
  if (!supabaseAdmin) return res.status(503).json({ error: 'SUPABASE_SERVICE_ROLE_KEY required' });

  const supabaseUrl = (process.env.SUPABASE_URL || '').trim();
  if (!supabaseUrl) return res.status(503).json({ error: 'SUPABASE_URL not configured' });

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

    const campaignIds = (campaigns || []).map((c) => c.id).filter(Boolean);
    const settingsByCampaignId = {};
    if (campaignIds.length > 0) {
      const { data: runtimeRows, error: runtimeError } = await supabaseAdmin
        .from('campaign_admin_settings')
        .select(
          'campaign_id, linked_list_slug, notion_guideline_url, notion_guideline_title, notion_guideline_description, force_drop_complete_message, updated_at',
        )
        .in('campaign_id', campaignIds);
      if (runtimeError) {
        const msg = String(runtimeError.message || '').toLowerCase();
        const tableMissing = msg.includes('campaign_admin_settings') && (msg.includes('does not exist') || msg.includes('relation'));
        if (!tableMissing) {
          return res.status(500).json({ error: runtimeError.message || 'Failed to load campaign runtime settings' });
        }
      } else {
        for (const row of runtimeRows || []) {
          if (!row?.campaign_id) continue;
          settingsByCampaignId[row.campaign_id] = pickRuntimeSettings(row);
        }
      }
    }

    const linkedSlugs = [...new Set((campaigns || []).map((c) => resolveLinkedDeliveryListSlug(c, settingsByCampaignId)).filter(Boolean))];
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

    const creatorsByCampaignId = {};
    if (campaignIds.length > 0) {
      const { data: byCampRows, error: bcErr } = await supabaseAdmin
        .from('admin_delivery_creators')
        .select('*')
        .in('campaign_id', campaignIds)
        .order('created_at', { ascending: true });
      if (bcErr) {
        const msg = String(bcErr.message || '').toLowerCase();
        const colMissing =
          msg.includes('campaign_id') && (msg.includes('does not exist') || msg.includes('column'));
        if (!colMissing) {
          return res.status(500).json({ error: bcErr.message || 'Failed to load campaign-scoped delivery creators' });
        }
      } else {
        for (const row of byCampRows || []) {
          const cid = row?.campaign_id;
          if (!cid) continue;
          if (!creatorsByCampaignId[cid]) creatorsByCampaignId[cid] = [];
          creatorsByCampaignId[cid].push(row);
        }
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
      creators_by_campaign_id: creatorsByCampaignId,
      order_summary_by_number: orderSummaryByNumber,
      setup_by_campaign_id: setupByCampaignId,
      settings_by_campaign_id: settingsByCampaignId,
    });
  } catch (err) {
    console.error('[dashboard-overview]', err);
    return res.status(500).json({ error: String(err?.message || err) });
  }
}
