import React, { useEffect } from 'react';


import { 
  Video, 
  MessageSquare, 
  Calendar as CalendarIcon, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Crown, 
  HelpCircle, 
  Handshake,
  User,
  Building,
  Phone,
  Ban,
  Layers,
  Zap
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';


const Hero = () => (
  <section className="relative pt-40 pb-24 overflow-hidden bg-[#020617]">
    {/* Fluid Background (Ref 1 스타일 계승) */}
    <div className="absolute inset-0 z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-600/10 rounded-full blur-[140px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[140px] animate-pulse delay-1000"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 pointer-events-none"></div>
    </div>
    
    <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
      <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 text-xs font-black text-cyan-400 mb-8 tracking-[0.3em] uppercase">
        <Sparkles size={14} className="animate-pulse" /> Premium Consulting
      </div>
      
      <h1 className="text-5xl md:text-8xl font-black text-white tracking-tighter mb-10 leading-none">
        전문가와 직접<br/>
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400">
          성공 전략을 논의하세요
        </span>
      </h1>
      
      <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-400 mb-10 leading-relaxed font-light break-keep">
        브랜드의 현재 상황을 진단하고, 가장 효율적인<br/> <span className="text-white font-medium italic underline underline-offset-4 decoration-purple-500">미국 진출 로드맵</span>을 그려드립니다.
      </p>
    </div>
  </section>
);

export default function Consulting() {

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="font-sans antialiased text-white bg-[#020617] min-h-screen flex flex-col selection:bg-purple-500/30">
      <Navbar />
      <Hero />

      <div className="flex-1 pb-32 px-4 sm:px-6 lg:px-8 -mt-16 relative z-20">
        <div className="max-w-6xl mx-auto">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-24">
            
            {/* [변경됨] 버튼(button) 태그를 앵커(a) 태그로 변경하고 href 적용 */}
            <a 
              href="https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ0akmWGcWqQjDrQbXiu-G2BuVVcPvtzZWr2riyzi2dfD2UvvyZp_NveNX6fFlqnt8BVm2fQFdJ6"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative p-10 rounded-[3rem] border-2 border-white/5 bg-white/5 backdrop-blur-md hover:border-white/20 transition-all duration-500 overflow-hidden text-left shadow-2xl block"
            >
              <div className="flex justify-between items-start mb-8">
                <div className="p-5 rounded-[1.5rem] bg-white/10 text-slate-300 group-hover:bg-purple-600 group-hover:text-white transition-all duration-500 shadow-xl">
                  <Video size={36} />
                </div>
                <ArrowRight className="text-slate-600 group-hover:text-purple-400 group-hover:translate-x-2 transition-all" size={28} />
              </div>
              <h3 className="text-3xl font-black text-white mb-4 tracking-tighter">화상 미팅 예약</h3>
              <p className="text-slate-400 font-light leading-relaxed">Zoom/Google Meet을 통해 화면을 공유하며<br/> 실시간으로 심도 깊은 전략을 논의합니다.</p>
            </a>

            <a 
              href="http://pf.kakao.com/_VxmWxon/chat"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative p-10 rounded-[3rem] border-2 border-white/5 bg-white/5 backdrop-blur-md hover:border-white/20 transition-all duration-500 overflow-hidden text-left cursor-pointer shadow-2xl"
            >
              <div className="absolute top-8 right-10 bg-cyan-500 text-slate-900 text-[10px] font-black px-4 py-1.5 rounded-full tracking-widest uppercase">
                Now Online
              </div>
              <div className="flex justify-between items-start mb-8">
                <div className="p-5 rounded-[1.5rem] bg-white/10 text-slate-300 group-hover:bg-cyan-500 group-hover:text-slate-900 transition-all duration-500 shadow-xl">
                  <MessageSquare size={36} />
                </div>
              </div>
              <h3 className="text-3xl font-black text-white mb-4 tracking-tighter">실시간 채팅 상담</h3>
              <p className="text-slate-400 font-light leading-relaxed">간단한 궁금증을 즉시 해결해드리는<br/> 카카오톡 1:1 전담 매니저 상담이 가능합니다.</p>
            </a>
          </div>

       
        </div>
      </div>
      <Footer />
    </div>
  );
}