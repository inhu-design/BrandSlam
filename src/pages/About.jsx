import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, TrendingUp, Users, Target, ArrowRight } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

export default function About() {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="font-sans text-white bg-[#0F172A] min-h-screen flex flex-col">
      <Navbar />

      {/* Hero Section - Dark Theme */}
      <section className="relative pt-40 pb-20 px-4 sm:px-6 lg:px-8 bg-slate-900 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
            <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-600/30 rounded-full mix-blend-screen filter blur-[100px] opacity-30 animate-blob"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/30 rounded-full mix-blend-screen filter blur-[100px] opacity-30 animate-blob animation-delay-2000"></div>
        </div>

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
            K-Beauty의 글로벌 도약을 위한<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">가장 확실한 러닝메이트</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            브랜드슬램은 복잡하고 불투명했던 인플루언서 마케팅 시장을 <br className="hidden md:block" />
            데이터와 기술로 혁신하여 브랜드의 성장을 가속화합니다.
          </p>
        </div>
      </section>

      {/* Mission & Vision - Dark Theme */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[#0F172A]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-block px-3 py-1 bg-indigo-500/20 border border-indigo-400/50 text-indigo-300 rounded-full text-sm font-bold mb-4 uppercase tracking-wider">OUR MISSION</div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight text-white">
                "좋은 제품이 국경을 넘어<br />더 많은 사람에게 닿을 수 있도록"
              </h2>
              <div className="space-y-4 text-slate-300 leading-relaxed">
                <p>
                  우리는 뛰어난 제품력을 가진 한국의 뷰티 브랜드들이 해외 마케팅의 장벽에 부딪혀 기회를 놓치는 것을 수없이 목격했습니다.
                </p>
                <p>
                  언어의 장벽, 현지 네트워크의 부재, 불투명한 비용 구조. 브랜드슬램은 이 모든 문제를 <strong>'자동화 시스템'</strong>으로 해결합니다.
                </p>
                <p>
                  단순한 중개 플랫폼을 넘어, 브랜드가 오직 제품 개발에만 집중할 수 있도록 마케팅의 모든 과정을 책임지는 파트너가 되겠습니다.
                </p>
              </div>
            </div>
            
            {/* [수정됨] 이미지 + 오버레이 텍스트 영역 */}
            <div className="relative rounded-3xl h-[400px] flex items-center justify-center border border-white/10 shadow-2xl overflow-hidden group">
              
              {/* 배경 이미지 (데이터/대시보드 테마) */}
              <img 
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80" 
                alt="Data Dashboard" 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              
              {/* 다크 오버레이 (텍스트 가독성을 높이기 위해 이미지를 어둡게 누름) */}
              <div className="absolute inset-0 bg-slate-900/70 mix-blend-multiply"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-transparent to-transparent opacity-90"></div>
              
              {/* 텍스트 컨텐츠 */}
              <div className="relative z-10 text-center p-8 transform transition-transform duration-500 group-hover:-translate-y-2">
                <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-4 border border-white/20">
                  <Globe size={24} className="text-indigo-300" />
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">Connecting Brands to the World</h3>
                <p className="text-indigo-300 font-medium tracking-wide">데이터가 이끄는 K-Beauty의 새로운 물결</p>
              </div>
              
            </div>
          </div>
        </div>
      </section>

      {/* Key Values - Dark Theme */}
      <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
        {/* 배경 장식 추가 */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-900/30 rounded-full blur-[120px] pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 text-white">우리가 일하는 방식</h2>
            <p className="text-slate-400">브랜드슬램은 세 가지 핵심 가치를 통해 성과를 만듭니다.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white/5 p-8 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors hover:-translate-y-1 duration-300">
              <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/30">
                <TrendingUp size={24} className="text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Data-Driven</h3>
              <p className="text-slate-400 leading-relaxed">
                감에 의존하지 않습니다. 철저한 데이터 분석을 통해 구매 전환율이 높은 크리에이터를 선별하고 매칭합니다.
              </p>
            </div>
            <div className="bg-white/5 p-8 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors hover:-translate-y-1 duration-300">
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-purple-500/30">
                <Target size={24} className="text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Focus on Results</h3>
              <p className="text-slate-400 leading-relaxed">
                단순 노출이 아닌 '매출'과 '팬덤'을 만듭니다. 브랜드의 KPI를 최우선으로 고려하여 캠페인을 설계합니다.
              </p>
            </div>
            <div className="bg-white/5 p-8 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors hover:-translate-y-1 duration-300">
              <div className="w-12 h-12 bg-pink-500 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-pink-500/30">
                <Users size={24} className="text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">Transparency</h3>
              <p className="text-slate-400 leading-relaxed">
                모든 과정은 투명하게 공개됩니다. 대시보드를 통해 실시간으로 진행 상황과 성과를 확인할 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Dark Theme */}
      <section className="py-24 px-4 text-center bg-[#0F172A]">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-indigo-900/50 to-purple-900/50 rounded-3xl p-12 border border-indigo-500/30 shadow-2xl relative overflow-hidden">
          {/* 배경 효과 */}
          <div className="absolute inset-0 bg-grid-white/[0.05] bg-[length:20px_20px]"></div>
          
          <div className="relative z-10">
            <h2 className="text-3xl font-bold text-white mb-6 leading-tight">
                브랜드슬램과 함께<br />글로벌 시장을 선점하세요
            </h2>
            <button 
                onClick={() => navigate('/consulting')}
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-slate-900 font-bold rounded-xl hover:bg-indigo-50 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
                전문가와 상담하기 <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}