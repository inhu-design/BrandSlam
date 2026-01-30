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

// --- [Data Assets: 원본 데이터 100% 보존] ---

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
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    gradient: "from-blue-600 to-cyan-500"
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
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    gradient: "from-purple-600 to-pink-500"
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
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    gradient: "from-emerald-600 to-teal-500"
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
              { icon: MessageCircle, title: "1. 발주 문의", desc: "웹사이트에서\n문의 접수" },
              { icon: Video, title: "2. 화상 미팅", desc: "전문가와 상담 및\n캠페인 전략 수립" },
              { icon: FileText, title: "3. 계약/송장", desc: "마이페이지에서\n계약서 및 송장 확인" },
              { icon: Zap, title: "4. 입금/착수", desc: "계좌 이체 후\n프로젝트 즉시 시작" }
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

// 1. Hero Section (Ref 1 이미지의 오가닉한 배경 반영)
const Hero = () => (
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
        컨텐츠 회수율 <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400">100% 보장</span>
        <span className="block mt-4 text-slate-300 text-3xl md:text-5xl font-light">우리는 매니지먼트 플랫폼입니다.</span>
      </h1>
      
      <p className="max-w-3xl mx-auto text-lg md:text-xl text-slate-400 mb-12 leading-relaxed font-light break-keep">
        미국 현지 크리에이터 매칭부터 배송, 업로드 관리까지.<br className="hidden md:block" />
        수량만 선택하면 콘텐츠는 <span className="text-white font-medium italic">매달 자동으로 공급됩니다.</span>
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
        <Link 
          to="/consulting" 
          className="group relative w-full sm:w-auto px-12 py-6 bg-white text-slate-900 rounded-full font-black text-xl hover:scale-105 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)] flex items-center justify-center gap-2 overflow-hidden"
        >
          <span className="relative z-10">무료 진단 및 견적 문의</span>
          <ArrowRight size={22} className="relative z-10 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  </section>
);

// 2. Why Section (Ref 3 원칙 테마 반영)
const WhySection = () => (
  <section className="py-32 bg-[#020617] border-y border-white/5 relative overflow-hidden">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
      <div className="text-center mb-24">
        <span className="text-purple-400 font-black tracking-[0.3em] uppercase text-sm">Step 01. The Mechanism</span>
        <h2 className="text-4xl md:text-6xl font-black text-white mt-6 mb-8 tracking-tight">
            왜 <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">회수율 100%</span>가 가능할까요?
        </h2>
        <p className="text-xl text-slate-400 max-w-3xl mx-auto font-light leading-relaxed">
            시중의 단순 배송 대행사는 '통제력'이 없습니다.<br className="hidden md:block"/>
            슬램 글로벌은 <span className="text-white font-medium underline underline-offset-8 decoration-purple-500">엔터테인먼트 매니지먼트 시스템</span>을 도입했습니다.
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
                  { t: "낮은 회수율 (Ghosting)", d: "크리에이터 잠적 시 대처 불가능 (평균 70%)" },
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
                      { t: "회수율 100% AS 보장", d: "목표 미달성 시 2차 캠페인 자동 실행 (책임 완수)" }
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

// 3. Success Stories Section (Ref 2 이미지의 글로시 카드 반영)
const SuccessStoriesSection = () => (
    <section id="cases" className="py-32 bg-[#020617]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-24">
                <span className="text-cyan-400 font-black tracking-[0.3em] uppercase text-sm">Step 02. The Proof</span>
                <h2 className="text-4xl md:text-7xl font-black text-white mt-6 mb-8 tracking-tighter leading-none">
                    숫자로 증명하는<br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400">압도적인 성공 사례</span>
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
                                <h3 className="text-6xl md:text-8xl font-black text-white mb-6 tracking-tighter leading-none">{study.brand}</h3>
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

// 4. Viral Grid Section
const ViralGridSection = () => (
    <section className="py-32 bg-[#020617] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20">
                 <div className="inline-flex items-center justify-center px-4 py-2 bg-white/5 rounded-full mb-6 border border-white/10 text-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.1)]">
                    <PlayCircle size={18} className="mr-2" />
                    <span className="text-xs font-black uppercase tracking-[0.2em]">Live Feed</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">US 바이럴 레퍼런스</h2>
                <p className="text-slate-500 mt-6 font-light">단순 노출을 넘어 구매 행동을 유발하는 컨텐츠의 정석</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
                {viralReferences.map((ref) => (
                    <div key={ref.id} className="group">
                        <div className="relative aspect-[9/16] rounded-2xl overflow-hidden shadow-2xl mb-6 bg-slate-900 ring-1 ring-white/10 group-hover:ring-purple-500/50 transition-all duration-500">
                             <TikTokEmbed videoId={ref.videoId} />
                             <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60 pointer-events-none"></div>
                        </div>
                        <div className="text-center px-2">
                            <div className="flex justify-center gap-1 mb-3 text-cyan-400">
                                {[...Array(5)].map((_, i) => <Star key={i} size={12} fill="currentColor" />)}
                            </div>
                            <p className="text-sm font-bold text-white tracking-tight group-hover:text-cyan-400 transition-colors">{ref.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </section>
);

// 5. Guarantee Section (Ref 2 원형 오브제 스타일 반영)
const GuaranteeSection = () => (
  <section className="py-40 bg-[#020617] relative overflow-hidden border-y border-white/5">
     <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-purple-600/10 to-blue-600/10 rounded-full blur-[160px] pointer-events-none"></div>

     <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
        <span className="text-emerald-400 font-black tracking-[0.3em] uppercase text-sm mb-8 block">Step 03. The Promise</span>
        <h2 className="text-5xl md:text-8xl font-black text-white mb-10 tracking-tighter leading-none">
            실패란 없습니다.<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">100% 보장형 서비스</span>
        </h2>
        
        <p className="text-xl md:text-2xl text-slate-400 mb-16 font-light leading-relaxed max-w-3xl mx-auto">
            1차 배송 후 목표 수량 미달성 시,<br/>
            <span className="text-white font-medium underline underline-offset-4 decoration-emerald-500">남은 %를 채울 때까지 2차 무료 모집</span>을 진행합니다.
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
                        우리는 양적, 질적 목표 달성을 최우선으로 합니다. 
                        만약 1차 캠페인에서 컨텐츠 수량이 부족할 경우, <b>추가 용역비 없이 즉시 2차 캠페인을 가동</b>합니다. 
                        브랜드의 성공이 곧 우리의 성과이기 때문입니다.
                        <br/><br/>
                        <span className="text-emerald-400 font-bold">* 단, 2차 발송 시 발생하는 제품 배송비는 브랜드사에서 부담합니다.</span>
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

// 6. Process Section (Ref 3 다크 카드 스타일 반영)
const ProcessSection = () => (
    <section id="process" className="py-32 bg-[#020617] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-24">
                <span className="text-purple-400 font-black tracking-[0.3em] uppercase text-sm">Step 04. Total Control</span>
                <h2 className="text-4xl md:text-6xl font-black text-white mt-6 mb-8 tracking-tight">
                    모든 과정은<br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">대시보드</span>에서 투명하게.
                </h2>
                <p className="text-lg text-slate-400 leading-relaxed max-w-3xl mx-auto font-light">
                    계약부터 성과 확인까지, 더 이상 복잡한 메일은 필요 없습니다.<br/>
                    슬램 글로벌만의 <span className="text-white font-medium">One-Stop Management System</span>을 경험하세요.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-32">
                {[
                    { icon: MessageCircle, title: "1. 발주 문의 & 미팅", desc: "전문가와 1:1 상담을 통해\n최적의 캠페인 전략을 수립합니다." },
                    { icon: FileText, title: "2. 계약서 & 송장 생성", desc: "마이페이지를 통해\n계약서/송장이 자동 생성됩니다." },
                    { icon: CreditCard, title: "3. 결제 및 착수", desc: "입금 확인 즉시 크리에이터\n모집 및 제품 발송이 시작됩니다." },
                    { icon: BarChart3, title: "4. 실시간 성과 확인", desc: "배송 현황부터 영상 URL까지\n실시간으로 트래킹하세요." }
                ].map((step, idx) => (
                    <div key={idx} className="bg-white/5 p-10 rounded-[2.5rem] border border-white/5 relative group hover:-translate-y-2 transition-all duration-500 backdrop-blur-md">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-blue-500/20 text-purple-400 rounded-2xl flex items-center justify-center mb-8 border border-white/10 group-hover:scale-110 transition-transform">
                            <step.icon size={30} />
                        </div>
                        <h3 className="font-bold text-xl text-white mb-4 tracking-tight">{step.title}</h3>
                        <p className="text-slate-500 text-sm leading-relaxed font-light whitespace-pre-line">{step.desc}</p>
                    </div>
                ))}
            </div>

            <div className="flex flex-col lg:flex-row items-center gap-20">
                <div className="lg:w-1/2">
                    <h3 className="text-3xl md:text-5xl font-black text-white mb-8 tracking-tight leading-tight">
                        실무자의 시간을 아껴주는<br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 italic">Smart Management</span>
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

// 7. Pricing Section (Add-on 포함 원본 데이터 유지)
const PricingSection = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const navigate = useNavigate();

    const mainPlans = [
        { name: "Starter", price: "590,000", count: "10", recommend: "첫 시딩이거나 실패 확률을 줄이고 싶은 브랜드", features: ["캠페인 운영 대행", "콘텐츠 업로드 트래킹", "기본 리포트 서비스 제공"] },
        { name: "Growth", price: "990,000", count: "20", recommend: "타겟 고객이 명확한 브랜드", features: ["캠페인 운영 대행", "콘텐츠 업로드 트래킹", "성과 리포트 (조회수, 반응)", "VOC 요약 서비스 제공"], isBest: true },
        { name: "Scale50", price: "2,490,000", count: "50", recommend: "전환 및 매출 확장을 고려하는 브랜드", features: ["캠페인 운영 대행", "콘텐츠 업로드 트래킹", "성과 리포트 & VOC 분석", "원본 영상 1개 제공"] }
    ];

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
                    <p className="text-slate-500 max-w-2xl mx-auto font-light leading-relaxed">플랫폼 기반의 투명한 운영으로 <span className="text-white font-medium italic underline underline-offset-4 decoration-purple-500">콘텐츠 회수율 100%</span>를 보장합니다.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-32">
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

                {/* Add-on Section */}
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
                    * VAT 별도 / 배송비 별도 (실비 청구)  •  * 100% 회수율 보장제는 플랫폼의 모든 메인 상품에 적용됩니다.
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

// [추가] 플로팅 상담 버튼 (다크 테마 리뉴얼)
const FloatingConsultButton = () => (
    <Link 
        to="/consulting" 
        className="fixed bottom-10 right-10 z-50 flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-full shadow-[0_0_30px_rgba(147,51,234,0.4)] hover:scale-110 transition-all duration-500 group"
    >
        <PhoneCall size={32} className="group-hover:animate-wiggle" />
        <div className="absolute right-full mr-6 bg-white/5 backdrop-blur-xl text-white text-sm font-black py-3 px-6 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-500 whitespace-nowrap pointer-events-none border border-white/10 tracking-[0.2em] uppercase">
            상담 예약하기
        </div>
    </Link>
);

export default function Home() {
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('opacity-100', 'translate-y-0');
                entry.target.classList.remove('opacity-0', 'translate-y-20');
            }
        });
    }, { threshold: 0.1 });

    const sections = document.querySelectorAll('section');
    sections.forEach(section => {
        section.classList.add('transition-all', 'duration-[1200ms]', 'opacity-0', 'translate-y-20', 'ease-out'); 
        observer.observe(section);
    });

    return () => {
        sections.forEach(section => observer.unobserve(section));
    };
  }, []);

  return (
    <div className="font-sans antialiased text-white bg-[#020617] selection:bg-cyan-500/30 selection:text-white relative">
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