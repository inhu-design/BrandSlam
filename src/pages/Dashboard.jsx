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
 * [Logic 보존] Campaign Status Enum & Helper Functions
 */
const CampaignStatus = {
  PAYMENT_PENDING: 'PAYMENT_PENDING',
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

// --- [Mock Data: 100% 보존] ---
const DEMO_CAMPAIGNS = [
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
    [CampaignStatus.PAYMENT_PENDING]: "bg-slate-800 text-slate-400 border-slate-700",
    [CampaignStatus.CONTACTING]: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    [CampaignStatus.SHIPPING]: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    [CampaignStatus.UPLOADING]: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    [CampaignStatus.COMPLETED]: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  };
  
  const labels = {
    [CampaignStatus.PAYMENT_PENDING]: "입금 대기",
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
        <h3 className="font-bold text-white text-base truncate pr-2">{campaign.product_name || '상품명 미정'}</h3>
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

// --- Detail Component: Candidate List (섭외 중) ---
const CandidateList = ({ candidates, targetCount, matchedCount }) => {
    const progress = Math.min(Math.round((matchedCount / targetCount) * 100), 100);

    const handleDownloadCSV = () => {
        alert("납품 리스트가 아직 확정되지 않았습니다. 인플루언서 섭외가 완료되고 확정된 후에 다운로드 가능합니다.");
    };

    const handleDeleteCreator = (e, creatorName) => {
        e.stopPropagation();
        if (window.confirm(`[인플루언서 교체 안내]\n\n${creatorName} 님을 정말 교체하시겠습니까?\n\n* 섭외 중 단계에서는 제공된 리스트의 30%까지만 교체/삭제가 가능합니다.`)) {
             alert("교체 요청이 접수되었습니다. (데모)");
        }
    };

    return (
        <div className="space-y-10 animate-fade-in-up">
            <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[100px] rounded-full"></div>
                <div className="flex justify-between items-end mb-6 relative z-10">
                    <div>
                        <h4 className="font-black text-white text-2xl tracking-tighter">섭외 진행 현황</h4>
                        <p className="text-sm text-slate-500 mt-2 font-light tracking-tight">목표 인원 달성 시 자동으로 제품 배송 단계로 전환됩니다.</p>
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

            <div className="bg-white/5 backdrop-blur-md rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl">
                <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                    <h3 className="font-black text-white flex items-center gap-3 tracking-tighter">
                        <UserCheck size={20} className="text-cyan-400"/> 리스트 (Real-time)
                    </h3>
                    <button 
                        onClick={handleDownloadCSV}
                        className="text-[10px] font-black tracking-widest uppercase px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 text-slate-300 transition-all flex items-center gap-2"
                    >
                        <Download size={14}/> CSV Export
                    </button>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-white/5 text-slate-500 font-black uppercase tracking-widest text-[10px] border-b border-white/5">
                            <tr>
                                <th className="px-8 py-5">인플루언서</th>
                                <th className="px-8 py-5">채널/팔로워</th>
                                <th className="px-8 py-5">상세정보(Masked)</th>
                                <th className="px-8 py-5">프로세스</th>
                                <th className="px-8 py-5 text-right">매니지먼트</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {candidates && candidates.map((creator) => (
                                <tr key={creator.id} className="hover:bg-white/5 transition-all group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-black text-sm shadow-lg group-hover:scale-110 transition-transform">
                                                {creator.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-white text-base tracking-tight">{creator.name}</p>
                                                <a href="#" className="text-xs text-cyan-400/70 hover:text-cyan-400 transition-colors">{creator.handle}</a>
                                            </div>
                                        </div>
                                    </td>
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

// --- Main Campaign Detail Container ---
const CampaignDetail = ({ campaign }) => {
  if (!campaign) return <div className="flex flex-col items-center justify-center py-40 text-slate-700 font-black uppercase tracking-[0.3em]"><Package size={48} className="mb-4 opacity-20"/> Select Campaign</div>;

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
    else { alert("비밀번호가 성공적으로 변경되었습니다."); setIsPasswordMode(false); setNewPassword(''); }
  };

  const handleSparkAdsClick = () => {
    alert("본 서비스는 부가 서비스를 구독 중인 브랜드에만 제공됩니다. (현재 준비 중)");
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

        {isPasswordMode && user && (
            <div className="mb-12 bg-white/5 backdrop-blur-3xl p-8 rounded-[2.5rem] shadow-2xl border border-purple-500/30 animate-fade-in-up max-w-xl">
                <h3 className="text-[10px] font-black tracking-widest uppercase mb-6 flex items-center gap-3 text-purple-400">
                    <Lock size={18} /> Update Security Key
                </h3>
                <div className="flex gap-4">
                    <input 
                        type="password" 
                        placeholder="NEW PASSWORD (MIN 6 CHARS)" 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="flex-1 px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white outline-none focus:border-purple-500 transition-all uppercase tracking-widest"
                    />
                    <button onClick={handlePasswordUpdate} className="bg-purple-600 text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-purple-500 transition-all shadow-[0_0_15px_rgba(147,51,234,0.3)]">Update</button>
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
                    <div onClick={() => navigate('/#pricing')} className="p-8 rounded-[2.5rem] border-2 border-dashed border-white/5 text-center hover:border-purple-500/50 hover:bg-purple-500/5 transition-all cursor-pointer group relative overflow-hidden">
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
                 <div className="bg-white/5 backdrop-blur-2xl p-8 md:p-12 rounded-[4rem] border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)] min-h-[900px] relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 pb-10 border-b border-white/5 gap-8 relative z-10">
                        <div>
                            <div className="flex items-center gap-4 mb-3">
                                <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase leading-none">{selectedCampaign?.product_name || 'Campaign'}</h2>
                                <span className="text-[10px] font-black px-4 py-1.5 bg-cyan-500/10 text-cyan-400 rounded-full border border-cyan-400/20 tracking-widest uppercase">{selectedCampaign?.plan}</span>
                            </div>
                            <p className="text-slate-500 text-lg font-light flex items-center gap-3 tracking-tight">
                                <span className={`w-3 h-3 rounded-full ${selectedCampaign?.status === CampaignStatus.COMPLETED ? 'bg-slate-700 shadow-none' : 'bg-cyan-400 animate-pulse shadow-[0_0_10px_rgba(34,211,238,0.8)]'}`}></span>
                                {selectedCampaign?.status === CampaignStatus.COMPLETED ? 'FINAL REPORT GENERATED' : 'ANALYTIC ENGINE ACTIVE - MONITORING LIVE FEED'}
                            </p>
                        </div>
                        <StatusBadge status={selectedCampaign?.status} />
                    </div>
                    <div className="relative z-10">
                        <CampaignDetail campaign={selectedCampaign} />
                    </div>
                 </div>
            </div>
        </div>
      </div>
      <Footer /> 
    </div>
  );
}