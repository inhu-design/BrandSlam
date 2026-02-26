import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, ArrowLeft, Check, Sparkles, ClipboardList,
  Target, BarChart3, MessageCircle,
  Zap, Star, CheckCircle2, Brain, TrendingUp, Globe, Search
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { supabase } from '../lib/supabase';

const STEPS = [
  { label: '기본 정보', icon: ClipboardList },
  { label: '캠페인 설계', icon: Target },
  { label: '브랜드 현황', icon: BarChart3 },
  { label: '예산 선택', icon: Sparkles },
];

const COUNTRIES = ['한국', '미국', '베트남', '인도네시아', '말레이시아', '필리핀'];
const GOALS = ['매출(전환) 상승', '제품 바이럴', '쉽고 빠른 시딩 확장', '리뷰·UGC 확보', '특정 국가 시장 진입', '신제품 출시 부스팅'];
const DURATIONS = ['단기 (1~2개월)', '중기 (3~6개월)', '장기 (6개월~1년)', '유연하게 진행하고 싶음'];
const CHALLENGES = ['콘텐츠 부족', '리뷰 부족', '매출 성장 정체', '글로벌 확장 필요', '신제품 초기 부스팅 필요', '인지도 부족', '내부 인력 부족', '성과 관리 체계 부족', '데이터 부족'];
const CATEGORIES = ['스킨케어', '메이크업', '헤어케어', '이너뷰티', '건강기능식품', '라이프스타일'];
const CHANNELS = ['자사몰', '쿠팡', '네이버 스마트스토어', '아마존', '쇼피', '틱톡샵', '오프라인', '아직 준비 중'];
const BUDGETS = ['60만원 이하', '150만원 이하', '150만원 이상'];

const GOOGLE_CALENDAR_URL = 'https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ0akmWGcWqQjDrQbXiu-G2BuVVcPvtzZWr2riyzi2dfD2UvvyZp_NveNX6fFlqnt8BVm2fQFdJ6';

const RECOMMENDATIONS = {
  '60만원 이하': {
    type: 'plan',
    tagColor: 'text-blue-400 bg-blue-500/15 border-blue-500/30',
    tag: 'Starter 추천',
    planId: 'Starter',
    title: 'Starter',
    price: '590,000',
    unit: '원',
    contentCount: '10',
    subtitle: '첫 시딩이거나 실패 확률을 줄이고 싶은 브랜드',
    description: '합리적인 비용으로 글로벌 시딩을 시작할 수 있는 엔트리 플랜입니다. 10건의 콘텐츠로 시장 반응을 검증하고 다음 단계를 준비하세요.',
    gradient: 'from-blue-500 to-cyan-500',
    features: [
      '콘텐츠 10건 제공',
      '캠페인 운영 대행',
      '콘텐츠 업로드 트래킹',
      '기본 리포트 서비스 제공',
    ],
    cta: { label: 'Starter 플랜 시작하기', to: '/' },
    secondary: { label: '전문가 상담 예약', href: GOOGLE_CALENDAR_URL },
  },
  '150만원 이하': {
    type: 'plan',
    tagColor: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30',
    tag: 'Growth 추천 · BEST',
    planId: 'Growth',
    title: 'Growth',
    price: '990,000',
    unit: '원',
    contentCount: '20',
    subtitle: '타겟 고객이 명확한 브랜드에 최적화',
    description: '20건의 콘텐츠와 성과 리포트, VOC 요약까지 포함된 가장 인기 있는 플랜입니다. 본격적인 성장을 시작하세요.',
    gradient: 'from-emerald-500 to-teal-500',
    features: [
      '콘텐츠 20건 제공',
      '캠페인 운영 대행',
      '콘텐츠 업로드 트래킹',
      '성과 리포트 (조회수, 반응)',
      'VOC 요약 서비스 제공',
    ],
    cta: { label: 'Growth 플랜 시작하기', to: '/' },
    secondary: { label: '전문가 상담 예약', href: GOOGLE_CALENDAR_URL },
  },
  '150만원 이상': {
    type: 'plan',
    tagColor: 'text-purple-400 bg-purple-500/15 border-purple-500/30',
    tag: 'Scale50 추천 · MAX IMPACT',
    planId: 'Scale50',
    title: 'Scale50',
    price: '2,390,000',
    unit: '원',
    contentCount: '50',
    subtitle: '전환 및 매출 확장을 고려하는 브랜드',
    description: '50건의 대량 콘텐츠와 심화 분석, 원본 영상까지 제공하는 최상위 플랜입니다. 압도적인 볼륨으로 시장을 공략하세요.',
    gradient: 'from-purple-500 to-blue-500',
    features: [
      '콘텐츠 50건 제공',
      '캠페인 운영 대행',
      '콘텐츠 업로드 트래킹',
      '성과 리포트 & VOC 분석',
      '원본 영상 1개 제공',
    ],
    cta: { label: 'Scale50 플랜 시작하기', to: '/' },
    secondary: { label: '전문가 상담 예약', href: GOOGLE_CALENDAR_URL },
  },
};

const ToggleChip = ({ label, selected, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-5 py-3 rounded-xl text-sm font-medium transition-all duration-300 border ${
      selected
        ? 'bg-purple-500/20 border-purple-500/50 text-purple-300 shadow-lg shadow-purple-500/10'
        : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-300'
    }`}
  >
    {selected && <Check size={14} className="inline mr-1.5 -mt-0.5" />}
    {label}
  </button>
);

const RadioOption = ({ label, selected, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full px-5 py-4 rounded-xl text-left text-base font-medium transition-all duration-300 border flex items-center gap-3 ${
      selected
        ? 'bg-purple-500/20 border-purple-500/50 text-white'
        : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-300'
    }`}
  >
    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
      selected ? 'border-purple-400 bg-purple-500' : 'border-white/20'
    }`}>
      {selected && <Check size={10} className="text-white" />}
    </div>
    {label}
  </button>
);

const SectionLabel = ({ number, title, subtitle }) => (
  <div className="mb-5">
    <h3 className="text-xl font-bold text-white mb-1">
      <span className="text-purple-400 mr-2">{number}.</span>{title}
    </h3>
    {subtitle && <p className="text-slate-400 text-sm">{subtitle}</p>}
  </div>
);

const TextInput = ({ label, value, onChange, type = 'text', placeholder, required }) => (
  <div>
    <label className="block text-sm font-semibold text-slate-300 mb-2">
      {label} {required && <span className="text-purple-400">*</span>}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-5 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all text-base"
    />
  </div>
);

const ANALYSIS_STEPS = [
  { icon: Search, text: '입력 데이터를 수집하고 있습니다...', duration: 1500 },
  { icon: Globe, text: '타겟 국가 시장 데이터를 분석 중입니다...', duration: 2000 },
  { icon: Brain, text: 'AI가 브랜드 적합도를 평가하고 있습니다...', duration: 2500 },
  { icon: TrendingUp, text: '최적의 캠페인 전략을 도출하고 있습니다...', duration: 2000 },
  { icon: Sparkles, text: '맞춤 플랜을 생성하고 있습니다...', duration: 2000 },
];

export default function Diagnosis() {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [showResult, setShowResult] = useState(false);

  const [formData, setFormData] = useState({
    brandName: '', contactName: '', position: '', email: '', phone: '',
    countries: [], goals: [], goalsOther: '',
    duration: '',
    challenges: [], challengesOther: '',
    productLink: '',
    categories: [], categoriesOther: '',
    salesChannels: [], salesChannelsOther: '',
    budget: '',
  });

  useEffect(() => { window.scrollTo(0, 0); }, []);
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [step, showResult]);

  const set = (field) => (value) => setFormData(prev => ({ ...prev, [field]: value }));

  const toggleArray = (field, item) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter(i => i !== item)
        : [...prev[field], item],
    }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await supabase.from('diagnoses').insert([{
        brand_name: formData.brandName,
        contact_name: formData.contactName,
        position: formData.position,
        email: formData.email,
        phone: formData.phone,
        countries: formData.countries,
        goals: [...formData.goals, formData.goalsOther && `기타: ${formData.goalsOther}`].filter(Boolean),
        duration: formData.duration,
        challenges: [...formData.challenges, formData.challengesOther && `기타: ${formData.challengesOther}`].filter(Boolean),
        product_link: formData.productLink,
        categories: [...formData.categories, formData.categoriesOther && `기타: ${formData.categoriesOther}`].filter(Boolean),
        sales_channels: [...formData.salesChannels, formData.salesChannelsOther && `기타: ${formData.salesChannelsOther}`].filter(Boolean),
        budget: formData.budget,
      }]);
    } catch { /* 데이터 저장 실패해도 결과는 정상 노출 */ }
    setSubmitting(false);
    setAnalyzing(true);
    setAnalysisStep(0);

    for (let i = 0; i < ANALYSIS_STEPS.length; i++) {
      setAnalysisStep(i);
      await new Promise(r => setTimeout(r, ANALYSIS_STEPS[i].duration));
    }

    setAnalyzing(false);
    setShowResult(true);
  };

  const canProceed = () => {
    switch (step) {
      case 1: return formData.brandName && formData.contactName && formData.email && formData.phone;
      case 2: return formData.countries.length > 0 && formData.goals.length > 0 && formData.duration;
      case 3: return formData.challenges.length > 0 && formData.categories.length > 0;
      case 4: return !!formData.budget;
      default: return false;
    }
  };

  const rec = RECOMMENDATIONS[formData.budget];

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-5">
            <SectionLabel number="1" title="기본 정보" subtitle="캠페인 진단을 위한 기본 정보를 입력해주세요." />
            <TextInput label="브랜드명" value={formData.brandName} onChange={set('brandName')} placeholder="예) 슬램 글로벌" required />
            <TextInput label="담당자명" value={formData.contactName} onChange={set('contactName')} placeholder="예) 홍길동" required />
            <TextInput label="직책" value={formData.position} onChange={set('position')} placeholder="예) 마케팅 매니저" />
            <TextInput label="이메일 주소" value={formData.email} onChange={set('email')} type="email" placeholder="example@company.com" required />
            <TextInput label="전화번호" value={formData.phone} onChange={set('phone')} type="tel" placeholder="010-0000-0000" required />
          </div>
        );

      case 2:
        return (
          <div className="space-y-10">
            <div>
              <SectionLabel number="2" title="캠페인 희망 국가" subtitle="캠페인을 진행하고 싶은 국가를 선택해주세요. (복수 선택 가능)" />
              <div className="flex flex-wrap gap-3">
                {COUNTRIES.map(c => (
                  <ToggleChip key={c} label={c} selected={formData.countries.includes(c)} onClick={() => toggleArray('countries', c)} />
                ))}
              </div>
            </div>

            <div>
              <SectionLabel number="3" title="캠페인 핵심 목표" subtitle="이번 캠페인을 통해 가장 중요하게 달성하고 싶은 목표를 선택해주세요. (복수 선택 가능)" />
              <div className="flex flex-wrap gap-3 mb-3">
                {GOALS.map(g => (
                  <ToggleChip key={g} label={g} selected={formData.goals.includes(g)} onClick={() => toggleArray('goals', g)} />
                ))}
                <ToggleChip label="기타" selected={formData.goals.includes('기타')} onClick={() => toggleArray('goals', '기타')} />
              </div>
              {formData.goals.includes('기타') && (
                <input
                  type="text" value={formData.goalsOther} onChange={e => set('goalsOther')(e.target.value)}
                  placeholder="직접 입력해주세요" className="w-full px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/50 text-sm mt-2"
                />
              )}
            </div>

            <div>
              <SectionLabel number="4" title="예상 캠페인 기간" subtitle="희망하시는 캠페인 운영 기간을 선택해주세요." />
              <div className="space-y-3">
                {DURATIONS.map(d => (
                  <RadioOption key={d} label={d} selected={formData.duration === d} onClick={() => set('duration')(d)} />
                ))}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-10">
            <div>
              <SectionLabel number="5" title="현재 브랜드의 주요 과제" subtitle="현재 가장 크게 느끼는 과제를 선택해주세요. (복수 선택 가능)" />
              <div className="flex flex-wrap gap-3 mb-3">
                {CHALLENGES.map(c => (
                  <ToggleChip key={c} label={c} selected={formData.challenges.includes(c)} onClick={() => toggleArray('challenges', c)} />
                ))}
                <ToggleChip label="기타" selected={formData.challenges.includes('기타')} onClick={() => toggleArray('challenges', '기타')} />
              </div>
              {formData.challenges.includes('기타') && (
                <input type="text" value={formData.challengesOther} onChange={e => set('challengesOther')(e.target.value)}
                  placeholder="직접 입력해주세요" className="w-full px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/50 text-sm mt-2" />
              )}
            </div>

            <div>
              <SectionLabel number="6" title="진행 희망 제품 링크" subtitle="진행을 원하는 제품의 링크를 입력해주세요. (자사몰 / 스마트스토어 / 아마존 등)" />
              <input type="url" value={formData.productLink} onChange={e => set('productLink')(e.target.value)}
                placeholder="https://..." className="w-full px-5 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 text-base" />
            </div>

            <div>
              <SectionLabel number="7" title="브랜드 카테고리" subtitle="해당하는 카테고리를 선택해주세요. (복수 선택 가능)" />
              <div className="flex flex-wrap gap-3 mb-3">
                {CATEGORIES.map(c => (
                  <ToggleChip key={c} label={c} selected={formData.categories.includes(c)} onClick={() => toggleArray('categories', c)} />
                ))}
                <ToggleChip label="기타" selected={formData.categories.includes('기타')} onClick={() => toggleArray('categories', '기타')} />
              </div>
              {formData.categories.includes('기타') && (
                <input type="text" value={formData.categoriesOther} onChange={e => set('categoriesOther')(e.target.value)}
                  placeholder="직접 입력해주세요" className="w-full px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/50 text-sm mt-2" />
              )}
            </div>

            <div>
              <SectionLabel number="8" title="현재 판매 채널" subtitle="현재 제품을 판매하고 있는 채널을 선택해주세요. (복수 선택 가능)" />
              <div className="flex flex-wrap gap-3 mb-3">
                {CHANNELS.map(c => (
                  <ToggleChip key={c} label={c} selected={formData.salesChannels.includes(c)} onClick={() => toggleArray('salesChannels', c)} />
                ))}
                <ToggleChip label="기타" selected={formData.salesChannels.includes('기타')} onClick={() => toggleArray('salesChannels', '기타')} />
              </div>
              {formData.salesChannels.includes('기타') && (
                <input type="text" value={formData.salesChannelsOther} onChange={e => set('salesChannelsOther')(e.target.value)}
                  placeholder="직접 입력해주세요" className="w-full px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/50 text-sm mt-2" />
              )}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-8">
            <SectionLabel number="9" title="월 예산 범위" subtitle="캠페인에 투자할 수 있는 월 예산 범위를 선택해주세요." />
            <div className="space-y-4">
              {BUDGETS.map(b => (
                <RadioOption key={b} label={b} selected={formData.budget === b} onClick={() => set('budget')(b)} />
              ))}
            </div>
            <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-6">
              <p className="text-slate-400 text-sm leading-relaxed">
                <span className="text-white font-semibold">입력해주신 정보를 바탕</span>으로 브랜드에 가장 적합한 캠페인 서비스를 추천해드립니다. 제출 후 바로 결과를 확인하실 수 있습니다.
              </p>
            </div>
          </div>
        );
      default: return null;
    }
  };

  if (analyzing) {
    const currentStep = ANALYSIS_STEPS[analysisStep];
    const CurrentIcon = currentStep.icon;
    const progress = ((analysisStep + 1) / ANALYSIS_STEPS.length) * 100;

    return (
      <div className="font-sans antialiased text-white bg-[#020617] min-h-screen flex flex-col selection:bg-purple-500/30">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4 py-32">
          <div className="max-w-lg w-full text-center">
            {/* Pulsing brain icon */}
            <div className="relative w-28 h-28 mx-auto mb-10">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/30 to-blue-500/30 rounded-full animate-ping"></div>
              <div className="absolute inset-2 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-full animate-pulse"></div>
              <div className="relative w-full h-full bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-full border border-white/10 flex items-center justify-center backdrop-blur-sm">
                <Brain size={40} className="text-purple-400 animate-pulse" />
              </div>
            </div>

            <h2 className="text-2xl md:text-3xl font-black mb-3 tracking-tight">
              AI 캠페인 분석 중
            </h2>
            <p className="text-slate-400 text-base mb-10">
              {formData.brandName}님의 브랜드 데이터를 분석하고 있습니다
            </p>

            {/* Progress bar */}
            <div className="w-full bg-white/5 rounded-full h-2 mb-8 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>

            {/* Analysis steps */}
            <div className="space-y-4 text-left">
              {ANALYSIS_STEPS.map((s, i) => {
                const StepIcon = s.icon;
                const isDone = i < analysisStep;
                const isCurrent = i === analysisStep;
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-4 px-5 py-3.5 rounded-xl border transition-all duration-500 ${
                      isDone
                        ? 'bg-purple-500/10 border-purple-500/20 opacity-60'
                        : isCurrent
                        ? 'bg-white/[0.06] border-white/15'
                        : 'bg-white/[0.02] border-white/[0.04] opacity-30'
                    }`}
                  >
                    <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                      isDone ? 'bg-purple-500/20' : isCurrent ? 'bg-purple-500/20' : 'bg-white/5'
                    }`}>
                      {isDone ? (
                        <Check size={16} className="text-purple-400" />
                      ) : (
                        <StepIcon size={16} className={isCurrent ? 'text-purple-400 animate-pulse' : 'text-slate-600'} />
                      )}
                    </div>
                    <span className={`text-sm font-medium ${
                      isDone ? 'text-purple-300' : isCurrent ? 'text-white' : 'text-slate-600'
                    }`}>
                      {s.text}
                    </span>
                    {isCurrent && (
                      <div className="ml-auto flex gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (showResult && rec) {
    return (
      <div className="font-sans antialiased text-white bg-[#020617] min-h-screen flex flex-col selection:bg-purple-500/30">
        <Navbar />
        <div className="flex-1 pt-36 pb-48 px-4">
          <div className="max-w-2xl mx-auto">
            {/* Result header */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-black text-purple-400 mb-6 tracking-[0.2em] uppercase">
                <CheckCircle2 size={14} /> 진단 완료
              </div>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-4">
                <span className="text-white">{formData.brandName}</span>
                <span className="text-slate-400 font-medium">님을 위한</span>
              </h1>
              <p className="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                맞춤 캠페인 추천 결과
              </p>
            </div>

            {/* Recommendation card */}
            <div className="bg-white/[0.04] border border-white/10 rounded-3xl overflow-hidden mb-8">
              {/* Card header */}
              <div className={`p-8 bg-gradient-to-r ${rec.gradient} relative overflow-hidden`}>
                <div className="absolute top-0 right-0 w-40 h-40 bg-white opacity-10 rounded-full -mr-12 -mt-12 blur-2xl"></div>
                <div className="relative z-10">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border mb-4 ${rec.tagColor}`}>
                    <Star size={12} /> {rec.tag}
                  </span>
                  <h2 className="text-2xl md:text-3xl font-black text-white mb-2">{rec.title}</h2>
                  {rec.price && (
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-4xl font-black text-white">{rec.price}</span>
                      <span className="text-lg text-white/70 font-medium">{rec.unit}</span>
                    </div>
                  )}
                  {rec.contentCount && (
                    <p className="text-white/90 text-sm font-bold mb-3">콘텐츠 {rec.contentCount}건 포함</p>
                  )}
                  {rec.subtitle && <p className="text-white/80 text-base font-medium">{rec.subtitle}</p>}
                </div>
              </div>

              {/* Card body */}
              <div className="p-8">
                <p className="text-slate-300 text-base leading-relaxed mb-8">{rec.description}</p>

                <div className="space-y-4 mb-8">
                  {rec.features.map((feat, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="p-1 rounded-full bg-purple-500/20 text-purple-400 flex-shrink-0">
                        <Check size={14} strokeWidth={3} />
                      </div>
                      <span className="text-white text-base font-medium">{feat}</span>
                    </div>
                  ))}
                </div>

                {/* CTAs */}
                <div className="space-y-3">
                  <Link
                    to={rec.cta.to}
                    className={`w-full py-4 rounded-2xl font-bold text-white text-lg bg-gradient-to-r ${rec.gradient} hover:opacity-90 transition-all hover:-translate-y-0.5 shadow-lg flex items-center justify-center gap-2`}
                  >
                    {rec.cta.label} <ArrowRight size={20} />
                  </Link>

                  {rec.secondary && (
                    <a
                      href={rec.secondary.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-4 rounded-2xl font-bold text-slate-300 text-base bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                    >
                      <MessageCircle size={18} /> {rec.secondary.label}
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Summary of submitted info */}
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
              <h4 className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-wider">제출된 진단 정보 요약</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-slate-500">브랜드</span><p className="text-white font-medium">{formData.brandName}</p></div>
                <div><span className="text-slate-500">담당자</span><p className="text-white font-medium">{formData.contactName}</p></div>
                <div><span className="text-slate-500">희망 국가</span><p className="text-white font-medium">{formData.countries.join(', ')}</p></div>
                <div><span className="text-slate-500">캠페인 기간</span><p className="text-white font-medium">{formData.duration}</p></div>
                <div className="col-span-2"><span className="text-slate-500">핵심 목표</span><p className="text-white font-medium">{formData.goals.join(', ')}</p></div>
                <div className="col-span-2"><span className="text-slate-500">월 예산</span><p className="text-white font-medium">{formData.budget}</p></div>
              </div>
            </div>

            {/* Restart */}
            <div className="text-center mt-10">
              <button
                onClick={() => { setShowResult(false); setStep(1); setFormData(prev => ({ ...prev, budget: '' })); }}
                className="text-slate-500 hover:text-slate-300 text-sm font-medium transition-colors"
              >
                다시 진단하기
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="font-sans antialiased text-white bg-[#020617] min-h-screen flex flex-col selection:bg-purple-500/30">
      <Navbar />
      <div className="flex-1 pt-36 pb-24 px-4">
        <div className="max-w-3xl mx-auto">

          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-black text-purple-400 mb-6 tracking-[0.2em] uppercase">
              <Sparkles size={14} className="animate-pulse" /> Free Diagnosis
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-6">
              무료 캠페인 진단
            </h1>
            <p className="text-lg text-slate-300 leading-relaxed max-w-xl mx-auto">
              브랜드에 맞는 글로벌 시딩/UGC 캠페인을 추천해드리기 위해<br className="hidden sm:inline" />
              간단한 무료 진단을 진행합니다.
            </p>
          </div>

          {/* Progress bar */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-3">
              {STEPS.map((s, i) => {
                const stepNum = i + 1;
                const isActive = step === stepNum;
                const isDone = step > stepNum;
                return (
                  <div key={i} className="flex items-center gap-2 flex-1">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold transition-all duration-300 ${
                      isDone ? 'bg-purple-500 text-white'
                      : isActive ? 'bg-purple-500/20 border-2 border-purple-500 text-purple-400'
                      : 'bg-white/5 border border-white/10 text-slate-600'
                    }`}>
                      {isDone ? <Check size={16} /> : stepNum}
                    </div>
                    <span className={`text-xs font-semibold hidden md:inline transition-colors ${
                      isActive ? 'text-white' : isDone ? 'text-purple-400' : 'text-slate-600'
                    }`}>{s.label}</span>
                    {i < STEPS.length - 1 && (
                      <div className={`flex-1 h-px mx-3 transition-all ${isDone ? 'bg-purple-500' : 'bg-white/10'}`}></div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form content */}
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-3xl p-8 md:p-12 mb-8">
            {renderStep()}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            {step > 1 ? (
              <button
                onClick={() => setStep(s => s - 1)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-slate-400 hover:text-white bg-white/5 border border-white/10 hover:border-white/20 transition-all font-medium"
              >
                <ArrowLeft size={18} /> 이전
              </button>
            ) : <div />}

            {step < 4 ? (
              <button
                onClick={() => canProceed() && setStep(s => s + 1)}
                disabled={!canProceed()}
                className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-lg transition-all ${
                  canProceed()
                    ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:-translate-y-0.5 shadow-lg shadow-purple-500/20'
                    : 'bg-white/5 text-slate-600 cursor-not-allowed'
                }`}
              >
                다음 <ArrowRight size={18} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!canProceed() || submitting}
                className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-lg transition-all ${
                  canProceed() && !submitting
                    ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:-translate-y-0.5 shadow-lg shadow-purple-500/20'
                    : 'bg-white/5 text-slate-600 cursor-not-allowed'
                }`}
              >
                {submitting ? '분석 중...' : '진단 결과 확인하기'} {!submitting && <Zap size={18} />}
              </button>
            )}
          </div>

        </div>
      </div>
      <Footer />
    </div>
  );
}
