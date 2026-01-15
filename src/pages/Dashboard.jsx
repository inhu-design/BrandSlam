import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { 
  Package, Clock, Truck, UserCheck, AlertCircle, 
  Lock, Settings, BarChart3, Users, PlayCircle, Eye, Heart, MessageCircle, Share2, 
  ChevronRight, Calendar, ExternalLink, Zap
} from 'lucide-react';
import Navbar from '../components/layout/Navbar'; 
import Footer from '../components/layout/Footer';

/**
 * [Type Definition] Campaign Status Enum
 */
const CampaignStatus = {
  PAYMENT_PENDING: 'PAYMENT_PENDING', // 입금 대기
  CONTACTING: 'CONTACTING',           // 인플루언서 컨택 중
  SHIPPING: 'SHIPPING',               // 제품 발송 중
  UPLOADING: 'UPLOADING',             // 콘텐츠 업로드 중
  COMPLETED: 'COMPLETED'              // 캠페인 완료
};

/**
 * [Mock Data] Demo Campaigns for Pre-purchase Preview
 */
const DEMO_CAMPAIGNS = [
  {
    id: 'demo-1',
    plan: 'STANDARD',
    status: CampaignStatus.UPLOADING,
    brand_name: 'BrandSlam Demo',
    product_name: 'Vita-C Serum',
    start_date: '2024-01-15',
    end_date: '2024-02-15',
    best_message: "끈적임 없이 흡수되는 비타민 세럼, 아침에도 밀리지 않아요!",
    kpi_views: '1.2M', kpi_likes: '45.2K', kpi_comments: '1,203', kpi_shares: '3,400',
    creators: [
      { name: '@sarah_beauty', platform: 'TikTok', status: 'Uploaded', link: '#' },
      { name: '@skincare_guru', platform: 'TikTok', status: 'Shipping', link: '#' },
      { name: '@glowwithme', platform: 'Reels', status: 'Contacting', link: '#' },
    ],
    contents: [
      { id: 1, thumbnail_url: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&q=80', views: '450K' },
      { id: 2, thumbnail_url: 'https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=400&q=80', views: '320K' },
      { id: 3, thumbnail_url: 'https://images.unsplash.com/photo-1611162618071-b39a2ec055fb?w=400&q=80', views: '120K' },
    ]
  },
  {
    id: 'demo-2',
    plan: 'BASIC',
    status: CampaignStatus.CONTACTING,
    brand_name: 'BrandSlam Demo',
    product_name: 'Daily Sunscreen',
    start_date: '2024-02-01',
    end_date: '2024-03-01',
    kpi_views: '-', kpi_likes: '-', kpi_comments: '-', kpi_shares: '-',
    creators: [],
    contents: []
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
    className={`p-5 rounded-2xl border transition-all cursor-pointer ${
      isActive 
      ? 'bg-white border-indigo-500 ring-1 ring-indigo-500 shadow-md' 
      : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-sm'
    }`}
  >
    <div className="flex justify-between items-start mb-3">
      <div>
        <span className="text-xs font-bold text-indigo-600 mb-1 block">{campaign.plan} PLAN</span>
        <h3 className="font-bold text-slate-900 line-clamp-1">{campaign.product_name || '상품명 미정'}</h3>
      </div>
      <StatusBadge status={campaign.status} />
    </div>
    <div className="flex items-center gap-2 text-xs text-slate-400">
      <Calendar size={12} />
      {campaign.start_date || '일정 미정'} ~ {campaign.end_date || '...'}
    </div>
  </div>
);

const CampaignDetail = ({ campaign }) => {
  if (!campaign) return <div className="text-center py-20 text-slate-400">캠페인을 선택해주세요.</div>;

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* 1. KPI Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard icon={Eye} label="Total Views" value={campaign.kpi_views} color="bg-blue-50 text-blue-600" />
        <MetricCard icon={Heart} label="Likes" value={campaign.kpi_likes} color="bg-red-50 text-red-600" />
        <MetricCard icon={MessageCircle} label="Comments" value={campaign.kpi_comments} color="bg-green-50 text-green-600" />
        <MetricCard icon={Share2} label="Shares" value={campaign.kpi_shares} color="bg-purple-50 text-purple-600" />
      </div>

      {/* 2. Creator Pool Status */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Users size={18} className="text-slate-400"/> Creator Pool Status
          </h3>
          <span className="text-xs text-slate-400">실시간 업데이트</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-white text-slate-500 font-medium border-b border-slate-100">
              <tr>
                <th className="px-6 py-3">Creator Name</th>
                <th className="px-6 py-3">Platform</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {campaign.creators && campaign.creators.length > 0 ? campaign.creators.map((creator, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3 font-medium text-slate-700">{creator.name}</td>
                  <td className="px-6 py-3 text-slate-500">{creator.platform}</td>
                  <td className="px-6 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded border font-medium ${
                      creator.status === 'Uploaded' ? 'bg-green-50 text-green-600 border-green-100' :
                      creator.status === 'Shipping' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                      'bg-slate-50 text-slate-500 border-slate-100'
                    }`}>
                      {creator.status}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    {creator.link ? (
                        <a href={creator.link} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                        View <ExternalLink size={12}/>
                        </a>
                    ) : (
                        <span className="text-slate-300">-</span>
                    )}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-slate-400">
                    아직 매칭된 크리에이터가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Uploaded Contents Gallery */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
         <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <PlayCircle size={18} className="text-slate-400"/> Uploaded Contents
         </h3>
         {campaign.contents && campaign.contents.length > 0 ? (
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             {campaign.contents.map((content, idx) => (
               <div key={idx} className="relative aspect-[9/16] rounded-xl overflow-hidden bg-slate-100 group cursor-pointer border border-slate-200 shadow-sm hover:shadow-md transition-all">
                 {content.thumbnail_url ? (
                     <img src={content.thumbnail_url} alt="Thumbnail" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                 ) : (
                     <div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-400 text-xs">No Image</div>
                 )}
                 
                 <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 to-transparent p-3">
                    <p className="text-white text-xs font-bold flex items-center gap-1">
                      <Eye size={10} /> {content.views || '0'}
                    </p>
                 </div>
               </div>
             ))}
           </div>
         ) : (
            <div className="py-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <p className="text-slate-400 text-sm">아직 업로드된 콘텐츠가 없습니다.</p>
            </div>
         )}
      </div>

      {/* 4. Best Performing Message (Moved to Bottom) */}
      {(campaign.status === CampaignStatus.UPLOADING || campaign.status === CampaignStatus.COMPLETED) && (
         <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg mt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
               <div className="flex-1">
                  <h4 className="font-bold text-lg mb-2 flex items-center gap-2"><Zap size={18} className="text-yellow-300"/> Best Performing Message</h4>
                  <p className="text-indigo-100 text-xs mb-3">이번 캠페인에서 가장 반응이 좋았던 소구 포인트입니다.</p>
                  <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20">
                      <p className="font-medium text-sm leading-relaxed">
                          "{campaign.best_message || "데이터 수집 중입니다..."}"
                      </p>
                  </div>
               </div>
               <button className="bg-white text-indigo-600 px-6 py-3 rounded-xl text-sm font-bold hover:bg-indigo-50 transition-colors shadow-sm whitespace-nowrap">
                  다음 캠페인에 사용
               </button>
            </div>
         </div>
      )}
    </div>
  );
};

// --- Main Dashboard ---

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  
  // State
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  
  // Password Setting State
  const [newPassword, setNewPassword] = useState('');
  const [isPasswordMode, setIsPasswordMode] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      // 1. Auth Check (로그인 안 해도 접근 가능하도록 변경)
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      // 2. Data Fetching Logic
      if (user) {
        // [Logged In] Fetch Real Data
        const { data } = await supabase
          .from('campaigns')
          .select(`
            *,
            creators (*),
            contents (*)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (data && data.length > 0) {
          setCampaigns(data);
          setSelectedCampaignId(data[0].id);
          setIsDemoMode(false);
        } else {
          // 유저는 있지만 캠페인이 없으면 데모 데이터 표시
          setCampaigns(DEMO_CAMPAIGNS);
          setSelectedCampaignId(DEMO_CAMPAIGNS[0].id);
          setIsDemoMode(true);
        }
      } else {
        // [Guest] Load Demo Data (비로그인 사용자)
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

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

  const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      
      {/* Demo Mode Banner */}
      {isDemoMode && (
          <div className="bg-indigo-600 text-white text-center py-2 text-sm font-medium pt-24 animate-fade-in-down relative z-10">
              <span className="opacity-90">현재 <b>데모 모드</b>입니다. 실제 캠페인을 시작하시면 실시간 데이터를 확인할 수 있습니다.</span>
          </div>
      )}

      {/* Main Content Area */}
      <div className={`flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 ${isDemoMode ? 'py-8' : 'pt-32 pb-24'}`}>
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
                {/* [수정] 이메일 대신 '담당자님'으로 통일 */}
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
                    Welcome, 담당자님 👋
                </h1>
                <p className="text-slate-500">
                    현재 진행 중인 캠페인 현황을 한눈에 확인하세요.
                </p>
            </div>
            
            {/* 설정 버튼은 로그인한 유저에게만 표시 */}
            {user && (
                <button 
                    onClick={() => setIsPasswordMode(!isPasswordMode)}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm w-fit text-slate-600"
                >
                    <Settings size={16} />
                    계정 설정
                </button>
            )}
        </div>

        {/* Password Setting Panel (로그인한 유저만 가능) */}
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
                    <button 
                        onClick={handlePasswordUpdate}
                        className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors whitespace-nowrap shadow-sm"
                    >
                        변경하기
                    </button>
                </div>
            </div>
        )}

        {/* Main Dashboard Grid */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
            
            {/* [Left Sidebar] Campaign List */}
            <div className="w-full lg:w-1/3 space-y-4">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">My Campaigns</h2>
                    <span className="text-xs font-medium bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{campaigns.length}</span>
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
                
                {/* New Campaign CTA */}
                <div 
                    onClick={() => navigate('/pricing')}
                    className="p-6 rounded-2xl border-2 border-dashed border-slate-200 text-center hover:border-indigo-300 hover:bg-indigo-50/50 transition-all cursor-pointer group"
                >
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400 group-hover:bg-white group-hover:text-indigo-500 transition-colors">
                        <Package size={24} />
                    </div>
                    <p className="text-sm font-bold text-slate-600 group-hover:text-indigo-700">새 캠페인 추가하기</p>
                    <p className="text-xs text-slate-400 mt-1">플랜을 선택하여 확장을 시작하세요</p>
                </div>
            </div>

            {/* [Right Content] Campaign Detail */}
            <div className="w-full lg:w-2/3">
                 <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-200 min-h-[600px]">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-6 border-b border-slate-100 gap-4">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-1">{selectedCampaign?.product_name || 'Campaign'}</h2>
                            <p className="text-slate-500 text-sm flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                실시간 데이터 분석 중
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