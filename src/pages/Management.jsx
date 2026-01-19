import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter, ShieldCheck, Search, Zap, BarChart3, Layers, CheckCircle2 } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

export default function Management() {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const steps = [
    {
      icon: <Search size={24} />,
      title: "1. 스크리닝 (Screening)",
      desc: "팔로워 수 대비 조회수, 댓글 반응, 최근 활동성을 분석하여 허수 계정을 1차 필터링합니다."
    },
    {
      icon: <Filter size={24} />,
      title: "2. 적합도 분석 (Matching)",
      desc: "브랜드의 카테고리(스킨케어/메이크업 등)와 인플루언서의 주력 콘텐츠, 오디언스 성향을 매칭합니다."
    },
    {
      icon: <ShieldCheck size={24} />,
      title: "3. 블랙리스트 검증 (Audit)",
      desc: "과거 계약 위반 이력, 먹튀, 성의 없는 콘텐츠 제작 이력이 있는 크리에이터를 데이터베이스에서 제외합니다."
    },
    {
      icon: <Zap size={24} />,
      title: "4. 컨택 및 협상 (Negotiation)",
      desc: "브랜드슬램 전담 매니저가 직접 컨택하여 브랜드의 톤앤매너와 가이드라인을 교육합니다."
    },
    {
      icon: <BarChart3 size={24} />,
      title: "5. 성과 추적 (Tracking)",
      desc: "업로드 후 7일간 데이터를 추적하여 조회수, 인게이지먼트, 전환 기여도를 분석합니다."
    }
  ];

  return (
    <div className="font-sans text-slate-900 bg-white min-h-screen flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 px-4 sm:px-6 lg:px-8 bg-slate-900 text-white overflow-hidden">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/50 text-indigo-300 text-sm font-bold uppercase tracking-widest mb-6">
            Systematic Creator Management
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6 leading-tight">
            성공적인 캠페인은<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">철저한 검증 시스템</span>에서 시작됩니다
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            단순히 팔로워가 많은 사람이 아닌, <br className="hidden md:block" />
            우리 브랜드에 진심으로 반응할 '진성 오디언스'를 가진 크리에이터를 찾습니다.
          </p>
        </div>
      </section>

      {/* 5-Step Process */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900">5단계 검증 프로세스</h2>
            <p className="text-slate-500 mt-2">브랜드슬램만의 엄격한 기준으로 최상의 퀄리티를 유지합니다.</p>
          </div>

          <div className="relative">
            {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute left-[50%] top-0 bottom-0 w-0.5 bg-slate-200 -translate-x-1/2"></div>

            <div className="space-y-12 relative z-10">
              {steps.map((step, idx) => (
                <div key={idx} className={`flex flex-col md:flex-row items-center gap-8 ${idx % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>
                  <div className="flex-1 w-full md:w-1/2"></div>
                  
                  {/* Step Icon Center */}
                  <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg ring-4 ring-white z-20 shrink-0">
                    <span className="font-bold">{idx + 1}</span>
                  </div>

                  {/* Content Box */}
                  <div className="flex-1 w-full md:w-1/2">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow text-center md:text-left">
                      <div className={`w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 mx-auto md:mx-0`}>
                        {step.icon}
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">{step.title}</h3>
                      <p className="text-slate-600 text-sm leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Tier System */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900">체계적인 티어(Tier) 관리</h2>
            <p className="text-slate-500 mt-2">브랜드 단계에 맞춰 최적화된 인플루언서 그룹을 제안합니다.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { lv: "L3", title: "Micro", range: "20K - 80K", desc: "높은 관여도와 가성비, 공동구매 및 바이럴 확산에 최적화", color: "bg-blue-50 border-blue-100 text-blue-700" },
              { lv: "L4", title: "Mid-Tier", range: "80K - 200K", desc: "제품에 대한 신뢰도와 전문성 보유, 브랜딩 강화 목적", color: "bg-indigo-50 border-indigo-100 text-indigo-700" },
              { lv: "L5", title: "Premium", range: "200K - 500K", desc: "TVC급 고퀄리티 영상 제작, 확실한 전환과 인지도 상승", color: "bg-purple-50 border-purple-100 text-purple-700" },
              { lv: "L6", title: "Top-Tier", range: "500K +", desc: "글로벌 파급력을 가진 메가 인플루언서, 트렌드 리딩", color: "bg-pink-50 border-pink-100 text-pink-700" },
            ].map((tier, idx) => (
              <div key={idx} className={`p-6 rounded-2xl border ${tier.color} flex flex-col items-center text-center transition-transform hover:-translate-y-1`}>
                <div className="text-2xl font-black mb-2">{tier.lv}</div>
                <div className="text-sm font-bold uppercase tracking-wider mb-4 opacity-80">{tier.title}</div>
                <div className="text-3xl font-bold mb-4">{tier.range}</div>
                <p className="text-sm opacity-90 leading-relaxed">{tier.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* QC Promise */}
      <section className="py-20 px-4 bg-slate-900 text-white text-center">
        <div className="max-w-3xl mx-auto">
          <Layers size={48} className="mx-auto mb-6 text-indigo-400 opacity-80" />
          <h2 className="text-2xl md:text-3xl font-bold mb-6">
            "단 한 명의 불량 인플루언서도 허용하지 않습니다"
          </h2>
          <p className="text-slate-400 mb-10 leading-relaxed">
            브랜드슬램은 자체 구축한 블랙리스트 데이터베이스를 통해<br />
            연락 두절, 제품 먹튀, 가이드 미준수 이력이 있는 인플루언서를 원천 차단합니다.<br />
            안심하고 캠페인 성과에만 집중하세요.
          </p>
          <button 
            onClick={() => navigate('/pricing')}
            className="px-8 py-3 bg-white text-slate-900 font-bold rounded-xl hover:bg-indigo-50 transition-colors"
          >
            캠페인 시작하기
          </button>
        </div>
      </section>

      <Footer />
    </div>
  );
}