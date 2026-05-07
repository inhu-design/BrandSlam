import React, { useState, useEffect, useLayoutEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Rocket, FileText, Upload, AlertCircle, Loader2,
  Building2, Package, Globe, PenLine, ChevronDown, MapPin,
  ClipboardPaste, Save,
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import ProtectedRoute from '../components/auth/ProtectedRoute';

const MAX_FILES = 5;
const MAX_FILE_SIZE_MB = 10;

const COUNTRY_OPTIONS = [
  { value: 'us', label: '🇺🇸 미국 거주자만 진행' },
  { value: 'us_ca', label: '🇺🇸 + 🇨🇦 미국/캐나다 믹스 허용' },
  { value: 'us_ca_eu', label: '🇺🇸 + 🇨🇦 + 🇪🇺 유럽 믹스 허용' },
];

const DELIVERY_OPTIONS = [
  { value: '2-3', label: '2~3일' },
  { value: '1w', label: '약 1주' },
  { value: '2w', label: '약 2주' },
  { value: 'other', label: '기타' },
];

const LS_KEY_PREFIX = 'campaign-setup-draft:';

const FORM_PERSIST_KEYS = [
  'companyName',
  'contactName',
  'contactTitle',
  'contactPhone',
  'contactEmail',
  'productName',
  'uspAndLinks',
  'countryRange',
  'deliveryTime',
  'deliveryOther',
  'signature',
  'writtenDate',
  'targetAudienceCountry',
  'eventName',
  'eventSchedule',
  'eventVenue',
  'eventGift',
];

function draftStorageKey(userId, cid) {
  return `${LS_KEY_PREFIX}${userId}:${cid}`;
}

function pickFormFromPayload(src) {
  const next = {};
  if (!src || typeof src !== 'object') return next;
  for (const k of FORM_PERSIST_KEYS) {
    if (src[k] === undefined || src[k] === null) continue;
    if (k === 'eventSchedule' && !Array.isArray(src.eventSchedule)) continue;
    next[k] = src[k];
  }
  return next;
}

function computeSetupProgress(form, agreements, isVisitPlan) {
  let done = 0;
  let total = 0;
  const step = (ok) => {
    total += 1;
    if (ok) done += 1;
  };

  step(!!String(form.companyName || '').trim());
  step(!!String(form.contactName || '').trim());
  step(!!String(form.contactTitle || '').trim());
  step(!!String(form.contactPhone || '').trim());
  step(!!String(form.contactEmail || '').trim());
  step(!!String(form.productName || '').trim());
  step(!!String(form.uspAndLinks || '').trim());
  step(!!String(form.signature || '').trim());
  step(!!String(form.writtenDate || '').trim());

  if (isVisitPlan) {
    step(!!String(form.targetAudienceCountry || '').trim());
    step(Array.isArray(form.eventSchedule) && form.eventSchedule.length > 0);
    step(!!String(form.eventVenue || '').trim());
  } else {
    step(!!form.countryRange);
    step(!!form.deliveryTime && (form.deliveryTime !== 'other' || !!String(form.deliveryOther || '').trim()));
  }

  for (const { key } of AGREEMENT_ITEMS) {
    step(!!agreements[key]);
  }

  if (total === 0) return 0;
  return Math.min(100, Math.round((done / total) * 100));
}

const AGREEMENT_ITEMS = [
  { key: 'koc', text: '본 캠페인은 KOC(마이크로 기반) 캠페인입니다.\nKOC(Knowledgeable Opinion Consumer)는 대형 인플루언서(KOL)와 달리, 전문성과 실제 사용 경험을 기반으로 콘텐츠를 제작하는 마이크로·니치 기반 소비자형 크리에이터를 의미합니다.\n평균 조회수나 팔로워 규모보다는 콘텐츠 수량 확산과 알고리즘 확률 확보를 통해 성과를 만들어냅니다.', highlight: true },
  { key: 'kpi', text: "본 캠페인의 KPI는 '조회수'가 아닌 '총 업로드 수량'입니다." },
  { key: 'strategy', text: '본 캠페인은 글로벌 성공 브랜드들이 실제로 인하우스에서 활용하는 확산형 마케팅 방식이며, 다수 콘텐츠를 통해 알고리즘 확률을 극대화하는 전략임을 이해합니다.' },
  { key: 'channels', text: '기본적으로 TikTok과 Instagram을 믹스하여 운영됩니다. 특정 채널만 필요 시 사전 요청 부탁드립니다.' },
  { key: 'no_review', text: '오가닉 캠페인 특성상 업로드 전 개별 콘텐츠 검수는 어렵습니다.' },
  { key: 'guide', text: '가이드는 방향성 가이드이며, 크리에이터 자율 영역이 포함됩니다.' },
  { key: 'no_edit', text: '업로드 이후 콘텐츠 수정은 원칙적으로 어렵습니다.' },
  { key: 'replace_30', text: '리스트 교체는 1회, 전체 인원의 30%까지 가능합니다.\n중복 방지를 위해 기존 시딩 인플루언서 리스트 사전 제공 시 제외 가능합니다.', highlight: true },
  { key: 'no_replace_after', text: '리스트 확정 이후 추가 교체는 불가합니다.' },
  { key: 'final', text: '위 모든 내용을 충분히 이해하고 동의합니다.' },
];

function DarkSelect({ value, onChange, options, placeholder, className = '' }) {
  const ref = useRef(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  const label = options.find((o) => o.value === value)?.label || placeholder;
  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full px-5 py-3.5 rounded-xl bg-white/5 border border-white/10 text-left text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all text-base flex items-center justify-between gap-2"
      >
        <span className={value ? 'text-white' : 'text-slate-500'}>{label}</span>
        <ChevronDown size={18} className={`text-slate-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-white/10 bg-[#0f172a] shadow-xl overflow-hidden">
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => { onChange({ target: { value: o.value } }); setOpen(false); }}
              className={`block w-full px-5 py-3.5 text-left text-sm transition-colors ${o.value === value ? 'bg-purple-500/20 text-purple-300' : 'text-slate-300 hover:bg-white/10'}`}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function toYMD(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function MultiDatePicker({ value = [], onChange, className = '' }) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const year = cursor.year;''
  const month = cursor.month;
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startPad = first.getDay();
  const daysInMonth = last.getDate();

  const goPrev = () => setCursor((c) => (c.month === 0 ? { year: c.year - 1, month: 11 } : { year: c.year, month: c.month - 1 }));
  const goNext = () => setCursor((c) => (c.month === 11 ? { year: c.year + 1, month: 0 } : { year: c.year, month: c.month + 1 }));

  const toggle = (dateStr) => {
    const set = new Set(value);
    if (set.has(dateStr)) set.delete(dateStr);
    else set.add(dateStr);
    onChange([...set].sort());
  };

  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];
  const cells = [];
  for (let i = 0; i < startPad; i++) cells.push({ key: `pad-${i}`, empty: true });
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = toYMD(new Date(year, month, d));
    cells.push({ key: dateStr, dateStr, day: d, empty: false });
  }

  return (
    <div className={`${className}`}>
      <div className="flex items-center justify-between mb-3">
        <button type="button" onClick={goPrev} className="p-2 rounded-lg text-slate-400 hover:bg-white/10 hover:text-white transition-colors">
          ‹
        </button>
        <span className="text-sm font-bold text-white">{year}년 {month + 1}월</span>
        <button type="button" onClick={goNext} className="p-2 rounded-lg text-slate-400 hover:bg-white/10 hover:text-white transition-colors">
          ›
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {weekDays.map((w) => (
          <div key={w} className="text-[10px] font-bold text-slate-500 py-1">{w}</div>
        ))}
        {cells.map((cell) => (
          cell.empty ? (
            <div key={cell.key} className="aspect-square" />
          ) : (
            <button
              key={cell.key}
              type="button"
              onClick={() => toggle(cell.dateStr)}
              className={`aspect-square rounded-lg text-sm transition-all ${
                value.includes(cell.dateStr)
                  ? 'bg-amber-500 text-slate-900 font-bold'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              {cell.day}
            </button>
          )
        ))}
      </div>
      {value.length > 0 && (
        <p className="text-xs text-slate-500 mt-2">선택된 날짜: {value.join(', ')}</p>
      )}
    </div>
  );
}

function CampaignSetupPage() {
  const { campaignId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [form, setForm] = useState({
    companyName: '',
    contactName: '',
    contactTitle: '',
    contactPhone: '',
    contactEmail: '',
    productName: '',
    productPhotos: [],
    uspAndLinks: '',
    countryRange: '',
    deliveryTime: '',
    deliveryOther: '',
    signature: '',
    writtenDate: new Date().toISOString().split('T')[0],
    targetAudienceCountry: '',
    eventName: '',
    eventSchedule: [],
    eventVenue: '',
    eventGift: '',
  });

  const [isVisitPlan, setIsVisitPlan] = useState(false);
  const [agreements, setAgreements] = useState(
    AGREEMENT_ITEMS.reduce((acc, { key }) => ({ ...acc, [key]: false }), {})
  );
  const [submitting, setSubmitting] = useState(false);
  const [fileError, setFileError] = useState('');
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [duplicateLoading, setDuplicateLoading] = useState(false);
  const [duplicateHint, setDuplicateHint] = useState(null);

  const autosaveReadyRef = useRef(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [campaignId]);

  useEffect(() => {
    const isReal = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(campaignId);
    if (!isReal || !user?.id) return;
    (async () => {
      const { data } = await supabase.from('campaigns').select('brand_name, customer_name, customer_email, plan').eq('id', campaignId).eq('user_id', user.id).single();
      if (data) {
        const visit = data.plan && (data.plan === 'Visit' || data.plan === 'Visit Content' || String(data.plan).toLowerCase().includes('visit'));
        setIsVisitPlan(!!visit);
        setForm((prev) => ({
          ...prev,
          companyName: data.brand_name || prev.companyName,
          contactName: data.customer_name || prev.contactName,
          contactEmail: data.customer_email || user?.email || prev.contactEmail,
        }));
      }
    })();
  }, [campaignId, user?.id, user?.email]);

  useLayoutEffect(() => {
    if (!user?.id || !campaignId) return;
    autosaveReadyRef.current = false;
    try {
      const raw = localStorage.getItem(draftStorageKey(user.id, campaignId));
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.form && typeof parsed.form === 'object') {
          const picked = pickFormFromPayload(parsed.form);
          setForm((prev) => ({ ...prev, ...picked, productPhotos: [] }));
        }
        if (parsed.agreements && typeof parsed.agreements === 'object') {
          setAgreements((prev) => ({ ...prev, ...parsed.agreements }));
        }
        if (typeof parsed.savedAt === 'number') setLastSavedAt(parsed.savedAt);
      }
    } catch {
      /* ignore corrupt draft */
    }
    autosaveReadyRef.current = true;
  }, [campaignId, user?.id]);

  useEffect(() => {
    if (!user?.id || !campaignId || !autosaveReadyRef.current) return;
    const timer = setTimeout(() => {
      try {
        const { productPhotos, ...rest } = form;
        void productPhotos;
        const payload = {
          form: { ...rest, productPhotos: [] },
          agreements,
          savedAt: Date.now(),
        };
        localStorage.setItem(draftStorageKey(user.id, campaignId), JSON.stringify(payload));
        setLastSavedAt(payload.savedAt);
      } catch {
        /* quota or private mode */
      }
    }, 450);
    return () => clearTimeout(timer);
  }, [form, agreements, campaignId, user?.id]);

  const setupProgress = useMemo(
    () => computeSetupProgress(form, agreements, isVisitPlan),
    [form, agreements, isVisitPlan],
  );

  const lastSavedLabel = useMemo(() => {
    if (!lastSavedAt) return null;
    return new Date(lastSavedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }, [lastSavedAt]);

  const handleLoadPreviousSubmission = async () => {
    if (!user?.id || !campaignId) return;
    setDuplicateLoading(true);
    setDuplicateHint(null);
    try {
      const isReal = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(campaignId);
      let query = supabase
        .from('campaign_setup_submissions')
        .select('form_data, created_at, campaign_id')
        .eq('user_id', user.id);
      if (isReal) query = query.neq('campaign_id', campaignId);
      const { data, error } = await query.order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (error) throw error;
      if (!data?.form_data || typeof data.form_data !== 'object') {
        setDuplicateHint('불러올 이전 캠페인 세팅 제출이 없습니다.');
        return;
      }
      const picked = pickFormFromPayload(data.form_data);
      setForm((prev) => ({ ...prev, ...picked, productPhotos: [] }));
      if (data.form_data.agreements && typeof data.form_data.agreements === 'object') {
        setAgreements(() => ({ ...AGREEMENT_ITEMS.reduce((acc, { key }) => ({ ...acc, [key]: false }), {}), ...data.form_data.agreements }));
      }
      setDuplicateHint('이전에 제출한 캠페인 세팅을 불러왔습니다. 이번 캠페인에 맞게 수정한 뒤 제출해 주세요.');
    } catch (e) {
      setDuplicateHint(e?.message || '불러오기에 실패했습니다.');
    } finally {
      setDuplicateLoading(false);
    }
  };

  const set = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const setAgree = (key) => (e) => {
    setAgreements((prev) => ({ ...prev, [key]: e.target.checked }));
  };

  const allAgreed = AGREEMENT_ITEMS.every(({ key }) => agreements[key]);

  const onFileChange = (e) => {
    setFileError('');
    const files = Array.from(e.target.files || []);
    if (files.length > MAX_FILES) {
      setFileError(`최대 ${MAX_FILES}개까지 업로드 가능합니다.`);
      return;
    }
    const oversized = files.filter((f) => f.size > MAX_FILE_SIZE_MB * 1024 * 1024);
    if (oversized.length) {
      setFileError(`파일당 최대 ${MAX_FILE_SIZE_MB}MB까지 가능합니다.`);
      return;
    }
    setForm((prev) => ({ ...prev, productPhotos: files }));
  };

  const baseRequired = [
    form.companyName,
    form.contactName,
    form.contactTitle,
    form.contactPhone,
    form.contactEmail,
    form.productName,
    form.uspAndLinks,
    form.signature,
    form.writtenDate,
  ].every(Boolean);
  const nonVisitTargetRequired = form.countryRange && form.deliveryTime;
  const visitTargetRequired = !isVisitPlan || !!form.targetAudienceCountry?.trim();
  const requiredFields = baseRequired && (isVisitPlan ? visitTargetRequired : nonVisitTargetRequired);

  const visitEventRequired = !isVisitPlan || (
    Array.isArray(form.eventSchedule) && form.eventSchedule.length > 0 && !!form.eventVenue?.trim()
  );
  const canSubmit = requiredFields && visitEventRequired && allAgreed && (form.deliveryTime !== 'other' || !!form.deliveryOther?.trim());

  const BUCKET_PHOTOS = 'campaign-photos';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    const { productPhotos, ...restForm } = form;
    const files = productPhotos || [];
    const productPhotoUrls = [];
    const isRealCampaign = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(campaignId);

    try {
      if (isRealCampaign && user?.id && files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
          const path = `${user.id}/${campaignId}/${Date.now()}_${i}_${safeName}`;
          const { error: uploadError } = await supabase.storage
            .from(BUCKET_PHOTOS)
            .upload(path, file, { upsert: false, contentType: file.type });
          if (uploadError) throw uploadError;
          const { data: urlData } = supabase.storage.from(BUCKET_PHOTOS).getPublicUrl(path);
          productPhotoUrls.push({ url: urlData.publicUrl, name: file.name });
        }
      }

      const payload = {
        ...restForm,
        productPhotos: files.map((f) => ({ name: f.name, size: f.size, type: f.type })),
        productPhotoUrls,
        agreements: { ...agreements },
        campaign_id: campaignId,
        user_id: user?.id,
        submitted_at: new Date().toISOString(),
      };

      if (isRealCampaign) {
        await supabase.from('campaign_setup_submissions').insert([
          { campaign_id: campaignId, user_id: user?.id, form_data: payload },
        ]);
        const productName = (restForm.productName || '').trim();
        await supabase.from('campaigns').update({
          status: 'KICKOFF',
          ...(productName && { product_name: productName }),
        }).eq('id', campaignId).eq('user_id', user.id);
      }
      try {
        if (user?.id && campaignId) localStorage.removeItem(draftStorageKey(user.id, campaignId));
      } catch {
        /* ignore */
      }
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error(err);
      alert(err?.message || '제출 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!user) {
    navigate('/login', { replace: true, state: { from: `/campaign-setup/${campaignId}` } });
    return null;
  }

  const inputClass =
    'w-full px-5 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all text-base';
  const labelClass = 'block text-sm font-semibold text-slate-300 mb-2';

  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col selection:bg-purple-500/30">
      <Navbar />
      <div className="flex-1 pt-32 pb-24 px-4">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-slate-500 hover:text-white text-sm font-medium mb-8 transition-colors"
          >
            <ArrowLeft size={18} /> 돌아가기
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
              <Rocket size={24} className="text-purple-400" />
            </div>
            <div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-relaxed">
                글로벌 마이크로 인플루언서 <br /> 시딩 캠페인 정보 요청서
            </h1>
              <p className="text-slate-500 text-sm mt-1">
                캠페인 진행을 위한 필수 정보를 입력해 주세요.  <span className="whitespace-pre-wrap"></span>    * 표시는 필수 항목입니다.
              </p>
            </div>
          </div>

          <div className="mb-6 space-y-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <span className="text-sm font-bold text-slate-200">작성 진행률</span>
                <span className="text-sm font-black text-purple-300 tabular-nums">약 {setupProgress}% 완료</span>
              </div>
              <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-purple-500 to-cyan-400 transition-[width] duration-500 ease-out"
                  style={{ width: `${setupProgress}%` }}
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3">
              <button
                type="button"
                onClick={handleLoadPreviousSubmission}
                disabled={duplicateLoading}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-purple-500/40 bg-purple-500/15 px-4 py-2.5 text-sm font-bold text-purple-200 hover:bg-purple-500/25 disabled:opacity-50 transition-colors"
              >
                {duplicateLoading ? <Loader2 size={18} className="animate-spin" /> : <ClipboardPaste size={18} />}
                이전 캠페인 세팅 불러오기
              </button>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Save size={14} className="text-slate-400 shrink-0" />
                <span>
                  입력 내용은 이 브라우저에 자동 저장됩니다.
                  {lastSavedLabel ? ` (마지막 저장 ${lastSavedLabel})` : ''}
                </span>
              </div>
            </div>
            {duplicateHint ? (
              <p className="text-sm text-slate-400 px-1">{duplicateHint}</p>
            ) : null}
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 mb-10 flex gap-3">
            <AlertCircle size={20} className="text-amber-400 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-200/90">
              정확하게 기입해 주시면 캠페인 기획 및 크리에이터 매칭에 큰 도움이 됩니다.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-10">
            {/* 1. 기본 정보 */}
            <section className="bg-white/[0.03] border border-white/[0.08] rounded-3xl p-8">
              <h2 className="text-lg font-black text-white mb-6 flex items-center gap-2">
                <Building2 size={20} className="text-cyan-400" /> 기본 정보
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>1. 회사명 <span className="text-purple-400">*</span></label>
                  <input type="text" required placeholder="주식회사 OOO" value={form.companyName} onChange={set('companyName')} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>2. 담당자명 / 직함 <span className="text-purple-400">*</span></label>
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" required placeholder="홍길동" value={form.contactName} onChange={set('contactName')} className={inputClass} />
                    <input type="text" required placeholder="마케팅팀장" value={form.contactTitle} onChange={set('contactTitle')} className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>3. 연락처 <span className="text-purple-400">*</span></label>
                  <input type="tel" required placeholder="010-1234-5678" value={form.contactPhone} onChange={set('contactPhone')} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>4. 담당자 이메일 <span className="text-purple-400">*</span></label>
                  <input type="email" required placeholder="contact@company.com" value={form.contactEmail} onChange={set('contactEmail')} className={inputClass} />
                </div>
              </div>
            </section>

            {/* 2. 캠페인/제품 정보 */}
            <section className="bg-white/[0.03] border border-white/[0.08] rounded-3xl p-8">
              <h2 className="text-lg font-black text-white mb-6 flex items-center gap-2">
                <Package size={20} className="text-cyan-400" /> 캠페인 · 제품 정보
              </h2>
              <div className="space-y-6">
                <div>
                  <label className={labelClass}>5. 캠페인 제품명 <span className="text-purple-400">*</span></label>
                  <input type="text" required placeholder="예: 비타민C 세럼" value={form.productName} onChange={set('productName')} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>5-1. 캠페인 진행 제품 사진 <span className="text-slate-500 text-xs">(선택)</span></label>
                  <p className="text-xs text-slate-500 mb-2">최대 5개, 파일당 10MB 이하</p>
                  <label className="flex flex-col items-center justify-center w-full min-h-[120px] rounded-xl border-2 border-dashed border-white/10 bg-white/5 hover:bg-white/[0.08] transition-all cursor-pointer">
                    <Upload size={28} className="text-slate-500 mb-2" />
                    <span className="text-sm text-slate-400">클릭하여 파일 선택</span>
                    <input type="file" accept="image/*" multiple className="hidden" onChange={onFileChange} />
                  </label>
                  {form.productPhotos?.length > 0 && (
                    <p className="text-sm text-slate-400 mt-2">
                      선택됨: {form.productPhotos.map((f) => f.name).join(', ')}
                    </p>
                  )}
                  {fileError && <p className="text-sm text-red-400 mt-2">{fileError}</p>}
                </div>
                <div>
                  <label className={labelClass}>6. 제품 한 줄 USP (Unique Selling Proposition) & 제품 링크 & 참고 숏폼 링크 <span className="text-purple-400">*</span></label>
                  <p className="text-xs text-slate-500 mb-2">강조할 프로모션·강점, 가이드 참고용 숏폼 링크를 함께 적어 주세요.</p>
                  <textarea required rows={4} placeholder="USP 한 줄 설명&#10;제품 링크: https://&#10;참고 숏폼: https://" value={form.uspAndLinks} onChange={set('uspAndLinks')} className={inputClass} />
                </div>
              </div>
            </section>

            {/* 3. 타겟 · 배송 (Visit 플랜은 타겟 오디언스 국가만) */}
            <section className="bg-white/[0.03] border border-white/[0.08] rounded-3xl p-8">
              <h2 className="text-lg font-black text-white mb-6 flex items-center gap-2">
                <Globe size={20} className="text-cyan-400" /> {isVisitPlan ? '타겟 오디언스' : '타겟 및 배송'}
              </h2>
              <div className="space-y-6">
                {isVisitPlan ? (
                  <div>
                    <label className={labelClass}>타겟 오디언스 국가 <span className="text-purple-400">*</span></label>
                    <p className="text-xs text-slate-500 mb-2">방문 캠페인 타겟 국가를 입력해 주세요.</p>
                    <input
                      type="text"
                      value={form.targetAudienceCountry}
                      onChange={set('targetAudienceCountry')}
                      placeholder="예: 미국, 캐나다"
                      className={inputClass}
                    />
                  </div>
                ) : (
                  <>
                    <div>
                      <label className={labelClass}>7. 거주 국가 범위 <span className="text-purple-400">*</span></label>
                      <p className="text-xs text-slate-500 mb-2">미국 타겟 시딩 기준. 믹스 허용 시 콘텐츠 다양성·알고리즘 확장에 유리합니다.</p>
                      <DarkSelect
                        value={form.countryRange}
                        onChange={set('countryRange')}
                        options={COUNTRY_OPTIONS}
                        placeholder="선택하세요"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>8. 제품 배송 예상 소요 기간 <span className="text-purple-400">*</span></label>
                      <DarkSelect
                        value={form.deliveryTime}
                        onChange={set('deliveryTime')}
                        options={DELIVERY_OPTIONS}
                        placeholder="선택하세요"
                      />
                      {form.deliveryTime === 'other' && (
                        <input type="text" placeholder="기타 (직접 입력)" value={form.deliveryOther} onChange={set('deliveryOther')} className={`${inputClass} mt-3`} />
                      )}
                    </div>
                  </>
                )}
              </div>
            </section>

            {/* 3-1. Visit 플랜 전용: 행사 정보 */}
            {isVisitPlan && (
              <section className="bg-amber-500/5 border border-amber-500/20 rounded-3xl p-8">
                <h2 className="text-lg font-black text-white mb-2 flex items-center gap-2">
                  <MapPin size={20} className="text-amber-400" /> 행사 정보 (Visit 플랜)
                </h2>
                <p className="text-sm text-slate-400 mb-6">인플루언서 매장 방문 일정·장소·증정 정보를 입력해 주세요.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={labelClass}>행사명 (선택)</label>
                    <input type="text" placeholder="예: 2026 봄 팝업 스토어" value={form.eventName} onChange={set('eventName')} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>행사일정 (인플루언서 방문 일정) <span className="text-purple-400">*</span></label>
                    <p className="text-xs text-slate-500 mb-2">달력에서 방문 가능한 날짜를 클릭해 선택하세요. 여러 날짜 선택 가능.</p>
                    <MultiDatePicker
                      value={Array.isArray(form.eventSchedule) ? form.eventSchedule : []}
                      onChange={(arr) => setForm((prev) => ({ ...prev, eventSchedule: arr }))}
                      className="bg-white/5 border border-white/10 rounded-xl p-4"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelClass}>행사 장소 (인플루언서가 방문할 장소) <span className="text-purple-400">*</span></label>
                    <input type="text" required={isVisitPlan} placeholder="주소 또는 장소명" value={form.eventVenue} onChange={set('eventVenue')} className={inputClass} />
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelClass}>브랜드사 증정 선물 (방문 인플루언서에게 제공) (선택)</label>
                    <input type="text" placeholder="예: 제품 샘플, 기념품 등" value={form.eventGift} onChange={set('eventGift')} className={inputClass} />
                  </div>
                </div>
              </section>
            )}

            {/* 4. 약관 동의 */}
            <section className="bg-white/[0.03] border border-white/[0.08] rounded-3xl p-8">
              <h2 className="text-lg font-black text-white mb-6 flex items-center gap-2">
                <FileText size={20} className="text-cyan-400" /> 캠페인 운영 정책 동의 (필수)
              </h2>
              <label className="flex items-center gap-4 p-4 rounded-2xl border-2 border-purple-500/40 bg-purple-500/10 hover:border-purple-500/60 cursor-pointer transition-all mb-4">
                <input
                  type="checkbox"
                  checked={allAgreed}
                  onChange={(e) => setAgreements(AGREEMENT_ITEMS.reduce((acc, { key }) => ({ ...acc, [key]: e.target.checked }), {}))}
                  className="w-5 h-5 rounded border-white/20 text-purple-500 focus:ring-purple-500/50"
                />
                <span className="text-sm font-bold text-white">모두 동의합니다</span>
              </label>
              <div className="space-y-4">
                {AGREEMENT_ITEMS.map(({ key, text, highlight }) => (
                  <label
                    key={key}
                    className={`flex items-start gap-4 p-4 rounded-2xl cursor-pointer transition-all ${
                      highlight
                        ? 'border-2 border-amber-500/40 bg-amber-500/10 hover:border-amber-500/60'
                        : 'border border-white/10 bg-white/[0.02] hover:border-white/20'
                    }`}
                  >
                    <input type="checkbox" checked={agreements[key]} onChange={setAgree(key)} className="mt-1 w-5 h-5 rounded border-white/20 text-purple-500 focus:ring-purple-500/50" />
                    <div className="flex-1 min-w-0">
                      {highlight && (
                        <span className="block text-[10px] font-black text-amber-400 uppercase tracking-widest mb-2">중요</span>
                      )}
                      <span className={`text-sm leading-relaxed ${highlight ? 'text-amber-100/95 font-medium' : 'text-slate-300'} ${highlight ? 'whitespace-pre-line' : ''}`}>{text}</span>
                    </div>
                  </label>
                ))}
              </div>
            </section>

            {/* 5. 서명 · 작성일 */}
            <section className="bg-white/[0.03] border border-white/[0.08] rounded-3xl p-8">
              <h2 className="text-lg font-black text-white mb-6 flex items-center gap-2">
                <PenLine size={20} className="text-cyan-400" /> 서명 및 작성일
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>19. 담당자 서명 (이름 기재) <span className="text-purple-400">*</span></label>
                  <input type="text" required placeholder="홍길동" value={form.signature} onChange={set('signature')} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>20. 작성일 <span className="text-purple-400">*</span></label>
                  <input type="date" required value={form.writtenDate} onChange={set('writtenDate')} className={inputClass} />
                </div>
              </div>
            </section>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
              <button type="button" onClick={() => navigate(-1)} className="flex-1 py-4 rounded-2xl font-bold text-slate-400 bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                취소
              </button>
              <button type="submit" disabled={!canSubmit || submitting} className="flex-1 py-4 rounded-2xl font-black text-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {submitting ? <Loader2 size={22} className="animate-spin" /> : <Rocket size={22} />}
                {submitting ? '제출 중...' : '제출하기'}
              </button>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default function CampaignSetup() {
  return (
    <ProtectedRoute>
      <CampaignSetupPage />
    </ProtectedRoute>
  );
}
