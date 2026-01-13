import React from 'react';
import { Link } from 'react-router-dom'; // [Link 컴포넌트 임포트]
import { 
  ArrowRight, 
  ShieldCheck, 
  RefreshCw, 
  Zap, 
  Globe, 
  Search, 
  Bot, 
  FileBarChart,
  CheckCircle2,
  Layers,
  Package,
  Sparkles,
  Play,
  BarChart3,
  Clock,
  Lock
} from 'lucide-react';

import Navbar from '../components/layout/Navbar'; 
import Footer from '../components/layout/Footer';

// --- Sub-Components ---

// 1. Hero Section (Navigation Connected)
const Hero = () => (
  <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden bg-slate-50">
    {/* 3-Blob Aurora Background */}
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
        Global Seeding Automation v1.0
      </div>
      
      {/* 멘토 Pick: Features 페이지 전용 카피 적용 */}
      <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight mb-6 leading-tight animate-fade-in-up animation-delay-100 drop-shadow-sm">
         A to Z 까지 원클릭<br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600">
          시딩 자동화를 경험하세요
        </span>
      </h1>
      
      <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-500 mb-10 leading-relaxed animate-fade-in-up animation-delay-200">
        섭외, 리마인드, 업로드 체크, 트레킹까지.<br className="hidden md:block"/>
        모든 시딩 프로세스를 100% 자동화하여 귀사의 리소스를 아껴드립니다.
      </p>
      
      <div className="flex flex-col md:flex-row items-center justify-center gap-4 animate-fade-in-up animation-delay-300">
        {/* [Link] Pricing 페이지로 이동 */}
        <Link 
          to="/pricing"
          onClick={() => window.scrollTo(0, 0)}
          className="w-full md:w-auto px-8 py-4 bg-slate-900 text-white rounded-full font-bold text-lg hover:bg-indigo-600 transition-all hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/30 flex items-center justify-center gap-2"
        >
          플랜 살펴보기 
          <ArrowRight size={20} />
        </Link>

        {/* [Link] Customers 페이지로 이동 */}
        <Link 
          to="/customers"
          onClick={() => window.scrollTo(0, 0)}
          className="group w-full md:w-auto px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-full font-bold text-lg hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all flex items-center justify-center gap-2"
        >
          <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center group-hover:bg-white transition-colors">
              <Play size={14} fill="currentColor" className="text-slate-900 group-hover:text-indigo-600" />
          </div>
          성공 사례 영상
        </Link>
      </div>
    </div>
  </section>
);

// 2. Core Features (Grid Card Layout)
const CoreFeatures = () => {
  const features = [
    {
      id: "supply",
      subtitle: "STABLE SUPPLY",
      title: "안정적인 콘텐츠 공급 파이프라인",
      desc: "단발성 시딩은 브랜드 자산이 되지 않습니다. 매월 끊김 없이 새로운 인플루언서와 콘텐츠가 연결되는 '구독형 구조'를 통해 마케팅의 예측 가능성을 높이세요.",
      points: ["섭외 스트레스 Zero", "매월 새로운 크리에이터 매칭", "지속 가능한 마케팅 자산 확보"],
      icon: <Layers className="text-blue-600" size={32} />,
      theme: "blue",
      delay: "0"
    },
    {
      id: "volume",
      subtitle: "VOLUME & CHOOSE",
      title: "복잡한 기획 없이, 수량만 선택하세요",
      desc: "콘텐츠 30개가 필요하신가요, 아니면 300개가 필요하신가요? 복잡한 브리프 없이 필요한 수량만 결정하면, Brand Slam이 최적의 크리에이터를 찾아 실행합니다.",
      points: ["Basic (30개) ~ Premium (300개)", "간편한 수량 중심 옵션", "규모의 경제 실현"],
      icon: <Package className="text-purple-600" size={32} />,
      theme: "purple",
      delay: "100"
    },
    {
      id: "optimization",
      subtitle: "AUTO OPTIMIZATION",
      title: "알아서 최적화되는 황금비율 포맷",
      desc: "어떤 영상이 터질지 고민하지 마세요. 얼굴 노출, 제형 강조, 후기형 등 다양한 포맷을 매달 성과 데이터에 기반하여 자동으로 믹스하고 최적화합니다.",
      points: ["포맷 자동 A/B 테스트", "성과 기반 비율 조정", "광고 소재 2차 활용 최적화"],
      icon: <Sparkles className="text-indigo-600" size={32} />,
      theme: "indigo",
      delay: "200"
    }
  ];

  return (
    <section className="py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {features.map((feat) => (
            <div 
              key={feat.id} 
              className={`flex flex-col p-8 rounded-[2rem] bg-white border border-slate-200 shadow-lg hover:shadow-2xl hover:border-${feat.theme}-200 transition-all duration-300 hover:-translate-y-2 group`}
            >
              {/* Icon & Badge */}
              <div className="flex justify-between items-start mb-6">
                 <div className={`w-16 h-16 rounded-2xl bg-${feat.theme}-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    {feat.icon}
                 </div>
                 <div className={`px-3 py-1 rounded-full bg-${feat.theme}-50 border border-${feat.theme}-100`}>
                    <span className={`text-xs font-bold text-${feat.theme}-600 tracking-widest uppercase`}>{feat.subtitle}</span>
                 </div>
              </div>

              {/* Content */}
              <h3 className="text-2xl font-bold text-slate-900 mb-4 leading-tight group-hover:text-indigo-900 transition-colors">
                {feat.title}
              </h3>
              <p className="text-slate-500 leading-relaxed mb-8 flex-grow">
                {feat.desc}
              </p>

              {/* Check Points */}
              <div className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-100 group-hover:bg-white group-hover:border-${feat.theme}-100 transition-colors">
                {feat.points.map((point, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className={`mt-1 p-0.5 rounded-full bg-${feat.theme}-100 text-${feat.theme}-600 shrink-0`}>
                      <CheckCircle2 size={14} strokeWidth={3} />
                    </div>
                    <span className="text-sm text-slate-700 font-medium">{point}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// 3. Process Cycle
const ProcessCycle = () => {
  const steps = [
    {
      id: "01",
      title: "서비스 인지 & 설문",
      desc: "브랜드 상태 진단 및 맞춤형 교육자료 제공",
      icon: <Search className="text-white" size={24} />,
      color: "from-blue-500 to-cyan-500"
    },
    {
      id: "02",
      title: "견적 & 미팅 옵션",
      desc: "예산에 맞는 최적의 플랜 즉시 제안",
      icon: <FileBarChart className="text-white" size={24} />,
      color: "from-indigo-500 to-blue-500"
    },
    {
      id: "03",
      title: "선입금 100% & 실행",
      desc: "우선순위 배정 시스템으로 대기 없는 런칭",
      icon: <Zap className="text-white" size={24} />,
      color: "from-violet-500 to-purple-500"
    },
    {
      id: "04",
      title: "미업로드 리스크 관리",
      desc: "업로드 여부를 감시하고 리마인드 트리거 발동",
      icon: <Bot className="text-white" size={24} />,
      color: "from-fuchsia-500 to-pink-500"
    },
    {
      id: "05",
      title: "회수율 100% 목표",
      desc: "구매한 건 수 만큼 회수율 목표 달성",
      icon: <RefreshCw className="text-white" size={24} />,
      color: "from-rose-500 to-orange-500"
    },
    {
      id: "06",
      title: "재이용 유도 (Loop)",
      desc: "성과 데이터 분석을 통한 효율 극대화",
      icon: <Globe className="text-white" size={24} />,
      color: "from-amber-500 to-yellow-500"
    }
  ];

  return (
    <section id="process" className="py-24 bg-slate-50 relative border-y border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-sm font-bold text-indigo-600 tracking-widest uppercase mb-3">Service Cycle</h2>
          <h3 className="text-3xl md:text-4xl font-extrabold text-slate-900">
            데이터 기반의 <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">6단계 자동화 사이클</span>
          </h3>
          <p className="mt-4 text-slate-500 max-w-2xl mx-auto">
             복잡한 인플루언서 마케팅 과정을 시스템화했습니다. <br/>
             각 단계는 유기적으로 연결되어 브랜드의 성장을 가속화합니다.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {steps.map((step) => (
            <div key={step.id} className="group relative p-8 rounded-3xl border border-white bg-white shadow-lg shadow-slate-200/50 hover:border-indigo-100 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 hover:-translate-y-1 overflow-hidden">
               {/* Hover Gradient Background */}
               <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 bg-gradient-to-br ${step.color} transition-opacity duration-300`}></div>
               
               <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br ${step.color} shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform duration-300`}>
                      {step.icon}
                    </div>
                    <span className="text-5xl font-black text-slate-100 group-hover:text-slate-50/0 group-hover:bg-clip-text group-hover:bg-gradient-to-br group-hover:from-slate-200 group-hover:to-slate-300 transition-all duration-300">
                      {step.id}
                    </span>
                  </div>
                  <h4 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-indigo-900 transition-colors">{step.title}</h4>
                  <p className="text-slate-500 leading-relaxed text-sm group-hover:text-slate-600">
                    {step.desc}
                  </p>
               </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// 4. Why Brand Slam
const WhyBrandSlam = () => {
    const reasons = [
        {
            icon: <BarChart3 className="text-indigo-600" size={32} />,
            title: "데이터 기반 의사결정",
            desc: "감이나 직관이 아닌, 철저한 데이터 분석을 통해 콘텐츠의 성과를 예측하고 최적화합니다."
        },
        {
            icon: <Clock className="text-purple-600" size={32} />,
            title: "압도적인 실행 속도",
            desc: "미국 시장 타겟팅부터 콘텐츠 배포까지. 자동화된 프로세스로 경쟁사보다 빠르게 시장을 선점하세요."
        },
        {
            icon: <Lock className="text-blue-600" size={32} />,
            title: "리스크 제로 보장",
            desc: "업로드되지 않은 콘텐츠는 100% 환불됩니다. 브랜드사의 금전적 손실을 시스템적으로 차단합니다."
        }
    ];

    return (
        <section className="py-24 bg-white relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold text-slate-900 mb-4">Why Brand Slam?</h2>
                    <p className="text-slate-500">성공하는 브랜드들이 우리를 선택하는 이유입니다.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {reasons.map((item, idx) => (
                        <div key={idx} className="flex flex-col items-center text-center p-8 rounded-[2rem] border border-slate-100 hover:border-indigo-100 hover:shadow-xl transition-all duration-300 group">
                            <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mb-6 group-hover:bg-indigo-50 transition-colors">
                                {item.icon}
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                            <p className="text-slate-500 leading-relaxed">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

// 5. CTA Section (Navigation Connected)
const CTA = () => (
  <section className="py-32 relative overflow-hidden bg-[#0B1120]">
    {/* Gradient Background */}
    <div className="absolute inset-0 bg-gradient-to-tr from-indigo-900/40 via-[#0B1120] to-indigo-950/40"></div>
    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px]"></div>

    <div className="max-w-4xl mx-auto px-4 text-center relative z-10 text-white">
      <h2 className="text-4xl md:text-6xl font-extrabold mb-8 leading-tight tracking-tight">
        마케팅의 미래, <br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300">지금 경험하세요.</span>
      </h2>
      <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
        Brand Slam의 모든 기능을 제한 없이.<br />
        카드 등록 없이, 단 3분이면 시작할 수 있습니다.
      </p>
      
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        {/* [Link] Checkout 페이지로 이동 (요청사항 반영) */}
        <Link 
          to="/checkout"
          onClick={() => window.scrollTo(0, 0)}
          className="w-full sm:w-auto px-10 py-5 bg-white text-indigo-900 rounded-full font-bold text-lg hover:bg-indigo-50 transition-all hover:scale-105 shadow-2xl shadow-indigo-900/50 flex items-center justify-center gap-2"
        >
          바로 시작하기
          
        </Link>

        {/* [Link] Consulting 페이지로 이동 (요청사항 반영) */}
        <Link 
          to="/consulting"
          onClick={() => window.scrollTo(0, 0)}
          className="w-full sm:w-auto px-10 py-5 bg-transparent border border-white/20 text-white rounded-full font-bold text-lg hover:bg-white/10 transition-all backdrop-blur-sm flex items-center justify-center gap-2"
        >
          도입 문의하기
        </Link>
      </div>
      
      <div className="mt-12 flex items-center justify-center gap-8 text-sm text-slate-400 font-medium">
         <span className="flex items-center gap-2"><ShieldCheck size={16} className="text-indigo-400"/> 데이터 보안 철저</span>
         <span className="flex items-center gap-2"><Globe size={16} className="text-indigo-400"/> 글로벌 500+ 브랜드 이용중</span>
      </div>
    </div>
  </section>
);

export default function Features() {
  return (
    <div className="font-sans antialiased text-slate-900 bg-slate-50">
      <Navbar />
      <Hero />
      <CoreFeatures />
      <ProcessCycle />
      <WhyBrandSlam />
      <CTA />
      <Footer />
    </div>
  );
}