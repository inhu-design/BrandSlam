import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { 
  Package, Clock, Truck, UserCheck, AlertCircle, 
  Lock, Settings, BarChart3, Users, PlayCircle, Eye, Heart, MessageCircle, Share2, 
  ChevronRight, Calendar, ExternalLink, Zap, Trash2, CheckCircle2, MoreHorizontal,
  Plane, Gift, TrendingUp, BarChart2, Trophy, RefreshCw, AlertTriangle, Download
} from 'lucide-react';
import Navbar from '../components/layout/Navbar'; 
import Footer from '../components/layout/Footer';

/**
 * [Type Definition] Campaign Status Enum
 */
const CampaignStatus = {
  PAYMENT_PENDING: 'PAYMENT_PENDING',
  CONTACTING: 'CONTACTING',
  SHIPPING: 'SHIPPING',
  UPLOADING: 'UPLOADING',
  COMPLETED: 'COMPLETED'
};

/**
 * [Helper] PII Masking Function
 * 개인정보 보호를 위한 마스킹 처리
 */
const maskData = (text, type = 'general') => {
  if (!text) return '-';
  if (type === 'email') {
    const [local, domain] = text.split('@');
    return `${local.slice(0, 2)}****@${domain}`;
  }
  if (type === 'address') {
    // 구체적 주소 숨김 및 마스킹
    return "배송사를 통해 전달됨 (비공개)"; 
  }
  if (type === 'contact') {
      return text.slice(0, 3) + "****" + text.slice(-2);
  }
  // 일반적인 마스킹 (거주지 등)
  return text.length > 5 ? text.slice(0, 5) + "****" : "****";
};

/**
 * [Mock Data] Demo Campaigns - Reordered based on process flow
 */
const DEMO_CAMPAIGNS = [
  // 1. 인플루언서 섭외 중 (Contacting)
  {
    id: 'demo-2',
    plan: 'BASIC',
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
  // 2. 콘텐츠 업로드 중 (Uploading)
  {
    id: 'demo-1',
    plan: 'STANDARD',
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
  // 3. 캠페인 완료 (Completed)
  {
    id: 'demo-3',
    plan: 'PREMIUM',
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

// --- Sub-Components ---

const StatusBadge = ({ status }) => {
  const styles = {
    [CampaignStatus.PAYMENT_PENDING]: "bg-slate-100 text-slate-600 border-slate-200",
    [CampaignStatus.CONTACTING]: "bg-blue-50 text-blue-600 border-blue-100",
    [CampaignStatus.SHIPPING]: "bg-orange-50 text-orange-600 border-orange-100",
    [CampaignStatus.UPLOADING]: "bg-purple-50 text-purple-600 border-purple-100",
    [CampaignStatus.COMPLETED]: "bg-green-50 text-green-600 border-green-100",
  };
  
  const labels = {
    [CampaignStatus.PAYMENT_PENDING]: "입금 대기",
    [CampaignStatus.CONTACTING]: "인플루언서 섭외 중",
    [CampaignStatus.SHIPPING]: "제품 발송 중",
    [CampaignStatus.UPLOADING]: "콘텐츠 업로드 중",
    [CampaignStatus.COMPLETED]: "캠페인 완료",
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${styles[status] || styles[CampaignStatus.PAYMENT_PENDING]}`}>
      {labels[status] || status}
    </span>
  );
};

const MetricCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
    <div className={`p-3 rounded-lg ${color}`}>
      {Icon && <Icon size={20} />}
    </div>
    <div>
      <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">{label}</p>
      <p className="text-xl font-bold text-slate-900">{value || '-'}</p>
    </div>
  </div>
);

const CampaignCard = ({ campaign, onClick, isActive }) => (
  <div 
    onClick={onClick}
    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
      isActive 
      ? 'bg-white border-indigo-500 ring-1 ring-indigo-500 shadow-md' 
      : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-sm'
    }`}
  >
    <div className="flex justify-between items-start mb-2">
      <div className="min-w-0">
        <span className="text-[10px] font-bold text-indigo-600 mb-0.5 block">{campaign.plan} PLAN</span>
        <h3 className="font-bold text-slate-900 text-sm truncate pr-2">{campaign.product_name || '상품명 미정'}</h3>
      </div>
    </div>
    <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
            <Calendar size={10} />
            <span className="truncate">{campaign.start_date || '일정 미정'}</span>
        </div>
        <StatusBadge status={campaign.status} />
    </div>
  </div>
);

// --- Detail Component: Candidate List (섭외 중) ---
const CandidateList = ({ candidates, targetCount, matchedCount }) => {
    const progress = Math.min(Math.round((matchedCount / targetCount) * 100), 100);

    const handleDownloadCSV = () => {
        // [Logic] 확정된 상태가 아니면 다운로드 불가
        // 현재는 'CONTACTING' 상태이므로 확정이 아님을 전제로 함
        alert("납품 리스트가 아직 확정되지 않았습니다. 인플루언서 섭외가 완료되고 확정된 후에 다운로드 가능합니다.");
    };

    const handleDeleteCreator = (e, creatorName) => {
        e.stopPropagation();
        // [UX] 확인 모달 및 30% 제한 안내 메시지
        if (window.confirm(`[인플루언서 교체 안내]\n\n${creatorName} 님을 정말 교체하시겠습니까?\n\n* 섭외 중 단계에서는 제공된 리스트의 30%까지만 교체/삭제가 가능합니다.`)) {
             alert("교체 요청이 접수되었습니다. (데모)");
        }
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-end mb-3">
                    <div>
                        <h4 className="font-bold text-slate-800 text-lg">섭외 진행 현황</h4>
                        <p className="text-xs text-slate-500 mt-1">목표 인원 달성 시 자동으로 배송 단계로 넘어갑니다.</p>
                    </div>
                    <div className="text-right">
                        <span className="text-3xl font-extrabold text-indigo-600">{progress}%</span>
                        <span className="text-xs text-slate-400 font-medium ml-1">({matchedCount}/{targetCount})</span>
                    </div>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-1000 ease-out rounded-full relative"
                        style={{ width: `${progress}%` }}
                    >
                        <div className="absolute top-0 left-0 w-full h-full bg-white/20 animate-[shimmer_2s_infinite]"></div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <UserCheck size={18} className="text-slate-400"/> 섭외 리스트 (실시간)
                    </h3>
                    <div className="flex gap-2">
                        <button 
                            onClick={handleDownloadCSV}
                            className="text-xs font-medium px-3 py-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors flex items-center gap-1"
                        >
                            <Download size={12}/> CSV 다운로드
                        </button>
                    </div>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-3 w-1/4">인플루언서</th>
                                <th className="px-6 py-3">플랫폼/팔로워</th>
                                <th className="px-6 py-3">거주지/연락처</th>
                                <th className="px-6 py-3">상태</th>
                                <th className="px-6 py-3 text-right">교체/관리</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {candidates && candidates.map((creator) => (
                                <tr key={creator.id} className="hover:bg-slate-50/80 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                                                {creator.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800">{creator.name}</p>
                                                <a href="#" className="text-xs text-indigo-500 hover:underline">{creator.handle}</a>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-slate-700">{creator.platform}</span>
                                            <span className="text-xs text-slate-400">{creator.followers} Followers</span>
                                        </div>
                                    </td>
                                    {/* [PII] 마스킹 처리된 정보 출력 */}
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-slate-600 flex items-center gap-1 text-xs">
                                                {maskData(creator.location, 'general')}
                                            </span>
                                            <span className="text-slate-400 text-[10px]">
                                                {maskData(creator.contact, 'email')}
                                            </span>
                                            <span className="text-slate-400 text-[10px]">
                                                배송지: {maskData(null, 'address')}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                            creator.status === 'Approved' ? 'bg-green-50 text-green-600 border-green-100' :
                                            creator.status === 'Rejected' ? 'bg-red-50 text-red-600 border-red-100' :
                                            'bg-yellow-50 text-yellow-600 border-yellow-100'
                                        }`}>
                                            {creator.status === 'Approved' ? '섭외완료' : 
                                             creator.status === 'Rejected' ? '거절됨' : '검토중'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {/* [UX] 삭제 -> 교환 아이콘 및 개념 변경 */}
                                        <button 
                                            className="text-slate-400 hover:text-indigo-500 p-2 rounded-full hover:bg-indigo-50 transition-all group-hover:visible"
                                            title="다른 인플루언서로 교체 요청 (30% 한도 내)"
                                            onClick={(e) => handleDeleteCreator(e, creator.name)}
                                        >
                                            <RefreshCw size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// --- Detail Component: Analytics (완료된 캠페인) ---
const AnalyticsReport = ({ campaign }) => {
    return (
        <div className="space-y-8 animate-fade-in-up">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                        <BarChart2 size={20} className="text-indigo-600" /> 
                        캠페인 최종 성과 리포트
                    </h3>
                    <button className="text-sm text-slate-500 hover:text-indigo-600 flex items-center gap-1 border px-3 py-1.5 rounded-lg hover:border-indigo-200 transition-colors">
                        <ExternalLink size={14}/> PDF 다운로드
                    </button>
                </div>

                <div className="bg-slate-50 rounded-xl border border-slate-100 p-6 mb-6">
                    <div className="flex h-64 relative items-end pb-8 pl-8 gap-4">
                        <div className="absolute top-0 left-0 h-full flex flex-col justify-between text-[10px] text-slate-400 pb-8">
                            <span>300K</span>
                            <span>200K</span>
                            <span>100K</span>
                            <span>0</span>
                        </div>
                        
                        {campaign.analytics?.daily_views.map((views, idx) => (
                            <div key={idx} className="flex-1 flex flex-col justify-end group relative h-full">
                                <div 
                                    className="w-full bg-indigo-300 hover:bg-indigo-500 transition-all rounded-t-sm relative"
                                    style={{ height: `${(views / 300) * 100}%` }}
                                >
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                        {views}K Views
                                    </div>
                                </div>
                                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-slate-400 whitespace-nowrap">
                                    {campaign.analytics?.dates[idx]}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                        <p className="text-xs text-indigo-600 font-bold mb-1">총 도달(Reach)</p>
                        <p className="text-2xl font-extrabold text-slate-900">{campaign.kpi_views}</p>
                        <p className="text-[10px] text-slate-500 mt-1">예상 대비 145% 달성 🚀</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                        <p className="text-xs text-green-600 font-bold mb-1">평균 참여율(ER)</p>
                        <p className="text-2xl font-extrabold text-slate-900">{campaign.analytics?.engagement_rate}</p>
                        <p className="text-[10px] text-slate-500 mt-1">업계 평균(3.5%) 상회</p>
                    </div>
                    <div className="col-span-1 md:col-span-3 mt-4">
                        <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                            <Trophy size={16} className="text-yellow-500"/> Best Performing Ads (Top 3)
                        </h4>
                        <div className="grid grid-cols-3 gap-4">
                            {campaign.analytics?.top_contents.map((content) => (
                                <div key={content.id} className="relative aspect-[9/16] rounded-xl overflow-hidden group cursor-pointer border border-slate-200 shadow-sm">
                                    <img src={content.thumbnail} alt="Top Content" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                    <div className="absolute top-2 left-2 bg-yellow-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                                        TOP {content.id}
                                    </div>
                                    <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 to-transparent p-3">
                                        <p className="text-white text-xs font-bold mb-0.5">{content.creator}</p>
                                        <p className="text-white/80 text-[10px] flex items-center gap-1"><Eye size={10}/> {content.views}</p>
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
        <div className="space-y-8 animate-fade-in-up">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard icon={Eye} label="Total Views" value={campaign.kpi_views} color="bg-blue-50 text-blue-600" />
                <MetricCard icon={Heart} label="Likes" value={campaign.kpi_likes} color="bg-red-50 text-red-600" />
                <MetricCard icon={MessageCircle} label="Comments" value={campaign.kpi_comments} color="bg-green-50 text-green-600" />
                <MetricCard icon={Share2} label="Shares" value={campaign.kpi_shares} color="bg-purple-50 text-purple-600" />
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Users size={18} className="text-slate-400"/> Engagement Top 10 Creators
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">성과가 좋은 크리에이터에게 추가 광고를 집행하거나 리워드를 지급해보세요.</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-white text-slate-500 font-medium border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-3">Rank</th>
                                <th className="px-6 py-3">Creator</th>
                                <th className="px-6 py-3">Views</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {campaign.creators.map((creator, idx) => (
                                <tr key={creator.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-3 font-bold text-slate-400 w-12">{idx + 1}</td>
                                    <td className="px-6 py-3">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-slate-700">{creator.name}</span>
                                            <span className="text-[10px] text-slate-400 border px-1 rounded">{creator.platform}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 font-bold text-indigo-600">{creator.views}</td>
                                    <td className="px-6 py-3">
                                        <span className={`text-[10px] px-2 py-0.5 rounded border font-bold ${
                                            creator.status === 'Uploaded' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-slate-50 text-slate-500 border-slate-100'
                                        }`}>
                                            {creator.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button className="text-[10px] font-bold px-2 py-1 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100 transition-colors border border-indigo-100 flex items-center gap-1">
                                                <Zap size={10} /> Spark Ads
                                            </button>
                                            <button className="text-[10px] font-bold px-2 py-1 bg-pink-50 text-pink-600 rounded hover:bg-pink-100 transition-colors border border-pink-100 flex items-center gap-1">
                                                <Gift size={10} /> Credit 지급
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <PlayCircle size={18} className="text-slate-400"/> Uploaded Contents Gallery
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {campaign.contents.map((content, idx) => (
                        <div key={idx} className="relative aspect-[9/16] rounded-xl overflow-hidden bg-slate-100 group cursor-pointer border border-slate-200 shadow-sm hover:shadow-md transition-all">
                            {content.thumbnail_url ? (
                                <img src={content.thumbnail_url} alt="Thumbnail" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-400 text-xs">No Image</div>
                            )}
                            <div className="absolute top-2 left-2 bg-black/50 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded-full truncate max-w-[80%]">
                                {content.creator}
                            </div>
                            <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 to-transparent p-3">
                                <p className="text-white text-xs font-bold flex items-center gap-1">
                                    <Eye size={10} /> {content.views || '0'}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// --- Main Campaign Detail Container ---
const CampaignDetail = ({ campaign }) => {
  if (!campaign) return <div className="text-center py-20 text-slate-400">캠페인을 선택해주세요.</div>;

  if (campaign.status === CampaignStatus.CONTACTING) {
      return (
          <CandidateList 
            candidates={campaign.candidates} 
            targetCount={campaign.target_creators || 50} 
            matchedCount={campaign.matched_creators || 0} 
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
  const [user, setUser] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [isPasswordMode, setIsPasswordMode] = useState(false);

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

        if (data && data.length > 0) {
          setCampaigns(data);
          setSelectedCampaignId(data[0].id);
          setIsDemoMode(false);
        } else {
          setCampaigns(DEMO_CAMPAIGNS);
          setSelectedCampaignId(DEMO_CAMPAIGNS[0].id);
          setIsDemoMode(true);
        }
      } else {
        setCampaigns(DEMO_CAMPAIGNS);
        setSelectedCampaignId(DEMO_CAMPAIGNS[0].id);
        setIsDemoMode(true);
      }
      setLoading(false);
    };

    fetchData();
  }, [navigate]);

  const handlePasswordUpdate = async () => {
    if (newPassword.length < 6) return alert("비밀번호는 6자 이상이어야 합니다.");
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) alert("실패: " + error.message);
    else { alert("비밀번호가 설정되었습니다."); setIsPasswordMode(false); setNewPassword(''); }
  };

  const handleSparkAdsClick = () => {
    alert("현재 준비 중인 서비스입니다. (Coming Soon)");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

  const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      {/* [수정] 상단바 제거하고 Navbar 아래 여백 조정 */}
      <div className={`flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24`}>
        {/* [수정] 데모 모드 안내 문구 위치 및 디자인 변경 */}
        {isDemoMode && (
            <div className="mb-6 p-3 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center gap-2 text-indigo-700 text-sm animate-fade-in-down">
                <AlertCircle size={16} />
                <span>현재 <b>데모 모드</b>입니다. 실제 캠페인을 시작하시면 실시간 데이터를 확인할 수 있습니다.</span>
            </div>
        )}

        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
                    {user ? `반갑습니다, ${user.email.split('@')[0]} 님 👋` : `반갑습니다, 담당자님 👋`}
                </h1>
                <p className="text-slate-500">현재 진행 중인 캠페인 현황을 한눈에 확인하세요.</p>
            </div>
            {user && (
                <button 
                    onClick={() => setIsPasswordMode(!isPasswordMode)}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm w-fit text-slate-600"
                >
                    <Settings size={16} /> 계정 설정
                </button>
            )}
        </div>
        {isPasswordMode && user && (
            <div className="mb-8 bg-white p-6 rounded-2xl shadow-sm border border-indigo-100 animate-fade-in-up max-w-lg">
                <h3 className="text-sm font-bold mb-3 flex items-center gap-2 text-indigo-900">
                    <Lock size={16} className="text-indigo-600"/> 비밀번호 재설정
                </h3>
                <div className="flex gap-2">
                    <input 
                        type="password" 
                        placeholder="새 비밀번호 입력 (6자 이상)" 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 transition-all"
                    />
                    <button onClick={handlePasswordUpdate} className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors whitespace-nowrap shadow-sm">변경하기</button>
                </div>
            </div>
        )}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* Left Sidebar / Menu Column */}
            <div className="w-full lg:w-1/4 space-y-6">
                <div className="space-y-4">
                    <div className="flex items-center justify-between mb-2 px-1">
                        {/* [UI] 명도 개선: slate-400 -> slate-600 */}
                        <h2 className="text-sm font-bold text-slate-600 uppercase tracking-wider">My Campaigns</h2>
                        <span className="text-xs font-medium bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{campaigns.length}</span>
                    </div>
                    <div className="space-y-3">
                        {campaigns.map(campaign => (
                            <CampaignCard 
                                key={campaign.id} 
                                campaign={campaign} 
                                isActive={selectedCampaignId === campaign.id}
                                onClick={() => setSelectedCampaignId(campaign.id)}
                            />
                        ))}
                    </div>
                    <div onClick={() => navigate('/pricing')} className="p-5 rounded-2xl border-2 border-dashed border-slate-300 text-center hover:border-indigo-400 hover:bg-indigo-50/50 transition-all cursor-pointer group">
                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-2 text-slate-500 group-hover:bg-white group-hover:text-indigo-500 transition-colors">
                            <Package size={20} />
                        </div>
                        <p className="text-xs font-bold text-slate-700 group-hover:text-indigo-700">새 캠페인 추가하기</p>
                    </div>
                </div>
                
                {/* [Service Section] 성과 부스팅 개편 */}
                <div className="space-y-3 pt-6 border-t border-slate-200">
                    <h2 className="text-sm font-bold text-slate-600 uppercase tracking-wider px-1">성과부스팅 (Performance Boosting)</h2>
                    
                    {/* [수정] KOL Boosting Card: Spark Ads와 동일하게 비활성화 처리 */}
                    <div 
                        onClick={handleSparkAdsClick}
                        className="bg-slate-50 p-4 rounded-xl border border-slate-200 cursor-not-allowed opacity-80"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            {/* Icon Color Changed */}
                            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-400 shadow-sm"><TrendingUp size={16} /></div>
                            <span className="font-bold text-slate-500 text-sm">KOL 부스팅</span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed mb-2">성과가 좋은 인플루언서를 유상으로 추가 섭외하여 임팩트를 극대화하세요.</p>
                        {/* Status Changed to match disabled look */}
                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">준비 중입니다 (Coming Soon)</span>
                    </div>

                    {/* Spark Ads Card (Coming Soon / Disabled) */}
                    <div 
                        onClick={handleSparkAdsClick}
                        className="bg-slate-50 p-4 rounded-xl border border-slate-200 cursor-not-allowed opacity-80"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-400 shadow-sm"><Zap size={16} /></div>
                            <span className="font-bold text-slate-500 text-sm">Spark Ads</span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed mb-2">틱톡 공식 광고 관리자 연동 서비스</p>
                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">준비 중입니다 (Coming Soon)</span>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="w-full lg:w-3/4">
                 <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-200 min-h-[800px]">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-6 border-b border-slate-100 gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h2 className="text-2xl font-bold text-slate-900">{selectedCampaign?.product_name || 'Campaign'}</h2>
                                <span className="text-xs font-bold px-2 py-0.5 bg-slate-100 text-slate-500 rounded">{selectedCampaign?.plan}</span>
                            </div>
                            <p className="text-slate-500 text-sm flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${selectedCampaign?.status === CampaignStatus.COMPLETED ? 'bg-slate-400' : 'bg-green-500 animate-pulse'}`}></span>
                                {selectedCampaign?.status === CampaignStatus.COMPLETED ? '데이터 분석 완료' : '실시간 데이터 분석 중'}
                            </p>
                        </div>
                        <StatusBadge status={selectedCampaign?.status} />
                    </div>
                    <CampaignDetail campaign={selectedCampaign} />
                 </div>
            </div>
        </div>
      </div>
      <Footer /> 
    </div>
  );
}