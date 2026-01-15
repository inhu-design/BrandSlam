import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ArrowRight, Globe, Zap, ShieldCheck, Users, Sparkles, HelpCircle, PlayCircle, Video, Crown, Infinity as InfinityIcon, MessageCircle, Flag, MapPin, TrendingUp } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

// --- Data Constants ---

// 1. Subscription Plans
const subscriptionPlans = [
  {
    id: "BASIC",
    name: "BASIC Plan",
    koreanName: "BASIC (신규 브랜드)",
    price: "890,000",
    contentCount: 30,
    mediaType: 'video',
    subtitle: "콘텐츠 기반 구축 단계",
    tagline: "합리적인 가격으로 시작하는 첫 시딩",
    bestFor: "첫 시딩, 데이터가 없는 초기 단계, 월 30~50개 필요",
    description: (
      <>
        신규 브랜드에게 적합합니다.<br className="hidden md:block" />
        콘텐츠 데이터가 없는 초기 단계에서 합리적인 비용으로 기초 자산을 확보할 수 있습니다.
      </>
    ),
    features: [
      "월 30개 숏폼 콘텐츠 제공",
      "콘텐츠 트래킹 서비스 포함",
      "콘텐츠 USP 가이드 제공",
      "얼굴 등장/제형/사용장면 믹스",
      "기본 성과 리포트 제공"
    ],
    theme: "blue",
    gradient: "from-blue-500 to-cyan-500",
    videoIds: [
        "7480532507318930696", 
        "7490227069293497607", 
        "7503964279775694111"  
    ]
  },
  {
    id: "STANDARD",
    name: "STANDARD Plan",
    koreanName: "STANDARD (성장 단계)",
    price: "2,490,000", 
    contentCount: 100,
    mediaType: 'video',
    subtitle: "성과형 콘텐츠 확보 목적",
    tagline: "VOC 분석과 광고 소재까지 확보",
    bestFor: "아마존/틱톡샵 운영, 광고 병행 브랜드, 안정적 볼륨 필요",
    description: (
      <>
        본격적인 성장을 위한 플랜입니다. <br className="hidden md:block" />
        매달 100개의 안정적인 콘텐츠 볼륨과 함께 광고용 원본 소스까지 제공합니다.
      </>
    ),
    features: [
      "월 100개 숏폼 콘텐츠 제공",
      "콘텐츠 트래킹 서비스 포함",
      "VOC 분석 리포트 & Hook 테스트(2안)",
      "콘텐츠 USP 가이드 제공",
      "광고 활용 가능 원본 2건 제공"
    ],
    theme: "emerald", 
    gradient: "from-emerald-500 to-teal-500",
    popular: true,
    videoIds: [
        "7547278761490664726", 
        "7483469504433999126", 
        "7515283181755452728" 
    ]
  },
  {
    id: "PREMIUM",
    name: "PREMIUM Plan",
    koreanName: "PREMIUM (공격적 성장)",
    price: "7,490,000",
    contentCount: 300,
    mediaType: 'video',
    subtitle: "전환·매출 중심 단계",
    tagline: "압도적 물량과 유상 인플루언서 결합",
    bestFor: "틱톡샵 집중 타깃, 전환 데이터 확보, 공격적 스케일업",
    description: (
      <>
        전환과 매출을 위한 최상위 플랜입니다.  <br className="hidden md:block" />
        월 300개의 대량 콘텐츠로 피드를 장악하고, 검증된 Paid 인플루언서를 통해 신뢰도를 높입니다.
      </>
    ),
    features: [
      "월 300개 숏폼 콘텐츠 제공",
      "콘텐츠 트래킹 & VOC 심화 분석",
      "Hook 테스트(2안) & USP 가이드",
      "광고 활용 가능 원본 2건 제공",
      "Paid Influencer (L3) 1명 포함"
    ],
    theme: "pink",
    gradient: "from-pink-500 to-rose-500",
    videoIds: [
        "7494713297048964374", 
        "7476864624529313047", 
        "7506641492056788280" 
    ]
  },
  {
    id: "VISIT",
    name: "VISIT Plan",
    koreanName: "VISIT (오프라인 매장)",
    price: "9,000,000", 
    contentCount: 30,
    mediaType: 'video',
    subtitle: "오프라인 매출 펌핑",
    tagline: "매장 트래픽과 회전율을 위한 방문형 시딩",
    bestFor: "올리브영/ULTA/Sephora 등 오프라인 입점 브랜드",
    description: (
      <>
        입점 이후, 매장 트래픽과 회전율을 끌어올리기 위한 전용 시딩 상품입니다.   <br className="hidden md:block" />
        매장 방문, 제품 구매 및 픽업 장면을 담아 오프라인 구매를 유도합니다.
      </>
    ),
    features: [
      "월 30건 방문형 콘텐츠 제공 (인당 30만원)",
      "매장 방문 및 제품 구매/픽업 장면 포함",
      "자택 사용기 + 매장 정보 노출",
      "단독 또는 구독 상품과 병행 가능",
      "TikTok/Instagram 업로드 최적화"
    ],
    theme: "orange",
    gradient: "from-orange-500 to-amber-500",
    videoIds: [ 
        "7583835509349272887",
        "7537782549209189662",
        "7533257667960179973"
    ]
  }
];

// 2. Updated Influencer Tiers
const influencerTiers = [
  {
    name: "Micro Creator",
    level: "L3",
    price: "약 600,000", 
    gmv: "$25K ~ $60K",
    followers: "20k ~ 80k",
    features: ["팔로워 2만 ~ 8만", "높은 참여율(Engagement)", "진정성 있는 리뷰", "틈새 시장 타겟팅"],
    colorClass: "bg-gradient-to-br from-blue-400 to-cyan-500",
    dotColor: "bg-blue-400"
  },
  {
    name: "Mid-Tier Creator",
    level: "L4",
    price: "약 1,000,000",
    gmv: "$60K ~ $150K",
    followers: "80k ~ 200k",
    features: ["팔로워 8만 ~ 20만", "전문적인 제품 시연", "신뢰도 높은 스토리텔링", "넓은 도달 범위"],
    colorClass: "bg-gradient-to-br from-indigo-400 to-violet-500",
    dotColor: "bg-indigo-400"
  },
  {
    name: "Premium Creator",
    level: "L5",
    price: "약 2,000,000",
    gmv: "$150K ~ $400K",
    followers: "200k ~ 500k",
    features: ["팔로워 20만 ~ 50만", "TVC급 영상 퀄리티", "강력한 브랜드 인지 제고", "높은 구매 전환율"],
    colorClass: "bg-gradient-to-br from-fuchsia-400 to-pink-500",
    dotColor: "bg-fuchsia-400"
  },
  {
    name: "Top-Tier",
    level: "L6",
    price: "약 5,000,000",
    gmv: "$400K +",
    followers: "500k +",
    features: ["팔로워 50만 이상", "압도적 바이럴 파급력", "시네마틱 콘텐츠 제작", "글로벌 팬덤 보유"],
    colorClass: "bg-gradient-to-br from-amber-400 to-orange-500",
    dotColor: "bg-amber-400"
  }
];

// --- Components ---

const Hero = () => (
  <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden bg-slate-50">
    <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-300 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-blob"></div>
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-300 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] bg-indigo-300 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-blob animation-delay-4000"></div>
    </div>

    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-indigo-100 text-xs font-bold text-indigo-600 mb-8 shadow-sm animate-fade-in-up ring-1 ring-indigo-50">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
        </span>
        Monthly Content Solution
      </div>
      
      <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-normal mb-8 leading-snug drop-shadow-sm animate-fade-in-up animation-delay-100">
        불확실한 섭외 대신
        <span className="block mt-3 md:mt-5 text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600">
          검증된 '숫자'로 구독하세요
        </span>
      </h1>
      
      <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-500 mb-12 leading-relaxed animate-fade-in-up animation-delay-200">
        미국 현지 크리에이터 매칭부터 배송, 업로드 관리까지.<br className="hidden md:block" />
        수량만 선택하면 콘텐츠는 매달 자동으로 공급됩니다.
      </p>
    </div>
  </section>
);

export default function Pricing() {
  const [activePlan, setActivePlan] = useState('STANDARD');

  // 현재 선택된 구독 플랜 데이터
  const currentPkg = subscriptionPlans.find(pkg => pkg.id === activePlan);

  // 탭(Tab) 활성화 스타일 매핑
  const tabStyles = {
    blue: {
        container: "border-blue-500 bg-blue-50 text-blue-700 shadow-lg shadow-blue-100 transform -translate-y-1",
        dot: "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"
    },
    emerald: {
        container: "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-lg shadow-emerald-100 transform -translate-y-1",
        dot: "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"
    },
    pink: {
        container: "border-pink-500 bg-pink-50 text-pink-700 shadow-lg shadow-pink-100 transform -translate-y-1",
        dot: "bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.6)]"
    },
    orange: {
        container: "border-orange-500 bg-orange-50 text-orange-700 shadow-lg shadow-orange-100 transform -translate-y-1",
        dot: "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]"
    }
  };

  // 컨텐츠 영역 테마 매핑
  const themeClasses = {
    blue: {
      tagline: "text-blue-600",
      contentColor: "text-blue-600",
      checkBg: "bg-blue-100",
      checkIcon: "text-blue-600",
      icon: "text-blue-500",
      shadow: "shadow-blue-200"
    },
    emerald: {
      tagline: "text-emerald-600",
      contentColor: "text-emerald-600",
      checkBg: "bg-emerald-100",
      checkIcon: "text-emerald-600",
      icon: "text-emerald-500",
      shadow: "shadow-emerald-200"
    },
    pink: {
      tagline: "text-pink-600",
      contentColor: "text-pink-600",
      checkBg: "bg-pink-100",
      checkIcon: "text-pink-600",
      icon: "text-pink-500",
      shadow: "shadow-pink-200"
    },
    orange: {
      tagline: "text-orange-600",
      contentColor: "text-orange-600",
      checkBg: "bg-orange-100",
      checkIcon: "text-orange-600",
      icon: "text-orange-500",
      shadow: "shadow-orange-200"
    }
  };

  const currentTheme = themeClasses[currentPkg.theme];

  // 플랜 버튼 렌더링 헬퍼 함수
  const renderPlanButton = (pkg) => {
    const isActive = activePlan === pkg.id;
    return (
        <div key={pkg.id} className="relative flex flex-col items-center">
            {pkg.popular && (
                <div className="absolute -top-7 z-10">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500 text-white text-[11px] font-bold uppercase tracking-wider shadow-sm ring-2 ring-white">
                        <Sparkles size={12} fill="currentColor" /> MOST POPULAR
                    </div>
                </div>
            )}
            <button
                onClick={() => setActivePlan(pkg.id)}
                className={`relative px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 border-2 flex items-center justify-center gap-3 w-[160px] md:w-[220px] ${
                    isActive 
                    ? tabStyles[pkg.theme].container 
                    : 'border-slate-100 bg-white/80 backdrop-blur-sm text-slate-400 hover:border-slate-300 hover:text-slate-600'
                }`}
            >
                <span className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    isActive ? tabStyles[pkg.theme].dot : 'bg-slate-300'
                }`}></span>
                {pkg.id}
            </button>
        </div>
    );
  };

  return (
    <div className="font-sans antialiased text-slate-900 bg-slate-50 min-h-screen flex flex-col">
      <Navbar />
      <Hero />

      {/* [수정] z-20을 z-30으로 변경하여 Hero 섹션 위로 확실히 올라오게 수정 */}
      <section className="relative -mt-20 pb-24 px-4 z-30" id="campaigns">
        <div className="max-w-7xl mx-auto">
          
          {/* Plan Tabs */}
          <div className="flex flex-wrap justify-center gap-4 items-end mb-12 mt-4">
             {subscriptionPlans.map(renderPlanButton)}
          </div>
    
          {/* Active Plan Content Area */}
          {/* [수정] 카드 자체에도 relative z-30 적용 */}
          <div className="bg-white rounded-[2.5rem] p-8 md:p-12 transition-all duration-500 animate-fade-in-up shadow-xl relative z-30">
            <div className="max-w-6xl mx-auto flex flex-col gap-12">
                
                {/* Header Info */}
                <div className="text-center flex flex-col items-center">
                    <div className="flex items-baseline gap-2 mb-2">
                        <span className={`text-7xl md:text-8xl font-black tracking-tighter ${currentTheme.contentColor}`}>
                            {currentPkg.contentCount}
                        </span>
                        <span className="text-xl md:text-2xl font-bold text-slate-400 uppercase tracking-widest">
                            Contents / mo
                        </span>
                    </div>

                    <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                        {currentPkg.koreanName}
                    </h3>
                    
                    <p className={`${currentTheme.tagline} font-bold text-xl mb-4`}>{currentPkg.tagline}</p>
                    <p className="text-slate-600 leading-relaxed text-lg max-w-3xl mb-8">{currentPkg.description}</p>
                    
                    <div className="flex flex-wrap justify-center gap-4">
                        <div className="inline-flex items-center gap-2 px-5 py-2 bg-slate-50 rounded-full border border-slate-100">
                             {currentPkg.id === "VISIT" ? <MapPin size={16} className="text-slate-500" /> : <Globe size={16} className="text-slate-500" />}
                             <span className="text-slate-500 text-sm font-bold">Target:</span>
                             <span className="text-slate-800 text-sm font-medium">{currentPkg.bestFor}</span>
                        </div>
                    </div>
                </div>

                {/* Content Grid */}
                <div>
                    <div className="flex items-center justify-center gap-3 mb-6">
                        <Video size={20} className={currentTheme.icon} />
                        <h4 className="font-bold text-slate-900 text-lg">플랜 제공 콘텐츠 예시</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {currentPkg.videoIds.map((videoId, idx) => (
                            <div key={idx} className="relative aspect-[9/16] rounded-3xl overflow-hidden bg-black shadow-lg border border-slate-200 group">
                                <iframe
                                    src={`https://www.tiktok.com/embed/v2/${videoId}`}
                                    className="w-full h-full"
                                    title={`TikTok Video ${videoId}`}
                                    allowFullScreen
                                    scrolling="no"
                                    frameBorder="0"
                                    allow="encrypted-media;"
                                    loading="lazy"
                                ></iframe>
                                <div className="absolute inset-0 pointer-events-none border-4 border-transparent group-hover:border-white/20 rounded-3xl transition-all"></div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Features & Price */}
                <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 text-center">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-4 w-full mb-10 max-w-4xl mx-auto">
                        {currentPkg.features.map((feat, i) => (
                            <div key={i} className="flex items-center gap-3 text-left">
                                <div className={`p-1 rounded-full ${currentTheme.checkBg} ${currentTheme.checkIcon} flex-shrink-0`}>
                                    <Check size={14} strokeWidth={3} />
                                </div>
                                <span className="text-sm text-slate-700 font-medium">{feat}</span>
                            </div>
                        ))}
                    </div>

                    <div className="mb-8">
                        <span className="text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight">{currentPkg.price}원</span>
                        <span className="text-xl text-slate-500 font-medium ml-2">
                            {currentPkg.id === 'VISIT' ? '/ 총 30건' : '/ 월'}
                        </span>
                    </div>

                    {/* [수정] Link 태그: z-50 유지, cursor-pointer 명시 */}
                    <Link 
                        to="/checkout"
                        state={{ plan: { id: currentPkg.id } }} 
                        className={`relative z-50 pointer-events-auto w-full max-w-md py-5 rounded-2xl font-bold text-white text-xl shadow-xl hover:shadow-2xl ${currentTheme.shadow} hover:-translate-y-1 transition-all bg-gradient-to-r ${currentPkg.gradient} flex items-center justify-center gap-2 mx-auto cursor-pointer block`}
                    >
                        {currentPkg.name} 구매하기 <ArrowRight size={24} />
                    </Link>
                    
                    <p className="text-sm text-slate-400 mt-4 flex items-center justify-center gap-2">
                        <span>VAT 별도</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                        <span className="flex items-center gap-1 font-medium text-slate-500"><Flag size={12}/> 미국(US) 타겟 기준</span>
                    </p>
                </div>

            </div>
          </div>
        </div>
      </section>

      {/* 2. UNLIMITED Plan (Consulting Linked) */}
      <section className="py-24 bg-[#0F172A] relative overflow-hidden text-white">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px]"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-16">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/20 border border-purple-400/50 text-purple-300 text-sm font-bold uppercase tracking-widest mb-6">
                    <Crown size={16} /> BrandSlam Unlimited
                </div>
                
                <h2 className="text-4xl md:text-6xl font-extrabold mb-8 leading-snug tracking-normal">
                    대량 콘텐츠 운영을 위한 
                    <span className="block mt-2 md:mt-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">
                      맞춤형 무제한 플랜
                    </span>
                </h2>
                
                <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
                    수량 상한선 없이, 브랜드의 목표에 맞춰 유연하게 설계됩니다.<br className="hidden md:block"/>
                    여러 제품이나 국가를 동시에 운영하는 브랜드에 최적화되어 있습니다.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-8">
                    <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10">
                        <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                            <InfinityIcon className="text-purple-400" />
                            실제 제공 범위
                        </h3>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3">
                                <CheckCircle2Icon color="purple" />
                                <div>
                                    <span className="font-bold text-white block">월별 콘텐츠 수량 상한선 없음</span>
                                    <span className="text-sm text-slate-400">필요한 만큼 무제한 공급</span>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <CheckCircle2Icon color="purple" />
                                <div>
                                    <span className="font-bold text-white block">맞춤형 콘텐츠 믹스</span>
                                    <span className="text-sm text-slate-400">Barter / Paid 콘텐츠 비율 유연하게 조정</span>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <CheckCircle2Icon color="purple" />
                                <div>
                                    <span className="font-bold text-white block">전담 매니지먼트</span>
                                    <span className="text-sm text-slate-400">마케팅 캘린더에 맞춘 맞춤 스케줄링</span>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="bg-gradient-to-b from-purple-900/50 to-indigo-900/50 rounded-[2.5rem] p-10 border border-purple-500/30 shadow-2xl relative">
                    <div className="absolute -top-6 -right-6 bg-yellow-400 text-black font-bold px-6 py-2 rounded-full shadow-lg transform rotate-6">
                        Enterprise
                    </div>
                    
                    <h3 className="text-2xl font-bold text-white mb-2">UNLIMITED PLAN</h3>
                    <p className="text-purple-200 mb-8">규모 있는 성장을 위한 맞춤 솔루션</p>
                    
                    <div className="mb-8">
                        <span className="text-5xl font-extrabold text-white tracking-tight">Custom</span>
                        <span className="text-xl text-purple-200 font-medium ml-2">/ 별도 문의</span>
                    </div>

                    <div className="space-y-4 mb-10">
                        {[
                            "월별 콘텐츠 수량 제한 없음",
                            "국가/제품 동시 운영 가능",
                            "콘텐츠 -> 광고 -> 전환 구조 설계",
                            "맞춤형 리포트 및 인사이트 제공",
                            "우선 배차 및 전담 관리",
                        ].map((feat, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="p-1 rounded-full bg-purple-500/30 text-purple-300">
                                    <Check size={14} strokeWidth={3} />
                                </div>
                                <span className="text-white font-medium">{feat}</span>
                            </div>
                        ))}
                    </div>

                    <Link 
                        to="/consulting"
                        onClick={() => window.scrollTo(0, 0)}
                        className="w-full py-5 rounded-2xl font-bold text-black text-xl bg-white hover:bg-purple-50 transition-all hover:scale-[1.02] shadow-lg flex items-center justify-center gap-2"
                    >
                        <MessageCircle size={20} /> 문의하고 견적 받기
                    </Link>
                </div>
            </div>
        </div>
      </section>

      {/* 3. Paid Influencer Tiers (Refactored) */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4 tracking-normal leading-snug">프리미엄 인플루언서 티어 (유상 옵션)</h2>
            <p className="text-slate-500">구독 플랜 외 추가 옵션으로 선택 가능하며 가격은 변동될 수 있습니다.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
             {influencerTiers.map((tier, idx) => (
               <div key={idx} className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 flex flex-col group border border-slate-100 hover:border-transparent">
                 
                 {/* Header / Price Card */}
                 <div className={`p-8 ${tier.colorClass} text-white relative overflow-hidden`}>
                     <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-10 -mt-10 blur-xl"></div>
                     <div className="relative z-10">
                       <div className="text-xs font-bold opacity-80 mb-1 border border-white/30 inline-block px-2 py-0.5 rounded-full">{tier.level}</div>
                       <h3 className="font-bold text-xl mb-3">{tier.name}</h3>
                       <p className="text-sm opacity-90 mb-4 font-medium leading-snug">{tier.desc}</p>
                       
                       <div className="flex items-baseline gap-1">
                           <span className="text-2xl font-extrabold">{tier.price}</span>
                           <span className="text-sm font-bold">원</span>
                           <span className="text-xs opacity-80 font-medium">/ 건</span>
                       </div>
                     </div>
                 </div>
                 
                 <div className="p-6 flex-1 flex flex-col">
                   <div className="flex flex-col gap-3 mb-6 pb-6 border-b border-slate-100">
                       <div className="flex items-center gap-2">
                           <Users size={16} className="text-slate-400"/>
                           <span className="text-sm font-bold text-slate-700">Followers: {tier.followers}</span>
                       </div>
                       <div className="flex items-center gap-2">
                           <TrendingUp size={16} className="text-red-500"/>
                           <span className="text-sm font-bold text-slate-900">GMV: {tier.gmv} <span className="text-xs text-slate-400 font-normal">(30일)</span></span>
                       </div>
                   </div>
                   
                   <ul className="space-y-5 mb-2 flex-1">
                      {tier.features.map((feat, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-600 font-medium leading-relaxed">
                          <div className={`w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 ${tier.dotColor}`}></div>
                          {feat}
                        </li>
                      ))}
                   </ul>
                 </div>
               </div>
             ))}
          </div>

          <div className="mt-16 text-center">
            <div className="inline-flex flex-col md:flex-row items-center gap-6 p-8 bg-slate-50 rounded-3xl border border-slate-200">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-slate-600 shadow-sm">
                    <HelpCircle size={24} />
                </div>
                <div className="text-left">
                    <h4 className="font-bold text-slate-900 mb-1">어떤 플랜이 맞을지 고민되시나요?</h4>
                    <p className="text-sm text-slate-500">브랜드 목표에 맞춰 최적의 플랜을 제안해 드립니다.</p>
                </div>
                <Link 
                    to="/consulting"
                    onClick={() => window.scrollTo(0, 0)}
                    className="px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-indigo-600 transition-colors"
                >
                    전문가 상담 요청
                </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

// Helper Component for Icon
const CheckCircle2Icon = ({ color }) => {
    const colors = {
        blue: "text-blue-500",
        purple: "text-purple-500",
        pink: "text-pink-500",
        emerald: "text-emerald-500"
    };
    return <PlayCircle className={colors[color] || "text-purple-400"} size={16} />;
};