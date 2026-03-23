import React, { useEffect, useState, useRef, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { 
  Package, Clock, Truck, UserCheck, AlertCircle, 
  Lock, Settings, BarChart3, Users, PlayCircle, Eye, Heart, MessageCircle, Share2, 
  ChevronLeft, ChevronRight, Calendar, ExternalLink, Zap, Trash2, CheckCircle2, MoreHorizontal,
  Plane, Gift, TrendingUp, BarChart2, Trophy, RefreshCw, AlertTriangle, Download,
  FileText, CreditCard, Printer, Video, ShieldCheck, X, Rocket, ArrowRight, Building2, Info, UserX, RotateCcw
} from 'lucide-react';
import Navbar from '../components/layout/Navbar'; 
import Footer from '../components/layout/Footer';
import sealImg from '../assets/seal.jpg';
import testInfluencers from '../data/test-influencers.json';

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
  };
};

/** 드랍 식별자: DB에 name|platform 형태가 섞여 있어도 동일 인원으로 취급 */
const normalizeDropIdentifier = (id) => {
  if (id == null || id === '') return '';
  const s = String(id).trim();
  if (!s.includes('|')) return s;
  return s.split('|')[0].trim();
};

/** admin 납품 테스트 외, 특정 고객 캠페인에 동일 엑셀 풀(BS-US-FARMSKIN)을 연결할 때 사용 */
const LINKED_DELIVERY_LIST_SLUG = 'BS-US-FARMSKIN';

/**
 * 고객 대시보드에 납품 리스트·드랍 UI를 노출할 캠페인 판별.
 * 우선순위: VITE_LINKED_DELIVERY_CAMPAIGN_ID → 이메일 + 제품명 키워드
 */
const campaignMatchesLinkedDeliveryList = (campaign, user) => {
  if (!campaign?.id || campaign.id === 'admin-delivery-test') return false;
  const envId = (import.meta.env.VITE_LINKED_DELIVERY_CAMPAIGN_ID || '').trim();
  if (envId && String(campaign.id) === envId) return true;
  const email = (user?.email || '').toLowerCase().trim();
  if (email !== 'heather@fromom.net') return false;
  const hay = `${campaign.product_name || ''} ${campaign.brand_name || ''}`.toLowerCase();
  return hay.includes('troubless') && hay.includes('pdrn') && hay.includes('sunscreen');
};

/** creator_drops / delivery_list_sessions 에 저장할 참조 키 */
const resolveDeliveryReference = (campaign) => {
  if (campaign?.id === 'admin-delivery-test') {
    return { refType: 'admin_preview', refId: 'BS-US-FARMSKIN' };
  }
  return { refType: 'campaign', refId: String(campaign.id) };
};

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
    _identifier: `${(m.name || r.name || '').trim()}`,
  };
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
  COMPLETED: 'COMPLETED'
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
    [CampaignStatus.COMPLETED]: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  };
  
  const labels = {
    [CampaignStatus.PAYMENT_PENDING]: "계약/입금 대기",
    [CampaignStatus.KICKOFF]: "착수",
    [CampaignStatus.CONTACTING]: "인플루언서 섭외 중",
    [CampaignStatus.SHIPPING]: "제품 발송 중",
    [CampaignStatus.UPLOADING]: "콘텐츠 업로드 중",
    [CampaignStatus.COMPLETED]: "캠페인 완료",
  };

  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border backdrop-blur-md ${styles[status] || styles[CampaignStatus.PAYMENT_PENDING]}`}>
      {labels[status] || status}
    </span>
  );
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
const InvoiceDetail = ({ campaign }) => {
    const invoiceRef = useRef(null);
    const [orderCampaigns, setOrderCampaigns] = useState([campaign]);
    const [isConfirmed, setIsConfirmed] = useState(!!(campaign.client_address && campaign.client_biz_reg_no));
    const [clientForm, setClientForm] = useState({
        companyName: campaign.brand_name || '',
        address: campaign.client_address || '',
        bizRegNo: campaign.client_biz_reg_no || '',
    });
    const setClient = (field) => (e) => setClientForm(prev => ({ ...prev, [field]: e.target.value }));

    // 동일 order_number의 모든 캠페인 조회 (다중 구매 시 라인아이템 집계)
    useEffect(() => {
        if (!campaign.order_number || String(campaign.id).startsWith('demo-')) return;
        const fetchOrderCampaigns = async () => {
            const { data } = await supabase.from('campaigns').select('*').eq('order_number', campaign.order_number);
            if (data?.length) setOrderCampaigns(data);
        };
        fetchOrderCampaigns();
    }, [campaign.order_number, campaign.id]);

    // 라인아이템: ① orders.order_items (결제 원본) 우선 ② 없으면 동일 주문의 campaigns 집계
    const lineItems = useMemo(() => {
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
    }, [campaign.order_summary, orderCampaigns]);

    const isDemo = String(campaign.id).startsWith('demo-');

    const lineSupplySum = lineItems.reduce((s, li) => s + li.supplyAmount, 0);
    const orderTotalInclVat = Number(campaign.order_summary?.plan_price);
    const useOrderContractTotal = Number.isFinite(orderTotalInclVat) && orderTotalInclVat > 0;

    const totalSupplyPrice = useOrderContractTotal ? Math.round(orderTotalInclVat / 1.1) : lineSupplySum;
    const vatAmount = useOrderContractTotal ? orderTotalInclVat - totalSupplyPrice : Math.round(lineSupplySum * 0.1);
    const totalAmount = useOrderContractTotal ? orderTotalInclVat : lineSupplySum + vatAmount;
    const supplyPrice = totalSupplyPrice;

    const invoiceId = isDemo ? campaign.id.toUpperCase() : (campaign.order_number || campaign.id.slice(0, 8)).toUpperCase();
    const invoiceDate = campaign.created_at ? new Date(campaign.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    const clientValid = clientForm.companyName && clientForm.address && clientForm.bizRegNo;

    const handleConfirm = async () => {
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

            {/* 2. Client Info Form / Confirmation Notice */}
            {!isConfirmed ? (
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
            ) : (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-6 flex items-center gap-4">
                    <CheckCircle2 className="text-emerald-500 shrink-0" size={24} />
                    <div>
                        <h4 className="font-bold text-emerald-400 text-lg">계약이 확정되었습니다.</h4>
                        <p className="text-emerald-200/70 text-sm font-light">입금 확인 후 캠페인 세팅이 시작됩니다. PDF 다운로드가 가능합니다.</p>
                    </div>
                </div>
            )}

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
            {!isConfirmed ? (
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
                            <Rocket size={28} className="animate-bounce" />
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
const DROP_WINDOW_DAYS = 3;

const serializeDroppedSet = (set) => JSON.stringify([...set].sort((a, b) => a.localeCompare(b)));

/** PostgREST: 테이블 미생성·스키마 캐시에 없을 때 */
const isMissingDeliverySessionsTableError = (err) => {
    const m = String(err?.message || '').toLowerCase();
    return (
        m.includes('delivery_list_sessions') &&
        (m.includes('schema cache') || m.includes('could not find') || m.includes('does not exist') || m.includes('relation') && m.includes('does not exist'))
    );
};

const CandidateList = ({ candidates, targetCount, matchedCount, isDeliveryTest, campaign, user, existingDrops = [], allowAdminUnconfirm = false }) => {
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

    // delivery_list_sessions: 3일 기한, 드랍 확정 추적
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
    const daysRemaining = sentAt ? Math.max(0, DROP_WINDOW_DAYS - (now - sentAt) / msPerDay) : DROP_WINDOW_DAYS;
    const dropWindowExpired = sentAt ? daysRemaining <= 0 : false;
    const dropConfirmed = !!dropConfirmedAt;
    const canDrop = !dropConfirmed && !sessionLoading && (!sentAt || !dropWindowExpired);

    const handleDownloadCSV = () => {
        if (isDeliveryTest) {
            const filtered = (candidates || []).filter((c) => !droppedIds.has(normalizeDropIdentifier(c._identifier || c.name)));
            const headers = ['name', 'shipping_country', 'instagram_url', 'instagram_followers', 'tiktok_url', 'tiktok_followers'];
            const csv = [
                headers.join(','),
                ...filtered.map((c) => {
                    const channels = c.sns_channels || [];
                    const ig = channels.find((ch) => ch.platform === 'Instagram') || {};
                    const tt = channels.find((ch) => ch.platform === 'TikTok') || {};
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
            const baseName =
                campaign?.id === 'admin-delivery-test'
                    ? 'BS-US-FARMSKIN'
                    : String(campaign?.product_name || campaign?.order_number || '납품')
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

    // 정렬: 이름 ABC순 | 팔로워 수
    const [sortBy, setSortBy] = useState('name'); // 'name' | 'followers'
    const [sortOrder, setSortOrder] = useState('asc'); // 'asc' | 'desc'
    const sortedCandidates = useMemo(() => {
        const arr = [...allCandidates];
        arr.sort((a, b) => {
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

    const renderDeliveryDataCells = (creator) => (
        <>
            <td className="px-8 py-6">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-black text-sm shadow-lg">
                        {creator.name?.charAt(0) || '-'}
                    </div>
                    <p className="font-bold text-white text-base tracking-tight">{creator.name}</p>
                </div>
            </td>
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
                                    : `인플루언서 리스트 · 드랍 ${droppedCount}/${maxDropCount}명 (전체 ${listTotal}명의 30%)${sentAt ? ` · ${Math.ceil(daysRemaining)}일 남음` : ''}`)
                                : '목표 인원 달성 시 자동으로 제품 배송 단계로 전환됩니다.'}
                        </p>
                        {isDeliveryTestView && !dropConfirmed && canDrop && dropLimitReached && (
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
                            <p className="font-bold text-amber-200/90">드랍이란?</p>
                            <p className="text-slate-400 leading-relaxed">
                                제공된 인플루언서 중 마음에 들지 않는 분이 있으시면 <strong className="text-slate-300">다른 인원으로 교체해 주세요</strong>라고 요청하는 기능입니다.
                                리스트 확정 후 대체 인원을 선정해 최종 납품 리스트(배송정보 포함)를 제공합니다.
                            </p>
                            <ul className="text-slate-500 text-xs space-y-1 mt-3">
                                <li>· 인플루언서 리스트 제공 후 <strong className="text-amber-400/90">3일 이내</strong>에만 드랍 가능</li>
                                <li>· 드랍 가능 인원: 전체의 <strong className="text-amber-400/90">30%</strong> (50명 제공 시 15명까지)</li>
                                <li>· 상한에 도달하면 추가 체크는 불가합니다. 드랍을 줄인 뒤 <strong className="text-amber-400/90">「드랍 현황 저장」</strong>으로 서버에 반영할 수 있습니다.</li>
                                <li>· 이미 드랍한 인원은 체크 해제 후 저장하면 <strong className="text-amber-400/90">드랍 취소</strong>되어 다시 리스트에 포함됩니다.</li>
                                <li>· 3일 이내에 리스트 확정을 하지 않으면 <strong className="text-amber-400/90">자동으로 확정</strong>됩니다</li>
                            </ul>
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
                                        <th className="px-8 py-5">국가</th>
                                        <th className="px-8 py-5">SNS 주소</th>
                                        <th className="px-8 py-5">팔로워 수</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {confirmedList.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-8 py-16 text-center text-slate-500 text-sm font-medium">
                                                확정 리스트에 포함된 인원이 없습니다.
                                            </td>
                                        </tr>
                                    ) : (
                                        confirmedList.map((creator) => {
                                            const identifier = normalizeDropIdentifier(creator._identifier || creator.name);
                                            return (
                                                <tr key={`conf-${creator.id}-${identifier}`} className="hover:bg-white/5 transition-colors group">
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
                                        <th className="px-8 py-5">국가</th>
                                        <th className="px-8 py-5">SNS 주소</th>
                                        <th className="px-8 py-5">팔로워 수</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {droppedList.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-8 py-12 text-center text-slate-500 text-sm font-medium">
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
                                        const [s, o] = e.target.value.split('-');
                                        setSortBy(s);
                                        setSortOrder(o);
                                        setCurrentPage(1);
                                    }}
                                    className="text-xs font-bold bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-slate-300 focus:ring-cyan-500/50 focus:border-cyan-500/50"
                                >
                                    <option value="name-asc">이름 A→Z</option>
                                    <option value="name-desc">이름 Z→A</option>
                                    <option value="followers-asc">팔로워 ↑</option>
                                    <option value="followers-desc">팔로워 ↓</option>
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
                                <th className="px-8 py-5">국가</th>
                                <th className="px-8 py-5">SNS 주소</th>
                                <th className="px-8 py-5">팔로워 수</th>
                                {isDeliveryTestView && <th className="px-8 py-5 min-w-[4rem] text-right whitespace-nowrap">드랍</th>}
                                {!isDeliveryTestView && (
                                    <>
                                        <th className="px-8 py-5">상세정보(Masked)</th>
                                        <th className="px-8 py-5">프로세스</th>
                                        <th className="px-8 py-5 text-right">매니지먼트</th>
                                    </>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {displayCandidates.length === 0 && isDeliveryTestView ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-16 text-center text-slate-500 text-sm font-medium">
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
                                        className={`hover:bg-white/5 transition-all group ${isDropped ? 'opacity-50 bg-red-500/5' : ''}`}
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
                                                                    : '드랍 기한이 지났습니다.')
                                                                : (!isDropped && !canDropMore
                                                                    ? `드랍은 최대 ${maxDropCount}명(전체 ${listTotal}명의 30%)까지 가능합니다. 다른 인원의 드랍을 해제한 뒤 저장하면 다시 선택할 수 있습니다.`
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
                            <p>
                                드랍을 바꾼 뒤에는 반드시 <strong className="text-amber-400/90">「드랍 현황 저장」</strong>을 눌러 서버에 반영해 주세요. 체크 해제 후 저장하면 드랍이 취소됩니다.
                            </p>
                            {droppedCount > 0 && (
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
    return (
        <div className="space-y-10 animate-fade-in-up">
            <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[3rem] border border-white/10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/5 blur-[100px] rounded-full"></div>
                <div className="flex justify-between items-center mb-10 relative z-10">
                    <h3 className="font-black text-white text-2xl flex items-center gap-3 tracking-tighter uppercase">
                        <BarChart2 size={28} className="text-purple-400" /> 캠페인 퍼포먼스 리포트
                    </h3>
                    <button className="text-[10px] font-black tracking-widest uppercase px-5 py-2.5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 text-slate-300 transition-all flex items-center gap-2">
                        <ExternalLink size={16}/> Download PDF
                    </button>
                </div>

                <div className="bg-black/20 rounded-[2rem] border border-white/5 p-10 mb-10 relative z-10">
                    <div className="flex h-72 relative items-end pb-12 pl-12 gap-6">
                        <div className="absolute top-0 left-0 h-full flex flex-col justify-between text-[10px] text-slate-600 font-black uppercase tracking-[0.2em] pb-12">
                            <span>300K</span>
                            <span>200K</span>
                            <span>100K</span>
                            <span>0</span>
                        </div>
                        
                        {campaign.analytics?.daily_views.map((views, idx) => (
                            <div key={idx} className="flex-1 flex flex-col justify-end group relative h-full">
                                <div 
                                    className="w-full bg-gradient-to-t from-purple-600/40 to-cyan-400/80 hover:to-white transition-all duration-500 rounded-t-xl relative shadow-[0_0_20px_rgba(168,85,247,0.2)]"
                                    style={{ height: `${(views / 300) * 100}%` }}
                                >
                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-[#020617] text-[10px] font-black px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap z-20 shadow-2xl">
                                        {views}K VIEWS
                                    </div>
                                </div>
                                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] font-black text-slate-500 tracking-tighter whitespace-nowrap uppercase">
                                    {campaign.analytics?.dates[idx]}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                    <div className="p-8 bg-purple-500/5 rounded-3xl border border-purple-500/10 group hover:border-purple-500/30 transition-all">
                        <p className="text-[10px] text-purple-400 font-black uppercase tracking-[0.3em] mb-3">총 도달 (TOTAL REACH)</p>
                        <p className="text-4xl font-black text-white tracking-tighter">{campaign.kpi_views}</p>
                        <p className="text-[10px] text-emerald-400 font-bold mt-3 tracking-tight">▲ 예상 대비 145% 초과 달성</p>
                    </div>
                    <div className="p-8 bg-emerald-500/5 rounded-3xl border border-emerald-500/10 group hover:border-emerald-500/30 transition-all">
                        <p className="text-[10px] text-emerald-400 font-black uppercase tracking-[0.3em] mb-3">참여율 (ENGAGEMENT)</p>
                        <p className="text-4xl font-black text-white tracking-tighter">{campaign.analytics?.engagement_rate}</p>
                        <p className="text-[10px] text-slate-500 font-medium mt-3 tracking-tight">글로벌 뷰티 평균(3.5%) 대비 우수</p>
                    </div>
                    <div className="col-span-1 md:col-span-3 mt-10 border-t border-white/5 pt-10">
                        <h4 className="text-lg font-black text-white mb-8 flex items-center gap-3 tracking-tighter">
                            <Trophy size={22} className="text-yellow-400 animate-bounce"/> Best Performing Content
                        </h4>
                        <div className="grid grid-cols-3 gap-8">
                            {campaign.analytics?.top_contents.map((content) => (
                                <div key={content.id} className="relative aspect-[9/16] rounded-[2rem] overflow-hidden group cursor-pointer border border-white/10 shadow-2xl transition-transform hover:scale-[1.03]">
                                    <img src={content.thumbnail} alt="Top Content" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                    <div className="absolute top-4 left-4 bg-yellow-400 text-slate-900 text-[10px] font-black px-4 py-1.5 rounded-full shadow-2xl tracking-[0.2em]">
                                        TOP {content.id}
                                    </div>
                                    <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black via-black/40 to-transparent p-6">
                                        <p className="text-white text-lg font-black mb-1 tracking-tight">{content.creator}</p>
                                        <p className="text-cyan-400 text-xs font-bold flex items-center gap-2 uppercase tracking-widest italic"><Eye size={14}/> {content.views}</p>
                                    </div>
                                </div>
                            ))}
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
                            {campaign.creators.map((creator, idx) => (
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
                    {campaign.contents.map((content, idx) => (
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
const GuidelineSettingBlock = ({ status = 'pending' }) => {
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
      <h5 className="text-[10px] font-black text-amber-400/90 uppercase tracking-widest mb-4 flex items-center gap-2">
        <Settings size={16} /> 관리자 · 착수 일정 수동 저장{isVisit ? ' (Visit Content)' : ''}
      </h5>
      <p className="text-xs text-slate-500 mb-4 font-light">
        {isVisit
          ? 'Visit 플랜은 명단 납품 이후 일정이 방문·행사 기준 템플릿입니다. 비운 칸은 템플릿을 따릅니다.'
          : '비워 두면 해당 항목은 템플릿 자동 일정을 따릅니다.'}{' '}
        저장은 관리자 계정(API·ADMIN_EMAILS)만 가능합니다.
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

function AdminCampaignScheduleByIdPanel() {
  const [open, setOpen] = useState(false);
  const [idInput, setIdInput] = useState('');
  const [loaded, setLoaded] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const load = async () => {
    const id = idInput.trim();
    if (!CAMPAIGN_ROW_UUID_RE.test(id)) {
      setErr('유효한 캠페인 UUID를 입력하세요.');
      return;
    }
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) {
      setErr('로그인 세션이 없습니다.');
      return;
    }
    setLoading(true);
    setErr('');
    try {
      const res = await fetch(
        `${window.location.origin}/api/admin/campaign-schedule?campaign_id=${encodeURIComponent(id)}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `조회 실패 (${res.status})`);
      setLoaded(data.campaign);
    } catch (e) {
      setLoaded(null);
      setErr(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-slate-600/30">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between text-left"
      >
        <span className="font-bold text-slate-300 flex items-center gap-2">
          <Calendar size={18} className="text-amber-400" /> 캠페인 ID로 착수 일정 수정
        </span>
        <ChevronRight size={18} className={`text-slate-500 transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>
      {open && (
        <div className="mt-4 space-y-4">
          <p className="text-slate-500 text-sm">
            고객으로 가장한 화면이 아닌, 관리자 본인 계정으로 Supabase의 캠페인 UUID를 넣어 일정을 저장할 수 있습니다.
          </p>
          <div className="flex flex-wrap gap-3">
            <input
              type="text"
              placeholder="캠페인 UUID (예: a1b2c3d4-...)"
              value={idInput}
              onChange={(e) => setIdInput(e.target.value)}
              className="flex-1 min-w-[220px] px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 text-sm font-mono"
            />
            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="px-5 py-2.5 bg-amber-600/80 hover:bg-amber-500 disabled:opacity-50 rounded-xl font-bold text-sm text-white transition-all"
            >
              {loading ? '불러오는 중…' : '불러오기'}
            </button>
          </div>
          {err && <p className="text-red-400 text-sm">{err}</p>}
          {loaded && (
            <div className="space-y-3">
              <p className="text-slate-400 text-sm">
                <span className="text-white font-medium">{loaded.brand_name || '—'}</span>
                {loaded.product_name ? ` · ${loaded.product_name}` : ''}
                {loaded.order_number ? <span className="font-mono text-slate-500"> · {loaded.order_number}</span> : null}
              </p>
              <AdminCampaignScheduleEditor
                campaign={loaded}
                onSaved={(_, schedule) => setLoaded((prev) => (prev ? { ...prev, ...schedule } : prev))}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const KickoffView = ({ campaign, user, isAdminUser = false, onCampaignScheduleUpdated }) => {
  const navigate = useNavigate();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deliveryListOpen, setDeliveryListOpen] = useState(false);

  useEffect(() => {
    if (!campaign?.id) return;
    (async () => {
      const { data } = await supabase
        .from('campaign_setup_submissions')
        .select('form_data, created_at')
        .eq('campaign_id', campaign.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      setSubmission(data);
      setLoading(false);
    })();
  }, [campaign?.id]);

  const fd = submission?.form_data || {};
  const isVisitPlan = campaign?.plan?.toLowerCase().includes('visit');

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
              <Building2 size={20} className="text-cyan-400"/> 제출하신 캠페인 정보 요약
            </h3>
            <p className="text-slate-500 text-sm mt-1 font-light">입력하신 내용이 정상적으로 전달되었습니다.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate(`/campaign-setup/${campaign.id}`)}
            className="shrink-0 px-5 py-2.5 rounded-xl font-bold text-sm bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all flex items-center gap-2"
          >
            <Settings size={18} />
            내 캠페인 정보 수정하기
          </button>
        </div>
        {loading ? (
          <div className="p-12 flex justify-center">
            <div className="w-10 h-10 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
          </div>
        ) : submission ? (
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <KickoffSummaryRow label="회사명" value={fd.companyName} />
              <KickoffSummaryRow label="담당자명 / 직함" value={[fd.contactName, fd.contactTitle].filter(Boolean).join(' · ')} />
              <KickoffSummaryRow label="연락처" value={fd.contactPhone} />
              <KickoffSummaryRow label="담당자 이메일" value={fd.contactEmail} />
            </div>
            <div className="space-y-4">
              <KickoffSummaryRow label="캠페인 제품명" value={fd.productName} />
              {isVisitPlan ? (
                <>
                  <KickoffSummaryRow label="타겟 오디언스 국가" value={fd.targetAudienceCountry} />
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">행사일정</p>
                    <EventScheduleCalendar dates={eventScheduleDates} />
                  </div>
                  <KickoffSummaryRow label="행사 장소" value={fd.eventVenue} />
                  {fd.eventName && <KickoffSummaryRow label="행사명" value={fd.eventName} />}
                  {fd.eventGift && <KickoffSummaryRow label="브랜드사 증정 선물" value={fd.eventGift} />}
                </>
              ) : (
                <>
                  <KickoffSummaryRow label="거주 국가 범위" value={COUNTRY_LABELS[fd.countryRange] || fd.countryRange} />
                  <KickoffSummaryRow label="배송 예상 기간" value={fd.deliveryTime === 'other' ? (fd.deliveryOther || '기타') : (DELIVERY_LABELS[fd.deliveryTime] || fd.deliveryTime)} />
                </>
              )}
              <KickoffSummaryRow label="제품 사진" value={Array.isArray(fd.productPhotoUrls) && fd.productPhotoUrls.length > 0 ? `${fd.productPhotoUrls.length}개 업로드됨` : '미첨부'} />
            </div>
          </div>
        ) : (
          <div className="p-8 text-slate-500 text-sm">제출 정보를 불러오는 중이거나 아직 없습니다.</div>
        )}
        {fd.uspAndLinks && (
          <div className="px-8 pb-8">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">제품 USP · 링크 · 참고 숏폼</p>
            <p className="text-slate-300 text-sm font-light whitespace-pre-wrap bg-white/5 rounded-xl p-4 border border-white/5">{fd.uspAndLinks}</p>
          </div>
        )}
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
          <GuidelineSettingBlock status={guidelineStatus} />
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
                명단 확인·드랍(최대 30%)·리스트 확정은 아래에서 진행할 수 있습니다.
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
  if (!campaign) return <div className="flex flex-col items-center justify-center py-40 text-slate-700 font-black uppercase tracking-[0.3em]"><Package size={48} className="mb-4 opacity-20"/> Select Campaign</div>;

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
      const isDeliveryTest = campaign.id === 'admin-delivery-test' || isLinkedDelivery;
      const candidates = isDeliveryTest
        ? (campaign.id === 'admin-delivery-test'
            ? (campaign.candidates || [])
            : (campaign.linked_delivery_candidates || [])
          ).map((c) => ({
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
            allowAdminUnconfirm={isAdminUser && campaign.id === 'admin-delivery-test'}
          />
      );
  }

  if (campaign.status === CampaignStatus.COMPLETED) {
      return <AnalyticsReport campaign={campaign} />;
  }

  return <OngoingCampaign campaign={campaign} />;
};

// --- Main Dashboard ---

export default function Dashboard() {
  const navigate = useNavigate();
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
  const [selectedCampaignId, setSelectedCampaignId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [isPasswordMode, setIsPasswordMode] = useState(false);
  const [impersonateEmail, setImpersonateEmail] = useState('');
  const [impersonateLoading, setImpersonateLoading] = useState(false);
  const [impersonateExpanded, setImpersonateExpanded] = useState(false);

  const adminEmails = useMemo(() => (import.meta.env.VITE_ADMIN_EMAILS || '').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean), []);

  const handleCampaignScheduleUpdated = (campaignId, schedule) => {
    if (!campaignId || !schedule) return;
    setCampaigns((prev) => prev.map((c) => (c.id === campaignId ? { ...c, ...schedule } : c)));
  };

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data } = await supabase
          .from('campaigns')
          .select(`*, creators (*), contents (*)`)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        let campaignList = data || [];
        const isAdminUser = adminEmails.length > 0 && user?.email && adminEmails.includes(user.email.toLowerCase());
        if (isAdminUser) {
          let deliveryCandidates = testInfluencers;
          const { data: adminCreators } = await supabase
            .from('admin_delivery_creators')
            .select('*')
            .eq('list_slug', 'BS-US-FARMSKIN')
            .order('created_at', { ascending: true });
          if (adminCreators?.length) {
            deliveryCandidates = adminCreators.map((r, i) => toDisplayCreator(r, i));
          } else {
            deliveryCandidates = deliveryCandidates.map((c, i) => testInfluencerToDisplayCreator(c, i));
          }
          const deliveryTestCampaign = {
            id: 'admin-delivery-test',
            order_number: 'BS-DELIVERY-TEST',
            plan: 'Scale50',
            status: CampaignStatus.CONTACTING,
            brand_name: '납품 테스트 (관리자 전용)',
            product_name: 'BS-US-FARMSKIN',
            target_creators: deliveryCandidates.length,
            matched_creators: deliveryCandidates.length,
            candidates: deliveryCandidates,
            plan_price: 2390000,
            content_count: deliveryCandidates.length,
            customer_name: '-',
            customer_email: user.email,
          };
          campaignList = [deliveryTestCampaign, ...campaignList];
        }

        const linkedIds = new Set(
          campaignList.filter((c) => campaignMatchesLinkedDeliveryList(c, user)).map((c) => c.id),
        );
        if (linkedIds.size > 0) {
          const { data: linkedCreators } = await supabase
            .from('admin_delivery_creators')
            .select('*')
            .eq('list_slug', LINKED_DELIVERY_LIST_SLUG)
            .order('created_at', { ascending: true });
          let deliveryCandidates = testInfluencers;
          if (linkedCreators?.length) {
            deliveryCandidates = linkedCreators.map((r, i) => toDisplayCreator(r, i));
          } else {
            deliveryCandidates = testInfluencers.map((c, i) => testInfluencerToDisplayCreator(c, i));
          }
          campaignList = campaignList.map((c) =>
            linkedIds.has(c.id) ? { ...c, linked_delivery_candidates: deliveryCandidates } : c,
          );
        }

        const orderNumbers = [...new Set(campaignList.map((c) => c.order_number).filter(Boolean))];
        if (orderNumbers.length > 0) {
          const { data: orderRows } = await supabase
            .from('orders')
            .select('order_number, plan_name, plan_price, order_items, content_count')
            .in('order_number', orderNumbers);
          const orderByNum = Object.fromEntries((orderRows || []).map((o) => [o.order_number, o]));
          campaignList = campaignList.map((c) =>
            c.order_number && orderByNum[c.order_number]
              ? { ...c, order_summary: orderByNum[c.order_number] }
              : c,
          );
        }

        if (campaignList.length > 0) {
          setCampaigns(campaignList);
          setSelectedCampaignId(campaignList[0].id);
          setIsDemoMode(false);
        } else {
          setCampaigns([]);
          setSelectedCampaignId(null);
          setIsDemoMode(false); 
        }

        const { data: ordersData } = await supabase
          .from('orders')
          .select('order_number, plan_name, plan_price, status, created_at')
          .eq('email', user.email)
          .eq('status', 'paid')
          .order('created_at', { ascending: false })
          .limit(20);
        setPaidOrders(ordersData || []);
      } else {
        // [수정됨] 비로그인 유저: 데모 모드 노출
        setCampaigns(DEMO_CAMPAIGNS);
        setSelectedCampaignId(DEMO_CAMPAIGNS[0].id);
        setIsDemoMode(true);
      }
      setLoading(false);
    };

    fetchData();
  }, [navigate, adminEmails]);
  const handlePasswordUpdate = async () => {
    if (newPassword.length < 8) return alert("비밀번호는 8자 이상이어야 합니다.");
    if (newPassword !== newPasswordConfirm) return alert("비밀번호가 일치하지 않습니다.");
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) alert("실패: " + error.message);
    else {
      await supabase.auth.updateUser({ data: { ...(user?.user_metadata || {}), password_set: true } });
      alert("비밀번호가 성공적으로 변경되었습니다."); setIsPasswordMode(false); setNewPassword(''); setNewPasswordConfirm('');
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
      alert(`링크 생성 중 오류: ${msg.includes('fetch') || msg.includes('Failed') ? '네트워크 오류 또는 API 미배포' : msg}`);
    } finally {
      setImpersonateLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#020617]"><div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div></div>;

  const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId);

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

        {user && adminEmails.includes(user.email?.toLowerCase()) && selectedCampaignId === 'admin-delivery-test' && (
            <div className="mb-10 p-5 bg-amber-500/10 border border-amber-500/30 rounded-3xl flex items-center gap-4 text-amber-200 text-sm animate-fade-in-down">
                <AlertCircle size={20} className="text-amber-400 shrink-0" />
                <span className="font-light tracking-tight"><b className="font-black text-amber-400 uppercase tracking-widest">납품 테스트</b> — BS-US-FARMSKIN 엑셀에서 추출한 50명 인플루언서 데이터입니다. 고객 노출 전 관리자 전용 미리보기입니다.</span>
            </div>
        )}

        {user && adminEmails.includes(user.email?.toLowerCase()) && (
            <div className="mb-10 p-5 bg-slate-800/50 border border-slate-600/30 rounded-3xl animate-fade-in-down">
                <button
                    onClick={() => setImpersonateExpanded(!impersonateExpanded)}
                    className="w-full flex items-center justify-between text-left"
                >
                    <span className="font-bold text-slate-300 flex items-center gap-2">
                        <UserCheck size={18} className="text-cyan-400" /> 고객 화면으로 로그인 (관리자 전용)
                    </span>
                    <ChevronRight size={18} className={`text-slate-500 transition-transform ${impersonateExpanded ? 'rotate-90' : ''}`} />
                </button>
                {impersonateExpanded && (
                    <div className="mt-4 pt-4 border-t border-slate-600/30 space-y-3">
                        <p className="text-slate-500 text-sm">고객 이메일만 입력하면 비밀번호 없이 해당 고객 화면으로 진입할 수 있습니다. (Supabase에 등록된 이메일)</p>
                        <div className="flex flex-wrap gap-3">
                            <input
                                type="email"
                                placeholder="customer@example.com"
                                value={impersonateEmail}
                                onChange={(e) => setImpersonateEmail(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleImpersonateLogin()}
                                className="flex-1 min-w-[200px] px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 text-sm"
                            />
                            <button
                                onClick={handleImpersonateLogin}
                                disabled={impersonateLoading}
                                className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 rounded-xl font-bold text-sm text-white transition-all flex items-center gap-2"
                            >
                                {impersonateLoading ? <RefreshCw size={16} className="animate-spin" /> : null}
                                새 탭에서 고객으로 열기
                            </button>
                        </div>
                    </div>
                )}
                <AdminCampaignScheduleByIdPanel />
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

        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-8 relative z-10">
            <div>
                <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-3 leading-none uppercase">
                    {user ? `${user.email.split('@')[0]}'s Dashboard` : `Management Dashboard`}
                </h1>
                <p className="text-slate-500 font-light text-lg tracking-tight">전체 캠페인 진행 상태 및 성과 지표를 실시간으로 모니터링합니다.</p>
            </div>
            {user && (
                <button 
                    onClick={() => setIsPasswordMode(!isPasswordMode)}
                    className="flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-xs font-black tracking-widest uppercase hover:bg-white/10 transition-all shadow-xl text-slate-300"
                >
                    <Settings size={18} className="text-slate-500 group-hover:rotate-45 transition-transform" /> Account Settings
                </button>
            )}
        </div>

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
                      <td className="py-3 pr-4 text-purple-400 font-semibold">{Number(o.plan_price).toLocaleString()}원</td>
                      <td className="py-3 text-slate-400">{o.created_at ? new Date(o.created_at).toLocaleString('ko-KR') : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {isPasswordMode && user && (
            <div className="mb-12 bg-white/5 backdrop-blur-3xl p-8 rounded-[2.5rem] shadow-2xl border border-purple-500/30 animate-fade-in-up max-w-xl">
                <h3 className="text-[10px] font-black tracking-widest uppercase mb-6 flex items-center gap-3 text-purple-400">
                    <Lock size={18} /> Update Security Key
                </h3>
                <div className="space-y-4">
                    <div className="flex gap-4">
                        <input 
                            type="password" 
                            placeholder="NEW PASSWORD (8글자 이상)" 
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="flex-1 px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white outline-none focus:border-purple-500 transition-all uppercase tracking-widest"
                        />
                    </div>
                    <div className="flex gap-4">
                        <input 
                            type="password" 
                            placeholder="CONFIRM PASSWORD" 
                            value={newPasswordConfirm}
                            onChange={(e) => setNewPasswordConfirm(e.target.value)}
                            className="flex-1 px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white outline-none focus:border-purple-500 transition-all uppercase tracking-widest"
                        />
                    </div>
                    {newPassword && newPasswordConfirm && newPassword !== newPasswordConfirm && (
                        <p className="text-red-400 text-sm font-medium">비밀번호가 일치하지 않습니다.</p>
                    )}
                    <button 
                        onClick={handlePasswordUpdate}
                        disabled={newPassword.length < 8 || newPassword !== newPasswordConfirm}
                        className="bg-purple-600 text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-purple-500 transition-all shadow-[0_0_15px_rgba(147,51,234,0.3)] disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        Update
                    </button>
                </div>
            </div>
        )}

        <div className="flex flex-col lg:flex-row gap-10 items-start">
            {/* Left Sidebar */}
            <div className="w-full lg:w-1/4 space-y-10 sticky top-40">
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">Campaign Library</h2>
                        <span className="text-[10px] font-black bg-white/5 text-slate-400 px-3 py-1 rounded-full border border-white/5">{campaigns.length}</span>
                    </div>
                    <div className="space-y-4">
                        {campaigns.map(campaign => (
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
                
                {/* Performance Boosting Section */}
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
            </div>

            {/* Main Content Area */}
            <div className="w-full lg:w-3/4">
                {campaigns.length === 0 && !isDemoMode ? (
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
                                    {selectedCampaign?.status === CampaignStatus.COMPLETED ? 'FINAL REPORT GENERATED' : 
                                     selectedCampaign?.status === CampaignStatus.PAYMENT_PENDING ? 'WAITING FOR CONFIRMATION' : selectedCampaign?.status === CampaignStatus.KICKOFF ? 'KICKOFF - ONBOARDING' : 'ANALYTIC ENGINE ACTIVE - MONITORING LIVE FEED'}
                                </p>
                            </div>
                            <StatusBadge status={selectedCampaign?.status} />
                        </div>
                        <div className="relative z-10">
                            <CampaignDetail
                                campaign={selectedCampaign}
                                isDemoMode={isDemoMode}
                                user={user}
                                isAdminUser={!!(user?.email && adminEmails.includes(user.email.toLowerCase()))}
                                onCampaignScheduleUpdated={handleCampaignScheduleUpdated}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>
      <Footer /> 
    </div>
  );
}