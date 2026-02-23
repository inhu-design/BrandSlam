import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
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

// --- [Configuration: 원본 유지] ---
const timeSlots = [
  "10:00", "11:00", "13:00", 
  "14:00", "15:00", "16:00"
];

const inquiryCategories = [
  { 
    id: 'PLAN', 
    label: '플랜 도입 문의', 
    icon: <Layers size={22} />,
    placeholder: "관심 있으신 메인 플랜(Starter, Growth, Scale50)과 현재 브랜드의 상황을 알려주세요. 목표 수량과 캠페인 시작 희망 일정을 포함해주시면 더욱 정확한 상담이 가능합니다."
  },
  { 
    id: 'ADDON', 
    label: 'Add-on 부가 서비스 문의', 
    icon: <Zap size={22} />,
    placeholder: "큐레이션 팩, 연락처 팩, Spark Ads 신청 대행 등 관심 있는 부가 서비스와 캠페인 최적화에 대한 고민을 알려주세요."
  },
  { 
    id: 'PARTNER', 
    label: '기타 문의', 
    icon: <Handshake size={22} />,
    placeholder: "제휴 및 협력, 대면 미팅 등 기타 문의사항이 있다면 자유롭게 입력해주세요."
  }
];

// --- [Sub-Components: 리뉴얼 테마 반영] ---

const CustomCalendar = ({ selectedDate, onDateSelect }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="h-12 w-12" />);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6; 
    const isSelected = selectedDate?.toDateString() === date.toDateString();
    const isPast = date < new Date().setHours(0, 0, 0, 0);

    days.push(
      <button
        key={d}
        onClick={() => !isWeekend && !isPast && onDateSelect(date)}
        disabled={isWeekend || isPast}
        className={`h-12 w-12 rounded-2xl flex items-center justify-center text-sm font-bold transition-all relative overflow-hidden
          ${isSelected ? 'bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-[0_0_20px_rgba(147,51,234,0.4)] scale-110 z-10' : ''}
          ${!isSelected && !isWeekend && !isPast ? 'hover:bg-white/10 text-slate-300' : ''}
          ${isWeekend || isPast ? 'text-slate-700 cursor-not-allowed opacity-30' : ''}
        `}
      >
        {d}
        {isSelected && <div className="absolute inset-0 bg-white/10 animate-pulse pointer-events-none"></div>}
      </button>
    );
  }

  const monthNames = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];

  return (
    <div className="p-6 bg-white/5 backdrop-blur-2xl rounded-[2.5rem] border border-white/10 shadow-2xl max-w-sm mx-auto md:mx-0 relative overflow-hidden group">
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-all"></div>
      <div className="flex justify-between items-center mb-8 px-2 relative z-10">
        <button onClick={handlePrevMonth} className="p-2 hover:bg-white/10 rounded-xl text-slate-400 transition-colors"><ChevronLeft size={20} /></button>
        <span className="font-black text-white text-lg tracking-tighter">{year}년 {monthNames[month]}</span>
        <button onClick={handleNextMonth} className="p-2 hover:bg-white/10 rounded-xl text-slate-400 transition-colors"><ChevronRight size={20} /></button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center mb-4 relative z-10">
        {['일', '월', '화', '수', '목', '금', '토'].map((day, i) => (
          <span key={day} className={`text-[10px] font-black uppercase tracking-widest ${i === 0 ? 'text-red-500/70' : i === 6 ? 'text-blue-400/70' : 'text-slate-500'}`}>
            {day}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 place-items-center relative z-10">
        {days}
      </div>
    </div>
  );
};

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
  const navigate = useNavigate();
  const { user } = useAuth(); 
  const [selectedType, setSelectedType] = useState(null);
  
  // Form States
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [category, setCategory] = useState(inquiryCategories[0]); 
  const [detail, setDetail] = useState('');
  
  const [userInfo, setUserInfo] = useState({
    name: '',
    phone: '',
    company: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [takenTimes, setTakenTimes] = useState([]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (selectedDate) {
      const fetchTakenTimes = async () => {
        const dateStr = selectedDate.toLocaleDateString('en-CA'); 

        const { data, error } = await supabase
          .from('consulting_requests')
          .select('preferred_time')
          .eq('preferred_date', dateStr)
          .neq('status', 'cancelled');

        if (error) {
          console.error("Error fetching times:", error);
        } else {
          const times = data.map(item => item.preferred_time);
          setTakenTimes(times);
          setSelectedTime(null);
        }
      };

      fetchTakenTimes();
    }
  }, [selectedDate]);

  const handleTypeSelect = (type) => {
    setSelectedType(type);
    setTimeout(() => {
      document.getElementById('booking-form').scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleUserInfoChange = (e) => {
    setUserInfo({ ...userInfo, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!isFormValid || isSubmitting) return;
    if (!user) {
      alert('로그인이 만료되었거나 로그인이 필요한 서비스입니다. 다시 로그인해 주세요.');
       navigate('/login');
      return; 
    }
    
    setIsSubmitting(true);

    try {
      const dateStr = selectedDate.toLocaleDateString('en-CA');

      const { error } = await supabase
        .from('consulting_requests')
        .insert([
          {
            user_id: user.id, 
            name: userInfo.name,
            company: userInfo.company,
            phone: userInfo.phone,
            category: category.label,
            topic_detail: detail,
            preferred_date: dateStr,
            preferred_time: selectedTime,
            status: 'pending'
          }
        ]);

      if (error) throw error;

      alert(`[예약 완료]\n\n일시: ${dateStr} ${selectedTime}\n주제: ${category.label}\n\n입력하신 연락처로 줌(Zoom) 링크를 보내드립니다.`);
      
      window.scrollTo(0, 0); 
      navigate('/');

    } catch (error) {
      console.error('Error inserting data:', error);
      alert('예약 처리 중 오류가 발생했습니다. 이미 마감된 시간일 수 있습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = selectedDate && selectedTime && detail.length > 5 && userInfo.name && userInfo.phone;

  return (
    <div className="font-sans antialiased text-white bg-[#020617] min-h-screen flex flex-col selection:bg-purple-500/30">
      <Navbar />
      <Hero />

      <div className="flex-1 pb-32 px-4 sm:px-6 lg:px-8 -mt-16 relative z-20">
        <div className="max-w-6xl mx-auto">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-24">
            <button 
              onClick={() => handleTypeSelect('video')}
              className={`group relative p-10 rounded-[3rem] border-2 text-left transition-all duration-500 overflow-hidden ${
                selectedType === 'video' 
                ? 'border-purple-500 bg-gradient-to-br from-purple-900/40 to-blue-900/40 shadow-[0_0_50px_rgba(168,85,247,0.3)]' 
                : 'border-white/5 bg-white/5 backdrop-blur-md hover:border-white/20'
              }`}
            >
              <div className="flex justify-between items-start mb-8">
                <div className={`p-5 rounded-[1.5rem] ${selectedType === 'video' ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' : 'bg-white/10 text-slate-300 group-hover:bg-purple-600 group-hover:text-white'} transition-all duration-500 shadow-xl`}>
                  <Video size={36} />
                </div>
                {selectedType === 'video' && <CheckCircle2 className="text-cyan-400 animate-bounce" size={28} />}
              </div>
              <h3 className="text-3xl font-black text-white mb-4 tracking-tighter">화상 미팅 예약</h3>
              <p className="text-slate-400 font-light leading-relaxed">Zoom/Google Meet을 통해 화면을 공유하며<br/> 실시간으로 심도 깊은 전략을 논의합니다.</p>
            </button>

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

          {selectedType === 'video' && (
            <div id="booking-form" className="bg-[#0f172a]/80 backdrop-blur-3xl rounded-[4rem] border border-white/10 overflow-hidden animate-fade-in-up shadow-[0_0_100px_rgba(0,0,0,0.5)]">
              <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 p-10 text-white flex justify-between items-center border-b border-white/5">
                <div>
                  <h2 className="text-3xl font-black flex items-center gap-3 tracking-tighter uppercase">
                    <CalendarIcon className="text-purple-400" size={32} /> Booking Details
                  </h2>
                  <p className="text-slate-400 font-light mt-2">입력하신 정보는 상담 준비를 위한 목적으로만 사용됩니다.</p>
                </div>
              </div>

              <div className="p-10 md:p-20 space-y-20">
                
                {/* Section 1: User Info */}
                <section>
                  <h3 className="text-xl font-black text-white mb-10 flex items-center gap-4 tracking-widest uppercase">
                    <span className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center text-sm font-black border border-purple-500/30">01</span>
                    Applicant Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                      { label: "이름 (필수)", name: "name", icon: User, placeholder: "홍길동" },
                      { label: "연락처 (필수)", name: "phone", icon: Phone, placeholder: "010-1234-5678" },
                      { label: "회사명", name: "company", icon: Building, placeholder: "brand-slam" }
                    ].map((input, idx) => (
                      <div key={idx}>
                        <label className="block text-xs font-black text-slate-500 mb-4 uppercase tracking-[0.2em]">{input.label}</label>
                        <div className="relative group">
                          <input.icon size={18} className="absolute left-4 top-4 text-slate-500 group-focus-within:text-purple-400 transition-colors" />
                          <input 
                            type="text" 
                            name={input.name}
                            value={userInfo[input.name]}
                            onChange={handleUserInfoChange}
                            placeholder={input.placeholder} 
                            className="w-full pl-12 pr-6 py-4 bg-white/5 rounded-2xl border border-white/10 focus:border-purple-500 focus:bg-white/10 outline-none transition-all text-white placeholder:text-slate-600" 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <div className="h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>

                {/* Section 2: Date & Time */}
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-20">
                  <div>
                    <h3 className="text-xl font-black text-white mb-10 flex items-center gap-4 tracking-widest uppercase">
                      <span className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center text-sm font-black border border-purple-500/30">02</span>
                      Select Date
                    </h3>
                    <CustomCalendar selectedDate={selectedDate} onDateSelect={setSelectedDate} />
                  </div>

                  <div>
                    <h3 className="text-xl font-black text-white mb-10 flex items-center gap-4 tracking-widest uppercase">
                      <span className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center text-sm font-black border border-purple-500/30">03</span>
                      Select Time
                    </h3>
                    {!selectedDate ? (
                        <div className="h-[300px] flex flex-col items-center justify-center text-slate-600 bg-white/5 border-2 border-dashed border-white/5 rounded-[2.5rem] group">
                            <CalendarIcon size={48} className="mb-4 opacity-20 group-hover:animate-bounce"/>
                            <p className="text-sm font-black tracking-widest uppercase">First, pick a date</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 gap-4">
                            {timeSlots.map((time) => {
                                const isTaken = takenTimes.includes(time);
                                return (
                                    <button
                                        key={time}
                                        onClick={() => !isTaken && setSelectedTime(time)}
                                        disabled={isTaken}
                                        className={`py-5 rounded-2xl text-sm font-black transition-all relative overflow-hidden ${
                                            isTaken
                                            ? 'bg-white/5 text-slate-700 cursor-not-allowed border border-white/5'
                                            : selectedTime === time
                                                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-[0_0_20px_rgba(147,51,234,0.4)] scale-105'
                                                : 'bg-white/5 border border-white/10 text-slate-400 hover:border-purple-500/50 hover:text-white'
                                        }`}
                                    >
                                        {time}
                                        {isTaken && <Ban size={20} className="absolute inset-0 m-auto text-slate-800 opacity-20" />}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                  </div>
                </section>

                <div className="h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>

                {/* Section 4: Topic & Detail (Ref 3 카드 스타일 적용) */}
                <section>
                  <h3 className="text-xl font-black text-white mb-10 flex items-center gap-4 tracking-widest uppercase">
                    <span className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center text-sm font-black border border-purple-500/30">04</span>
                    Project Details
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    {inquiryCategories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setCategory(cat)}
                            className={`p-8 rounded-[2rem] border-2 text-left transition-all flex flex-col gap-4 relative overflow-hidden group ${
                                category.id === cat.id
                                ? 'border-purple-500 bg-purple-500/10 text-white'
                                : 'border-white/5 bg-white/5 text-slate-500 hover:border-white/10'
                            }`}
                        >
                            <div className={`${category.id === cat.id ? 'text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)]' : 'text-slate-600'} transition-all`}>
                                {cat.icon}
                            </div>
                            <span className="font-black text-sm tracking-tighter uppercase">{cat.label}</span>
                            {category.id === cat.id && <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-purple-500/20 blur-xl"></div>}
                        </button>
                    ))}
                  </div>

                  <div className="relative group">
                    <textarea
                        value={detail}
                        onChange={(e) => setDetail(e.target.value)}
                        placeholder={category.placeholder}
                        className="w-full h-56 p-8 rounded-[2.5rem] bg-white/5 border border-white/10 focus:border-purple-500 focus:bg-white/10 outline-none resize-none transition-all text-white placeholder:text-slate-600 leading-relaxed font-light"
                    ></textarea>
                    <div className="absolute bottom-6 right-8 text-[10px] font-black text-slate-600 bg-black/40 px-3 py-1 rounded-full uppercase tracking-[0.1em]">
                        Characters: {detail.length}
                    </div>
                  </div>
                </section>

                <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-10">
                  <div className="text-slate-500 text-xs font-medium space-y-2">
                    <p className="flex items-center gap-2"><CheckCircle2 size={14} className="text-cyan-400"/> 예약 확정 시 기재된 연락처로 줌(Zoom) 접속 링크가 자동 발송됩니다.</p>
                    <p className="flex items-center gap-2"><CheckCircle2 size={14} className="text-cyan-400"/> 변경 및 취소는 원활한 운영을 위해 예약 시간 24시간 전까지 가능합니다.</p>
                  </div>
                  <button
                    onClick={handleSubmit}
                    disabled={!isFormValid || isSubmitting}
                    className={`group w-full md:w-auto px-16 py-6 rounded-full font-black text-xl flex items-center justify-center gap-3 transition-all duration-500 ${
                      isFormValid && !isSubmitting
                      ? 'bg-white text-slate-900 hover:scale-105 shadow-[0_0_30px_rgba(255,255,255,0.2)]'
                      : 'bg-white/5 text-slate-700 cursor-not-allowed border border-white/5'
                    }`}
                  >
                    {isSubmitting ? 'Processing...' : 'Confirm Reservation'} 
                    <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" />
                  </button>
                </div>

              </div>
            </div>
          )}

        </div>
      </div>

      <Footer />
    </div>
  );
}