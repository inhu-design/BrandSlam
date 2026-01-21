import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase'; 
import { useAuth } from '../contexts/AuthContext'; 
import { 
  Check, ShieldCheck, Lock, CreditCard, Building, ArrowLeft, 
  HelpCircle, Crown, Sparkles, TrendingUp, Users, Flame, Eye, AlertCircle, Clock, FileText, X, CheckCircle
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

// [수정됨] 환불 규정 모달 컴포넌트 (onAgree 추가)
const RefundPolicyModal = ({ isOpen, onClose, onAgree }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white w-full max-w-2xl rounded-2xl p-8 shadow-2xl relative flex flex-col max-h-[85vh]">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 transition-colors">
                    <X size={24}/>
                </button>
                <h3 className="font-bold text-xl mb-4 border-b pb-4 shrink-0 text-slate-900">
                    결제 및 환불 규정 (서비스 운영 정책)
                </h3>
                
                <div className="text-sm text-slate-600 space-y-6 overflow-y-auto pr-2 custom-scrollbar flex-1 leading-relaxed">
                    {/* 1. 결제 및 환불 규정 */}
                    <section>
                        <h4 className="font-bold text-slate-900 mb-2 text-base">1. 결제 및 환불 규정</h4>
                        <ul className="list-disc pl-4 space-y-1.5 bg-slate-50 p-4 rounded-xl">
                            <li><strong>결제 단위:</strong> 브랜드슬램의 서비스는 효율적인 애셋 구축과 관리를 위해 3개월 단위로만 결제가 가능합니다.</li>
                            <li><strong>취소 및 환불 불가 기준:</strong> 결제 후 최초 인플루언서 리스팅(1개월 차)이 진행된 시점부터는 취소 및 환불이 절대 불가합니다. 이는 브랜드 상품 분석, 내러티브 생성, 전담 팀 구성 등 사전 투입되는 리소스 비용을 고려한 조치입니다.</li>
                            <li>단, 브랜드사가 입력한 정보가 서비스 목적과 현저히 맞지 않다고 판단될 경우, 저희 측에서 먼저 취소를 제안하거나 적합한 새로운 서비스를 제안해 드려 리스크를 최소화해 드립니다.</li>
                        </ul>
                    </section>

                    {/* 2. 브랜드사 정보 입력 및 가이드라인 */}
                    <section>
                        <h4 className="font-bold text-slate-900 mb-2 text-base">2. 브랜드사 정보 입력 및 가이드라인</h4>
                        <ul className="list-disc pl-4 space-y-1.5">
                            <li><strong>정확한 정보 제공:</strong> 만족도 높은 결과를 위해 캠페인 전략, 인플루언서 소통 메시지, 주의사항 및 중요 포인트를 최대한 명확하게 작성해 주셔야 합니다.</li>
                            <li><strong>가이드라인 변경:</strong> 최초 제공된 '밈(Meme) 기반 내러티브 가이드'에서 최초 1회에 한해 변경 가능합니다.</li>
                            <li><strong>난이도 조절:</strong> 제조사 헤리티지 반영 등 KOC가 수행하기 어려운 고난도 요청은 회수율 저하의 원인이 됩니다. 이 경우 캠페인 종료 후 KOL 전용 서비스로의 전환을 권장합니다.</li>
                        </ul>
                    </section>

                    {/* 3. 콘텐츠 교환 (거절 및 재매칭) 기한 */}
                    <section>
                        <h4 className="font-bold text-slate-900 mb-2 text-base">3. 콘텐츠 교환 (거절 및 재매칭) 기한</h4>
                        <ul className="list-disc pl-4 space-y-1.5">
                            <li><strong>교환 기한:</strong> 대시보드에 인플루언서 리스트 업로드 알림 발송 후 3일 이내(발송일 포함 3일째 자정까지) 확정 혹은 거절을 완료해야 합니다.</li>
                            <li><strong>기한 엄수:</strong> 인플루언서와의 소통 지연은 업로드율에 직결되므로, 3일 경과 시 리스트는 자동 확정되어 이후 교환이 불가합니다.</li>
                            <li><strong>교환 범위:</strong> 1차(발주 수량의 30% 이내), 2차(잔여 수량의 30% 이내)로 최대 2회까지 가능합니다.</li>
                        </ul>
                    </section>

                    {/* 4. 품질 및 회수율 보장 (AS) */}
                    <section>
                        <h4 className="font-bold text-slate-900 mb-2 text-base">4. 품질 및 회수율 보장 (AS)</h4>
                        <ul className="list-disc pl-4 space-y-1.5">
                            <li><strong>품질 인식:</strong> 본 서비스는 KOC의 자발적 창작물이므로, 결과물이 가이드라인과 100% 일치하지 않을 수 있음을 사전 인지 바랍니다.</li>
                            <li><strong>회수율 보장:</strong> 결제 후 3개월 내 회수율이 85% 미만일 경우, 가이드라인 완화를 조건으로 최초 발주 수량의 25%를 재모집하여 최종 회수율을 100%에 근접하도록 관리해 드립니다.</li>
                        </ul>
                    </section>

                    {/* 5. 고객 중심 소통 약속 */}
                    <section>
                        <h4 className="font-bold text-slate-900 mb-2 text-base">5. 고객 중심 소통 약속</h4>
                        <p className="bg-indigo-50 p-4 rounded-xl text-indigo-800 font-medium">
                            브랜드슬램은 브랜드사가 직접 운영하는 것보다 압도적인 품질과 소통 관리를 제공하겠다는 강력한 의지를 가지고 있습니다. 모든 팀원이 캠페인을 실시간으로 모니터링하고 있으니, 궁금하신 점이나 개선 사항은 언제든 고객센터를 통해 적극적으로 소통해 주시기 바랍니다.
                        </p>
                    </section>
                </div>
                
                {/* [수정] 동의 버튼 클릭 시 onAgree 호출 후 모달 닫기 */}
                <button 
                    onClick={() => { onAgree(); onClose(); }} 
                    className="w-full mt-6 bg-slate-900 text-white py-4 rounded-xl font-bold shrink-0 hover:bg-slate-800 transition-colors shadow-lg"
                >
                    위 내용을 모두 확인하였으며 동의합니다
                </button>
            </div>
        </div>
    );
};

export default function Checkout() {
  const { state } = useLocation();
  const navigate = useNavigate();
  
  const authContext = useAuth(); 
  const user = authContext ? authContext.user : null;
  
  // --- State Management ---
  const initialPlanId = state?.plan?.id || 'STANDARD';
  const [selectedPlanId, setSelectedPlanId] = useState(initialPlanId);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [showRefundModal, setShowRefundModal] = useState(false); 
  const [isPolicyAgreed, setIsPolicyAgreed] = useState(false); // [추가] 약관 동의 상태
  
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
  }, [state]);

  // --- Calculations ---
  const currentPlan = subscriptionPlans.find(p => p.id === selectedPlanId) || subscriptionPlans[1];
  const parsePrice = (priceStr) => parseInt(priceStr.replace(/,/g, ''), 10);
  const basePrice = parsePrice(currentPlan.price);
  const addonsPrice = 0; 
  const subtotal = basePrice + addonsPrice;
  const vat = subtotal * 0.1;
  const totalPrice = subtotal + vat;

  // --- Handlers ---
  const handleInputChange = (e) => {
    setBrandInfo({ ...brandInfo, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    // [추가] 2중 안전장치 (버튼이 비활성화되지만 혹시 모를 상황 대비)
    if (!isPolicyAgreed) {
        alert("결제 및 환불 규정에 동의해주셔야 결제가 가능합니다.");
        setShowRefundModal(true);
        return;
    }

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
            user_id: user?.id || null, 
            plan_id: selectedPlanId,
            addons: [], 
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
      <RefundPolicyModal 
        isOpen={showRefundModal} 
        onClose={() => setShowRefundModal(false)}
        onAgree={() => setIsPolicyAgreed(true)} // [추가] 동의 상태 변경
      />
      
      <div className="flex-1 pt-44 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <Link 
              to="/pricing" 
              className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors self-start md:self-auto relative z-10"
            >
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

              {/* Step 2: Brand Info Form */}
              <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-900"></div>
                <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-bold">2</span>
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

              {/* Step 3: Payment Method */}
              <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-900"></div>
                <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-bold">3</span>
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

                    {/* [수정] 버튼 Disabled 로직 및 텍스트 변경 */}
                    <button 
                      onClick={handleSubmit}
                      disabled={isSubmitting || !isPolicyAgreed}
                      className={`w-full py-4 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 transform active:scale-95 
                        ${!isPolicyAgreed 
                            ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
                            : 'bg-slate-900 text-white hover:bg-indigo-600 hover:shadow-indigo-500/30'
                        }`}
                    >
                      {isSubmitting ? '처리 중...' : 
                       !isPolicyAgreed ? '규정 동의가 필요합니다' : 
                       <><Lock size={18} /> {totalPrice.toLocaleString()}원 결제하기</>}
                    </button>
                    
                    {/* [수정] 동의 완료 시 체크마크 표시 */}
                    <div className="flex items-center justify-center gap-2 mt-4 text-xs text-slate-500">
                        {isPolicyAgreed ? (
                            <CheckCircle size={14} className="text-green-500"/>
                        ) : (
                            <FileText size={14}/>
                        )}
                        <span>결제 전 </span>
                        <button onClick={() => setShowRefundModal(true)} className={`underline font-bold ${isPolicyAgreed ? 'text-green-600' : 'text-indigo-600'} hover:text-indigo-800`}>
                            {isPolicyAgreed ? '결제 및 환불 규정 동의 완료' : '결제 및 환불 규정'}
                        </button>
                        <span>{!isPolicyAgreed && '을 확인해주세요.'}</span>
                    </div>
                    
                    <div className="text-center mt-4">
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