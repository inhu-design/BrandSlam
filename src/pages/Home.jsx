import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowRight, CheckCircle2, Video, Target, Zap, 
  TrendingUp, ShieldCheck, BarChart3, MessageCircle, 
  Calendar, Check, XCircle, ChevronDown, PlayCircle, Star, Globe, X, FileText, Sparkles, CreditCard, Clock,
  UserCheck as UserCheckIcon, ClipboardList, Settings2, Rocket
} from 'lucide-react';
import Navbar from '../components/layout/Navbar'; 
import Footer from '../components/layout/Footer';
import dashboardImg from '../assets/dashboard.png';
import { supabase } from '../lib/supabase';

// --- [Data Assets: 원본 데이터 100% 보존] ---
const LeadCollectionModal = ({ isOpen, onClose }) => {
    const [formData, setFormData] = useState({
      name: '',
      company: '',
      position: '',
      phone: '',
      email: '',
      is_agreed: false
    });
    const [loading, setLoading] = useState(false);
  
    if (!isOpen) return null;
  
    const handleSubmit = async (e) => {
      e.preventDefault();
      if (!formData.is_agreed) {
        alert("개인정보 수집 및 이용에 동의해주세요.");
        return;
      }
  
      setLoading(true);
      try {
        const { error } = await supabase
          .from('reference_leads')
          .insert([formData]);
  
        if (error) throw error;
  
        alert("신청되었습니다! 입력하신 이메일로 레퍼런스북을 보내드립니다.");
        onClose();
      } catch (error) {
        console.error('Error:', error);
        alert("등록 중 오류가 발생했습니다. 다시 시도해주세요.");
      } finally {
        setLoading(false);
      }
    };
  
    return (
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose}></div>
        <div className="bg-[#0f172a] border border-white/10 rounded-[2.5rem] w-full max-w-lg relative z-10 overflow-hidden shadow-2xl">
          <div className="p-8 md:p-10">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-black text-white mb-2">Full Reference Book</h3>
                <p className="text-slate-400 text-sm font-light">정보를 입력하시면 <br/>비공개 레퍼런스 자료집을 이메일로 발송해 드립니다.</p>
              </div>
              <button onClick={onClose} className="text-slate-500 hover:text-white"><X size={24}/></button>
            </div>
  
            <form onSubmit={handleSubmit} className="space-y-4">
              <input 
                required type="text" placeholder="성함" 
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:border-purple-500 outline-none transition-all"
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
              <div className="grid grid-cols-2 gap-4">
                <input 
                  required type="text" placeholder="회사명/브랜드명" 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:border-purple-500 outline-none"
                  onChange={(e) => setFormData({...formData, company: e.target.value})}
                />
                <input 
                  type="text" placeholder="직책(선택)" 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:border-purple-500 outline-none"
                  onChange={(e) => setFormData({...formData, position: e.target.value})}
                />
              </div>
              <input 
                required type="tel" placeholder="연락처 (010-0000-0000)" 
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:border-purple-500 outline-none"
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
              <input 
                required type="email" placeholder="회사 이메일 주소" 
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:border-purple-500 outline-none"
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
              
              <div className="flex items-center gap-3 py-2">
                <input 
                  type="checkbox" id="agree" required
                  className="w-5 h-5 rounded border-white/10 bg-white/5 text-purple-600 focus:ring-purple-500"
                  onChange={(e) => setFormData({...formData, is_agreed: e.target.checked})}
                />
                <label htmlFor="agree" className="text-xs text-slate-500 cursor-pointer">
                  개인정보 수집 및 이용 동의 (자료 발송 및 상담 목적)
                </label>
              </div>
  
              <button 
                type="submit" disabled={loading}
                className="w-full py-5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl font-black text-lg hover:shadow-[0_0_20px_rgba(147,51,234,0.4)] transition-all disabled:opacity-50"
              >
                {loading ? "전송 중..." : "레퍼런스북 받기"}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  };

const caseStudies = [
  {
    id: 1,
    brand: "C사",
    category: "Global K-Beauty",
    videoId: "7471724419216346398", 
    challenge: "공동 런칭 후 매출0인 상황에서 월매출 20억이상의 히트상품으로",
    solution: "현지 감성에 맞춘 챌린지 시딩 및 인플루언서 매니지먼트",
    results: [
      { label: "누적 조회수", value: "2M+" },
      { label: "채널 확장", value: "Amazon 매출 2,000%↑" }
    ],
    theme: "blue",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    gradient: "from-blue-600 to-cyan-500"
  },
  {
    id: 2,
    brand: "S사",
    category: "High-Function Skincare",
    videoId: "7480532507318930696",
    challenge: "MZ세대 타겟 브랜드 인지도 확보",
    solution: "자연스러운 사용법(How-to) 강조 PPL 및 소통형 크리에이터 매칭",
    results: [
      { label: "누적 조회수", value: "5M+" },
      { label: "구매 전환율", value: "+15%" }
    ],
    theme: "purple",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    gradient: "from-purple-600 to-pink-500"
  },
  {
    id: 3,
    brand: "P사",
    category: "Sensitive Care",
    videoId: "7530013023667309879", 
    challenge: "틱톡샵(US) 매출 및 바이럴 증대",
    solution: "틱톡 트렌드(HOOK)를 반영한 숏폼 크리에이티브",
    results: [
      { label: "틱톡샵 전환", value: "10.5%" },
      { label: "통합 매출", value: "+350%" }
    ],
    theme: "emerald",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    gradient: "from-emerald-600 to-teal-500"
  },
  {
    id: 4,
    brand: "D사",
    category: "Middle East Expansion",
    videoId: "7596962214595022088", 
    challenge: "K-뷰티 불모지인 중동(GCC) 시장 진입 장벽",
    solution: "현지 기후/문화를 고려한 프리미엄 브랜딩 및 아랍어권 인플루언서 매칭",
    results: [
      { label: "오가닉 조회수", value: "3M+" }, 
      { label: "시장 성과", value: "초도 물량 완판" }
    ],
    theme: "amber",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    gradient: "from-amber-600 to-orange-500"
  }
];

const viralReferences = [
  { id: 101, videoId: "7334318567422299400", desc: "트렌드 밈 활용" },
  { id: 102, videoId: "7466865284381527302", desc: "미국 타겟 리뷰" },
  { id: 103, videoId: "7456839083566845191", desc: "Before & After" },
  { id: 104, videoId: "7547278761490664726", desc: "로컬라이징 전략" }
];

// --- [Sub-Components: 리뉴얼 테마 반영] ---

const TikTokEmbed = ({ videoId, title, autoplay = false }) => {
  const embedUrl = `https://www.tiktok.com/embed/v2/${videoId}?autoplay=${autoplay ? 1 : 0}&mute=1`;

  return (
    <div className="relative w-full h-full bg-slate-900 border-0 overflow-hidden rounded-2xl ring-1 ring-white/10">
      <iframe
        src={embedUrl}
        className="w-full h-full absolute inset-0 object-cover"
        title={title || "TikTok Video"}
        allowFullScreen
        scrolling="no"
        frameBorder="0"
        allow="autoplay; encrypted-media;"
      ></iframe>
    </div>
  );
};

const ProcessModal = ({ isOpen, onClose, navigate }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose}></div>
      <div className="bg-[#0f172a] border border-white/10 rounded-[2.5rem] w-full max-w-4xl relative z-10 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 p-6 flex justify-between items-center text-white border-b border-white/5">
          <h3 className="text-xl font-bold flex items-center gap-2 uppercase tracking-wider text-cyan-400">
            <ShieldCheck size={20}/> 안심 발주 프로세스 안내
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400">
            <X size={24} />
          </button>
        </div>

        <div className="p-8 md:p-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-white mb-4">바로 결제되지 않습니다</h2>
            <p className="text-slate-400 font-light leading-relaxed">
              슬램 글로벌은 고객님의 니즈를 완벽히 파악한 후 계약을 진행합니다.<br/>
              아래의 <span className="text-white font-medium italic">Smart Management</span> 절차를 확인해 주세요.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12 relative">
            {[
              { icon: ClipboardList, title: "1. 발주 문의", desc: "구매, 진단, 상담을 통해\n최적의 플랜 선택" },
              { icon: CreditCard, title: "2. 플랜 결제", desc: "계좌 이체 후\n프로젝트 즉시 시작" },
              { icon: Settings2, title: "3. 캠페인 세팅", desc: "캠페인 세팅을 통해\n제품, 컨텐츠 가이드 협의" },
              { icon: Rocket, title: "4. 캠페인 착수", desc: "정해진 날짜에 맞춰서\n캠페인 착수 및 운영" }
            ].map((step, idx) => (
              <div key={idx} className="bg-white/5 p-6 rounded-3xl border border-white/10 text-center relative z-10 backdrop-blur-sm group hover:bg-white/10 transition-colors">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-blue-500 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <step.icon size={26} />
                </div>
                <h4 className="font-bold text-white mb-2">{step.title}</h4>
                <p className="text-xs text-slate-500 whitespace-pre-line leading-relaxed">{step.desc}</p>
              </div>
            ))}
            <div className="hidden md:block absolute top-14 left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent -z-0"></div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <button 
              onClick={() => { onClose(); navigate('/consulting'); }}
              className="px-10 py-5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl font-bold text-lg hover:shadow-[0_0_30px_rgba(147,51,234,0.4)] transition-all flex items-center justify-center gap-2"
            >
              네, 이해했습니다. 문의하기 <ArrowRight size={20} />
            </button>
            <button 
              onClick={onClose}
              className="px-10 py-5 bg-white/5 text-slate-300 rounded-2xl font-bold text-lg hover:bg-white/10 transition-all border border-white/5"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- [Sections: 리뉴얼 디자인 반영] ---

const Hero = ({ onOpenLeadModal }) => (
  <section className="relative pt-32 pb-24 md:pt-48 md:pb-40 overflow-hidden bg-[#020617]">
    {/* Fluid Background Shapes */}
    <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-[-15%] left-[-10%] w-[70%] h-[70%] bg-purple-600/20 rounded-full filter blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[60%] h-[60%] bg-blue-600/20 rounded-full filter blur-[120px] animate-pulse delay-700"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 pointer-events-none"></div>
    </div>

    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 text-xs font-black text-cyan-400 mb-10 tracking-[0.2em] uppercase">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
        </span>
        Monthly Content Solution
      </div>
      
      <h1 className="text-5xl md:text-8xl font-black text-white tracking-tighter mb-10 leading-[1.1]">
        미국 시딩은 <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400">브랜드슬램 </span>
        <span className="block mt-4 text-slate-300 text-3xl md:text-5xl font-light">직접 운영하는 글로벌 콘텐츠 시스템</span>
      </h1>
      
      <p className="max-w-3xl mx-auto text-lg md:text-xl text-slate-400 mb-12 leading-relaxed font-light break-keep">
      실무 담당자의 소요 시간을<br className="hidden md:block" />
      캠페인당 <span className="text-white font-medium italic">평균 85% 절감시켜드립니다.</span>
      </p>

      {/* 버튼 그룹: 나란히 배치 */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-6">
        {/* 버튼 1: 무료 진단 (기존 메인 버튼) */}
        <Link 
          to="/consulting" 
          className="group relative w-full sm:w-auto px-10 py-5 bg-white text-slate-900 rounded-full font-black text-lg hover:scale-105 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)] flex items-center justify-center gap-2 overflow-hidden"
        >
          <span className="relative z-10">무료 진단 및 견적 문의</span>
          <ArrowRight size={20} className="relative z-10 group-hover:translate-x-1 transition-transform" />
        </Link>

        {/* 버튼 2: 성공사례 레퍼런스북 (새로 추가된 버튼) */}
        <button 
          onClick={onOpenLeadModal}
          className="group relative w-full sm:w-auto px-10 py-5 bg-white/5 border border-white/20 text-white rounded-full font-bold text-lg hover:bg-white/10 transition-all backdrop-blur-md flex items-center justify-center gap-2 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <Sparkles size={18} className="text-purple-400 group-hover:animate-pulse" />
          <span className="relative z-10">성공사례 레퍼런스북 받기</span>
          <ArrowRight size={20} className="relative z-10 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  </section>
);

const WhySection = () => (
  <section className="py-32 bg-[#020617] border-y border-white/5 relative overflow-hidden">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
      <div className="text-center mb-24">
        <span className="text-purple-400 font-black tracking-[0.3em] uppercase text-sm">Step 01. The Mechanism</span>
        <h2 className="text-4xl md:text-6xl font-black text-white mt-6 mb-8 tracking-tight">
            왜 미국 시딩은 <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">SLAM GLOBAL</span>과 해야 할까요?
        </h2>
        <p className="text-xl text-slate-400 max-w-3xl mx-auto font-light leading-relaxed">
            경험 많은 팀과 함께 하세요.<br className="hidden md:block"/>
            슬램 글로벌은 <span className="text-white font-medium underline underline-offset-8 decoration-purple-500">미국에서 누적 5억뷰와 놀라운 매출 성과</span>를 달성했습니다.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-stretch">
        <div className="bg-white/5 backdrop-blur-md p-12 rounded-[3rem] border border-white/5 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700">
            <h3 className="text-2xl font-bold text-slate-400 mb-10 flex items-center gap-3 italic">
                <XCircle size={32} /> 일반 대행사 (Agency)
            </h3>
            <ul className="space-y-8">
                {[
                  { t: "단순 서칭 & 배송", d: "데이터베이스에서 무작위로 연락하고 물건만 보냄" },
                  { t: "낮은 회수율 (Ghosting)", d: "크리에이터 잠적 시 대처 불가능 (평균 50~60%)" },
                  { t: "퀄리티 컨트롤 부재", d: "가이드를 줘도 제멋대로 찍어서 올림" }
                ].map((item, i) => (
                  <li key={i} className="flex gap-5">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500/50 mt-2.5"></div>
                    <div>
                        <strong className="block text-xl text-slate-300 mb-1">{item.t}</strong>
                        <p className="text-slate-500 text-sm font-light">{item.d}</p>
                    </div>
                  </li>
                ))}
            </ul>
        </div>

        <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-[3rem] blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative bg-[#0f172a] p-12 rounded-[3rem] border border-white/10 h-full shadow-2xl">
                <div className="absolute top-8 right-12 bg-cyan-500 text-slate-900 font-black px-5 py-1.5 rounded-full text-xs tracking-tighter shadow-lg">
                    THE SOLUTION
                </div>
                <h3 className="text-2xl font-bold text-white mb-10 flex items-center gap-3">
                    <CheckCircle2 className="text-cyan-400" size={32} /> 슬램 글로벌 (Management)
                </h3>
                <ul className="space-y-8">
                    {[
                      { t: "직접 발굴 & 육성 (Discover)", d: "현존하는 모든 플랫폼에서 우수 KOC를 매일 컨택하고 교육함" },
                      { t: "성장을 돕는 파트너십", d: "단순 리워드를 넘어 컨텐츠 평가 및 성장 가이드 제공" },
                      { t: "회수율 100% AS 시스템 적용", d: "목표 미달성 시 2차 캠페인 자동 실행 (책임 완수)" }
                    ].map((item, i) => (
                      <li key={i} className="flex gap-5">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2.5 shadow-[0_0_8px_rgba(34,211,238,0.8)]"></div>
                        <div>
                            <strong className="block text-xl text-white mb-1">{item.t}</strong>
                            <p className="text-slate-400 text-sm font-light leading-relaxed">{item.d}</p>
                        </div>
                      </li>
                    ))}
                </ul>
            </div>
        </div>
      </div>
    </div>
  </section>
);

// 1. LogoRow 컴포넌트를 BrandLogosSection 바깥으로 완전히 분리합니다.
const LogoRow = ({ items, direction = "normal", speed = "30s" }) => (
  <div className="relative flex overflow-hidden group">
    <div 
      className={`flex whitespace-nowrap py-4 items-center ${direction === "reverse" ? "animate-infinite-scroll-reverse" : "animate-infinite-scroll"}`}
      style={{ animationDuration: speed }}
    >
      {[...items, ...items].map((brand, idx) => (
        <div key={idx} className="mx-8 md:mx-14 w-32 md:w-40 flex items-center justify-center h-20 cursor-pointer">
          <img 
            src={`/logos/${brand}.png`} 
            alt={`${brand} logo`} 
            className="max-w-full max-h-full object-contain grayscale invert mix-blend-screen opacity-50 hover:opacity-100 transition-opacity duration-300"
            onError={(e) => {
              e.target.style.display = 'none'; 
              e.target.parentElement.innerText = brand;
              e.target.parentElement.className = 'text-slate-500 font-bold text-xl flex items-center justify-center h-full w-full';
            }}
          />
        </div>
      ))}
    </div>
  </div>
);


// 2. 메인 컴포넌트
const BrandLogosSection = () => {
  const brands = [
    "23yearsold", "isntree", "anua", "celimax", 
    "cleardea", "dalba", "deoproce", "easyderm", 
    "itsskin", "kocostar", "pcalm", 
    "skinnlab", "baerry", "pyunkangyul"
  ];

  const shuffleArray = (array) => [...array].sort(() => Math.random() - 0.5);

  const row1 = shuffleArray(brands);
  const row2 = shuffleArray(brands);
  const row3 = shuffleArray(brands);

  return (
    <section className="py-24 bg-[#020617] overflow-hidden border-b border-white/5 relative">
      <div className="max-w-7xl mx-auto px-4 mb-16 text-center">
        <span className="text-cyan-400 font-black tracking-[0.2em] uppercase text-xs mb-3 block">
          Trusted Partners
        </span>
        <p className="text-xl md:text-2xl text-white font-bold tracking-tight">
          <span className="text-slate-500">Global K-Beauty</span> 브랜드들의 선택
        </p>
      </div>
      
      <div className="relative">
        <div className="absolute inset-y-0 left-0 w-24 md:w-60 bg-gradient-to-r from-[#020617] to-transparent z-10 pointer-events-none"></div>
        <div className="absolute inset-y-0 right-0 w-24 md:w-60 bg-gradient-to-l from-[#020617] to-transparent z-10 pointer-events-none"></div>

        <div className="flex flex-col gap-4">
          <LogoRow items={row1} direction="normal" speed="40s" />
          <LogoRow items={row2} direction="reverse" speed="35s" />
          <LogoRow items={row3} direction="normal" speed="45s" />
        </div>
      </div>
    </section>
  );
};
const SuccessStoriesSection = () => (
    <section id="cases" className="py-32 bg-[#020617]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-24">
                <span className="text-cyan-400 font-black tracking-[0.3em] uppercase text-sm">Step 02. The Proof</span>
                <h2 className="text-4xl md:text-7xl font-black text-white mt-6 mb-8 tracking-tighter leading-none">
                숫자로 증명하는
                    <span className="block mt-4 md:mt-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400">
                        압도적인 성공 사례
                    </span>
                </h2>
            </div>

            <div className="flex flex-col gap-32">
                {caseStudies.map((study) => (
                    <div key={study.id} className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24 group">
                        <div className="lg:w-5/12 relative">
                            <div className={`absolute -inset-10 bg-gradient-to-r ${study.gradient} opacity-20 blur-[100px] group-hover:opacity-40 transition-opacity`}></div>
                            <div className="relative w-[300px] md:w-[350px] aspect-[9/16] mx-auto transition-transform duration-700 group-hover:scale-[1.02] shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                                <TikTokEmbed videoId={study.videoId} title={study.brand} />
                                <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/20 pointer-events-none"></div>
                            </div>
                        </div>

                        <div className="lg:w-7/12">
                            <div className="mb-10">
                                <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-6 ${study.bg} ${study.color} border border-white/5 backdrop-blur-md`}>
                                    <Sparkles className="w-3.5 h-3.5" /> {study.category}
                                </span>
                                <h3 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tighter leading-none">{study.brand}</h3>
                            </div>

                            <div className="space-y-10 mb-12">
                                <div className="pl-8 border-l-2 border-white/10 group-hover:border-purple-500/50 transition-colors">
                                    <h4 className="text-slate-500 font-black text-sm uppercase tracking-widest mb-2">Challenge</h4>
                                    <p className="text-xl text-slate-300 font-light leading-relaxed italic">"{study.challenge}"</p>
                                </div>
                                <div className={`pl-8 border-l-2 border-cyan-500/30`}>
                                    <h4 className="text-cyan-400 font-black text-sm uppercase tracking-widest mb-2">Solution</h4>
                                    <p className="text-xl text-white font-medium leading-relaxed">{study.solution}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 bg-white/5 rounded-[2.5rem] border border-white/10 backdrop-blur-xl">
                                {study.results.map((res, i) => (
                                    <div key={i} className="flex flex-col gap-1">
                                        <p className="text-xs text-slate-500 font-black uppercase tracking-widest">{res.label}</p>
                                        <p className={`text-4xl font-black bg-gradient-to-r ${study.gradient} bg-clip-text text-transparent`}>{res.value}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </section>
);

const ViralGridSection = () => {
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);

  return (
    <section className="py-32 bg-[#020617] relative overflow-hidden">
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-purple-600/10 blur-[120px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-20">
          <div className="inline-flex items-center justify-center px-4 py-2 bg-white/5 rounded-full mb-6 border border-white/10 text-cyan-400">
            <PlayCircle size={18} className="mr-2" />
            <span className="text-xs font-black uppercase tracking-[0.2em]">Live Feed</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">바이럴 레퍼런스</h2>
          <p className="text-slate-500 mt-6 font-light">단순 노출을 넘어 구매 행동을 유발하는 컨텐츠의 정석</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-24">
          {viralReferences.map((ref) => (
            <div key={ref.id} className="group">
              <div className="relative aspect-[9/16] rounded-2xl overflow-hidden shadow-2xl mb-6 bg-slate-900 ring-1 ring-white/10 group-hover:ring-purple-500/50 transition-all duration-500">
                <TikTokEmbed videoId={ref.videoId} />
              </div>
              <div className="text-center px-2">
                <p className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">{ref.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center justify-center gap-8">
          <div className="text-center space-y-2">
            <p className="text-cyan-400 text-sm font-black tracking-[0.2em] uppercase">Private Access</p>
            <p className="text-slate-400 text-sm font-light">지금까지 성공시킨 200+ 브랜드의 전략이 담겨있습니다.</p>
          </div>

          <button 
            onClick={() => setIsLeadModalOpen(true)}
            className="group relative px-10 py-6 md:px-16 md:py-8 bg-slate-950 rounded-[2rem] overflow-hidden transition-all duration-500 hover:scale-[1.03] active:scale-[0.98]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 opacity-80 group-hover:opacity-100 transition-opacity"></div>
            <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none"></div>
            <div className="absolute inset-[1px] bg-slate-950/40 rounded-[1.95rem] backdrop-blur-sm border border-white/10"></div>

            <div className="relative z-10 flex items-center gap-6 text-white">
              <div className="bg-white/10 p-3 rounded-2xl group-hover:bg-white/20 transition-colors">
                <Sparkles size={28} className="text-yellow-300 animate-pulse" />
              </div>
              
              <div className="flex flex-col items-start text-left">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-300 mb-1">Download Now</span>
                <span className="text-xl md:text-2xl font-black tracking-tight leading-none">
                  더 많은 성공사례가 궁금하다면? <span className="text-white/60 font-light text-lg ml-1">(PDF)</span>
                </span>
              </div>

              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-white/10 group-hover:translate-x-2 group-hover:bg-cyan-500 transition-all duration-300">
                <ArrowRight size={24} />
              </div>
            </div>

            <div className="absolute -inset-2 bg-gradient-to-r from-purple-600 to-cyan-500 rounded-[2.5rem] blur-xl opacity-20 group-hover:opacity-40 transition-opacity pointer-events-none"></div>
          </button>

          <div className="flex items-center gap-4 text-[11px] text-slate-500 font-medium tracking-wider">
            <span className="flex items-center gap-1.5"><Check size={12} className="text-cyan-500"/> 신청시 별도 메일로 발송</span>
            <span className="w-1 h-1 bg-slate-800 rounded-full"></span>
            <span className="flex items-center gap-1.5"><Check size={12} className="text-cyan-500"/> 미공개 성과 데이터 포함</span>
          </div>
        </div>
      </div>

      <LeadCollectionModal 
        isOpen={isLeadModalOpen} 
        onClose={() => setIsLeadModalOpen(false)} 
      />
    </section>
  );
};

const GuaranteeSection = () => (
  <section className="py-40 bg-[#020617] relative overflow-hidden border-y border-white/5">
     <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-purple-600/10 to-blue-600/10 rounded-full blur-[160px] pointer-events-none"></div>

     <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
        <span className="text-emerald-400 font-black tracking-[0.3em] uppercase text-sm mb-8 block">Step 03. The Promise</span>
        <h2 className="text-5xl md:text-8xl font-black text-white mb-10 tracking-tighter leading-none">
        실패란 없습니다.
            <span className="block mt-4 md:mt-6 text-transparent text-6xl bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">
            155% 케어형 매니지먼트 서비스
            </span>
        </h2>
        
        <p className="text-xl md:text-2xl text-slate-400 mb-16 font-light leading-relaxed max-w-3xl mx-auto">
        배송 전 30% 교체 보장,<br/>
            <span className="text-white font-medium underline underline-offset-4 decoration-emerald-500">배송 후 미달 시 25% 추가 제공</span>을 보장합니다.
        </p>

        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-10 md:p-12 rounded-[3rem] max-w-3xl mx-auto mb-16 text-left relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/5 blur-3xl rounded-full group-hover:bg-emerald-500/10 transition-colors"></div>
            <div className="flex items-start gap-6 relative z-10">
                <div className="p-4 bg-emerald-500/10 rounded-2xl text-emerald-400 shrink-0 shadow-lg">
                    <Star size={32} fill="currentColor" />
                </div>
                <div>
                    <h4 className="font-black text-2xl text-white mb-4">책임 보장제 상세 안내</h4>
                    <p className="text-slate-400 text-base font-light leading-relaxed">
    우리는 캠페인 목표 수량 달성을 최우선으로 합니다.
    1차 진행 시 배송 전 최대, <span className="font-bold text-emerald-500 text-lg">30% 추가 납품</span> 을 제공하며, 
    배송 후 목표 수량 미달 시 <span className="font-bold text-cyan-500 text-lg">최대 25% 추가 케어 보충</span> 이 가능합니다. 
    브랜드의 성공이 곧 우리의 성과이기 때문입니다. 

</p>
                </div>
            </div>
        </div>

        <div className="flex justify-center items-end gap-12 md:gap-20">
            <div className="text-center">
                <p className="text-slate-600 text-xs font-black uppercase tracking-widest mb-3">Industry Avg</p>
                <p className="text-5xl font-black text-slate-700 line-through tracking-tighter">70%</p>
            </div>
            <div className="w-[1px] bg-white/10 h-20 mb-2"></div>
            <div className="text-center">
                <p className="text-emerald-400 text-xs font-black uppercase tracking-widest mb-3 animate-pulse">SLAM GLOBAL</p>
                <p className="text-7xl md:text-8xl font-black text-white tracking-tighter drop-shadow-[0_0_20px_rgba(52,211,153,0.3)]">100%</p>
            </div>
        </div>
     </div>
  </section>
);

const ProcessSection = () => (
    <section id="process" className="py-32 bg-[#020617] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-24">
                <span className="text-purple-400 font-black tracking-[0.3em] uppercase text-sm">Step 04. Clear Timeline</span>
                <h2 className="text-4xl md:text-6xl font-black text-white mt-6 mb-8 tracking-tight">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">"콘텐츠 언제 올라와?"</span>
                    <span className="block mt-2 md:mt-4">
                        모든 과정을, 미리 다 알려드립니다.
                    </span>
                </h2>
                <p className="text-xl text-slate-300 leading-relaxed max-w-3xl mx-auto">
                    계약부터 성과 확인까지, 더 이상 복잡한 메일은 필요 없습니다.<br/>
                    슬램 글로벌만의 <span className="text-white font-semibold">One-Stop Management System</span>으로<br className="hidden sm:inline"/>
                    <span className="text-white font-semibold">대시보드에서 투명하게</span> 확인하세요.
                </p>
            </div>

            {/* Overall timeline summary */}
            <div className="flex justify-center mb-16">
                <div className="inline-flex flex-wrap justify-center items-center gap-x-4 gap-y-2 bg-white/[0.06] border border-white/15 rounded-2xl px-10 py-5 backdrop-blur-sm">
                    <Clock size={20} className="text-purple-400 flex-shrink-0" />
                    <span className="text-white text-base font-medium">
                        캠페인 시작 → 발송 2주 전후 <span className="text-purple-300 font-bold">컨텐츠 업로드 시작</span>
                    </span>
                    <span className="text-white/30 hidden sm:inline text-lg"></span>
                </div>
            </div>

            {/* 5-step vertical timeline */}
            <div className="max-w-3xl mx-auto mb-32 relative">
                <div className="absolute left-[31px] top-8 bottom-8 w-px bg-gradient-to-b from-purple-500/50 via-blue-500/50 to-emerald-500/50 hidden md:block"></div>
                <div className="absolute left-[23px] top-6 bottom-6 w-px bg-gradient-to-b from-purple-500/50 via-blue-500/50 to-emerald-500/50 md:hidden"></div>

                {[
                    {
                        icon: Sparkles,
                        title: "캠페인 시작",
                        desc: "바로 구매 / 플랜 추천 / 화상 상담",
                        detail: "캠페인 목표와 예산에 맞는 최적의 플랜을 선택하고 바로 시작하세요.",
                        gradient: "from-purple-500 to-purple-600"
                    },
                    {
                        icon: Target,
                        title: "캠페인 세팅",
                        desc: "제품, 컨텐츠 가이드라인 협의",
                        detail: "브랜드 톤앤매너에 맞는 콘텐츠 방향성을 함께 설정합니다.",
                        gradient: "from-purple-500 to-blue-500"
                    },
                    {
                        icon: UserCheckIcon,
                        title: "인플루언서 선정 및 제품 발송",
                        desc: "캠페인에 최적화된 크리에이터를 매칭하고 제품을 발송합니다.",
                        duration: "",
                        gradient: "from-blue-500 to-blue-600"
                    },
                    {
                        icon: Video,
                        title: "콘텐츠 업로드 시작",
                        desc: "크리에이터가 제품을 수령하고 리뷰 콘텐츠를 제작 및 업로드합니다.",
                        duration: "제품 발송 후 약 2주 후부터 시작",
                        gradient: "from-blue-500 to-cyan-500"
                    },
                    {
                        icon: TrendingUp,
                        title: "성과 관리 및 인게이지먼트 분석",
                        desc: "조회수, 좋아요, 댓글 등 콘텐츠 성과를 실시간으로 모니터링합니다.",
                        duration: "",
                        gradient: "from-cyan-500 to-emerald-500"
                    }
                ].map((step, idx) => (
                    <div key={idx} className="relative flex items-start gap-5 md:gap-8 mb-8 last:mb-0 group">
                        {/* Step number circle */}
                        <div className={`relative z-10 flex-shrink-0 w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-br ${step.gradient} flex items-center justify-center shadow-lg shadow-purple-500/20 ring-4 ring-[#020617]`}>
                            <span className="text-white font-black text-base md:text-xl">{idx + 1}</span>
                        </div>

                        {/* Content card */}
                        <div className="flex-1 bg-white/[0.05] hover:bg-white/[0.09] border border-white/10 hover:border-white/20 rounded-2xl p-6 md:p-8 transition-all duration-500 group-hover:-translate-y-1">
                            <div className="flex flex-wrap items-center gap-3 mb-4">
                                <step.icon size={22} className="text-purple-400" />
                                <h3 className="font-bold text-xl md:text-2xl text-white tracking-tight">{step.title}</h3>
                                {step.duration && (
                                    <span className="ml-auto bg-emerald-500/15 text-emerald-400 text-sm font-bold px-4 py-2 rounded-full border border-emerald-500/30 flex items-center gap-2 whitespace-nowrap">
                                        <Clock size={14} />
                                        {step.duration}
                                    </span>
                                )}
                            </div>
                            <p className="text-slate-200 text-base leading-relaxed mb-1">{step.desc}</p>
                            {step.detail && (
                                <p className="text-slate-400 text-sm leading-relaxed">{step.detail}</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex flex-col lg:flex-row items-center gap-20">
                <div className="lg:w-1/2">
                    <h3 className="text-3xl md:text-5xl font-black text-white mb-8 tracking-tight leading-tight">
                    실무자의 시간을 아껴주는
                        <span className="block mt-3 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 italic">
                            Smart Management.
                        </span>
                    </h3>
                    <div className="space-y-6">
                        <div className="flex items-start gap-6 p-6 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors group">
                            <div className="bg-purple-500/20 p-4 rounded-2xl text-purple-400 group-hover:scale-110 transition-transform"><FileText size={24}/></div>
                            <div>
                                <h4 className="font-bold text-xl text-white mb-2">전자 계약 & 송장 관리</h4>
                                <p className="text-slate-400 text-sm font-light leading-relaxed">번거로운 서류 작업 없이, 마이페이지에서 계약서 날인과 송장 확인을 한 번에 처리하세요.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-6 p-6 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors group">
                            <div className="bg-blue-500/20 p-4 rounded-2xl text-blue-400 group-hover:scale-110 transition-transform"><BarChart3 size={24}/></div>
                            <div>
                                <h4 className="font-bold text-xl text-white mb-2">실시간 성과 트래킹</h4>
                                <p className="text-slate-400 text-sm font-light leading-relaxed">제품 배송 상태와 크리에이터가 업로드한 컨텐츠를 24시간 실시간으로 모니터링 할 수 있습니다.</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="lg:w-1/2 relative group">
                    <div className="absolute -inset-4 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-[3rem] blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <img 
                        src={dashboardImg} 
                        alt="slam-global Dashboard" 
                        className="w-full rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10 relative z-10 transition-transform duration-700 group-hover:scale-[1.02]"
                    />
                </div>
            </div>
        </div>
    </section>
);

const PricingSection = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  const mainPlans = [
    { name: "Starter", price: "590,000", count: "10", recommend: "첫 시딩이거나 실패 확률을 줄이고 싶은 브랜드", features: ["캠페인 운영 대행", "콘텐츠 업로드 트래킹", "기본 리포트 서비스 제공"] },
    { name: "Growth", price: "990,000", count: "20", recommend: "타겟 고객이 명확한 브랜드", features: ["캠페인 운영 대행", "콘텐츠 업로드 트래킹", "성과 리포트 (조회수, 반응)", "VOC 요약 서비스 제공"], isBest: true },
    { name: "Scale50", price: "2,390,000", count: "50", recommend: "전환 및 매출 확장을 고려하는 브랜드", features: ["캠페인 운영 대행", "콘텐츠 업로드 트래킹", "성과 리포트 & VOC 분석", "원본 영상 1개 제공"] }
  ];

  const visitPlan = {
      name: "VISIT CONTENT",
      subTitle: "오프라인 매출 펌핑 시딩 상품",
      price: "300,000",
      unit: "/ 1인",
      desc: "입점 이후, 매장 트래픽과 회전율을 끌어올리기 위한 전용 상품",
      target: ["올리브영/Sephora/CVS 등 입점 브랜드", "매장 회전율이 고민인 브랜드"],
      features: [
          "방문형 콘텐츠 (자택 사용기 + 매장 방문)",
          "얼굴 노출 콘텐츠 포함 (신뢰도 상승)",
          "구매 매장 정보 노출 (방문 유도)",
          "TikTok / Instagram 업로드 최적화",
          "최소 1명부터 원하는 수량만큼 진행 가능"
      ]
  };

  const addons = [
    { icon: Target, title: "Top 50 인플루언서 큐레이션", price: "100,000원 / 월", desc: "어떤 크리에이터를 써야 할 지 모르는 브랜드", details: "캠페인 목적에 맞는 인플루언서 50명 추천" },
    { icon: UserCheckIcon, title: "타겟 오디언스 큐레이션 (50)", price: "300,000원 / 월", desc: "타겟 고객이 명확한 브랜드", details: "반려동물 등 타겟 인플루언서 리스트 제공" },
    { icon: ShieldCheck, title: "Creator Contact Pack", price: "별도 문의", desc: "직접 커뮤니케이션을 병행하고 싶은 브랜드", details: "사전 동의 크리에이터 정보 및 배송 중개" },
    { icon: TrendingUp, title: "Spark Ads 신청 대행", price: "광고비 + 15%", desc: "전환 및 매출 확장을 고려하는 브랜드", details: "성과 우수 콘텐츠 광고 전환 및 세팅 대행" }
  ];

  return (
    <section id="pricing" className="py-32 bg-[#020617] relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10"></div>
      
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="text-center mb-24">
            <span className="text-purple-400 font-black tracking-[0.3em] uppercase text-sm">Step 05. The Offer</span>
            <h2 className="text-4xl md:text-6xl font-black text-white mt-6 mb-8 tracking-tight">성장을 위한 맞춤형 플랜</h2>
            <p className="text-slate-500 max-w-2xl mx-auto font-light leading-relaxed">플랫폼 기반의 투명한 운영으로 <span className="text-white font-medium italic underline underline-offset-4 decoration-purple-500">콘텐츠 회수율 100%</span>까지 책임집니다.</p>
            <p className="text-slate-600 text-sm mt-3">※ 아래 모든 플랜은 부가세(VAT 10%)가 별도로 청구됩니다.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            {mainPlans.map((plan, idx) => (
                <div key={idx} className={`relative bg-[#0f172a] text-white rounded-[3rem] p-10 border transition-all duration-700 hover:-translate-y-4 ${plan.isBest ? 'border-purple-500 shadow-[0_0_50px_rgba(168,85,247,0.2)] md:scale-105 z-10' : 'border-white/10 shadow-2xl'}`}>
                    {plan.isBest && (
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-1.5 rounded-full text-xs font-black tracking-widest shadow-xl">
                            MOST POPULAR
                        </div>
                    )}
                    <div className="mb-10">
                        <h3 className="text-2xl font-black text-white mb-4 uppercase tracking-tighter">{plan.name}</h3>
                        <div className="flex items-baseline gap-1">
                            <span className="text-5xl font-black text-white tracking-tighter">{plan.price}</span>
                            <span className="text-slate-500 font-bold text-lg">원</span>
                        </div>
                        <div className="mt-4 inline-block px-4 py-1.5 bg-purple-500/10 text-purple-400 rounded-xl text-sm font-black tracking-tighter border border-purple-500/20">
                            콘텐츠 {plan.count}개 보장
                        </div>
                    </div>

                    <p className="text-sm text-slate-400 font-light mb-10 leading-relaxed bg-white/5 p-6 rounded-3xl border border-white/5 italic">
                        💡 {plan.recommend}
                    </p>

                    <ul className="space-y-5 mb-12">
                        {plan.features.map((feat, i) => (
                            <li key={i} className="flex items-start gap-4 text-sm font-medium text-slate-300">
                                <CheckCircle2 size={18} className="text-cyan-400 shrink-0 mt-0.5" />
                                {feat}
                            </li>
                        ))}
                    </ul>

                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className={`w-full py-5 rounded-[2rem] font-black text-lg transition-all flex items-center justify-center gap-2 ${plan.isBest ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-[0_0_30px_rgba(147,51,234,0.5)]' : 'bg-white text-slate-900 hover:bg-slate-100'}`}
                    >
                        발주 문의하기 <ArrowRight size={22}/>
                    </button>
                </div>
            ))}
        </div>

        <div className="mb-32">
          <div className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 rounded-[3rem] p-1 md:p-1">
              <div className="bg-[#0f172a] rounded-[2.8rem] p-8 md:p-16 border border-white/10 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/20 blur-[100px] rounded-full pointer-events-none"></div>
                  
                  <div className="flex flex-col lg:flex-row gap-16 items-center relative z-10">
                      <div className="lg:w-1/2">
                          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/20 text-purple-300 text-xs font-black uppercase tracking-widest mb-6 border border-purple-500/30">
                              <Sparkles size={14} className="animate-pulse"/> OFFLINE SPECIAL
                          </div>
                          <h3 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight leading-tight">
                              {visitPlan.name}
                          </h3>
                          <p className="text-xl text-purple-200 font-bold mb-8">
                              {visitPlan.subTitle}
                          </p>
                          <p className="text-slate-400 text-lg font-light leading-relaxed mb-10 border-l-2 border-purple-500/50 pl-6">
                              "{visitPlan.desc}"
                          </p>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
                              {visitPlan.features.map((feature, idx) => (
                                  <div key={idx} className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/5">
                                      <div className="p-2 bg-purple-500/20 rounded-full text-purple-400">
                                          {idx === 0 ? <Calendar size={18}/> : idx === 1 ? <UserCheckIcon size={18}/> : idx === 2 ? <Target size={18}/> : <Video size={18}/>}
                                      </div>
                                      <span className="text-sm font-medium text-slate-200">{feature}</span>
                                  </div>
                              ))}
                          </div>
                      </div>

                      <div className="lg:w-1/2 w-full">
                          <div className="bg-white/5 rounded-[2.5rem] p-10 border border-white/10 text-center relative overflow-hidden group">
                              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
                              
                              <p className="text-slate-500 text-xs font-black uppercase tracking-widest mb-4 relative z-10">Per Creator Price</p>
                              <div className="flex items-baseline justify-center gap-2 mb-2 relative z-10">
                                  <span className="text-6xl md:text-7xl font-black text-white tracking-tighter">{visitPlan.price}</span>
                                  <div className="flex flex-col items-start">
                                      <span className="text-2xl text-slate-500 font-bold">원</span>
                                      <span className="text-sm text-slate-500 font-bold">{visitPlan.unit}</span>
                                  </div>
                              </div>
                              <p className="text-purple-400 text-sm font-bold mb-10 relative z-10">
                                  (최소 수량 제한 없음 / 1명부터 진행 가능)
                              </p>

                              <div className="text-left bg-[#020617] p-6 rounded-3xl border border-white/10 mb-8 relative z-10">
                                  <p className="text-xs text-slate-500 font-bold uppercase mb-4">Recommended For</p>
                                  <ul className="space-y-3">
                                      {visitPlan.target.map((t, i) => (
                                          <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                                              <CheckCircle2 size={16} className="text-purple-500 shrink-0 mt-0.5" />
                                              {t}
                                          </li>
                                      ))}
                                  </ul>
                              </div>

                              <button 
                                  onClick={() => setIsModalOpen(true)}
                                  className="relative z-20 w-full py-5 bg-white text-slate-900 rounded-[2rem] font-black text-lg hover:scale-[1.02] transition-transform shadow-xl cursor-pointer"
                              >
                                  Visit 플랜 문의하기
                              </button>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-3xl rounded-[4rem] p-10 md:p-20 border border-white/10 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-10 mb-16">
                <div>
                    <h3 className="text-4xl font-black text-white flex items-center gap-4 tracking-tight">
                        <Zap className="text-yellow-400 fill-yellow-400" size={36} /> 부가 서비스 (Add-on)
                    </h3>
                    <p className="text-slate-400 mt-4 font-light text-lg">필요한 기능만 선택하여 캠페인 효율을 극대화하세요.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {addons.map((addon, idx) => (
                    <div key={idx} className="bg-[#020617]/50 p-8 rounded-[2.5rem] border border-white/5 hover:border-purple-500/30 transition-all duration-500 group">
                        <div className="w-14 h-14 bg-white/5 text-purple-400 rounded-2xl flex items-center justify-center mb-8 border border-white/5 group-hover:scale-110 transition-transform">
                            <addon.icon size={28} />
                        </div>
                        <h4 className="text-xl font-bold text-white mb-2 leading-tight tracking-tight">{addon.title}</h4>
                        <p className="text-cyan-400 font-black text-sm mb-6 uppercase tracking-widest">{addon.price}</p>
                        <div className="space-y-4">
                            <p className="text-xs text-slate-300 font-light leading-relaxed">• {addon.details}</p>
                            <p className="text-[11px] text-slate-600 font-medium leading-relaxed italic border-t border-white/5 pt-4">📌 {addon.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        <p className="text-center text-xs text-slate-600 mt-16 font-medium tracking-widest">
            * 본 견적에는 해외 배송 및 물류 비용이 포함되어 있지 않으며, 물류 비용은 별도 협의 또는 브랜드 부담으로 진행됩니다. <br /> 
        </p>
      </div>

      <ProcessModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        navigate={navigate}
      />
    </section>
  );
};

const FooterCTA = () => (
    <section className="py-40 bg-[#020617] text-center relative border-t border-white/5">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-purple-900/10 pointer-events-none"></div>
        <div className="max-w-5xl mx-auto px-4 relative z-10">
            <h2 className="text-5xl md:text-8xl font-black text-white mb-12 tracking-tighter leading-none">
                준비되셨나요?
                <span className="block mt-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400">
                    성장을 시작할 시간입니다.
                </span>
            </h2>
            <div className="flex justify-center">
                 <Link 
                    to="/consulting"
                    className="group px-16 py-7 bg-white text-slate-900 rounded-full font-black text-2xl hover:scale-105 transition-all shadow-[0_0_50px_rgba(255,255,255,0.2)] flex items-center gap-4"
                >
                    지금 바로 문의하기 <ArrowRight size={28} className="group-hover:translate-x-2 transition-transform" />
                </Link>
            </div>
        </div>
    </section>
);

export default function Home() {
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);

  return (
    <div className="font-sans antialiased text-white bg-[#020617] selection:bg-cyan-500/30 selection:text-white relative">
      <Navbar /> 
      <Hero onOpenLeadModal={() => setIsLeadModalOpen(true)} />
      <WhySection />
      
      {/* 3줄로 수정된 브랜드 로고 섹션 렌더링 */}
      <BrandLogosSection /> 
      
      <SuccessStoriesSection />
      <ViralGridSection /> 
      <GuaranteeSection />
      <ProcessSection />
      <PricingSection />
      <FooterCTA />
      <Footer />  
      <LeadCollectionModal isOpen={isLeadModalOpen} onClose={() => setIsLeadModalOpen(false)} />
    </div>
  );
}