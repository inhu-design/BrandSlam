import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase'; 
import { useAuth } from '../contexts/AuthContext'; 
import { 
  Check, ShieldCheck, Lock, CreditCard, Building, ArrowLeft, 
  HelpCircle, Crown, Sparkles, TrendingUp, Users, Flame, Eye, AlertCircle, Clock 
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

// 1. Plan Data
const subscriptionPlans = [
  {
    id: "BASIC",
    name: "BASIC Plan",
    koreanName: "BASIC (신규 브랜드)",
    price: "890,000",
    contentCount: 30,
    theme: "blue",
    gradient: "from-blue-500 to-cyan-500",
    features: ["월 30개 콘텐츠", "트래킹 서비스"],
    stock: 5 
  },
  {
    id: "STANDARD",
    name: "STANDARD Plan",
    koreanName: "STANDARD (성장 단계)",
    price: "2,490,000",
    contentCount: 100,
    theme: "emerald",
    gradient: "from-emerald-500 to-teal-500",
    popular: true,
    features: ["월 100개 콘텐츠", "VOC 분석", "광고 원본 2건"],
    stock: 2 
  },
  {
    id: "PREMIUM",
    name: "PREMIUM Plan",
    koreanName: "PREMIUM (공격적 성장)",
    price: "7,490,000",
    contentCount: 300,
    theme: "pink",
    gradient: "from-pink-500 to-rose-500",
    features: ["월 300개 콘텐츠", "Paid L3 1명 포함", "심화 분석"],
    stock: 1 
  },
  {
    id: "VISIT",
    name: "VISIT Plan",
    koreanName: "VISIT (오프라인 매장)",
    price: "9,000,000",
    contentCount: 30,
    theme: "orange",
    gradient: "from-orange-500 to-amber-500",
    features: ["방문형 콘텐츠 30건", "매장 트래픽 증대"],
    stock: 3
  }
];

// 2. Add-on Options
const addOnOptions = [
  {
    id: "L3",
    name: "Micro Creator (L3)",
    price: "600,000",
    gmv: "$25K ~ $60K",
    desc: "가성비 좋은 공동구매/바이럴",
    followers: "20k-80k"
  },
  {
    id: "L4",
    name: "Mid-Tier Creator (L4)",
    price: "1,000,000",
    gmv: "$60K ~ $150K",
    desc: "얼굴 노출 & 신뢰도 높은 리뷰",
    followers: "80k-200k"
  },
  {
    id: "L5",
    name: "Premium Creator (L5)",
    price: "2,000,000",
    gmv: "$150K ~ $400K",
    desc: "광고 소재 활용 고퀄리티",
    followers: "200k-500k"
  },
  {
    id: "L6",
    name: "Top-Tier (L6)",
    price: "5,000,000",
    gmv: "$400K +",
    desc: "압도적 파급력의 메가 인플루언서",
    followers: "500k+"
  }
];

export default function Checkout() {
  const { state } = useLocation();
  const navigate = useNavigate();
  
  // [수정 포인트 1] useAuth()가 undefined일 경우를 대비해 안전하게 구조분해
  const authContext = useAuth(); 
  const user = authContext ? authContext.user : null;
  
  // --- State Management ---
  const initialPlanId = state?.plan?.id || 'STANDARD';
  const [selectedPlanId, setSelectedPlanId] = useState(initialPlanId);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('card');
  
  const [brandInfo, setBrandInfo] = useState({
    company: '',
    name: '',
    email: '',
    phone: '',
    website: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewers, setViewers] = useState(12);
  const [timeLeft, setTimeLeft] = useState(600);

  // --- Effects ---
  useEffect(() => {
    window.scrollTo(0, 0); 
    
    // 만약 pricing 페이지에서 넘어온 데이터가 있다면 플랜 설정
    if (state?.plan?.id) {
        setSelectedPlanId(state.plan.id);
    }

    const interval = setInterval(() => {
      setViewers(prev => prev + Math.floor(Math.random() * 3) - 1);
    }, 5000);
    const timer = setInterval(() => {
        setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => {
        clearInterval(interval);
        clearInterval(timer);
    };
  }, [state]); // state 변경 감지

  // --- Calculations ---
  const currentPlan = subscriptionPlans.find(p => p.id === selectedPlanId) || subscriptionPlans[1]; // Fallback to STANDARD
  const parsePrice = (priceStr) => parseInt(priceStr.replace(/,/g, ''), 10);
  const basePrice = parsePrice(currentPlan.price);
  const addonsPrice = selectedAddons.reduce((acc, addonId) => {
    const addon = addOnOptions.find(opt => opt.id === addonId);
    return acc + parsePrice(addon.price);
  }, 0);
  const subtotal = basePrice + addonsPrice;
  const vat = subtotal * 0.1;
  const totalPrice = subtotal + vat;

  // --- Handlers ---
  const toggleAddon = (addonId) => {
    setSelectedAddons(prev => 
      prev.includes(addonId) 
        ? prev.filter(id => id !== addonId) 
        : [...prev, addonId]
    );
  };

  const handleInputChange = (e) => {
    setBrandInfo({ ...brandInfo, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!brandInfo.company || !brandInfo.name || !brandInfo.phone) {
        alert("브랜드 정보를 모두 입력해주세요.");
        return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('orders')
        .insert([
          {
            // [수정 포인트 2] 비로그인 유저(Guest) 대응 로직
            // 로그인 상태면 user.id, 아니면 null (DB에서 user_id가 nullable이어야 함)
            user_id: user?.id || null, 
            plan_id: selectedPlanId,
            addons: selectedAddons,
            total_price: totalPrice,
            payment_method: paymentMethod,
            brand_name: brandInfo.company,
            manager_name: brandInfo.name,
            phone: brandInfo.phone,
            email: brandInfo.email,
            website: brandInfo.website,
            status: 'pending'
          }
        ]);

      if (error) throw error;

      alert(`[주문 완료]\n플랜: ${currentPlan.name}\n결제금액: ${totalPrice.toLocaleString()}원\n\n신청해주셔서 감사합니다. 대시보드로 이동합니다.`);
      
      window.scrollTo(0, 0);
      navigate('/dashboard');

    } catch (error) {
      console.error('Order Error:', error);
      alert(`주문 처리 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const themeClasses = {
    blue: { bg: 'bg-blue-50', border: 'border-blue-500', text: 'text-blue-600', ring: 'ring-blue-500' },
    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-500', text: 'text-emerald-600', ring: 'ring-emerald-500' },
    pink: { bg: 'bg-pink-50', border: 'border-pink-500', text: 'text-pink-600', ring: 'ring-pink-500' },
    orange: { bg: 'bg-orange-50', border: 'border-orange-500', text: 'text-orange-600', ring: 'ring-orange-500' }
  };
  const theme = themeClasses[currentPlan.theme];

  return (
    <div className="font-sans antialiased text-slate-900 bg-slate-50 min-h-screen flex flex-col">
      <Navbar />
      
      <div className="flex-1 pt-28 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <Link to="/pricing" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors self-start md:self-auto">
              <ArrowLeft size={20} />
              <span>다른 플랜 보러가기</span>
            </Link>
            
            <div className="flex items-center gap-4 bg-red-50 px-4 py-2 rounded-full border border-red-100 animate-pulse">
                <div className="flex items-center gap-1.5 text-xs font-bold text-red-600">
                    <Eye size={14} />
                    <span>현재 {viewers}명의 마케터가 보고 있습니다</span>
                </div>
                <div className="w-px h-3 bg-red-200"></div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-red-600">
                    <Clock size={14} />
                    <span>혜택 마감 {formatTime(timeLeft)}</span>
                </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
            
            {/* [Left Column] */}
            <div className="flex-1 space-y-8">
              
              {/* Step 1: Plan Selection */}
              <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-900"></div>
                <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-bold">1</span>
                  구독 플랜 선택
                </h2>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {subscriptionPlans.map((plan) => (
                    <button
                      key={plan.id}
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={`relative py-4 px-3 rounded-xl text-sm font-bold transition-all border-2 flex flex-col items-center justify-center gap-1.5 ${
                        selectedPlanId === plan.id
                          ? `border-${plan.theme}-500 bg-${plan.theme}-50 text-${plan.theme}-700 shadow-md transform scale-[1.02]`
                          : 'border-slate-100 hover:border-slate-300 text-slate-500 bg-white'
                      }`}
                    >
                      {plan.stock <= 2 && (
                          <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap shadow-sm z-10 flex items-center gap-1">
                              <Flame size={10} fill="currentColor" /> 마감임박
                          </div>
                      )}
                      {plan.popular && plan.stock > 2 && (
                        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded-full shadow-sm z-10">POPULAR</span>
                      )}
                      
                      <span className="text-base">{plan.id}</span>
                      <span className="text-xs font-medium opacity-80">{plan.contentCount}</span>
                      
                      {selectedPlanId === plan.id && (
                          <div className={`absolute top-2 right-2 w-2 h-2 rounded-full bg-${plan.theme}-500`}></div>
                      )}
                    </button>
                  ))}
                </div>
                
                <div className={`mt-6 p-4 rounded-xl flex items-center justify-between ${theme.bg} border ${theme.border} bg-opacity-30`}>
                    <div>
                        <p className={`font-bold ${theme.text}`}>{currentPlan.koreanName}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{currentPlan.price}원 / 월</p>
                    </div>
                    <CheckCircle2Icon color={currentPlan.theme} />
                </div>
              </div>

              {/* Step 2: Add-ons */}
              <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-600"></div>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold">2</span>
                    성과 부스터 (선택)
                    </h2>
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full animate-pulse">
                        함께 구매시 효과 200% UP
                    </span>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {addOnOptions.map((addon) => {
                        const isSelected = selectedAddons.includes(addon.id);
                        return (
                            <div 
                                key={addon.id}
                                onClick={() => toggleAddon(addon.id)}
                                className={`cursor-pointer p-4 rounded-2xl border-2 transition-all duration-200 flex items-center justify-between group ${
                                    isSelected 
                                    ? 'border-indigo-500 bg-indigo-50/50 shadow-md' 
                                    : 'border-slate-100 hover:border-indigo-200 hover:bg-slate-50'
                                }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${
                                        isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 bg-white'
                                    }`}>
                                        {isSelected && <Check size={14} className="text-white" strokeWidth={3} />}
                                    </div>
                                    <div>
                                        <h4 className={`font-bold ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>
                                            {addon.name}
                                        </h4>
                                        <div className="flex items-center gap-2 mt-1 text-xs">
                                            <span className="text-slate-500 flex items-center gap-1"><Users size={12}/> {addon.followers}</span>
                                            <span className="text-slate-300">|</span>
                                            <span className="text-red-500 font-bold flex items-center gap-1"><TrendingUp size={12}/> GMV {addon.gmv}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className={`block font-bold ${isSelected ? 'text-indigo-700' : 'text-slate-900'}`}>
                                        +{parseInt(addon.price.replace(/,/g, '')).toLocaleString()}원
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
              </div>

              {/* Step 3: Brand Info Form (Connected to State) */}
              <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-900"></div>
                <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-bold">3</span>
                  브랜드 정보 입력
                </h2>
                <form className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">회사명 (브랜드명)</label>
                      <input 
                        type="text" 
                        name="company" 
                        value={brandInfo.company} 
                        onChange={handleInputChange} 
                        placeholder="Brand Slam" 
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all" 
                        required 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">담당자 성함</label>
                      <input 
                        type="text" 
                        name="name" 
                        value={brandInfo.name} 
                        onChange={handleInputChange} 
                        placeholder="홍길동" 
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all" 
                        required 
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">이메일 (세금계산서)</label>
                      <input 
                        type="email" 
                        name="email" 
                        value={brandInfo.email} 
                        onChange={handleInputChange} 
                        placeholder="finance@brand.com" 
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all" 
                        required 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">연락처</label>
                      <input 
                        type="tel" 
                        name="phone" 
                        value={brandInfo.phone} 
                        onChange={handleInputChange} 
                        placeholder="010-1234-5678" 
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all" 
                        required 
                      />
                    </div>
                  </div>
                  <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">웹사이트 / SNS 주소</label>
                      <input 
                        type="text" 
                        name="website" 
                        value={brandInfo.website} 
                        onChange={handleInputChange} 
                        placeholder="https://brand-slam.com" 
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all" 
                      />
                  </div>
                </form>
              </div>

              {/* Step 4: Payment Method */}
              <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-900"></div>
                <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-bold">4</span>
                  결제 방식 선택
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div 
                    onClick={() => setPaymentMethod('card')}
                    className={`cursor-pointer p-5 rounded-2xl border-2 transition-all flex items-center gap-4 ${
                      paymentMethod === 'card' 
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-md' 
                      : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    <div className={`p-2 rounded-full ${paymentMethod === 'card' ? 'bg-indigo-200 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                      <CreditCard size={24} />
                    </div> 
                    <div>
                      <p className="font-bold">신용카드 자동결제</p>
                      <p className="text-xs opacity-70">법인/개인 카드 가능</p>
                    </div>
                    {paymentMethod === 'card' && <div className="ml-auto bg-indigo-600 text-white rounded-full p-1"><Check size={14} strokeWidth={4} /></div>}
                  </div>

                  <div 
                    onClick={() => setPaymentMethod('transfer')}
                    className={`cursor-pointer p-5 rounded-2xl border-2 transition-all flex items-center gap-4 ${
                      paymentMethod === 'transfer' 
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-md' 
                      : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    <div className={`p-2 rounded-full ${paymentMethod === 'transfer' ? 'bg-indigo-200 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                      <Building size={24} />
                    </div>
                    <div>
                      <p className="font-bold">세금계산서 발행</p>
                      <p className="text-xs opacity-70">무통장 입금 (월 단위)</p>
                    </div>
                    {paymentMethod === 'transfer' && <div className="ml-auto bg-indigo-600 text-white rounded-full p-1"><Check size={14} strokeWidth={4} /></div>}
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl text-sm text-slate-600 flex gap-3 items-start">
                  <ShieldCheck className="text-indigo-600 shrink-0" size={20} />
                  <p>
                    모든 결제 정보는 SSL 암호화되어 안전하게 처리됩니다. 
                    구독은 언제든지 마이페이지에서 해지할 수 있으며, 
                    결제일 7일 전 미리 알림을 보내드립니다.
                  </p>
                </div>
              </div>
            </div>

            {/* [Right Column] Sticky Order Summary */}
            <div className="lg:w-[400px]">
              <div className="sticky top-24 space-y-6">
                
                <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden">
                  {currentPlan.stock <= 3 && (
                      <div className="bg-red-500 text-white text-xs font-bold text-center py-2 flex items-center justify-center gap-2 animate-pulse">
                          <AlertCircle size={14} />
                          현재 이 플랜은 {currentPlan.stock}자리 남았습니다!
                      </div>
                  )}

                  <div className={`p-6 text-white bg-gradient-to-r ${currentPlan.gradient}`}>
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium opacity-90 mb-1">선택한 플랜</p>
                            <h3 className="text-2xl font-extrabold">{currentPlan.name}</h3>
                            <p className="text-sm opacity-90 mt-1">{currentPlan.koreanName}</p>
                        </div>
                        {currentPlan.popular && <Crown className="text-yellow-400" size={24} fill="currentColor" />}
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    <div>
                      <div className="flex justify-between items-center mb-3 text-slate-600">
                        <span>기본 구독료</span>
                        <span className="font-bold">{basePrice.toLocaleString()}원</span>
                      </div>
                      
                      {selectedAddons.length > 0 && (
                          <div className="space-y-2 mb-3 pb-3 border-b border-slate-100 border-dashed">
                              {selectedAddons.map(id => {
                                  const item = addOnOptions.find(opt => opt.id === id);
                                  return (
                                      <div key={id} className="flex justify-between items-center text-sm text-indigo-600">
                                          <span className="flex items-center gap-1"><Sparkles size={12}/> {item.name}</span>
                                          <span className="font-bold">+{parseInt(item.price.replace(/,/g, '')).toLocaleString()}원</span>
                                      </div>
                                  );
                              })}
                          </div>
                      )}

                      <div className="flex justify-between items-center mb-2 text-slate-500 text-sm">
                        <span>공급가액 소계</span>
                        <span>{subtotal.toLocaleString()}원</span>
                      </div>
                      <div className="flex justify-between items-center mb-4 text-slate-500 text-sm">
                        <span>VAT (10%)</span>
                        <span>{vat.toLocaleString()}원</span>
                      </div>
                      
                      <div className="h-px bg-slate-200 mb-4"></div>
                      
                      <div className="flex justify-between items-end text-slate-900">
                        <span className="font-bold text-lg">총 결제금액</span>
                        <div className="text-right">
                          <span className={`block text-3xl font-extrabold ${theme.text}`}>{totalPrice.toLocaleString()}원</span>
                          <span className="text-xs text-slate-400 font-medium">/ 월 (VAT 포함)</span>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="w-full py-4 rounded-xl font-bold text-white bg-slate-900 hover:bg-indigo-600 transition-all shadow-lg hover:shadow-indigo-500/30 flex items-center justify-center gap-2 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? '처리 중...' : <><Lock size={18} /> {totalPrice.toLocaleString()}원 결제하기</>}
                    </button>
                    
                    <div className="text-center">
                        <p className="text-xs text-slate-400 mb-2">
                            <span className="font-bold text-slate-600">{viewers}명</span>이 이 상품을 검토 중입니다.
                        </p>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className="h-full bg-red-500 w-3/4 animate-[width_2s_ease-out]"></div>
                        </div>
                        <p className="text-[10px] text-red-500 mt-1 font-bold text-right">마감 임박</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

// Helper Icon
const CheckCircle2Icon = ({ color }) => {
    return <CheckCircle2 className={`text-${color}-500`} size={16} />;
};
const CheckCircle2 = ({ className, size }) => (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <path d="m9 12 2 2 4-4"></path>
    </svg>
);