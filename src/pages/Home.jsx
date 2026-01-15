import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  CheckCircle2, 
  Play, 
  Video,
} from 'lucide-react';
import Navbar from '../components/layout/Navbar'; 
import Footer from '../components/layout/Footer';

// --- Components ---

const Hero = () => (
  <section className="relative pt-32 pb-20 md:pt-48 md:pb-40 overflow-hidden bg-slate-50">
    <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-300 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-blob"></div>
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-300 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] bg-indigo-300 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-blob animation-delay-4000"></div>
    </div>
    
    <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
      {/* 뱃지: 이미 애니메이션 적용됨 */}
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-indigo-100 text-xs font-bold text-indigo-600 mb-8 shadow-sm animate-fade-in-up ring-1 ring-indigo-50">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
        </span>
        US Market Automation Solution
      </div>
      
      {/* [수정] 타이틀 애니메이션 추가 (delay-100) */}
      <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-normal mb-8 leading-snug drop-shadow-sm animate-fade-in-up animation-delay-100">
        미국 시장 진출
        <span className="block mt-3 md:mt-5 text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600">
          해답은 '시스템' 입니다
        </span>
      </h1>
      
      {/* [수정] 설명글 애니메이션 추가 (delay-200) */}
      <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-500 mb-12 leading-relaxed animate-fade-in-up animation-delay-200">
        수량만 선택하면 콘텐츠는 매달 자동으로 공급됩니다.<br className="hidden md:block" />
        Brand Slam은 '만드는 일'이 아닌 '안정적으로 공급받는 구조'를 제공합니다.
      </p>
      
      {/* [수정] 버튼 그룹 애니메이션 추가 (delay-300) */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up animation-delay-300">
        <Link 
          to="/pricing" 
          onClick={() => window.scrollTo(0, 0)}
          className="w-full sm:w-auto px-8 py-4 bg-slate-900 text-white rounded-full font-bold text-lg hover:bg-indigo-600 transition-all hover:scale-105 shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2"
        >
          플랜 살펴보기
          <ArrowRight size={20} />
        </Link>
        
        <Link 
          to="/customers"
          onClick={() => window.scrollTo(0, 0)}
          className="w-full sm:w-auto px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-full font-bold text-lg hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 group"
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

const LogoCloud = () => {
  // 로고 데이터
  const logos = [
    { name: "ISNTREE", font: "font-serif" },
    { name: "SKIN&LAB", font: "font-sans" },
    { name: "CLEARDEAR", font: "font-mono" },
    { name: "CELIMAX", font: "italic" },
    { name: "PYUNKANG YUL", font: "" },
    // 롤링 효과가 자연스럽도록 몇 개 더 추가하거나 반복
    { name: "ROUND LAB", font: "font-serif" },
    { name: "ANUA", font: "font-sans" },
  ];

  // 무한 롤링을 위해 리스트 복제
  const duplicatedLogos = [...logos, ...logos, ...logos];

  return (
    <section className="py-10 border-y border-slate-100 bg-white overflow-hidden relative">
      {/* 롤링 애니메이션 스타일 정의 */}
      <style>
        {`
          @keyframes scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .animate-scroll {
            display: flex;
            width: max-content;
            animation: scroll 30s linear infinite;
          }
          .animate-scroll:hover {
            animation-play-state: paused;
          }
        `}
      </style>

      <div className="max-w-full mx-auto px-4 text-center">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">Trusted by Global Beauty Brands</p>
        
        {/* 마스크 효과 (양옆 페이드 아웃) */}
        <div className="relative w-full overflow-hidden mask-linear-gradient">
           <div className="absolute left-0 top-0 w-20 h-full bg-gradient-to-r from-white to-transparent z-10"></div>
           <div className="absolute right-0 top-0 w-20 h-full bg-gradient-to-l from-white to-transparent z-10"></div>

           {/* 로고 트랙 */}
           <div className="animate-scroll gap-16 md:gap-24 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
              {duplicatedLogos.map((logo, index) => (
                <span 
                  key={index} 
                  className={`text-xl md:text-2xl font-bold text-slate-900 whitespace-nowrap ${logo.font}`}
                >
                  {logo.name}
                </span>
              ))}
           </div>
        </div>
      </div>
    </section>
  );
};

const FeatureSection = ({ title, subtitle, description, features, image, reversed }) => (
  <section className="py-24 md:py-32 overflow-hidden bg-slate-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className={`flex flex-col md:flex-row items-center gap-16 ${reversed ? 'md:flex-row-reverse' : ''}`}>
        
        <div className="flex-1 space-y-8">
          <div className="inline-block px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100">
              <h3 className="text-xs font-bold text-indigo-600 tracking-widest uppercase">{subtitle}</h3>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-snug tracking-normal">
            {title}
          </h2>
          
          <div className="text-lg text-slate-500 leading-relaxed">
            {description}
          </div>
          
          <div className="space-y-4 pt-2">
            {features.map((feature, idx) => (
              <div key={idx} className="flex items-start gap-4 p-4 rounded-xl hover:bg-white hover:shadow-lg hover:shadow-slate-100 border border-transparent transition-all duration-300">
                <div className="mt-1 p-2 rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">{feature.title}</h4>
                  <p className="text-sm text-slate-500 leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 relative group">
           <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-r ${reversed ? 'from-indigo-200/50 to-purple-200/50' : 'from-blue-200/50 to-indigo-200/50'} rounded-full blur-3xl opacity-40 group-hover:opacity-60 transition-opacity duration-500`}></div>
           <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-indigo-500/10 border border-white/50 bg-white/30 backdrop-blur-sm transform transition-transform hover:-translate-y-2 duration-700">
             <img 
               src={image} 
               alt="Feature Visualization" 
               className="w-full h-auto object-cover"
             />
             <div className="absolute inset-0 bg-gradient-to-t from-slate-900/5 via-transparent to-transparent"></div>
           </div>
        </div>

      </div>
    </div>
  </section>
);

const HomeFeatures = () => (
  <>
    {/* [수정] 줄바꿈 요청 반영 */}
    <FeatureSection 
      subtitle="STABLE SUPPLY"
      title={
        <>
          콘텐츠, 이제 '제작'하지 말고
          <span className="block mt-2 md:mt-3">'구독'하세요.</span>
        </>
      }
      description={
        <>
          매달 반복되는 기획과 섭외 스트레스에서 벗어나세요.<br className="hidden md:block"/>
          Brand Slam은 브랜드 운영에 필수적인 콘텐츠를 안정적으로 공급하는<br className="hidden md:block"/>
          파이프라인을 구축해드립니다.
        </>
      }
      features={[
        { title: '수량 중심의 간편함', desc: '복잡한 기획 없이, 필요한 콘텐츠 개수만 선택하면 됩니다.' },
        { title: '매달 자동 공급', desc: '매월 새로운 인플루언서와 콘텐츠가 끊김 없이 연결됩니다.' },
        { title: '일회성이 아닌 구조화', desc: '단발성 시딩의 한계를 넘어 지속 가능한 마케팅 자산을 만듭니다.' }
      ]}
      image="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1000"
      reversed={false}
    />
    
    {/* [수정] 줄바꿈 요청 반영 */}
    <FeatureSection 
      subtitle="AUTO OPTIMIZATION"
      title={
        <>
          알아서 최적화되는
          <span className="block mt-2 md:mt-3">성과형 콘텐츠</span>
        </>
      }
      description={
        <>
          특정 형태를 강제하지 않습니다.<br className="hidden md:block"/>
          매달 반응도, 저장률, 공유 패턴을 분석하여<br className="hidden md:block"/>
          다음 달 콘텐츠 비중을 가장 효과적인 방향으로 유연하게 조정합니다.
        </>
      }
      features={[
        { title: '자동 포맷 믹스', desc: '얼굴 노출, 제형 강조, 후기형 등 다양한 포맷을 최적의 비율로 제공합니다.' },
        { title: '데이터 기반 운영', desc: '감에 의존하지 않고, 축적된 성과 데이터를 기반으로 움직입니다.' },
        { title: '2차 활용 최적화', desc: '광고 소재 및 상세페이지로 즉시 활용 가능한 고퀄리티 자산이 쌓입니다.' }
      ]}
      image="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1000"
      reversed={true}
    />
  </>
);

const ReferenceSection = () => {
  const references = [
      {
          category: "Hook Reference",
          desc: "초반 3초 이탈을 막는 문제 제기형 훅",
          videoIds: ["7558170371887762710", "7572604502646246664", "7579709590569258271"]
      },
      {
          category: "Texture & Detail",
          desc: "제형의 디테일을 살린 고퀄리티 샷",
          videoIds: ["7435014600048790827", "7505995418094898462", "7562161374080584963"]
      }
  ];

  return (
      <section className="py-24 bg-slate-50 relative border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                  <span className="text-indigo-600 font-bold tracking-widest uppercase text-xs mb-3 block">Real Success Stories</span>
                  
                  <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 leading-snug mb-4 tracking-normal">
                      Brand Slam과 함께한
                      <span className="block mt-2 md:mt-3 text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                        글로벌 성공 캠페인
                      </span>
                  </h2>
                  <p className="text-slate-500 max-w-2xl mx-auto">
                     데이터 기반의 전략으로 만들어낸 실제 성과를 확인하세요.
                  </p>
              </div>

              <div className="grid gap-12">
                  {references.map((item, idx) => (
                      <div key={idx} className="bg-white rounded-3xl p-6 md:p-8 shadow-xl shadow-slate-200/50 relative overflow-hidden group border border-slate-100">
                          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-[60px] opacity-60"></div>
                          
                          <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start md:items-center mb-8">
                              <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                      <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                                          <Video size={20} />
                                      </div>
                                      <h3 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">{item.category}</h3>
                                  </div>
                                  <p className="text-slate-500 font-medium ml-1">{item.desc}</p>
                              </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                              {item.videoIds.map((videoId, vIdx) => (
                                  <div key={vIdx} className="relative aspect-[9/16] rounded-2xl overflow-hidden bg-black shadow-lg border border-slate-100">
                                      <iframe
                                          src={`https://www.tiktok.com/embed/v2/${videoId}`}
                                          className="w-full h-full"
                                          title={`TikTok Video ${videoId}`}
                                          allowFullScreen
                                          scrolling="no"
                                          frameBorder="0"
                                          allow="encrypted-media;"
                                      ></iframe>
                                  </div>
                              ))}
                          </div>
                      </div>
                  ))}
              </div>

              <div className="mt-16 text-center animate-fade-in-up">
                <Link 
                    to="/customers" 
                    onClick={() => window.scrollTo(0, 0)}
                    className="inline-flex items-center gap-2 px-8 py-4 bg-white border border-slate-200 rounded-full text-slate-900 font-bold hover:border-indigo-600 hover:text-indigo-600 transition-all hover:shadow-lg hover:shadow-indigo-500/10 group"
                >
                    더 많은 성공 사례 보기
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform"/>
                </Link>
              </div>
          </div>
      </section>
  );
};

const CTA = () => (
  <section className="py-32 relative overflow-hidden bg-[#0B1120]">
    <div className="absolute inset-0 bg-gradient-to-tr from-indigo-900/40 via-[#0B1120] to-indigo-950/40"></div>
    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px]"></div>

    <div className="max-w-4xl mx-auto px-4 text-center relative z-10 text-white">
      <h2 className="text-4xl md:text-6xl font-extrabold mb-8 leading-snug tracking-normal">
        지금 바로, 
        <span className="block mt-2 md:mt-4 text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300">
          스마트한 마케팅을 시작하세요.
        </span>
      </h2>
      <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
        Brand Slam의 모든 기능을 경험해보세요. <br />
        카드 등록 없이, 지금 바로 시작할 수 있습니다.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link 
          to="/checkout" 
          onClick={() => window.scrollTo(0, 0)}
          className="w-full sm:w-auto px-10 py-5 bg-white text-indigo-900 rounded-full font-bold text-lg hover:bg-indigo-50 transition-all hover:scale-105 shadow-2xl shadow-indigo-900/50 flex items-center justify-center gap-2"
        >
          바로 시작하기
        </Link>
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
          <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-indigo-400"/> 신용카드 필요 없음</span>
          <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-indigo-400"/> 언제든 해지 가능</span>
        </span>
      </p>
    </div>
  </section>
);

export default function Home() {
  return (
    <div className="font-sans antialiased text-slate-900 bg-slate-50 selection:bg-indigo-100 selection:text-indigo-900">
      <Navbar /> 
      <Hero />
      <LogoCloud />
      <HomeFeatures /> 
      <ReferenceSection /> 
      <CTA />
      <Footer /> 
    </div>
  );
}