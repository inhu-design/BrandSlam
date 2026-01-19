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
  Ban
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

// --- Configuration ---
const timeSlots = [
  "10:00", "11:00", "13:00", 
  "14:00", "15:00", "16:00"
];

const inquiryCategories = [
  { 
    id: 'UNLIMITED', 
    label: 'Unlimited 플랜 도입', 
    icon: <Crown size={18} />,
    placeholder: "현재 운영 중인 브랜드 규모와 월평균 희망 콘텐츠 수량 등, 브랜드 특성을 알려주세요. Unlimited 플랜의 구체적인 단가표와 제공 범위가 궁금합니다."
  },
  { 
    id: 'GENERAL', 
    label: '일반 시딩 문의', 
    icon: <Sparkles size={18} />,
    placeholder: "어떤 플랜 도입을 고려 중인지, 브랜드의 고민을 알려주세요"
  },
  { 
    id: 'PARTNER', 
    label: '기타 문의', 
    icon: <Handshake size={18} />,
    placeholder: "대면 미팅, 제휴 및 협력 등 다양한 문의사항이 있다면 알려주세요"
  }
];

// --- Sub-Components ---

// Custom Calendar (Naver Style)
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
    days.push(<div key={`empty-${i}`} className="h-10 w-10" />);
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
        className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-medium transition-all
          ${isSelected ? 'bg-indigo-600 text-white shadow-md scale-110' : ''}
          ${!isSelected && !isWeekend && !isPast ? 'hover:bg-indigo-50 text-slate-700' : ''}
          ${isWeekend || isPast ? 'text-slate-300 cursor-not-allowed' : ''}
        `}
      >
        {d}
      </button>
    );
  }

  const monthNames = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];

  return (
    <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm max-w-sm mx-auto md:mx-0">
      <div className="flex justify-between items-center mb-4 px-2">
        <button onClick={handlePrevMonth} className="p-1 hover:bg-slate-100 rounded-full text-slate-500"><ChevronLeft size={20} /></button>
        <span className="font-bold text-slate-900">{year}년 {monthNames[month]}</span>
        <button onClick={handleNextMonth} className="p-1 hover:bg-slate-100 rounded-full text-slate-500"><ChevronRight size={20} /></button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {['일', '월', '화', '수', '목', '금', '토'].map((day, i) => (
          <span key={day} className={`text-xs font-bold ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-slate-400'}`}>
            {day}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 place-items-center">
        {days}
      </div>
    </div>
  );
};

const Hero = () => (
  <section className="relative pt-32 pb-20 overflow-hidden bg-slate-50">
    <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-purple-300 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-blob"></div>
        <div className="absolute bottom-[-10%] left-[10%] w-[40%] h-[40%] bg-indigo-300 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-blob animation-delay-2000"></div>
    </div>
    
    <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-indigo-100 text-xs font-bold text-indigo-600 mb-6 shadow-sm">
        <Sparkles size={12} fill="currentColor" /> Premium Consulting
      </div>
      <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-6 leading-tight">
        전문가와 직접<br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">성공 전략을 논의하세요</span>
      </h1>
      <p className="max-w-2xl mx-auto text-lg text-slate-500 mb-10">
        브랜드의 현재 상황을 진단하고, 가장 효율적인 미국 진출 로드맵을 그려드립니다.
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
    <div className="font-sans antialiased text-slate-900 bg-slate-50 min-h-screen flex flex-col">
      <Navbar />
      <Hero />

      <div className="flex-1 pb-24 px-4 sm:px-6 lg:px-8 -mt-10 relative z-20">
        <div className="max-w-5xl mx-auto">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
            <button 
              onClick={() => handleTypeSelect('video')}
              className={`group relative p-8 rounded-3xl border-2 text-left transition-all duration-300 overflow-hidden ${
                selectedType === 'video' 
                ? 'border-indigo-600 bg-white shadow-xl shadow-indigo-100 ring-4 ring-indigo-50' 
                : 'border-white bg-white/60 hover:bg-white hover:border-indigo-200 hover:shadow-lg'
              }`}
            >
              <div className="flex justify-between items-start mb-6">
                <div className={`p-4 rounded-2xl ${selectedType === 'video' ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white'} transition-colors`}>
                  <Video size={32} />
                </div>
                {selectedType === 'video' && <CheckCircle2 className="text-indigo-600" size={24} />}
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">화상 미팅 예약</h3>
              <p className="text-slate-500">Zoom/Google Meet을 통해 화면을 공유하며 심도 깊은 전략을 논의합니다.</p>
            </button>

            {/* 실시간 채팅 상담 (카카오톡 연동 수정 완료) */}
            <a 
              href="http://pf.kakao.com/_VxmWxon/chat"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative p-8 rounded-3xl border-2 border-white bg-white/60 hover:bg-white hover:border-indigo-200 hover:shadow-lg transition-all duration-300 overflow-hidden text-left cursor-pointer"
            >
              <div className="absolute top-6 right-6 bg-indigo-50 text-indigo-600 text-xs font-bold px-3 py-1 rounded-full">
                상담 가능
              </div>
              <div className="flex justify-between items-start mb-6">
                <div className="p-4 rounded-2xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <MessageSquare size={32} />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">실시간 채팅 상담</h3>
              <p className="text-slate-500">간단한 궁금증을 해결해드리는 카카오톡 실시간 상담이 가능합니다.</p>
            </a>
          </div>

          {selectedType === 'video' && (
            <div id="booking-form" className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200 overflow-hidden animate-fade-in-up">
              <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <CalendarIcon className="text-indigo-400" /> 예약 정보 입력
                  </h2>
                  <p className="text-slate-400 text-sm mt-1">원활한 상담을 위해 아래 정보를 입력해 주세요.</p>
                </div>
              </div>

              <div className="p-8 md:p-12 space-y-12">
                
                {/* Section 0: User Info */}
                <section>
                  <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">1</span>
                    신청자 정보
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">이름 (필수)</label>
                      <div className="relative">
                        <User size={18} className="absolute left-3 top-3 text-slate-400" />
                        <input 
                          type="text" 
                          name="name"
                          value={userInfo.name}
                          onChange={handleUserInfoChange}
                          placeholder="홍길동" 
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all" 
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">연락처 (필수)</label>
                      <div className="relative">
                        <Phone size={18} className="absolute left-3 top-3 text-slate-400" />
                        <input 
                          type="tel" 
                          name="phone"
                          value={userInfo.phone}
                          onChange={handleUserInfoChange}
                          placeholder="010-1234-5678" 
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all" 
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">회사명</label>
                      <div className="relative">
                        <Building size={18} className="absolute left-3 top-3 text-slate-400" />
                        <input 
                          type="text" 
                          name="company"
                          value={userInfo.company}
                          onChange={handleUserInfoChange}
                          placeholder="Brand Slam" 
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all" 
                        />
                      </div>
                    </div>
                  </div>
                </section>

                <hr className="border-slate-100" />

                {/* Section 1: Date & Time */}
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">2</span>
                      날짜 선택
                    </h3>
                    <CustomCalendar selectedDate={selectedDate} onDateSelect={setSelectedDate} />
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">3</span>
                      시간 선택
                    </h3>
                    {!selectedDate ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl min-h-[200px]">
                            <CalendarIcon size={32} className="mb-2 opacity-50"/>
                            <p className="text-sm">날짜를 먼저 선택해주세요.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 gap-3">
                            {timeSlots.map((time) => {
                                const isTaken = takenTimes.includes(time);
                                
                                return (
                                    <button
                                        key={time}
                                        onClick={() => !isTaken && setSelectedTime(time)}
                                        disabled={isTaken}
                                        className={`py-3 rounded-xl text-sm font-bold transition-all relative ${
                                            isTaken
                                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                                            : selectedTime === time
                                                ? 'bg-indigo-600 text-white shadow-lg transform scale-105'
                                                : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-500 hover:text-indigo-600'
                                        }`}
                                    >
                                        {time}
                                        {isTaken && (
                                            <span className="absolute inset-0 flex items-center justify-center">
                                                <Ban size={16} className="text-slate-400/50" />
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                    {selectedDate && (
                        <p className="text-xs text-slate-400 mt-4 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-slate-200 inline-block"></span> 마감된 시간은 선택할 수 없습니다.
                        </p>
                    )}
                  </div>
                </section>

                <hr className="border-slate-100" />

                {/* Section 2: Topic & Detail */}
                <section>
                  <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">4</span>
                    상담 내용 작성 (10자 이상)
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {inquiryCategories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setCategory(cat)}
                            className={`p-4 rounded-xl border-2 text-left transition-all flex flex-col gap-2 ${
                                category.id === cat.id
                                ? 'border-indigo-600 bg-indigo-50 text-indigo-900'
                                : 'border-slate-100 hover:border-slate-300 text-slate-500'
                            }`}
                        >
                            <div className={`${category.id === cat.id ? 'text-indigo-600' : 'text-slate-400'}`}>
                                {cat.icon}
                            </div>
                            <span className="font-bold text-sm">{cat.label}</span>
                        </button>
                    ))}
                  </div>

                  <div className="relative">
                    <textarea
                        value={detail}
                        onChange={(e) => setDetail(e.target.value)}
                        placeholder={category.placeholder}
                        className="w-full h-40 p-5 rounded-2xl border border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none resize-none transition-all placeholder:text-slate-400 text-slate-700 leading-relaxed"
                    ></textarea>
                    <div className="absolute bottom-4 right-4 text-xs text-slate-400 bg-white px-2 rounded-full">
                        {detail.length}자 입력됨
                    </div>
                  </div>
                </section>

                <div className="pt-6 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="text-slate-500 text-sm">
                    <p>• 예약 확정 시 기재된 연락처로 줌(Zoom) 링크가 발송됩니다.</p>
                    <p>• 변경 및 취소는 예약 시간 24시간 전까지 가능합니다.</p>
                  </div>
                  <button
                    onClick={handleSubmit}
                    disabled={!isFormValid || isSubmitting}
                    className={`w-full md:w-auto px-12 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
                      isFormValid && !isSubmitting
                      ? 'bg-slate-900 text-white hover:bg-indigo-600 shadow-lg hover:shadow-indigo-500/30 cursor-pointer'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {isSubmitting ? '예약 중...' : '상담 예약 확정하기'} <ArrowRight size={20} />
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