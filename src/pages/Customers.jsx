import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Target, Zap, BarChart3, TrendingUp, PlayCircle, Star, CheckCircle2 } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

// --- Data: Main Success Case Studies ---
const caseStudies = [
  {
    id: 1,
    brand: "Celimax",
    category: "글로벌 K-뷰티 브랜드",
    videoId: "7471724419216346398", 
    challenge: "신제품 런칭 후 글로벌 TikTok 시장에서의 인지도와 매출 증대",
    solution: "타겟 오디언스 분석 기반의 인플루언서 협업 및 챌린지 시딩",
    results: [
      { label: "누적 View (Spark Ads X)", value: "2M+ 달성" },
      { label: "캠페인 기간 내 매출", value: "8.7배 증가" },
      { label: "채널 확장 효과", value: "아마존 매출 2,000% 이상 상승" }
    ],
    theme: "blue",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-100"
  },
  {
    id: 2,
    brand: "SKIN&LAB",
    category: "고기능성 글로벌 스킨케어",
    videoId: "7480532507318930696",
    challenge: "MZ세대 브랜드 인지도 확보 및 온라인 구매 전환율 최적화",
    solution: "자연스러운 사용법 강조 PPL, 소통형 크리에이터 매칭",
    results: [
      { label: "누적 View (Spark Ads X)", value: "5M+ 달성" },
      { label: "구매 전환 성과", value: "전환율 15% 증가" }
    ],
    theme: "purple",
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-100"
  },
  {
    id: 3,
    brand: "P.CALM",
    category: "민감성 피부 케어",
    videoId: "7530013023667309879",
    challenge: "핵심 제품 '바질홀리마스크' 틱톡샵 매출 및 바이럴 증대",
    solution: "제품의 HOOK을 극대화하는 숏폼 크리에이티브 기획",
    results: [
      { label: "틱톡샵 매출 전환", value: "10.5% 달성" },
      { label: "통합 매출 성장", value: "350% 증가" }
    ],
    theme: "emerald",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-100"
  }
];

// --- Data: Additional Viral Reference ---
const viralReferences = [
  { id: 101, videoId: "7334318567422299400", desc: "트렌드 밈을 활용한 자연스러운 제품 노출" },
  { id: 102, videoId: "7466865284381527302", desc: "고관여 유저를 타겟팅한 리뷰형 콘텐츠" },
  { id: 103, videoId: "7456839083566845191", desc: "시각적 임팩트를 강조한 비포/애프터" },
  { id: 104, videoId: "7547278761490664726", desc: "현지 감성에 맞춘 로컬라이징 전략" }
];

// --- Sub-Component: TikTok Embed (Reusable) ---
const TikTokEmbed = ({ videoId, title, className = "" }) => (
  <div className={`relative w-full h-full rounded-2xl overflow-hidden shadow-xl bg-black ${className}`}>
    <iframe
      src={`https://www.tiktok.com/embed/v2/${videoId}`}
      className="w-full h-full absolute inset-0"
      title={title}
      allowFullScreen
      scrolling="no"
      frameBorder="0"
      allow="autoplay; encrypted-media;"
    ></iframe>
  </div>
);

// --- Sub-Component: Helper Icons ---
const SparklesIcon = ({ className }) => (
    <svg className={className || "w-4 h-4"} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" fill="currentColor"/>
    </svg>
);

// --- Sections ---

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
        Proven Success
      </div>
      
      {/* [수정] 줄바꿈 및 타이포그래피 개선 */}
      <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-normal mb-8 leading-snug drop-shadow-sm animate-fade-in-up animation-delay-100">
        데이터로 보는
        <span className="block mt-3 md:mt-5 text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600">
          압도적인 성과 레퍼런스
        </span>
      </h1>
      
      {/* [수정] 반응형 줄바꿈 적용 */}
      <p className="max-w-3xl mx-auto text-lg md:text-xl text-slate-500 mb-10 leading-relaxed animate-fade-in-up animation-delay-200 break-keep">
        BrandSlam은 데이터 기반의 혁신적인 전략과 독보적인 실행력을 바탕으로<br className="hidden md:block" />
        다양한 브랜드들의 TikTok 글로벌 성장을 성공적으로 이끌어왔습니다. 
      </p>

      {/* Metric Cards */}
      <div className="flex flex-wrap justify-center gap-4 animate-fade-in-up animation-delay-300">
          <div className="flex items-center gap-2 px-6 py-3 bg-white rounded-xl border border-slate-100 shadow-lg shadow-slate-200/50">
              <TrendingUp size={18} className="text-green-500" />
              <span className="text-base font-bold text-slate-700">매출 증대</span>
          </div>
          <div className="flex items-center gap-2 px-6 py-3 bg-white rounded-xl border border-slate-100 shadow-lg shadow-slate-200/50">
              <Target size={18} className="text-blue-500" />
              <span className="text-base font-bold text-slate-700">타겟 최적화</span>
          </div>
          <div className="flex items-center gap-2 px-6 py-3 bg-white rounded-xl border border-slate-100 shadow-lg shadow-slate-200/50">
              <Zap size={18} className="text-yellow-500" />
              <span className="text-base font-bold text-slate-700">메시지 검증</span>
          </div>
      </div>
    </div>
  </section>
);

const CaseStudies = () => (
  <section className="relative -mt-10 pb-20 px-4 z-20">
      <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
               <p className="text-xl md:text-2xl font-bold text-slate-900 max-w-3xl mx-auto break-keep leading-relaxed">
                  BrandSlam의 시딩 전략이 만들어낸 성과를 확인하세요.
               </p>
          </div>

            <div className="grid grid-cols-1 gap-20">
                {caseStudies.map((study) => (
                    <div key={study.id} className="bg-white rounded-[2.5rem] overflow-hidden shadow-xl border border-slate-100 flex flex-col lg:flex-row group hover:shadow-2xl transition-all duration-500">
                        
                        {/* Left: Video Section */}
                        <div className="lg:w-5/12 relative bg-slate-900 min-h-[600px] lg:min-h-full flex items-center justify-center p-8">
                            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-800"></div>
                            <div className="relative w-[300px] h-[540px] transform transition-transform duration-500 group-hover:scale-105">
                                <TikTokEmbed videoId={study.videoId} title={`${study.brand} Case`} />
                            </div>
                        </div>

                        {/* Right: Content Section */}
                        <div className="lg:w-7/12 p-8 md:p-12 lg:p-16 flex flex-col justify-center">
                            <div className="mb-8">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 ${study.bg} ${study.color} ${study.border} border`}>
                                    <SparklesIcon className="w-3 h-3" />
                                    {study.category}
                                </span>
                                <h3 className="text-4xl md:text-5xl font-black text-slate-900 mb-2 tracking-tight">
                                    {study.brand}
                                </h3>
                                <div className="h-1 w-20 bg-slate-200 rounded-full mt-4"></div>
                            </div>

                            <div className="space-y-8 mb-10">
                                <div>
                                    <h4 className="flex items-center gap-2 font-bold text-slate-900 mb-2 text-lg">
                                        <div className="p-1.5 rounded-lg bg-red-100 text-red-600"><Target size={20}/></div>
                                        Challenge
                                    </h4>
                                    <p className="text-slate-600 leading-relaxed font-medium pl-10 text-lg border-l-2 border-slate-100">
                                        {study.challenge}
                                    </p>
                                </div>
                                
                                <div>
                                    <h4 className="flex items-center gap-2 font-bold text-slate-900 mb-2 text-lg">
                                        <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-600"><Zap size={20}/></div>
                                        Solution
                                    </h4>
                                    <p className="text-slate-600 leading-relaxed font-medium pl-10 text-lg border-l-2 border-slate-100">
                                        {study.solution}
                                    </p>
                                </div>
                            </div>

                            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200 relative overflow-hidden">
                                <div className={`absolute top-0 left-0 w-1 h-full ${study.theme === 'blue' ? 'bg-blue-500' : study.theme === 'purple' ? 'bg-purple-500' : 'bg-emerald-500'}`}></div>
                                <h4 className="flex items-center gap-2 font-bold text-slate-900 mb-6 text-xl">
                                    <BarChart3 size={24} className={study.color}/>
                                    Key Results
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-4">
                                    {study.results.map((result, idx) => (
                                        <div key={idx}>
                                            <p className="text-sm text-slate-500 mb-1 font-semibold uppercase tracking-wide">{result.label}</p>
                                            <p className={`text-2xl md:text-3xl font-black tracking-tight ${study.color} whitespace-nowrap`}>
                                                {result.value}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
  </section>
);

const MoreSuccessStories = () => (
    <section className="py-24 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-4xl mx-auto mb-16">
                <div className="inline-flex items-center justify-center p-2 bg-slate-100 rounded-full mb-4">
                    <PlayCircle className="w-5 h-5 text-slate-600 mr-2" />
                    <span className="text-sm font-bold text-slate-600 uppercase tracking-wide">Viral Impact</span>
                </div>
                
                {/* [수정] 줄바꿈 및 타이포그래피 개선 */}
                <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-6 leading-snug tracking-normal">
                    더 많은 브랜드가
                    <span className="block mt-2 md:mt-3 text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                        BrandSlam과 함께 성장하고 있습니다
                    </span>
                </h2>
                
                <p className="text-lg text-slate-600">
                    단순한 노출을 넘어, 구매 행동을 유발하는 인플루언서 콘텐츠를 제작합니다.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {viralReferences.map((ref) => (
                    <div key={ref.id} className="flex flex-col group">
                        <div className="relative aspect-[9/16] rounded-2xl overflow-hidden shadow-lg mb-6 bg-slate-100 border border-slate-200">
                             <TikTokEmbed videoId={ref.videoId} title="Viral Reference Video" />
                        </div>
                        <div className="text-center px-2">
                             <div className="flex justify-center mb-2">
                                <div className="flex gap-0.5 text-yellow-400">
                                    <Star size={14} fill="currentColor" />
                                    <Star size={14} fill="currentColor" />
                                    <Star size={14} fill="currentColor" />
                                    <Star size={14} fill="currentColor" />
                                    <Star size={14} fill="currentColor" />
                                </div>
                             </div>
                            <p className="text-sm font-bold text-slate-800 leading-snug">
                                "{ref.desc}"
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </section>
);

// --- CTA Section (Updated with Two Buttons) ---
const CTA = () => (
  <section className="py-32 relative overflow-hidden bg-[#0B1120]">
    <div className="absolute inset-0 bg-gradient-to-tr from-indigo-900/40 via-[#0B1120] to-indigo-950/40"></div>
    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px]"></div>

    <div className="max-w-4xl mx-auto px-4 text-center relative z-10 text-white">
      {/* [수정] 줄바꿈 및 타이포그래피 개선 */}
      <h2 className="text-4xl md:text-6xl font-extrabold mb-8 leading-snug tracking-normal">
        다음 성공 사례는
        <span className="block mt-2 md:mt-4 text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300">
            당신입니다.
        </span>
      </h2>
      
      <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
          망설이는 순간에도 경쟁사의 콘텐츠는 바이럴되고 있습니다. <br className="hidden md:block" />
          지금 바로 BrandSlam의 성과형 시딩을 경험해보세요.
      </p>
      
      {/* Two Buttons: Checkout & Consulting */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        {/* Button 1: Checkout */}
        <Link 
          to="/checkout" 
          onClick={() => window.scrollTo(0, 0)}
          className="w-full sm:w-auto px-10 py-5 bg-white text-indigo-900 rounded-full font-bold text-lg hover:bg-indigo-50 transition-all hover:scale-105 shadow-2xl shadow-indigo-900/50 flex items-center justify-center gap-2"
        >
          바로 시작하기
          
        </Link>

        {/* Button 2: Consulting (Added) */}
        <Link 
          to="/consulting"
          onClick={() => window.scrollTo(0, 0)}
          className="w-full sm:w-auto px-10 py-5 bg-transparent border border-white/20 text-white rounded-full font-bold text-lg hover:bg-white/10 transition-all backdrop-blur-sm flex items-center justify-center gap-2"
        >
          도입 문의하기
        </Link>
      </div>

      <p className="mt-8 text-sm text-slate-500 font-medium">
        <span className="flex items-center justify-center gap-4">
          <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-indigo-400"/> 무료 상담 가능</span>
          <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-indigo-400"/> 맞춤형 제안</span>
        </span>
      </p>
    </div>
  </section>
);

export default function Customers() {
  return (
    <div className="font-sans antialiased text-slate-900 bg-slate-50 min-h-screen flex flex-col">
      <Navbar />
      <Hero />
      <CaseStudies />
      <MoreSuccessStories />
      <CTA />
      <Footer />
    </div>
  );
}