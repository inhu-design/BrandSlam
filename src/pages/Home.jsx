import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowRight, CheckCircle2, Video, Target, Zap, 
  TrendingUp, ShieldCheck, BarChart3, MessageCircle, 
  Calendar, Check, XCircle, ChevronDown, PlayCircle, Star, Globe, X, FileText, Sparkles, CreditCard, PhoneCall,
  UserCheck as UserCheckIcon
} from 'lucide-react';
import Navbar from '../components/layout/Navbar'; 
import Footer from '../components/layout/Footer';
import dashboardImg from '../assets/dashboard.png';

// --- [Data Assets] ---

const caseStudies = [
  {
    id: 1,
    brand: "Ce*****",
    category: "Global K-Beauty",
    videoId: "7471724419216346398", 
    challenge: "런칭 후 글로벌 인지도 및 매출 증대 필요",
    solution: "현지 감성에 맞춘 챌린지 시딩 및 인플루언서 매니지먼트",
    results: [
      { label: "누적 조회수", value: "2M+" },
      { label: "채널 확장", value: "Amazon 매출 2,000%↑" }
    ],
    theme: "blue",
    color: "text-blue-600",
    bg: "bg-blue-50"
  },
  {
    id: 2,
    brand: "SK******",
    category: "High-Function Skincare",
    videoId: "7480532507318930696",
    challenge: "MZ세대 타겟 브랜드 인지도 확보",
    solution: "자연스러운 사용법(How-to) 강조 PPL 및 소통형 크리에이터 매칭",
    results: [
      { label: "누적 조회수", value: "5M+" },
      { label: "구매 전환율", value: "+15%" }
    ],
    theme: "purple",
    color: "text-purple-600",
    bg: "bg-purple-50"
  },
  {
    id: 3,
    brand: "P*****",
    category: "Sensitive Care",
    videoId: "7530013023667309879", 
    challenge: "틱톡샵(US) 매출 및 바이럴 증대",
    solution: "틱톡 트렌드(HOOK)를 반영한 숏폼 크리에이티브",
    results: [
      { label: "틱톡샵 전환", value: "10.5%" },
      { label: "통합 매출", value: "+350%" }
    ],
    theme: "emerald",
    color: "text-emerald-600",
    bg: "bg-emerald-50"
  }
];

const viralReferences = [
  { id: 101, videoId: "7334318567422299400", desc: "트렌드 밈 활용" },
  { id: 102, videoId: "7466865284381527302", desc: "미국 타겟 리뷰" },
  { id: 103, videoId: "7456839083566845191", desc: "Before & After" },
  { id: 104, videoId: "7547278761490664726", desc: "로컬라이징 전략" }
];

// --- [Sub-Components] ---

const TikTokEmbed = ({ videoId, title, autoplay = false }) => {
  const embedUrl = `https://www.tiktok.com/embed/v2/${videoId}?autoplay=${autoplay ? 1 : 0}&mute=1`;

  return (
    <div className="relative w-full h-full bg-black border-0 overflow-hidden">
      <iframe
        src={embedUrl}
        className="w-full h-full absolute inset-0 object-cover"
        title={title || "TikTok Video"}
        allowFullScreen
        scrolling="no"
        frameBorder="0"
        allow="autoplay; encrypted-media;"
      ></iframe>
      {autoplay && <div className="absolute inset-0 z-10 bg-transparent"></div>}
    </div>
  );
};

const ProcessModal = ({ isOpen, onClose, navigate }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white rounded-3xl w-full max-w-4xl relative z-10 overflow-hidden shadow-2xl animate-fade-in-up">
        <div className="bg-slate-900 p-6 flex justify-between items-center text-white">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <ShieldCheck className="text-emerald-400"/> 안심 발주 프로세스 안내
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-8 md:p-12">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">바로 결제되지 않습니다!</h2>
            <p className="text-slate-500">
              브랜드 슬램은 고객님의 니즈를 완벽히 파악한 후 계약을 진행합니다.<br/>
              아래 절차를 확인해 주세요.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10 relative">
            {[
              { icon: MessageCircle, title: "1. 발주 문의", desc: "웹사이트에서\n문의 접수" },
              { icon: Video, title: "2. 화상 미팅", desc: "전문가와 상담 및\n캠페인 전략 수립" },
              { icon: FileText, title: "3. 계약/송장", desc: "마이페이지에서\n계약서 및 송장 확인" },
              { icon: Zap, title: "4. 입금/착수", desc: "계좌 이체 후\n프로젝트 즉시 시작" }
            ].map((step, idx) => (
              <div key={idx} className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-center relative z-10">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <step.icon size={24} />
                </div>
                <h4 className="font-bold text-slate-900 mb-2">{step.title}</h4>
                <p className="text-xs text-slate-500 whitespace-pre-line">{step.desc}</p>
              </div>
            ))}
            <div className="hidden md:block absolute top-12 left-10 right-10 h-0.5 bg-slate-200 -z-0"></div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <button 
              onClick={() => { onClose(); navigate('/consulting'); }}
              className="px-8 py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
            >
              네, 이해했습니다. 문의하기 <ArrowRight size={20} />
            </button>
            <button 
              onClick={onClose}
              className="px-8 py-4 bg-slate-100 text-slate-600 rounded-xl font-bold text-lg hover:bg-slate-200 transition-all"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- [Sections] ---

// 1. Hero Section
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
        컨텐츠 회수율 100% 보장,
            <span className="block mt-3 md:mt-5 text-slate-900">
            우리는{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600">
                매니지먼트 플랫폼
                </span>
                 입니다.
            </span>
        </h1>
      
      <p className="max-w-3xl mx-auto text-lg md:text-xl text-slate-500 mb-10 leading-relaxed animate-fade-in-up animation-delay-200 break-keep">
        미국 현지 크리에이터 매칭부터 배송, 업로드 관리까지.<br className="hidden md:block" />
        수량만 선택하면 콘텐츠는 매달 자동으로 공급됩니다.
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up animation-delay-300">
        <Link 
          to="/consulting" 
          className="w-full sm:w-auto px-10 py-5 bg-white text-slate-900 rounded-full font-bold text-xl hover:bg-indigo-50 transition-all hover:scale-105 flex items-center justify-center gap-2 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]"
        >
          무료 진단 및 견적 문의 <ArrowRight size={20} />
        </Link>
      </div>
    </div>
  </section>
);

// 2. Why Section
const WhySection = () => (
  <section className="py-24 bg-white relative z-20">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-20">
        <span className="text-indigo-600 font-black tracking-widest uppercase text-sm">Step 01. The Mechanism</span>
        <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mt-4 mb-6 leading-snug">
            왜 <span className="underline decoration-indigo-500 underline-offset-8">회수율 100%</span>가 가능할까요?
        </h2>
        <p className="text-xl text-slate-500 max-w-3xl mx-auto leading-relaxed">
            시중의 단순 배송 대행사는 '통제력'이 없습니다.<br className="hidden md:block"/>
            브랜드 슬램은 <b>엔터테인먼트 매니지먼트 시스템</b>을 도입했습니다.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16 items-center">
        <div className="bg-slate-50 p-10 rounded-[2.5rem] border border-slate-200 opacity-60 hover:opacity-100 transition-opacity duration-500">
            <h3 className="text-2xl font-bold text-slate-400 mb-8 flex items-center gap-3">
                <XCircle className="text-slate-300" size={32} /> 일반 대행사 (Agency)
            </h3>
            <ul className="space-y-6">
                <li className="flex gap-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2.5"></div>
                    <div>
                        <strong className="block text-lg text-slate-600">단순 서칭 & 배송</strong>
                        <p className="text-slate-400 text-sm">데이터베이스에서 무작위로 연락하고 물건만 보냄</p>
                    </div>
                </li>
                <li className="flex gap-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2.5"></div>
                    <div>
                        <strong className="block text-lg text-slate-600">낮은 회수율 (Ghosting)</strong>
                        <p className="text-slate-400 text-sm">크리에이터 잠적 시 대처 불가능 (평균 70%)</p>
                    </div>
                </li>
                <li className="flex gap-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2.5"></div>
                    <div>
                        <strong className="block text-lg text-slate-600">퀄리티 컨트롤 부재</strong>
                        <p className="text-slate-400 text-sm">가이드를 줘도 제멋대로 찍어서 올림</p>
                    </div>
                </li>
            </ul>
        </div>

        <div className="bg-indigo-600 p-10 rounded-[2.5rem] text-white shadow-2xl shadow-indigo-200 transform md:scale-110 relative">
            <div className="absolute -top-6 right-10 bg-black text-yellow-400 font-bold px-6 py-2 rounded-full shadow-lg">
                The Solution
            </div>
            <h3 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                <CheckCircle2 className="text-yellow-400" size={32} /> 브랜드 슬램 (Management)
            </h3>
            <ul className="space-y-6">
                <li className="flex gap-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-2.5"></div>
                    <div>
                        <strong className="block text-xl text-white">직접 발굴 & 육성 (Discover)</strong>
                        <p className="text-indigo-200 text-sm">현존하는 모든 플랫폼에서 우수 KOC를 매일 컨택하고 교육함</p>
                    </div>
                </li>
                <li className="flex gap-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-2.5"></div>
                    <div>
                        <strong className="block text-xl text-white">성장을 돕는 파트너십</strong>
                        <p className="text-indigo-200 text-sm">단순 리워드를 넘어 컨텐츠 평가 및 성장 가이드 제공</p>
                    </div>
                </li>
                <li className="flex gap-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-2.5"></div>
                    <div>
                        <strong className="block text-xl text-white">회수율 100% AS 보장</strong>
                        <p className="text-indigo-200 text-sm">목표 미달성 시 2차 캠페인 자동 실행 (책임 완수)</p>
                    </div>
                </li>
            </ul>
        </div>
      </div>
    </div>
  </section>
);

// 3. Success Stories Section
const SuccessStoriesSection = () => (
    <section id="cases" className="py-24 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
                <span className="text-indigo-600 font-black tracking-widest uppercase text-sm">Step 02. The Proof</span>
                <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mt-4 mb-6 leading-snug">
                    숫자로 증명하는
                    <span className="block mt-3 md:mt-5 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-600">
                        압도적인 성공 사례
                    </span>
                </h2>
                <p className="text-lg text-slate-500 leading-relaxed">브랜드 슬램의 매니지먼트는 실제 매출 성장으로 이어집니다.</p>
            </div>

            <div className="flex flex-col gap-20">
                {caseStudies.map((study) => (
                    <div key={study.id} className="bg-white rounded-[2.5rem] overflow-hidden shadow-xl border border-slate-100 flex flex-col lg:flex-row group hover:shadow-2xl transition-all duration-500">
                        <div className="lg:w-5/12 relative bg-slate-900 min-h-[500px] flex items-center justify-center p-8">
                            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-800"></div>
                            <div className={`absolute top-0 left-0 w-2 h-full ${study.theme === 'blue' ? 'bg-blue-500' : study.theme === 'purple' ? 'bg-purple-500' : 'bg-emerald-500'}`}></div>
                            <div className="relative w-[280px] h-[500px] transform transition-transform duration-500 group-hover:scale-105 shadow-2xl rounded-2xl overflow-hidden border border-slate-700">
                                <TikTokEmbed videoId={study.videoId} title={`${study.brand} Case`} />
                            </div>
                        </div>

                        <div className="lg:w-7/12 p-8 md:p-12 flex flex-col justify-center">
                            <div className="mb-8">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 ${study.bg} ${study.color} border border-slate-100`}>
                                    <Sparkles className="w-3 h-3" /> {study.category}
                                </span>
                                <h3 className="text-4xl md:text-5xl font-black text-slate-900 mb-2 tracking-tight">{study.brand}</h3>
                                <div className="h-1.5 w-24 bg-slate-100 rounded-full mt-4">
                                    <div className={`h-full rounded-full ${study.theme === 'blue' ? 'bg-blue-500' : study.theme === 'purple' ? 'bg-purple-500' : 'bg-emerald-500'} w-1/2`}></div>
                                </div>
                            </div>

                            <div className="space-y-8 mb-10">
                                <div className="pl-6 border-l-4 border-slate-100">
                                    <h4 className="flex items-center gap-2 font-bold text-slate-900 mb-1 text-lg">Challenge</h4>
                                    <p className="text-slate-600 leading-relaxed">{study.challenge}</p>
                                </div>
                                <div className={`pl-6 border-l-4 ${study.theme === 'blue' ? 'border-blue-200' : study.theme === 'purple' ? 'border-purple-200' : 'border-emerald-200'}`}>
                                    <h4 className="flex items-center gap-2 font-bold text-slate-900 mb-1 text-lg">Solution</h4>
                                    <p className="text-slate-800 font-medium leading-relaxed">{study.solution}</p>
                                </div>
                            </div>

                            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200">
                                <h4 className="flex items-center gap-2 font-bold text-slate-900 mb-6 text-xl">
                                    <BarChart3 size={24} className={study.color}/> Key Results
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {study.results.map((res, i) => (
                                        <div key={i}>
                                            <p className="text-xs text-slate-500 mb-1 uppercase font-semibold tracking-wide">{res.label}</p>
                                            <p className={`text-2xl md:text-3xl font-black ${study.color}`}>{res.value}</p>
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

// 4. Viral Grid Section
const ViralGridSection = () => (
    <section className="py-24 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
                 <div className="inline-flex items-center justify-center p-2 bg-indigo-50 rounded-full mb-4 text-indigo-600">
                    <PlayCircle size={20} className="mr-2" />
                    <span className="text-sm font-bold uppercase tracking-wide">More References</span>
                </div>
                <h2 className="text-3xl font-bold text-slate-900">다양한 US 바이럴 레퍼런스</h2>
                <p className="text-slate-500 mt-4">단순 노출을 넘어 구매 행동을 유발하는 콘텐츠들입니다.</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
                {viralReferences.map((ref) => (
                    <div key={ref.id} className="group cursor-pointer">
                        <div className="relative aspect-[9/16] rounded-2xl overflow-hidden shadow-md mb-4 bg-black border border-slate-100 group-hover:shadow-xl transition-all">
                             <TikTokEmbed videoId={ref.videoId} />
                             <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-all pointer-events-none"></div>
                        </div>
                        <div className="text-center">
                            <div className="flex justify-center gap-0.5 mb-2 text-yellow-400">
                                {[...Array(5)].map((_, i) => <Star key={i} size={12} fill="currentColor" />)}
                            </div>
                            <p className="text-sm font-bold text-slate-800">{ref.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </section>
);

// 5. Guarantee Section
const GuaranteeSection = () => (
  <section className="py-32 bg-[#0F172A] text-white relative overflow-hidden">
     <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[100px]"></div>
     <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px]"></div>

     <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
        <span className="text-emerald-400 font-black tracking-widest uppercase text-sm mb-4 block">Step 03. The Promise</span>
        
        <h2 className="text-5xl md:text-7xl font-extrabold mb-8 leading-snug">
            실패란 없습니다.
            <span className="block mt-3 md:mt-5 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                100% 보장형 서비스
            </span>
        </h2>
        
        <p className="text-xl md:text-2xl text-slate-300 mb-12 font-light leading-relaxed">
            1차 배송 후 목표 수량 미달성 시,<br/>
            <b className="text-white">남은 %를 채울 때까지 2차 무료 모집</b>을 진행합니다.
        </p>

        <div className="bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-2xl max-w-2xl mx-auto mb-8">
            <div className="flex items-start gap-4 text-left">
                <div className="p-2 bg-yellow-400/20 rounded-lg text-yellow-400 shrink-0">
                    <Star size={24} fill="currentColor" />
                </div>
                <div>
                    <h4 className="font-bold text-lg text-white mb-2">책임 보장제 상세 안내</h4>
                    <p className="text-slate-400 text-sm">
                        저희는 양적, 질적 목표 달성을 최우선으로 합니다. 
                        만약 1차 캠페인에서 컨텐츠 수량이 부족할 경우, 추가 비용(용역비) 없이 즉시 2차 캠페인을 가동합니다.
                        <br/><br/>
                        <span className="text-yellow-400 font-bold">* 단, 2차 발송 시 발생하는 제품 배송비는 브랜드사에서 부담합니다.</span>
                    </p>
                </div>
            </div>
        </div>

        <div className="flex justify-center gap-8 text-center">
            <div>
                <p className="text-slate-500 text-sm font-bold uppercase mb-2">업계 평균</p>
                <p className="text-4xl font-bold text-slate-600 line-through">70%</p>
            </div>
            <div className="w-px bg-slate-700 h-16"></div>
            <div>
                <p className="text-emerald-400 text-sm font-bold uppercase mb-2">Brand Slam</p>
                <p className="text-5xl font-black text-white">100%</p>
            </div>
        </div>
     </div>
  </section>
);

// 6. Process Section
const ProcessSection = () => (
    <section id="process" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
                <span className="text-indigo-600 font-black tracking-widest uppercase text-sm">Step 04. Total Control</span>
                
                <h2 className="text-4xl font-extrabold text-slate-900 mt-4 mb-6 leading-snug">
                    모든 과정은<br/>
                    <span className="bg-indigo-100 text-indigo-700 px-2">대시보드</span>에서 투명하게.
                </h2>
                <p className="text-lg text-slate-600 leading-relaxed max-w-3xl mx-auto">
                    계약부터 성과 확인까지, 더 이상 복잡한 메일을 주고받을 필요가 없습니다.<br/>
                    브랜드 슬램만의 <b>One-Stop 프로세스</b>를 경험해보세요.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-20">
                {[
                    { icon: MessageCircle, title: "1. 발주 문의 & 화상 미팅", desc: "문의 접수 후 전문가와 1:1 상담을 통해\n최적의 캠페인 전략을 수립합니다." },
                    { icon: FileText, title: "2. 계약서 & 송장 생성", desc: "미팅 후 브랜드사가 계약 내용을 확정하면\n마이페이지로 계약서/송장이 자동 발송됩니다." },
                    { icon: CreditCard, title: "3. 간편 결제 및 착수", desc: "송장 확인 후 계좌 이체를 진행하면\n즉시 프로젝트가 시작됩니다." },
                    { icon: BarChart3, title: "4. 실시간 성과 확인", desc: "배송 현황부터 업로드된 영상 URL까지\n대시보드에서 실시간으로 확인하세요." }
                ].map((step, idx) => (
                    <div key={idx} className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100 relative group hover:-translate-y-2 transition-transform duration-300">
                        <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            <step.icon size={28} />
                        </div>
                        <h3 className="font-bold text-xl text-slate-900 mb-3">{step.title}</h3>
                        <p className="text-slate-500 text-sm leading-relaxed whitespace-pre-line">{step.desc}</p>
                    </div>
                ))}
            </div>

            <div className="flex flex-col lg:flex-row items-center gap-16">
                <div className="lg:w-1/2">
                    <h3 className="text-2xl font-bold text-slate-900 mb-4">
                        실무자의 시간을 아껴주는<br/>
                        <span className="text-indigo-600">스마트 매니지먼트</span>
                    </h3>
                    <div className="space-y-6 mt-8">
                        <div className="flex items-start gap-4 p-4 bg-white rounded-2xl shadow-sm border border-slate-100">
                            <div className="bg-indigo-50 p-3 rounded-xl text-indigo-600 shrink-0"><FileText size={24}/></div>
                            <div>
                                <h4 className="font-bold text-slate-900 mb-1">전자 계약 & 송장 관리</h4>
                                <p className="text-sm text-slate-500 leading-snug">번거로운 서류 작업 없이, 마이페이지에서 계약서 날인과 송장 확인을 한 번에 처리하세요.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4 p-4 bg-white rounded-2xl shadow-sm border border-slate-100">
                            <div className="bg-indigo-50 p-3 rounded-xl text-indigo-600 shrink-0"><BarChart3 size={24}/></div>
                            <div>
                                <h4 className="font-bold text-slate-900 mb-1">실시간 성과 트래킹</h4>
                                <p className="text-sm text-slate-500 leading-snug">제품 배송 상태와 크리에이터가 업로드한 컨텐츠를 실시간으로 모니터링 할 수 있습니다.</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="lg:w-1/2 relative">
                    <img 
                        src={dashboardImg} 
                        alt="Brand Slam Dashboard Interface" 
                        className="w-full rounded-3xl shadow-2xl border border-slate-200 transform hover:scale-[1.02] transition-transform duration-500"
                    />
                </div>
            </div>
        </div>
    </section>
);

// 7. Pricing Section
const PricingSection = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const navigate = useNavigate();

    const mainPlans = [
        {
            name: "Starter",
            price: "590,000",
            count: "10",
            recommend: "첫 시딩이거나 실패 확률을 줄이고 싶은 브랜드",
            features: [
                "캠페인 운영 대행",
                "콘텐츠 업로드 트래킹",
                "기본 리포트 서비스 제공"
            ],
            theme: "slate"
        },
        {
            name: "Growth",
            price: "990,000",
            count: "20",
            recommend: "타겟 고객이 명확한 브랜드",
            features: [
                "캠페인 운영 대행",
                "콘텐츠 업로드 트래킹",
                "성과 리포트 (조회수, 반응)",
                "VOC 요약 서비스 제공"
            ],
            theme: "indigo",
            isBest: true
        },
        {
            name: "Scale50",
            price: "2,490,000",
            count: "50",
            recommend: "전환 및 매출 확장을 고려하는 브랜드",
            features: [
                "캠페인 운영 대행",
                "콘텐츠 업로드 트래킹",
                "성과 리포트 & VOC 분석",
                "원본 영상 1개 제공"
            ],
            theme: "purple"
        }
    ];

    const addons = [
        {
            icon: Target,
            title: "Top 50 인플루언서 큐레이션",
            price: "100,000원 / 월",
            desc: "어떤 크리에이터를 써야 할 지 모르는 브랜드",
            details: "캠페인 목적에 맞는 인플루언서 50명 추천"
        },
        {
            icon: UserCheckIcon,
            title: "타겟 오디언스 큐레이션 (50)",
            price: "300,000원 / 월",
            desc: "타겟 고객이 명확한 브랜드",
            details: "반려동물 등 타겟 인플루언서 리스트 제공"
        },
        {
            icon: ShieldCheck,
            title: "Creator Contact Pack",
            price: "별도 문의",
            desc: "직접 커뮤니케이션을 병행하고 싶은 브랜드",
            details: "사전 동의 크리에이터 정보 및 배송 중개"
        },
        {
            icon: TrendingUp,
            title: "Spark Ads 신청 대행",
            price: "광고비 + 15%",
            desc: "전환 및 매출 확장을 고려하는 브랜드",
            details: "성과 우수 콘텐츠 광고 전환 및 세팅 대행"
        }
    ];

    return (
        <section id="pricing" className="py-24 bg-[#0f172a] text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10"></div>
            
            <div className="max-w-7xl mx-auto px-4 relative z-10">
                <div className="text-center mb-16">
                    <span className="text-indigo-400 font-bold tracking-widest uppercase text-sm">Step 05. The Offer</span>
                    <h2 className="text-4xl md:text-5xl font-extrabold mt-4 mb-6">성장을 위한 맞춤형 플랜</h2>
                    <p className="text-slate-400 max-w-2xl mx-auto">플랫폼 기반의 투명한 운영으로 콘텐츠 회수율 100%를 보장합니다.</p>
                </div>

                {/* Main Plans Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
                    {mainPlans.map((plan, idx) => (
                        <div key={idx} className={`relative bg-white text-slate-900 rounded-[2.5rem] p-8 shadow-2xl transition-all duration-500 hover:-translate-y-4 ${plan.isBest ? 'ring-4 ring-indigo-500 md:scale-105 z-10' : ''}`}>
                            {plan.isBest && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                                    MOST POPULAR
                                </div>
                            )}
                            <div className="mb-8">
                                <h3 className="text-2xl font-black text-slate-900 mb-2">{plan.name}</h3>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-black text-indigo-600">{plan.price.replace('원','')}</span>
                                    <span className="text-slate-400 font-bold text-lg">원</span>
                                </div>
                                <div className="mt-2 inline-block px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-bold">
                                    콘텐츠 {plan.count}개 보장
                                </div>
                            </div>

                            <p className="text-sm text-slate-500 font-medium mb-6 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                💡 {plan.recommend}
                            </p>

                            <ul className="space-y-4 mb-10">
                                {plan.features.map((feat, i) => (
                                    <li key={i} className="flex items-start gap-3 text-sm font-bold text-slate-700">
                                        <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                                        {feat}
                                    </li>
                                ))}
                            </ul>

                            <button 
                                onClick={() => setIsModalOpen(true)}
                                className={`w-full py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${plan.isBest ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                            >
                                발주 문의하기 <ArrowRight size={20}/>
                            </button>
                        </div>
                    ))}
                </div>

                {/* Add-on Section */}
                <div className="bg-white/5 backdrop-blur-md rounded-[3rem] p-8 md:p-12 border border-white/10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12">
                        <div>
                            <h3 className="text-3xl font-bold flex items-center gap-3">
                                <Zap className="text-yellow-400 fill-yellow-400" /> Add-on 부가 서비스
                            </h3>
                            <p className="text-slate-400 mt-2">필요한 기능만 쏙쏙 골라 캠페인 효율을 극대화하세요.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {addons.map((addon, idx) => (
                            <div key={idx} className="bg-slate-900/50 p-6 rounded-3xl border border-white/5 hover:border-indigo-500/50 transition-colors group">
                                <div className="w-12 h-12 bg-white/5 text-indigo-400 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <addon.icon size={24} />
                                </div>
                                <h4 className="text-lg font-bold mb-1 leading-tight">{addon.title}</h4>
                                <p className="text-indigo-400 font-black text-sm mb-3">{addon.price}</p>
                                <div className="space-y-2">
                                    <p className="text-xs text-slate-300 font-medium leading-relaxed">• {addon.details}</p>
                                    <p className="text-[11px] text-slate-500 leading-snug">📌 {addon.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <p className="text-center text-xs text-slate-500 mt-10">
                    * VAT 별도 / 배송비 별도 (실비 청구)<br/>
                    * 100% 회수율 보장제는 플랫폼의 모든 메인 상품에 적용됩니다.
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

// 8. Footer CTA
const FooterCTA = () => (
    <section className="py-24 bg-white text-center">
        <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-8 leading-snug">
                준비되셨나요?
                <span className="block mt-3 md:mt-5">
                    Brand Slam과 함께 성장을 시작하세요.
                </span>
            </h2>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
                 <Link 
                    to="/consulting"
                    className="px-10 py-5 bg-indigo-600 text-white rounded-full font-bold text-xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200"
                >
                    지금 바로 문의하기
                </Link>
            </div>
        </div>
    </section>
);

// [추가] 플로팅 상담 버튼 컴포넌트
const FloatingConsultButton = () => (
    <Link 
        to="/consulting" 
        className="fixed bottom-8 right-8 z-50 flex items-center justify-center w-16 h-16 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 hover:scale-110 transition-all duration-300 group"
        aria-label="상담하기"
    >
        <PhoneCall size={28} className="group-hover:animate-wiggle" />
        <span className="absolute right-full mr-4 bg-slate-900 text-white text-sm py-2 px-4 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            실시간 상담하기
        </span>
    </Link>
);

export default function Home() {
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('opacity-100', 'translate-y-0');
                entry.target.classList.remove('opacity-0', 'translate-y-10');
            }
        });
    }, { threshold: 0.1 });

    const sections = document.querySelectorAll('section');
    sections.forEach(section => {
        section.classList.add('transition-all', 'duration-1000', 'opacity-0', 'translate-y-10'); 
        observer.observe(section);
    });

    return () => {
        sections.forEach(section => observer.unobserve(section));
    };
  }, []);

  return (
    <div className="font-sans antialiased text-slate-900 bg-white selection:bg-indigo-500 selection:text-white relative">
      <Navbar /> 
      <Hero />
      <WhySection />
      <SuccessStoriesSection />
      <ViralGridSection />
      <GuaranteeSection />
      <ProcessSection />
      <PricingSection />
      <FooterCTA />
      <Footer /> 
      
      <FloatingConsultButton />
    </div>
  );
}