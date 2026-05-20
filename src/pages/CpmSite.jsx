import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calculator, Loader2, CreditCard } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import { INICIS_PROD_SCRIPT, loadIniStdPayScript } from '../lib/inicis-client.js';
import Footer from '../components/layout/Footer';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

function fmtKrw(n) {
  try {
    return `${Number(n).toLocaleString('ko-KR')}원`;
  } catch {
    return String(n);
  }
}

export default function CpmSite() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [cards, setCards] = useState([]);
  const [cardsLoading, setCardsLoading] = useState(true);
  const [cardsErr, setCardsErr] = useState('');
  const [sku, setSku] = useState('');
  const [mode, setMode] = useState('budget'); // budget | impressions
  const [budgetInput, setBudgetInput] = useState('500000');
  const [impressionsInput, setImpressionsInput] = useState('50000');

  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quote, setQuote] = useState(null);
  const [quoteErr, setQuoteErr] = useState('');

  const [orderBusy, setOrderBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setCardsLoading(true);
      try {
        const base = typeof window !== 'undefined' ? window.location.origin : '';
        const res = await fetch(`${base}/api/cpm/rate-cards`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || res.statusText);
        if (!cancelled) {
          setCards(data.cards || []);
          setSku((data.cards && data.cards[0]?.sku) || '');
        }
      } catch (e) {
        if (!cancelled) setCardsErr(e?.message || String(e));
      } finally {
        if (!cancelled) setCardsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedCard = useMemo(() => cards.find((c) => c.sku === sku) || null, [cards, sku]);
  const floorCpm = selectedCard ? Number(selectedCard.cpm_floor_krw) : 0;

  const runQuote = async () => {
    if (!floorCpm || floorCpm <= 0 || !sku) {
      setQuoteErr('먼저 공개 카드와 CPM 플로어 값을 선택하세요.');
      return;
    }
    setQuoteLoading(true);
    setQuoteErr('');
    setQuote(null);
    try {
      const base = typeof window !== 'undefined' ? window.location.origin : '';
      const payload =
        mode === 'budget'
          ? { budget_krw: Number(String(budgetInput).replace(/\D/g, '')), cpm_floor_krw: floorCpm }
          : {
              target_impressions: Number(String(impressionsInput).replace(/\D/g, '')),
              cpm_floor_krw: floorCpm,
            };
      const res = await fetch(`${base}/api/cpm/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || res.statusText);
      setQuote(data);
    } catch (e) {
      setQuoteErr(e?.message || String(e));
    } finally {
      setQuoteLoading(false);
    }
  };

  async function rollbackCpm(orderNum) {
    try {
      const base = typeof window !== 'undefined' ? window.location.origin : '';
      await fetch(`${base}/api/checkout/rollback-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_number: orderNum }),
      });
    } catch {
      // ignore rollback errors
    }
  }

  const cleanupInicisPayUi = () => {
    try {
      if (window.INIStdPay && typeof window.INIStdPay.popupClose === 'function') {
        window.INIStdPay.popupClose();
      }
    } catch {
      // ignore
    }
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
  };

  const handlePayClick = async () => {
    if (authLoading) return;
    if (!user) {
      navigate('/login', { state: { from: '/cpm' } });
      return;
    }
    const email = (user.email || '').trim();
    if (!email) {
      alert('결제를 위해 계정에 이메일이 필요합니다. 프로필을 업데이트 해 주세요.');
      return;
    }

    let budgetSubmit;
    let impressionsSubmit;
    if (mode === 'budget') {
      budgetSubmit = Number(String(budgetInput).replace(/\D/g, ''));
      if (!Number.isFinite(budgetSubmit) || budgetSubmit <= 0) {
        alert('예산을 입력해 주세요.');
        return;
      }
    } else {
      impressionsSubmit = Number(String(impressionsInput).replace(/\D/g, ''));
      if (!Number.isFinite(impressionsSubmit) || impressionsSubmit <= 0) {
        alert('목표 노출 수를 입력해 주세요.');
        return;
      }
    }

    const meta = user.user_metadata || {};
    const name = typeof meta.name === 'string' && meta.name.trim() ? meta.name.trim() : user.email.split('@')[0];
    let phoneRaw = typeof meta.phone === 'string' ? meta.phone : '';
    if (!phoneRaw.replace(/\s/g, '')) phoneRaw = '01000000001';
    const phone = phoneRaw.replace(/\s/g, '');

    const base = typeof window !== 'undefined' ? window.location.origin : '';
    let orderNumber = '';
    try {
      setOrderBusy(true);
      const ses = await supabase.auth.getSession();
      const token = ses.data.session?.access_token;
      if (!token) {
        alert('로그인 세션이 없습니다. 다시 로그인 해 주세요.');
        navigate('/login', { state: { from: '/cpm' } });
        setOrderBusy(false);
        return;
      }

      const body =
        mode === 'budget'
          ? { sku, budget_krw: budgetSubmit }
          : { sku, target_impressions: impressionsSubmit };
      const ores = await fetch(`${base}/api/cpm/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const odata = await ores.json().catch(() => ({}));
      if (!ores.ok || !odata.order?.order_number) throw new Error(odata.error || '주문 생성 실패');
      const ord = odata.order;
      orderNumber = ord.order_number;
      const price = Number(ord.budget_krw);
      const shortSku = sku.replace(/^CPM-/, '').slice(0, 20);
      const goodname = `CPM_${shortSku || 'SKU'}`;
      const orderDraft = {
        flow: 'cpm',
        order_number: orderNumber,
        user_id: user.id,
        email,
      };

      const paramsRes = await fetch(`${base}/api/inicis/payment-params`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oid: orderNumber,
          price,
          goodname,
          buyername: name.slice(0, 30),
          buyertel: phone,
          buyeremail: email,
          method: 'card',
          order_draft: orderDraft,
        }),
      });
      const params = await paramsRes.json().catch(() => ({}));
      if (!paramsRes.ok || params.error) {
        alert(params.error || '결제 파라미터를 만들지 못했습니다.');
        await rollbackCpm(orderNumber);
        setOrderBusy(false);
        return;
      }

      const formId = 'inicis-pay-form-cpm';
      document.getElementById(formId)?.remove();
      const formEl = document.createElement('form');
      formEl.id = formId;
      formEl.style.display = 'none';
      [
        'version',
        'mid',
        'oid',
        'price',
        'currency',
        'goodname',
        'buyername',
        'buyertel',
        'buyeremail',
        'timestamp',
        'signature',
        'verification',
        'mKey',
        'returnUrl',
        'closeUrl',
        'use_chkfake',
        'gopaymethod',
        'acceptmethod',
      ].forEach((k) => {
        if (params[k] != null) {
          const inp = document.createElement('input');
          inp.type = 'hidden';
          inp.name = k;
          inp.value = String(params[k]);
          formEl.appendChild(inp);
        }
      });
      document.body.appendChild(formEl);

      setOrderBusy(false);
      const payScriptUrl = params.payScriptUrl || INICIS_PROD_SCRIPT;
      await loadIniStdPayScript(payScriptUrl);
      window.INIStdPay.pay(formId);
    } catch (e) {
      console.error(e);
      alert(e?.message || String(e));
      if (orderNumber) await rollbackCpm(orderNumber);
      cleanupInicisPayUi();
      setOrderBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-5xl mx-auto px-4 py-28 w-full">
        <header className="mb-12">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400 mb-3">BrandSlam • CPM</p>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-3">
            CPM 레이트카드 & 즉시 견적
          </h1>
          <p className="text-slate-400 max-w-2xl text-sm md:text-base leading-relaxed">
            공개 카드 기준 플로어 CPM으로 예산 또는 목표 노출을 역산하고, 같은 조건으로 주문번호를 만들어 KG이니시스 결제로 이어집니다.
            Supabase에는 <code className="text-cyan-200/90">supabase-cpm-migration.sql</code> 실행이 필요합니다.
          </p>
        </header>

        <div className="grid md:grid-cols-5 gap-8">
          <section className="md:col-span-2 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="text-lg font-black text-white flex items-center gap-2 mb-4">
              <Calculator size={22} className="text-cyan-400" />
              공개 레이트카드
            </h2>
            {cardsLoading ? (
              <div className="flex items-center gap-2 text-slate-400 text-sm py-12 justify-center">
                <Loader2 className="animate-spin" /> 불러오는 중…
              </div>
            ) : cardsErr ? (
              <p className="text-rose-300 text-sm">{cardsErr}</p>
            ) : cards.length === 0 ? (
              <p className="text-sm text-slate-500">
                카드가 없습니다. 마이그레이션 실행 후 새로고침 해 주세요.
              </p>
            ) : (
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {cards.map((c) => (
                  <button
                    key={c.sku}
                    type="button"
                    onClick={() => setSku(c.sku)}
                    className={`w-full text-left rounded-xl px-4 py-3 border transition-colors text-sm ${c.sku === sku ? 'border-cyan-500 bg-cyan-500/[0.12]' : 'border-white/10 bg-black/30 hover:bg-white/[0.04]'}`}
                  >
                    <p className="font-mono text-xs text-cyan-300/90 break-all">{c.sku}</p>
                    <p className="text-white font-semibold mt-1">
                      {c.country_code} · {c.channel} · {fmtKrw(Number(c.cpm_floor_krw))}/1k 노출
                    </p>
                    {c.summary ? <p className="text-xs text-slate-400 mt-1 leading-snug">{c.summary}</p> : null}
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="md:col-span-3 rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-5">
            <h2 className="text-lg font-black text-white">역산 & 주문 시작</h2>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMode('budget')}
                className={`flex-1 py-2 rounded-lg text-sm font-bold ${mode === 'budget' ? 'bg-cyan-600 text-white' : 'bg-white/5 text-slate-400'}`}
              >
                예산으로 역산
              </button>
              <button
                type="button"
                onClick={() => setMode('impressions')}
                className={`flex-1 py-2 rounded-lg text-sm font-bold ${mode === 'impressions' ? 'bg-cyan-600 text-white' : 'bg-white/5 text-slate-400'}`}
              >
                노출수로 역산
              </button>
            </div>

            {mode === 'budget' ? (
              <label className="block text-sm space-y-1">
                <span className="text-slate-400">예산(KRW)</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-white"
                />
              </label>
            ) : (
              <label className="block text-sm space-y-1">
                <span className="text-slate-400">목표 노출 수</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={impressionsInput}
                  onChange={(e) => setImpressionsInput(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-white"
                />
              </label>
            )}

            {selectedCard ? (
              <p className="text-xs text-slate-500 leading-relaxed">
                선택된 카드 플로어 CPM: <strong className="text-slate-300">{floorCpm.toLocaleString('ko-KR')}</strong>
                ₩ · 실제 과금 및 검수 흐름은 운영 정책에 따릅니다.
              </p>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => runQuote()}
                disabled={quoteLoading || !floorCpm}
                className="px-5 py-2.5 rounded-xl bg-white/10 border border-white/15 hover:bg-white/15 disabled:opacity-40 text-sm font-bold"
              >
                {quoteLoading ? '계산 중…' : '서버 역산 확인'}
              </button>
              <button
                type="button"
                onClick={() => handlePayClick()}
                disabled={orderBusy || authLoading || !floorCpm}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-sm font-black"
              >
                <CreditCard size={18} />
                {authLoading ? '확인 중…' : user ? '결제 시작' : '로그인 후 결제'}
              </button>
            </div>

            {quoteErr ? <p className="text-rose-300 text-xs">{quoteErr}</p> : null}
            {quote ? (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.08] px-4 py-3 text-sm">
                <p className="text-emerald-200 font-bold mb-2">역산 결과(서버)</p>
                <p>예산: {fmtKrw(quote.budget_krw)}</p>
                <p>추정 노출: {(Number(quote.estimated_impressions) || 0).toLocaleString('ko-KR')}회</p>
                <p>기준 CPM: {quote.quoted_cpm_krw}</p>
              </div>
            ) : null}

            {!user ? (
              <p className="text-xs text-amber-200/90">
                결제까지 동일 조건으로 이어지려면{' '}
                <Link className="underline font-bold text-amber-100" to="/login" state={{ from: '/cpm' }}>
                  로그인
                </Link>
                이 필요합니다.
              </p>
            ) : null}

            <p className="text-[11px] text-slate-500 pt-4 border-t border-white/10 leading-relaxed">
              라이브에선 Vercel·이니시스 환경 변수가 채워진 배포 호스트에서만 결제 창을 엽니다.
              결과는{' '}
              <Link className="text-cyan-300 underline" to="/cpm/result">
                /cpm/result
              </Link>
              로 안내됩니다.
            </p>
          </section>
        </div>

        <p className="mt-14 text-[11px] text-slate-600 text-center max-w-lg mx-auto">
          동일 레포 SPA 경로 `/cpm` 또는 나중에 Vercel에 서브도메인 프로젝트를 붙일 수 있습니다.
          Supabase 리다이렉트 URL 목록에는 프로덕션·스테이징·포트 번호 포함 로컬 모두 허용하세요.
        </p>
      </main>
      <Footer />
    </div>
  );
}
