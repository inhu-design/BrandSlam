import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Check, UserPlus, FileText,
  CreditCard, ExternalLink, AlertTriangle, CheckCircle2, Sparkles, X, Loader2,
  Minus, Plus, MapPin
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const PLANS = {
  Starter: { id: 'Starter', name: 'Starter', price: '590,000', priceNum: 590000, count: 10, desc: '콘텐츠 10개 보장' },
  Growth: { id: 'Growth', name: 'Growth', price: '990,000', priceNum: 990000, count: 20, desc: '콘텐츠 20개 보장', isBest: true },
  Scale50: { id: 'Scale50', name: 'Scale50', price: '2,390,000', priceNum: 2390000, count: 50, desc: '콘텐츠 50개 보장' },
  Visit: { id: 'Visit', name: 'Visit Content', pricePerPerson: 300000, isVisit: true, desc: '방문형 콘텐츠 · 인당 300,000원' },
};

const BANK_INFO = {
  bank: 'SC제일은행',
  account: '325-20-322490',
  holder: '주식회사브랜드슬램',
};

const LEGAL_CONTENTS = {
  terms: {
    title: '서비스 이용약관',
    content: `제1조 (목적)

본 약관은 주식회사 브랜드슬램(이하 "B")이 운영하는 플랫폼 기반 인플루언서 매니지먼트 시스템(이하 "SLAM GLOBAL")의 이용 조건, 절차, 권리·의무 및 책임 사항을 규정함을 목적으로 합니다.


제2조 (서비스의 성격)

1. SLAM GLOBAL은 단순 상품 판매가 아닌 무형의 콘텐츠 기획·운영 대행 서비스입니다.

2. 결제 완료 즉시 다음 업무가 자동 개시됩니다.
  - 캠페인 구조 설계
  - 콘텐츠 내러티브 기획
  - 브랜드 가이드라인 정리
  - 인플루언서 풀 분석 및 매칭 준비
  - 운영 리소스 배정

3. 본 서비스는 전문 인력 및 시스템이 투입되는 용역으로서, 「전자상거래 등에서의 소비자보호에 관한 법률」 제17조 제2항에 따른 청약철회 제한 용역에 해당할 수 있습니다.


제3조 (계약 성립 및 서비스 개시)

1. 계약은 브랜드사(이하 "A")가 서비스 신청 및 결제를 완료한 시점에 성립됩니다.

2. 계약 성립과 동시에 운영 리소스가 배정되며, 이를 서비스 개시로 간주합니다.


제4조 (서비스 운영 및 Replacement Content)

1. 본 서비스는 성과 보장형 계약이 아닙니다. 업로드 수, 조회수, 매출, 전환율 등은 보장되지 않습니다.

2. 캠페인 진행 중 콘텐츠 미업로드가 발생할 경우, 금전 환불이 아닌 Replacement Content(동일 수량 대체 제공) 방식으로 처리됩니다.

3. Replacement Content는 다음 기준을 따릅니다.
  - 동일 또는 유사 유형의 콘텐츠 서비스
  - 현금 환불 또는 금전 크레딧 전환 불가
  - 업로드 기한 종료 후 산정

4. Replacement Content는 본 계약상 유일한 사후 보완 조치입니다.


제5조 (업로드 정책)

1. 모든 크리에이터의 업로드 기한은 제품 배송일로부터 90일입니다.

2. 배송일은 B의 출고·전달 리스트 기준으로 산정됩니다.

3. 브랜드가 과도한 추가 가이드 또는 복잡한 수정 요청을 요구할 경우, 업로드율(회수율)이 저하될 수 있으며 이 경우 Replacement Content 제공 대상에서 제외될 수 있습니다.


제6조 (책임의 제한)

B는 다음 사항에 대해 책임을 지지 않습니다.
  - 크리에이터의 표현 방식 및 콘텐츠 톤
  - 플랫폼 정책 변경에 따른 노출 제한
  - 시장 환경 변화에 따른 성과 차이
  - 브랜드 내부 사정에 따른 일정 변경

본 서비스는 마케팅 운영 지원 서비스이며, 최종 매출 및 성과 책임은 A에게 귀속됩니다.


제7조 (콘텐츠 레퍼런스 활용)

1. 캠페인 수행 과정에서 인플루언서(크리에이터)가 제작·업로드한 콘텐츠는 SLAM GLOBAL의 서비스 소개, 포트폴리오, 마케팅 자료 등 레퍼런스 목적으로 활용될 수 있습니다.

2. 레퍼런스 활용 범위는 다음을 포함합니다.
  - SLAM GLOBAL 웹사이트, 소셜 미디어, 제안서 등에서의 사례 소개
  - 잠재 고객 대상 서비스 설명 시 캠페인 결과물 예시로 사용
  - 기타 SLAM GLOBAL의 서비스 홍보 및 브랜드 신뢰도 구축을 위한 활용

3. 본 조항에 따른 레퍼런스 활용에 대해 별도의 비용은 발생하지 않으며, A는 서비스 이용 신청 시 이에 동의한 것으로 간주합니다.

4. A가 레퍼런스 활용을 원하지 않는 경우, 서면(이메일 포함)으로 B에게 통보할 수 있으며, B는 합리적인 기간 내에 해당 콘텐츠의 레퍼런스 사용을 중단합니다.`,
  },
  privacy: {
    title: '개인정보처리방침',
    content: `1. 개인정보의 처리 목적
주식회사 브랜드슬램(이하 '회사')은 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며 이용 목적이 변경되는 경우에는 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
- 서비스 제공: 콘텐츠 마케팅 자동화 서비스 제공, 계약서 작성, 요금 결제 및 정산
- 고객 관리: 서비스 이용에 따른 본인확인, 개인식별, 가입의사 확인, 문의사항 처리
- 마케팅 및 광고 활용: 신규 서비스 개발, 이벤트 정보 및 참여기회 제공

2. 수집하는 개인정보의 항목
회사는 서비스 제공을 위해 아래와 같은 최소한의 개인정보를 수집하고 있습니다.
- 필수항목: 회사명, 담당자 이름, 연락처(휴대전화번호), 이메일 주소, 웹사이트 주소
- 자동수집항목: 쿠키(Cookie), 서비스 이용 기록, 접속 로그, 접속 IP 정보

3. 개인정보의 보유 및 이용 기간
회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.
- 서비스 가입 및 이용 기간: 서비스 종료 시까지
- 관계 법령 위반에 따른 수사·조사 등이 진행 중인 경우에는 해당 수사·조사 종료 시까지

4. 개인정보의 제3자 제공
회사는 정보주체의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만, 법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우는 예외로 합니다.

5. 쿠키(Cookie)의 운용 및 거부
회사는 이용자에게 개별적인 맞춤서비스를 제공하기 위해 이용정보를 저장하고 수시로 불러오는 '쿠키(cookie)'를 사용합니다. 이용자는 웹브라우저 옵션 설정을 통해 쿠키 허용 여부를 선택할 수 있습니다.`,
  },
  refund: {
    title: '결제 및 환불 규정',
    content: `제1조 (결제 방식)

  - 서비스는 선결제 방식입니다.
  - 결제 완료 시 계약이 성립됩니다.
  - 서비스 결제와 동시에 기획·분석·운영 리소스가 투입됩니다.


제2조 (환불 기준)

1) 결제 후 3일 이내 & 인플루언서 리스트 전달 전
  → 전액 환불 가능

2) 리스트 전달 이후
  → 환불 불가
  → Replacement Content 규정 적용


제3조 (Replacement Content 규정 — 거절 및 재매칭 포함)

1. 인플루언서 리스트 확정 및 교환 기한
  - 대시보드에 인플루언서 리스트 업로드 알림 발송 시점을 기준으로, 발송일 포함 3일째 자정(23:59)까지 확정 또는 거절 의사를 완료해야 합니다.

2. 기한 경과 시 자동 확정
  - 3일 경과 시 리스트는 자동 확정되며, 이후 교환은 불가합니다.

  ※ 인플루언서와의 초기 소통 지연은 업로드율에 직접적인 영향을 미치므로 기한 엄수를 원칙으로 합니다.

3. 교환 가능 범위
  - 최초 발주 수량의 30% 이내에서 교환 가능합니다.
  - 30% 초과 교환은 불가합니다.


제4조 (콘텐츠 미업로드 및 Replacement Content)

1. 콘텐츠 업로드 기한은 제품 배송일 기준 90일입니다.

2. 90일 이내 업로드되지 않은 콘텐츠는 금전 환불이 아닌 동일 수량 Replacement Content(대체 제공)로 처리됩니다.

3. Replacement Content 산정 시점
  - 각 크리에이터의 90일 업로드 기한 종료 후, 익월 말 일괄 산정

4. 사용 방식
  - 차기 캠페인 또는 동일 서비스 유형 내 재사용 가능
  - 현금 환불 또는 금전 크레딧 전환 불가


제5조 (Performance Recovery Program)

1. 품질 인식 고지
  - 본 서비스는 KOC 기반 자발적 창작물입니다.
  - 가이드라인과 100% 동일한 결과물 제공을 보장하지 않습니다.
  - 플랫폼 특성상 크리에이터 고유의 표현 방식이 존중됩니다.

2. 회수율 관리 기준
  - 기본 목표 회수율: 85% 이상
  - 산정 기준: 배송일 기준 90일 경과 시점, 실제 업로드 완료 수량 ÷ 발주 수량

3. Performance Recovery 조건
  결제 후 3개월 이내, 최초 발주 수량 기준 회수율이 85% 미만일 경우 다음 조건 충족 시 Recovery 적용:
  - 브랜드 가이드라인을 단순화 또는 완화할 것
  - 추가 수정 요청 최소화
  - 일정 내 피드백 완료

  위 조건 충족 시:
  - 최초 발주 수량의 최대 25% 범위 내 재모집 진행
  - 이를 통해 최종 회수율 95% 이상 도달을 목표로 관리

  ※ 100% 절대 보장은 아닙니다.
  ※ 브랜드의 과도한 가이드 변경 시 적용 제외 가능합니다.


고객 중심 소통 약속

BrandSlam은 브랜드사가 직접 운영하는 것보다 더 체계적이고 밀도 높은 운영 품질을 제공하는 것을 목표로 합니다.

  - 모든 캠페인은 실시간 모니터링됩니다.
  - 업로드 현황은 대시보드에서 투명하게 확인 가능합니다.
  - 개선 요청 및 전략 수정은 고객센터를 통해 즉시 반영됩니다.

우리는 단순 실행자가 아니라, 브랜드의 글로벌 운영 파트너입니다.`,
  },
};

const AGREEMENT_ITEMS = [
  { key: 'terms', legalKey: 'terms', title: '서비스 이용약관 동의 (필수)', desc: 'BrandSlam의 서비스 이용약관을 확인하고 동의합니다.' },
  { key: 'privacy', legalKey: 'privacy', title: '개인정보 처리방침 동의 (필수)', desc: '개인정보 수집 및 이용에 대한 내용을 확인하고 동의합니다.' },
  { key: 'refund', legalKey: 'refund', title: '결제 및 환불 규정 동의 (필수)', desc: '구독 서비스의 결제 및 환불 정책을 확인하고 동의합니다.' },
];

const STEP_META = [
  { label: '요금제 선택', icon: Sparkles },
  { label: '고객 정보 입력', icon: UserPlus },
  { label: '약관 동의', icon: FileText },
  { label: '결제', icon: CreditCard },
];

const LegalModal = ({ isOpen, onClose, title, content }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#0f172a] border border-white/10 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-white/10">
          <h3 className="text-lg font-black text-white">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto text-sm text-slate-300 leading-relaxed whitespace-pre-wrap flex-1">
          {content}
        </div>
        <div className="p-4 border-t border-white/10 flex justify-end">
          <button onClick={onClose} className="px-6 py-2.5 rounded-xl bg-purple-500 text-white font-bold text-sm hover:bg-purple-600 transition-colors">
            확인
          </button>
        </div>
      </div>
    </div>
  );
};

const StepIndicator = ({ currentStep }) => (
  <div className="flex items-center justify-between mb-12">
    {STEP_META.map((s, i) => {
      const done = currentStep > i;
      const active = currentStep === i;
      const Icon = s.icon;
      return (
        <React.Fragment key={i}>
          <div className="flex items-center gap-2">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all text-sm font-bold ${
              done ? 'bg-purple-500 text-white'
              : active ? 'bg-purple-500/20 border-2 border-purple-500 text-purple-400'
              : 'bg-white/5 border border-white/10 text-slate-600'
            }`}>
              {done ? <Check size={16} strokeWidth={3} /> : <Icon size={16} />}
            </div>
            <span className={`text-xs font-bold hidden md:inline transition-colors ${
              done ? 'text-purple-400' : active ? 'text-white' : 'text-slate-600'
            }`}>{s.label}</span>
          </div>
          {i < STEP_META.length - 1 && (
            <div className={`flex-1 h-px mx-3 transition-all ${done ? 'bg-purple-500' : 'bg-white/10'}`} />
          )}
        </React.Fragment>
      );
    })}
  </div>
);

const PlanCard = ({ plan, selected, onClick, showChange, onChangeClick }) => (
  <button
    onClick={onClick}
    className={`relative text-left w-full p-8 rounded-2xl border-2 transition-all duration-300 ${
      onClick ? 'hover:-translate-y-1' : ''
    } ${
      selected
        ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/10'
        : 'border-white/10 bg-white/[0.03] hover:border-white/20'
    }`}
  >
    {plan.isBest && (
      <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest shadow-lg shadow-purple-500/30">
        MOST POPULAR
      </span>
    )}
    <h3 className="text-xl font-black text-white mb-2 tracking-tight">{plan.name}</h3>
    <div className="flex items-baseline gap-1 mb-2">
      <span className="text-3xl font-black text-purple-400">{plan.price}</span>
      <span className="text-slate-500 text-sm font-bold">원</span>
    </div>
    <p className="text-sm text-slate-400">{plan.desc}</p>
    {plan.isVisit && plan.count && (
      <p className="text-sm text-orange-400 font-bold mt-1">{plan.count}명 선택 · 인당 300,000원</p>
    )}
    {showChange && (
      <button
        onClick={(e) => { e.stopPropagation(); onChangeClick(); }}
        className="mt-4 text-xs text-slate-500 hover:text-purple-400 transition-colors font-medium underline underline-offset-2"
      >
        요금제 변경하기
      </button>
    )}
  </button>
);

const Input = ({ label, required, ...props }) => (
  <div>
    <label className="block text-sm font-semibold text-slate-300 mb-2">
      {label} {required && <span className="text-purple-400">*</span>}
    </label>
    <input
      {...props}
      className="w-full px-5 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all text-base"
    />
  </div>
);

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const queryPlan = new URLSearchParams(location.search).get('plan');
  const initialPlanId = location.state?.plan?.id || location.state?.plan || queryPlan || null;
  const [selectedPlanId, setSelectedPlanId] = useState(initialPlanId);
  const [visitCount, setVisitCount] = useState(1);
  const rawPlan = selectedPlanId ? PLANS[selectedPlanId] : null;

  const plan = rawPlan ? (rawPlan.isVisit ? {
    ...rawPlan,
    count: visitCount,
    priceNum: rawPlan.pricePerPerson * visitCount,
    price: (rawPlan.pricePerPerson * visitCount).toLocaleString(),
  } : rawPlan) : null;

  const vatRate = 0.1;
  const supplyPrice = plan ? plan.priceNum : 0;
  const vatAmount = Math.round(supplyPrice * vatRate);
  const totalPrice = supplyPrice + vatAmount;

  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const hasExistingPassword = user?.user_metadata?.password_set === true;
  const [isSettingPassword, setIsSettingPassword] = useState(!hasExistingPassword);

  const [form, setForm] = useState({
    email: user?.email || '', password: '', passwordConfirm: '',
    name: '', phone: '', company: '',
  });

  const [agree, setAgree] = useState({ terms: false, refund: false, privacy: false });
  const [orderNumber, setOrderNumber] = useState('');
  const [legalModal, setLegalModal] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('bank'); // 'bank' | 'card'
  const [verifyingPassword, setVerifyingPassword] = useState(false);
  const paymentInProgressRef = useRef(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login', {
        replace: true,
        state: { from: '/checkout', checkoutState: location.state },
      });
    }
  }, [authLoading, user, navigate, location.state]);

  useEffect(() => { window.scrollTo(0, 0); }, []);
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [currentStep]);

  if (authLoading) {
    return (
      <div className="font-sans antialiased text-white bg-[#020617] min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!user) return null;

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const toggleAgree = (key) => setAgree(prev => ({ ...prev, [key]: !prev[key] }));

  const toggleAll = () => {
    const allChecked = agree.terms && agree.refund && agree.privacy;
    setAgree({ terms: !allChecked, refund: !allChecked, privacy: !allChecked });
  };

  const allAgreed = agree.terms && agree.refund && agree.privacy;

  const passwordValid = isSettingPassword
    ? form.password.length >= 8 && form.password === form.passwordConfirm
    : form.password.length >= 8;

  const step1Valid = form.email && passwordValid && form.name && form.phone && form.company;

  const handleSubmitOrder = async () => {
    if (paymentInProgressRef.current) return;
    paymentInProgressRef.current = true;
    setSubmitting(true);
    const now = new Date();
    const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const orderNum = `BS-${datePart}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    setOrderNumber(orderNum);

    try {
      if (isSettingPassword) {
        await supabase.auth.updateUser({ password: form.password });
        await supabase.auth.updateUser({
          data: { ...(user?.user_metadata || {}), password_set: true },
        });
      }
      await supabase.auth.updateUser({
        data: { ...(user?.user_metadata || {}), name: form.name, phone: form.phone, company: form.company },
      });
    } catch { /* 프로필 업데이트 실패해도 주문은 진행 */ }

    try {
      await supabase.from('orders').insert([{
        order_number: orderNum,
        plan_name: plan.name,
        plan_price: totalPrice,
        content_count: plan.count,
        email: form.email,
        name: form.name,
        phone: form.phone,
        company: form.company,
        status: 'pending_payment',
      }]);
    } catch { /* 저장 실패해도 결과 표시 */ }

    try {
      await supabase.from('campaigns').insert([{
        user_id: user.id,
        order_number: orderNum,
        plan: plan.name,
        status: 'PAYMENT_PENDING',
        brand_name: form.company,
        product_name: plan.name,
        target_creators: plan.count || 0,
        matched_creators: 0,
        plan_price: totalPrice,
        content_count: plan.count || 0,
        customer_name: form.name,
        customer_email: form.email,
        customer_phone: form.phone,
      }]);
    } catch { /* campaigns 저장 실패해도 결과 표시 */ }

    setSubmitting(false);
    setCurrentStep(4);
    paymentInProgressRef.current = false;
  };

  const rollbackOrder = async (orderNum) => {
    try {
      const base = window.location.origin;
      await fetch(`${base}/api/checkout/rollback-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_number: orderNum }),
      });
    } catch (err) {
      console.error('rollback failed', err);
    }
  };

  const handleCardPayment = async () => {
    if (paymentInProgressRef.current) return;
    paymentInProgressRef.current = true;
    setSubmitting(true);
    const now = new Date();
    const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const orderNum = `BS-${datePart}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    setOrderNumber(orderNum);

    try {
      if (isSettingPassword) {
        await supabase.auth.updateUser({ password: form.password });
        await supabase.auth.updateUser({
          data: { ...(user?.user_metadata || {}), password_set: true },
        });
      }
      await supabase.auth.updateUser({
        data: { ...(user?.user_metadata || {}), name: form.name, phone: form.phone, company: form.company },
      });
    } catch { /* 프로필 업데이트 실패해도 진행 */ }

    const base = window.location.origin;

    // 1) 결제 파라미터 먼저 확인. 실패하면 주문/캠페인 생성 없이 종료
    let params;
    try {
      const res = await fetch(`${base}/api/inicis/payment-params`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oid: orderNum,
          price: totalPrice,
          goodname: `${plan.name} (${plan.count}개)`,
          buyername: form.name,
          buyertel: form.phone,
          buyeremail: form.email,
        }),
      });
      params = await res.json();
      if (!res.ok || params.error) {
        paymentInProgressRef.current = false;
        setSubmitting(false);
        alert(params.error || '결제 정보 생성에 실패했습니다. 계좌이체를 이용해 주시거나 관리자에게 문의하세요.');
        return;
      }
    } catch (e) {
      console.error(e);
      paymentInProgressRef.current = false;
      setSubmitting(false);
      alert('카드 결제 기능은 현재 준비중입니다. 계좌이체를 이용해 주시길 부탁드립니다.');
      return;
    }

    // 2) 결제창이 정상적으로 열릴 수 있을 때만 주문/캠페인 생성
    try {
      await supabase.from('orders').insert([{
        order_number: orderNum,
        plan_name: plan.name,
        plan_price: totalPrice,
        content_count: plan.count,
        email: form.email,
        name: form.name,
        phone: form.phone,
        company: form.company,
        status: 'pending_payment',
      }]);
    } catch {
      paymentInProgressRef.current = false;
      setSubmitting(false);
      alert('주문 저장에 실패했습니다. 다시 시도해 주세요.');
      return;
    }

    try {
      await supabase.from('campaigns').insert([{
        user_id: user.id,
        order_number: orderNum,
        plan: plan.name,
        status: 'PAYMENT_PENDING',
        brand_name: form.company,
        product_name: plan.name,
        target_creators: plan.count || 0,
        matched_creators: 0,
        plan_price: totalPrice,
        content_count: plan.count || 0,
        customer_name: form.name,
        customer_email: form.email,
        customer_phone: form.phone,
      }]);
    } catch {
      await rollbackOrder(orderNum);
      paymentInProgressRef.current = false;
      setSubmitting(false);
      alert('캠페인 저장에 실패했습니다. 다시 시도해 주세요.');
      return;
    }

    // 3) 결제창 오픈. 실패하면 방금 만든 주문/캠페인 롤백
    try {
      const formId = 'inicis-pay-form';
      let formEl = document.getElementById(formId);
      if (formEl) formEl.remove();
      formEl = document.createElement('form');
      formEl.id = formId;
      formEl.method = 'POST';
      formEl.action = 'https://stdpay.inicis.com/stdpay/INIStdPay.php';
      formEl.target = 'inicis_pay_window';
      formEl.style.display = 'none';

      const keys = ['version', 'mid', 'oid', 'price', 'currency', 'goodname', 'buyername', 'buyertel', 'buyeremail', 'timestamp', 'signature', 'verification', 'mKey', 'returnUrl', 'closeUrl', 'use_chkfake', 'gopaymethod', 'acceptmethod'];
      keys.forEach((k) => {
        if (params[k] != null && params[k] !== '') {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = k;
          input.value = params[k];
          formEl.appendChild(input);
        }
      });

      document.body.appendChild(formEl);
      window.open('', 'inicis_pay_window', 'width=500,height=700,scrollbars=yes');
      formEl.submit();
      formEl.remove();
    } catch (e) {
      console.error(e);
      await rollbackOrder(orderNum);
      paymentInProgressRef.current = false;
      setSubmitting(false);
      alert('카드 결제 기능은 준비 중입니다. 계좌이체를 이용해 주시길 부탁드립니다.');
    }
  };

  const goNext = () => setCurrentStep(s => s + 1);

  const handleStep1Next = async () => {
    if (!step1Valid) return;
    if (isSettingPassword) {
      goNext();
      return;
    }
    setVerifyingPassword(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: form.email.trim(),
      password: form.password,
    });
    setVerifyingPassword(false);
    if (error) {
      alert('비밀번호가 일치하지 않습니다. 다시 입력해 주세요.');
      return;
    }
    goNext();
  };

  const goPrev = () => setCurrentStep(s => s - 1);

  const selectPlan = (id) => {
    setSelectedPlanId(id);
    if (id === 'Visit') return;
    setCurrentStep(1);
  };

  return (
    <div className="font-sans antialiased text-white bg-[#020617] min-h-screen flex flex-col selection:bg-purple-500/30">
      <Navbar />
      <div className="flex-1 pt-36 pb-24 px-4">
        <div className="max-w-3xl mx-auto">

          {/* Header */}
          <div className="text-center mb-16">
            <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-slate-500 hover:text-white text-sm font-medium mb-6 transition-colors">
              <ArrowLeft size={18} /> 돌아가기
            </button>
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-black text-purple-400 tracking-[0.2em] uppercase">
                <Sparkles size={14} className="animate-pulse" /> Quick Purchase
              </div>
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-4">빠른 구매</h1>
            <p className="text-lg text-slate-300 leading-relaxed max-w-xl mx-auto">
              원하는 플랜을 선택하고, 간편하게 시작하세요
            </p>
          </div>

          {/* Progress bar - always visible */}
          <StepIndicator currentStep={currentStep} />

          {/* Step 0: Plan selection */}
          {currentStep === 0 && (
            <div>
              <h2 className="text-2xl font-black text-white mb-10 text-center">요금제를 선택해주세요</h2>

              {/* Main plans */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {Object.values(PLANS).filter(p => !p.isVisit).map(p => (
                  <PlanCard
                    key={p.id}
                    plan={p}
                    selected={selectedPlanId === p.id}
                    onClick={() => selectPlan(p.id)}
                  />
                ))}
              </div>

              {/* Visit plan */}
              <button
                onClick={() => selectPlan('Visit')}
                className={`relative w-full text-left p-8 rounded-2xl border-2 transition-all duration-300 hover:-translate-y-1 ${
                  selectedPlanId === 'Visit'
                    ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/10'
                    : 'border-white/10 bg-white/[0.03] hover:border-white/20'
                }`}
              >
                <span className="absolute -top-4 left-6 bg-gradient-to-r from-orange-500 to-pink-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest shadow-lg">
                  OFFLINE SPECIAL
                </span>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-pink-500/20 border border-orange-500/30 flex items-center justify-center flex-shrink-0">
                      <MapPin size={22} className="text-orange-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white tracking-tight">Visit Content</h3>
                      <p className="text-sm text-slate-400">방문형 콘텐츠 · 오프라인 매출 펌핑 시딩 상품</p>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1 md:text-right">
                    <span className="text-3xl font-black text-orange-400">300,000</span>
                    <span className="text-slate-500 text-sm font-bold">원 / 1인</span>
                  </div>
                </div>
              </button>

              {/* Visit count selector */}
              {selectedPlanId === 'Visit' && (
                <div className="mt-6 bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8">
                  <h3 className="text-lg font-bold text-white mb-2">진행할 인원수를 선택해주세요</h3>
                  <p className="text-sm text-slate-500 mb-6">최소 1명부터 원하는 수량만큼 진행 가능합니다.</p>

                  <div className="flex items-center justify-center gap-6 mb-6">
                    <button
                      onClick={() => setVisitCount(c => Math.max(1, c - 1))}
                      className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-white/30 transition-all disabled:opacity-30"
                      disabled={visitCount <= 1}
                    >
                      <Minus size={20} />
                    </button>
                    <div className="text-center min-w-[120px] flex items-baseline justify-center gap-1">
                      <input
                        type="number"
                        min="1"
                        value={visitCount}
                        onChange={(e) => {
                          const v = parseInt(e.target.value, 10);
                          if (!isNaN(v) && v >= 1) setVisitCount(v);
                          else if (e.target.value === '') setVisitCount(1);
                        }}
                        className="w-20 text-center text-5xl font-black text-white bg-transparent border-b-2 border-white/20 focus:border-purple-500 outline-none transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <span className="text-slate-500 text-lg font-bold">명</span>
                    </div>
                    <button
                      onClick={() => setVisitCount(c => c + 1)}
                      className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-white/30 transition-all"
                    >
                      <Plus size={20} />
                    </button>
                  </div>

                  <div className="bg-white/[0.04] rounded-xl px-6 py-4 border border-white/10 mb-6 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">공급가액</span>
                      <span className="text-slate-300">{(300000 * visitCount).toLocaleString()}원</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">부가세 (10%)</span>
                      <span className="text-slate-300">{Math.round(300000 * visitCount * 0.1).toLocaleString()}원</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-white/10">
                      <span className="text-white font-bold text-sm">총 결제 금액 (VAT 포함)</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-purple-400">{Math.round(300000 * visitCount * 1.1).toLocaleString()}</span>
                        <span className="text-slate-500 text-sm font-bold">원</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setCurrentStep(1)}
                    className="w-full py-4 rounded-2xl font-bold text-lg bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:-translate-y-0.5 shadow-lg shadow-purple-500/20 transition-all"
                  >
                    다음 단계로 <ArrowRight size={18} className="inline ml-1" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Steps 1~3: Selected plan card */}
          {currentStep >= 1 && currentStep <= 3 && plan && (
            <div className="flex justify-center mb-10">
              <div className="w-full max-w-sm">
                <PlanCard
                  plan={plan}
                  selected={true}
                  onClick={null}
                  showChange={true}
                  onChangeClick={() => setCurrentStep(0)}
                />
              </div>
            </div>
          )}

          {/* Step 1: 정보입력 */}
          {currentStep === 1 && (
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-3xl p-8 md:p-12">
              <h2 className="text-xl font-black text-white mb-8">회원 정보 입력</h2>

              <div className="space-y-6">
                <Input label="이메일" required type="email" placeholder="your@email.com" value={form.email} onChange={set('email')} />

                {isSettingPassword ? (
                  <>
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex gap-3">
                      <AlertTriangle size={18} className="text-blue-400 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-blue-300">
                        <p className="mb-2">한 번만 설정해두시면, 다음 로그인부터는 이메일 + 비밀번호만으로 바로 들어올 수 있어요. 아래에서 비밀번호를 설정해주세요.</p>
                        <p className="text-blue-200/90 text-xs mt-1">이미 비밀번호가 있으시면 <button type="button" onClick={() => setIsSettingPassword(false)} className="underline hover:text-white">기존 비밀번호로 진행</button></p>
                        <p className="text-blue-200/80 text-xs mt-2">다음 구매부터는 비밀번호만 입력하면 됩니다. <Link to="/set-password?from=/checkout" className="underline hover:text-white">별도 설정 페이지에서 미리 설정하기</Link></p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <Input label="비밀번호 설정" required type="password" placeholder="8자 이상" value={form.password} onChange={set('password')} />
                      <Input label="비밀번호 확인" required type="password" placeholder="비밀번호 재입력" value={form.passwordConfirm} onChange={set('passwordConfirm')} />
                    </div>
                    {form.password && form.passwordConfirm && form.password !== form.passwordConfirm && (
                      <p className="text-red-400 text-sm font-medium -mt-3">비밀번호가 일치하지 않습니다.</p>
                    )}
                  </>
                ) : (
                  <>
                    <Input label="비밀번호" required type="password" placeholder="기존 비밀번호 입력" value={form.password} onChange={set('password')} />
                    <button
                      type="button"
                      onClick={() => setIsSettingPassword(true)}
                      className="text-xs text-slate-500 hover:text-purple-400 transition-colors font-medium underline underline-offset-2 -mt-2"
                    >
                      비밀번호를 새로 설정하고 싶어요
                    </button>
                  </>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <Input label="이름" required placeholder="홍길동" value={form.name} onChange={set('name')} />
                  <Input label="연락처" required type="tel" placeholder="010-1234-5678" value={form.phone} onChange={set('phone')} />
                </div>

                <Input label="회사명" required placeholder="주식회사 브랜드슬램" value={form.company} onChange={set('company')} />

                <button
                  onClick={handleStep1Next}
                  disabled={!step1Valid || verifyingPassword}
                  className={`w-full py-4 rounded-2xl font-bold text-lg transition-all mt-4 flex items-center justify-center gap-2 ${
                    step1Valid && !verifyingPassword
                      ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:-translate-y-0.5 shadow-lg shadow-purple-500/20'
                      : 'bg-white/5 text-slate-600 cursor-not-allowed'
                  }`}
                >
                  {verifyingPassword ? (
                    <>확인 중... <Loader2 size={18} className="animate-spin" /></>
                  ) : (
                    '다음 단계로'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: 약관동의 */}
          {currentStep === 2 && (
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-3xl p-8 md:p-12">
              <h2 className="text-xl font-black text-white mb-8">이용약관 동의</h2>

              <div className="space-y-4 mb-6">
                {AGREEMENT_ITEMS.map(item => (
                  <div
                    key={item.key}
                    className={`flex items-center gap-4 p-5 rounded-2xl border transition-all ${
                      agree[item.key]
                        ? 'bg-purple-500/10 border-purple-500/30'
                        : 'bg-white/[0.03] border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all cursor-pointer ${
                        agree[item.key] ? 'bg-purple-500 border-purple-500' : 'border-white/20'
                      }`}
                      onClick={() => toggleAgree(item.key)}
                    >
                      {agree[item.key] && <Check size={14} className="text-white" strokeWidth={3} />}
                    </div>
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => toggleAgree(item.key)}>
                      <p className="font-bold text-white text-sm">{item.title}</p>
                      <p className="text-slate-500 text-xs mt-0.5">{item.desc}</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setLegalModal(item.legalKey); }}
                      className="text-slate-600 flex-shrink-0 hover:text-purple-400 transition-colors p-1"
                    >
                      <ExternalLink size={18} />
                    </button>
                  </div>
                ))}
              </div>

              <div
                className={`flex items-center gap-4 p-5 rounded-2xl cursor-pointer transition-all border ${
                  allAgreed
                    ? 'bg-purple-500/15 border-purple-500/40'
                    : 'bg-white/[0.04] border-white/10'
                }`}
                onClick={toggleAll}
              >
                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                  allAgreed ? 'bg-purple-500 border-purple-500' : 'border-white/20'
                }`}>
                  {allAgreed && <Check size={14} className="text-white" strokeWidth={3} />}
                </div>
                <p className="font-bold text-white text-sm">전체 약관에 동의합니다</p>
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  onClick={goPrev}
                  className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-slate-400 bg-white/5 border border-white/10 hover:border-white/20 hover:text-white transition-all"
                >
                  <ArrowLeft size={18} /> 이전
                </button>
                <button
                  onClick={goNext}
                  disabled={!allAgreed}
                  className={`flex-1 py-4 rounded-2xl font-bold text-lg transition-all ${
                    allAgreed
                      ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:-translate-y-0.5 shadow-lg shadow-purple-500/20'
                      : 'bg-white/5 text-slate-600 cursor-not-allowed'
                  }`}
                >
                  동의하고 계속하기
                </button>
              </div>
            </div>
          )}

          {/* Step 3: 결제 */}
          {currentStep === 3 && plan && (
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-3xl p-8 md:p-12">
              <h2 className="text-xl font-black text-white mb-8">결제 정보</h2>

              <div className="bg-white/[0.04] rounded-2xl p-6 mb-8 border border-white/10">
                <h3 className="font-bold text-white mb-4">주문 내역</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-slate-500">요금제</span><span className="font-bold text-white">{plan.name}</span></div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{plan.isVisit ? '진행 인원수' : '월 콘텐츠 수'}</span>
                    <span className="font-bold text-white">{plan.count}{plan.isVisit ? '명' : '개'}</span>
                  </div>
                  <div className="flex justify-between"><span className="text-slate-500">이메일</span><span className="font-medium text-slate-300">{form.email}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">이름</span><span className="font-medium text-slate-300">{form.name}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">회사명</span><span className="font-medium text-slate-300">{form.company}</span></div>
                  <div className="flex justify-between pt-3 border-t border-white/10">
                    <span className="text-slate-500">공급가액</span>
                    <span className="font-medium text-slate-300">{supplyPrice.toLocaleString()}원</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">부가세 (10%)</span>
                    <span className="font-medium text-slate-300">{vatAmount.toLocaleString()}원</span>
                  </div>
                  <div className="flex justify-between pt-3 border-t border-white/10">
                    <span className="font-bold text-white">총 결제 금액 (VAT 포함)</span>
                    <span className="text-xl font-black text-purple-400">{totalPrice.toLocaleString()}원</span>
                  </div>
                </div>
              </div>

              <h3 className="font-bold text-white mb-4">결제 수단</h3>
              <div className="flex gap-4 mb-6">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('bank')}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold border-2 transition-all ${
                    paymentMethod === 'bank'
                      ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                      : 'bg-white/[0.04] border-white/10 text-slate-400 hover:border-white/20'
                  }`}
                >
                  <CreditCard size={20} /> 계좌이체
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold border-2 transition-all ${
                    paymentMethod === 'card'
                      ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                      : 'bg-white/[0.04] border-white/10 text-slate-400 hover:border-white/20'
                  }`}
                >
                  <CreditCard size={20} /> 신용카드
                </button>
              </div>

              {paymentMethod === 'bank' && (
                <>
                  <h3 className="font-bold text-white mb-4">계좌이체 정보</h3>
                  <div className="bg-white/[0.04] rounded-2xl p-6 mb-6 border border-white/10">
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between"><span className="text-slate-500">은행</span><span className="font-bold text-white">{BANK_INFO.bank}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">계좌번호</span><span className="font-bold text-white">{BANK_INFO.account}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">예금주</span><span className="font-bold text-white">{BANK_INFO.holder}</span></div>
                      <div className="flex justify-between pt-3 border-t border-white/10">
                        <span className="font-bold text-white">입금 금액 (VAT 포함)</span>
                        <span className="text-xl font-black text-purple-400">{totalPrice.toLocaleString()}원</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-5 mb-8">
                    <div className="flex gap-3">
                      <AlertTriangle size={20} className="text-yellow-400 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-bold text-yellow-300">입금 기한: 오늘 오후 11시 59분까지</p>
                        <p className="text-yellow-400/70 mt-1">입금자명은 가입하신 이름({form.name})과 동일하게 입금해주세요.</p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {paymentMethod === 'card' && (
                <div className="bg-white/[0.04] rounded-2xl p-5 mb-8 border border-white/10">
                  <p className="text-sm text-slate-400">결제하기 버튼을 누르면 KG이니시스 결제창이 열립니다. 카드 정보를 입력해 결제를 완료해 주세요.</p>
                </div>
              )}

              <div className="bg-slate-800/30 rounded-2xl p-5 mb-8 border border-white/10">
                <p className="text-xs text-slate-400 leading-relaxed">
                  모든 거래에 대한 책임과 배송, 교환, 환불 민원 등의 처리는 (주)브랜드슬램에서 진행합니다.
                  <br />
                  자세한 문의는 Email: contact@slam-global.com , 유선: 070-8027-2323 으로 가능합니다.
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={goPrev}
                  className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-slate-400 bg-white/5 border border-white/10 hover:border-white/20 hover:text-white transition-all"
                >
                  <ArrowLeft size={18} /> 이전
                </button>
                {paymentMethod === 'bank' ? (
                  <button
                    onClick={handleSubmitOrder}
                    disabled={submitting}
                    className="flex-1 py-4 rounded-2xl font-bold text-lg bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:-translate-y-0.5 shadow-lg shadow-purple-500/20 transition-all disabled:opacity-50"
                  >
                    {submitting ? '처리 중...' : '입금 완료'}
                  </button>
                ) : (
                  <button
                    onClick={handleCardPayment}
                    disabled={submitting}
                    className="flex-1 py-4 rounded-2xl font-bold text-lg bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:-translate-y-0.5 shadow-lg shadow-purple-500/20 transition-all disabled:opacity-50"
                  >
                    {submitting ? '결제창 열기 중...' : '신용카드 결제'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Step 4: 완료 */}
          {currentStep === 4 && plan && (
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-3xl p-8 md:p-12">
              <div className="text-center mb-10">
                <div className="relative w-20 h-20 mx-auto mb-6">
                  <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping opacity-50"></div>
                  <div className="relative w-full h-full bg-green-500/10 border border-green-500/30 rounded-full flex items-center justify-center">
                    <CheckCircle2 size={40} className="text-green-400" />
                  </div>
                </div>
                <h2 className="text-2xl font-black text-white mb-3">주문이 접수되었습니다!</h2>
                <p className="text-slate-400 leading-relaxed">
                  입금 확인 후 캠페인 대시보드에 접근하실 수 있습니다.<br />
                  입금 확인은 영업일 기준 1~2시간 이내에 완료됩니다.
                </p>
              </div>

              <div className="bg-white/[0.04] rounded-2xl p-6 mb-8 border border-white/10">
                <h3 className="font-bold text-white mb-4">주문 정보</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-slate-500">주문번호</span><span className="font-bold text-white">{orderNumber}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">요금제</span><span className="font-bold text-white">{plan.name}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">공급가액</span><span className="font-medium text-slate-300">{supplyPrice.toLocaleString()}원</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">부가세 (10%)</span><span className="font-medium text-slate-300">{vatAmount.toLocaleString()}원</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">결제 금액 (VAT 포함)</span><span className="font-bold text-purple-400">{totalPrice.toLocaleString()}원</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">이메일</span><span className="font-medium text-slate-300">{form.email}</span></div>
                </div>
              </div>

              <div className="space-y-3">
                <Link
                  to="/dashboard"
                  className="w-full py-4 rounded-2xl font-bold text-lg bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:-translate-y-0.5 shadow-lg shadow-purple-500/20 transition-all flex items-center justify-center gap-2"
                >
                  캠페인 대시보드 바로가기 <ExternalLink size={18} />
                </Link>
                <Link
                  to="/"
                  className="w-full py-4 rounded-2xl font-bold text-slate-300 bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex items-center justify-center"
                >
                  메인으로 돌아가기
                </Link>
              </div>

              <p className="text-center text-sm text-slate-600 mt-8">
                입금 확인 관련 문의: contact@slam-global.com
              </p>
            </div>
          )}

        </div>
      </div>
      <Footer />

      {legalModal && (
        <LegalModal
          isOpen={true}
          onClose={() => setLegalModal(null)}
          title={LEGAL_CONTENTS[legalModal].title}
          content={LEGAL_CONTENTS[legalModal].content}
        />
      )}
    </div>
  );
}
