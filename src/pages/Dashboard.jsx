import React, { useEffect, useState, useRef, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { fetchAdminSessionIsAdmin } from '../lib/adminSessionFetch';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Package, Clock, Truck, UserCheck, AlertCircle, 
  Lock, Settings, BarChart3, Users, PlayCircle, Eye, Heart, MessageCircle, Share2, 
  ChevronLeft, ChevronRight, Calendar, ExternalLink, Zap, Trash2, CheckCircle2, MoreHorizontal,
  Plane, Gift, TrendingUp, BarChart2, Trophy, RefreshCw, AlertTriangle, Download,
  FileText, CreditCard, Printer, Video, ShieldCheck, X, Rocket, ArrowRight, Building2, Info, UserX, RotateCcw,
  ClipboardList, Upload, LayoutDashboard, Table2, FileSpreadsheet, PlusCircle, Receipt, ListChecks,
} from 'lucide-react';
import Navbar from '../components/layout/Navbar'; 
import Footer from '../components/layout/Footer';
import AdminSupportInboxPanel from '../components/admin/AdminSupportInboxPanel';
import AdminAllInvoicesPanel from '../components/admin/AdminAllInvoicesPanel';
import { useSupportStaffUnread } from '../contexts/SupportStaffUnreadContext';
import sealImg from '../assets/seal.jpg';
import testInfluencers from '../data/test-influencers.json';
import {
  CUSTOM_OFFER_FRAMELESS_EMAIL,
  CUSTOM_OFFER_FRAMELESS_ID,
  FRAMELESS_OFFER_PRICING,
  getFramelessOfferTotals,
} from '../lib/customOffers';
import { computeDbOfferTotals } from '../lib/customPaymentOffers';

const CUSTOMER_DASH_CACHE_KEY = (uid) => `bs_dash_c_v1_${uid}`;
const CUSTOMER_DASH_CACHE_TTL_MS = 90_000;

function readCustomerDashboardCache(uid) {
  try {
    if (!uid) return null;
    const raw = sessionStorage.getItem(CUSTOMER_DASH_CACHE_KEY(uid));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const { ts, payload } = parsed || {};
    if (!Array.isArray(payload) || payload.length === 0) return null;
    if (typeof ts !== 'number' || Date.now() - ts > CUSTOMER_DASH_CACHE_TTL_MS) return null;
    return payload;
  } catch {
    return null;
  }
}

function writeCustomerDashboardCache(uid, payload) {
  try {
    if (!uid || !Array.isArray(payload) || payload.length === 0) return;
    sessionStorage.setItem(CUSTOMER_DASH_CACHE_KEY(uid), JSON.stringify({ ts: Date.now(), payload }));
  } catch {
    /* quota */
  }
}

function clearCustomerDashboardCache(uid) {
  try {
    if (!uid) return;
    sessionStorage.removeItem(CUSTOMER_DASH_CACHE_KEY(uid));
  } catch {
    /* ignore */
  }
}

/** The Frameless: DB orders.plan_price 와 무관하게 화면은 `customOffers` 확정 계약가와 통일 */
function displayPaidOrderPlanPriceForViewer(order, viewerEmail) {
  const em = String(viewerEmail || '').toLowerCase().trim();
  if (em === CUSTOM_OFFER_FRAMELESS_EMAIL) return getFramelessOfferTotals().total;
  return Number(order?.plan_price) || 0;
}

/** 팔로워 수 파싱 (11.5K → 11500) */
const parseFollower = (val) => {
  if (val == null || val === '') return 0;
  const n = Number(val);
  if (!isNaN(n)) return n;
  const s = String(val).trim().toUpperCase();
  const m = s.match(/^([\d.]+)\s*([KMB])?$/);
  if (!m) return 0;
  let num = parseFloat(m[1]);
  if (m[2] === 'K') num *= 1000;
  else if (m[2] === 'M') num *= 1e6;
  return Math.round(num);
};

/** URL에 프로토콜이 없으면 https:// 추가 (www.tiktok.com → https://www.tiktok.com) */
const ensureAbsoluteUrl = (url) => {
  if (!url || url === '-') return url;
  const s = String(url).trim();
  if (s.startsWith('http://') || s.startsWith('https://')) return s;
  return `https://${s}`;
};

/** SNS 채널 단일 항목 */
const toSnsChannel = (platform, url, followers) => ({
  platform,
  url: url || null,
  followers: String(followers ?? '0'),
});

const SNS_ORDER = { TikTok: 0, Instagram: 1, SNS: 9 };

/** TikTok·인스타 각각 있으면 둘 다 채널 배열에 포함 (URL/팔로워 중 하나만 있어도 노출) */
const buildSnsChannelsFromRow = (r) => {
  const snsChannels = [];
  if (r.tiktok_url || r.tiktok_follower) {
    snsChannels.push(toSnsChannel('TikTok', r.tiktok_url, r.tiktok_follower || '0'));
  }
  if (r.instagram_url || r.instagram_follower) {
    snsChannels.push(toSnsChannel('Instagram', r.instagram_url, r.instagram_follower || '0'));
  }
  if (snsChannels.length === 0) {
    snsChannels.push(toSnsChannel('SNS', r.tiktok_url || r.instagram_url, '0'));
  }

  const nameNorm = (r.name || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const isTamaraHunter = nameNorm === 'tamara hunter' ||
    (nameNorm.includes('tamara') && nameNorm.includes('hunter')) ||
    snsChannels.some((c) => c.url && String(c.url).includes('mara_hunt88'));
  if (isTamaraHunter) {
    const ttIdx = snsChannels.findIndex((c) => c.platform === 'TikTok');
    if (ttIdx >= 0) {
      snsChannels[ttIdx] = { ...snsChannels[ttIdx], url: snsChannels[ttIdx].url || 'www.tiktok.com/@mara_hunt88', followers: '30.4K' };
    } else {
      snsChannels.unshift(toSnsChannel('TikTok', 'www.tiktok.com/@mara_hunt88', '30.4K'));
    }
  }

  snsChannels.sort((a, b) => (SNS_ORDER[a.platform] ?? 5) - (SNS_ORDER[b.platform] ?? 5));
  return snsChannels;
};

const trimOrNull = (v) => {
  if (v == null) return null;
  const s = String(v).trim();
  if (s === '' || s === '-') return null;
  return s;
};

const nonemptyFollower = (v) => {
  if (v == null) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
};

/**
 * Supabase 행 / test-influencers.json / sns_channels 배열 / 레거시 handle·platform 을 합쳐
 * TikTok·인스타 4필드를 채움 (한쪽만 있으면 한쪽만, 둘 다 있으면 둘 다).
 */
const mergeSocialFieldsFromRecord = (r) => {
  let tiktok_url = trimOrNull(r.tiktok_url);
  let tiktok_follower = nonemptyFollower(r.tiktok_follower);
  let instagram_url = trimOrNull(r.instagram_url);
  let instagram_follower = nonemptyFollower(r.instagram_follower);

  const mergeChannel = (platform, url, followers) => {
    const u = trimOrNull(url);
    const f = nonemptyFollower(followers);
    if (platform === 'TikTok') {
      tiktok_url = tiktok_url || u;
      tiktok_follower = tiktok_follower || f;
    }
    if (platform === 'Instagram') {
      instagram_url = instagram_url || u;
      instagram_follower = instagram_follower || f;
    }
  };

  if (Array.isArray(r.sns_channels)) {
    for (const ch of r.sns_channels) {
      mergeChannel(ch.platform, ch.url, ch.followers);
    }
  }

  const legacyUrl = trimOrNull(r.handle);
  const legacyPlat = r.platform;
  const legacyFol = nonemptyFollower(r.followers);
  const hasAny = tiktok_url || instagram_url || tiktok_follower || instagram_follower;
  if (!hasAny && legacyUrl) {
    const lower = legacyUrl.toLowerCase();
    if (lower.includes('tiktok')) {
      tiktok_url = legacyUrl;
      tiktok_follower = tiktok_follower || legacyFol;
    } else if (lower.includes('instagram')) {
      instagram_url = legacyUrl;
      instagram_follower = instagram_follower || legacyFol;
    } else if (legacyPlat === 'TikTok') {
      tiktok_url = legacyUrl;
      tiktok_follower = tiktok_follower || legacyFol;
    } else if (legacyPlat === 'Instagram') {
      instagram_url = legacyUrl;
      instagram_follower = instagram_follower || legacyFol;
    }
  }

  return {
    id: r.id,
    name: r.name,
    shipping_country: r.shipping_country || r.location,
    tiktok_url,
    tiktok_follower,
    instagram_url,
    instagram_follower,
    visit_date: trimOrNull(r.visit_date),
  };
};

/** 드랍 식별자: DB에 name|platform 형태가 섞여 있어도 동일 인원으로 취급 */
const normalizeDropIdentifier = (id) => {
  if (id == null || id === '') return '';
  const s = String(id).trim();
  if (!s.includes('|')) return s;
  return s.split('|')[0].trim();
};

/** 팜스킨(Troubless) 납품 풀 */
const LINKED_LIST_SLUG_FARMSKIN = 'BS-US-FARMSKIN';
/** 팜스킨 Visit 주문 BS-20260324-FC62D99F 전용 소명단 */
const LINKED_LIST_SLUG_FARMSKIN_VISIT = 'BS-US-FARMSKIN-VISIT';
/** 웰코스 MX KWAILNARA Visit 납품 풀 */
const LINKED_LIST_SLUG_WELCOS_MX = 'BS-MX-WELCOS';

/** DB에 행이 없을 때 test-influencers(50명)로 채우면 안 되는 list_slug */
const LINKED_DELIVERY_SLUGS_NO_TEST_FALLBACK = new Set([
  LINKED_LIST_SLUG_FARMSKIN_VISIT,
  LINKED_LIST_SLUG_WELCOS_MX,
]);

/** Farmskin Troubless GLASS GLOW+ PDRN COLLAGEN SUNSCREEN 캠페인만 (수동 예외·연동용) */
const isTroublessPdrnSunscreenCampaign = (campaign) => {
  const hay = `${campaign?.product_name || ''} ${campaign?.brand_name || ''}`.toLowerCase();
  return hay.includes('troubless') && hay.includes('pdrn') && hay.includes('sunscreen');
};

const HEATHER_FARMSKIN_EMAIL = 'heather@fromom.net';
const WELCOS_MKT_EMAIL = 'mkt01@welcos.com';

/** 팜스킨 Visit → 소명단 BS-US-FARMSKIN-VISIT (Scale50 명단과 분리). 주문번호로도 매칭. */
const isFarmskinVisitOrderCampaign = (campaign) => {
  if (!campaign?.id) return false;
  const plan = String(campaign?.plan || '').toLowerCase();
  if (!plan.includes('visit')) return false;
  const on = String(campaign?.order_number || '').trim().toUpperCase();
  if (on === 'BS-20260324-FC62D99F') return true;
  return false;
};

const TROUBLESS_PDRN_SUNSCREEN_NOTION_GUIDELINE_URL =
  'https://spiral-playground-cff.notion.site/Troubless-Glass-Glow-PDRN-Collagen-Sunscreen-313259eb52488199b978e195eb1404b9';

/** heather@fromom.net · Visit — Farmskin SUPER GLOW COLLAGEN WRAPPING MASK (TJ Maxx Store Visit) */
const FARMSKIN_SUPER_GLOW_WRAPPING_MASK_VISIT_NOTION_URL =
  'https://spiral-playground-cff.notion.site/Farmskin-Super-Glow-Collagen-Wrapping-Mask-TJ-Maxx-Store-Visit-334259eb524880cb8560daece76e147e';

/** 팜스킨 Visit · Super Glow Wrapping Mask 캠페인 (heather 전용 가이드라인) */
const isFarmskinSuperGlowWrappingMaskVisitCampaign = (campaign, user) => {
  const plan = String(campaign?.plan || '').toLowerCase();
  if (!plan.includes('visit')) return false;
  const campaignEmail = String(campaign?.customer_email || '').toLowerCase().trim();
  const authEmail = String(user?.email || '').toLowerCase().trim();
  const isHeatherContext =
    campaignEmail === HEATHER_FARMSKIN_EMAIL || authEmail === HEATHER_FARMSKIN_EMAIL;
  if (!isHeatherContext) return false;
  const hay = `${campaign?.product_name || ''} ${campaign?.brand_name || ''}`.toLowerCase();
  return (
    (hay.includes('super') && hay.includes('glow') && hay.includes('wrapping')) ||
    hay.includes('wrapping mask') ||
    hay.includes('tj maxx')
  );
};

/** 웰코스 KWAILNARA · Visit 플랜 (캠페인 소유자에게만 노출 — DB user_id 기준) */
const isKwailnaraVisitLinkedCampaign = (campaign) => {
  if (!campaign?.id) return false;
  const hay = `${campaign?.product_name || ''} ${campaign?.brand_name || ''}`.toLowerCase();
  const plan = String(campaign?.plan || '').toLowerCase();
  if (!plan.includes('visit')) return false;
  const customerEmail = String(campaign?.customer_email || '').toLowerCase().trim();
  return hay.includes('kwailnara') || customerEmail === WELCOS_MKT_EMAIL;
};

const KWAILNARA_EUPHORIA_NOTION_GUIDELINE_URL =
  'https://spiral-playground-cff.notion.site/KWAILNARA-x-Euphoria-Fest-2026-330259eb524880c08554c4af31fcbaa0';

const getCampaignRuntimeSettings = (campaign) => campaign?.admin_runtime_settings || null;

/**
 * 납품 리스트 Supabase list_slug (레거시 공유 풀 키).
 * 동일 캠페인에 admin_delivery_creators.campaign_id 가 있으면 그 행이 우선(엑셀 업로드 시 UUID 지정).
 * 우선순위: VITE_LINKED_DELIVERY_CAMPAIGN_ID + VITE_LINKED_DELIVERY_LIST_SLUG → 이메일·캠페인 규칙
 */
const resolveLinkedDeliveryListSlug = (campaign, user) => {
  if (!campaign?.id) return null;
  const runtime = getCampaignRuntimeSettings(campaign);
  const runtimeSlug = String(runtime?.linked_list_slug || '').trim();
  if (runtimeSlug) return runtimeSlug;
  const envId = (import.meta.env.VITE_LINKED_DELIVERY_CAMPAIGN_ID || '').trim();
  const envSlug = (import.meta.env.VITE_LINKED_DELIVERY_LIST_SLUG || LINKED_LIST_SLUG_FARMSKIN).trim();
  if (envId && String(campaign.id) === envId) return envSlug;
  const authEmail = (user?.email || '').toLowerCase().trim();
  const campaignEmail = String(campaign?.customer_email || '').toLowerCase().trim();
  const isHeatherOwner = authEmail === HEATHER_FARMSKIN_EMAIL || campaignEmail === HEATHER_FARMSKIN_EMAIL;
  // KWAILNARA·Visit: campaigns는 user_id로 본인 행만 올라오므로, 가장(impersonate) 시 JWT 이메일과 무관하게 동일 규칙 적용
  if (isKwailnaraVisitLinkedCampaign(campaign)) {
    return LINKED_LIST_SLUG_WELCOS_MX;
  }
  // Visit 주문(FC62)은 JWT 이메일과 무관하게 소명단(가장 로그인 대응). 그 외 heather·Visit 플랜도 동일 slug.
  if (isFarmskinVisitOrderCampaign(campaign)) {
    return LINKED_LIST_SLUG_FARMSKIN_VISIT;
  }
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

const campaignMatchesLinkedDeliveryList = (campaign, user) => {
  if (Array.isArray(campaign?.linked_delivery_candidates) && campaign.linked_delivery_candidates.length > 0) {
    return true;
  }
  return resolveLinkedDeliveryListSlug(campaign, user) != null;
};
const isHeatherFarmskinScale50Campaign = (campaign) => {
  const runtime = getCampaignRuntimeSettings(campaign);
  // 드랍 강제 종료 여부는 캠페인별 런타임 설정으로만 제어합니다.
  return !!runtime?.force_drop_complete_message;
};

/** 납품 테이블 컬럼 레이아웃: 웰코스 MX는 틱톡/인스타/visit date 분리 컬럼 */
const linkedDeliveryTableLayout = (campaign, user) =>
  resolveLinkedDeliveryListSlug(campaign, user) === LINKED_LIST_SLUG_WELCOS_MX ? 'visit_split' : 'stacked';

const resolveKickoffNotionGuideline = (campaign, user) => {
  const runtime = getCampaignRuntimeSettings(campaign);
  const runtimeUrl = String(runtime?.notion_guideline_url || '').trim();
  if (runtimeUrl) {
    return {
      url: runtimeUrl,
      title: runtime?.notion_guideline_title || '콘텐츠 가이드라인 (Notion)',
      description:
        runtime?.notion_guideline_description ||
        '관리자 설정에서 연결한 캠페인별 가이드라인입니다.',
    };
  }
  if (isKwailnaraVisitLinkedCampaign(campaign)) {
    return {
      url: KWAILNARA_EUPHORIA_NOTION_GUIDELINE_URL,
      title: '콘텐츠 가이드라인 (Notion)',
      description:
        'KWAILNARA x Euphoria Fest 2026 캠페인용 가이드를 Notion에서 확인해 주세요.',
    };
  }
  if (isFarmskinSuperGlowWrappingMaskVisitCampaign(campaign, user)) {
    return {
      url: FARMSKIN_SUPER_GLOW_WRAPPING_MASK_VISIT_NOTION_URL,
      title: '콘텐츠 가이드라인 (Notion)',
      description:
        'Farmskin SUPER GLOW COLLAGEN WRAPPING MASK (Visit) 캠페인용 가이드를 Notion에서 확인해 주세요.',
    };
  }
  if (isTroublessPdrnSunscreenCampaign(campaign)) {
    return {
      url: TROUBLESS_PDRN_SUNSCREEN_NOTION_GUIDELINE_URL,
      title: '콘텐츠 가이드라인 (Notion)',
      description:
        'Troubless GLASS GLOW+ PDRN COLLAGEN SUNSCREEN 캠페인용 가이드를 Notion에서 확인해 주세요.',
    };
  }
  return null;
};

/** creator_drops / delivery_list_sessions 에 저장할 참조 키 */
const resolveDeliveryReference = (campaign) => {
  return { refType: 'campaign', refId: String(campaign.id) };
};

/** 납품 명단 이름 정규화 (공백·대소문자) */
const normDeliveryListPersonName = (s) => {
  if (s == null || s === '') return '';
  return String(s).trim().replace(/\s+/g, ' ').toLowerCase();
};

/**
 * Troubless GLASS GLOW+ PDRN COLLAGEN SUNSCREEN (BS-US-FARMSKIN) 최종 50명:
 * 브랜드 드랍 3명 제거 후 교체 3명 반영. DB/JSON에 아직 옛 인원이 있어도 화면·CSV는 동일하게 맞춤.
 */
const TROUBLESS_PDRN_REMOVED_FROM_FINAL_DELIVERY = new Set([
  'gabrielle diane comeau',
  'holly curtis',
  'stephanie padilla',
]);

const TROUBLESS_PDRN_REPLACEMENT_SPEC_RAW = [
  {
    name: 'Svitlana Zakharkiv',
    shipping_country: 'US',
    tiktok_url: 'https://www.tiktok.com/@svitlana_ugc?_r=1&_t=ZT-959mCApCEgP',
    tiktok_follower: '3550',
    instagram_url: 'https://www.instagram.com/svitlana_ugc?igsh=Y2xqMTlidXU1dHFq&utm_source=qr',
    instagram_follower: '6484',
  },
  {
    name: 'Aleksandra Martynova',
    shipping_country: 'US',
    tiktok_url: 'https://www.tiktok.com/@sasha_probuyer?_r=1&_t=ZP-959JcsZTIsw',
    tiktok_follower: '1059',
    instagram_url: 'https://www.instagram.com/sasha_probuyer?igsh=b2RlaXVmbTN2bGxx&utm_source=qr',
    instagram_follower: '1333',
  },
  {
    name: 'Anna Harrison',
    shipping_country: 'US',
    tiktok_url: 'https://www.tiktok.com/@alh_ugc?_r=1&_t=ZP-93AtErZ74Vr',
    tiktok_follower: '11',
    instagram_url: 'https://www.instagram.com/_annalharrison?igsh=eTFwYmcxNGk1dmkw&utm_source=qr',
    instagram_follower: '2129',
  },
];

/** admin_delivery_creators / JSON 행 → 표시용 (mergeSocialFieldsFromRecord 로 TT+IG 병합) */
const toDisplayCreator = (r, idx) => {
  const m = mergeSocialFieldsFromRecord(r);
  const snsChannels = buildSnsChannelsFromRow(m);
  const primary = snsChannels[0];
  return {
    id: r.id || m.id || idx + 1,
    name: m.name || r.name || '-',
    location: m.shipping_country || '-',
    sns_channels: snsChannels,
    handle: primary?.url || '-',
    platform: primary?.platform || 'SNS',
    followers: primary?.followers || '0',
    status: 'Pending Review',
    contact: '-',
    visit_date: m.visit_date || trimOrNull(r.visit_date) || null,
    _identifier: `${(m.name || r.name || '').trim()}`,
    is_new_replacement: !!(r.is_new_replacement || r.is_replacement),
  };
};

const finalizeTroublessPdrnScale50DisplayCreators = (rows) => {
  if (!Array.isArray(rows) || rows.length === 0) return rows;
  const base = rows.filter(
    (c) => !TROUBLESS_PDRN_REMOVED_FROM_FINAL_DELIVERY.has(normDeliveryListPersonName(c.name)),
  );
  const out = [...base];
  for (const raw of TROUBLESS_PDRN_REPLACEMENT_SPEC_RAW) {
    const key = normDeliveryListPersonName(raw.name);
    const idx = out.findIndex((c) => normDeliveryListPersonName(c.name) === key);
    const merged = mergeSocialFieldsFromRecord(raw);
    const display = { ...toDisplayCreator(merged, idx >= 0 ? idx : out.length), is_new_replacement: true };
    if (idx >= 0) out[idx] = display;
    else out.push(display);
  }
  return out;
};

const testInfluencerToDisplayCreator = (c, idx) => toDisplayCreator(c, idx);
/**
 * [Logic 보존] Campaign Status Enum & Helper Functions
 */
const CampaignStatus = {
  PAYMENT_PENDING: 'PAYMENT_PENDING',
  KICKOFF: 'KICKOFF',
  CONTACTING: 'CONTACTING',
  SHIPPING: 'SHIPPING',
  UPLOADING: 'UPLOADING',
  TRACKING: 'TRACKING',
  COMPLETED: 'COMPLETED',
};

/** 캠페인 진행 단계 — 화면용 한글 (값은 그대로 CampaignStatus) */
const CAMPAIGN_STATUS_KO = {
  [CampaignStatus.PAYMENT_PENDING]: '입금·계약 대기',
  [CampaignStatus.KICKOFF]: '착수(온보딩)',
  [CampaignStatus.CONTACTING]: '인플루언서 섭외 중',
  [CampaignStatus.SHIPPING]: '제품 발송 중',
  [CampaignStatus.UPLOADING]: '콘텐츠 업로드 중',
  [CampaignStatus.TRACKING]: '성과 트래킹',
  [CampaignStatus.COMPLETED]: '캠페인 완료',
};

const ORDER_PAYMENT_STATUS_KO = {
  paid: '결제 완료',
  pending_payment: '입금 대기',
  refunded: '환불됨',
  cancelled: '취소됨',
};

const maskData = (text, type = 'general') => {
  if (!text) return '-';
  if (type === 'email') {
    const [local, domain] = text.split('@');
    return `${local.slice(0, 2)}****@${domain}`;
  }
  if (type === 'address') return "배송사를 통해 전달됨 (비공개)"; 
  if (type === 'contact') return text.slice(0, 3) + "****" + text.slice(-2);
  return text.length > 5 ? text.slice(0, 5) + "****" : "****";
};

// --- [Mock Data] ---
const DEMO_CAMPAIGNS = [
  {
    id: 'demo-invoice',
    plan: 'Scale50',
    status: CampaignStatus.PAYMENT_PENDING,
    brand_name: 'BrandSlam Demo',
    product_name: 'Volume Up Shampoo',
    start_date: '2026-02-10',
    end_date: '2026-05-10',
    target_creators: 50,
    matched_creators: 0,
    plan_price: 2629000,
    content_count: 50,
    customer_name: '김데모',
    customer_email: 'demo@brandslam.com',
    order_number: 'BS-20260210-DEMO0001',
    kpi_views: '-', kpi_likes: '-', kpi_comments: '-', kpi_shares: '-',
    candidates: [],
    creators: [],
    contents: []
  },
  {
    id: 'demo-2',
    plan: 'Starter',
    status: CampaignStatus.CONTACTING,
    brand_name: 'BrandSlam Demo',
    product_name: 'Daily Sunscreen',
    start_date: '2026-01-01',
    end_date: '2026-02-01',
    target_creators: 30,
    matched_creators: 18,
    kpi_views: '-', kpi_likes: '-', kpi_comments: '-', kpi_shares: '-',
    candidates: [
        { id: 101, name: "Jessica M.", handle: "@jess_daily", platform: "TikTok", followers: "45K", location: "Los Angeles, CA", status: "Pending Review", contact: "jess***@gmail.com" },
        { id: 102, name: "Mike Ross", handle: "@mike_glowing", platform: "TikTok", followers: "120K", location: "New York, NY", status: "Approved", contact: "mike***@agency.com" },
        { id: 103, name: "Emily Blunt", handle: "@emily_skincare", platform: "Reels", followers: "82K", location: "Austin, TX", status: "Pending Review", contact: "emily***@naver.com" },
        { id: 104, name: "Chris Evans", handle: "@captain_skin", platform: "TikTok", followers: "210K", location: "Chicago, IL", status: "Rejected", contact: "chris***@daum.net" },
        { id: 105, name: "Scarlett J.", handle: "@black_widow_beauty", platform: "Shorts", followers: "550K", location: "Seattle, WA", status: "Approved", contact: "scarlett***@kakao.com" },
    ],
    creators: [],
    contents: []
  },
  {
    id: 'demo-1',
    plan: 'Growth',
    status: CampaignStatus.UPLOADING,
    brand_name: 'BrandSlam Demo',
    product_name: 'Vita-C Serum',
    start_date: '2025-12-15',
    end_date: '2026-01-15',
    target_creators: 30,
    matched_creators: 30,
    best_message: "끈적임 없이 흡수되는 비타민 세럼, 아침에도 밀리지 않아요!",
    kpi_views: '1.2M', kpi_likes: '45.2K', kpi_comments: '1,203', kpi_shares: '3,400',
    creators: [
      { id: 1, name: '@sarah_beauty', platform: 'TikTok', status: 'Uploaded', link: '#', engagement: 'High', views: '450K' },
      { id: 2, name: '@skincare_guru', platform: 'TikTok', status: 'Uploaded', link: '#', engagement: 'High', views: '320K' },
      { id: 3, name: '@glowwithme', platform: 'Reels', status: 'Uploaded', link: '#', engagement: 'Medium', views: '150K' },
      { id: 4, name: '@daily_routine', platform: 'TikTok', status: 'Uploaded', link: '#', engagement: 'Medium', views: '98K' },
      { id: 5, name: '@beauty_hacks', platform: 'Shorts', status: 'Uploaded', link: '#', engagement: 'Medium', views: '85K' },
      { id: 6, name: '@pure_skin', platform: 'TikTok', status: 'Uploaded', link: '#', engagement: 'Low', views: '42K' },
      { id: 7, name: '@makeup_artist_j', platform: 'Reels', status: 'Uploaded', link: '#', engagement: 'Low', views: '30K' },
      { id: 8, name: '@kbeauty_lover', platform: 'TikTok', status: 'Uploaded', link: '#', engagement: 'Medium', views: '28K' },
      { id: 9, name: '@cosmetic_science', platform: 'Youtube', status: 'Uploaded', link: '#', engagement: 'Low', views: '15K' },
      { id: 10, name: '@glass_skin_tips', platform: 'TikTok', status: 'Uploaded', link: '#', engagement: 'Low', views: '12K' },
    ],
    contents: [
      { id: 1, thumbnail_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80', views: '450K', creator: '@sarah_beauty' },
      { id: 2, thumbnail_url: 'https://images.unsplash.com/photo-1570554886111-e80fcca6a029?w=400&q=80', views: '320K', creator: '@skincare_guru' },
      { id: 3, thumbnail_url: 'https://images.unsplash.com/photo-1612817288484-6f916006741a?w=400&q=80', views: '150K', creator: '@glowwithme' },
      { id: 4, thumbnail_url: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&q=80', views: '98K', creator: '@daily_routine' },
      { id: 5, thumbnail_url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&q=80', views: '85K', creator: '@beauty_hacks' },
      { id: 6, thumbnail_url: 'https://images.unsplash.com/photo-1619451334792-150fd785ee74?w=400&q=80', views: '42K', creator: '@pure_skin' },
      { id: 7, thumbnail_url: 'https://images.unsplash.com/photo-1552693673-1bf958298935?w=400&q=80', views: '30K', creator: '@makeup_artist_j' },
      { id: 8, thumbnail_url: 'https://images.unsplash.com/photo-1617897903246-719242758050?w=400&q=80', views: '28K', creator: '@kbeauty_lover' },
      { id: 9, thumbnail_url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&q=80', views: '15K', creator: '@cosmetic_science' },
      { id: 10, thumbnail_url: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=400&q=80', views: '12K', creator: '@glass_skin_tips' },
    ]
  },
  {
    id: 'demo-3',
    plan: 'Scale50',
    status: CampaignStatus.COMPLETED,
    brand_name: 'BrandSlam Demo',
    product_name: 'Calming Toner',
    start_date: '2025-12-01',
    end_date: '2026-01-01',
    target_creators: 100,
    matched_creators: 100,
    best_message: "진정 효과뿐만 아니라 속건조까지 잡아주는 인생 토너",
    kpi_views: '3.5M', kpi_likes: '120K', kpi_comments: '5,400', kpi_shares: '12K',
    creators: [], 
    contents: [],
    analytics: {
        dates: ['12/01', '12/05', '12/10', '12/15', '12/20', '12/25', '12/30'],
        daily_views: [20, 45, 120, 250, 220, 180, 150], 
        engagement_rate: '8.5%',
        top_contents: [
            { id: 1, creator: "@jenny_glow", platform: "TikTok", views: "1.2M", thumbnail: "https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?w=400&q=80" },
            { id: 2, creator: "@skincare_daddy", platform: "Reels", views: "890K", thumbnail: "https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?w=400&q=80" },
            { id: 3, creator: "@beauty_insider", platform: "Shorts", views: "650K", thumbnail: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?w=400&q=80" }
        ]
    }
  }
];

// --- [Sub-Components: 리뉴얼 테마 반영] ---

const StatusBadge = ({ status }) => {
  const styles = {
    [CampaignStatus.PAYMENT_PENDING]: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    [CampaignStatus.KICKOFF]: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    [CampaignStatus.CONTACTING]: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    [CampaignStatus.SHIPPING]: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    [CampaignStatus.UPLOADING]: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    [CampaignStatus.TRACKING]: "bg-indigo-500/10 text-indigo-300 border-indigo-500/25",
    [CampaignStatus.COMPLETED]: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  };
  
  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border backdrop-blur-md ${styles[status] || styles[CampaignStatus.PAYMENT_PENDING]}`}>
      {CAMPAIGN_STATUS_KO[status] || status}
    </span>
  );
};

const getCampaignProgressSubtitle = (status) => {
  const m = {
    [CampaignStatus.PAYMENT_PENDING]: '고객 입금·계약 확인을 기다리는 중입니다.',
    [CampaignStatus.KICKOFF]: '캠페인이 시작되어 세팅·일정을 잡는 단계입니다.',
    [CampaignStatus.CONTACTING]: '인플루언서를 섭외하고 있습니다.',
    [CampaignStatus.SHIPPING]: '제품을 발송하는 단계입니다.',
    [CampaignStatus.UPLOADING]: '콘텐츠 업로드·검수를 진행 중입니다.',
    [CampaignStatus.TRACKING]: '업로드 이후 성과·트래킹을 모으는 단계입니다.',
    [CampaignStatus.COMPLETED]: '캠페인이 끝나 보고 단계입니다.',
  };
  return m[status] || '진행 중인 캠페인입니다.';
};

const MetricCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white/5 backdrop-blur-xl p-5 rounded-2xl border border-white/10 shadow-xl group hover:border-white/20 transition-all">
    <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl ${color} shadow-lg group-hover:scale-110 transition-transform`}>
          {Icon && <Icon size={22} />}
        </div>
        <div>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-1">{label}</p>
          <p className="text-2xl font-black text-white tracking-tighter">{value || '-'}</p>
        </div>
    </div>
  </div>
);

/** orders.order_items (JSONB 또는 문자열) */
const parseOrderItems = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try {
      const p = JSON.parse(raw);
      return Array.isArray(p) ? p : [];
    } catch {
      return [];
    }
  }
  return [];
};

/**
 * 결제 orders 행 기준 인보이스 라인 (Visit x N + unit_price*qty 공급가).
 * 있으면 campaigns N건 집계보다 우선합니다.
 */
const buildLineItemsFromOrderSummary = (order) => {
  if (!order) return null;
  const items = parseOrderItems(order.order_items);
  if (items.length === 0) return null;
  const lines = [];
  for (const item of items) {
    const planName = item.plan_name || 'Product';
    const qty = Math.max(1, Number(item.qty) || 1);
    const unitSupply = Number(item.unit_price) || 0;
    const contentCount = Math.max(1, Number(item.content_count) || 1);
    const isVisit = !!item.is_visit;
    const lineQty = isVisit ? qty : qty * contentCount;
    const supplyAmount = Math.round(qty * unitSupply);
    lines.push({
      plan: planName,
      qty: lineQty,
      supplyAmount,
      unitSupply,
      isVisit,
    });
  }
  return lines.length ? lines : null;
};

const CampaignCard = ({ campaign, onClick, isActive }) => (
  <div 
    onClick={onClick}
    className={`p-6 rounded-[2rem] border transition-all duration-500 cursor-pointer relative overflow-hidden group ${
      isActive 
      ? 'bg-gradient-to-br from-purple-900/40 to-blue-900/40 border-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.2)]' 
      : 'bg-white/5 border-white/5 hover:border-white/10'
    }`}
  >
    {isActive && <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 blur-2xl rounded-full"></div>}
    <div className="flex justify-between items-start mb-4 relative z-10">
      <div className="min-w-0">
        <span className="text-[10px] font-black text-cyan-400 mb-1 block tracking-[0.2em] uppercase">{campaign.plan} PLAN</span>
        <h3 className="font-bold text-white text-base truncate pr-2">
          {campaign.product_name || campaign.order_summary?.plan_name || '상품명 미정'}
        </h3>
      </div>
    </div>
    <div className="flex items-center justify-between mt-4 relative z-10">
        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium uppercase tracking-widest">
            <Calendar size={12} />
            <span>{campaign.start_date || 'TBD'}</span>
        </div>
        <StatusBadge status={campaign.status} />
    </div>
  </div>
);

// --- 데모용 예시 송장 (비로그인 사용자용, 계약 폼 없음) ---
const DEMO_INVOICE_EXAMPLE = {
  invoiceId: 'INV-DEMO-2026-001',
  invoiceDate: new Date().toISOString().split('T')[0],
  plan: 'Growth',
  productName: '글로벌 시딩 캠페인',
  qty: 20,
  supplyPrice: 990000,   // 상품가(공급가액)
  vatAmount: 99000,      // 부가세 10%
  totalAmount: 1089000,  // 실제 결제가격 (상품가 + 부가세)
  unitPrice: 49500,      // 990000 / 20
  clientCompanyName: '주식회사 송장 예시용 브랜드',
  clientBizRegNo: '123-45-67890',
  clientAddress: '서울특별시 강남구 테헤란로 123, 4층',
};

const DemoInvoiceExample = () => {
  const d = DEMO_INVOICE_EXAMPLE;
  const invoiceRef = useRef(null);
  return (
    <div className="space-y-10 animate-fade-in-up">
      <div className="bg-purple-500/10 border border-purple-500/20 rounded-3xl p-6 flex items-center gap-4">
        <FileText className="text-purple-400 shrink-0" size={24} />
        <div>
          <h4 className="font-bold text-purple-300 text-lg">데모용 예시 송장</h4>
          <p className="text-slate-400 text-sm font-light">아래는 계약/송장 화면 예시입니다. 실제 계약 및 결제는 로그인 후 진행할 수 있습니다.</p>
        </div>
      </div>
      <div ref={invoiceRef} className="bg-white text-slate-900 rounded-sm shadow-2xl p-8 md:p-16 max-w-4xl mx-auto relative overflow-hidden">
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-8 mb-10">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">INVOICE</h1>
            <p className="text-slate-500 mt-2 font-medium">청구서 (예시)</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Invoice No.</p>
            <p className="text-lg font-bold text-slate-900 mb-2">{d.invoiceId}</p>
            <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Date</p>
            <p className="text-md font-medium text-slate-900">{d.invoiceDate}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">공급자</h3>
            <div className="text-sm text-slate-700 space-y-1.5">
              <p className="font-bold text-lg text-slate-900">주식회사 브랜드슬램</p>
              <p>대표이사: 장현우</p>
              <p>사업자등록번호: 284-44-03016</p>
              <p>서울특별시 용산구 한강대로 366, 8층 804호</p>
              <p className="text-indigo-600 font-medium">contact@slam-global.com</p>
            </div>
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">공급받는 자</h3>
            <div className="text-sm text-slate-700 space-y-1.5">
              <p className="font-bold text-lg text-slate-900">{d.clientCompanyName}</p>
              <p>사업자등록번호: {d.clientBizRegNo}</p>
              <p>{d.clientAddress}</p>
            </div>
          </div>
        </div>
        <table className="w-full mb-12 text-sm">
          <thead>
            <tr className="bg-slate-50 border-y-2 border-slate-900 text-slate-500">
              <th className="py-4 px-4 text-left font-bold uppercase tracking-wider">Description</th>
              <th className="py-4 px-4 text-center font-bold uppercase tracking-wider">Qty</th>
              <th className="py-4 px-4 text-right font-bold uppercase tracking-wider">Unit Price</th>
              <th className="py-4 px-4 text-right font-bold uppercase tracking-wider">Amount</th>
            </tr>
          </thead>
          <tbody className="text-slate-700">
            <tr className="border-b border-slate-100">
              <td className="py-5 px-4">
                <p className="font-bold text-slate-900 text-base">BrandSlam {d.plan.toUpperCase()} PLAN</p>
                <p className="text-xs text-slate-500 mt-1">{d.productName} 운영 및 매니지먼트</p>
              </td>
              <td className="py-5 px-4 text-center">{d.qty}개</td>
              <td className="py-5 px-4 text-right text-slate-500">{d.unitPrice.toLocaleString()}</td>
              <td className="py-5 px-4 text-right font-bold text-slate-900">{d.supplyPrice.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
        <div className="flex flex-col md:flex-row justify-between items-start gap-12">
          <div className="w-full md:w-1/2">
            <h4 className="font-bold text-slate-900 mb-4 border-b-2 border-slate-900 pb-2 inline-block">Payment</h4>
            <div className="space-y-4">
              <div className="p-4 rounded-lg border bg-indigo-50 border-indigo-200">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-indigo-700">전액 결제</span>
                  <span className="text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide bg-indigo-200 text-indigo-800">PAY NOW</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-xl font-black text-slate-900">{d.totalAmount.toLocaleString()} <span className="text-sm font-normal text-slate-500">KRW</span></span>
                </div>
                <p className="text-xs text-slate-500 mt-2 flex items-center gap-1"><Clock size={12}/> 입금 확인 후 계약 확정</p>
              </div>
            </div>
            <div className="mt-8 p-5 bg-slate-900 text-white rounded-xl shadow-lg">
              <p className="text-xs text-slate-400 mb-2 font-bold uppercase tracking-widest">Bank Information</p>
              <p className="font-bold text-lg mb-1 flex items-center gap-2">
                <span className="text-yellow-400">SC제일은행</span> 325-20-322490
              </p>
              <p className="text-sm text-slate-400">예금주: 주식회사브랜드슬램</p>
            </div>
          </div>
          <div className="w-full md:w-5/12">
            <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200">
              <div className="flex justify-between mb-3 text-slate-500 text-sm">
                <span>공급가액 (Subtotal)</span>
                <span>{d.supplyPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between mb-6 text-slate-500 text-sm">
                <span>부가세 VAT (10%)</span>
                <span>{d.vatAmount.toLocaleString()}</span>
              </div>
              <div className="border-t-2 border-slate-200 my-4 pt-6 flex justify-between items-center">
                <span className="font-black text-xl text-slate-900">Total</span>
                <span className="font-black text-3xl text-indigo-600">{d.totalAmount.toLocaleString()}</span>
              </div>
              <p className="text-xs text-right text-slate-400 mt-2">* KRW (원) 기준</p>
            </div>
            <div className="mt-12 text-right relative">
              <p className="font-serif font-bold text-lg text-slate-900 z-10 relative">주식회사 브랜드슬램 대표이사 장현우 (인)</p>
              <img src={sealImg} alt="직인" className="absolute -top-8 right-0 w-24 h-24 object-contain opacity-80 rotate-6 mix-blend-multiply" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- [New Component] Invoice Detail View (계약서/송장) ---
/** @param {{ campaign: object, adminReadOnly?: boolean }} props — adminReadOnly: 관리자 미리보기(확정·세팅 CTA 숨김, PDF만) */
export const InvoiceDetail = ({ campaign, adminReadOnly = false }) => {
    const invoiceRef = useRef(null);
    const [orderCampaigns, setOrderCampaigns] = useState([campaign]);
    const [isConfirmed, setIsConfirmed] = useState(!!(campaign.client_address && campaign.client_biz_reg_no));
    const [clientForm, setClientForm] = useState({
        companyName: campaign.brand_name || '',
        address: campaign.client_address || '',
        bizRegNo: campaign.client_biz_reg_no || '',
    });
    const setClient = (field) => (e) => setClientForm(prev => ({ ...prev, [field]: e.target.value }));

    useEffect(() => {
        if (!campaign?.id) return;
        setOrderCampaigns([campaign]);
        setIsConfirmed(!!(campaign.client_address && campaign.client_biz_reg_no));
        setClientForm({
            companyName: campaign.brand_name || '',
            address: campaign.client_address || '',
            bizRegNo: campaign.client_biz_reg_no || '',
        });
        // 고객 인보이스 입력 중 목록만 갱신될 때 폼이 지워지지 않도록 id 기준만 사용
        // eslint-disable-next-line react-hooks/exhaustive-deps -- campaign.id로 행 전환 시에만 초기화
    }, [campaign?.id]);

    // 동일 order_number의 모든 캠페인 조회 (다중 구매 시 라인아이템 집계)
    useEffect(() => {
        if (!campaign.order_number || String(campaign.id).startsWith('demo-')) return;
        const fetchOrderCampaigns = async () => {
            const { data } = await supabase.from('campaigns').select('*').eq('order_number', campaign.order_number);
            if (data?.length) setOrderCampaigns(data);
        };
        fetchOrderCampaigns();
    }, [campaign.order_number, campaign.id]);

    const customerEmailLower = String(campaign.customer_email || '').toLowerCase().trim();
    const isFramelessContract = customerEmailLower === CUSTOM_OFFER_FRAMELESS_EMAIL;

    // 라인아이템: ① The Frameless → 코드 확정 계약(시딩 N건) ② orders.order_items ③ campaigns 집계
    const lineItems = useMemo(() => {
        if (customerEmailLower === CUSTOM_OFFER_FRAMELESS_EMAIL) {
            const q = FRAMELESS_OFFER_PRICING.seedingQty;
            const unit = FRAMELESS_OFFER_PRICING.seedingUnitPrice;
            return [
                {
                    plan: `시딩(건당) x${q}`,
                    qty: q,
                    supplyAmount: unit * q,
                    unitSupply: unit,
                    isVisit: false,
                },
            ];
        }
        const fromOrder = buildLineItemsFromOrderSummary(campaign.order_summary);
        if (fromOrder?.length) return fromOrder;
        const map = {};
        for (const c of orderCampaigns) {
            const plan = c.plan || 'Unknown';
            if (!map[plan]) map[plan] = { plan, qty: 0, supplyAmount: 0, isVisit: plan.toLowerCase().includes('visit') };
            map[plan].qty += 1;
            const unitSupply = c.plan_price ? Math.round(c.plan_price / 1.1) : 0;
            map[plan].supplyAmount += unitSupply;
        }
        return Object.values(map).map((li) => ({
            ...li,
            unitSupply: li.qty > 0 ? Math.round(li.supplyAmount / li.qty) : li.supplyAmount,
            isVisit: li.isVisit,
        }));
    }, [customerEmailLower, campaign.order_summary, orderCampaigns]);

    const isDemo = String(campaign.id).startsWith('demo-');

    const lineSupplySum = lineItems.reduce((s, li) => s + li.supplyAmount, 0);
    const orderTotalInclVatDb = Number(campaign.order_summary?.plan_price);
    const useOrderContractTotalFromDb = Number.isFinite(orderTotalInclVatDb) && orderTotalInclVatDb > 0;

    const framelessTotals = isFramelessContract ? getFramelessOfferTotals() : null;

    let totalSupplyPrice;
    let vatAmount;
    let totalAmount;
    if (framelessTotals) {
        totalSupplyPrice = framelessTotals.supply;
        vatAmount = framelessTotals.vat;
        totalAmount = framelessTotals.total;
    } else if (useOrderContractTotalFromDb) {
        totalSupplyPrice = Math.round(orderTotalInclVatDb / 1.1);
        vatAmount = orderTotalInclVatDb - totalSupplyPrice;
        totalAmount = orderTotalInclVatDb;
    } else {
        totalSupplyPrice = lineSupplySum;
        vatAmount = Math.round(lineSupplySum * 0.1);
        totalAmount = lineSupplySum + vatAmount;
    }
    const supplyPrice = totalSupplyPrice;

    const invoiceId = isDemo ? campaign.id.toUpperCase() : (campaign.order_number || campaign.id.slice(0, 8)).toUpperCase();
    const invoiceDate = campaign.created_at ? new Date(campaign.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    const clientValid = clientForm.companyName && clientForm.address && clientForm.bizRegNo;

    const handleConfirm = async () => {
        if (adminReadOnly) return;
        if (!clientValid) { alert('공급받는 자 정보를 모두 입력해주세요.'); return; }
        if (!window.confirm("입력하신 정보로 계약을 확정하시겠습니까?\n확정 후에는 수정이 불가합니다.")) return;
        if (!isDemo) {
            try {
                await supabase.from('campaigns').update({
                    brand_name: clientForm.companyName,
                    client_address: clientForm.address,
                    client_biz_reg_no: clientForm.bizRegNo,
                }).eq('order_number', campaign.order_number);
            } catch { /* 저장 실패해도 UI는 진행 */ }
        }
        setIsConfirmed(true);
    };

    const handlePdfDownload = async () => {
        const el = invoiceRef.current;
        if (!el) return;
        const html2pdf = (await import('html2pdf.js')).default;
        html2pdf().set({
            margin: [10, 10, 10, 10],
            filename: `Invoice-${invoiceId}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, logging: false },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        }).from(el).save();
    };

    const navigate = useNavigate();
    const handleCampaignSetup = () => {
        navigate(`/campaign-setup/${campaign.id}`);
    };

    return (
        <div className="space-y-10 animate-fade-in-up">
            {/* 1. Process Tracker */}
            {!adminReadOnly && (
            <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10">
                <h4 className="font-black text-white text-xl mb-8 flex items-center gap-3 tracking-tighter">
                    <CreditCard size={24} className="text-yellow-400"/> 계약 및 결제 프로세스
                </h4>
                <div className="relative">
                    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/10 -z-10"></div>
                    <div className="flex justify-between w-full max-w-4xl mx-auto">
                        {[
                            { id: 1, label: "플랜 선택", icon: Package, done: true },
                            { id: 2, label: "인보이스 확인", icon: FileText, done: true },
                            { id: 3, label: "결제", icon: CreditCard, done: true },
                            { id: 4, label: "계약 확정", icon: FileText, active: !isConfirmed, done: isConfirmed },
                            { id: 5, label: "캠페인 세팅", icon: Rocket, active: isConfirmed, done: false },
                            { id: 6, label: "착수", icon: CheckCircle2, done: false }
                        ].map((step) => (
                            <div key={step.id} className="flex flex-col items-center gap-3 bg-[#020617] px-2 z-10">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all ${
                                    step.active 
                                    ? "bg-yellow-500 border-yellow-500 text-slate-900 shadow-[0_0_15px_rgba(234,179,8,0.5)] scale-110" 
                                    : step.done 
                                        ? "bg-emerald-600 border-emerald-500 text-white"
                                        : "bg-slate-900 border-slate-800 text-slate-600"
                                }`}>
                                    {step.done ? <CheckCircle2 size={20} strokeWidth={3} /> : <step.icon size={20} strokeWidth={step.active ? 3 : 2} />}
                                </div>
                                <span className={`text-[10px] font-bold uppercase tracking-widest ${step.active ? "text-yellow-400" : step.done ? "text-emerald-400" : "text-slate-500"}`}>
                                    {step.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            )}
            {adminReadOnly && (
                <div className="bg-slate-800/60 border border-white/10 rounded-2xl px-5 py-4 flex items-center gap-3">
                    <FileText className="text-cyan-400 shrink-0" size={22} />
                    <p className="text-sm text-slate-300">
                        <span className="font-bold text-white">관리자 보기</span>
                        {' — '}고객 화면과 동일한 인보이스입니다. PDF로 내려받을 수 있습니다.
                    </p>
                </div>
            )}

            {/* 2. Client Info Form / Confirmation Notice */}
            {!adminReadOnly && !isConfirmed ? (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-3xl p-8 space-y-6">
                    <div className="flex items-start gap-4">
                        <Building2 className="text-yellow-500 shrink-0 mt-1" size={24} />
                        <div>
                            <h4 className="font-bold text-yellow-400 text-lg mb-1">계약서 확정을 위해 귀사 정보를 입력해주세요.</h4>
                            <p className="text-slate-300 text-sm font-light">
                                아래 정보가 인보이스에 반영됩니다. 입력 후 하단의 <strong>'계약 확정하기'</strong> 버튼을 눌러주세요.
                            </p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">공급받는 자 (회사명) *</label>
                            <input type="text" placeholder="주식회사 OOO" value={clientForm.companyName} onChange={setClient('companyName')}
                                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/30 transition-all text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">사업자등록번호 *</label>
                            <input type="text" placeholder="000-00-00000" value={clientForm.bizRegNo} onChange={setClient('bizRegNo')}
                                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/30 transition-all text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">주소 *</label>
                            <input type="text" placeholder="서울특별시 OO구 OO로 000" value={clientForm.address} onChange={setClient('address')}
                                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/30 transition-all text-sm" />
                        </div>
                    </div>
                </div>
            ) : !adminReadOnly && isConfirmed ? (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-6 flex items-center gap-4">
                    <CheckCircle2 className="text-emerald-500 shrink-0" size={24} />
                    <div>
                        <h4 className="font-bold text-emerald-400 text-lg">계약이 확정되었습니다.</h4>
                        <p className="text-emerald-200/70 text-sm font-light">입금 확인 후 캠페인 세팅이 시작됩니다. PDF 다운로드가 가능합니다.</p>
                    </div>
                </div>
            ) : null}

            {/* 3. Invoice Paper */}
            <div ref={invoiceRef} className="bg-white text-slate-900 rounded-sm shadow-2xl p-8 md:p-16 max-w-4xl mx-auto relative overflow-hidden">
                {!isConfirmed && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-200/50 font-black text-9xl -rotate-45 pointer-events-none select-none z-0 whitespace-nowrap">
                        DRAFT
                    </div>
                )}

                {/* Header */}
                <div className="flex justify-between items-start border-b-2 border-slate-900 pb-8 mb-10 relative z-10">
                    <div>
                        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">INVOICE</h1>
                        <p className="text-slate-500 mt-2 font-medium">{isConfirmed ? '청구서' : '견적서 (확정 전)'}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Invoice No.</p>
                        <p className="text-lg font-bold text-slate-900 mb-2">INV-{invoiceId}</p>
                        <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Date</p>
                        <p className="text-md font-medium text-slate-900">{invoiceDate}</p>
                    </div>
                </div>

                {/* Supplier & Client */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12 relative z-10">
                    <div>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">공급자</h3>
                        <div className="text-sm text-slate-700 space-y-1.5">
                            <p className="font-bold text-lg text-slate-900">주식회사 브랜드슬램</p>
                            <p>대표이사: 장현우</p>
                            <p>사업자등록번호: 284-44-03016</p>
                            <p>서울특별시 용산구 한강대로 366, 8층 804호</p>
                            <p className="text-indigo-600 font-medium">contact@slam-global.com</p>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">공급받는 자</h3>
                        {isConfirmed || clientForm.companyName ? (
                            <div className="text-sm text-slate-700 space-y-1.5">
                                <p className="font-bold text-lg text-slate-900">{clientForm.companyName || '-'}</p>
                                <p>사업자등록번호: {clientForm.bizRegNo || '-'}</p>
                                <p>{clientForm.address || '-'}</p>
                            </div>
                        ) : (
                            <div className="text-sm text-slate-400 italic py-4 px-4 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                                상단에서 귀사 정보를 입력해주세요.
                            </div>
                        )}
                    </div>
                </div>

                {/* Items */}
                <table className="w-full mb-12 relative z-10 text-sm">
                    <thead>
                        <tr className="bg-slate-50 border-y-2 border-slate-900 text-slate-500">
                            <th className="py-4 px-4 text-left font-bold uppercase tracking-wider">Description</th>
                            <th className="py-4 px-4 text-center font-bold uppercase tracking-wider">Qty</th>
                            <th className="py-4 px-4 text-right font-bold uppercase tracking-wider">Unit Price</th>
                            <th className="py-4 px-4 text-right font-bold uppercase tracking-wider">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="text-slate-700">
                        {lineItems.map((li, idx) => {
                            const isVisitPlan = li.isVisit ?? li.plan?.toLowerCase().includes('visit');
                            const unitPrice =
                                li.unitSupply != null && li.unitSupply > 0
                                    ? li.unitSupply
                                    : li.qty > 0
                                      ? Math.round(li.supplyAmount / li.qty)
                                      : li.supplyAmount;
                            const rowKey = `${li.plan}-${idx}`;
                            return (
                                <tr key={rowKey} className="border-b border-slate-100">
                                    <td className="py-5 px-4">
                                        <p className="font-bold text-slate-900 text-base">BrandSlam {String(li.plan).toUpperCase()} PLAN</p>
                                        <p className="text-xs text-slate-500 mt-1">
                                            {isVisitPlan
                                                ? `${li.plan} ${li.qty}건 · 글로벌 방문형 콘텐츠`
                                                : `${li.plan} 글로벌 캠페인 운영 및 매니지먼트`}
                                        </p>
                                    </td>
                                    <td className="py-5 px-4 text-center">{li.qty}{isVisitPlan ? '건' : '개'}</td>
                                    <td className="py-5 px-4 text-right text-slate-500">{unitPrice.toLocaleString()}</td>
                                    <td className="py-5 px-4 text-right font-bold text-slate-900">{li.supplyAmount.toLocaleString()}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {/* Summary & Payment Info */}
                <div className="flex flex-col md:flex-row justify-between items-start gap-12 relative z-10">
                    <div className="w-full md:w-1/2">
                        <h4 className="font-bold text-slate-900 mb-4 border-b-2 border-slate-900 pb-2 inline-block">Payment</h4>
                        <div className="space-y-4">
                            <div className="p-4 rounded-lg border bg-indigo-50 border-indigo-200">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold text-indigo-700">전액 결제</span>
                                    <span className="text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide bg-indigo-200 text-indigo-800">PAY NOW</span>
                                </div>
                                <div className="flex justify-between items-baseline">
                                    <span className="text-xl font-black text-slate-900">{totalAmount.toLocaleString()} <span className="text-sm font-normal text-slate-500">KRW</span></span>
                                </div>
                                <p className="text-xs text-slate-500 mt-2 flex items-center gap-1"><Clock size={12}/> 입금 확인 후 계약 확정</p>
                            </div>
                        </div>

                        <div className="mt-8 p-5 bg-slate-900 text-white rounded-xl shadow-lg">
                            <p className="text-xs text-slate-400 mb-2 font-bold uppercase tracking-widest">Bank Information</p>
                            <p className="font-bold text-lg mb-1 flex items-center gap-2">
                                <span className="text-yellow-400">SC제일은행</span> 325-20-322490
                            </p>
                            <p className="text-sm text-slate-400">예금주: 주식회사브랜드슬램</p>
                        </div>
                    </div>

                    <div className="w-full md:w-5/12">
                        <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200">
                            <div className="flex justify-between mb-3 text-slate-500 text-sm">
                                <span>공급가액 (Subtotal)</span>
                                <span>{supplyPrice.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between mb-6 text-slate-500 text-sm">
                                <span>부가세 VAT (10%)</span>
                                <span>{vatAmount.toLocaleString()}</span>
                            </div>
                            <div className="border-t-2 border-slate-200 my-4 pt-6 flex justify-between items-center">
                                <span className="font-black text-xl text-slate-900">Total</span>
                                <span className="font-black text-3xl text-indigo-600">{totalAmount.toLocaleString()}</span>
                            </div>
                            <p className="text-xs text-right text-slate-400 mt-2">* KRW (원) 기준</p>
                        </div>
                        
                        <div className="mt-12 text-right relative">
                            <p className="font-serif font-bold text-lg text-slate-900 z-10 relative">주식회사 브랜드슬램 대표이사 장현우 (인)</p>
                            <img src={sealImg} alt="직인" className="absolute -top-8 right-0 w-24 h-24 object-contain opacity-80 rotate-6 mix-blend-multiply" />
                        </div>
                    </div>
                </div>
            </div>

            {/* 4. Action Buttons */}
            {adminReadOnly ? (
                <div className="flex justify-center pb-8">
                    <button
                        type="button"
                        onClick={handlePdfDownload}
                        className="flex items-center justify-center gap-2 px-8 py-4 bg-white/5 border border-white/10 text-slate-300 rounded-2xl font-bold hover:bg-white/10 transition-all uppercase tracking-widest text-sm"
                    >
                        <Download size={18} /> PDF Download
                    </button>
                </div>
            ) : !isConfirmed ? (
                <div className="flex justify-center pb-8">
                    <button 
                        onClick={handleConfirm}
                        disabled={!clientValid}
                        className={`flex items-center justify-center gap-3 px-14 py-5 rounded-2xl font-black text-lg uppercase tracking-widest transition-all hover:-translate-y-1 ${
                            clientValid 
                            ? 'bg-yellow-500 text-slate-900 shadow-[0_0_40px_rgba(234,179,8,0.4)] hover:bg-yellow-400' 
                            : 'bg-white/5 text-slate-600 cursor-not-allowed border border-white/10'
                        }`}
                    >
                        <ShieldCheck size={22} /> 계약 확정하기
                    </button>
                </div>
            ) : (
                <div className="space-y-6 pb-8">
                    <div className="flex justify-center">
                        <button onClick={handlePdfDownload} className="flex items-center justify-center gap-2 px-8 py-4 bg-white/5 border border-white/10 text-slate-300 rounded-2xl font-bold hover:bg-white/10 transition-all uppercase tracking-widest text-sm">
                            <Download size={18} /> PDF Download
                        </button>
                    </div>

                    {/* Campaign Setup CTA */}
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 rounded-3xl blur-xl opacity-40 group-hover:opacity-70 transition-opacity duration-500"></div>
                        <button
                            onClick={handleCampaignSetup}
                            className="relative w-full py-7 bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 text-white rounded-3xl font-black text-xl md:text-2xl shadow-2xl hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-4 tracking-tight"
                        >
                  
                            캠페인 세팅하기
                            <ArrowRight size={28} />
                        </button>
                        <p className="text-center text-slate-500 text-xs mt-4 font-medium tracking-tight">입금 확인 후 캠페인에 필요한 세부 정보를 입력하는 단계입니다.</p>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Detail Component: Candidate List (섭외 중 / 납품) ---
/** 리스트 납품일(한국 달력) 다음 날부터 세는 영업일 수 — 그 마지막 영업일 자정(23:59:59 KST)까지 드랍 가능 */
const DROP_DEADLINE_BUSINESS_DAYS = 3;

/** 대한민국 공휴일(주말 제외 일자만). 연도별로 법정·임시공휴일 반영 시 갱신하세요. */
const KR_PUBLIC_HOLIDAYS = new Set([
  '2025-01-01',
  '2025-01-28',
  '2025-01-29', 
  '2025-01-30',
  '2025-03-01',
  '2025-03-03',
  '2025-05-05',
  '2025-05-06',
  '2025-06-06',
  '2025-08-15',
  '2025-10-03',
  '2025-10-05',
  '2025-10-06',
  '2025-10-07',
  '2025-10-08',
  '2025-10-09',
  '2025-12-25',
  '2026-01-01',
  '2026-02-16',
  '2026-02-17',
  '2026-02-18',
  '2026-03-01',
  '2026-03-02',
  '2026-05-05',
  '2026-05-25',
  '2026-06-03',
  '2026-06-06',
  '2026-08-15',
  '2026-09-24',
  '2026-09-25',
  '2026-09-26',
  '2026-10-03',
  '2026-10-05',
  '2026-10-09',
  '2026-12-25',
  '2027-01-01',
  '2027-02-07',
  '2027-02-08',
  '2027-02-09',
  '2027-03-01',
  '2027-03-02',
  '2027-05-05',
  '2027-05-13',
  '2027-06-06',
  '2027-08-15',
  '2027-09-14',
  '2027-09-15',
  '2027-09-16',
  '2027-10-03',
  '2027-10-04',
  '2027-10-09',
  '2027-10-11',
  '2027-12-25',
  '2027-12-27',
  '2028-01-01',
  '2028-01-26',
  '2028-01-27',
  '2028-01-28',
  '2028-03-01',
  '2028-05-05',
  '2028-05-22',
  '2028-06-06',
  '2028-08-15',
  '2028-10-02',
  '2028-10-03',
  '2028-10-04',
  '2028-10-09',
  '2028-12-25',
]);

const addCalendarDaysSeoul = (ymd, deltaDays) => {
  const t = new Date(`${ymd}T12:00:00+09:00`);
  t.setTime(t.getTime() + deltaDays * 86400000);
  return t.toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });
};

const isSeoulWeekendYmd = (ymd) => {
  const w = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Seoul', weekday: 'short' }).format(new Date(`${ymd}T12:00:00+09:00`));
  return w === 'Sat' || w === 'Sun';
};

const isKoreanBusinessDayYmd = (ymd) => !isSeoulWeekendYmd(ymd) && !KR_PUBLIC_HOLIDAYS.has(ymd);

/** 납품 시각 기준: 납품일(한국) 다음 날부터 3번째 영업일이 속한 날짜의 YYYY-MM-DD (Seoul) */
const getDropDeadlineSeoulYmd = (sentAt) => {
  if (!sentAt) return null;
  const deliveryYmd = sentAt.toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });
  let ymd = addCalendarDaysSeoul(deliveryYmd, 1);
  let bizCounted = 0;
  while (bizCounted < DROP_DEADLINE_BUSINESS_DAYS) {
    if (isKoreanBusinessDayYmd(ymd)) bizCounted += 1;
    if (bizCounted < DROP_DEADLINE_BUSINESS_DAYS) ymd = addCalendarDaysSeoul(ymd, 1);
  }
  return ymd;
};

/** 해당 영업일 서울 자정 직전 */
const seoulYmdEndOfBusinessDay = (ymd) => new Date(`${ymd}T23:59:59.999+09:00`);

const formatSeoulYmdLongKr = (ymd) => {
  if (!ymd) return '';
  const [y, m, d] = ymd.split('-').map(Number);
  return `${y}년 ${m}월 ${d}일`;
};

const serializeDroppedSet = (set) => JSON.stringify([...set].sort((a, b) => a.localeCompare(b)));

/** PostgREST: 테이블 미생성·스키마 캐시에 없을 때 */
const isMissingDeliverySessionsTableError = (err) => {
    const m = String(err?.message || '').toLowerCase();
    return (
        m.includes('delivery_list_sessions') &&
        (m.includes('schema cache') || m.includes('could not find') || m.includes('does not exist') || m.includes('relation') && m.includes('does not exist'))
    );
};

const CandidateList = ({
    candidates,
    targetCount,
    matchedCount,
    isDeliveryTest,
    campaign,
    user,
    existingDrops = [],
    allowAdminUnconfirm = false,
    deliveryTableLayout = 'stacked',
}) => {
    const { refType, refId } = campaign ? resolveDeliveryReference(campaign) : { refType: 'campaign', refId: '' };
    const progress = Math.min(Math.round((matchedCount / targetCount) * 100), 100);
    const listTotal = (candidates && candidates.length) || targetCount || 50;
    const maxDropCount = Math.max(0, Math.floor(listTotal * 0.3));
    const [droppedIds, setDroppedIds] = useState(() => new Set(
        (existingDrops || []).map((d) => normalizeDropIdentifier(d.creator_identifier)).filter(Boolean),
    ));
    /** 서버에 마지막으로 저장된 드랍 집합(JSON 키) — 체크 해제 후 저장(드랍 취소) 가능 여부 판별 */
    const [savedDroppedKey, setSavedDroppedKey] = useState(() =>
        serializeDroppedSet(new Set((existingDrops || []).map((d) => normalizeDropIdentifier(d.creator_identifier)).filter(Boolean))),
    );
    const [dropsHydrated, setDropsHydrated] = useState(!user || !isDeliveryTest);

    // delivery_list_sessions: 납품 시각(sent_at) 기준 영업일 마감, 드랍 확정 추적
    const [session, setSession] = useState(null);
    const [sessionLoading, setSessionLoading] = useState(true);
    const [deliverySessionsTableMissing, setDeliverySessionsTableMissing] = useState(false);

    useEffect(() => {
        if (!user || !campaign || !isDeliveryTest) {
            setDropsHydrated(true);
            return;
        }
        setDropsHydrated(false);
        supabase
            .from('creator_drops')
            .select('creator_identifier')
            .eq('reference_type', refType)
            .eq('reference_id', refId)
            .eq('dropped_by_user_id', user.id)
            .then(({ data, error }) => {
                const ids = new Set();
                if (!error && data?.length) {
                    data.forEach((d) => {
                        const id = normalizeDropIdentifier(d.creator_identifier);
                        if (id) ids.add(id);
                    });
                }
                setDroppedIds(ids);
                setSavedDroppedKey(serializeDroppedSet(ids));
                setDropsHydrated(true);
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps -- user.id, campaign.id만 의존 (객체 참조 변경 방지)
    }, [user?.id, campaign?.id, isDeliveryTest, refType, refId]);

    useEffect(() => {
        if (!user || !campaign || !isDeliveryTest) {
            setDeliverySessionsTableMissing(false);
            return;
        }
        setSessionLoading(true);
        supabase
            .from('delivery_list_sessions')
            .select('*')
            .eq('reference_type', refType)
            .eq('reference_id', refId)
            .eq('user_id', user.id)
            .maybeSingle()
            .then(({ data, error }) => {
                if (error) {
                    setDeliverySessionsTableMissing(isMissingDeliverySessionsTableError(error));
                    setSession(null);
                    setSessionLoading(false);
                    return;
                }
                setDeliverySessionsTableMissing(false);
                if (data) {
                    setSession(data);
                    setSessionLoading(false);
                    return;
                }
                supabase
                    .from('delivery_list_sessions')
                    .insert({ reference_type: refType, reference_id: refId, user_id: user.id, sent_at: new Date().toISOString() })
                    .select()
                    .single()
                    .then(({ data: inserted, error: insertErr }) => {
                        if (insertErr) {
                            setDeliverySessionsTableMissing(isMissingDeliverySessionsTableError(insertErr));
                            setSession(null);
                            setSessionLoading(false);
                            return;
                        }
                        setDeliverySessionsTableMissing(false);
                        setSession(inserted || { sent_at: new Date().toISOString() });
                        setSessionLoading(false);
                    })
                    .catch(() => {
                        setSession(null);
                        setSessionLoading(false);
                    });
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps -- user.id·campaign.id만 의존 (객체 참조로 세션 재조회 방지)
    }, [user?.id, campaign?.id, isDeliveryTest, refType, refId]);

    /** 명단에서 빠진 인원에 대한 드랍 체크는 DB에 남아 있어도 UI·카운트에서 제거 (Troubless PDRN 최종 교체 후) */
    useEffect(() => {
        if (!user || !campaign || !isDeliveryTest || !isTroublessPdrnSunscreenCampaign(campaign) || !dropsHydrated) return;
        const validNames = new Set(
            (candidates || []).map((c) => normDeliveryListPersonName(c._identifier || c.name)).filter(Boolean),
        );
        if (validNames.size === 0) return;
        setDroppedIds((prev) => {
            const next = new Set(
                [...prev].filter((id) => validNames.has(normDeliveryListPersonName(normalizeDropIdentifier(id)))),
            );
            if (next.size === prev.size) return prev;
            queueMicrotask(() => setSavedDroppedKey(serializeDroppedSet(next)));
            return next;
        });
    }, [user, campaign, isDeliveryTest, dropsHydrated, candidates]);

    const [saving, setSaving] = useState(false);
    const [confirmingDrop, setConfirmingDrop] = useState(false);
    const [revertingAdminConfirm, setRevertingAdminConfirm] = useState(false);

    const droppedCount = droppedIds.size;
    const canDropMore = droppedCount < maxDropCount;
    const dropLimitReached = droppedCount >= maxDropCount && maxDropCount > 0;
    const currentDroppedKey = useMemo(() => serializeDroppedSet(droppedIds), [droppedIds]);
    const hasPendingDropChanges = dropsHydrated && currentDroppedKey !== savedDroppedKey;

    const sentAt = session?.sent_at ? new Date(session.sent_at) : null;
    const dropConfirmedAt = session?.drop_confirmed_at ? new Date(session.drop_confirmed_at) : null;
    const now = new Date();
    const msPerDay = 24 * 60 * 60 * 1000;
    const dropDeadlineSeoulYmd = sentAt ? getDropDeadlineSeoulYmd(sentAt) : null;
    const dropDeadlineAt = dropDeadlineSeoulYmd ? seoulYmdEndOfBusinessDay(dropDeadlineSeoulYmd) : null;
    const dropWindowExpired = !!(sentAt && dropDeadlineAt && now.getTime() > dropDeadlineAt.getTime());
    const msUntilDropDeadline = dropDeadlineAt ? dropDeadlineAt.getTime() - now.getTime() : null;
    const daysRemaining = msUntilDropDeadline != null ? Math.max(0, msUntilDropDeadline / msPerDay) : null;
    const dropDeadlineLabelKr = dropDeadlineSeoulYmd
      ? `${formatSeoulYmdLongKr(dropDeadlineSeoulYmd)} 23:59까지 (한국시간)`
      : '';
    const dropNearDeadline = !dropWindowExpired && msUntilDropDeadline != null && msUntilDropDeadline > 0 && msUntilDropDeadline <= 24 * 60 * 60 * 1000;
    const dropConfirmed = !!dropConfirmedAt;
    const isHeatherFarmskinView = isHeatherFarmskinScale50Campaign(campaign, user);
    const troublessReplacementUi =
        isTroublessPdrnSunscreenCampaign(campaign) && (candidates || []).some((c) => c.is_new_replacement);
    const canDrop = !isHeatherFarmskinView && !dropConfirmed && !sessionLoading && (!sentAt || !dropWindowExpired);

    const handleDownloadCSV = () => {
        if (isDeliveryTest) {
            const filtered = (candidates || []).filter((c) => !droppedIds.has(normalizeDropIdentifier(c._identifier || c.name)));
            const useSplit = deliveryTableLayout === 'visit_split';
            const headers = useSplit
                ? ['name', 'tiktok_url', 'tiktok_followers', 'instagram_url', 'instagram_followers', 'visit_date']
                : ['name', 'shipping_country', 'instagram_url', 'instagram_followers', 'tiktok_url', 'tiktok_followers'];
            const csv = [
                headers.join(','),
                ...filtered.map((c) => {
                    const channels = c.sns_channels || [];
                    const ig = channels.find((ch) => ch.platform === 'Instagram') || {};
                    const tt = channels.find((ch) => ch.platform === 'TikTok') || {};
                    if (useSplit) {
                        const m = mergeSocialFieldsFromRecord(c);
                        return [
                            c.name,
                            m.tiktok_url || '',
                            m.tiktok_follower ?? '',
                            m.instagram_url || '',
                            m.instagram_follower ?? '',
                            c.visit_date || m.visit_date || '',
                        ]
                            .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`)
                            .join(',');
                    }
                    return [
                        c.name,
                        c.location,
                        ig.url || '',
                        ig.followers || '',
                        tt.url || '',
                        tt.followers || '',
                    ]
                        .map((v) => `"${String(v || '').replace(/"/g, '""')}"`)
                        .join(',');
                }),
            ].join('\n');
            const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            const baseName = String(campaign?.product_name || campaign?.order_number || '납품')
                .replace(/[\\/:*?"<>|]/g, '_')
                .trim()
                .slice(0, 80);
            a.download = `${baseName}-납품리스트.csv`;
            a.click();
            URL.revokeObjectURL(a.href);
        } else {
            alert("납품 리스트가 아직 확정되지 않았습니다. 인플루언서 섭외가 완료되고 확정된 후에 다운로드 가능합니다.");
        }
    };

    const handleDropToggle = (creator) => {
        const id = normalizeDropIdentifier(creator._identifier || creator.name);
        if (!id) return;
        setDroppedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                if (maxDropCount <= 0 || next.size >= maxDropCount) return prev;
                next.add(id);
            }
            return next;
        });
    };

    const handleSaveDrops = async () => {
        if (!user || !campaign) return;
        if (droppedCount > maxDropCount) {
            alert(`드랍은 최대 ${maxDropCount}명(전체의 30%)까지 가능합니다.`);
            return;
        }
        setSaving(true);
        try {
            await supabase.from('creator_drops').delete().eq('reference_type', refType).eq('reference_id', refId).eq('dropped_by_user_id', user.id);
            const toInsert = Array.from(droppedIds).map((identifier) => {
                const name = normalizeDropIdentifier(identifier);
                return {
                    reference_type: refType,
                    reference_id: refId,
                    creator_name: name,
                    creator_identifier: name,
                    dropped_by_user_id: user.id,
                    dropped_by_email: user.email,
                };
            });
            if (toInsert.length > 0) {
                const { error } = await supabase.from('creator_drops').insert(toInsert);
                if (error) throw error;
            }
            setSavedDroppedKey(serializeDroppedSet(droppedIds));
            if (droppedCount === 0) {
                alert('저장되었습니다. 드랍 선택이 모두 해제되어 리스트에 다시 포함된 상태로 반영되었습니다.');
            } else {
                alert(`드랍 ${droppedCount}명이 저장되었습니다. 체크 해제 후 다시 저장하면 드랍을 취소할 수 있습니다. 아래 리스트 확정 버튼으로 최종 전달을 완료해 주세요.`);
            }
        } catch (e) {
            console.error(e);
            alert('드랍 저장 실패: ' + (e?.message || e));
        } finally {
            setSaving(false);
        }
    };

    const handleConfirmDrop = async () => {
        if (!user || !campaign) return;
        if (deliverySessionsTableMissing) {
            alert(
                'Supabase에 delivery_list_sessions 테이블이 없습니다.\n\n' +
                    '프로젝트의 supabase-migration-delivery-list-sessions.sql 파일 전체를\n' +
                    'Supabase 대시보드 → SQL Editor 에서 실행한 뒤 새로고침하세요.\n\n' +
                    '자세한 단계: docs/supabase-setup-ko.md',
            );
            return;
        }
        if (droppedCount > maxDropCount) {
            alert(`드랍은 최대 ${maxDropCount}명(전체의 30%)까지 가능합니다. 현재 ${droppedCount}명이 선택되어 있어 확정할 수 없습니다.`);
            return;
        }
        if (!window.confirm(`리스트를 확정하시겠습니까?\n\n확정 후에는 수정이 불가능합니다. 대체 인원을 선정해 최종 납품 리스트를 제공합니다.`)) return;
        setConfirmingDrop(true);
        try {
            await supabase.from('creator_drops').delete().eq('reference_type', refType).eq('reference_id', refId).eq('dropped_by_user_id', user.id);
            const toInsert = Array.from(droppedIds).map((identifier) => {
                const name = normalizeDropIdentifier(identifier);
                return { reference_type: refType, reference_id: refId, creator_name: name, creator_identifier: name, dropped_by_user_id: user.id, dropped_by_email: user.email };
            });
            if (toInsert.length > 0) {
                const { error: insertErr } = await supabase.from('creator_drops').insert(toInsert);
                if (insertErr) throw insertErr;
            }
            setSavedDroppedKey(serializeDroppedSet(droppedIds));
            const nowIso = new Date().toISOString();
            // id 없이 메모리에만 세션이 있던 경우(초기 insert 실패 등)에도 DB에 반영되도록 키로 갱신
            const { data: updatedSession, error: sessionErr } = await supabase
                .from('delivery_list_sessions')
                .update({ drop_confirmed_at: nowIso, status: 'drop_confirmed', updated_at: nowIso })
                .eq('reference_type', refType)
                .eq('reference_id', refId)
                .eq('user_id', user.id)
                .select()
                .maybeSingle();
            if (sessionErr) throw sessionErr;
            if (updatedSession) {
                setSession(updatedSession);
            } else {
                const sentAt = session?.sent_at || nowIso;
                const { data: insertedSession, error: insErr } = await supabase
                    .from('delivery_list_sessions')
                    .insert({
                        reference_type: refType,
                        reference_id: refId,
                        user_id: user.id,
                        sent_at: sentAt,
                        drop_confirmed_at: nowIso,
                        status: 'drop_confirmed',
                        updated_at: nowIso,
                    })
                    .select()
                    .single();
                if (insErr) throw insErr;
                setSession(insertedSession);
            }
            alert('리스트가 확정되었습니다. 대체 인원 선정 후 최종 납품 리스트(배송정보 포함)를 제공합니다.');
        } catch (e) {
            console.error(e);
            alert('리스트 확정 실패: ' + (e?.message || e));
        } finally {
            setConfirmingDrop(false);
        }
    };

    const handleAdminRevertConfirm = async () => {
        if (!allowAdminUnconfirm || !user || !campaign) return;
        if (deliverySessionsTableMissing) {
            alert('delivery_list_sessions 테이블을 먼저 생성해 주세요. (docs/supabase-setup-ko.md)');
            return;
        }
        if (
            !window.confirm(
                '[관리자] 리스트 확정을 취소할까요?\n\n' +
                    '· 고객 화면에서는 보이지 않는 기능입니다.\n' +
                    '· 확정 취소 후 드랍 선택을 다시 수정·저장·재확정할 수 있습니다.\n' +
                    '· creator_drops(드랍 명단)는 그대로 두며, 필요 시 직접 수정하세요.',
            )
        ) {
            return;
        }
        setRevertingAdminConfirm(true);
        try {
            const nowIso = new Date().toISOString();
            const { data: reverted, error } = await supabase
                .from('delivery_list_sessions')
                .update({ drop_confirmed_at: null, status: 'sent', updated_at: nowIso })
                .eq('reference_type', refType)
                .eq('reference_id', refId)
                .eq('user_id', user.id)
                .select()
                .maybeSingle();
            if (error) throw error;
            if (reverted) {
                setSession(reverted);
            } else {
                setSession((prev) =>
                    prev
                        ? { ...prev, drop_confirmed_at: null, status: 'sent', updated_at: nowIso }
                        : { sent_at: nowIso, drop_confirmed_at: null, status: 'sent' },
                );
            }
            alert('확정이 취소되었습니다. 드랍을 수정한 뒤 다시 저장·확정할 수 있습니다.');
        } catch (e) {
            console.error(e);
            alert('확정 취소 실패: ' + (e?.message || e));
        } finally {
            setRevertingAdminConfirm(false);
        }
    };

    const handleDeleteCreator = (e, creatorName) => {
        e.stopPropagation();
        if (window.confirm(`[인플루언서 교체 안내]\n\n${creatorName} 님을 정말 교체하시겠습니까?\n\n* 섭외 중 단계에서는 제공된 리스트의 30%까지만 교체/삭제가 가능합니다.`)) {
             alert("교체 요청이 접수되었습니다. (데모)");
        }
    };

    const allCandidates = useMemo(() => candidates || [], [candidates]);
    const isDeliveryTestView = isDeliveryTest;
    const useVisitSplitLayout = isDeliveryTestView && deliveryTableLayout === 'visit_split';
    const deliveryTestTableColSpan = 5;
    const deliveryTestConfirmedColSpan = 4;

    // 정렬: 이름 ABC순 | 팔로워 수 | 신규 교체 우선
    const [sortBy, setSortBy] = useState('name'); // 'name' | 'followers' | 'new_first'
    const [sortOrder, setSortOrder] = useState('asc'); // 'asc' | 'desc'
    const sortedCandidates = useMemo(() => {
        const arr = [...allCandidates];
        arr.sort((a, b) => {
            if (sortBy === 'new_first') {
                const pa = a.is_new_replacement ? 0 : 1;
                const pb = b.is_new_replacement ? 0 : 1;
                if (pa !== pb) return pa - pb;
                const na = (a.name || '').toLowerCase();
                const nb = (b.name || '').toLowerCase();
                const cmp = na.localeCompare(nb);
                return sortOrder === 'asc' ? cmp : -cmp;
            }
            if (sortBy === 'name') {
                const na = (a.name || '').toLowerCase();
                const nb = (b.name || '').toLowerCase();
                const cmp = na.localeCompare(nb);
                return sortOrder === 'asc' ? cmp : -cmp;
            }
            const maxFollower = (c) => {
                const chs = c.sns_channels || [];
                if (chs.length === 0) return parseFollower(c.followers);
                return Math.max(...chs.map((ch) => parseFollower(ch.followers)), parseFollower(c.followers));
            };
            const fa = maxFollower(a);
            const fb = maxFollower(b);
            return sortOrder === 'asc' ? fa - fb : fb - fa;
        });
        return arr;
    }, [allCandidates, sortBy, sortOrder]);

    const confirmedList = useMemo(() => {
        const kept = (c) => !droppedIds.has(normalizeDropIdentifier(c._identifier || c.name));
        return sortedCandidates.filter(kept);
    }, [sortedCandidates, droppedIds]);

    const droppedList = useMemo(() => {
        const dropped = (c) => droppedIds.has(normalizeDropIdentifier(c._identifier || c.name));
        return sortedCandidates.filter(dropped);
    }, [sortedCandidates, droppedIds]);

    const [deliveryListTab, setDeliveryListTab] = useState('all');
    const tabFilteredCandidates = useMemo(() => {
        if (!isDeliveryTestView || deliveryListTab === 'all') return sortedCandidates;
        const isDroppedRow = (c) => droppedIds.has(normalizeDropIdentifier(c._identifier || c.name));
        if (deliveryListTab === 'dropped') return sortedCandidates.filter(isDroppedRow);
        return sortedCandidates.filter((c) => !isDroppedRow(c));
    }, [sortedCandidates, deliveryListTab, droppedIds, isDeliveryTestView]);

    // 페이지네이션: 10명/페이지
    const PAGE_SIZE = 10;
    const totalPages = Math.max(1, Math.ceil(tabFilteredCandidates.length / PAGE_SIZE));
    const [currentPage, setCurrentPage] = useState(1);
    const displayCandidates = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE;
        return tabFilteredCandidates.slice(start, start + PAGE_SIZE);
    }, [tabFilteredCandidates, currentPage]);

    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) setCurrentPage(totalPages);
    }, [currentPage, totalPages]);

    useEffect(() => {
        setCurrentPage(1);
    }, [deliveryListTab, sortBy, sortOrder]);

    const renderDeliveryNameCell = (creator) => (
        <td className="px-8 py-6">
            <div className="flex items-center gap-4 flex-wrap">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-black text-sm shadow-lg shrink-0">
                    {creator.name?.charAt(0) || '-'}
                </div>
                <div className="flex flex-col gap-1.5 min-w-0">
                    <p className="font-bold text-white text-base tracking-tight">{creator.name}</p>
                    {creator.is_new_replacement ? (
                        <span className="inline-flex w-fit items-center px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-emerald-500/25 text-emerald-200 border border-emerald-400/40">
                            신규 교체 · 브랜드 합류
                        </span>
                    ) : null}
                </div>
            </div>
        </td>
    );

    const renderDeliveryDataCells = (creator) => {
        if (useVisitSplitLayout) {
            const m = mergeSocialFieldsFromRecord(creator);
            const channels = buildSnsChannelsFromRow(m);
            const visitLabel = creator.visit_date || m.visit_date || '-';
            return (
                <>
                    {renderDeliveryNameCell(creator)}
                    <td className="px-8 py-6 align-top">
                        <div className="flex flex-col gap-2">
                            {channels.length === 0 ? (
                                <span className="text-slate-500">-</span>
                            ) : (
                                channels.map((ch, chIdx) => (
                                    ch.url && ch.url !== '-' ? (
                                        <a
                                            key={`${ch.platform}-visit-${chIdx}`}
                                            href={ensureAbsoluteUrl(ch.url)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-cyan-400 hover:text-cyan-300 text-sm flex items-center gap-1.5"
                                        >
                                            <ExternalLink size={12} className="shrink-0" />
                                            <span>{ch.platform} 링크</span>
                                        </a>
                                    ) : (
                                        <span key={`${ch.platform}-visit-${chIdx}`} className="text-slate-400 text-sm">
                                            {ch.platform}
                                        </span>
                                    )
                                ))
                            )}
                        </div>
                    </td>
                    <td className="px-8 py-6 align-top">
                        <div className="flex flex-col gap-1">
                            {channels.length === 0 ? (
                                <span className="text-slate-500 text-[10px]">-</span>
                            ) : (
                                channels.map((ch, chIdx) => (
                                    <span key={`${ch.platform}-visit-f-${chIdx}`} className="text-[10px] text-slate-400 font-black tracking-widest">
                                        {ch.platform}: {ch.followers || '0'}
                                    </span>
                                ))
                            )}
                        </div>
                    </td>
                    <td className="px-8 py-6 text-slate-300 align-top whitespace-nowrap">{visitLabel}</td>
                </>
            );
        }
        return (
            <>
                {renderDeliveryNameCell(creator)}
                <td className="px-8 py-6 text-slate-300">{creator.location || '-'}</td>
                <td className="px-8 py-6">
                    <div className="flex flex-col gap-2">
                        {(creator.sns_channels || [{ platform: creator.platform, url: creator.handle, followers: creator.followers }]).map((ch, chIdx) => (
                            ch.url && ch.url !== '-' ? (
                                <a
                                    key={`${ch.platform}-${chIdx}`}
                                    href={ensureAbsoluteUrl(ch.url)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-cyan-400 hover:text-cyan-300 text-sm flex items-center gap-1.5"
                                >
                                    <ExternalLink size={12} className="shrink-0" />
                                    <span>{ch.platform}</span>
                                    <span className="text-slate-500 text-[10px]">({ch.followers})</span>
                                </a>
                            ) : (
                                <span key={`${ch.platform}-${chIdx}`} className="text-slate-400 text-sm">
                                    {ch.platform}
                                    {ch.followers && String(ch.followers) !== '0' ? (
                                        <span className="text-slate-500 text-[10px] ml-1.5">({ch.followers})</span>
                                    ) : null}
                                </span>
                            )
                        ))}
                        {(!creator.sns_channels || creator.sns_channels.length === 0) && !creator.handle && (
                            <span className="text-slate-500">-</span>
                        )}
                    </div>
                </td>
                <td className="px-8 py-6">
                    <div className="flex flex-col gap-1">
                        {(creator.sns_channels || [{ platform: creator.platform, followers: creator.followers }]).map((ch, chIdx) => (
                            <span key={`${ch.platform}-f-${chIdx}`} className="text-[10px] text-slate-400 font-black tracking-widest">
                                {ch.platform}: {ch.followers}
                            </span>
                        ))}
                    </div>
                </td>
            </>
        );
    };

    return (
        <div className="space-y-10 animate-fade-in-up">
            <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[100px] rounded-full"></div>
                <div className="flex justify-between items-end mb-6 relative z-10">
                    <div>
                        <h4 className="font-black text-white text-2xl tracking-tighter">{isDeliveryTestView ? '납품 리스트' : '섭외 진행 현황'}</h4>
                        <p className="text-sm text-slate-500 mt-2 font-light tracking-tight">
                            {isDeliveryTestView
                                ? (dropConfirmed
                                    ? `리스트 확정 완료 · 확정 ${confirmedList.length}명 · 드랍 ${droppedList.length}명`
                                    : (isHeatherFarmskinView
                                        ? '드랍 및 교체가 완료되었습니다. 최종 리스트를 확인하신 뒤 리스트 확정을 진행해 주세요.'
                                        : `인플루언서 리스트 · 드랍 ${droppedCount}/${maxDropCount}명 (전체 ${listTotal}명의 30%)${sentAt && dropDeadlineLabelKr ? ` · 마감 ${dropDeadlineLabelKr}${daysRemaining != null && !dropWindowExpired ? ` · 약 ${Math.max(0, Math.ceil(daysRemaining))}일 남음` : ''}` : ''}`))
                                : '목표 인원 달성 시 자동으로 제품 배송 단계로 전환됩니다.'}
                        </p>
                        {isDeliveryTestView && !isHeatherFarmskinView && !dropConfirmed && canDrop && dropLimitReached && (
                            <p className="text-xs text-amber-400/95 mt-3 font-medium leading-relaxed max-w-xl">
                                드랍은 전체 {listTotal}명 중 최대 <strong className="text-amber-300">30%({maxDropCount}명)</strong>까지만 선택할 수 있습니다.
                                더 추가하려면 먼저 일부 인원의 드랍 체크를 해제한 뒤, 상단의 <strong className="text-amber-200/90">「드랍 현황 저장」</strong>으로 반영하세요.
                            </p>
                        )}
                    </div>
                    <div className="text-right">
                        <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 tracking-tighter">{progress}%</span>
                        <p className="text-xs text-slate-500 font-black mt-1 uppercase tracking-widest">({matchedCount}/{targetCount})</p>
                    </div>
                </div>
                <div className="w-full bg-white/5 h-4 rounded-full overflow-hidden border border-white/5 relative z-10">
                    <div 
                        className="h-full bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-400 transition-all duration-1000 ease-out rounded-full relative shadow-[0_0_15px_rgba(34,211,238,0.5)]"
                        style={{ width: `${progress}%` }}
                    >
                        <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
                    </div>
                </div>
            </div>

            {isDeliveryTestView && deliverySessionsTableMissing && (
                <div className="bg-red-500/10 border border-red-500/35 rounded-2xl p-6 relative z-10">
                    <div className="flex gap-3">
                        <AlertTriangle size={22} className="text-red-400 shrink-0 mt-0.5" />
                        <div className="space-y-2 text-sm">
                            <p className="font-bold text-red-200/90">Supabase 테이블이 없습니다</p>
                            <p className="text-slate-400 leading-relaxed">
                                <code className="text-xs bg-white/10 px-1.5 py-0.5 rounded">delivery_list_sessions</code> 테이블이 프로젝트에 생성되지 않았습니다.
                                저장소의 <strong className="text-slate-300">supabase-migration-delivery-list-sessions.sql</strong> 전체를 복사해
                                Supabase 대시보드 → <strong className="text-slate-300">SQL Editor</strong>에서 실행한 뒤 페이지를 새로고침하세요.
                            </p>
                            <p className="text-xs text-slate-500">단계별 안내: 저장소 <code className="text-slate-400">docs/supabase-setup-ko.md</code></p>
                        </div>
                    </div>
                </div>
            )}

            {isDeliveryTestView && (
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6 relative z-10">
                    <div className="flex gap-3">
                        <Info size={22} className="text-amber-400 shrink-0 mt-0.5" />
                        <div className="space-y-2 text-sm">
                            {isHeatherFarmskinView ? (
                                <>
                                    <p className="font-bold text-amber-200/90">리스트 업데이트 안내</p>
                                    <p className="text-slate-400 leading-relaxed">
                                        고객사 요청에 따른 드랍 및 교체 작업이 완료되어 <strong className="text-slate-300">최신 리스트로 반영</strong>되었습니다.
                                    </p>
                                    <ul className="text-slate-500 text-xs space-y-1 mt-3">
                                        <li>· 현재 리스트를 검토하신 뒤 하단의 <strong className="text-amber-400/90">「리스트 확정」</strong> 버튼을 눌러 최종 확정해 주세요.</li>
                                        <li>· 본 캠페인은 드랍 단계가 종료되어 <strong className="text-amber-400/90">추가 드랍은 불가</strong>합니다.</li>
                                        {troublessReplacementUi ? (
                                            <li>
                                                ·{' '}
                                                <strong className="text-emerald-400/90">「신규 교체 · 브랜드 합류」</strong> 표시는 브랜드사 드랍 후 새로 합류한
                                                인플루언서입니다. 정렬에서 <strong className="text-slate-300">신규 교체 우선</strong>을 선택하면 목록 상단에 모을 수
                                                있습니다.
                                            </li>
                                        ) : null}
                                    </ul>
                                </>
                            ) : (
                                <>
                                    <p className="font-bold text-amber-200/90">드랍이란?</p>
                                    <p className="text-slate-400 leading-relaxed">
                                        제공된 인플루언서 중 마음에 들지 않는 분이 있으시면 <strong className="text-slate-300">다른 인원으로 교체해 주세요</strong>라고 요청하는 기능입니다.
                                        리스트 확정 후 대체 인원을 선정해 최종 납품 리스트(배송정보 포함)를 제공합니다.
                                    </p>
                                    <ul className="text-slate-500 text-xs space-y-1 mt-3">
                                        <li>
                                            · 인플루언서 리스트가 <strong className="text-amber-400/90">납품된 날의 다음 날부터</strong> 세어{' '}
                                            <strong className="text-amber-400/90">영업일 {DROP_DEADLINE_BUSINESS_DAYS}일째</strong>가 속한 날{' '}
                                            <strong className="text-amber-400/90">23:59(한국시간)</strong>까지 드랍·수정 가능합니다.{' '}
                                            <span className="text-slate-600">(토·일·대한민국 공휴일 제외)</span>
                                        </li>
                                        <li>· 드랍 가능 인원: 전체의 <strong className="text-amber-400/90">30%</strong> (50명 제공 시 15명까지)</li>
                                        <li>· 상한에 도달하면 추가 체크는 불가합니다. 드랍을 줄인 뒤 <strong className="text-amber-400/90">「드랍 현황 저장」</strong>으로 서버에 반영할 수 있습니다.</li>
                                        <li>· 이미 드랍한 인원은 체크 해제 후 저장하면 <strong className="text-amber-400/90">드랍 취소</strong>되어 다시 리스트에 포함됩니다.</li>
                                        <li>
                                            · 위 마감 시각까지 리스트 확정을 하지 않으면 <strong className="text-amber-400/90">자동으로 확정</strong>되는 것으로 처리될 수 있습니다.
                                        </li>
                                    </ul>
                                    {sentAt && dropDeadlineLabelKr && !dropWindowExpired && !dropConfirmed && (
                                        <p className="text-slate-500 text-xs mt-2">
                                            <strong className="text-slate-400">이번 리스트 마감:</strong> {dropDeadlineLabelKr}
                                        </p>
                                    )}
                                    {dropNearDeadline && sentAt && !dropConfirmed && (
                                        <p className="text-red-300 font-bold text-xs mt-2 flex items-center gap-2">
                                            <AlertTriangle size={14} /> 드랍 마감이 24시간 이내입니다. 서울 기준 마감 전까지 저장·확정해 주세요.
                                        </p>
                                    )}
                                    {dropWindowExpired && sentAt && (
                                        <p className="text-amber-400 font-bold text-xs mt-2 flex items-center gap-2">
                                            <AlertTriangle size={14} /> 드랍 기한이 지났습니다. 추가 교체는 문의해 주세요.
                                        </p>
                                    )}
                                    {dropConfirmed && (
                                        <p className="text-emerald-400 font-bold text-xs mt-2 flex items-center gap-2">
                                            <CheckCircle2 size={14} /> 리스트가 확정되었습니다. 대체 인원 선정 후 최종 리스트를 제공합니다.
                                        </p>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {isDeliveryTestView && dropConfirmed ? (
                <div className="space-y-8">
                    <div className="bg-white/5 backdrop-blur-md rounded-[2.5rem] border border-emerald-500/30 overflow-hidden shadow-2xl">
                        <div className="px-8 py-6 border-b border-white/5 flex flex-wrap justify-between items-center gap-4 bg-emerald-500/10">
                            <div>
                                <h3 className="font-black text-white flex flex-wrap items-center gap-3 tracking-tighter">
                                    <CheckCircle2 size={22} className="text-emerald-400 shrink-0" />
                                    확정 리스트
                                    <span className="text-cyan-400">({confirmedList.length}명)</span>
                                </h3>
                                <p className="text-xs text-slate-500 mt-2 font-medium">드랍 인원을 제외한 최종 확정 명단입니다.</p>
                            </div>
                            <button
                                type="button"
                                onClick={handleDownloadCSV}
                                className="text-[10px] font-black tracking-widest uppercase px-4 py-2 bg-white/10 border border-white/15 rounded-xl hover:bg-white/15 text-slate-200 transition-all flex items-center gap-2 shrink-0"
                            >
                                <Download size={14} /> 확정 리스트 CSV
                            </button>
                        </div>
                        <div className="overflow-x-auto max-h-[min(70vh,880px)] overflow-y-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-white/5 text-slate-500 font-black uppercase tracking-widest text-[10px] border-b border-white/5 sticky top-0 z-10 backdrop-blur-md">
                                    <tr>
                                        <th className="px-8 py-5">이름</th>
                                        {useVisitSplitLayout ? (
                                            <>
                                                <th className="px-8 py-5">SNS 주소</th>
                                                <th className="px-8 py-5">팔로워 수</th>
                                                <th className="px-8 py-5">Visit date</th>
                                            </>
                                        ) : (
                                            <>
                                                <th className="px-8 py-5">국가</th>
                                                <th className="px-8 py-5">SNS 주소</th>
                                                <th className="px-8 py-5">팔로워 수</th>
                                            </>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {confirmedList.length === 0 ? (
                                        <tr>
                                            <td colSpan={deliveryTestConfirmedColSpan} className="px-8 py-16 text-center text-slate-500 text-sm font-medium">
                                                확정 리스트에 포함된 인원이 없습니다.
                                            </td>
                                        </tr>
                                    ) : (
                                        confirmedList.map((creator) => {
                                            const identifier = normalizeDropIdentifier(creator._identifier || creator.name);
                                            return (
                                                <tr
                                                    key={`conf-${creator.id}-${identifier}`}
                                                    className={`hover:bg-white/5 transition-colors group ${creator.is_new_replacement ? 'bg-emerald-500/[0.06]' : ''}`}
                                                >
                                                    {renderDeliveryDataCells(creator)}
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="bg-red-500/5 backdrop-blur-md rounded-[2.5rem] border border-red-500/30 overflow-hidden shadow-2xl">
                        <div className="px-8 py-6 border-b border-red-500/15 bg-red-500/10">
                            <h3 className="font-black text-white flex flex-wrap items-center gap-3 tracking-tighter">
                                <UserX size={22} className="text-red-400 shrink-0" />
                                드랍 인원
                                <span className="text-red-300/90">({droppedList.length}명)</span>
                            </h3>
                            <p className="text-xs text-slate-500 mt-2 font-medium">확정 시점에 교체 요청하신 인플루언서입니다.</p>
                        </div>
                        <div className="overflow-x-auto max-h-[min(50vh,560px)] overflow-y-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-white/5 text-slate-500 font-black uppercase tracking-widest text-[10px] border-b border-white/5 sticky top-0 z-10 backdrop-blur-md">
                                    <tr>
                                        <th className="px-8 py-5">이름</th>
                                        {useVisitSplitLayout ? (
                                            <>
                                                <th className="px-8 py-5">SNS 주소</th>
                                                <th className="px-8 py-5">팔로워 수</th>
                                                <th className="px-8 py-5">Visit date</th>
                                            </>
                                        ) : (
                                            <>
                                                <th className="px-8 py-5">국가</th>
                                                <th className="px-8 py-5">SNS 주소</th>
                                                <th className="px-8 py-5">팔로워 수</th>
                                            </>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {droppedList.length === 0 ? (
                                        <tr>
                                            <td colSpan={deliveryTestConfirmedColSpan} className="px-8 py-12 text-center text-slate-500 text-sm font-medium">
                                                드랍한 인원이 없습니다.
                                            </td>
                                        </tr>
                                    ) : (
                                        droppedList.map((creator) => {
                                            const identifier = normalizeDropIdentifier(creator._identifier || creator.name);
                                            return (
                                                <tr key={`drop-${creator.id}-${identifier}`} className="hover:bg-red-500/10 transition-colors bg-red-500/[0.06]">
                                                    {renderDeliveryDataCells(creator)}
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {allowAdminUnconfirm && (
                        <div className="rounded-2xl border border-amber-500/35 bg-amber-500/10 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="flex gap-3">
                                <ShieldCheck size={22} className="text-amber-400 shrink-0 mt-0.5" />
                                <div className="text-sm">
                                    <p className="font-black text-amber-200/95 tracking-tight">관리자 전용 · 확정 되돌리기</p>
                                    <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">
                                        일반 계정에는 노출되지 않습니다. 납품 테스트·미리보기에서만 확정 이전 상태로 돌아가 드랍을 다시 조정할 수 있습니다.
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleAdminRevertConfirm}
                                disabled={revertingAdminConfirm || deliverySessionsTableMissing}
                                className="shrink-0 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest bg-amber-600/90 hover:bg-amber-500 text-white border border-amber-400/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                <RotateCcw size={16} className={revertingAdminConfirm ? 'animate-spin' : ''} />
                                {revertingAdminConfirm ? '처리 중...' : '확정 취소 (관리자)'}
                            </button>
                        </div>
                    )}
                </div>
            ) : (
            <div className="bg-white/5 backdrop-blur-md rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl">
                <div className="px-8 py-6 border-b border-white/5 flex flex-wrap justify-between items-center gap-4 bg-white/5">
                    <div className="flex items-center gap-4 flex-wrap">
                        <h3 className="font-black text-white flex items-center gap-3 tracking-tighter">
                            <UserCheck size={20} className="text-cyan-400"/> {isDeliveryTestView ? `인플루언서 리스트 (${tabFilteredCandidates.length}${deliveryListTab !== 'all' ? ` / 전체 ${allCandidates.length}` : ''}명)` : '리스트 (Real-time)'}
                        </h3>
                        {isDeliveryTestView && allCandidates.length > 0 && (
                            <>
                                <div className="flex rounded-lg border border-white/10 overflow-hidden bg-white/5">
                                    {[
                                        { id: 'all', label: '전체' },
                                        { id: 'dropped', label: '드랍만' },
                                    ].map((tab) => (
                                        <button
                                            key={tab.id}
                                            type="button"
                                            onClick={() => setDeliveryListTab(tab.id)}
                                            className={`px-3 py-2 text-[10px] font-black uppercase tracking-wider transition-colors ${
                                                deliveryListTab === tab.id
                                                    ? 'bg-cyan-500/25 text-cyan-300'
                                                    : 'text-slate-500 hover:text-slate-300'
                                            }`}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>
                                <select
                                    value={`${sortBy}-${sortOrder}`}
                                    onChange={(e) => {
                                        const v = e.target.value;
                                        if (v.startsWith('new_first-')) {
                                            setSortBy('new_first');
                                            setSortOrder(v.endsWith('-desc') ? 'desc' : 'asc');
                                        } else {
                                            const [s, o] = v.split('-');
                                            setSortBy(s);
                                            setSortOrder(o);
                                        }
                                        setCurrentPage(1);
                                    }}
                                    className="text-xs font-bold bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-slate-300 focus:ring-cyan-500/50 focus:border-cyan-500/50"
                                >
                                    <option value="name-asc">이름 A→Z</option>
                                    <option value="name-desc">이름 Z→A</option>
                                    <option value="followers-asc">팔로워 ↑</option>
                                    <option value="followers-desc">팔로워 ↓</option>
                                    {allCandidates.some((c) => c.is_new_replacement) ? (
                                        <>
                                            <option value="new_first-asc">신규 교체 우선 (이름 A→Z)</option>
                                            <option value="new_first-desc">신규 교체 우선 (이름 Z→A)</option>
                                        </>
                                    ) : null}
                                </select>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                        disabled={currentPage <= 1}
                                        className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 transition-all"
                                        title="이전 페이지"
                                    >
                                        <ChevronLeft size={18} />
                                    </button>
                                    <span className="text-xs font-bold text-slate-400 min-w-[80px] text-center">
                                        {currentPage} / {totalPages}
                                    </span>
                                    <button
                                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                        disabled={currentPage >= totalPages}
                                        className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 transition-all"
                                        title="다음 페이지"
                                    >
                                        <ChevronRight size={18} />
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                        {isDeliveryTestView && user && (
                            <button
                                type="button"
                                onClick={handleSaveDrops}
                                disabled={saving || !dropsHydrated || !hasPendingDropChanges || !canDrop || dropConfirmed}
                                className="text-[10px] font-black tracking-widest uppercase px-4 py-2 bg-amber-500/20 border border-amber-500/30 rounded-xl hover:bg-amber-500/30 text-amber-400 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                title={
                                    !dropsHydrated
                                        ? '서버에서 드랍 목록을 불러오는 중입니다.'
                                        : !hasPendingDropChanges
                                          ? '변경된 드랍 선택이 없습니다. 체크를 바꾼 뒤 저장하세요. (체크 해제 후 저장 시 드랍 취소도 반영됩니다.)'
                                          : '현재 체크 상태를 서버에 저장합니다. 추가·해제 모두 반영됩니다.'
                                }
                            >
                                {saving ? '저장 중...' : `드랍 현황 저장 (${droppedCount}명)`}
                            </button>
                        )}
                        <button 
                            onClick={handleDownloadCSV}
                            className="text-[10px] font-black tracking-widest uppercase px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 text-slate-300 transition-all flex items-center gap-2"
                        >
                            <Download size={14}/> CSV Export
                        </button>
                    </div>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-white/5 text-slate-500 font-black uppercase tracking-widest text-[10px] border-b border-white/5">
                            <tr>
                                <th className="px-8 py-5">이름</th>
                                {isDeliveryTestView && useVisitSplitLayout ? (
                                    <>
                                        <th className="px-8 py-5">SNS 주소</th>
                                        <th className="px-8 py-5">팔로워 수</th>
                                        <th className="px-8 py-5">Visit date</th>
                                        <th className="px-8 py-5 min-w-[4rem] text-right whitespace-nowrap">드랍</th>
                                    </>
                                ) : (
                                    <>
                                        <th className="px-8 py-5">국가</th>
                                        <th className="px-8 py-5">SNS 주소</th>
                                        <th className="px-8 py-5">팔로워 수</th>
                                        {isDeliveryTestView && (
                                            <th className="px-8 py-5 min-w-[4rem] text-right whitespace-nowrap">드랍</th>
                                        )}
                                        {!isDeliveryTestView && (
                                            <>
                                                <th className="px-8 py-5">상세정보(Masked)</th>
                                                <th className="px-8 py-5">프로세스</th>
                                                <th className="px-8 py-5 text-right">매니지먼트</th>
                                            </>
                                        )}
                                    </>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {isDeliveryTestView && (
                                <tr className="bg-amber-500/[0.06] border-b border-amber-500/15">
                                    <td colSpan={deliveryTestTableColSpan} className="px-8 py-3 text-[11px] text-slate-400 leading-relaxed">
                                        <span className="font-black text-amber-400/95 uppercase tracking-wider text-[10px] mr-2">안내</span>
                                        {isHeatherFarmskinView ? (
                                            <span className="block">
                                                드랍 및 교체가 완료된 최신 리스트입니다. 검토 후 <strong className="text-amber-200/90">리스트 확정</strong>을 진행해 주세요.
                                                본 캠페인은 추가 드랍이 종료된 상태입니다.
                                            </span>
                                        ) : (
                                            <>
                                                <span className="block">
                                                    드랍은 납품일(한국 날짜) 다음 날부터 세는 영업일 {DROP_DEADLINE_BUSINESS_DAYS}일이 끝나는 날{' '}
                                                    <strong className="text-amber-200/90">23:59 한국시간</strong>까지 가능합니다.
                                                </span>
                                                <span className="block mt-1.5">
                                                    토·일·공휴일은 영업일에서 제외됩니다.
                                                    {sentAt && dropDeadlineLabelKr ? (
                                                        <>
                                                            {' '}
                                                            <strong className="text-slate-300">이번 마감:</strong> {dropDeadlineLabelKr}
                                                            {dropNearDeadline ? (
                                                                <span className="text-red-300 font-bold"> · 24시간 이내 마감</span>
                                                            ) : null}
                                                            {dropWindowExpired ? (
                                                                <span className="text-red-400/95 font-bold"> · 현재 기한이 지난 상태입니다.</span>
                                                            ) : null}
                                                        </>
                                                    ) : null}
                                                </span>
                                                {troublessReplacementUi ? (
                                                    <span className="block mt-2 text-emerald-400/90">
                                                        <strong className="text-emerald-300/95">신규 교체</strong> 행은 브랜드사 드랍 후 새로 합류한 인플루언서입니다. 정렬에서{' '}
                                                        <strong className="text-slate-200">신규 교체 우선</strong>을 선택하면 상단에 모아 볼 수 있습니다.
                                                    </span>
                                                ) : null}
                                            </>
                                        )}
                                    </td>
                                </tr>
                            )}
                            {displayCandidates.length === 0 && isDeliveryTestView ? (
                                <tr>
                                    <td colSpan={deliveryTestTableColSpan} className="px-8 py-16 text-center text-slate-500 text-sm font-medium">
                                        {deliveryListTab === 'dropped' ? '드랍한 인플루언서가 없습니다.' : '표시할 인플루언서가 없습니다.'}
                                    </td>
                                </tr>
                            ) : null}
                            {displayCandidates.map((creator) => {
                                const identifier = normalizeDropIdentifier(creator._identifier || creator.name);
                                const isDropped = droppedIds.has(identifier);
                                return (
                                    <tr
                                        key={`${creator.id}-${identifier}`}
                                        className={`hover:bg-white/5 transition-all group ${isDropped ? 'opacity-50 bg-red-500/5' : ''} ${creator.is_new_replacement && !isDropped ? 'bg-emerald-500/[0.06]' : ''}`}
                                    >
                                        {isDeliveryTestView ? (
                                            <>
                                                {renderDeliveryDataCells(creator)}
                                                <td className="px-8 py-6 text-right min-w-[4rem]">
                                                    <label
                                                        className={`inline-flex items-center gap-2 justify-end whitespace-nowrap ${canDrop ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
                                                        title={
                                                            !canDrop
                                                                ? (dropConfirmed
                                                                    ? '리스트가 확정되어 드랍을 변경할 수 없습니다.'
                                                                    : (isHeatherFarmskinView
                                                                        ? '본 캠페인은 드랍 단계가 종료되어 추가 드랍이 불가능합니다. 최종 리스트 확정을 진행해 주세요.'
                                                                        : '영업일 기준 드랍 마감 시각이 지났습니다.'))
                                                                : (!isDropped && !canDropMore
                                                                    ? `드랍은 최대 ${maxDropCount}명(전체 ${listTotal}명의 30%)까지 가능합니다. 다른 인원의 드랍을 해제한 뒤 저장하면 다시 선택할 수 있습니다.`
                                                                    : dropDeadlineLabelKr
                                                                      ? `마감: ${dropDeadlineLabelKr} (영업일·한국시간 기준)`
                                                                      : undefined)
                                                        }
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={isDropped}
                                                            onChange={() => handleDropToggle(creator)}
                                                            disabled={!canDrop || (!isDropped && !canDropMore)}
                                                            className="w-4 h-4 rounded border-white/30 bg-white/5 text-amber-500 focus:ring-amber-500/50 shrink-0 disabled:cursor-not-allowed"
                                                        />
                                                        <span className="text-[10px] text-slate-500">드랍</span>
                                                    </label>
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td className="px-8 py-6">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="font-bold text-slate-300 uppercase tracking-tighter">{creator.platform}</span>
                                                        <span className="text-[10px] text-slate-500 font-black tracking-widest">{creator.followers} FOLLOWERS</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex flex-col gap-1.5">
                                                        <span className="text-slate-400 text-xs font-light">{maskData(creator.location, 'general')}</span>
                                                        <span className="text-slate-600 text-[10px] font-medium">{maskData(creator.contact, 'email')}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                                        creator.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(52,211,153,0.2)]' :
                                                        creator.status === 'Rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                        'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                                    }`}>
                                                        {creator.status === 'Approved' ? '섭외완료' : creator.status === 'Rejected' ? '거절됨' : '검토중'}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <button 
                                                        className="text-slate-500 hover:text-cyan-400 p-2.5 rounded-xl hover:bg-white/5 transition-all opacity-0 group-hover:opacity-100 shadow-xl"
                                                        title="다른 인플루언서로 교체 요청"
                                                        onClick={(e) => handleDeleteCreator(e, creator.name)}
                                                    >
                                                        <RefreshCw size={18} />
                                                    </button>
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
            )}

            {isDeliveryTestView && user && !dropConfirmed && (
                <div className="flex flex-col items-center gap-6 py-10 relative z-10">
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl px-8 py-6 max-w-xl text-center">
                        <p className="text-amber-200/90 font-bold text-sm mb-2">⚠️ 리스트 확정 전 확인</p>
                        <div className="text-slate-400 text-sm leading-relaxed space-y-2">
                            <p>
                                리스트 확정 후에는 <strong className="text-amber-400/90">드랍 선택을 수정할 수 없습니다</strong>.
                            </p>
                            {isHeatherFarmskinView ? (
                                <p>
                                    드랍 및 교체는 이미 반영 완료되었습니다. 이제 <strong className="text-amber-400/90">리스트 확정</strong>만 진행해 주세요.
                                </p>
                            ) : (
                                <p>
                                    드랍을 바꾼 뒤에는 반드시 <strong className="text-amber-400/90">「드랍 현황 저장」</strong>을 눌러 서버에 반영해 주세요. 체크 해제 후 저장하면 드랍이 취소됩니다.
                                </p>
                            )}
                            {!isHeatherFarmskinView && sentAt && dropDeadlineLabelKr && (
                                <p className="text-slate-500 text-xs">
                                    드랍·수정 마감(영업일·한국시간): <strong className="text-amber-200/90">{dropDeadlineLabelKr}</strong>
                                    {dropNearDeadline ? (
                                        <span className="text-red-300 font-bold"> · 24시간 이내 마감입니다.</span>
                                    ) : null}
                                </p>
                            )}
                            {!isHeatherFarmskinView && droppedCount > 0 && (
                                <p className="text-amber-300/90">현재 화면 기준 {droppedCount}명 드랍 선택됨{hasPendingDropChanges ? ' · 저장되지 않은 변경이 있습니다' : ''}.</p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={handleConfirmDrop}
                        disabled={confirmingDrop}
                        className="px-12 py-5 text-lg font-black tracking-widest uppercase rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white border-2 border-emerald-400/50 shadow-lg shadow-emerald-500/20 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                        {confirmingDrop ? '확정 중...' : '리스트 확정'}
                    </button>
                </div>
            )}
        </div>
    );
};

// --- Detail Component: Analytics (완료된 캠페인) ---
const AnalyticsReport = ({ campaign }) => {
    const fd = campaign?.setup_submission_summary?.form_data || {};
    const reportSummary = fd?.report_summary || {};
    const reportDataStudio = fd?.report_data_studio || {};
    const reportNotion = fd?.report_notion || {};
    const reportTopCreatorsRaw = Array.isArray(fd?.report_top_creators) ? fd.report_top_creators : [];
    const reportTopPostsRaw = Array.isArray(fd?.report_top_posts) ? fd.report_top_posts : [];
    const reportInsights = Array.isArray(fd?.report_insights) ? fd.report_insights : [];
    const reportActions = Array.isArray(fd?.report_actions) ? fd.report_actions : [];

    const fmt = (n) => Number(n || 0).toLocaleString();
    const pct = (n) => `${Number(n || 0).toFixed(2)}%`;
    const parseNum = (v) => Number(String(v ?? '').replace(/[^0-9]/g, '') || 0);
    const analytics = campaign?.analytics || {};
    const dailyViews = Array.isArray(analytics?.daily_views) ? analytics.daily_views : [];
    const dates = Array.isArray(analytics?.dates) ? analytics.dates : [];
    const maxDaily = Math.max(1, ...dailyViews);
    const topLang = Array.isArray(reportSummary?.top_languages) ? reportSummary.top_languages : [];
    const topRegions = Array.isArray(reportSummary?.top_regions) ? reportSummary.top_regions : [];
    const quantSummary = reportDataStudio?.comment_quantitative_summary || {};
    const qualitativeSummary = Array.isArray(reportDataStudio?.comment_qualitative_summary)
      ? reportDataStudio.comment_qualitative_summary
      : [];
    const dataDrivenInsights = Array.isArray(reportDataStudio?.data_driven_insights)
      ? reportDataStudio.data_driven_insights
      : [];
    const nextActionPlan = Array.isArray(reportDataStudio?.next_action_plan)
      ? reportDataStudio.next_action_plan
      : [];
    const sentimentKeywords = Array.isArray(reportNotion?.sentiment_analysis?.representative_keywords)
      ? reportNotion.sentiment_analysis.representative_keywords
      : [];
    const fallbackCreators = Array.isArray(campaign?.creators) ? campaign.creators : [];
    const fallbackPosts = Array.isArray(campaign?.contents) ? campaign.contents : [];

    const reportTopCreators = reportTopCreatorsRaw.length > 0
      ? reportTopCreatorsRaw
      : fallbackCreators.slice(0, 10).map((c) => ({
          name: c.name || '-',
          platform: c.platform || '-',
          views: parseNum(c.views),
          likes: 0,
          comments: 0,
          shares: 0,
          posts: 1,
        }));

    const reportTopPosts = reportTopPostsRaw.length > 0
      ? reportTopPostsRaw
      : fallbackPosts.slice(0, 12).map((c) => ({
          name: c.creator || '-',
          platform: 'POST',
          views: parseNum(c.views),
          likes: 0,
          comments: 0,
          shares: 0,
          url: null,
        }));

    const summaryViews = parseNum(campaign.kpi_views) || Number(reportSummary.views || 0);
    const summaryLikes = parseNum(campaign.kpi_likes) || Number(reportSummary.likes || 0);
    const summaryComments = parseNum(campaign.kpi_comments) || Number(reportSummary.comments || 0);
    const summaryShares = parseNum(campaign.kpi_shares) || Number(reportSummary.shares || 0);
    const summaryPosts = Number(reportSummary.posts || campaign.content_count || reportTopPosts.length || 0);
    const engagementPct = analytics?.engagement_rate
      || (summaryViews > 0
        ? `${(((summaryLikes + summaryComments + summaryShares) / summaryViews) * 100).toFixed(2)}%`
        : pct(reportSummary.engagement_rate));

    return (
        <div className="space-y-10 animate-fade-in-up">
            <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[3rem] border border-white/10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/5 blur-[100px] rounded-full"></div>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 relative z-10">
                    <h3 className="font-black text-white text-3xl md:text-4xl flex items-center gap-3 tracking-tight">
                        <BarChart2 size={28} className="text-purple-400" /> 캠페인 퍼포먼스 리포트
                    </h3>
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-black tracking-widest uppercase px-4 py-2 bg-white/5 border border-white/10 rounded-2xl text-cyan-300">
                            Advanced Report Mode
                        </span>
                    </div>
                </div>

                <div className="mb-8 rounded-[2rem] p-6 border border-fuchsia-400/20 bg-gradient-to-r from-fuchsia-500/10 via-indigo-500/10 to-cyan-500/10 relative z-10">
                    <p className="text-[11px] uppercase tracking-[0.25em] text-fuchsia-200 font-black mb-2">Executive Highlight</p>
                    <p className="text-white text-lg md:text-2xl font-black leading-tight">
                        누적 <span className="text-cyan-300">{fmt(summaryViews)}</span> 조회를 기반으로, 감성·구매의향·바이럴 신호를 한 화면에 통합한
                        <span className="text-fuchsia-300"> Full-Funnel 분석 리포트</span>입니다.
                    </p>
                    <p className="text-slate-300 text-sm mt-3 leading-relaxed">
                        상위 크리에이터 성과, 댓글 정량/정성 분석, 언어권 반응, 제품별 반응 비교, 다음 실행 전략까지 모두 포함해 즉시 실행 가능한 형태로 구성했습니다.
                    </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 relative z-10">
                    <div className="p-5 bg-blue-500/5 rounded-2xl border border-blue-500/20">
                        <p className="text-[10px] text-blue-300 font-black tracking-widest uppercase">Posts</p>
                        <p className="text-2xl font-black text-white mt-1">{fmt(summaryPosts)}</p>
                    </div>
                    <div className="p-5 bg-purple-500/5 rounded-2xl border border-purple-500/20">
                        <p className="text-[10px] text-purple-300 font-black tracking-widest uppercase">Views</p>
                        <p className="text-2xl font-black text-white mt-1">{fmt(summaryViews)}</p>
                    </div>
                    <div className="p-5 bg-rose-500/5 rounded-2xl border border-rose-500/20">
                        <p className="text-[10px] text-rose-300 font-black tracking-widest uppercase">Likes</p>
                        <p className="text-2xl font-black text-white mt-1">{fmt(summaryLikes)}</p>
                    </div>
                    <div className="p-5 bg-emerald-500/5 rounded-2xl border border-emerald-500/20">
                        <p className="text-[10px] text-emerald-300 font-black tracking-widest uppercase">Engagement</p>
                        <p className="text-2xl font-black text-white mt-1">{engagementPct}</p>
                    </div>
                </div>

                <div className="bg-black/20 rounded-[2rem] border border-white/5 p-8 mb-8 relative z-10">
                    <p className="text-xs font-black tracking-widest text-slate-400 uppercase mb-5">Daily View Trend</p>
                    <div className="flex h-64 relative items-end pb-12 pl-10 gap-4">
                        <div className="absolute top-0 left-0 h-full flex flex-col justify-between text-[10px] text-slate-600 font-black uppercase tracking-[0.2em] pb-12">
                            <span>{fmt(maxDaily)}K</span>
                            <span>{fmt(Math.round(maxDaily * 0.66))}K</span>
                            <span>{fmt(Math.round(maxDaily * 0.33))}K</span>
                            <span>0</span>
                        </div>
                        {dailyViews.map((views, idx) => (
                            <div key={`${dates[idx] || idx}`} className="flex-1 flex flex-col justify-end group relative h-full">
                                <div
                                    className="w-full bg-gradient-to-t from-purple-600/40 to-cyan-400/80 hover:to-white transition-all duration-500 rounded-t-xl relative shadow-[0_0_20px_rgba(168,85,247,0.2)]"
                                    style={{ height: `${Math.max(6, (Number(views || 0) / maxDaily) * 100)}%` }}
                                >
                                    <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-white text-[#020617] text-[10px] font-black px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap z-20 shadow-2xl">
                                        {fmt(views)}K
                                    </div>
                                </div>
                                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] font-black text-slate-500 tracking-tighter whitespace-nowrap uppercase">
                                    {dates[idx]}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                        <h4 className="text-sm font-black uppercase tracking-widest text-slate-200 mb-5">Comment Sentiment</h4>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-xs mb-1"><span className="text-emerald-300 font-bold">긍정</span><span className="text-slate-300">{pct(reportSummary.positive_pct)}</span></div>
                                <div className="h-2 rounded-full bg-white/10 overflow-hidden"><div className="h-full bg-emerald-400" style={{ width: `${Math.min(100, Number(reportSummary.positive_pct || 0))}%` }} /></div>
                            </div>
                            <div>
                                <div className="flex justify-between text-xs mb-1"><span className="text-sky-300 font-bold">중립</span><span className="text-slate-300">{pct(reportSummary.neutral_pct)}</span></div>
                                <div className="h-2 rounded-full bg-white/10 overflow-hidden"><div className="h-full bg-sky-400" style={{ width: `${Math.min(100, Number(reportSummary.neutral_pct || 0))}%` }} /></div>
                            </div>
                            <div>
                                <div className="flex justify-between text-xs mb-1"><span className="text-rose-300 font-bold">부정</span><span className="text-slate-300">{pct(reportSummary.negative_pct)}</span></div>
                                <div className="h-2 rounded-full bg-white/10 overflow-hidden"><div className="h-full bg-rose-400" style={{ width: `${Math.min(100, Number(reportSummary.negative_pct || 0))}%` }} /></div>
                            </div>
                        </div>
                        <div className="mt-6 grid grid-cols-2 gap-4 text-xs">
                            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                                <p className="text-slate-500 uppercase tracking-widest">구매의도</p>
                                <p className="text-white font-black mt-1">{pct(reportSummary.purchase_intent_pct)}</p>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                                <p className="text-slate-500 uppercase tracking-widest">바이럴 신호</p>
                                <p className="text-white font-black mt-1">{pct(reportSummary.viral_signal_pct)}</p>
                            </div>
                        </div>
                        {topLang.length > 0 ? (
                            <div className="mt-5 flex flex-wrap gap-2">
                                {topLang.map(([lang, cnt]) => (
                                    <span key={lang} className="px-2.5 py-1 rounded-full text-[10px] font-bold border border-white/20 text-slate-300 bg-white/5">
                                        {String(lang).toUpperCase()} · {cnt}
                                    </span>
                                ))}
                            </div>
                        ) : null}
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                        <h4 className="text-sm font-black uppercase tracking-widest text-slate-200 mb-5">Top 10 Creators</h4>
                        <div className="space-y-2">
                            {(reportTopCreators.slice(0, 10)).map((c, idx) => {
                                const v = Number(c?.views || 0);
                                const l = Number(c?.likes || 0);
                                const cm = Number(c?.comments || 0);
                                const sh = Number(c?.shares || 0);
                                const er = v > 0 ? (((l + cm + sh) / v) * 100).toFixed(2) : '0.00';
                                return (
                                    <div key={`${c?.name || idx}-${idx}`} className="grid grid-cols-12 gap-2 items-center rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5 text-xs">
                                        <div className="col-span-1 text-slate-500 font-black">{idx + 1}</div>
                                        <div className="col-span-5 text-white font-bold truncate">{c?.name || '-'}</div>
                                        <div className="col-span-2 text-cyan-300 font-bold">{fmt(v)}</div>
                                        <div className="col-span-2 text-slate-400">{c?.platform || '-'}</div>
                                        <div className="col-span-2 text-emerald-300 font-bold">{er}%</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8 relative z-10">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                        <h4 className="text-sm font-black uppercase tracking-widest text-slate-200 mb-4">핵심 인사이트</h4>
                        <ul className="space-y-2 text-sm text-slate-300">
                            {(reportInsights.length > 0 ? reportInsights : [
                                `총 ${fmt(summaryPosts)}개 포스팅에서 ${fmt(summaryViews)} 조회를 확보했습니다.`,
                                `좋아요+댓글+공유 기반 참여율은 ${engagementPct}입니다.`,
                                `댓글 감성은 긍정 ${pct(reportSummary.positive_pct)} / 부정 ${pct(reportSummary.negative_pct)}로 안정적입니다.`,
                            ]).map((x, idx) => (
                                <li key={`insight-${idx}`} className="rounded-xl bg-white/[0.02] border border-white/10 px-3 py-2">{x}</li>
                            ))}
                        </ul>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                        <h4 className="text-sm font-black uppercase tracking-widest text-slate-200 mb-4">추천 액션</h4>
                        <ul className="space-y-2 text-sm text-slate-300">
                            {(reportActions.length > 0 ? reportActions : [
                                '상위 조회 콘텐츠 포맷을 다음 물량 가이드의 기본 템플릿으로 고정',
                                '구매의도 댓글이 붙은 영상에 링크 고정/프로필 CTA 재강화',
                                '언어 비중 상위 국가 중심으로 차기 시딩 크리에이터를 재배치',
                            ]).map((x, idx) => (
                                <li key={`action-${idx}`} className="rounded-xl bg-white/[0.02] border border-white/10 px-3 py-2">{x}</li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="col-span-1 md:col-span-3 mt-8 border-t border-white/5 pt-8 relative z-10">
                    <h4 className="text-lg font-black text-white mb-6 flex items-center gap-3 tracking-tighter">
                        <Trophy size={20} className="text-yellow-400"/> Best Performing Content
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {(reportTopPosts.slice(0, 15)).map((p, idx) => (
                            <a
                                key={`${p?.url || idx}-${idx}`}
                                href={p?.url || '#'}
                                target={p?.url ? '_blank' : undefined}
                                rel={p?.url ? 'noreferrer' : undefined}
                                className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 hover:bg-white/[0.06] transition-colors"
                            >
                                <p className="text-[10px] font-black text-yellow-300 tracking-widest mb-2">TOP {idx + 1}</p>
                                <p className="text-white font-bold text-sm truncate">{p?.name || '-'}</p>
                                <p className="text-slate-400 text-xs mt-1">{p?.platform || '-'}</p>
                                <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                                    <div className="rounded-lg bg-white/5 px-2 py-1"><span className="text-slate-500">Views</span><p className="text-cyan-300 font-bold">{fmt(p?.views)}</p></div>
                                    <div className="rounded-lg bg-white/5 px-2 py-1"><span className="text-slate-500">Likes</span><p className="text-rose-300 font-bold">{fmt(p?.likes)}</p></div>
                                    <div className="rounded-lg bg-white/5 px-2 py-1"><span className="text-slate-500">Comments</span><p className="text-emerald-300 font-bold">{fmt(p?.comments)}</p></div>
                                    <div className="rounded-lg bg-white/5 px-2 py-1"><span className="text-slate-500">Shares</span><p className="text-purple-300 font-bold">{fmt(p?.shares)}</p></div>
                                </div>
                            </a>
                        ))}
                    </div>
                </div>

                <div className="mt-8 border-t border-white/5 pt-8 space-y-6 relative z-10">
                    <h4 className="text-xl font-black text-white tracking-tight">성과 분석 상세 섹션</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest">포스팅 개수</p>
                            <p className="text-xl font-black text-white mt-1">{fmt(reportDataStudio?.overview_cards?.posting_count || summaryPosts)}</p>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest">누적 뷰</p>
                            <p className="text-xl font-black text-white mt-1">{fmt(reportDataStudio?.overview_cards?.cumulative_views || summaryViews)}</p>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest">단일 조회 최대값</p>
                            <p className="text-xl font-black text-white mt-1">{fmt(reportDataStudio?.overview_cards?.max_single_view || 0)}</p>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest">배송도달율</p>
                            <p className="text-xl font-black text-white mt-1">{pct(reportDataStudio?.overview_cards?.shipping_reach_rate || 0)}</p>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 overflow-x-auto">
                        <h5 className="text-sm font-black text-white mb-4 uppercase tracking-widest">리포트 표 (Top Posts)</h5>
                        <table className="w-full text-xs text-left min-w-[760px]">
                            <thead className="text-slate-400 border-b border-white/10">
                                <tr>
                                    <th className="py-2 pr-3">#</th>
                                    <th className="py-2 pr-3">Creator</th>
                                    <th className="py-2 pr-3">Platform</th>
                                    <th className="py-2 pr-3">Upload Day</th>
                                    <th className="py-2 pr-3">Views</th>
                                    <th className="py-2 pr-3">Likes</th>
                                    <th className="py-2 pr-3">Comments</th>
                                    <th className="py-2 pr-3">Shares</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {((reportDataStudio?.report_table || []).slice(0, 20)).map((r, idx) => (
                                    <tr key={`tbl-${idx}`}>
                                        <td className="py-2 pr-3 text-slate-500">{r.rank || idx + 1}</td>
                                        <td className="py-2 pr-3 text-white font-semibold">{r.creator || '-'}</td>
                                        <td className="py-2 pr-3 text-slate-300">{r.platform || '-'}</td>
                                        <td className="py-2 pr-3 text-slate-400">{r.upload_day || '-'}</td>
                                        <td className="py-2 pr-3 text-cyan-300">{fmt(r.views)}</td>
                                        <td className="py-2 pr-3 text-rose-300">{fmt(r.likes)}</td>
                                        <td className="py-2 pr-3 text-emerald-300">{fmt(r.comments)}</td>
                                        <td className="py-2 pr-3 text-purple-300">{fmt(r.shares)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                            <h5 className="text-sm font-black text-white mb-3 uppercase tracking-widest">주요 키워드/언급</h5>
                            <div className="space-y-2">
                                {((reportDataStudio?.keyword_mentions || []).slice(0, 8)).map((k, idx) => (
                                    <div key={`kw-${idx}`} className="flex items-center justify-between rounded-lg bg-white/[0.02] border border-white/10 px-3 py-2 text-xs">
                                        <span className="text-slate-200 font-semibold">{k.keyword}</span>
                                        <span className="text-cyan-300 font-black">{fmt(k.mentions)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                            <h5 className="text-sm font-black text-white mb-3 uppercase tracking-widest">댓글단 유저 특성</h5>
                            <div className="grid grid-cols-1 gap-2 text-xs">
                                <div className="rounded-lg bg-white/[0.02] border border-white/10 px-3 py-2 flex justify-between"><span className="text-slate-300">Creator-like bio</span><span className="text-white font-bold">{fmt(reportDataStudio?.user_characteristics?.creator_like || 0)}</span></div>
                                <div className="rounded-lg bg-white/[0.02] border border-white/10 px-3 py-2 flex justify-between"><span className="text-slate-300">Shopper-like bio</span><span className="text-white font-bold">{fmt(reportDataStudio?.user_characteristics?.shopper_like || 0)}</span></div>
                                <div className="rounded-lg bg-white/[0.02] border border-white/10 px-3 py-2 flex justify-between"><span className="text-slate-300">Skincare-interest bio</span><span className="text-white font-bold">{fmt(reportDataStudio?.user_characteristics?.skincare_interest || 0)}</span></div>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {((reportDataStudio?.user_characteristics?.top_languages || []).slice(0, 6)).map(([lang, cnt]) => (
                                    <span key={`ulang-${lang}`} className="px-2 py-1 rounded-md border border-white/15 text-[10px] text-slate-300">{String(lang).toUpperCase()} {cnt}</span>
                                ))}
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {(topRegions.slice(0, 6)).map(([region, cnt]) => (
                                    <span key={`uregion-${region}`} className="px-2 py-1 rounded-md border border-white/15 text-[10px] text-cyan-200">{String(region).toUpperCase()} {cnt}</span>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                            <h5 className="text-sm font-black text-white mb-3 uppercase tracking-widest">댓글 정량 요약</h5>
                            <div className="space-y-2 text-xs">
                                <div className="flex justify-between rounded-lg bg-white/[0.02] px-3 py-2"><span className="text-slate-300">총 댓글</span><span className="text-white font-black">{fmt(quantSummary.total_comments || reportSummary.total_comments)}</span></div>
                                <div className="flex justify-between rounded-lg bg-white/[0.02] px-3 py-2"><span className="text-slate-300">댓글 좋아요</span><span className="text-cyan-300 font-black">{fmt(quantSummary.total_comment_likes || reportSummary.total_comment_likes)}</span></div>
                                <div className="flex justify-between rounded-lg bg-white/[0.02] px-3 py-2"><span className="text-slate-300">댓글 답글</span><span className="text-fuchsia-300 font-black">{fmt(quantSummary.total_comment_replies || reportSummary.total_comment_replies)}</span></div>
                                <div className="flex justify-between rounded-lg bg-white/[0.02] px-3 py-2"><span className="text-slate-300">구매의향</span><span className="text-emerald-300 font-black">{pct(quantSummary.purchase_intent_pct || reportSummary.purchase_intent_pct)}</span></div>
                                <div className="flex justify-between rounded-lg bg-white/[0.02] px-3 py-2"><span className="text-slate-300">바이럴 신호</span><span className="text-purple-300 font-black">{pct(quantSummary.viral_signal_pct || reportSummary.viral_signal_pct)}</span></div>
                            </div>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                            <h5 className="text-sm font-black text-white mb-3 uppercase tracking-widest">댓글 정성 분석 요약</h5>
                            <ul className="space-y-2 text-xs text-slate-300">
                                {(qualitativeSummary.length > 0 ? qualitativeSummary : [
                                    '긍정/중립 비중이 높아 전반적인 제품 수용도가 양호합니다.',
                                    '구매처·가격 문의 비중이 존재하여 전환형 CTA를 강화할 여지가 있습니다.',
                                ]).map((x, idx) => (
                                    <li key={`qual-${idx}`} className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2">{x}</li>
                                ))}
                            </ul>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                            <h5 className="text-sm font-black text-white mb-3 uppercase tracking-widest">다음 액션 플랜</h5>
                            <ul className="space-y-2 text-xs text-slate-300">
                                {(nextActionPlan.length > 0 ? nextActionPlan : reportActions).map((x, idx) => (
                                    <li key={`plan-${idx}`} className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2">{x}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="mt-8 border-t border-white/5 pt-8 space-y-6 relative z-10">
                    <h4 className="text-xl font-black text-white tracking-tight">심층 인사이트 섹션</h4>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                            <h5 className="text-sm font-black text-white mb-3">감정분석</h5>
                            <p className="text-xs text-slate-300 leading-relaxed">
                                긍정 {pct(reportNotion?.sentiment_analysis?.positive_pct || reportSummary.positive_pct)} ·
                                중립 {pct(reportNotion?.sentiment_analysis?.neutral_pct || reportSummary.neutral_pct)} ·
                                부정 {pct(reportNotion?.sentiment_analysis?.negative_pct || reportSummary.negative_pct)}
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {sentimentKeywords.slice(0, 6).map((k, idx) => (
                                    <span key={`senti-kw-${idx}`} className="px-2 py-1 rounded-md bg-white/[0.03] border border-white/15 text-[10px] text-fuchsia-200">
                                        {k.keyword}: {fmt(k.mentions)}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                            <h5 className="text-sm font-black text-white mb-3">제품별 반응 비교</h5>
                            <div className="text-xs text-slate-300 space-y-1">
                                <p>Lip mask views: {fmt(reportNotion?.product_reaction_comparison?.lip_mask?.views || 0)}</p>
                                <p>Face mask views: {fmt(reportNotion?.product_reaction_comparison?.face_mask?.views || 0)}</p>
                                <p>Others views: {fmt(reportNotion?.product_reaction_comparison?.others?.views || 0)}</p>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs">
                        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                            <h6 className="text-slate-100 font-black mb-2">언어별 반응 분석</h6>
                            {((reportNotion?.language_reaction_analysis || []).slice(0, 6)).map(([lang, cnt]) => (
                                <p key={`lang-${lang}`} className="text-slate-300">{String(lang).toUpperCase()} · {cnt}</p>
                            ))}
                        </div>
                        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                            <h6 className="text-slate-100 font-black mb-2">구매 의향 신호 분석</h6>
                            <p className="text-slate-300">구매의향 비율: {pct(reportNotion?.purchase_intent_signal_analysis?.purchase_intent_pct || reportSummary.purchase_intent_pct)}</p>
                            <p className="text-slate-500 mt-2">{reportNotion?.purchase_intent_signal_analysis?.prompt || '구매처/가격/링크 질문 비중'}</p>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                            <h6 className="text-slate-100 font-black mb-2">바이럴 포인트 분석</h6>
                            {((reportNotion?.viral_point_analysis || []).slice(0, 5)).map((v, idx) => (
                                <p key={`viral-${idx}`} className="text-slate-300">{v.keyword}: {fmt(v.mentions)}</p>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-fuchsia-500/10 p-5">
                        <h5 className="text-sm font-black text-white mb-3 uppercase tracking-widest">데이터 기반 핵심 인사이트</h5>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                            {(dataDrivenInsights.length > 0 ? dataDrivenInsights : reportInsights).map((x, idx) => (
                                <div key={`ddi-${idx}`} className="rounded-xl border border-white/15 bg-black/20 px-3 py-3 text-xs text-slate-200 leading-relaxed">
                                    {x}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                            <h5 className="text-sm font-black text-white mb-3">콘텐츠 포맷별 반응 힌트</h5>
                            <ul className="space-y-2 text-xs text-slate-300">
                                {(reportNotion?.content_format_hints || []).map((x, idx) => <li key={`fmt-${idx}`}>- {x}</li>)}
                            </ul>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                            <h5 className="text-sm font-black text-white mb-3">개선 및 보완 포인트</h5>
                            <ul className="space-y-2 text-xs text-slate-300">
                                {(reportNotion?.improvements_and_complements || []).map((x, idx) => <li key={`imp-${idx}`}>- {x}</li>)}
                            </ul>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                            <h5 className="text-sm font-black text-white mb-3">모집 전략 추천</h5>
                            <ul className="space-y-2 text-xs text-slate-300">
                                {(reportNotion?.recruitment_strategy || []).map((x, idx) => <li key={`rec-${idx}`}>- {x}</li>)}
                            </ul>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                            <h5 className="text-sm font-black text-white mb-3">전략 요약</h5>
                            <ul className="space-y-2 text-xs text-slate-300">
                                {(reportNotion?.strategy_summary || []).map((x, idx) => <li key={`sum-${idx}`}>- {x}</li>)}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Detail Component: Ongoing Campaign (업로드 중) ---
const OngoingCampaign = ({ campaign }) => {
    return (
        <div className="space-y-10 animate-fade-in-up">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <MetricCard icon={Eye} label="Views" value={campaign.kpi_views} color="bg-blue-600/20 text-blue-400" />
                <MetricCard icon={Heart} label="Likes" value={campaign.kpi_likes} color="bg-red-600/20 text-red-400" />
                <MetricCard icon={MessageCircle} label="Comments" value={campaign.kpi_comments} color="bg-emerald-600/20 text-emerald-400" />
                <MetricCard icon={Share2} label="Shares" value={campaign.kpi_shares} color="bg-purple-600/20 text-purple-400" />
            </div>

            <div className="bg-white/5 backdrop-blur-md rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl">
                <div className="px-8 py-6 border-b border-white/5 bg-white/5">
                    <h3 className="font-black text-white flex items-center gap-3 tracking-tighter">
                        <Users size={20} className="text-cyan-400"/> Engagement Top 10 Creators
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-white/5 text-slate-500 font-black uppercase tracking-widest text-[10px] border-b border-white/5">
                            <tr>
                                <th className="px-8 py-5">Rank</th>
                                <th className="px-8 py-5">Creator</th>
                                <th className="px-8 py-5">Views</th>
                                <th className="px-8 py-5">Status</th>
                                <th className="px-8 py-5 text-right">Optimization</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {(campaign.creators || []).map((creator, idx) => (
                                <tr key={creator.id} className="hover:bg-white/5 transition-all">
                                    <td className="px-8 py-5 font-black text-slate-700 w-16">{idx + 1}</td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-3">
                                            <span className="font-bold text-white text-base tracking-tight">{creator.name}</span>
                                            <span className="text-[9px] font-black text-cyan-400 border border-cyan-400/30 px-2 py-0.5 rounded-full uppercase tracking-widest">{creator.platform}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 text-lg">{creator.views}</td>
                                    <td className="px-8 py-5">
                                        <span className={`text-[10px] px-3 py-1 rounded-full border font-black uppercase tracking-widest ${
                                            creator.status === 'Uploaded' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-500/10 text-slate-500 border-white/5'
                                        }`}>
                                            {creator.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex justify-end gap-3">
                                            <button className="text-[10px] font-black tracking-widest uppercase px-3 py-1.5 bg-gradient-to-r from-purple-600/20 to-blue-600/20 text-purple-400 rounded-xl hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] border border-purple-500/20 transition-all flex items-center gap-2">
                                                <Zap size={12} /> Spark Ads
                                            </button>
                                            <button className="text-[10px] font-black tracking-widest uppercase px-3 py-1.5 bg-pink-500/10 text-pink-400 rounded-xl border border-pink-500/20 transition-all flex items-center gap-2">
                                                <Gift size={12} /> Reward
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-white/5 backdrop-blur-md rounded-[2.5rem] border border-white/10 p-10 shadow-2xl">
                <h3 className="font-black text-white mb-10 flex items-center gap-3 tracking-tighter">
                    <PlayCircle size={24} className="text-purple-400"/> Content Gallery (Auto-Feed)
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {(campaign.contents || []).map((content, idx) => (
                        <div key={idx} className="relative aspect-[9/16] rounded-2xl overflow-hidden bg-white/5 group cursor-pointer border border-white/10 shadow-xl transition-all hover:scale-[1.05]">
                            {content.thumbnail_url ? (
                                <img src={content.thumbnail_url} alt="Thumbnail" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-white/5 text-slate-700 text-[10px] font-black uppercase tracking-widest">No Signal</div>
                            )}
                            <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-[9px] font-black px-3 py-1 rounded-full border border-white/10 tracking-widest uppercase truncate max-w-[85%]">
                                {content.creator}
                            </div>
                            <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black via-black/20 to-transparent p-4">
                                <p className="text-white text-xs font-black flex items-center gap-2 tracking-tight uppercase italic">
                                    <Eye size={12} className="text-cyan-400" /> {content.views || '0'} VIEWS
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// --- 착수 단계 (캠페인 세팅 완료 후) ---
const KICKOFF_STEPS = [
  { id: 1, label: '플랜 선택', icon: Package, done: true },
  { id: 2, label: '결제 접수', icon: CreditCard, done: true },
  { id: 3, label: '계약 확정', icon: FileText, done: true },
  { id: 4, label: '캠페인 세팅', icon: Rocket, done: true },
  { id: 5, label: '착수', icon: CheckCircle2, active: true, done: false },
];

const COUNTRY_LABELS = { us: '🇺🇸 미국만', us_ca: '🇺🇸+🇨🇦 미국/캐나다', us_ca_eu: '🇺🇸+🇨🇦+🇪🇺 유럽 믹스' };
const DELIVERY_LABELS = { '2-3': '2~3일', '1w': '약 1주', '2w': '약 2주', other: '기타' };

// --- 캠페인 일정 자동 산출 (노션 프로세스 기준) ---
const addDays = (dateStr, days) => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};
const addBizDays = (dateStr, n) => {
  let d = new Date(dateStr);
  let left = n;
  while (left > 0) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    if (day !== 0 && day !== 6) left--;
  }
  return d.toISOString().split('T')[0];
};
const toYMD = (dateStr) => {
  const d = new Date(dateStr);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
};
const formatShort = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
};
const getDaysDiff = (fromStr, toStr) => {
  const from = new Date(fromStr);
  const to = new Date(toStr);
  return Math.ceil((to - from) / (24 * 60 * 60 * 1000));
};

/**
 * @param {string} startDate - 계약/결제일 (YYYY-MM-DD)
 * @param {{ shippingType: 'us'|'domestic', recruitmentWeeks?: number, requestedShippingDate?: string }} options
 */
function getCampaignSchedule(startDate, options = {}) {
  const shippingType = options.shippingType || 'us';
  const recruitmentWeeks = options.recruitmentWeeks ?? 3;
  const requestedShipping = options.requestedShippingDate;
  const base = startDate || toYMD(new Date());

  const recruitmentEnd = addDays(base, recruitmentWeeks * 7);
  const confirmationEnd = addDays(recruitmentEnd, 7);
  const listDeliveryDate = addDays(confirmationEnd, 1);
  const replacementEnd = addBizDays(listDeliveryDate, 3);
  const shippingDate = requestedShipping && requestedShipping >= listDeliveryDate
    ? requestedShipping
    : addDays(listDeliveryDate, 7);
  const uploadStartDays = shippingType === 'us' ? 3 : 10;
  const uploadStartDate = addDays(shippingDate, uploadStartDays);
  const uploadDeadlineDate = addDays(shippingDate, 30);
  const trackingEndDate = addDays(uploadStartDate, 90);

  return {
    base,
    recruitmentStart: base,
    recruitmentEnd,
    contentGuideEnd: confirmationEnd,
    listDeliveryDate,
    replacementWindowStart: listDeliveryDate,
    replacementWindowEnd: replacementEnd,
    shippingDate,
    uploadStartDate,
    uploadDeadlineDate,
    trackingEndDate,
    recruitmentWeeks,
    shippingType,
  };
}

/** DB campaigns.id 형태의 UUID (가상 캠페인 행 제외) */
const CAMPAIGN_ROW_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * 템플릿 일정 위에 campaigns 테이블의 수동 일정 컬럼을 덮어씁니다.
 */
function mergeCampaignSchedule(computed, campaign) {
  if (!computed) return computed;
  const merged = { ...computed };
  const o = campaign || {};
  if (o.schedule_list_delivery_date) {
    merged.listDeliveryDate = o.schedule_list_delivery_date;
    merged.replacementWindowStart = o.schedule_list_delivery_date;
    merged.replacementWindowEnd = addBizDays(o.schedule_list_delivery_date, 3);
  }
  if (o.schedule_shipping_date) merged.shippingDate = o.schedule_shipping_date;
  if (o.schedule_upload_start_date) merged.uploadStartDate = o.schedule_upload_start_date;
  if (o.schedule_upload_deadline_date) merged.uploadDeadlineDate = o.schedule_upload_deadline_date;
  if (o.schedule_tracking_end_date) {
    merged.trackingEndDate = o.schedule_tracking_end_date;
  } else if (o.schedule_upload_start_date) {
    merged.trackingEndDate = addDays(merged.uploadStartDate, 90);
  }
  return merged;
}

/**
 * Visit 플랜: 결제(또는 착수)일 기준으로 명단 납품까지 단축 (행사 스케줄 맞춤).
 * 예: 결제 3/23 → 모집 마감 3/26, 명단 납품 3/27 (웰코스 마케팅 일정과 정합)
 */
function getVisitPreListSchedule(startDate) {
  const base = startDate || toYMD(new Date());
  const listDeliveryDate = addDays(base, 4);
  const recruitmentEnd = addDays(listDeliveryDate, -1);
  return {
    base,
    recruitmentStart: base,
    recruitmentEnd,
    contentGuideEnd: recruitmentEnd,
    listDeliveryDate,
    replacementWindowStart: listDeliveryDate,
    replacementWindowEnd: addBizDays(listDeliveryDate, 3),
    recruitmentWeeks: null,
    shippingType: 'us',
  };
}

/** Visit 플랜: 명단 납품일 기준 마케팅 일정 (웰코스 KWAILNARA 캠페인 일정과 동일 오프셋) */
function visitMilestonesFromListDelivery(listStr) {
  return {
    visitContentGuideCommDate: addDays(listStr, 7),
    reannounce1Date: addDays(listStr, 28),
    reannounce2Date: addDays(listStr, 42),
    individualNoticeStart: addDays(listStr, 46),
    individualNoticeEnd: addDays(listStr, 51),
    festivalStartDate: addDays(listStr, 47),
    festivalEndDate: addDays(listStr, 51),
    scheduleEndDate: addDays(listStr, 51),
  };
}

/**
 * Visit / Visit Content: 착수~명단은 단축 템플릿, 이후는 명단 납품일 기준 방문·행사 일정.
 */
function getVisitCampaignSchedule(startDate) {
  const pre = getVisitPreListSchedule(startDate);
  const list = pre.listDeliveryDate;
  return {
    kind: 'visit',
    ...pre,
    ...visitMilestonesFromListDelivery(list),
  };
}

function mergeVisitSchedule(computed, campaign) {
  if (!computed) return computed;
  const merged = { ...computed };
  const o = campaign || {};
  if (o.schedule_list_delivery_date) {
    merged.listDeliveryDate = o.schedule_list_delivery_date;
    merged.replacementWindowStart = o.schedule_list_delivery_date;
    merged.replacementWindowEnd = addBizDays(o.schedule_list_delivery_date, 3);
    merged.recruitmentEnd = addDays(o.schedule_list_delivery_date, -1);
    merged.contentGuideEnd = merged.recruitmentEnd;
    Object.assign(merged, visitMilestonesFromListDelivery(o.schedule_list_delivery_date));
  }
  if (o.schedule_visit_content_guide_date) merged.visitContentGuideCommDate = o.schedule_visit_content_guide_date;
  if (o.schedule_visit_reannounce_1_date) merged.reannounce1Date = o.schedule_visit_reannounce_1_date;
  if (o.schedule_visit_reannounce_2_date) merged.reannounce2Date = o.schedule_visit_reannounce_2_date;
  if (o.schedule_visit_notice_start_date) merged.individualNoticeStart = o.schedule_visit_notice_start_date;
  if (o.schedule_visit_notice_end_date) merged.individualNoticeEnd = o.schedule_visit_notice_end_date;
  if (o.schedule_visit_festival_start_date) merged.festivalStartDate = o.schedule_visit_festival_start_date;
  if (o.schedule_visit_festival_end_date) merged.festivalEndDate = o.schedule_visit_festival_end_date;
  merged.scheduleEndDate = merged.festivalEndDate;
  return merged;
}

const KickoffSummaryRow = ({ label, value }) => (
  <div>
    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{label}</p>
    <p className="text-slate-200 font-medium">{value || '-'}</p>
  </div>
);

const normalizeKickoffProductPhotoEntries = (fd) => {
  const raw = fd?.productPhotoUrls;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (typeof item === 'string' && item.trim()) return { url: item.trim(), name: null };
      if (item && typeof item.url === 'string' && item.url.trim()) {
        return { url: item.url.trim(), name: item.name || null };
      }
      return null;
    })
    .filter(Boolean);
};

const formatKickoffSetupDateTime = (iso) => {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso);
    return d.toLocaleString('ko-KR', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return String(iso);
  }
};

const formatKickoffFileSize = (bytes) => {
  if (bytes == null || Number.isNaN(Number(bytes))) return '—';
  const n = Number(bytes);
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
};

/** CampaignSetup.jsx AGREEMENT_ITEMS 와 동일한 key — 라벨만 요약 */
const CAMPAIGN_SETUP_AGREEMENT_LABELS = {
  koc: 'KOC(마이크로) 캠페인 안내',
  kpi: 'KPI는 총 업로드 수량',
  strategy: '확산형 마케팅 전략',
  channels: 'TikTok·Instagram 믹스',
  no_review: '업로드 전 개별 검수 불가',
  guide: '가이드 방향성·자율 영역',
  no_edit: '업로드 후 수정 원칙적 불가',
  replace_30: '리스트 교체(최대 30%)',
  no_replace_after: '확정 후 추가 교체 불가',
  final: '전체 내용 이해·동의',
};

function EventScheduleCalendar({ dates = [] }) {
  const [cursor, setCursor] = useState(() => {
    const first = (dates || []).find((d) => d);
    if (first) {
      const [y, m] = first.split('-').map(Number);
      return { year: y, month: m - 1 };
    }
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const set = new Set((dates || []).filter(Boolean));
  if (set.size === 0) return <p className="text-slate-500 text-sm">선택된 날짜 없음</p>;

  const year = cursor.year;
  const month = cursor.month;
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startPad = first.getDay();
  const daysInMonth = last.getDate();

  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];
  const cells = [];
  for (let i = 0; i < startPad; i++) cells.push({ key: `p-${i}`, empty: true });
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({ key: dateStr, dateStr, day: d, empty: false, selected: set.has(dateStr) });
  }

  const goPrev = () => setCursor((c) => (c.month === 0 ? { year: c.year - 1, month: 11 } : { year: c.year, month: c.month - 1 }));
  const goNext = () => setCursor((c) => (c.month === 11 ? { year: c.year + 1, month: 0 } : { year: c.year, month: c.month + 1 }));

  return (
    <div className="inline-block bg-white/5 border border-white/10 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <button type="button" onClick={goPrev} className="p-1.5 rounded-lg text-slate-400 hover:bg-white/10 hover:text-white transition-colors text-sm">‹</button>
        <span className="text-sm font-bold text-white">{year}년 {month + 1}월</span>
        <button type="button" onClick={goNext} className="p-1.5 rounded-lg text-slate-400 hover:bg-white/10 hover:text-white transition-colors text-sm">›</button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {weekDays.map((w) => <div key={w} className="text-[10px] font-bold text-slate-500 py-1">{w}</div>)}
        {cells.map((cell) =>
          cell.empty ? <div key={cell.key} className="aspect-square max-w-[36px]" /> : (
            <div
              key={cell.key}
              className={`aspect-square max-w-[36px] rounded-lg flex items-center justify-center text-xs font-medium ${cell.selected ? 'bg-amber-500 text-slate-900' : 'text-slate-400'}`}
            >
              {cell.day}
            </div>
          )
        )}
      </div>
    </div>
  );
}

// --- 캠페인 세팅 이후 여정: D-day 카드 ---
const DdayCard = ({ label, dateStr, subLabel }) => {
  const today = toYMD(new Date());
  const d = dateStr ? getDaysDiff(today, dateStr) : null;
  const isPast = d !== null && d < 0;
  const isToday = d === 0;
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col min-w-[140px]">
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{label}</span>
      {subLabel && <span className="text-[10px] text-slate-500 mb-1">{subLabel}</span>}
      {dateStr ? (
        <>
          <span className="text-2xl font-black text-white tabular-nums">
            {isPast ? 'D+' + Math.abs(d) : isToday ? 'D-Day' : 'D-' + d}
          </span>
          <span className="text-xs text-slate-400 mt-1">{dateStr}</span>
        </>
      ) : (
        <span className="text-slate-500 text-sm">-</span>
      )}
    </div>
  );
};

const DdayRangeCard = ({ label, startStr, endStr, subLabel }) => {
  const today = toYMD(new Date());
  const has = startStr && endStr;
  let headline = '-';
  if (has) {
    if (today >= startStr && today <= endStr) headline = '진행 중';
    else if (today < startStr) headline = `D-${getDaysDiff(today, startStr)}`;
    else headline = `D+${getDaysDiff(endStr, today)}`;
  }
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col min-w-[160px]">
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{label}</span>
      {subLabel && <span className="text-[10px] text-slate-500 mb-1">{subLabel}</span>}
      {has ? (
        <>
          <span className="text-2xl font-black text-white tabular-nums">{headline}</span>
          <span className="text-xs text-slate-400 mt-1 tabular-nums">{startStr} ~ {endStr}</span>
        </>
      ) : (
        <span className="text-slate-500 text-sm">-</span>
      )}
    </div>
  );
};

// --- 캠페인 타임라인 (간트 스타일) ---
const CampaignTimeline = ({ schedule }) => {
  if (!schedule) return null;
  const totalDays = getDaysDiff(schedule.base, schedule.trackingEndDate);
  const getLeft = (dateStr) => {
    const days = getDaysDiff(schedule.base, dateStr);
    return Math.max(0, Math.min(100, (days / totalDays) * 100));
  };
  const phases = [
    { label: '모집', start: schedule.base, end: schedule.recruitmentEnd, color: 'bg-cyan-500/80' },
    { label: '소통·확정', start: schedule.recruitmentEnd, end: schedule.contentGuideEnd, color: 'bg-violet-500/80' },
    { label: '명단 납품', start: schedule.listDeliveryDate, end: schedule.replacementWindowEnd, color: 'bg-amber-500/80' },
    { label: '배송', start: schedule.replacementWindowEnd, end: schedule.shippingDate, color: 'bg-emerald-500/80' },
    { label: '업로드 시작', start: schedule.uploadStartDate, end: schedule.uploadDeadlineDate, color: 'bg-pink-500/80' },
    { label: '트래킹', start: schedule.uploadStartDate, end: schedule.trackingEndDate, color: 'bg-indigo-500/50' },
  ];
  const milestones = [
    { label: 'List Delivery', date: schedule.listDeliveryDate },
    { label: 'Shipping', date: schedule.shippingDate },
    { label: 'Upload Start', date: schedule.uploadStartDate },
    { label: 'Upload Deadline', date: schedule.uploadDeadlineDate },
  ];
  return (
    <div className="space-y-4">
      <div className="relative h-12 rounded-xl bg-slate-800/50 overflow-hidden flex">
        {phases.map((p, i) => {
          const left = getLeft(p.start);
          const width = Math.max(4, getLeft(p.end) - left);
          return (
            <div
              key={i}
              className={`absolute top-0 h-full rounded ${p.color} transition-all`}
              style={{ left: left + '%', width: width + '%' }}
              title={`${p.label} ${p.start} ~ ${p.end}`}
            />
          );
        })}
      </div>
      <div className="flex flex-wrap gap-2 justify-between text-[10px] font-bold text-slate-400">
        {phases.map((p, i) => (
          <span key={i} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${p.color.replace('/80', '').replace('/50', '')}`} />
            {p.label}
          </span>
        ))}
      </div>
      <div className="flex flex-wrap gap-4 pt-2 border-t border-white/10">
        {milestones.map((m, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-slate-500 uppercase tracking-wider">{m.label}</span>
            <span className="text-white font-mono text-sm">{formatShort(m.date)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/** YYYY-MM-DD 포함, from~to 모든 날 */
function enumerateDateStrings(fromStr, toStr) {
  if (!fromStr || !toStr || fromStr > toStr) return [];
  const out = [];
  let cur = fromStr;
  while (cur <= toStr) {
    out.push(cur);
    cur = addDays(cur, 1);
  }
  return out;
}

const VISIT_RANGE_BG = {
  listExchange: 'bg-amber-500/[0.12] ring-1 ring-amber-500/20',
  notice: 'bg-fuchsia-500/[0.10] ring-1 ring-fuchsia-500/15',
  festival: 'bg-rose-500/[0.14] ring-1 ring-rose-500/25',
};

const VISIT_MARKER_TONE = {
  slate: 'text-slate-200 border-l-2 border-slate-400 pl-1',
  cyan: 'text-cyan-200 border-l-2 border-cyan-400 pl-1',
  amber: 'text-amber-200 border-l-2 border-amber-400 pl-1',
  teal: 'text-teal-200 border-l-2 border-teal-400 pl-1',
  orange: 'text-orange-200 border-l-2 border-orange-400 pl-1',
  fuchsia: 'text-fuchsia-200 border-l-2 border-fuchsia-400 pl-1',
  rose: 'text-rose-200 border-l-2 border-rose-400 pl-1',
};

function buildVisitCalendarPaint(schedule) {
  const markers = {};
  const addM = (d, label, tone) => {
    if (!d) return;
    if (!markers[d]) markers[d] = [];
    markers[d].push({ label, tone });
  };
  const s = schedule;
  addM(s.base, '착수', 'slate');
  addM(s.recruitmentEnd, '모집 마감', 'cyan');
  addM(s.listDeliveryDate, '명단 납품', 'amber');
  addM(s.replacementWindowEnd, '교체 마감', 'amber');
  addM(s.visitContentGuideCommDate, '가이드', 'teal');
  addM(s.reannounce1Date, '재공지 1차', 'orange');
  addM(s.reannounce2Date, '재공지 2차', 'orange');
  addM(s.individualNoticeStart, '개별안내 시작', 'fuchsia');
  addM(s.individualNoticeEnd, '개별안내 종료', 'fuchsia');
  addM(s.festivalStartDate, '방문', 'rose');
  const fEnd = s.festivalEndDate || s.scheduleEndDate;
  if (fEnd && fEnd !== s.festivalStartDate) addM(fEnd, '방문 종료', 'rose');

  const rangeBg = {};
  const paint = (a, b, key) => {
    enumerateDateStrings(a, b).forEach((d) => {
      rangeBg[d] = key;
    });
  };
  paint(s.listDeliveryDate, s.replacementWindowEnd, 'listExchange');
  paint(s.individualNoticeStart, s.individualNoticeEnd, 'notice');
  paint(s.festivalStartDate, fEnd, 'festival');

  const maxD = fEnd || s.base;
  return { markers, rangeBg, minDate: s.base, maxDate: maxD };
}

function VisitScheduleMonthGrid({ year, monthIndex, markersByDate, rangeBgByDate }) {
  const first = new Date(year, monthIndex, 1);
  const last = new Date(year, monthIndex + 1, 0);
  const startPad = first.getDay();
  const daysInMonth = last.getDate();
  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];
  const cells = [];
  for (let i = 0; i < startPad; i++) cells.push({ key: `p-${i}`, empty: true });
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({
      key: dateStr,
      dateStr,
      day: d,
      empty: false,
      markers: markersByDate[dateStr] || [],
      rangeKey: rangeBgByDate[dateStr],
    });
  }

  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/50 p-3 sm:p-4">
      <div className="text-center text-sm font-black text-white mb-3 tracking-tight">
        {year}년 {monthIndex + 1}월
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {weekDays.map((w) => (
          <div key={w} className="text-[10px] font-bold text-slate-500 py-1">
            {w}
          </div>
        ))}
        {cells.map((cell) =>
          cell.empty ? (
            <div key={cell.key} className="min-h-[4.25rem]" />
          ) : (
            <div
              key={cell.key}
              className={`min-h-[4.25rem] rounded-lg p-1 flex flex-col items-stretch text-left border border-white/[0.06] ${
                cell.rangeKey ? VISIT_RANGE_BG[cell.rangeKey] || '' : 'bg-white/[0.03]'
              }`}
              title={cell.markers.map((m) => m.label).join(', ') || cell.dateStr}
            >
              <span className="text-[11px] font-black text-white tabular-nums shrink-0">{cell.day}</span>
              <div className="flex-1 flex flex-col gap-0.5 mt-0.5 min-w-0">
                {cell.markers.map((m, i) => (
                  <span
                    key={`${m.label}-${i}`}
                    className={`text-[8px] sm:text-[9px] font-bold leading-snug break-words ${VISIT_MARKER_TONE[m.tone] || VISIT_MARKER_TONE.slate}`}
                  >
                    {m.label}
                  </span>
                ))}
              </div>
            </div>
          ),
        )}
      </div>
    </div>
  );
}

const VisitCampaignTimeline = ({ schedule }) => {
  if (!schedule || schedule.kind !== 'visit') return null;

  const { markers, rangeBg, minDate, maxDate } = buildVisitCalendarPaint(schedule);
  if (!minDate || !maxDate) {
    return <p className="text-slate-500 text-sm">일정 데이터가 부족해 달력을 그릴 수 없습니다.</p>;
  }

  const [sy, sm] = minDate.split('-').map(Number);
  const [ey, em] = maxDate.split('-').map(Number);
  let y = sy;
  let mi = sm - 1;
  const endMi = em - 1;
  const months = [];
  while (y < ey || (y === ey && mi <= endMi)) {
    months.push({ year: y, monthIndex: mi });
    mi += 1;
    if (mi > 11) {
      mi = 0;
      y += 1;
    }
  }

  const milestones = [
    { label: 'List Delivery', date: schedule.listDeliveryDate },
    { label: 'Guide & Comm', date: schedule.visitContentGuideCommDate },
    { label: 'Re-announce 1', date: schedule.reannounce1Date },
    { label: 'Re-announce 2', date: schedule.reannounce2Date },
    { label: '방문', date: schedule.festivalStartDate, end: schedule.festivalEndDate },
  ];

  const ticks = [
    { date: schedule.base, label: '착수' },
    { date: schedule.recruitmentEnd, label: '모집' },
    { date: schedule.listDeliveryDate, label: '명단' },
    { date: schedule.replacementWindowEnd, label: '교체' },
    { date: schedule.visitContentGuideCommDate, label: '가이드' },
    { date: schedule.reannounce1Date, label: '재공지1' },
    { date: schedule.reannounce2Date, label: '재공지2' },
    { date: schedule.individualNoticeStart, label: '개별안내' },
    ...(schedule.individualNoticeEnd && schedule.individualNoticeEnd !== schedule.individualNoticeStart
      ? [{ date: schedule.individualNoticeEnd, label: '개별안내 끝' }]
      : []),
    { date: schedule.festivalStartDate, label: '방문' },
    { date: schedule.festivalEndDate || schedule.scheduleEndDate, label: '종료' },
  ].filter((t) => t.date);

  const totalDays = Math.max(1, getDaysDiff(schedule.base, maxDate));

  return (
    <div className="space-y-4">
      <p className="text-[11px] text-slate-500 font-light">
        <strong className="text-slate-400 font-medium">달력</strong>에 마일스톤이 표시됩니다.{' '}
        <span className="text-slate-600">노랑 계열</span>=명단·교체 구간,{' '}
        <span className="text-fuchsia-400/80">보라 계열</span>=개별 안내,{' '}
        <span className="text-rose-400/80">분홍</span>=방문 구간입니다.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {months.map((m) => (
          <VisitScheduleMonthGrid
            key={`${m.year}-${m.monthIndex}`}
            year={m.year}
            monthIndex={m.monthIndex}
            markersByDate={markers}
            rangeBgByDate={rangeBg}
          />
        ))}
      </div>

      <p className="text-[10px] text-slate-600 font-mono text-right">
        전체 약 {totalDays}일 · 스케줄 종료 {maxDate}
      </p>

      <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2 border-t border-white/10">
        {milestones.map((m, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-slate-500 uppercase tracking-wider text-[10px]">{m.label}</span>
            <span className="text-white font-mono text-sm">
              {m.end ? `${formatShort(m.date)}–${formatShort(m.end)}` : formatShort(m.date)}
            </span>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2">주요 일정 눈금</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-400 font-mono">
          {ticks.map((t, i) => (
            <span key={i}>
              <span className="text-slate-600">{t.label}</span> {t.date}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- 가이드라인 세팅 블록 ---
const GuidelineSettingBlock = ({
  status = 'pending',
  notionGuidelineUrl = null,
  notionGuidelineTitle = null,
  notionGuidelineDescription = null,
}) => {
  if (notionGuidelineUrl) {
    const gTitle = notionGuidelineTitle || '콘텐츠 가이드라인 (Notion)';
    const gDesc =
      notionGuidelineDescription ||
      'Troubless GLASS GLOW+ PDRN COLLAGEN SUNSCREEN 캠페인용 가이드를 Notion에서 확인해 주세요.';
    return (
      <div className="rounded-2xl border p-6 bg-emerald-500/10 border-emerald-500/20">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
            <FileText size={24} className="text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-lg text-emerald-400">{gTitle}</h4>
            <p className="text-slate-400 text-sm mt-1 font-light">{gDesc}</p>
            <a
              href={notionGuidelineUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2.5 rounded-xl bg-white/10 border border-emerald-500/30 text-emerald-200 font-bold text-sm hover:bg-white/15 transition-colors break-all"
            >
              <ExternalLink size={16} className="shrink-0" /> Notion에서 가이드라인 열기
            </a>
            <p className="text-[10px] text-slate-500 mt-3 uppercase tracking-widest">
              가이드 품질 관리: 부적절·과도한 요청 시 피드백 및 수정 요청이 있을 수 있습니다.
            </p>
          </div>
        </div>
      </div>
    );
  }
  const statusConfig = {
    pending: { label: '가이드라인 대기 중', desc: '캠페인 시작 시 바로 받기 어려우면 1~2주 내 공유 요청드립니다.', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    shared: { label: '가이드라인 공유 완료', desc: '담당자가 브랜드 가이드라인을 공유했습니다. 확인 후 피드백이 있으면 요청해 주세요.', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    feedback: { label: '피드백 반영 중', desc: '부적절하거나 어려운 가이드는 수정 후 재공유됩니다.', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  };
  const c = statusConfig[status] || statusConfig.pending;
  return (
    <div className={`rounded-2xl border p-6 ${c.bg} ${c.border}`}>
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
          <FileText size={24} className={c.color} />
        </div>
        <div>
          <h4 className={`font-bold text-lg ${c.color}`}>{c.label}</h4>
          <p className="text-slate-400 text-sm mt-1 font-light">{c.desc}</p>
          <p className="text-[10px] text-slate-500 mt-3 uppercase tracking-widest">가이드 품질 관리: 부적절·과도한 요청 시 피드백 및 수정 요청이 있을 수 있습니다.</p>
        </div>
      </div>
    </div>
  );
};

// --- 룰 안내 (툴팁/고정 안내) ---
const ScheduleRulesCallout = ({ shippingType }) => (
  <div className="bg-slate-800/50 border border-white/10 rounded-2xl p-5">
    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">일정 룰 안내</h5>
    <ul className="text-sm text-slate-400 space-y-2 font-light">
      <li>• <strong className="text-slate-300">업로드 시작:</strong> {shippingType === 'us' ? '미국 내 배송 시 배송일 기준 3일 후' : '국내 배송 시 배송일 기준 10일 후'}</li>
      <li>• <strong className="text-slate-300">업로드 마감:</strong> 배송일 기준 30일 이내 (인플루언서 단위)</li>
      <li>• <strong className="text-slate-300">전체 트래킹:</strong> 업로드 시작일로부터 90일</li>
      <li>• <strong className="text-slate-300">리스트 교체:</strong> 명단 납품 후 3영업일 이내 1회, 전체 30%까지</li>
    </ul>
  </div>
);

const ScheduleRulesCalloutVisit = () => (
  <div className="bg-slate-800/50 border border-white/10 rounded-2xl p-5">
    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Visit Content 일정 템플릿</h5>
    <ul className="text-sm text-slate-400 space-y-2 font-light">
      <li>• <strong className="text-slate-300">인플루언서 모집:</strong> 착수일 기준 D+3일까지 (~명단 전일)</li>
      <li>• <strong className="text-slate-300">명단 납품:</strong> 착수일 기준 D+4일 (행사 일정에 맞춘 Visit 단축 룰)</li>
      <li>• <strong className="text-slate-300">콘텐츠 가이드 제작·소통:</strong> 명단 납품일 + 7일</li>
      <li>• <strong className="text-slate-300">재공지:</strong> D-day 3주 전, 2주 전</li>
      <li>• <strong className="text-slate-300">개별 일정 안내:</strong> D-day 1주 전</li>
      <li>• <strong className="text-slate-300">방문:</strong> D-day</li>
    </ul>
  </div>
);

const VisitScheduleSummary = () => (
  <div className="bg-white/5 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white/10">
    <h4 className="font-black text-white text-lg mb-3 flex items-center gap-2">
      <Plane size={20} className="text-cyan-400" />
      Visit 진행 일정 요약
    </h4>
    <ul className="text-sm text-slate-400 space-y-2 font-light">
      <li>• 착수 후 단축 모집·확정 → 명단 납품 → 리스트 교체(3영업일)</li>
      <li>• 가이드 제작·소통 → 1·2차 재공지</li>
      <li>• 인플루언서 개별 일정 안내 구간</li>
      <li>• 방문(현장) 일정 구간 — 행사·촬영 일정은 별도 캘린더와 함께 확인해 주세요</li>
    </ul>
  </div>
);

function adminEditorIsVisitPlan(campaign) {
  return campaign?.plan && String(campaign.plan).toLowerCase().includes('visit');
}

function AdminCampaignScheduleEditor({ campaign, onSaved, className = '' }) {
  const cid = campaign?.id;
  const canEdit = cid && CAMPAIGN_ROW_UUID_RE.test(cid);
  const isVisit = adminEditorIsVisitPlan(campaign);

  const [fields, setFields] = useState(() => ({
    schedule_list_delivery_date: campaign?.schedule_list_delivery_date || '',
    schedule_shipping_date: campaign?.schedule_shipping_date || '',
    schedule_upload_start_date: campaign?.schedule_upload_start_date || '',
    schedule_upload_deadline_date: campaign?.schedule_upload_deadline_date || '',
    schedule_tracking_end_date: campaign?.schedule_tracking_end_date || '',
    schedule_visit_content_guide_date: campaign?.schedule_visit_content_guide_date || '',
    schedule_visit_reannounce_1_date: campaign?.schedule_visit_reannounce_1_date || '',
    schedule_visit_reannounce_2_date: campaign?.schedule_visit_reannounce_2_date || '',
    schedule_visit_notice_start_date: campaign?.schedule_visit_notice_start_date || '',
    schedule_visit_notice_end_date: campaign?.schedule_visit_notice_end_date || '',
    schedule_visit_festival_start_date: campaign?.schedule_visit_festival_start_date || '',
    schedule_visit_festival_end_date: campaign?.schedule_visit_festival_end_date || '',
  }));
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    setFields({
      schedule_list_delivery_date: campaign?.schedule_list_delivery_date || '',
      schedule_shipping_date: campaign?.schedule_shipping_date || '',
      schedule_upload_start_date: campaign?.schedule_upload_start_date || '',
      schedule_upload_deadline_date: campaign?.schedule_upload_deadline_date || '',
      schedule_tracking_end_date: campaign?.schedule_tracking_end_date || '',
      schedule_visit_content_guide_date: campaign?.schedule_visit_content_guide_date || '',
      schedule_visit_reannounce_1_date: campaign?.schedule_visit_reannounce_1_date || '',
      schedule_visit_reannounce_2_date: campaign?.schedule_visit_reannounce_2_date || '',
      schedule_visit_notice_start_date: campaign?.schedule_visit_notice_start_date || '',
      schedule_visit_notice_end_date: campaign?.schedule_visit_notice_end_date || '',
      schedule_visit_festival_start_date: campaign?.schedule_visit_festival_start_date || '',
      schedule_visit_festival_end_date: campaign?.schedule_visit_festival_end_date || '',
    });
    setMsg('');
  }, [
    cid,
    campaign?.schedule_list_delivery_date,
    campaign?.schedule_shipping_date,
    campaign?.schedule_upload_start_date,
    campaign?.schedule_upload_deadline_date,
    campaign?.schedule_tracking_end_date,
    campaign?.schedule_visit_content_guide_date,
    campaign?.schedule_visit_reannounce_1_date,
    campaign?.schedule_visit_reannounce_2_date,
    campaign?.schedule_visit_notice_start_date,
    campaign?.schedule_visit_notice_end_date,
    campaign?.schedule_visit_festival_start_date,
    campaign?.schedule_visit_festival_end_date,
    campaign?.plan,
  ]);

  if (!canEdit) return null;

  const setField = (key) => (e) => {
    setFields((f) => ({ ...f, [key]: e.target.value }));
    setMsg('');
  };

  const trimOrNull = (v) => (v && String(v).trim() ? String(v).trim() : null);

  const postSchedule = async (body) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) {
      alert('로그인 세션이 없습니다.');
      return;
    }
    setSaving(true);
    setMsg('');
    try {
      const res = await fetch(`${window.location.origin}/api/admin/campaign-schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `저장 실패 (${res.status})`);
      onSaved?.(cid, data.schedule || {});
      setMsg('저장되었습니다.');
    } catch (e) {
      setMsg(e?.message || String(e));
    } finally {
      setSaving(false);
    }
  };

  const handleSave = () => {
    const body = {
      campaign_id: cid,
      schedule_list_delivery_date: trimOrNull(fields.schedule_list_delivery_date),
    };
    if (isVisit) {
      Object.assign(body, {
        schedule_visit_content_guide_date: trimOrNull(fields.schedule_visit_content_guide_date),
        schedule_visit_reannounce_1_date: trimOrNull(fields.schedule_visit_reannounce_1_date),
        schedule_visit_reannounce_2_date: trimOrNull(fields.schedule_visit_reannounce_2_date),
        schedule_visit_notice_start_date: trimOrNull(fields.schedule_visit_notice_start_date),
        schedule_visit_notice_end_date: trimOrNull(fields.schedule_visit_notice_end_date),
        schedule_visit_festival_start_date: trimOrNull(fields.schedule_visit_festival_start_date),
        schedule_visit_festival_end_date: trimOrNull(fields.schedule_visit_festival_end_date),
      });
    } else {
      Object.assign(body, {
        schedule_shipping_date: trimOrNull(fields.schedule_shipping_date),
        schedule_upload_start_date: trimOrNull(fields.schedule_upload_start_date),
        schedule_upload_deadline_date: trimOrNull(fields.schedule_upload_deadline_date),
        schedule_tracking_end_date: trimOrNull(fields.schedule_tracking_end_date),
      });
    }
    postSchedule(body);
  };

  const handleClearAll = () => {
    if (!window.confirm('저장된 수동 일정을 모두 지우고 템플릿 일정만 쓰시겠습니까?')) return;
    postSchedule({
      campaign_id: cid,
      schedule_list_delivery_date: null,
      schedule_shipping_date: null,
      schedule_upload_start_date: null,
      schedule_upload_deadline_date: null,
      schedule_tracking_end_date: null,
      schedule_visit_content_guide_date: null,
      schedule_visit_reannounce_1_date: null,
      schedule_visit_reannounce_2_date: null,
      schedule_visit_notice_start_date: null,
      schedule_visit_notice_end_date: null,
      schedule_visit_festival_start_date: null,
      schedule_visit_festival_end_date: null,
    });
  };

  const row = (key, label) => (
    <label key={key} className="flex flex-col gap-1.5 text-sm">
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</span>
      <input
        type="date"
        value={fields[key]}
        onChange={setField(key)}
        className="px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-white text-sm focus:outline-none focus:border-cyan-500/50"
      />
    </label>
  );

  return (
    <div className={`rounded-2xl border border-amber-500/25 bg-amber-500/5 p-6 ${className}`}>
      <h5 className="text-sm font-bold text-amber-100 mb-2 flex items-center gap-2">
        <Settings size={16} className="text-amber-400 shrink-0" />
        {isVisit ? '방문·행사형 캠페인 일정 직접 넣기' : '일반 캠페인 일정 직접 넣기'}
      </h5>
      <p className="text-xs text-slate-400 mb-4 leading-relaxed">
        {isVisit
          ? '방문 일정이 있는 캠페인입니다. 칸을 비우면 자동으로 잡힌 일정을 따르고, 날짜를 넣으면 그날짜가 고객 화면에 그대로 반영됩니다.'
          : '칸을 비우면 자동 일정을 따릅니다. 날짜를 넣으면 그 항목만 수동으로 고정됩니다.'}{' '}
        <span className="text-amber-200/90">운영 권한이 있는 계정만 저장할 수 있습니다.</span>
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        {row('schedule_list_delivery_date', '명단 납품')}
        {isVisit ? (
          <>
            {row('schedule_visit_content_guide_date', '콘텐츠 가이드 제작·소통')}
            {row('schedule_visit_reannounce_1_date', '인플루언서 재공지 1차')}
            {row('schedule_visit_reannounce_2_date', '인플루언서 재공지 2차')}
            {row('schedule_visit_notice_start_date', '개별 일정 안내 시작')}
            {row('schedule_visit_notice_end_date', '개별 일정 안내 종료')}
            {row('schedule_visit_festival_start_date', '방문 시작')}
            {row('schedule_visit_festival_end_date', '방문 종료')}
          </>
        ) : (
          <>
            {row('schedule_shipping_date', '배송일')}
            {row('schedule_upload_start_date', '업로드 시작')}
            {row('schedule_upload_deadline_date', '업로드 마감')}
            {row('schedule_tracking_end_date', '트래킹 종료 (미입력 시 업로드 시작+90일)')}
          </>
        )}
      </div>
      <div className="flex flex-wrap gap-3 items-center">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 rounded-xl font-bold text-sm bg-amber-500 text-slate-900 hover:bg-amber-400 disabled:opacity-50 transition-colors"
        >
          {saving ? '저장 중…' : '일정 저장'}
        </button>
        <button
          type="button"
          onClick={handleClearAll}
          disabled={saving}
          className="px-5 py-2.5 rounded-xl font-bold text-sm bg-white/10 border border-white/15 text-slate-200 hover:bg-white/15 disabled:opacity-50 transition-colors"
        >
          템플릿만 사용 (전체 초기화)
        </button>
        {msg && (
          <span className={`text-xs ${msg.includes('저장되었') ? 'text-emerald-400' : 'text-red-400'}`}>{msg}</span>
        )}
      </div>
    </div>
  );
}

function AdminCustomPaymentOffersPanel() {
  const [listLoading, setListLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [offers, setOffers] = useState([]);
  const [form, setForm] = useState({
    customer_email: '',
    title: '',
    seeding_qty: '150',
    seeding_unit_price: '35000',
    seeding_line_label: '시딩(건당)',
    visit_qty: '0',
    visit_unit_price: '0',
    visit_line_label: '방문형 시딩(건당)',
    vat_rate: '0.1',
    note: '',
  });

  const loadList = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) return;
    setListLoading(true);
    setErr('');
    try {
      const res = await fetch(`${window.location.origin}/api/admin/custom-payment-offers?limit=200`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `목록 실패 (${res.status})`);
      setOffers(data.offers || []);
    } catch (e) {
      setErr(e?.message || String(e));
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    loadList();
  }, []);

  const previewTotals = useMemo(() => {
    const sq = Number(form.seeding_qty) || 0;
    const su = Number(form.seeding_unit_price) || 0;
    const vq = Number(form.visit_qty) || 0;
    const vu = Number(form.visit_unit_price) || 0;
    if (!((sq > 0 && su > 0) || (vq > 0 && vu > 0))) return null;
    return computeDbOfferTotals({
      seeding_qty: form.seeding_qty,
      seeding_unit_price: form.seeding_unit_price,
      visit_qty: form.visit_qty,
      visit_unit_price: form.visit_unit_price,
      seeding_line_label: form.seeding_line_label,
      visit_line_label: form.visit_line_label,
      vat_rate: form.vat_rate,
    });
  }, [form]);

  const displayOffers = useMemo(() => {
    const em = CUSTOM_OFFER_FRAMELESS_EMAIL.toLowerCase();
    const hasDbForFrameless = offers.some((o) => String(o.customer_email || '').toLowerCase().trim() === em);
    if (hasDbForFrameless) return offers.map((o) => ({ ...o, is_builtin: false }));
    const builtin = {
      id: CUSTOM_OFFER_FRAMELESS_ID,
      customer_email: CUSTOM_OFFER_FRAMELESS_EMAIL,
      title: 'The Frameless 맞춤 견적 (시스템에 고정된 링크)',
      expected_total: getFramelessOfferTotals().total,
      is_active: true,
      is_builtin: true,
    };
    return [builtin, ...offers.map((o) => ({ ...o, is_builtin: false }))];
  }, [offers]);

  const setField = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setMsg('');
    setErr('');
  };

  const handleCreate = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) {
      alert('로그인 세션이 없습니다.');
      return;
    }
    setSaving(true);
    setErr('');
    setMsg('');
    try {
      const res = await fetch(`${window.location.origin}/api/admin/custom-payment-offers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          customer_email: form.customer_email.trim(),
          title: form.title.trim() || undefined,
          seeding_qty: Number(form.seeding_qty),
          seeding_unit_price: Number(form.seeding_unit_price),
          visit_qty: Number(form.visit_qty),
          visit_unit_price: Number(form.visit_unit_price),
          seeding_line_label: form.seeding_line_label,
          visit_line_label: form.visit_line_label,
          vat_rate: Number(form.vat_rate),
          note: form.note.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || '생성 실패');
      const path = data.offer?.checkout_path || `/checkout?offer=${data.offer?.id}`;
      const fullUrl = `${window.location.origin}${path}`;
      setMsg(`생성됨. 고객에게 결제 링크를 전달하세요: ${fullUrl}`);
      await loadList();
    } catch (e) {
      setErr(e?.message || String(e));
    } finally {
      setSaving(false);
    }
  };

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('클립보드에 복사했습니다.');
    } catch {
      alert('복사에 실패했습니다. 링크를 직접 선택해 복사해 주세요.');
    }
  };

  const deactivate = async (id) => {
    if (!window.confirm('이 결제창을 비활성화할까요? (고객은 더 이상 결제할 수 없습니다)')) return;
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) return;
    try {
      const res = await fetch(`${window.location.origin}/api/admin/custom-payment-offers`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id, is_active: false }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || '비활성화 실패');
      await loadList();
    } catch (e) {
      alert(e?.message || String(e));
    }
  };

  return (
    <div className="bg-white/[0.03] border border-emerald-500/25 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-white/10 bg-emerald-500/[0.08]">
        <h3 className="text-sm font-bold text-emerald-100 flex items-center gap-2">
          <CreditCard size={18} className="text-emerald-400" /> 고객 전용 결제 링크 만들기
        </h3>
        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
          아래에 고객 이메일과 금액을 적은 뒤, <strong className="text-slate-200">미리보기</strong>로 확인하고 맨 아래 버튼으로 생성합니다. The Frameless 고정 견적은 목록 맨 위에 항상 표시됩니다.
        </p>
      </div>
      <div className="p-5 space-y-6">
          <p className="text-xs text-slate-400 leading-relaxed">
            고객이 로그인할 때 쓰는 <strong className="text-slate-200">이메일</strong>을 넣으면, 그 사람 대시보드에만 결제 카드가 보입니다. 건수·단가는 견적에 맞게 적고, 생성된 링크를 복사해내면 됩니다.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              value={form.customer_email}
              onChange={setField('customer_email')}
              placeholder="고객 이메일 *"
              className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white md:col-span-2"
            />
            <input
              value={form.title}
              onChange={setField('title')}
              placeholder="표시 제목 (선택)"
              className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white md:col-span-2"
            />
            <input
              value={form.seeding_qty}
              onChange={setField('seeding_qty')}
              placeholder="시딩 수량"
              className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white"
            />
            <input
              value={form.seeding_unit_price}
              onChange={setField('seeding_unit_price')}
              placeholder="시딩 단가(원, 공급가)"
              className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white"
            />
            <input
              value={form.seeding_line_label}
              onChange={setField('seeding_line_label')}
              placeholder="시딩 라인 표시명"
              className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white md:col-span-2"
            />
            <input
              value={form.visit_qty}
              onChange={setField('visit_qty')}
              placeholder="방문형 시딩 수량 (없으면 0)"
              className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white"
            />
            <input
              value={form.visit_unit_price}
              onChange={setField('visit_unit_price')}
              placeholder="방문 단가(원, 공급가)"
              className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white"
            />
            <input
              value={form.visit_line_label}
              onChange={setField('visit_line_label')}
              placeholder="방문 라인 표시명"
              className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white md:col-span-2"
            />
            <input
              value={form.vat_rate}
              onChange={setField('vat_rate')}
              placeholder="세금 비율 (보통 0.1 = 10%)"
              className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white"
            />
            <input
              value={form.note}
              onChange={setField('note')}
              placeholder="우리 팀 메모 (고객에게 안 보임)"
              className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white md:col-span-2"
            />
          </div>

          {previewTotals ? (
            <div className="rounded-xl border border-cyan-500/35 bg-cyan-950/40 p-4 space-y-2">
              <p className="text-xs font-bold text-cyan-200">생성 전 미리보기 (고객 결제 화면과 같은 방식으로 계산)</p>
              <ul className="text-sm text-slate-300 space-y-1.5">
                {(Number(form.seeding_qty) || 0) > 0 && (
                  <li className="flex justify-between gap-4 flex-wrap">
                    <span>
                      {form.seeding_line_label || '시딩(건당)'} × {Number(form.seeding_qty) || 0}건 · 공급가
                    </span>
                    <span className="font-mono text-white">
                      {((Number(form.seeding_unit_price) || 0) * (Number(form.seeding_qty) || 0)).toLocaleString()}원
                    </span>
                  </li>
                )}
                {(Number(form.visit_qty) || 0) > 0 && (
                  <li className="flex justify-between gap-4 flex-wrap">
                    <span>
                      {form.visit_line_label || '방문형 시딩(건당)'} × {Number(form.visit_qty) || 0}건 · 공급가
                    </span>
                    <span className="font-mono text-white">
                      {((Number(form.visit_unit_price) || 0) * (Number(form.visit_qty) || 0)).toLocaleString()}원
                    </span>
                  </li>
                )}
                <li className="flex justify-between gap-4 border-t border-white/10 pt-2 text-sky-200/90">
                  <span>부가세</span>
                  <span className="font-mono">{previewTotals.vat.toLocaleString()}원</span>
                </li>
                <li className="flex justify-between gap-4 text-base font-black text-white">
                  <span>결제 예정(VAT 포함)</span>
                  <span className="text-cyan-300">{previewTotals.total.toLocaleString()}원</span>
                </li>
              </ul>
            </div>
          ) : (
            <p className="text-xs text-slate-500">시딩 또는 방문형 중 한 줄 이상에 수량·단가를 넣으면 여기에 금액 미리보기가 뜹니다.</p>
          )}

          <div className="flex flex-wrap gap-2 items-center">
            <button
              type="button"
              onClick={handleCreate}
              disabled={saving || !form.customer_email.trim() || !previewTotals}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-sm font-bold text-white"
            >
              {saving ? '생성 중…' : '결제창 생성'}
            </button>
            <button
              type="button"
              onClick={loadList}
              disabled={listLoading}
              className="px-4 py-2.5 rounded-xl bg-white/10 border border-white/15 text-sm text-slate-200"
            >
              목록 새로고침
            </button>
          </div>
          {err && <p className="text-red-400 text-sm">{err}</p>}
          {msg && <p className="text-emerald-300 text-sm break-all">{msg}</p>}
          <div className="rounded-xl border border-white/10 overflow-hidden">
            <p className="text-xs font-bold text-slate-400 px-3 py-2 bg-[#0b1327] border-b border-white/10">만들어 둔 링크 목록</p>
            <table className="w-full text-xs">
              <thead className="bg-[#0b1327] text-slate-400 border-b border-white/10">
                <tr>
                  <th className="text-left px-3 py-2">고객</th>
                  <th className="text-right px-3 py-2">합계(세금 포함)</th>
                  <th className="text-center px-3 py-2">상태</th>
                  <th className="text-right px-3 py-2">동작</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {displayOffers.map((o) => {
                  const link = o.is_builtin
                    ? `${window.location.origin}/checkout?customOffer=${encodeURIComponent(CUSTOM_OFFER_FRAMELESS_ID)}`
                    : `${window.location.origin}/checkout?offer=${o.id}`;
                  return (
                    <tr key={o.is_builtin ? `builtin-${o.id}` : o.id} className="hover:bg-white/[0.03]">
                      <td className="px-3 py-2 text-slate-200">
                        {o.is_builtin ? (
                          <p className="text-[10px] text-amber-200/90 font-bold mb-1">시스템 고정 (DB 행 아님)</p>
                        ) : (
                          <>
                            <p className="text-[10px] text-slate-500 mb-0.5">관리 번호</p>
                            <p className="font-mono text-[10px] text-slate-500 break-all">{o.id}</p>
                          </>
                        )}
                        <p className="mt-1">{o.customer_email}</p>
                        {o.title ? <p className="text-[10px] text-slate-500 mt-0.5">{o.title}</p> : null}
                      </td>
                      <td className="px-3 py-2 text-right text-white font-mono">
                        {typeof o.expected_total === 'number' ? o.expected_total.toLocaleString() : '—'}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {o.is_builtin ? (
                          <span className="text-cyan-300">고정</span>
                        ) : o.is_active ? (
                          <span className="text-emerald-400">활성</span>
                        ) : (
                          <span className="text-slate-500">비활성</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right space-y-1">
                        <button type="button" onClick={() => copyText(link)} className="block w-full text-cyan-300 hover:underline">
                          결제 링크 복사
                        </button>
                        {!o.is_builtin && o.is_active ? (
                          <button type="button" onClick={() => deactivate(o.id)} className="block w-full text-amber-400 hover:underline">
                            비활성화
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
      </div>
    </div>
  );
}

/** 최근 주문 조회 · 입금/환불/취소 상태 및 금액 수정 */
function AdminOpsToolsPanel({ onFocusOrderNumber }) {
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orderErr, setOrderErr] = useState('');
  const [editingOrderNumber, setEditingOrderNumber] = useState(null);
  const [editStatus, setEditStatus] = useState('paid');
  const [editPlanPrice, setEditPlanPrice] = useState('');
  const [orderSaveMsg, setOrderSaveMsg] = useState('');

  const loadOrders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) return;
    setLoadingOrders(true);
    setOrderErr('');
    try {
      const res = await fetch(`${window.location.origin}/api/admin/recent-orders?limit=80`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `조회 실패 (${res.status})`);
      setOrders(data.orders || []);
    } catch (e) {
      setOrderErr(e?.message || String(e));
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const startEditOrder = (o) => {
    setEditingOrderNumber(o.order_number);
    setEditStatus(o.status || 'paid');
    setEditPlanPrice(String(o.plan_price ?? ''));
    setOrderSaveMsg('');
  };

  const saveOrderPatch = async () => {
    if (!editingOrderNumber) return;
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) return;
    setOrderSaveMsg('');
    try {
      const body = { order_number: editingOrderNumber, status: editStatus };
      if (editPlanPrice.trim() !== '') {
        body.plan_price = Number(editPlanPrice);
        if (!Number.isFinite(body.plan_price)) {
          setOrderSaveMsg('금액은 숫자로 입력해 주세요.');
          return;
        }
      }
      const res = await fetch(`${window.location.origin}/api/admin/order-update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || '저장 실패');
      setOrderSaveMsg('저장되었습니다.');
      await loadOrders();
    } catch (e) {
      setOrderSaveMsg(e?.message || String(e));
    }
  };

  return (
    <div className="mb-6 bg-white/[0.03] border border-amber-500/25 rounded-2xl overflow-hidden">
      <div className="px-6 py-8 sm:px-10 sm:py-10 border-b border-amber-500/20 bg-gradient-to-b from-amber-500/[0.12] to-transparent text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400/40 mb-4 mx-auto">
          <ClipboardList size={28} className="text-amber-300" />
        </div>
        <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">최근 주문 한눈에 보기</h3>
        <p className="text-sm text-slate-400 mt-3 max-w-xl mx-auto leading-relaxed">
          입금 대기, 결제 완료, 환불, 취소 상태를 여기서 바로 고칠 수 있습니다. 금액이 잘못 적혀 있으면 숫자만 고쳐 저장하면 됩니다.
        </p>
        <button
          type="button"
          onClick={loadOrders}
          disabled={loadingOrders}
          className="mt-5 px-5 py-2.5 rounded-xl bg-amber-600/90 hover:bg-amber-500 text-sm font-bold text-white disabled:opacity-50"
        >
          {loadingOrders ? '불러오는 중…' : '목록 새로고침'}
        </button>
      </div>
      <div className="p-5 sm:p-8 max-w-5xl mx-auto">
        {orderErr && <p className="text-red-400 text-sm mb-4 text-center">{orderErr}</p>}
        <div className="rounded-xl border border-white/10 overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-[#0b1327] text-slate-400 border-b border-white/10">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">주문번호</th>
                <th className="text-left px-4 py-3 font-semibold">이메일</th>
                <th className="text-right px-4 py-3 font-semibold">금액</th>
                <th className="text-center px-4 py-3 font-semibold">상태</th>
                <th className="text-right px-4 py-3 font-semibold">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {orders.map((o) => (
                <tr key={o.order_number} className="hover:bg-white/[0.03]">
                  <td className="px-4 py-3 font-mono text-slate-200">{o.order_number}</td>
                  <td className="px-4 py-3 text-slate-400 break-all">{o.email}</td>
                  <td className="px-4 py-3 text-right text-white font-medium">{Number(o.plan_price || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-center text-slate-200">{ORDER_PAYMENT_STATUS_KO[o.status] || o.status}</td>
                  <td className="px-4 py-3 text-right space-y-1">
                    {onFocusOrderNumber ? (
                      <button
                        type="button"
                        className="block w-full text-cyan-300 hover:underline text-xs font-semibold"
                        onClick={() => onFocusOrderNumber(o.order_number)}
                      >
                        위 캠페인 줄에서 찾기
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="block w-full text-amber-300 hover:underline text-xs font-semibold"
                      onClick={() => startEditOrder(o)}
                    >
                      상태·금액 편집
                    </button>
                  </td>
                </tr>
              ))}
              {!loadingOrders && orders.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                    주문이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {editingOrderNumber && (
          <div className="mt-6 p-5 rounded-xl border border-amber-500/30 bg-amber-500/[0.08] space-y-4 max-w-xl mx-auto">
            <p className="text-xs text-amber-100 font-mono text-center">{editingOrderNumber}</p>
            <div className="flex flex-wrap gap-3 items-center justify-center">
              <label className="text-xs text-slate-400 font-semibold">결제 상태</label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-sm text-white"
              >
                <option value="paid" className="bg-slate-900">결제 완료</option>
                <option value="pending_payment" className="bg-slate-900">입금 대기</option>
                <option value="refunded" className="bg-slate-900">환불됨</option>
                <option value="cancelled" className="bg-slate-900">취소됨</option>
              </select>
              <label className="text-xs text-slate-400 font-semibold">결제 금액(원)</label>
              <input
                value={editPlanPrice}
                onChange={(e) => setEditPlanPrice(e.target.value)}
                className="w-32 px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-sm text-white"
              />
              <button
                type="button"
                onClick={saveOrderPatch}
                className="px-4 py-2 rounded-lg bg-amber-600 text-sm font-bold text-white"
              >
                저장
              </button>
              <button
                type="button"
                onClick={() => setEditingOrderNumber(null)}
                className="px-4 py-2 rounded-lg bg-white/10 text-sm text-slate-300"
              >
                닫기
              </button>
            </div>
            {orderSaveMsg && <p className="text-xs text-center text-slate-300">{orderSaveMsg}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

/** 대시보드 납품 업로드용 — 비개발자도 알아볼 수 있게 브랜드·제품·주문번호로 표시 */
const formatCampaignDeliveryLabel = (c) => {
  const brand = String(c?.brand_name || '').trim();
  const product = String(c?.product_name || '').trim();
  const parts = [];
  if (brand) parts.push(brand);
  if (product) parts.push(product);
  const core = parts.length > 0 ? parts.join(' / ') : '이름 없음';
  const ord = String(c?.order_number || '').trim();
  return ord ? `${core} · ${ord}` : core;
};

/** 엑셀 → admin_delivery_creators (캠페인 선택 필수) */
function AdminDeliveryExcelImportPanel({ campaigns = [], onApplied }) {
  const [importCampaignId, setImportCampaignId] = useState('');
  const [importCampaignFilter, setImportCampaignFilter] = useState('');
  const [mode, setMode] = useState('replace');
  const [omitVisitDate, setOmitVisitDate] = useState(false);
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [preview, setPreview] = useState(null);

  const readFileBase64 = (f) =>
    new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => {
        const s = r.result;
        if (typeof s !== 'string') {
          reject(new Error('파일 읽기 실패'));
          return;
        }
        const i = s.indexOf('base64,');
        resolve(i >= 0 ? s.slice(i + 7) : s);
      };
      r.onerror = () => reject(r.error || new Error('read error'));
      r.readAsDataURL(f);
    });

  const campaignsForImportSelect = useMemo(() => {
    const q = importCampaignFilter.trim().toLowerCase();
    const list = [...campaigns].sort((a, b) =>
      String(b.created_at || '').localeCompare(String(a.created_at || '')),
    );
    if (!q) return list;
    return list.filter((c) => {
      const hay = `${c.brand_name || ''} ${c.product_name || ''} ${c.order_number || ''} ${c.customer_email || ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [campaigns, importCampaignFilter]);

  const postImport = async (dryRun) => {
    setErr('');
    setMsg('');
    setPreview(null);
    if (!file) {
      setErr('엑셀 파일(.xlsx / .xls)을 선택해 주세요.');
      return;
    }
    const cid = importCampaignId.trim();
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRe.test(cid)) {
      setErr('「명단을 납품할 캠페인」에서 먼저 캠페인을 골라 주세요.');
      return;
    }
    setBusy(true);
    try {
      const b64 = await readFileBase64(file);
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setErr('로그인 세션이 없습니다.');
        return;
      }
      const payload = {
        file_base64: b64,
        mode,
        dry_run: dryRun,
        omit_visit_date: omitVisitDate,
        campaign_id: cid,
      };
      const res = await fetch(`${window.location.origin}/api/admin/delivery-creators-import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `요청 실패 (${res.status})`);
      if (dryRun) {
        setPreview(data);
        setMsg(
          `미리보기: 시트 "${data.sheet_name}" · 유효 ${data.valid_row_count}명 (원본 행 ${data.raw_row_count}). 확인 후 아래 「시스템에 반영」을 누르세요.`,
        );
      } else {
        setPreview(null);
        const picked = campaigns.find((x) => x.id === data.campaign_id);
        const name = picked ? formatCampaignDeliveryLabel(picked) : data.campaign_id;
        setMsg(`반영 완료: ${data.inserted}명 (${name}). 고객 대시보드 명단이 갱신됩니다.`);
        setFile(null);
        onApplied?.();
      }
    } catch (e) {
      setErr(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  const selectClass =
    'mt-2 w-full px-3 py-3 rounded-xl bg-slate-900 border border-slate-500 text-sm text-white font-medium shadow-inner focus:outline-none focus:ring-2 focus:ring-rose-400/50 focus:border-rose-400';

  return (
    <div className="mb-6 bg-white/[0.03] border border-rose-500/25 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-white/10 bg-rose-500/[0.1]">
        <h3 className="text-base font-black text-rose-100 flex items-center gap-2">
          <Upload size={18} className="text-rose-400 shrink-0" /> 엑셀로 명단 납품하기
        </h3>
        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
          ① 납품할 캠페인을 고르고 ② 엑셀을 선택한 뒤 ③ 미리보기 → ④ 반영 방식을 고르고 ⑤ 시스템에 반영합니다. 엑셀에는 <strong className="text-slate-200">이름</strong>과 국가·SNS 정보가 있으면 됩니다.
        </p>
      </div>
      <div className="p-5 sm:p-6 space-y-5">
        <div>
          <label className="block text-sm font-bold text-white">명단을 납품할 캠페인</label>
          <p className="text-xs text-slate-500 mt-1 mb-2">아래 검색창으로 목록을 좁힌 다음, 드롭다운에서 캠페인을 고릅니다.</p>
          <input
            type="search"
            value={importCampaignFilter}
            onChange={(e) => setImportCampaignFilter(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-slate-900/90 border border-slate-600 text-sm text-white placeholder-slate-500 mb-3"
            placeholder="브랜드, 제품명, 주문번호, 고객 이메일로 검색…"
          />
          <select
            value={importCampaignId}
            onChange={(e) => setImportCampaignId(e.target.value)}
            className={selectClass}
          >
            <option value="" className="bg-slate-900 text-slate-400">
              — 캠페인을 선택하세요 —
            </option>
            {campaignsForImportSelect.map((c) => {
              const label = formatCampaignDeliveryLabel(c);
              return (
                <option key={c.id} value={c.id} title={label} className="bg-slate-900 text-white">
                  {label}
                </option>
              );
            })}
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-white">반영 방식</label>
          <select value={mode} onChange={(e) => setMode(e.target.value)} className={selectClass}>
            <option value="replace" className="bg-slate-900 text-white">
              전체 갈아끼우기 (이 캠페인에 붙어 있던 명단을 지우고 엑셀 내용으로 다시 채움)
            </option>
            <option value="append" className="bg-slate-900 text-white">
              이어 붙이기 (기존 명단 뒤에 엑셀 행을 추가)
            </option>
          </select>
        </div>

        <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
          <input
            type="checkbox"
            checked={omitVisitDate}
            onChange={(e) => setOmitVisitDate(e.target.checked)}
            className="rounded border-slate-500 bg-slate-900"
          />
          방문 일정 열 없이 올리기 (DB에 visit_date 컬럼이 없을 때만)
        </label>

        <input
          type="file"
          accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
          onChange={(e) => {
            setFile(e.target.files?.[0] || null);
            setMsg('');
            setErr('');
            setPreview(null);
          }}
          className="block w-full text-sm text-slate-200 file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:bg-rose-600 file:text-white file:font-bold"
        />

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => postImport(true)}
            className="px-5 py-2.5 rounded-xl bg-slate-700 border border-slate-500 text-sm font-bold text-white hover:bg-slate-600 disabled:opacity-50"
          >
            미리보기만
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              if (
                !window.confirm(
                  mode === 'replace'
                    ? '선택한 캠페인의 기존 납품 명단을 모두 지우고 엑셀 내용으로 바꿉니다. 계속할까요?'
                    : '기존 명단 뒤에 엑셀 행을 이어 붙입니다. 계속할까요?',
                )
              )
                return;
              postImport(false);
            }}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-sm font-bold text-white disabled:opacity-50"
          >
            {busy ? '처리 중…' : '시스템에 반영'}
          </button>
        </div>
        {err && <p className="text-red-400 text-sm">{err}</p>}
        {msg && <p className="text-emerald-300/90 text-sm">{msg}</p>}
        {preview?.sample && (
          <div className="rounded-xl border border-white/10 bg-slate-950/80 p-3 text-[11px] text-slate-300 font-mono overflow-x-auto">
            <p className="text-slate-500 mb-2">샘플 (최대 3행)</p>
            <pre className="whitespace-pre-wrap break-all">{JSON.stringify(preview.sample, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

/** 관리자: 신규 캠페인 생성 / 선택 캠페인 삭제 (Auth 가입 이메일로 user_id 연결) */
function AdminCampaignLifecyclePanel({ selectedCampaign, onCreated, onDeleted }) {
  const [createBusy, setCreateBusy] = useState(false);
  const [createMsg, setCreateMsg] = useState('');
  const [createErr, setCreateErr] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [brandName, setBrandName] = useState('');
  const [productName, setProductName] = useState('');
  const [plan, setPlan] = useState('수동 생성');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [createStatus, setCreateStatus] = useState(CampaignStatus.PAYMENT_PENDING);
  const [targetCreators, setTargetCreators] = useState('');
  const [contentCount, setContentCount] = useState('');
  const [planPrice, setPlanPrice] = useState('');
  const [startDate, setStartDate] = useState('');

  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteErr, setDeleteErr] = useState('');
  const [deleteMsg, setDeleteMsg] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');

  const submitCreate = async () => {
    setCreateErr('');
    setCreateMsg('');
    const em = customerEmail.trim().toLowerCase();
    if (!em || !em.includes('@')) {
      setCreateErr('고객 가입 이메일(customer_email)을 입력해 주세요.');
      return;
    }
    setCreateBusy(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setCreateErr('로그인 세션이 없습니다.');
        return;
      }
      const payload = {
        customer_email: em,
        brand_name: brandName.trim() || null,
        product_name: productName.trim() || null,
        plan: plan.trim() || '수동 생성',
        customer_name: customerName.trim() || null,
        customer_phone: customerPhone.trim() || null,
        order_number: orderNumber.trim() || undefined,
        status: createStatus,
        target_creators: targetCreators.trim() === '' ? 0 : Number(targetCreators),
        content_count: contentCount.trim() === '' ? undefined : Number(contentCount),
        plan_price: planPrice.trim() === '' ? 0 : Number(planPrice),
        start_date: startDate.trim() || null,
      };
      const res = await fetch(`${window.location.origin}/api/admin/campaign-create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `요청 실패 (${res.status})`);
      const c = data.campaign;
      onCreated?.(c);
      setCreateMsg(`생성 완료: ${c?.order_number || ''} (고객 대시보드에 표시됩니다)`);
      setBrandName('');
      setProductName('');
      setCustomerName('');
      setCustomerPhone('');
      setOrderNumber('');
      setTargetCreators('');
      setContentCount('');
      setPlanPrice('');
      setStartDate('');
      setPlan('수동 생성');
      setCreateStatus(CampaignStatus.PAYMENT_PENDING);
    } catch (e) {
      setCreateErr(e?.message || String(e));
    } finally {
      setCreateBusy(false);
    }
  };

  const submitDelete = async () => {
    setDeleteErr('');
    setDeleteMsg('');
    if (!selectedCampaign?.id) {
      setDeleteErr('위 가로 목록에서 삭제할 캠페인을 먼저 선택해 주세요.');
      return;
    }
    const on = String(selectedCampaign.order_number || '').trim();
    if (!on) {
      setDeleteErr('이 캠페인에 주문번호가 없어 삭제 확인을 할 수 없습니다. 캠페인 정보 수정에서 주문번호를 넣은 뒤 다시 시도해 주세요.');
      return;
    }
    if (deleteConfirm.trim() !== on) {
      setDeleteErr(`확인 칸에 주문번호를 정확히 입력해 주세요: ${on}`);
      return;
    }
    if (
      !window.confirm(
        `캠페인을 영구 삭제합니다.\n주문번호: ${on}\n연결된 세팅 폼·납품 명단·크리에이터 행 등이 함께 삭제될 수 있습니다.\n계속할까요?`,
      )
    ) {
      return;
    }
    setDeleteBusy(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setDeleteErr('로그인 세션이 없습니다.');
        return;
      }
      const res = await fetch(`${window.location.origin}/api/admin/campaign-delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          campaign_id: selectedCampaign.id,
          confirm_order_number: deleteConfirm.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `요청 실패 (${res.status})`);
      onDeleted?.(selectedCampaign.id);
      setDeleteMsg('삭제했습니다.');
      setDeleteConfirm('');
    } catch (e) {
      setDeleteErr(e?.message || String(e));
    } finally {
      setDeleteBusy(false);
    }
  };

  const inputClass =
    'w-full px-3 py-2.5 rounded-xl bg-slate-900/90 border border-slate-600 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-400/40';

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-violet-500/30 bg-gradient-to-br from-slate-900/90 to-slate-950/95 overflow-hidden shadow-lg">
        <div className="px-5 py-4 border-b border-white/10 bg-violet-500/10">
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <PlusCircle size={20} className="text-violet-300 shrink-0" />
            신규 캠페인 만들기
          </h3>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            <strong className="text-slate-200">고객 가입 이메일</strong>은 반드시 Supabase Auth에 이미 있는 계정이어야 합니다. 없으면 고객에게 사이트 가입을 먼저 받은 뒤 생성하세요. 주문번호를 비우면 자동으로 부여됩니다.
          </p>
        </div>
        <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-violet-200 mb-1">고객 가입 이메일 *</label>
            <input className={inputClass} value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="예: client@company.com" type="email" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">브랜드명</label>
            <input className={inputClass} value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="브랜드" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">제품·캠페인명</label>
            <input className={inputClass} value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="제품 또는 캠페인 이름" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">플랜 표기</label>
            <input className={inputClass} value={plan} onChange={(e) => setPlan(e.target.value)} placeholder="수동 생성" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">진행 단계</label>
            <select
              value={createStatus}
              onChange={(e) => setCreateStatus(e.target.value)}
              className={`${inputClass} font-medium`}
            >
              {Object.values(CampaignStatus).map((s) => (
                <option key={s} value={s} className="bg-slate-900 text-white">
                  {CAMPAIGN_STATUS_KO[s] || s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">고객 담당자명</label>
            <input className={inputClass} value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">고객 연락처</label>
            <input className={inputClass} value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">주문번호 (선택)</label>
            <input className={inputClass} value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} placeholder="비우면 BS-날짜-랜덤 자동" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">목표 인원</label>
            <input className={inputClass} value={targetCreators} onChange={(e) => setTargetCreators(e.target.value)} placeholder="0" inputMode="numeric" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">콘텐츠 건수 (비우면 목표와 동일)</label>
            <input className={inputClass} value={contentCount} onChange={(e) => setContentCount(e.target.value)} placeholder="선택" inputMode="numeric" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-400 mb-1">계약 금액(원, 숫자)</label>
            <input className={inputClass} value={planPrice} onChange={(e) => setPlanPrice(e.target.value)} placeholder="0" inputMode="numeric" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-400 mb-1">시작일 (YYYY-MM-DD, 선택)</label>
            <input className={inputClass} value={startDate} onChange={(e) => setStartDate(e.target.value)} placeholder="2026-04-13" />
          </div>
        </div>
        <div className="px-5 sm:px-6 pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {createErr ? <p className="text-sm text-red-400 flex-1">{createErr}</p> : createMsg ? <p className="text-sm text-emerald-300/90 flex-1">{createMsg}</p> : <p className="text-xs text-slate-500 flex-1">저장 즉시 대시보드 목록에 나타납니다.</p>}
          <button
            type="button"
            disabled={createBusy}
            onClick={submitCreate}
            className="shrink-0 px-6 py-3 rounded-xl text-sm font-black bg-violet-600 hover:bg-violet-500 text-white border border-violet-400/40 disabled:opacity-50"
          >
            {createBusy ? '생성 중…' : '캠페인 생성'}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-rose-500/35 bg-slate-950/80 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10 bg-rose-950/40">
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <Trash2 size={20} className="text-rose-400 shrink-0" />
            선택한 캠페인 삭제
          </h3>
          <p className="text-xs text-slate-400 mt-2">
            위 가로 캠페인 줄에서 대상을 고른 뒤, 해당 캠페인의 <strong className="text-rose-200">주문번호를 확인 칸에 그대로 입력</strong>해야 삭제됩니다.
          </p>
        </div>
        <div className="p-5 sm:p-6 space-y-4">
          {selectedCampaign?.id ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-300">
              <p className="font-mono text-white">{selectedCampaign.order_number || '(주문번호 없음)'}</p>
              <p className="mt-1 text-slate-400">
                {formatCampaignDeliveryLabel(selectedCampaign)}
              </p>
            </div>
          ) : (
            <p className="text-sm text-slate-500">캠페인이 선택되지 않았습니다.</p>
          )}
          <div>
            <label className="block text-xs font-bold text-rose-200/90 mb-1">삭제 확인 — 주문번호 전체 입력</label>
            <input
              className={inputClass}
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="선택된 캠페인의 주문번호를 복사해 붙여넣기"
            />
          </div>
          {deleteErr ? <p className="text-sm text-red-400">{deleteErr}</p> : null}
          {deleteMsg ? <p className="text-sm text-emerald-300/90">{deleteMsg}</p> : null}
          <button
            type="button"
            disabled={deleteBusy || !selectedCampaign?.id}
            onClick={submitDelete}
            className="w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-black bg-rose-600 hover:bg-rose-500 text-white border border-rose-400/40 disabled:opacity-40"
          >
            {deleteBusy ? '삭제 중…' : '영구 삭제 실행'}
          </button>
        </div>
      </div>
    </div>
  );
}

const AdminCampaignQuickEditor = ({ campaign, onSaved }) => {
  const [fields, setFields] = useState({
    brand_name: '',
    product_name: '',
    plan: '',
    order_number: '',
    status: CampaignStatus.KICKOFF,
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    start_date: '',
    target_creators: '',
    matched_creators: '',
    plan_price: '',
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!campaign?.id) return;
    setFields({
      brand_name: campaign.brand_name || '',
      product_name: campaign.product_name || '',
      plan: campaign.plan || '',
      order_number: campaign.order_number || '',
      status: campaign.status || CampaignStatus.KICKOFF,
      customer_name: campaign.customer_name || '',
      customer_email: campaign.customer_email || '',
      customer_phone: campaign.customer_phone || '',
      start_date: campaign.start_date || '',
      target_creators: campaign.target_creators ?? '',
      matched_creators: campaign.matched_creators ?? '',
      plan_price: campaign.plan_price ?? '',
    });
    setMsg('');
  }, [campaign]);

  if (!campaign?.id) return null;

  const setField = (k, v) => setFields((prev) => ({ ...prev, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    setMsg('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setMsg('로그인 세션이 없어 저장할 수 없습니다.');
        return;
      }
      const payload = {
        campaign_id: campaign.id,
        brand_name: fields.brand_name,
        product_name: fields.product_name,
        plan: fields.plan,
        order_number: fields.order_number,
        status: fields.status,
        customer_name: fields.customer_name,
        customer_email: fields.customer_email,
        customer_phone: fields.customer_phone,
        start_date: fields.start_date || null,
        target_creators: fields.target_creators,
        matched_creators: fields.matched_creators,
        plan_price: fields.plan_price,
      };

      const res = await fetch(`${window.location.origin}/api/admin/campaign-update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(data?.error || '캠페인 저장에 실패했습니다.');
        return;
      }
      onSaved?.(campaign.id, data.campaign || payload);
      setMsg('저장했습니다. 새로고침 없이 반영됩니다.');
    } catch (e) {
      setMsg(`저장 실패: ${e?.message || e}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mb-10 p-6 md:p-8 rounded-2xl border border-cyan-500/25 bg-gradient-to-br from-slate-900/90 to-slate-950/95 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
        <div>
          <h3 className="text-lg font-black text-white">기본 정보·금액·진행 단계</h3>
          <p className="text-xs text-slate-400 mt-1">브랜드·제품·주문번호·고객 연락처·계약 금액·진행 단계를 바꿉니다. 일정·가이드는 아래 블록에서 수정합니다.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input value={fields.brand_name} onChange={(e) => setField('brand_name', e.target.value)} placeholder="브랜드명" className="px-4 py-2.5 bg-slate-900/80 border border-slate-600 rounded-xl text-sm text-white" />
        <input value={fields.product_name} onChange={(e) => setField('product_name', e.target.value)} placeholder="제품명" className="px-4 py-2.5 bg-slate-900/80 border border-slate-600 rounded-xl text-sm text-white" />
        <input value={fields.plan} onChange={(e) => setField('plan', e.target.value)} placeholder="플랜명" className="px-4 py-2.5 bg-slate-900/80 border border-slate-600 rounded-xl text-sm text-white" />
        <input
          value={fields.order_number}
          onChange={(e) => setField('order_number', e.target.value)}
          placeholder="주문번호"
          className="px-4 py-2.5 bg-slate-900/80 border border-slate-600 rounded-xl text-sm text-white font-mono"
        />
        <select value={fields.status} onChange={(e) => setField('status', e.target.value)} className="px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-xl text-sm text-white">
          {Object.values(CampaignStatus).map((s) => (
            <option key={s} value={s} className="bg-slate-900 text-white">
              {CAMPAIGN_STATUS_KO[s] || s}
            </option>
          ))}
        </select>
        <input value={fields.customer_name} onChange={(e) => setField('customer_name', e.target.value)} placeholder="고객 담당자명" className="px-4 py-2.5 bg-slate-900/80 border border-slate-600 rounded-xl text-sm text-white" />
        <input value={fields.customer_email} onChange={(e) => setField('customer_email', e.target.value)} placeholder="고객 이메일" className="px-4 py-2.5 bg-slate-900/80 border border-slate-600 rounded-xl text-sm text-white" />
        <input value={fields.customer_phone} onChange={(e) => setField('customer_phone', e.target.value)} placeholder="고객 연락처" className="px-4 py-2.5 bg-slate-900/80 border border-slate-600 rounded-xl text-sm text-white" />
        <input value={fields.start_date || ''} onChange={(e) => setField('start_date', e.target.value)} placeholder="시작일 (2026-04-13 형식)" className="px-4 py-2.5 bg-slate-900/80 border border-slate-600 rounded-xl text-sm text-white" />
        <input value={fields.target_creators} onChange={(e) => setField('target_creators', e.target.value)} placeholder="목표 인원" className="px-4 py-2.5 bg-slate-900/80 border border-slate-600 rounded-xl text-sm text-white" />
        <input value={fields.matched_creators} onChange={(e) => setField('matched_creators', e.target.value)} placeholder="매칭 인원" className="px-4 py-2.5 bg-slate-900/80 border border-slate-600 rounded-xl text-sm text-white" />
        <input value={fields.plan_price} onChange={(e) => setField('plan_price', e.target.value)} placeholder="계약 금액(숫자만, 원)" className="px-4 py-2.5 bg-slate-900/80 border border-slate-600 rounded-xl text-sm text-white md:col-span-2" />
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <p className={`text-xs ${msg.includes('실패') ? 'text-red-400' : 'text-slate-400'}`}>{msg || '저장을 누르면 바로 고객 화면에도 반영됩니다.'}</p>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 rounded-xl text-sm font-bold bg-cyan-600 hover:bg-cyan-500 border border-cyan-400/40 text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? '저장 중…' : '이 내용으로 저장'}
        </button>
      </div>
    </div>
  );
};

const AdminCampaignRuntimeSettingsEditor = ({ campaign, onSaved }) => {
  const [fields, setFields] = useState({
    linked_list_slug: '',
    notion_guideline_url: '',
    notion_guideline_title: '',
    notion_guideline_description: '',
    force_drop_complete_message: false,
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!campaign?.id) return;
    const runtime = campaign.admin_runtime_settings || {};
    setFields({
      linked_list_slug: runtime.linked_list_slug || '',
      notion_guideline_url: runtime.notion_guideline_url || '',
      notion_guideline_title: runtime.notion_guideline_title || '',
      notion_guideline_description: runtime.notion_guideline_description || '',
      force_drop_complete_message: !!runtime.force_drop_complete_message,
    });
    setMsg('');
  }, [campaign]);

  if (!campaign?.id) return null;
  const setField = (k, v) => setFields((prev) => ({ ...prev, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    setMsg('');
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setMsg('로그인 세션이 없어 저장할 수 없습니다.');
        return;
      }
      const payload = {
        campaign_id: campaign.id,
        linked_list_slug: fields.linked_list_slug || null,
        notion_guideline_url: fields.notion_guideline_url || null,
        notion_guideline_title: fields.notion_guideline_title || null,
        notion_guideline_description: fields.notion_guideline_description || null,
        force_drop_complete_message: !!fields.force_drop_complete_message,
      };
      const res = await fetch(`${window.location.origin}/api/admin/campaign-runtime-settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(data?.error || '런타임 설정 저장에 실패했습니다.');
        return;
      }
      onSaved?.(campaign.id, data.settings || null);
      setMsg('저장 완료: 즉시 대시보드에 반영됩니다.');
    } catch (e) {
      setMsg(`저장 실패: ${e?.message || e}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mb-10 p-6 md:p-8 rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-slate-900/90 to-slate-950/95 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
        <div>
          <h3 className="text-lg font-black text-white">가이드라인·레거시 납품 풀·드랍 확정 표시</h3>
          <p className="text-xs text-slate-400 mt-1">
            Notion 가이드 링크·제목·설명을 바꿉니다. 드랍 마감 시각은 명단 최초 전송일 기준으로 자동 계산되며, 아래 일정표에서 납품·업로드 등 날짜를 직접 덮어쓸 수 있습니다.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3">
        <input
          value={fields.linked_list_slug}
          onChange={(e) => setField('linked_list_slug', e.target.value)}
          placeholder="레거시 납품 풀 식별자 (예: BS-US-FARMSKIN). 엑셀 납품을 캠페인 UUID로만 하면 비워 두어도 됩니다"
          className="px-4 py-2.5 bg-slate-900/80 border border-slate-600 rounded-xl text-sm text-white"
        />
        <input
          value={fields.notion_guideline_url}
          onChange={(e) => setField('notion_guideline_url', e.target.value)}
          placeholder="콘텐츠 가이드라인 URL (https://...)"
          className="px-4 py-2.5 bg-slate-900/80 border border-slate-600 rounded-xl text-sm text-white"
        />
        <input
          value={fields.notion_guideline_title}
          onChange={(e) => setField('notion_guideline_title', e.target.value)}
          placeholder="가이드라인 제목 (선택)"
          className="px-4 py-2.5 bg-slate-900/80 border border-slate-600 rounded-xl text-sm text-white"
        />
        <textarea
          value={fields.notion_guideline_description}
          onChange={(e) => setField('notion_guideline_description', e.target.value)}
          placeholder="가이드라인 설명 (선택)"
          rows={3}
          className="px-4 py-2.5 bg-slate-900/80 border border-slate-600 rounded-xl text-sm text-white"
        />
        <label className="flex items-center gap-3 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={fields.force_drop_complete_message}
            onChange={(e) => setField('force_drop_complete_message', e.target.checked)}
            className="w-4 h-4 rounded border-white/10 bg-white/5 text-emerald-500"
          />
          이 캠페인은 인플루언서 드랍을 마쳤고 최종 명단이 확정된 상태로 표시
        </label>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <p className={`text-xs ${msg.includes('실패') ? 'text-red-400' : 'text-slate-400'}`}>
          {msg || '저장 즉시 고객 화면에도 같은 내용이 반영됩니다.'}
        </p>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest bg-emerald-600 hover:bg-emerald-500 border border-emerald-400/40 text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? '저장 중…' : '이 설정 저장'}
        </button>
      </div>
    </div>
  );
};

const KickoffView = ({ campaign, user, isAdminUser = false, onCampaignScheduleUpdated }) => {
  const navigate = useNavigate();
  const submissionFromAdminApi = useMemo(() => {
    if (!campaign?.id) return null;
    const summary = campaign?.setup_submission_summary;
    const prefetchedFd = summary?.form_data;
    if (prefetchedFd != null && typeof prefetchedFd === 'object') {
      return { form_data: prefetchedFd, created_at: summary?.created_at || null };
    }
    return null;
  }, [campaign?.id, campaign?.setup_submission_summary]);

  /** 고객 계정: RLS 허용 SELECT. forId !== campaign.id 이면 아직 이 캠페인에 대한 fetch 미완료 */
  const [customerSetupFetch, setCustomerSetupFetch] = useState({ forId: null, row: null });
  const [deliveryListOpen, setDeliveryListOpen] = useState(false);

  useEffect(() => {
    if (!campaign?.id || submissionFromAdminApi) return;
    const cid = campaign.id;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('campaign_setup_submissions')
        .select('form_data, created_at')
        .eq('campaign_id', cid)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!cancelled) {
        setCustomerSetupFetch({ forId: cid, row: data ?? null });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [campaign?.id, submissionFromAdminApi]);

  const customerFetchedRow = customerSetupFetch.forId === campaign?.id ? customerSetupFetch.row : null;
  const submission = submissionFromAdminApi || customerFetchedRow;
  const loading =
    !campaign?.id || (!submissionFromAdminApi && customerSetupFetch.forId !== campaign?.id);
  const fd = submission?.form_data || {};
  const productPhotoEntries = normalizeKickoffProductPhotoEntries(fd);
  const isVisitPlan = campaign?.plan?.toLowerCase().includes('visit');
  const agreementRows =
    fd.agreements && typeof fd.agreements === 'object'
      ? Object.entries(CAMPAIGN_SETUP_AGREEMENT_LABELS).map(([key, label]) => ({
          key,
          label,
          agreed: !!fd.agreements[key],
        }))
      : [];

  const eventScheduleDates = Array.isArray(fd.eventSchedule)
    ? fd.eventSchedule
    : (fd.eventSchedule ? [fd.eventSchedule] : []);

  // 일정 산출: 계약/결제일 = campaign.start_date 또는 제출일, 배송타입 = form 기반 추정
  const startDateForSchedule = campaign?.start_date || (submission?.created_at ? submission.created_at.split('T')[0] : null) || toYMD(new Date());
  const shippingType = fd.shippingRegion === 'domestic' ? 'domestic' : 'us';
  const computedSchedule = isVisitPlan
    ? getVisitCampaignSchedule(startDateForSchedule)
    : getCampaignSchedule(startDateForSchedule, {
        shippingType,
        recruitmentWeeks: 3,
        requestedShippingDate: fd.requestedShippingDate || null,
      });
  const schedule = isVisitPlan
    ? mergeVisitSchedule(computedSchedule, campaign)
    : mergeCampaignSchedule(computedSchedule, campaign);
  const guidelineStatus = fd.guidelineStatus || 'pending';
  const kickoffNotionGuide = resolveKickoffNotionGuideline(campaign, user);

  return (
    <div className="space-y-10 animate-fade-in-up">
      {/* Process Tracker (인보이스와 동일 스타일) */}
      <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10">
        <h4 className="font-black text-white text-xl mb-8 flex items-center gap-3 tracking-tighter">
          <CheckCircle2 size={24} className="text-emerald-400"/> 계약 및 결제 프로세스
        </h4>
        <div className="relative">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/10 -z-10" />
          <div className="flex justify-between w-full max-w-4xl mx-auto">
            {KICKOFF_STEPS.map((step) => (
              <div key={step.id} className="flex flex-col items-center gap-3 bg-[#020617] px-2 z-10">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all ${
                  step.active
                    ? 'bg-emerald-500 border-emerald-500 text-slate-900 shadow-[0_0_15px_rgba(16,185,129,0.5)] scale-110'
                    : step.done
                      ? 'bg-emerald-600 border-emerald-500 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-600'
                }`}>
                  {step.done || step.active ? <CheckCircle2 size={20} strokeWidth={3} /> : <step.icon size={20} strokeWidth={2} />}
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-widest ${step.active ? 'text-emerald-400' : step.done ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 제출 정보 요약 */}
      <div className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] border border-white/10 overflow-hidden">
        <div className="px-8 py-6 border-b border-white/5 bg-white/5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="font-black text-white flex items-center gap-3 tracking-tighter">
              <Building2 size={20} className="text-cyan-400"/>
              {isAdminUser ? '고객 제출 · 캠페인 세팅 전체' : '제출하신 캠페인 정보 요약'}
            </h3>
            <p className="text-slate-500 text-sm mt-1 font-light">
              {isAdminUser
                ? 'DB에 저장된 폼 원본과 동일합니다. USP·사진·약관 동의·서명·메타데이터까지 모두 확인할 수 있습니다.'
                : '입력하신 내용이 정상적으로 전달되었습니다.'}
            </p>
          </div>
          {!isAdminUser && (
            <button
              type="button"
              onClick={() => navigate(`/campaign-setup/${campaign.id}`)}
              className="shrink-0 px-5 py-2.5 rounded-xl font-bold text-sm bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all flex items-center gap-2"
            >
              <Settings size={18} />
              내 캠페인 정보 수정하기
            </button>
          )}
        </div>
        {loading ? (
          <div className="p-12 flex justify-center">
            <div className="w-10 h-10 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="p-8 space-y-6">
            {!submission && (
              <p className="text-sm text-amber-400/95 font-medium leading-relaxed rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3">
                캠페인 세팅 폼 제출 내역이 없습니다. 아래는 <strong className="text-amber-200/95">결제·주문 시 저장된 캠페인 행</strong>과, 폼에 입력된 값이 있으면 그 값이 우선 표시됩니다.
              </p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <KickoffSummaryRow label="회사명" value={fd.companyName || campaign.brand_name} />
                <KickoffSummaryRow
                  label="담당자명 / 직함"
                  value={
                    [fd.contactName, fd.contactTitle].filter(Boolean).join(' · ') ||
                    campaign.customer_name ||
                    ''
                  }
                />
                <KickoffSummaryRow label="연락처" value={fd.contactPhone || campaign.customer_phone} />
                <KickoffSummaryRow label="담당자 이메일" value={fd.contactEmail || campaign.customer_email} />
                {campaign.client_address ? (
                  <KickoffSummaryRow label="사업자 주소" value={campaign.client_address} />
                ) : null}
                {campaign.client_biz_reg_no ? (
                  <KickoffSummaryRow label="사업자등록번호" value={campaign.client_biz_reg_no} />
                ) : null}
                {submission ? (
                  <>
                    <KickoffSummaryRow label="담당자 서명 (제출 시)" value={fd.signature} />
                    <KickoffSummaryRow label="작성일 (제출 시)" value={fd.writtenDate} />
                    <KickoffSummaryRow
                      label="폼 제출 일시"
                      value={
                        formatKickoffSetupDateTime(fd.submitted_at) ||
                        formatKickoffSetupDateTime(submission?.created_at)
                      }
                    />
                  </>
                ) : null}
              </div>
              <div className="space-y-4">
                <KickoffSummaryRow label="캠페인 제품명" value={fd.productName || campaign.product_name} />
                {campaign.order_number ? (
                  <KickoffSummaryRow label="주문번호" value={campaign.order_number} />
                ) : null}
                <KickoffSummaryRow label="요금제" value={campaign.plan || ''} />
                <KickoffSummaryRow
                  label="목표 인원"
                  value={campaign.target_creators != null ? String(campaign.target_creators) : ''}
                />
                {campaign.plan_price != null ? (
                  <KickoffSummaryRow
                    label="플랜 금액"
                    value={`${Number(campaign.plan_price).toLocaleString('ko-KR')}원`}
                  />
                ) : null}
                {isVisitPlan ? (
                  <>
                    <KickoffSummaryRow label="타겟 오디언스 국가" value={fd.targetAudienceCountry} />
                    {eventScheduleDates.length > 0 ? (
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">행사일정</p>
                        <EventScheduleCalendar dates={eventScheduleDates} />
                      </div>
                    ) : null}
                    <KickoffSummaryRow label="행사 장소" value={fd.eventVenue} />
                    {fd.eventName ? <KickoffSummaryRow label="행사명" value={fd.eventName} /> : null}
                    {fd.eventGift ? <KickoffSummaryRow label="브랜드사 증정 선물" value={fd.eventGift} /> : null}
                  </>
                ) : (
                  <>
                    <KickoffSummaryRow label="거주 국가 범위" value={COUNTRY_LABELS[fd.countryRange] || fd.countryRange} />
                    <KickoffSummaryRow
                      label="배송 예상 기간"
                      value={
                        fd.deliveryTime === 'other'
                          ? (fd.deliveryOther || '기타')
                          : (DELIVERY_LABELS[fd.deliveryTime] || fd.deliveryTime)
                      }
                    />
                  </>
                )}
                <KickoffSummaryRow
                  label="제품 사진"
                  value={
                    productPhotoEntries.length > 0
                      ? `${productPhotoEntries.length}개 업로드됨`
                      : '미첨부'
                  }
                />
                {productPhotoEntries.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                      첨부 이미지 ({productPhotoEntries.length}개){isAdminUser ? ' · 원본 링크·파일명' : ''}
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {productPhotoEntries.map((ent, idx) => (
                        <a
                          key={`${ent.url}-${idx}`}
                          href={ensureAbsoluteUrl(ent.url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group block rounded-xl overflow-hidden border border-white/10 bg-white/5 hover:border-cyan-400/40 transition-colors"
                        >
                          <img
                            src={ensureAbsoluteUrl(ent.url)}
                            alt={ent.name || `product-photo-${idx + 1}`}
                            className="w-full h-28 object-cover"
                            loading="lazy"
                          />
                          {ent.name ? (
                            <p className="text-[10px] text-slate-500 px-2 py-1.5 truncate group-hover:text-slate-300" title={ent.name}>
                              {ent.name}
                            </p>
                          ) : (
                            <p className="text-[10px] text-slate-600 px-2 py-1.5">이미지 {idx + 1}</p>
                          )}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            {submission && agreementRows.length > 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-3">
                <p className="text-xs font-black text-white flex items-center gap-2 tracking-tight">
                  <ListChecks size={16} className="text-violet-400" />
                  캠페인 운영 정책 동의 (제출 시점)
                </p>
                <ul className="divide-y divide-white/5 text-sm">
                  {agreementRows.map(({ key, label, agreed }) => (
                    <li key={key} className="flex flex-wrap items-center justify-between gap-2 py-2.5 first:pt-0">
                      <span className="text-slate-400 font-light">{label}</span>
                      <span className={`shrink-0 font-bold text-xs ${agreed ? 'text-emerald-400' : 'text-slate-600'}`}>
                        {agreed ? '동의' : '—'}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        )}
        {!loading && (
          <div className="px-8 pb-8">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">제품 USP · 링크 · 참고 숏폼</p>
            <p className="text-slate-300 text-sm font-light whitespace-pre-wrap bg-white/5 rounded-xl p-4 border border-white/5">
              {String(fd.uspAndLinks || '').trim() || '-'}
            </p>
          </div>
        )}
        {!loading && isAdminUser && submission ? (
          <div className="px-8 pb-8 border-t border-white/5 pt-6 space-y-4">
            <h4 className="text-sm font-black text-white flex items-center gap-2 tracking-tight">
              <ClipboardList size={18} className="text-amber-400" />
              관리자 전용 · 제출 메타데이터
            </h4>
            <p className="text-xs text-slate-500">
              제출 시점에 함께 저장된 파일 크기·MIME·내부 식별자입니다. 스토리지 URL은 위 이미지 카드와 동일합니다.
            </p>
            {Array.isArray(fd.productPhotos) && fd.productPhotos.length > 0 ? (
              <div className="rounded-xl border border-white/10 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/5 text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-2.5 font-bold">파일명</th>
                      <th className="px-4 py-2.5 font-bold w-24">크기</th>
                      <th className="px-4 py-2.5 font-bold w-32">타입</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-300 divide-y divide-white/5">
                    {fd.productPhotos.map((p, i) => (
                      <tr key={`${p?.name}-${i}`} className="bg-transparent">
                        <td className="px-4 py-2.5 font-mono text-[11px] break-all">{p?.name || '—'}</td>
                        <td className="px-4 py-2.5 text-slate-400">{formatKickoffFileSize(p?.size)}</td>
                        <td className="px-4 py-2.5 text-slate-500 truncate max-w-[8rem]" title={p?.type}>
                          {p?.type || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-500">첨부 파일 메타데이터 행이 없습니다. (이미지만 URL로 저장된 경우 등)</p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] font-mono text-slate-500 bg-black/20 rounded-xl p-4 border border-white/5">
              <p>
                <span className="text-slate-600 block mb-1">form_data.user_id</span>
                {fd.user_id || '—'}
              </p>
              <p>
                <span className="text-slate-600 block mb-1">form_data.campaign_id</span>
                {fd.campaign_id || '—'}
              </p>
            </div>
          </div>
        ) : null}
      </div>

      {/* 캠페인 세팅 이후 여정: 진행 일정 · 캘린더 · 가이드라인 */}
      <div className="space-y-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
            <Calendar size={24} className="text-cyan-400" />
          </div>
          <div>
            <h3 className="font-black text-white text-xl tracking-tight">캠페인 진행 일정</h3>
            <p className="text-slate-500 text-sm font-light">
              {isVisitPlan
                ? 'Visit Content 플랜: 계약·세팅 기준으로 모집~명단까지 산출 후, 명단 납품일 기준 방문·행사 일정 템플릿이 적용됩니다.'
                : '기본은 계약/결제일·세팅 폼 기준 자동 산출입니다. 관리자가 저장한 날짜가 있으면 해당 항목은 수동 일정이 우선합니다.'}
            </p>
          </div>
        </div>

        {isAdminUser && (
          <AdminCampaignScheduleEditor
            campaign={campaign}
            onSaved={(campaignId, schedule) => onCampaignScheduleUpdated?.(campaignId, schedule)}
          />
        )}

        {/* D-day 카드 */}
        {isVisitPlan ? (
          <div className="flex flex-wrap gap-4">
            <DdayCard label="인플루언서 모집" dateStr={schedule?.recruitmentEnd} subLabel="Recruitment" />
            <DdayCard label="명단 납품" dateStr={schedule?.listDeliveryDate} subLabel="List Delivery" />
            <DdayCard
              label="콘텐츠 가이드 제작·소통"
              dateStr={schedule?.visitContentGuideCommDate}
              subLabel="Content Guide"
            />
            <DdayCard
              label="인플루언서 재공지"
              dateStr={schedule?.reannounce1Date}
              subLabel="Re-Announcement"
            />
            <DdayRangeCard
              label="개별 일정 안내"
              startStr={schedule?.individualNoticeStart}
              endStr={schedule?.individualNoticeEnd}
              subLabel="Influencer schedule notice"
            />
            <DdayRangeCard
              label="방문"
              startStr={schedule?.festivalStartDate}
              endStr={schedule?.festivalEndDate}
              subLabel="현장 방문 구간"
            />
          </div>
        ) : (
          <div className="flex flex-wrap gap-4">
            <DdayCard label="명단 납품" dateStr={schedule?.listDeliveryDate} subLabel="List Delivery" />
            <DdayCard label="배송일" dateStr={schedule?.shippingDate} subLabel="Shipping Date" />
            <DdayCard label="업로드 시작" dateStr={schedule?.uploadStartDate} subLabel="Upload Start" />
            <DdayCard label="업로드 마감" dateStr={schedule?.uploadDeadlineDate} subLabel="배송일+30일" />
          </div>
        )}

        {/* 캠페인 타임라인 (간트) */}
        <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10">
          <h4 className="font-black text-white text-lg mb-6 flex items-center gap-2">
            <BarChart3 size={20} className="text-cyan-400" />
            캠페인 캘린더 (타임라인)
          </h4>
          {isVisitPlan ? <VisitCampaignTimeline schedule={schedule} /> : <CampaignTimeline schedule={schedule} />}
          <p className="text-[10px] text-slate-500 mt-4 uppercase tracking-widest">
            {isVisitPlan
              ? 'Recruitment → 소통·확정 → 명단·교체 → 가이드 제작·소통 → 재공지 → 개별 일정 안내 → 방문'
              : 'Recruitment → 소통·확정 → 명단 납품 → 리스트 교체(3영업일) → 배송 확정 → 업로드 기간 → 90일 트래킹'}
          </p>
        </div>

        {/* 룰 안내 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {isVisitPlan ? <ScheduleRulesCalloutVisit /> : <ScheduleRulesCallout shippingType={schedule?.shippingType || 'us'} />}
          {isVisitPlan ? (
            <VisitScheduleSummary />
          ) : (
            <div className="bg-white/5 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white/10">
              <h4 className="font-black text-white text-lg mb-3 flex items-center gap-2">
                <Truck size={20} className="text-emerald-400" />
                진행 일정 요약
              </h4>
              <ul className="text-sm text-slate-400 space-y-2 font-light">
                <li>• 모집: {schedule?.recruitmentWeeks || 3}주</li>
                <li>• 인플루언서 소통·확정: 1주</li>
                <li>• 명단 최초 납품 → 리스트 교체 3영업일</li>
                <li>• 업로드 시작: {schedule?.shippingType === 'us' ? '배송 3일 후' : '배송 10일 후'}</li>
                <li>• 업로드 마감: 배송일+30일 / 트래킹: 90일</li>
              </ul>
            </div>
          )}
        </div>

        {/* 가이드라인 세팅 */}
        <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10">
          <h4 className="font-black text-white text-lg mb-6 flex items-center gap-2">
            <FileText size={20} className="text-amber-400" />
            가이드라인 세팅
          </h4>
          <GuidelineSettingBlock
            status={guidelineStatus}
            notionGuidelineUrl={kickoffNotionGuide?.url ?? null}
            notionGuidelineTitle={kickoffNotionGuide?.title}
            notionGuidelineDescription={kickoffNotionGuide?.description}
          />
        </div>
      </div>

      {user && campaignMatchesLinkedDeliveryList(campaign, user) && (
        <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-cyan-500/20 shadow-[0_0_40px_rgba(34,211,238,0.08)]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h4 className="font-black text-white text-lg flex items-center gap-2 tracking-tight">
                <UserCheck size={22} className="text-cyan-400" />
                인플루언서 납품 리스트
              </h4>
              <p className="text-slate-500 text-sm font-light mt-1">
                {isHeatherFarmskinScale50Campaign(campaign, user)
                  ? '드랍 및 교체 반영이 완료된 최종 리스트입니다. 추가 드랍은 종료되었으며, 리스트 확정만 진행해 주세요.'
                  : '명단 확인·드랍(최대 30%, 영업일 기준 마감)·리스트 확정은 아래에서 진행할 수 있습니다.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setDeliveryListOpen((o) => !o)}
              className="shrink-0 px-6 py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:from-cyan-500 hover:to-blue-500 transition-all shadow-lg shadow-cyan-900/30"
            >
              {deliveryListOpen ? '접기' : '인플루언서 납품 리스트 받아보기'}
            </button>
          </div>
          {deliveryListOpen && (
            <div className="pt-4 border-t border-white/10">
              {!(campaign.linked_delivery_candidates || []).length ? (
                <p className="text-slate-500 text-sm py-8 text-center">
                  리스트를 불러오지 못했습니다. 잠시 후 대시보드를 새로고침해 주세요.
                </p>
              ) : (
                <CandidateList
                  candidates={(campaign.linked_delivery_candidates || []).map((c) => ({
                    ...c,
                    _identifier: c._identifier || normalizeDropIdentifier(`${c.name}|${c.platform}`),
                  }))}
                  targetCount={(campaign.linked_delivery_candidates || []).length}
                  matchedCount={(campaign.linked_delivery_candidates || []).length}
                  isDeliveryTest
                  campaign={campaign}
                  user={user}
                  allowAdminUnconfirm={false}
                  deliveryTableLayout={linkedDeliveryTableLayout(campaign, user)}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// --- Main Campaign Detail Container ---
const CampaignDetail = ({ campaign, isDemoMode, user, isAdminUser = false, onCampaignScheduleUpdated }) => {
  if (!campaign) {
    return (
      <div className="flex flex-col items-center justify-center py-40 text-slate-400 font-black uppercase tracking-[0.3em]">
        <Package size={48} className="mb-4 opacity-30 text-slate-500" />
        캠페인을 선택해 주세요
      </div>
    );
  }

  if (campaign.status === CampaignStatus.PAYMENT_PENDING) {
      if (isDemoMode) return <DemoInvoiceExample />;
      return <InvoiceDetail campaign={campaign} />;
  }

  if (campaign.status === CampaignStatus.KICKOFF) {
      return (
        <KickoffView
          campaign={campaign}
          user={user}
          isAdminUser={isAdminUser}
          onCampaignScheduleUpdated={onCampaignScheduleUpdated}
        />
      );
  }

  if (campaign.status === CampaignStatus.CONTACTING) {
      const isLinkedDelivery = campaignMatchesLinkedDeliveryList(campaign, user);
      const isDeliveryTest = isLinkedDelivery;
      const candidates = isDeliveryTest
        ? (campaign.linked_delivery_candidates || []).map((c) => ({
            ...c,
            _identifier: c._identifier || normalizeDropIdentifier(`${c.name}|${c.platform}`),
          }))
        : (campaign.candidates || campaign.creators || []).map((c, i) => ({
            id: c.id || i + 1,
            name: c.name || c.handle || '-',
            handle: c.handle || c.name || '-',
            platform: c.platform || 'SNS',
            followers: String(c.followers || c.follower_count || '0'),
            location: c.location || '-',
            status: c.status || 'Pending Review',
            contact: c.contact || c.email || '-',
            _identifier: `${c.name || c.handle}|${c.platform || 'SNS'}`,
          }));
      return (
          <CandidateList 
            candidates={candidates} 
            targetCount={campaign.target_creators || 50} 
            matchedCount={campaign.matched_creators || 0}
            isDeliveryTest={isDeliveryTest}
            campaign={campaign}
            user={user}
            existingDrops={[]}
            allowAdminUnconfirm={false}
            deliveryTableLayout={linkedDeliveryTableLayout(campaign, user)}
          />
      );
  }

  if (campaign.status === CampaignStatus.COMPLETED) {
      return <AnalyticsReport campaign={campaign} />;
  }

  return <OngoingCampaign campaign={campaign} />;
};

/**
 * 고객 계정: campaigns 행( select('*') )만 받아 설정·명단·주문 요약을 붙인다.
 * My Campaign 첫 페인트 후 백그라운드에서 호출해 로딩 체감을 줄인다.
 */
async function enrichNonAdminDashboardCampaigns(rows, user) {
  let campaignList = Array.isArray(rows) ? [...rows] : [];
  if (campaignList.length === 0) return [];

  const loadedFromAdminApi = false;
  let linkedCreatorsRawBySlug = {};
  let orderSummaryByNumber = {};
  const setupByCampaignId = {};
  let settingsByCampaignId = {};
  let creatorsByCampaignId = {};

  const campaignIds = campaignList.map((c) => c.id).filter(Boolean);
  if (campaignIds.length > 0) {
    const [settingsRes, scopedDeliveryRes, setupRes] = await Promise.all([
      supabase
        .from('campaign_admin_settings')
        .select(
          'campaign_id, linked_list_slug, notion_guideline_url, notion_guideline_title, notion_guideline_description, force_drop_complete_message, updated_at',
        )
        .in('campaign_id', campaignIds),
      supabase
        .from('admin_delivery_creators')
        .select('*')
        .in('campaign_id', campaignIds)
        .order('created_at', { ascending: true }),
      supabase
        .from('campaign_setup_submissions')
        .select('campaign_id, created_at, form_data')
        .in('campaign_id', campaignIds)
        .order('created_at', { ascending: false }),
    ]);
    const runtimeRows = settingsRes?.data;
    settingsByCampaignId = Object.fromEntries(
      (runtimeRows || [])
        .filter((r) => r?.campaign_id)
        .map((r) => [
          r.campaign_id,
          {
            linked_list_slug: r.linked_list_slug || null,
            notion_guideline_url: r.notion_guideline_url || null,
            notion_guideline_title: r.notion_guideline_title || null,
            notion_guideline_description: r.notion_guideline_description || null,
            force_drop_complete_message: !!r.force_drop_complete_message,
            updated_at: r.updated_at || null,
          },
        ]),
    );
    const { data: campScopedRows, error: cscErr } = scopedDeliveryRes || {};
    if (!cscErr && campScopedRows?.length) {
      for (const row of campScopedRows) {
        const cid = row?.campaign_id;
        if (!cid) continue;
        if (!creatorsByCampaignId[cid]) creatorsByCampaignId[cid] = [];
        creatorsByCampaignId[cid].push(row);
      }
    }
    const { data: setupRows, error: setupErr } = setupRes || {};
    if (!setupErr && setupRows?.length) {
      const hasReport = (r) =>
        !!(r?.form_data && typeof r.form_data === 'object' && (
          r.form_data.report_summary || r.form_data.report_top_posts || r.form_data.report_top_creators
        ));
      for (const row of setupRows) {
        const cid = row?.campaign_id;
        if (!cid) continue;
        if (!setupByCampaignId[cid]) {
          setupByCampaignId[cid] = {
            created_at: row?.created_at || null,
            form_data: row?.form_data ?? null,
          };
          continue;
        }
        const prev = setupByCampaignId[cid];
        const prevHasReport = hasReport(prev);
        const nextHasReport = hasReport(row);
        if (!prevHasReport && nextHasReport) {
          setupByCampaignId[cid] = {
            created_at: row?.created_at || null,
            form_data: row?.form_data ?? null,
          };
        }
      }
    }
  }

  campaignList = campaignList.map((c) => ({ ...c, admin_runtime_settings: settingsByCampaignId[c.id] || null }));

  const linkedCampaignRows = campaignList.filter(
    (c) => (creatorsByCampaignId[c.id]?.length ?? 0) > 0 || resolveLinkedDeliveryListSlug(c, user) != null,
  );
  const linkedSlugs = [...new Set(linkedCampaignRows.map((c) => resolveLinkedDeliveryListSlug(c, user)).filter(Boolean))];

  const orderNumbersForSummary = [...new Set(campaignList.map((c) => c.order_number).filter(Boolean))];

  const [creatorsBySlug, orderRowsForSummary] = await Promise.all([
    (async () => {
      const bySlug = {};
      if (linkedSlugs.length === 0) return bySlug;
      const slugRows = await Promise.all(
        linkedSlugs.map(async (slug) => {
          let linkedCreators = linkedCreatorsRawBySlug?.[slug] || [];
          if (!loadedFromAdminApi) {
            const { data: queryRows } = await supabase
              .from('admin_delivery_creators')
              .select('*')
              .eq('list_slug', slug)
              .order('created_at', { ascending: true });
            linkedCreators = queryRows || [];
          }
          const list =
            linkedCreators?.length > 0
              ? linkedCreators.map((r, i) => toDisplayCreator(r, i))
              : LINKED_DELIVERY_SLUGS_NO_TEST_FALLBACK.has(slug)
                ? []
                : testInfluencers.map((c, i) => testInfluencerToDisplayCreator(c, i));
          return { slug, list };
        }),
      );
      for (const { slug, list } of slugRows) {
        bySlug[slug] = list;
      }
      return bySlug;
    })(),
    (async () => {
      if (orderNumbersForSummary.length > 0 && !loadedFromAdminApi) {
        const { data: orderRows } = await supabase
          .from('orders')
          .select('order_number, plan_name, plan_price, order_items, content_count')
          .in('order_number', orderNumbersForSummary);
        return orderRows || [];
      }
      return null;
    })(),
  ]);

  if (orderRowsForSummary?.length) {
    orderSummaryByNumber = Object.fromEntries(orderRowsForSummary.map((o) => [o.order_number, o]));
  }

  campaignList = campaignList.map((c) => {
    const directRaw = creatorsByCampaignId[c.id];
    if (directRaw?.length > 0) {
      let list = directRaw.map((r, i) => toDisplayCreator(r, i));
      if (isTroublessPdrnSunscreenCampaign(c)) {
        list = finalizeTroublessPdrnScale50DisplayCreators(list);
      }
      return { ...c, linked_delivery_candidates: list };
    }
    const slug = resolveLinkedDeliveryListSlug(c, user);
    if (!slug) return c;
    let list = creatorsBySlug[slug] || [];
    if (slug === LINKED_LIST_SLUG_FARMSKIN && isTroublessPdrnSunscreenCampaign(c)) {
      list = finalizeTroublessPdrnScale50DisplayCreators(list);
    }
    return { ...c, linked_delivery_candidates: list };
  });
  campaignList = campaignList.map((c) =>
    c.order_number && orderSummaryByNumber[c.order_number]
      ? { ...c, order_summary: orderSummaryByNumber[c.order_number], setup_submission_summary: setupByCampaignId[c.id] || null }
      : { ...c, setup_submission_summary: setupByCampaignId[c.id] || null },
  );

  const buildAnalyticsFromSetupSummary = (campaign) => {
    const fd = campaign?.setup_submission_summary?.form_data || {};
    const reportSummary = fd?.report_summary || null;
    const reportTopPosts = Array.isArray(fd?.report_top_posts) ? fd.report_top_posts : [];
    if (!reportSummary && reportTopPosts.length === 0) return null;

    const byDay = new Map();
    for (const p of reportTopPosts) {
      const day = String(p?.upload_day || '').trim();
      const viewsNum = Number(String(p?.views || '').replace(/[^0-9]/g, '')) || 0;
      if (!day) continue;
      byDay.set(day, (byDay.get(day) || 0) + viewsNum);
    }
    const dateKeys = [...byDay.keys()].sort().slice(-7);
    const daily_views = dateKeys.length > 0
      ? dateKeys.map((d) => Math.max(1, Math.round((byDay.get(d) || 0) / 1000)))
      : [20, 35, 48, 62, 55, 44, 37];
    const dates = dateKeys.length > 0
      ? dateKeys.map((d) => {
          const parts = d.split('/');
          if (parts.length === 3) return `${parts[1]}/${parts[2]}`;
          return d;
        })
      : ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7'];

    const top_contents = reportTopPosts.slice(0, 3).map((p, idx) => ({
      id: idx + 1,
      creator: `${p?.name || 'Creator'}${p?.platform ? ` (${p.platform})` : ''}`,
      views: `${Number(String(p?.views || '0').replace(/[^0-9]/g, '') || 0).toLocaleString()} views`,
      thumbnail:
        (typeof p?.thumbnail_url === 'string' && p.thumbnail_url.trim())
        || `https://dummyimage.com/540x960/0f172a/ffffff&text=KOCOSTAR+TOP+${idx + 1}`,
    }));

    return {
      daily_views,
      dates,
      engagement_rate: `${Number(reportSummary?.engagement_rate || 0).toFixed(2)}%`,
      top_contents,
    };
  };

  return campaignList.map((c) => ({
    ...c,
    creators: Array.isArray(c.creators) ? c.creators : [],
    contents: Array.isArray(c.contents) ? c.contents : [],
    analytics: c.analytics || buildAnalyticsFromSetupSummary(c),
  }));
}

// --- Main Dashboard ---

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { unreadCount: staffSupportUnread, unreadItems: staffUnreadByCustomer } = useSupportStaffUnread();
  // Navbar '요금제'와 동일: / 로 이동 후 #pricing 섹션으로 스크롤
  const goToPricing = () => {
    const scrollToPricing = () => {
      const el = document.getElementById('pricing');
      if (el) {
        const headerOffset = 90;
        const top = el.getBoundingClientRect().top + window.pageYOffset - headerOffset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    };
    navigate('/');
    setTimeout(scrollToPricing, 150);
  };
  const [user, setUser] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [paidOrders, setPaidOrders] = useState([]);
  /** 관리자가 발급한 활성 개인 결제창 — 해당 이메일 유저 대시보드에만 노출 */
  const [myCustomPaymentOffers, setMyCustomPaymentOffers] = useState([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [isPasswordMode, setIsPasswordMode] = useState(false);
  const [impersonateEmail, setImpersonateEmail] = useState('');
  const [impersonateLoading, setImpersonateLoading] = useState(false);
  /** 관리자: 좌측 메뉴에서 보는 화면 (기능은 동일, 영역만 전환) */
  const [adminPanel, setAdminPanel] = useState('campaign_progress');
  /** 관리자 캠페인 대시보드: 고객 진행 화면 vs 인보이스 */
  const [adminCampaignProgressTab, setAdminCampaignProgressTab] = useState('progress');
  const [adminFilterCustomer, setAdminFilterCustomer] = useState('all');
  const [adminFilterBrand, setAdminFilterBrand] = useState('all');
  const [adminFilterPlan, setAdminFilterPlan] = useState('all');
  const [adminFilterStatus, setAdminFilterStatus] = useState('all');
  const [adminFilterDelivery, setAdminFilterDelivery] = useState('all');
  const [adminSearch, setAdminSearch] = useState('');
  /** 서버 `/api/admin/admin-session` 기준 — 클라이언트 VITE_ADMIN_EMAILS 는 신뢰하지 않음 */
  const [isAdminUser, setIsAdminUser] = useState(false);
  const customerCreatorsJoinRequestedRef = useRef(new Set());

  const handleCampaignScheduleUpdated = (campaignId, schedule) => {
    if (!campaignId || !schedule) return;
    setCampaigns((prev) => prev.map((c) => (c.id === campaignId ? { ...c, ...schedule } : c)));
  };

  useEffect(() => {
    const p = location.state?.adminPanel;
    if (p !== 'support_inbox' && p !== 'all_invoices') return;
    if (!isAdminUser) return;
    setAdminPanel(p);
    navigate('/dashboard', { replace: true, state: {} });
  }, [location.state, isAdminUser, navigate]);

  useEffect(() => {
    setAdminCampaignProgressTab('progress');
  }, [selectedCampaignId]);

  /** 고객: 목록은 select('*')만 쓰고, 선택 캠페인의 creators/contents는 지연 로드 */
  useEffect(() => {
    if (!user?.id || !selectedCampaignId || isAdminUser) return undefined;
    const row = campaigns.find((c) => c.id === selectedCampaignId);
    if (!row) return undefined;
    const hasCreators = Array.isArray(row.creators) && row.creators.length > 0;
    const hasContents = Array.isArray(row.contents) && row.contents.length > 0;
    if (hasCreators && hasContents) return undefined;
    if (customerCreatorsJoinRequestedRef.current.has(selectedCampaignId)) return undefined;
    customerCreatorsJoinRequestedRef.current.add(selectedCampaignId);
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('creators (*), contents (*)')
        .eq('id', selectedCampaignId)
        .maybeSingle();
      if (cancelled || error || !data) {
        customerCreatorsJoinRequestedRef.current.delete(selectedCampaignId);
        return;
      }
      setCampaigns((prev) =>
        prev.map((c) =>
          c.id === selectedCampaignId
            ? {
                ...c,
                creators: Array.isArray(data.creators) && data.creators.length > 0 ? data.creators : c.creators || [],
                contents: Array.isArray(data.contents) && data.contents.length > 0 ? data.contents : c.contents || [],
              }
            : c,
        ),
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedCampaignId, user?.id, isAdminUser, campaigns]);

  useEffect(() => {
    if (!isPasswordMode) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isPasswordMode]);

  useEffect(() => {
    const fetchData = async () => {
      try {
      const { data: { session: sess0 } } = await supabase.auth.getSession();
      let user = sess0?.user ?? null;
      let token0 = sess0?.access_token ?? null;
      if (!user) {
        const { data: gu } = await supabase.auth.getUser();
        user = gu?.user ?? null;
        if (user) {
          const { data: s2 } = await supabase.auth.getSession();
          token0 = s2?.session?.access_token ?? null;
        }
      }
      setUser(user);

      if (user) {
        const [isAdmin, parallelCampaignsRes] = await Promise.all([
          fetchAdminSessionIsAdmin(token0),
          supabase
            .from('campaigns')
            .select('*')
            .order('created_at', { ascending: false })
            .eq('user_id', user.id),
        ]);
        setIsAdminUser(!!isAdmin);

        if (!isAdmin) {
          const raw = parallelCampaignsRes?.data || [];
          if (parallelCampaignsRes?.error) {
            console.warn('[Dashboard] campaigns', parallelCampaignsRes.error);
          }
          const baseRows = parallelCampaignsRes?.error ? [] : raw;
          const quick = baseRows.map((c) => ({
            ...c,
            creators: [],
            contents: [],
            linked_delivery_candidates: [],
            admin_runtime_settings: null,
            order_summary: null,
            setup_submission_summary: null,
          }));
          const cachedList = readCustomerDashboardCache(user.id);
          const hasCache = Array.isArray(cachedList) && cachedList.length > 0;

          if (hasCache) {
            setCampaigns(cachedList);
            setSelectedCampaignId(cachedList[0].id);
            setIsDemoMode(false);
            setLoading(false);
          }

          if (!hasCache) {
            if (quick.length > 0) {
              setCampaigns(quick);
              setSelectedCampaignId(quick[0].id);
            } else {
              setCampaigns([]);
              setSelectedCampaignId(null);
            }
            setIsDemoMode(false);
            setLoading(false);
          }

          void enrichNonAdminDashboardCampaigns(baseRows, user)
            .then((enriched) => {
              if (!Array.isArray(enriched)) return;
              if (enriched.length > 0) {
                setCampaigns(enriched);
                writeCustomerDashboardCache(user.id, enriched);
              } else {
                setCampaigns([]);
                setSelectedCampaignId(null);
                clearCustomerDashboardCache(user.id);
              }
            })
            .catch((err) => {
              console.error('[Dashboard] enrich campaigns', err);
            });

          const [ordersDataRes, offersRes] = await Promise.all([
            supabase
              .from('orders')
              .select('order_number, plan_name, plan_price, status, created_at')
              .eq('email', user.email)
              .eq('status', 'paid')
              .order('created_at', { ascending: false })
              .limit(20),
            token0
              ? fetch(`${window.location.origin}/api/my-custom-payment-offers`, {
                  headers: { Authorization: `Bearer ${token0}` },
                }).catch(() => null)
              : Promise.resolve(null),
          ]);
          setPaidOrders(ordersDataRes?.data || []);

          try {
            if (offersRes?.ok) {
              const j = await offersRes.json();
              setMyCustomPaymentOffers(Array.isArray(j.offers) ? j.offers : []);
            } else {
              setMyCustomPaymentOffers([]);
            }
          } catch {
            setMyCustomPaymentOffers([]);
          }
        } else {
        let campaignList = [];
        let linkedCreatorsRawBySlug = {};
        let orderSummaryByNumber = {};
        let setupByCampaignId = {};
        let settingsByCampaignId = {};
        let loadedFromAdminApi = false;
        let creatorsByCampaignId = {};

        if (isAdmin) {
          try {
            if (token0) {
              const res = await fetch(`${window.location.origin}/api/admin/dashboard-overview`, {
                method: 'GET',
                headers: { Authorization: `Bearer ${token0}` },
              });
              if (res.ok) {
                const adminData = await res.json();
                campaignList = adminData?.campaigns || [];
                linkedCreatorsRawBySlug = adminData?.creators_by_slug || {};
                orderSummaryByNumber = adminData?.order_summary_by_number || {};
                setupByCampaignId = adminData?.setup_by_campaign_id || {};
                settingsByCampaignId = adminData?.settings_by_campaign_id || {};
                creatorsByCampaignId = adminData?.creators_by_campaign_id || {};
                loadedFromAdminApi = true;
              } else {
                const errText = await res.text();
                console.warn('[admin/dashboard-overview] failed:', res.status, errText);
              }
            }
          } catch (err) {
            console.warn('[admin/dashboard-overview] error:', err);
          }
        }

        if (!loadedFromAdminApi) {
            const { data: adminFallbackData, error: adminCampErr } = await supabase
              .from('campaigns')
              .select('*')
              .order('created_at', { ascending: false });
            if (adminCampErr) {
              console.warn('[Dashboard] admin fallback campaigns', adminCampErr);
            }
            campaignList = adminFallbackData || [];
          const campaignIds = campaignList.map((c) => c.id).filter(Boolean);
          if (campaignIds.length > 0) {
            const [settingsRes, scopedDeliveryRes] = await Promise.all([
              supabase
                .from('campaign_admin_settings')
                .select(
                  'campaign_id, linked_list_slug, notion_guideline_url, notion_guideline_title, notion_guideline_description, force_drop_complete_message, updated_at',
                )
                .in('campaign_id', campaignIds),
              supabase
                .from('admin_delivery_creators')
                .select('*')
                .in('campaign_id', campaignIds)
                .order('created_at', { ascending: true }),
            ]);
            const runtimeRows = settingsRes?.data;
            settingsByCampaignId = Object.fromEntries(
              (runtimeRows || [])
                .filter((r) => r?.campaign_id)
                .map((r) => [
                  r.campaign_id,
                  {
                    linked_list_slug: r.linked_list_slug || null,
                    notion_guideline_url: r.notion_guideline_url || null,
                    notion_guideline_title: r.notion_guideline_title || null,
                    notion_guideline_description: r.notion_guideline_description || null,
                    force_drop_complete_message: !!r.force_drop_complete_message,
                    updated_at: r.updated_at || null,
                  },
                ]),
            );
            const { data: campScopedRows, error: cscErr } = scopedDeliveryRes || {};
            if (!cscErr && campScopedRows?.length) {
              for (const row of campScopedRows) {
                const cid = row?.campaign_id;
                if (!cid) continue;
                if (!creatorsByCampaignId[cid]) creatorsByCampaignId[cid] = [];
                creatorsByCampaignId[cid].push(row);
              }
            }
          }
        }

        campaignList = campaignList.map((c) => ({ ...c, admin_runtime_settings: settingsByCampaignId[c.id] || null }));

        const linkedCampaignRows = campaignList.filter(
          (c) => (creatorsByCampaignId[c.id]?.length ?? 0) > 0 || resolveLinkedDeliveryListSlug(c, user) != null,
        );
        const linkedSlugs = [...new Set(linkedCampaignRows.map((c) => resolveLinkedDeliveryListSlug(c, user)).filter(Boolean))];

        const orderNumbersForSummary = [...new Set(campaignList.map((c) => c.order_number).filter(Boolean))];

        const [creatorsBySlug, orderRowsForSummary] = await Promise.all([
          (async () => {
            const bySlug = {};
            if (linkedSlugs.length === 0) return bySlug;
            const slugRows = await Promise.all(
              linkedSlugs.map(async (slug) => {
                let linkedCreators = linkedCreatorsRawBySlug?.[slug] || [];
                if (!loadedFromAdminApi) {
                  const { data: queryRows } = await supabase
                    .from('admin_delivery_creators')
                    .select('*')
                    .eq('list_slug', slug)
                    .order('created_at', { ascending: true });
                  linkedCreators = queryRows || [];
                }
                const list =
                  linkedCreators?.length > 0
                    ? linkedCreators.map((r, i) => toDisplayCreator(r, i))
                    : LINKED_DELIVERY_SLUGS_NO_TEST_FALLBACK.has(slug)
                      ? []
                      : testInfluencers.map((c, i) => testInfluencerToDisplayCreator(c, i));
                return { slug, list };
              }),
            );
            for (const { slug, list } of slugRows) {
              bySlug[slug] = list;
            }
            return bySlug;
          })(),
          (async () => {
            if (orderNumbersForSummary.length > 0 && !loadedFromAdminApi) {
              const { data: orderRows } = await supabase
                .from('orders')
                .select('order_number, plan_name, plan_price, order_items, content_count')
                .in('order_number', orderNumbersForSummary);
              return orderRows || [];
            }
            return null;
          })(),
        ]);

        if (orderRowsForSummary?.length) {
          orderSummaryByNumber = Object.fromEntries(orderRowsForSummary.map((o) => [o.order_number, o]));
        }

        campaignList = campaignList.map((c) => {
          const directRaw = creatorsByCampaignId[c.id];
          if (directRaw?.length > 0) {
            let list = directRaw.map((r, i) => toDisplayCreator(r, i));
            if (isTroublessPdrnSunscreenCampaign(c)) {
              list = finalizeTroublessPdrnScale50DisplayCreators(list);
            }
            return { ...c, linked_delivery_candidates: list };
          }
          const slug = resolveLinkedDeliveryListSlug(c, user);
          if (!slug) return c;
          let list = creatorsBySlug[slug] || [];
          if (slug === LINKED_LIST_SLUG_FARMSKIN && isTroublessPdrnSunscreenCampaign(c)) {
            list = finalizeTroublessPdrnScale50DisplayCreators(list);
          }
          return { ...c, linked_delivery_candidates: list };
        });
        campaignList = campaignList.map((c) =>
          c.order_number && orderSummaryByNumber[c.order_number]
            ? { ...c, order_summary: orderSummaryByNumber[c.order_number], setup_submission_summary: setupByCampaignId[c.id] || null }
            : { ...c, setup_submission_summary: setupByCampaignId[c.id] || null },
        );

        if (campaignList.length > 0) {
          setCampaigns(
            campaignList.map((c) => ({
              ...c,
              creators: Array.isArray(c.creators) ? c.creators : [],
              contents: Array.isArray(c.contents) ? c.contents : [],
            })),
          );
          setSelectedCampaignId(campaignList[0].id);
          setIsDemoMode(false);
        } else {
          setCampaigns([]);
          setSelectedCampaignId(null);
          setIsDemoMode(false); 
        }

        setLoading(false);

        const [ordersDataRes, offersRes] = await Promise.all([
          supabase
            .from('orders')
            .select('order_number, plan_name, plan_price, status, created_at')
            .eq('email', user.email)
            .eq('status', 'paid')
            .order('created_at', { ascending: false })
            .limit(20),
          token0
            ? fetch(`${window.location.origin}/api/my-custom-payment-offers`, {
                headers: { Authorization: `Bearer ${token0}` },
              }).catch(() => null)
            : Promise.resolve(null),
        ]);
        setPaidOrders(ordersDataRes?.data || []);

        try {
          if (offersRes?.ok) {
            const j = await offersRes.json();
            setMyCustomPaymentOffers(Array.isArray(j.offers) ? j.offers : []);
          } else {
            setMyCustomPaymentOffers([]);
          }
        } catch {
          setMyCustomPaymentOffers([]);
        }
        }
      } else {
        setIsAdminUser(false);
        // [수정됨] 비로그인 유저: 데모 모드 노출
        setMyCustomPaymentOffers([]);
        setCampaigns(DEMO_CAMPAIGNS);
        setSelectedCampaignId(DEMO_CAMPAIGNS[0].id);
        setIsDemoMode(true);
      }
      } catch (e) {
        console.error('[Dashboard] fetchData', e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleAdminCampaignUpdated = (campaignId, patch) => {
    if (!campaignId || !patch) return;
    setCampaigns((prev) =>
      prev.map((c) => (c.id === campaignId ? { ...c, ...patch } : c)),
    );
  };

  const handleAdminCampaignCreated = (campaign) => {
    if (!campaign?.id) return;
    const row = { ...campaign, admin_runtime_settings: campaign.admin_runtime_settings ?? null };
    setCampaigns((prev) => [row, ...prev]);
    setSelectedCampaignId(campaign.id);
    setAdminSearch(String(campaign.order_number || '').trim());
    setAdminPanel('campaign_progress');
  };

  const handleAdminCampaignDeleted = (campaignId) => {
    if (!campaignId) return;
    setCampaigns((prev) => prev.filter((c) => c.id !== campaignId));
  };

  const handleAdminRuntimeSettingsUpdated = (campaignId, settings) => {
    if (!campaignId) return;
    setCampaigns((prev) =>
      prev.map((c) => (c.id === campaignId ? { ...c, admin_runtime_settings: settings || null } : c)),
    );
  };

  const adminCustomerOptions = useMemo(
    () => [...new Set(campaigns.map((c) => String(c.customer_email || '').trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [campaigns],
  );
  const adminBrandOptions = useMemo(
    () => [...new Set(campaigns.map((c) => String(c.brand_name || '').trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [campaigns],
  );
  const adminPlanOptions = useMemo(
    () => [...new Set(campaigns.map((c) => String(c.plan || '').trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [campaigns],
  );
  const adminStatusOptions = useMemo(
    () => [...new Set(campaigns.map((c) => String(c.status || '').trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [campaigns],
  );

  const filteredCampaigns = useMemo(() => {
    if (!isAdminUser) return campaigns;
    let rows = [...campaigns];
    if (adminFilterCustomer !== 'all') rows = rows.filter((c) => String(c.customer_email || '').trim() === adminFilterCustomer);
    if (adminFilterBrand !== 'all') rows = rows.filter((c) => String(c.brand_name || '').trim() === adminFilterBrand);
    if (adminFilterPlan !== 'all') rows = rows.filter((c) => String(c.plan || '').trim() === adminFilterPlan);
    if (adminFilterStatus !== 'all') rows = rows.filter((c) => String(c.status || '').trim() === adminFilterStatus);
    if (adminFilterDelivery !== 'all') {
      rows = rows.filter((c) => {
        const linked = !!resolveLinkedDeliveryListSlug(c, user);
        if (!linked) return false;
        if (adminFilterDelivery === 'with_creators') return (c.linked_delivery_candidates || []).length > 0;
        return true;
      });
    }
    const q = adminSearch.trim().toLowerCase();
    if (q) {
      rows = rows.filter((c) =>
        `${c.order_number || ''} ${c.brand_name || ''} ${c.product_name || ''} ${c.customer_email || ''} ${c.plan || ''}`
          .toLowerCase()
          .includes(q),
      );
    }
    return rows;
  }, [isAdminUser, campaigns, adminFilterCustomer, adminFilterBrand, adminFilterPlan, adminFilterStatus, adminFilterDelivery, adminSearch, user]);

  const handleAdminDrilldownCustomer = (customerEmail) => {
    if (!isAdminUser) return;
    const next = adminFilterCustomer === customerEmail ? 'all' : customerEmail;
    setAdminFilterCustomer(next);
    setAdminFilterBrand('all');
    setAdminFilterPlan('all');
    setAdminFilterStatus('all');
    setAdminFilterDelivery('all');
    setAdminSearch(next === 'all' ? '' : customerEmail);
  };

  const handleAdminFocusOrderNumber = (orderNum) => {
    if (!isAdminUser || !orderNum) return;
    setAdminFilterCustomer('all');
    setAdminFilterBrand('all');
    setAdminFilterPlan('all');
    setAdminFilterStatus('all');
    setAdminFilterDelivery('all');
    setAdminSearch(String(orderNum).trim());
  };

  const handleAdminDrilldownMetric = (customerEmail, metric) => {
    if (!isAdminUser) return;
    setAdminFilterCustomer(customerEmail || 'all');
    setAdminFilterBrand('all');
    setAdminFilterPlan('all');
    setAdminFilterStatus('all');
    if (metric === 'linked_count') setAdminFilterDelivery('linked');
    else if (metric === 'linked_creators') setAdminFilterDelivery('with_creators');
    else setAdminFilterDelivery('all');
    setAdminSearch(customerEmail || '');
  };

  const handleAdminDrilldownCampaign = (campaignId) => {
    if (!campaignId) return;
    setSelectedCampaignId(campaignId);
    const target = campaigns.find((c) => c.id === campaignId);
    if (!target) return;
    if (isAdminUser) {
      setAdminPanel('campaign_progress');
      setAdminFilterCustomer(String(target.customer_email || '').trim() || 'all');
      setAdminFilterBrand(String(target.brand_name || '').trim() || 'all');
      setAdminFilterPlan(String(target.plan || '').trim() || 'all');
      setAdminFilterStatus('all');
      setAdminFilterDelivery(resolveLinkedDeliveryListSlug(target, user) ? 'linked' : 'all');
      setAdminSearch(String(target.order_number || '').trim());
    }
  };

  useEffect(() => {
    if (!filteredCampaigns.length) {
      setSelectedCampaignId(null);
      return;
    }
    if (!filteredCampaigns.some((c) => c.id === selectedCampaignId)) {
      setSelectedCampaignId(filteredCampaigns[0].id);
    }
  }, [filteredCampaigns, selectedCampaignId]);

  const closePasswordModal = () => {
    setIsPasswordMode(false);
    setNewPassword('');
    setNewPasswordConfirm('');
  };

  const handlePasswordUpdate = async () => {
    if (newPassword.length < 8) return alert("비밀번호는 8자 이상이어야 합니다.");
    if (newPassword !== newPasswordConfirm) return alert("비밀번호가 일치하지 않습니다.");
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) alert("실패: " + error.message);
    else {
      await supabase.auth.updateUser({ data: { ...(user?.user_metadata || {}), password_set: true } });
      alert("비밀번호가 성공적으로 변경되었습니다.");
      closePasswordModal();
    }
  };

  const handleSparkAdsClick = () => {
    alert("본 서비스는 부가 서비스를 구독 중인 브랜드에만 제공됩니다. (현재 준비 중)");
  };

  const handleImpersonateLogin = async () => {
    const email = impersonateEmail.trim();
    if (!email || !email.includes('@')) {
      alert('유효한 고객 이메일을 입력해주세요.');
      return;
    }
    setImpersonateLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        alert('로그인 세션이 없습니다.');
        return;
      }
      const res = await fetch(`${window.location.origin}/api/admin/impersonate-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email }),
      });
      let data;
      try {
        data = await res.json();
      } catch {
        const text = await res.text();
        const msg = res.status === 404
          ? 'API 경로를 찾을 수 없습니다. Vercel에 api/admin/impersonate-login.js가 배포되었는지 확인하세요.'
          : `서버 응답 오류 (${res.status}): ${text?.slice(0, 100) || '비정상 응답'}`;
        alert(msg);
        return;
      }
      if (!res.ok) {
        alert(data.error || '링크 생성에 실패했습니다.');
        return;
      }
      if (data.impersonate_url) {
        window.open(data.impersonate_url, '_blank', 'noopener,noreferrer');
        alert('새 탭에서 고객 화면이 열립니다. (링크는 1회용입니다)');
      }
    } catch (e) {
      console.error(e);
      const msg = e?.message || String(e);
      alert(`링크 생성 중 오류: ${msg.includes('fetch') || msg.includes('Failed') ? '인터넷 연결을 확인하거나 잠시 후 다시 시도해 주세요.' : msg}`);
    } finally {
      setImpersonateLoading(false);
    }
  };

  const adminLinkedCampaigns = isAdminUser
    ? campaigns.filter((c) => campaignMatchesLinkedDeliveryList(c, user))
    : [];

  const adminCustomerOverviewRows = useMemo(() => {
    if (!isAdminUser) return [];
    const rowsByCustomer = {};
    for (const c of campaigns) {
      const customer = String(c.customer_email || '미지정').trim() || '미지정';
      if (!rowsByCustomer[customer]) {
        rowsByCustomer[customer] = {
          customer,
          campaign_count: 0,
          linked_count: 0,
          linked_creators: 0,
          latest_at: null,
        };
      }
      const row = rowsByCustomer[customer];
      row.campaign_count += 1;
      const slug = resolveLinkedDeliveryListSlug(c, user);
      if (slug) {
        row.linked_count += 1;
        row.linked_creators += (c.linked_delivery_candidates || []).length;
      }
      const ts = c.updated_at || c.created_at || c.setup_submission_summary?.created_at || null;
      if (ts && (!row.latest_at || String(ts) > String(row.latest_at))) {
        row.latest_at = ts;
      }
    }
    return Object.values(rowsByCustomer).sort((a, b) => b.campaign_count - a.campaign_count);
  }, [isAdminUser, campaigns, user]);

  const adminSetupOverviewRows = useMemo(() => {
    if (!isAdminUser) return [];
    return campaigns
      .map((c) => ({
        id: c.id,
        order_number: c.order_number || '-',
        customer_email: c.customer_email || '-',
        brand_name: c.brand_name || '-',
        plan: c.plan || '-',
        company_name: c.setup_submission_summary?.company_name || '-',
        contact_name: c.setup_submission_summary?.contact_name || '-',
        contact_email: c.setup_submission_summary?.contact_email || '-',
        product_name_input: c.setup_submission_summary?.product_name || '-',
        target_country: c.setup_submission_summary?.target_country || '-',
        event_name: c.setup_submission_summary?.event_name || '-',
        guideline_status: c.setup_submission_summary?.guideline_status || '-',
        product_photo_urls: c.setup_submission_summary?.product_photo_urls || [],
        setup_created_at: c.setup_submission_summary?.created_at || null,
      }))
      .sort((a, b) => String(b.setup_created_at || '').localeCompare(String(a.setup_created_at || '')));
  }, [isAdminUser, campaigns]);

  const selectedCampaign = filteredCampaigns.find(c => c.id === selectedCampaignId) || null;

  const adminOngoingCampaigns = useMemo(
    () => campaigns.filter((c) => String(c.status || '') !== CampaignStatus.COMPLETED),
    [campaigns],
  );

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#020617]"><div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div></div>;

  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col selection:bg-cyan-500/30">
      <Navbar />
      
      <div className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 pt-40 pb-32">
        {isDemoMode && (
            <div className="mb-10 p-5 bg-gradient-to-r from-purple-900/40 to-blue-900/40 border border-purple-500/30 rounded-3xl flex items-center gap-4 text-purple-200 text-sm shadow-[0_0_20px_rgba(168,85,247,0.1)] animate-fade-in-down relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-purple-500 animate-pulse"></div>
                <AlertCircle size={20} className="text-purple-400 shrink-0" />
                <span className="font-light tracking-tight">현재 시스템 체험을 위한 <b className="font-black text-white uppercase tracking-widest underline decoration-purple-500 underline-offset-4">Demo Mode</b>가 활성화되어 있습니다. 실제 캠페인 계약 시 실시간 데이터 피드가 전송됩니다.</span>
            </div>
        )}

        {!isAdminUser && user?.email?.toLowerCase().trim() === CUSTOM_OFFER_FRAMELESS_EMAIL && (
          <div className="mb-10 p-6 md:p-8 rounded-[2rem] border border-emerald-500/35 bg-gradient-to-br from-emerald-950/50 to-slate-900/80 shadow-[0_0_40px_rgba(16,185,129,0.12)]">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              <div>
                <p className="text-[10px] font-black tracking-[0.25em] uppercase text-emerald-400/90 mb-2">개인 맞춤 결제</p>
                <h2 className="text-xl md:text-2xl font-black text-white mb-2">The Frameless 맞춤 견적</h2>
                <p className="text-sm text-slate-400 leading-relaxed max-w-xl">
                  {FRAMELESS_OFFER_PRICING.visitQty > 0 ? (
                    <>
                      시딩 35,000원 × {FRAMELESS_OFFER_PRICING.seedingQty}건 · 방문형 시딩 240,000원 ×{' '}
                      {FRAMELESS_OFFER_PRICING.visitQty}건 (공급가, 부가세 별도). 아래 금액은 부가세 포함 총액입니다.
                    </>
                  ) : (
                    <>
                      시딩(건당) 35,000원 × {FRAMELESS_OFFER_PRICING.seedingQty}건만 진행합니다 (공급가, 부가세 별도). 아래 금액은 부가세 포함
                      총액입니다.
                    </>
                  )}
                </p>
                <ul className="mt-4 space-y-2 text-sm text-slate-300">
                  <li className="flex justify-between gap-4 max-w-md">
                    <span>시딩(건당) × {FRAMELESS_OFFER_PRICING.seedingQty}건 · 공급가</span>
                    <span className="font-mono text-white">
                      {(FRAMELESS_OFFER_PRICING.seedingUnitPrice * FRAMELESS_OFFER_PRICING.seedingQty).toLocaleString()}원
                    </span>
                  </li>
                  {FRAMELESS_OFFER_PRICING.visitQty > 0 ? (
                    <li className="flex justify-between gap-4 max-w-md">
                      <span>방문형 시딩(건당) × {FRAMELESS_OFFER_PRICING.visitQty}건 · 공급가</span>
                      <span className="font-mono text-white">
                        {(FRAMELESS_OFFER_PRICING.visitUnitPrice * FRAMELESS_OFFER_PRICING.visitQty).toLocaleString()}원
                      </span>
                    </li>
                  ) : null}
                  <li className="flex justify-between gap-4 max-w-md border-t border-white/10 pt-2 mt-2"><span className="text-emerald-200/90">부가세(10%)</span><span className="font-mono text-emerald-200">{getFramelessOfferTotals().vat.toLocaleString()}원</span></li>
                  <li className="flex justify-between gap-4 max-w-md text-lg font-black text-white">
                    <span>{paidOrders.length > 0 ? '확정 계약(VAT 포함)' : '결제 예정(VAT 포함)'}</span>
                    <span className="text-emerald-400">{getFramelessOfferTotals().total.toLocaleString()}원</span>
                  </li>
                </ul>
              </div>
              {paidOrders.length > 0 ? (
                <div className="shrink-0 max-w-xs rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-6 py-4 text-sm text-emerald-100/95 leading-relaxed">
                  결제가 완료된 계약입니다. 시딩 {FRAMELESS_OFFER_PRICING.seedingQty}건 · VAT 포함{' '}
                  <span className="font-black text-white">{getFramelessOfferTotals().total.toLocaleString()}원</span>으로 진행 중입니다.
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate('/checkout', { state: { customOfferId: CUSTOM_OFFER_FRAMELESS_ID } })}
                  className="shrink-0 inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-black text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 transition-all shadow-lg shadow-emerald-500/20"
                >
                  맞춤 견적 결제하기 <ArrowRight size={18} />
                </button>
              )}
            </div>
          </div>
        )}

        {!isDemoMode && user && myCustomPaymentOffers.length > 0 && (
          <div className="mb-10 space-y-4">
            <p className="text-[10px] font-black tracking-[0.25em] uppercase text-sky-400/90 px-1">개인 결제창</p>
            {myCustomPaymentOffers.map((offer) => {
              const t = computeDbOfferTotals(offer);
              const seedLine = `${offer.seeding_line_label || '시딩(건당)'} × ${Number(offer.seeding_qty) || 0}건 · 공급가`;
              const seedSupply = (Number(offer.seeding_unit_price) || 0) * (Number(offer.seeding_qty) || 0);
              const visitQty = Number(offer.visit_qty) || 0;
              const visitSupply = visitQty > 0 ? (Number(offer.visit_unit_price) || 0) * visitQty : 0;
              return (
                <div
                  key={offer.id}
                  className="p-6 md:p-8 rounded-[2rem] border border-sky-500/35 bg-gradient-to-br from-sky-950/45 to-slate-900/80 shadow-[0_0_32px_rgba(14,165,233,0.1)]"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                    <div>
                      <h2 className="text-xl md:text-2xl font-black text-white mb-2">
                        {offer.title?.trim() || '맞춤 견적 결제'}
                      </h2>
                      <p className="text-sm text-slate-400 leading-relaxed max-w-xl">
                        관리자가 귀하의 계정으로만 발급한 결제창입니다. 시딩·방문 라인의 단가·수량은 공용 요금제와 별도이며, 아래는 부가세 포함 총액입니다.
                      </p>
                      <ul className="mt-4 space-y-2 text-sm text-slate-300">
                        {(Number(offer.seeding_qty) || 0) > 0 && (
                          <li className="flex justify-between gap-4 max-w-md">
                            <span>{seedLine}</span>
                            <span className="font-mono text-white">{seedSupply.toLocaleString()}원</span>
                          </li>
                        )}
                        {visitQty > 0 && (
                          <li className="flex justify-between gap-4 max-w-md">
                            <span>
                              {offer.visit_line_label || '방문형 시딩(건당)'} × {visitQty}건 · 공급가
                            </span>
                            <span className="font-mono text-white">{visitSupply.toLocaleString()}원</span>
                          </li>
                        )}
                        <li className="flex justify-between gap-4 max-w-md border-t border-white/10 pt-2 mt-2">
                          <span className="text-sky-200/90">부가세</span>
                          <span className="font-mono text-sky-200">{t.vat.toLocaleString()}원</span>
                        </li>
                        <li className="flex justify-between gap-4 max-w-md text-lg font-black text-white">
                          <span>결제 예정(VAT 포함)</span>
                          <span className="text-sky-400">{t.total.toLocaleString()}원</span>
                        </li>
                      </ul>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate(`/checkout?offer=${offer.id}`)}
                      className="shrink-0 inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-black text-slate-950 bg-gradient-to-r from-sky-400 to-cyan-500 hover:from-sky-300 hover:to-cyan-400 transition-all shadow-lg shadow-sky-500/20"
                    >
                      이 견적으로 결제하기 <ArrowRight size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {isAdminUser && (
          <div className="mb-10 space-y-6">
            {/* 상단: 캠페인 개수·가로 목록·필터 */}
            <section className="rounded-2xl border border-slate-600/50 bg-gradient-to-b from-slate-900/95 to-slate-950 shadow-[0_20px_50px_rgba(0,0,0,0.35)] overflow-hidden">
              <div className="px-5 py-5 sm:px-8 sm:py-6 border-b border-white/10 bg-slate-800/40 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-indigo-300 mb-1">운영팀 전용</p>
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">캠페인 현황 한눈에 보기</h2>
                  <p className="mt-2 text-sm text-slate-400 leading-relaxed max-w-2xl">
                    전체 규모를 확인하고, 캠페인을 눌러 선택하세요. 세부 작업은 그 아래 <strong className="text-slate-200">왼쪽 메뉴</strong>에서 골라 엽니다.
                  </p>
                </div>
                {user && (
                  <button
                    type="button"
                    onClick={() => setIsPasswordMode(true)}
                    className="shrink-0 flex items-center gap-2 px-5 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold hover:bg-white/10 text-slate-200"
                  >
                    <Settings size={16} className="text-slate-400" /> 비밀번호·계정 설정
                  </button>
                )}
              </div>
              <div className="px-5 sm:px-8 py-4 grid grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-950/40">
                <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
                  <p className="text-[11px] text-slate-400 font-medium">진행 중인 캠페인</p>
                  <p className="text-2xl font-black text-amber-200 mt-0.5 tabular-nums">{adminOngoingCampaigns.length}</p>
                  <p className="text-[10px] text-slate-500 mt-1">아직 끝나지 않은 건수입니다.</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
                  <p className="text-[11px] text-slate-400 font-medium">등록된 캠페인 전체</p>
                  <p className="text-2xl font-black text-white mt-0.5 tabular-nums">{campaigns.length}</p>
                  <p className="text-[10px] text-slate-500 mt-1">시스템에 올라온 전체입니다.</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
                  <p className="text-[11px] text-slate-400 font-medium">명단이 붙은 캠페인</p>
                  <p className="text-2xl font-black text-cyan-200 mt-0.5 tabular-nums">{adminLinkedCampaigns.length}</p>
                  <p className="text-[10px] text-slate-500 mt-1">인플루언서 리스트가 있는 건입니다.</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
                  <p className="text-[11px] text-slate-400 font-medium">지금 목록에 보이는 수</p>
                  <p className="text-2xl font-black text-emerald-200 mt-0.5 tabular-nums">{filteredCampaigns.length}</p>
                  <p className="text-[10px] text-slate-500 mt-1">아래 필터·검색이 적용된 개수입니다.</p>
                </div>
              </div>
              <div className="px-5 sm:px-8 py-4 border-t border-white/10">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <p className="text-xs font-bold text-slate-300">캠페인 목록 — 누르면 선택됩니다</p>
                  <span className="text-[10px] text-slate-500 shrink-0">가로로 스크롤</span>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 pt-1 -mx-1 px-1 scroll-smooth">
                  {filteredCampaigns.length === 0 ? (
                    <p className="text-sm text-slate-500 py-4">조건에 맞는 캠페인이 없습니다. 필터를 풀어 보세요.</p>
                  ) : (
                    filteredCampaigns.map((c) => {
                      const active = selectedCampaignId === c.id;
                      const label = CAMPAIGN_STATUS_KO[c.status] || c.status || '단계 미정';
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setSelectedCampaignId(c.id);
                            setAdminPanel('campaign_progress');
                          }}
                          className={`shrink-0 w-[min(100%,240px)] text-left rounded-xl border px-4 py-3 transition-all ${
                            active
                              ? 'border-cyan-400/60 bg-cyan-500/15 ring-1 ring-cyan-400/30'
                              : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]'
                          }`}
                        >
                          <p className="text-sm font-bold text-white truncate">{c.brand_name || c.product_name || '이름 없음'}</p>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5 font-mono">{c.order_number || '주문번호 없음'}</p>
                          <p className="text-[10px] text-cyan-200/90 mt-2 font-semibold">{label}</p>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
              <div className="px-5 sm:px-8 py-4 bg-slate-900/70 border-t border-white/10">
                <p className="text-xs font-bold text-cyan-100 mb-3">위 목록만 좁히기</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2">
                  <input
                    value={adminSearch}
                    onChange={(e) => setAdminSearch(e.target.value)}
                    placeholder="주문번호, 브랜드, 이메일 검색"
                    className="xl:col-span-2 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500"
                  />
                  <select value={adminFilterCustomer} onChange={(e) => setAdminFilterCustomer(e.target.value)} className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white">
                    <option value="all" className="bg-slate-900 text-white">고객 이메일 — 전체</option>
                    {adminCustomerOptions.map((v) => (
                      <option key={v} value={v} className="bg-slate-900 text-white">
                        {v}
                      </option>
                    ))}
                  </select>
                  <select value={adminFilterBrand} onChange={(e) => setAdminFilterBrand(e.target.value)} className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white">
                    <option value="all" className="bg-slate-900 text-white">브랜드 — 전체</option>
                    {adminBrandOptions.map((v) => (
                      <option key={v} value={v} className="bg-slate-900 text-white">
                        {v}
                      </option>
                    ))}
                  </select>
                  <select value={adminFilterPlan} onChange={(e) => setAdminFilterPlan(e.target.value)} className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white">
                    <option value="all" className="bg-slate-900 text-white">상품 유형 — 전체</option>
                    {adminPlanOptions.map((v) => (
                      <option key={v} value={v} className="bg-slate-900 text-white">
                        {v}
                      </option>
                    ))}
                  </select>
                  <select value={adminFilterStatus} onChange={(e) => setAdminFilterStatus(e.target.value)} className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white">
                    <option value="all" className="bg-slate-900 text-white">진행 단계 — 전체</option>
                    {adminStatusOptions.map((v) => (
                      <option key={v} value={v} className="bg-slate-900 text-white">
                        {v}
                      </option>
                    ))}
                  </select>
                  <select value={adminFilterDelivery} onChange={(e) => setAdminFilterDelivery(e.target.value)} className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white">
                    <option value="all" className="bg-slate-900 text-white">인플루언서 명단 — 조건 없음</option>
                    <option value="linked" className="bg-slate-900 text-white">
                      명단이 붙은 캠페인만
                    </option>
                    <option value="with_creators" className="bg-slate-900 text-white">
                      명단에 사람이 있는 캠페인만
                    </option>
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      setAdminFilterCustomer('all');
                      setAdminFilterBrand('all');
                      setAdminFilterPlan('all');
                      setAdminFilterStatus('all');
                      setAdminFilterDelivery('all');
                      setAdminSearch('');
                    }}
                    className="px-3 py-2.5 rounded-xl text-xs font-bold bg-white/10 border border-white/15 text-slate-200 hover:bg-white/15"
                  >
                    필터 전부 풀기
                  </button>
                </div>
              </div>
            </section>

            {/* 좌측 메뉴 + 우측 본문 */}
            <div className="rounded-2xl border border-slate-600/40 bg-slate-950/50 overflow-hidden flex flex-col lg:flex-row min-h-[560px] shadow-[0_16px_48px_rgba(0,0,0,0.25)]">
              <nav className="w-full lg:w-56 shrink-0 bg-[#0b1220] border-b lg:border-b-0 lg:border-r border-white/10 p-2 lg:p-3 flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible lg:overflow-y-auto max-h-[none] lg:max-h-[calc(100vh-12rem)]">
                {[
                  { id: 'campaign_progress', label: '캠페인 대시보드 보기', sub: '고객 진행 화면 그대로', icon: LayoutDashboard },
                  { id: 'campaign_lifecycle', label: '캠페인 추가·삭제', sub: '신규 생성·영구 삭제', icon: PlusCircle },
                  { id: 'customer_tables', label: '운영 집계·세팅 폼', sub: '고객사별 숫자·제출 내용', icon: Table2 },
                  { id: 'customer_view', label: '고객 화면으로 보기', sub: '새 탭 미리보기', icon: UserCheck },
                  { id: 'payment_offers', label: '개인 결제창 만들기', sub: '맞춤 견적 링크', icon: CreditCard },
                  { id: 'ops_tools', label: '최근 주문 한눈에 보기', sub: '입금·환불·취소 수정', icon: ClipboardList },
                  { id: 'excel_delivery', label: '엑셀로 명단 납품하기', sub: '파일 올려 반영', icon: FileSpreadsheet },
                  { id: 'campaign_quick_edit', label: '캠페인 정보 수정', sub: '기본 정보·일정·가이드', icon: FileText },
                  { id: 'support_inbox', label: '고객 1:1 문의', sub: '사이트 내 문의·답장', icon: MessageCircle },
                  { id: 'all_invoices', label: '진행 캠페인 인보이스', sub: '주문별 목록·PDF', icon: Receipt },
                ].map((item) => {
                  const Icon = item.icon;
                  const on = adminPanel === item.id;
                  const supportBadge = item.id === 'support_inbox' && staffSupportUnread > 0;
                  const supportSubText =
                    item.id === 'support_inbox' && staffUnreadByCustomer?.length > 0
                      ? staffUnreadByCustomer.map((x) => `${x.customerEmail} (${x.count})`).join(' · ')
                      : item.sub;
                  const supportTitle =
                    item.id === 'support_inbox' && staffUnreadByCustomer?.length > 0
                      ? `미읽음 ${staffSupportUnread}건 — ${staffUnreadByCustomer.map((x) => `${x.customerEmail} ${x.count}건`).join(', ')}`
                      : undefined;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      title={supportTitle}
                      onClick={() => setAdminPanel(item.id)}
                      className={`flex shrink-0 lg:w-full items-center gap-3 text-left rounded-xl px-3 py-3 transition-colors min-w-[200px] lg:min-w-0 ${
                        on ? 'bg-cyan-500/20 border border-cyan-400/40 text-white' : 'border border-transparent text-slate-400 hover:bg-white/[0.06] hover:text-slate-200'
                      }`}
                    >
                      <span className={`relative flex h-9 w-9 items-center justify-center rounded-lg shrink-0 ${on ? 'bg-cyan-500/25 text-cyan-200' : 'bg-white/5 text-slate-500'}`}>
                        <Icon size={18} />
                        {supportBadge ? (
                          <span className="absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-[#0b1220] bg-rose-500 px-0.5 text-[9px] font-black text-white tabular-nums">
                            {staffSupportUnread > 99 ? '99+' : staffSupportUnread}
                          </span>
                        ) : null}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-xs font-bold leading-tight">{item.label}</span>
                        <span
                          className={`block text-[10px] mt-0.5 leading-snug ${
                            item.id === 'support_inbox' && staffUnreadByCustomer?.length > 0
                              ? 'text-amber-200/95 line-clamp-2'
                              : 'text-slate-500'
                          }`}
                        >
                          {supportSubText}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </nav>

              <div className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 bg-slate-950/40">
                {adminPanel === 'campaign_lifecycle' && (
                  <div>
                    <p className="text-sm text-slate-400 mb-6">
                      신규 캠페인은 고객 계정(가입 이메일)에 바로 붙습니다. 삭제는 복구할 수 없으니 주문번호 확인 후 진행하세요.
                    </p>
                    <AdminCampaignLifecyclePanel
                      selectedCampaign={selectedCampaign}
                      onCreated={handleAdminCampaignCreated}
                      onDeleted={handleAdminCampaignDeleted}
                    />
                  </div>
                )}

                {adminPanel === 'campaign_progress' && (
                  <div>
                    <p className="text-xs text-slate-500 mb-4">
                      선택된 캠페인: <span className="text-slate-200 font-semibold">{selectedCampaign?.brand_name || selectedCampaign?.product_name || '없음'}</span>
                      {selectedCampaign?.order_number ? (
                        <span className="text-slate-500 font-mono ml-2">({selectedCampaign.order_number})</span>
                      ) : null}
                    </p>
                    {filteredCampaigns.length === 0 && !isDemoMode ? (
                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-12 text-center text-slate-400">조건에 맞는 캠페인이 없습니다.</div>
                    ) : !selectedCampaign ? (
                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-12 text-center text-slate-400">위 목록에서 캠페인을 선택해 주세요.</div>
                    ) : (
                      <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 sm:p-10 shadow-inner relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 pb-6 border-b border-white/10 gap-6">
                          <div>
                            <h3 className="text-2xl md:text-4xl font-black text-white tracking-tight leading-tight">
                              {selectedCampaign?.product_name || selectedCampaign?.order_summary?.plan_name || '캠페인'}
                            </h3>
                            <p className="text-slate-500 mt-2 flex items-center gap-2">
                              <span
                                className={`w-2.5 h-2.5 rounded-full ${
                                  selectedCampaign?.status === CampaignStatus.COMPLETED ? 'bg-slate-600' : 'bg-cyan-400 animate-pulse'
                                }`}
                              />
                              {getCampaignProgressSubtitle(selectedCampaign?.status)}
                            </p>
                          </div>
                          <StatusBadge status={selectedCampaign?.status} />
                        </div>
                        <div className="flex flex-wrap gap-2 mb-8">
                          <button
                            type="button"
                            onClick={() => setAdminCampaignProgressTab('progress')}
                            className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-colors ${
                              adminCampaignProgressTab === 'progress'
                                ? 'bg-cyan-500/25 border-cyan-400/50 text-white'
                                : 'bg-white/[0.04] border-white/10 text-slate-400 hover:border-white/20'
                            }`}
                          >
                            진행 화면
                          </button>
                          <button
                            type="button"
                            onClick={() => setAdminCampaignProgressTab('invoice')}
                            className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-colors inline-flex items-center gap-2 ${
                              adminCampaignProgressTab === 'invoice'
                                ? 'bg-cyan-500/25 border-cyan-400/50 text-white'
                                : 'bg-white/[0.04] border-white/10 text-slate-400 hover:border-white/20'
                            }`}
                          >
                            <Receipt size={14} className="opacity-80" />
                            인보이스
                          </button>
                        </div>
                        {adminCampaignProgressTab === 'invoice' ? (
                          <InvoiceDetail campaign={selectedCampaign} adminReadOnly />
                        ) : (
                          <CampaignDetail
                            campaign={selectedCampaign}
                            isDemoMode={isDemoMode}
                            user={user}
                            isAdminUser={isAdminUser}
                            onCampaignScheduleUpdated={handleCampaignScheduleUpdated}
                          />
                        )}
                      </div>
                    )}
                  </div>
                )}

                {adminPanel === 'customer_tables' && (
          <section className="rounded-[1.5rem] border border-slate-600/40 bg-gradient-to-b from-slate-900/95 to-slate-950 overflow-hidden">
            <div className="px-5 py-6 sm:px-8 border-b border-white/10 bg-slate-800/50">
              <h3 className="text-lg font-black text-white tracking-tight">운영 집계·세팅 폼</h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed max-w-3xl">
                숫자·줄을 누르면 위쪽 <strong className="text-slate-200">필터와 가로 캠페인 줄</strong>이 같이 바뀝니다. 고객사별로 몇 건인지 보거나, 제출한 시작 폼 내용을 바로 확인할 때 쓰면 됩니다.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {adminFilterCustomer !== 'all' && (
                  <span className="text-xs px-3 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-100">
                    고객 메일: {adminFilterCustomer}
                  </span>
                )}
                {adminFilterBrand !== 'all' && (
                  <span className="text-xs px-3 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-100">
                    브랜드: {adminFilterBrand}
                  </span>
                )}
                {adminFilterPlan !== 'all' && (
                  <span className="text-xs px-3 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-100">
                    상품 유형: {adminFilterPlan}
                  </span>
                )}
                {adminFilterStatus !== 'all' && (
                  <span className="text-xs px-3 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-100">
                    진행 단계: {adminFilterStatus}
                  </span>
                )}
                {adminFilterDelivery !== 'all' && (
                  <span className="text-xs px-3 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-100">
                    {adminFilterDelivery === 'linked' ? '인플루언서 명단이 있는 캠페인만' : '명단이 있고 인원 수도 채워진 캠페인만'}
                  </span>
                )}
                {adminSearch.trim() && (
                  <span className="text-xs px-3 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-100">
                    검색어: {adminSearch.trim()}
                  </span>
                )}
              </div>
            </div>

            <div className="px-6 py-6 sm:px-10 grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-950/40">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4">
                <p className="text-xs text-slate-400 font-medium">등록된 캠페인 전체</p>
                <p className="text-3xl font-black text-white mt-1 tabular-nums">{campaigns.length}</p>
                <p className="text-[11px] text-slate-500 mt-2">고객사와 관계없이 시스템에 올라온 캠페인 수입니다.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4">
                <p className="text-xs text-slate-400 font-medium">인플루언서 명단이 붙은 캠페인</p>
                <p className="text-3xl font-black text-cyan-200 mt-1 tabular-nums">{adminLinkedCampaigns.length}</p>
                <p className="text-[11px] text-slate-500 mt-2">납품 리스트를 불러와 쓸 수 있는 캠페인 수입니다.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4">
                <p className="text-xs text-slate-400 font-medium">붙어 있는 인플루언서 수 합계</p>
                <p className="text-3xl font-black text-emerald-200 mt-1 tabular-nums">
                  {adminLinkedCampaigns.reduce((sum, c) => sum + ((c.linked_delivery_candidates || []).length || 0), 0)}
                </p>
                <p className="text-[11px] text-slate-500 mt-2">위 캠페인들에 올라와 있는 명단 인원을 모두 더한 값입니다.</p>
              </div>
            </div>

            <div className="px-6 pb-8 sm:px-10 space-y-8">
              <div className="rounded-2xl border border-white/10 bg-slate-900/60 overflow-hidden shadow-inner">
                <div className="px-5 py-4 border-b border-white/10 bg-white/[0.04]">
                  <h3 className="text-base font-bold text-white">고객사별로 묶어 보기</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    이메일 한 줄이 한 고객사입니다. 숫자를 누르면 위쪽 가로 캠페인 목록만 그 조건으로 줄어듭니다. 행 전체를 누르면 그 고객만 보기입니다.
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs min-w-[640px]">
                    <thead className="bg-[#0c1422] text-slate-400 border-b border-white/10">
                      <tr>
                        <th className="text-left px-4 py-3 font-semibold">고객 이메일</th>
                        <th className="text-right px-4 py-3 font-semibold">캠페인 수</th>
                        <th className="text-right px-4 py-3 font-semibold">명단 있는 캠페인</th>
                        <th className="text-right px-4 py-3 font-semibold">인플루언서 수</th>
                        <th className="text-right px-4 py-3 font-semibold">가장 최근 활동</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {adminCustomerOverviewRows.map((row) => (
                        <tr
                          key={row.customer}
                          onClick={() => handleAdminDrilldownCustomer(row.customer)}
                          className={`cursor-pointer transition-colors ${
                            adminFilterCustomer === row.customer ? 'bg-cyan-500/15' : 'hover:bg-white/[0.04]'
                          }`}
                          title={adminFilterCustomer === row.customer ? '다시 누르면 이 고객만 보기가 풀립니다' : `${row.customer} 님 캠페인만 보기`}
                        >
                          <td className="px-4 py-3 text-slate-100">{row.customer}</td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAdminDrilldownMetric(row.customer, 'campaign_count');
                              }}
                              className="text-white font-bold underline decoration-dotted underline-offset-4 hover:text-cyan-200"
                              title="이 고객의 캠페인만 위 가로 목록에 보이게 하기"
                            >
                              {row.campaign_count}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAdminDrilldownMetric(row.customer, 'linked_count');
                              }}
                              className="text-cyan-300 font-bold underline decoration-dotted underline-offset-4 hover:text-cyan-200"
                              title="인플루언서 명단이 붙은 캠페인만 보기"
                            >
                              {row.linked_count}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAdminDrilldownMetric(row.customer, 'linked_creators');
                              }}
                              className="text-cyan-200 underline decoration-dotted underline-offset-4 hover:text-cyan-100"
                              title="명단이 있고 인원 수도 채워진 캠페인만 보기"
                            >
                              {row.linked_creators}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-right text-slate-400 whitespace-nowrap">
                            {row.latest_at ? new Date(row.latest_at).toLocaleString('ko-KR') : '—'}
                          </td>
                        </tr>
                      ))}
                      {adminCustomerOverviewRows.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-4 py-10 text-center text-slate-500 text-sm">
                            아직 집계할 캠페인이 없습니다.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-900/60 overflow-hidden shadow-inner">
                <div className="px-5 py-4 border-b border-white/10 bg-white/[0.04]">
                  <h3 className="text-base font-bold text-white">캠페인 세팅 정보 한눈에 보기</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    캠페인 시작 전 고객이 제출한 폼의 <strong className="text-slate-200">가장 최근 내용</strong>입니다. 한 줄을 누르면 그 캠페인이 위 가로 목록에서 선택됩니다.
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs min-w-[720px]">
                    <thead className="bg-[#0c1422] text-slate-400 border-b border-white/10">
                      <tr>
                        <th className="text-left px-4 py-3 font-semibold">주문번호 · 고객</th>
                        <th className="text-left px-4 py-3 font-semibold">브랜드 · 상품 유형</th>
                        <th className="text-left px-4 py-3 font-semibold">폼에 적힌 내용</th>
                        <th className="text-right px-4 py-3 font-semibold">보낸 시각</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {adminSetupOverviewRows.map((row) => (
                        <tr
                          key={row.id}
                          onClick={() => handleAdminDrilldownCampaign(row.id)}
                          className={`cursor-pointer transition-colors ${
                            selectedCampaignId === row.id ? 'bg-cyan-500/15' : 'hover:bg-white/[0.04]'
                          }`}
                          title="눌러서 이 캠페인으로 이동"
                        >
                          <td className="px-4 py-3 align-top">
                            <p className="text-slate-100 font-medium">{row.order_number}</p>
                            <p className="text-slate-500 mt-1">{row.customer_email}</p>
                          </td>
                          <td className="px-4 py-3 align-top">
                            <p className="text-white font-semibold">{row.brand_name}</p>
                            <p className="text-slate-500 mt-1">{row.plan}</p>
                          </td>
                          <td className="px-4 py-3 align-top text-slate-300 leading-relaxed">
                            <p>
                              회사: <span className="text-slate-100">{row.company_name}</span>
                            </p>
                            <p>
                              담당자: <span className="text-slate-100">{row.contact_name}</span> · {row.contact_email}
                            </p>
                            <p>
                              제품: <span className="text-slate-100">{row.product_name_input}</span>
                            </p>
                            <p>
                              국가: <span className="text-slate-100">{row.target_country}</span>
                            </p>
                            <p>
                              행사: <span className="text-slate-100">{row.event_name}</span> · 가이드 진행:{' '}
                              <span className="text-slate-100">{row.guideline_status}</span>
                            </p>
                            {Array.isArray(row.product_photo_urls) && row.product_photo_urls.length > 0 && (
                              <div className="mt-2 flex items-center gap-2">
                                <img
                                  src={ensureAbsoluteUrl(row.product_photo_urls[0])}
                                  alt=""
                                  className="w-10 h-10 rounded-md object-cover border border-white/15"
                                  loading="lazy"
                                />
                                <span className="text-slate-400 text-[11px]">참고 사진 {row.product_photo_urls.length}장</span>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 align-top text-right text-slate-400 whitespace-nowrap">
                            {row.setup_created_at ? new Date(row.setup_created_at).toLocaleString('ko-KR') : '—'}
                          </td>
                        </tr>
                      ))}
                      {adminSetupOverviewRows.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-4 py-10 text-center text-slate-500 text-sm">
                            고객이 제출한 세팅 폼이 아직 없습니다.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>
                )}

                {adminPanel === 'customer_view' && (
                  <div className="rounded-2xl border border-slate-600/40 bg-slate-900/70 overflow-hidden">
                    <div className="px-6 py-5 border-b border-white/10 bg-slate-800/80">
                      <div className="flex items-start gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/15 border border-cyan-500/30">
                          <UserCheck size={20} className="text-cyan-300" />
                        </span>
                        <div>
                          <h3 className="text-base font-bold text-white">고객 화면 그대로 보기</h3>
                          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                            비밀번호 없이, 고객이 보는 대시보드만 새 탭에서 엽니다. 아래에 고객 이메일을 넣고 버튼을 누르세요.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="px-6 py-6 space-y-4 bg-slate-950/40">
                      <p className="text-sm text-slate-400 leading-relaxed">
                        위 캠페인 데이터에 포함된 <strong className="text-slate-200">고객 이메일</strong>은 아래 목록에서 바로 고를 수 있습니다. 목록에 없으면 입력란에 직접 적어도 됩니다. Supabase Auth에 가입된 주소여야 합니다.
                      </p>
                      {adminCustomerOptions.length === 0 ? (
                        <p className="text-xs text-amber-200/90 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2">
                          아직 대시보드에 캠페인이 없어 이메일 목록이 비어 있습니다. 아래 입력란에 이메일을 직접 입력해 주세요.
                        </p>
                      ) : null}
                      <div className="space-y-3">
                        {adminCustomerOptions.length > 0 ? (
                          <div>
                            <label htmlFor="impersonate-customer-select" className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1.5">
                              캠페인 진행 이력이 있는 고객
                            </label>
                            <select
                              id="impersonate-customer-select"
                              value={
                                adminCustomerOptions.includes(impersonateEmail.trim())
                                  ? impersonateEmail.trim()
                                  : ''
                              }
                              onChange={(e) => setImpersonateEmail(e.target.value)}
                              className="w-full max-w-xl px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                            >
                              <option value="" className="bg-slate-900 text-slate-400">
                                — 이메일 선택 —
                              </option>
                              {adminCustomerOptions.map((v) => (
                                <option key={v} value={v} className="bg-slate-900 text-white">
                                  {v}
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : null}
                        <div>
                          <label htmlFor="impersonate-email-input" className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1.5">
                            이메일 (선택 반영 · 직접 입력)
                          </label>
                          <div className="flex flex-wrap gap-3 items-stretch">
                            <input
                              id="impersonate-email-input"
                              type="email"
                              placeholder="예: heather@example.com"
                              value={impersonateEmail}
                              onChange={(e) => setImpersonateEmail(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleImpersonateLogin()}
                              className="flex-1 min-w-[220px] px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 text-sm"
                            />
                            <button
                              type="button"
                              onClick={handleImpersonateLogin}
                              disabled={impersonateLoading}
                              className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 rounded-xl font-bold text-sm text-white transition-all flex items-center justify-center gap-2"
                            >
                              {impersonateLoading ? <RefreshCw size={16} className="animate-spin" /> : null}
                              새 탭에서 열기
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {adminPanel === 'payment_offers' && (
                  <div>
                    <p className="text-sm text-slate-400 mb-4">고객에게만 보이는 맞춤 결제창을 만들고 링크를 보냅니다.</p>
                    <AdminCustomPaymentOffersPanel />
                  </div>
                )}

                {adminPanel === 'ops_tools' && (
                  <div>
                    <AdminOpsToolsPanel onFocusOrderNumber={handleAdminFocusOrderNumber} />
                  </div>
                )}

                {adminPanel === 'excel_delivery' && (
                  <div>
                    <AdminDeliveryExcelImportPanel
                      campaigns={campaigns}
                      onApplied={() => {
                        window.location.reload();
                      }}
                    />
                  </div>
                )}

                {adminPanel === 'campaign_quick_edit' && (
                  <div className="space-y-8">
                    <p className="text-sm text-slate-400">
                      위 가로 목록에서 캠페인을 고른 뒤, 기본 정보·주문번호·가이드라인·일정 날짜·드랍 확정 표시까지 이 탭에서 모두 수정할 수 있습니다.
                    </p>
                    {!selectedCampaign?.id ? (
                      <p className="text-slate-500 text-sm">캠페인을 먼저 선택해 주세요.</p>
                    ) : (
                      <>
                        <AdminCampaignQuickEditor campaign={selectedCampaign} onSaved={handleAdminCampaignUpdated} />
                        <AdminCampaignRuntimeSettingsEditor campaign={selectedCampaign} onSaved={handleAdminRuntimeSettingsUpdated} />
                        <div className="rounded-2xl border border-amber-500/30 bg-slate-900/80 p-6 md:p-8">
                          <h3 className="text-lg font-black text-white mb-2">일정표·날짜 (드랍 마감·업로드 기한 등)</h3>
                          <p className="text-xs text-slate-400 mb-4">
                            방문형·일반형에 맞는 날짜 칸만 저장됩니다. 비우면 자동 계산 일정을 따릅니다.
                          </p>
                          <AdminCampaignScheduleEditor
                            campaign={selectedCampaign}
                            onSaved={handleCampaignScheduleUpdated}
                          />
                        </div>
                      </>
                    )}
                  </div>
                )}

                {adminPanel === 'support_inbox' && (
                  <div>
                    <AdminSupportInboxPanel />
                  </div>
                )}

                {adminPanel === 'all_invoices' && (
                  <div>
                    <AdminAllInvoicesPanel
                      embedded
                      campaigns={campaigns}
                      campaignsLoading={loading}
                      onCampaignsReplaced={setCampaigns}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {user && !user?.user_metadata?.password_set && (
            <div className="mb-10 p-5 bg-white/[0.03] border border-white/10 rounded-3xl flex flex-col sm:flex-row sm:items-center gap-4 text-slate-300 text-sm animate-fade-in-down">
                <Lock size={22} className="text-purple-400 shrink-0" />
                <div className="flex-1">
                    <p className="font-medium text-white">다음부터는 비밀번호로 빠르게 로그인할 수 있어요.</p>
                    <p className="text-slate-500 text-xs mt-0.5">한 번만 설정하면, 이메일+비밀번호만으로 바로 들어올 수 있습니다.</p>
                </div>
                <button
                    onClick={() => navigate('/set-password?from=/dashboard')}
                    className="shrink-0 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold text-sm hover:shadow-[0_0_15px_rgba(147,51,234,0.4)] transition-all"
                >
                    비밀번호 설정하기
                </button>
            </div>
        )}

        {!isAdminUser && (
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-8 relative z-10">
            <div>
                <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-3 leading-tight">
                    {user ? `${user.email.split('@')[0]}님의 대시보드` : '대시보드'}
                </h1>
                <p className="text-slate-400 font-light text-base md:text-lg tracking-tight max-w-2xl">
                  캠페인 진행 단계와 결과를 한곳에서 확인할 수 있습니다.
                </p>
            </div>
            {user && (
                <button 
                    type="button"
                    onClick={() => setIsPasswordMode(true)}
                    className="flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-xs font-bold hover:bg-white/10 transition-all shadow-xl text-slate-200"
                >
                    <Settings size={18} className="text-slate-400" /> 비밀번호·계정 설정
                </button>
            )}
        </div>
        )}

        {user && paidOrders.length > 0 && (
          <div className="mb-10 p-6 bg-white/[0.03] border border-white/10 rounded-2xl relative z-10">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <CreditCard size={20} className="text-purple-400" /> 결제 내역
            </h2>
            <p className="text-slate-500 text-sm mb-4">KG이니시스 승인 건은 아래와 같습니다. 통합내역조회는 PG사 반영 후 일정이 소요될 수 있습니다.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-slate-500 font-medium">
                    <th className="py-3 pr-4">주문번호</th>
                    <th className="py-3 pr-4">상품명</th>
                    <th className="py-3 pr-4">결제금액</th>
                    <th className="py-3">결제일시</th>
                  </tr>
                </thead>
                <tbody>
                  {paidOrders.map((o) => (
                    <tr key={o.order_number} className="border-b border-white/5 hover:bg-white/[0.03]">
                      <td className="py-3 pr-4 font-mono text-slate-300">{o.order_number}</td>
                      <td className="py-3 pr-4 text-white">{o.plan_name}</td>
                      <td className="py-3 pr-4 text-purple-400 font-semibold">
                        {displayPaidOrderPlanPriceForViewer(o, user?.email).toLocaleString()}원
                      </td>
                      <td className="py-3 text-slate-400">{o.created_at ? new Date(o.created_at).toLocaleString('ko-KR') : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!isAdminUser ? (
        <div className="flex flex-col lg:flex-row gap-10 items-start">
            {/* Left Sidebar */}
            <div className="w-full lg:w-1/4 space-y-10 sticky top-40">
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-sm font-bold text-slate-300">캠페인 목록</h2>
                        <span className="text-xs font-semibold bg-white/5 text-slate-300 px-3 py-1 rounded-full border border-white/10">
                          {isAdminUser ? `보이는 ${filteredCampaigns.length}개 / 전체 ${campaigns.length}개` : `${campaigns.length}개`}
                        </span>
                    </div>
                    {isAdminUser && (
                        <div className="p-4 rounded-2xl border border-cyan-500/25 bg-cyan-500/[0.06] space-y-3">
                            <p className="text-xs font-bold text-cyan-100">목록만 좁히기</p>
                            <p className="text-[11px] text-slate-400 leading-relaxed">위 운영 센터 표를 눌러도 같은 필터가 걸립니다. 여기서 직접 고를 수도 있습니다.</p>
                            <input
                                value={adminSearch}
                                onChange={(e) => setAdminSearch(e.target.value)}
                                placeholder="주문번호, 브랜드, 이메일 중 아무거나 입력"
                                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500"
                            />
                            <div className="grid grid-cols-1 gap-2">
                                <select value={adminFilterCustomer} onChange={(e) => setAdminFilterCustomer(e.target.value)} className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white">
                                    <option value="all" className="bg-white text-slate-900">고객 이메일 — 전체</option>
                                    {adminCustomerOptions.map((v) => <option key={v} value={v} className="bg-white text-slate-900">{v}</option>)}
                                </select>
                                <select value={adminFilterBrand} onChange={(e) => setAdminFilterBrand(e.target.value)} className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white">
                                    <option value="all" className="bg-white text-slate-900">브랜드 — 전체</option>
                                    {adminBrandOptions.map((v) => <option key={v} value={v} className="bg-white text-slate-900">{v}</option>)}
                                </select>
                                <select value={adminFilterPlan} onChange={(e) => setAdminFilterPlan(e.target.value)} className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white">
                                    <option value="all" className="bg-white text-slate-900">상품 유형 — 전체</option>
                                    {adminPlanOptions.map((v) => <option key={v} value={v} className="bg-white text-slate-900">{v}</option>)}
                                </select>
                                <select value={adminFilterStatus} onChange={(e) => setAdminFilterStatus(e.target.value)} className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white">
                                    <option value="all" className="bg-white text-slate-900">진행 단계 — 전체</option>
                                    {adminStatusOptions.map((v) => <option key={v} value={v} className="bg-white text-slate-900">{v}</option>)}
                                </select>
                                <select value={adminFilterDelivery} onChange={(e) => setAdminFilterDelivery(e.target.value)} className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white">
                                    <option value="all" className="bg-white text-slate-900">인플루언서 명단 — 조건 없음</option>
                                    <option value="linked" className="bg-white text-slate-900">명단이 붙은 캠페인만</option>
                                    <option value="with_creators" className="bg-white text-slate-900">명단에 사람이 있는 캠페인만</option>
                                </select>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setAdminFilterCustomer('all');
                                    setAdminFilterBrand('all');
                                    setAdminFilterPlan('all');
                                    setAdminFilterStatus('all');
                                    setAdminFilterDelivery('all');
                                    setAdminSearch('');
                                }}
                                className="w-full px-3 py-2.5 rounded-xl text-xs font-bold bg-white/10 border border-white/15 text-slate-200 hover:bg-white/15 transition-all"
                            >
                                모두 풀고 처음부터
                            </button>
                        </div>
                    )}
                    <div className="space-y-4">
                        {filteredCampaigns.map(campaign => (
                            <CampaignCard 
                                key={campaign.id} 
                                campaign={campaign} 
                                isActive={selectedCampaignId === campaign.id}
                                onClick={() => setSelectedCampaignId(campaign.id)}
                            />
                        ))}
                    </div>
                    <div onClick={goToPricing} className="p-8 rounded-[2.5rem] border-2 border-dashed border-white/5 text-center hover:border-purple-500/50 hover:bg-purple-500/5 transition-all cursor-pointer group relative overflow-hidden">
                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-500 group-hover:text-purple-400 transition-all duration-500 border border-white/5 group-hover:rotate-180">
                            <Package size={24} />
                        </div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-white transition-colors">Start New Campaign</p>
                    </div>
                </div>
                
                {!isAdminUser && (
                <div className="space-y-4 pt-10 border-t border-white/5">
                    <h2 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] px-2">Performance Boost</h2>
                    
                    {[
                        { icon: TrendingUp, title: "KOL BOOSTING", desc: "고성과 인플루언서 추가 섭외" },
                        { icon: Zap, title: "SPARK ADS", desc: "공식 광고 관리자 자동 연동" }
                    ].map((item, idx) => (
                        <div 
                            key={idx}
                            onClick={handleSparkAdsClick}
                            className="bg-white/5 p-6 rounded-[2rem] border border-white/5 cursor-not-allowed group opacity-60"
                        >
                            <div className="flex items-center gap-4 mb-3">
                                <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center text-slate-700 shadow-xl border border-white/5"><item.icon size={18} /></div>
                                <span className="font-black text-slate-500 text-xs tracking-tighter uppercase">{item.title}</span>
                            </div>
                            <p className="text-[10px] text-slate-700 leading-relaxed mb-4 font-medium tracking-tight">{item.desc}</p>
                            <span className="text-[9px] font-black text-slate-800 flex items-center gap-2 uppercase tracking-[0.2em] italic">Locked / Coming Soon</span>
                        </div>
                    ))}
                </div>
                )}
            </div>

            {/* Main Content Area */}
            <div className="w-full lg:w-3/4">
                {filteredCampaigns.length === 0 && !isDemoMode ? (
                    // [신규] 구매 유도 빈 화면 (Empty State CTA)
                    <div className="bg-white/5 backdrop-blur-2xl p-8 md:p-12 rounded-[4rem] border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)] min-h-[700px] flex flex-col items-center justify-center relative overflow-hidden text-center animate-fade-in-up">
                        <div className="w-32 h-32 bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-full flex items-center justify-center mb-8 border border-white/10 shadow-[0_0_50px_rgba(168,85,247,0.1)]">
                            <Package size={48} className="text-purple-400 opacity-80" />
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black text-white tracking-tighter mb-4">진행 중인 캠페인이 없습니다</h2>
                        <p className="text-slate-400 mb-12 text-lg font-light tracking-tight max-w-md">
                            글로벌 인플루언서와 함께하는 첫 번째 브랜드 캠페인을 런칭하고 실시간 데이터 인사이트를 경험해보세요.
                        </p>
                        <button 
                            onClick={goToPricing} 
                            className="px-10 py-5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl font-black text-lg shadow-[0_0_30px_rgba(168,85,247,0.4)] hover:scale-105 transition-all uppercase tracking-widest flex items-center gap-3"
                        >
                            <Zap size={24} /> Start New Campaign
                        </button>
                    </div>
                ) : !selectedCampaign ? (
                    <div className="rounded-[4rem] border border-white/10 bg-slate-900/60 px-8 py-16 text-center text-slate-300 text-sm min-h-[400px] flex flex-col items-center justify-center">
                      <p className="font-bold text-white mb-2">표시할 캠페인을 찾지 못했습니다</p>
                      <p className="text-slate-400 max-w-md leading-relaxed">
                        목록이 갱신되는 중이거나 필터 때문에 선택이 풀렸을 수 있습니다. 왼쪽 목록에서 캠페인을 다시 눌러 주세요.
                      </p>
                    </div>
                ) : (
                    // 기존 Campaign Detail 컨테이너
                    <div className="bg-white/5 backdrop-blur-2xl p-8 md:p-12 rounded-[4rem] border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)] min-h-[900px] relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 pb-10 border-b border-white/5 gap-8 relative z-10">
                            <div>
                                <div className="flex items-center gap-4 mb-3">
                                    <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase leading-none">
                                      {selectedCampaign?.product_name || selectedCampaign?.order_summary?.plan_name || 'Campaign'}
                                    </h2>
                                    <span className="text-[10px] font-black px-4 py-1.5 bg-cyan-500/10 text-cyan-400 rounded-full border border-cyan-400/20 tracking-widest uppercase">{selectedCampaign?.plan}</span>
                                </div>
                                <p className="text-slate-500 text-lg font-light flex items-center gap-3 tracking-tight">
                                    <span className={`w-3 h-3 rounded-full ${selectedCampaign?.status === CampaignStatus.COMPLETED ? 'bg-slate-700 shadow-none' : 'bg-cyan-400 animate-pulse shadow-[0_0_10px_rgba(34,211,238,0.8)]'}`}></span>
                                    {getCampaignProgressSubtitle(selectedCampaign?.status)}
                                </p>
                            </div>
                            <StatusBadge status={selectedCampaign?.status} />
                        </div>
                        <div className="relative z-10">
                            <CampaignDetail
                                campaign={selectedCampaign}
                                isDemoMode={isDemoMode}
                                user={user}
                                isAdminUser={isAdminUser}
                                onCampaignScheduleUpdated={handleCampaignScheduleUpdated}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
        ) : null}
      </div>

      {isPasswordMode && user && (
        <div
          className="fixed inset-0 z-[260] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="dashboard-password-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) closePasswordModal();
          }}
        >
          <div className="relative w-full max-w-md rounded-2xl border border-purple-500/35 bg-slate-950 shadow-2xl shadow-black/60">
            <button
              type="button"
              onClick={closePasswordModal}
              className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-white/10 hover:text-white"
              aria-label="닫기"
            >
              <X size={20} />
            </button>
            <div className="p-6 sm:p-8 pt-12 sm:pt-10">
              <h3
                id="dashboard-password-modal-title"
                className="text-sm font-black tracking-wide uppercase mb-2 flex items-center gap-2 text-purple-300"
              >
                <Lock size={18} /> 비밀번호 변경
              </h3>
              <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                새 비밀번호를 8자 이상 입력하고, 아래에서 한 번 더 확인한 뒤 저장하세요.
              </p>
              <div className="space-y-4">
                <input
                  type="password"
                  autoComplete="new-password"
                  placeholder="새 비밀번호 (8자 이상)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/40"
                />
                <input
                  type="password"
                  autoComplete="new-password"
                  placeholder="새 비밀번호 확인"
                  value={newPasswordConfirm}
                  onChange={(e) => setNewPasswordConfirm(e.target.value)}
                  className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/40"
                />
                {newPassword && newPasswordConfirm && newPassword !== newPasswordConfirm && (
                  <p className="text-red-400 text-sm font-medium">비밀번호가 일치하지 않습니다.</p>
                )}
                <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closePasswordModal}
                    className="flex-1 px-4 py-3 rounded-xl border border-white/15 text-sm font-bold text-slate-300 hover:bg-white/5"
                  >
                    닫기
                  </button>
                  <button
                    type="button"
                    onClick={handlePasswordUpdate}
                    disabled={newPassword.length < 8 || newPassword !== newPasswordConfirm}
                    className="flex-1 px-4 py-3 rounded-xl bg-purple-600 text-white text-sm font-black hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    비밀번호 저장
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}