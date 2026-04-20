import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowDown,
  ArrowRight,
  BarChart3,
  Calculator,
  Copy,
  FileText,
  Hash,
  Loader2,
  Sparkles,
  Zap,
} from 'lucide-react';

const LANDING_INTENT_KEY = 'bs_landing_campaign_intent_v1';

const ESTIMATE_TIERS = [
  { creators: 10, price: 590_000 },
  { creators: 20, price: 990_000 },
  { creators: 50, price: 2_390_000 },
];

function estimatePriceForCreators(n) {
  const x = Math.min(50, Math.max(10, Math.round(n)));
  if (x <= 20) {
    const a = ESTIMATE_TIERS[0];
    const b = ESTIMATE_TIERS[1];
    return Math.round(a.price + ((x - a.creators) / (b.creators - a.creators)) * (b.price - a.price));
  }
  const b = ESTIMATE_TIERS[1];
  const c = ESTIMATE_TIERS[2];
  return Math.round(b.price + ((x - b.creators) / (c.creators - b.creators)) * (c.price - b.price));
}

function runLocalEstimate(raw) {
  const q = (raw || '').trim();
  const n = q.match(/\d+/) ? Math.min(50, Math.max(10, parseInt(q.match(/\d+/)[0], 10))) : 20;
  const p = estimatePriceForCreators(n);
  const vat = Math.round(p * 1.1);
  return [
    '규모·견적 스케치 (메인 플랜 구간 보간, 참고용)',
    '',
    `• 목표 규모(명): ${n}`,
    `• 참고 계약가: ${p.toLocaleString('ko-KR')}원 (VAT 별도)`,
    `• VAT 포함 시 약: ${vat.toLocaleString('ko-KR')}원`,
    '',
    '숫자만 입력해도 됩니다. 예: 25',
  ].join('\n');
}

const MODES = [
  { id: 'copy', label: '캠페인 카피', icon: Sparkles, hint: '브랜드·제품·캠페인을 한 줄로 적어 주세요.', ai: true },
  { id: 'hook', label: '숏폼 훅', icon: Zap, hint: '틱톡·릴스 첫 3초에 쓸 주제나 제품명.', ai: true },
  { id: 'brief', label: '캠페인 브리프', icon: FileText, hint: '무엇을 파는지, 어디서 돌릴지 — 짧게라도 구체적으로.', ai: true },
  { id: 'tags', label: '해시태그', icon: Hash, hint: '키워드를 띄어쓰기나 쉼표로. 비우면 AI가 주제만으로 제안합니다.', ai: true },
  { id: 'estimate', label: '규모·견적', icon: Calculator, hint: '인원 수 숫자만 (10~50). 비우면 20명 기준.', ai: false },
];

export default function SlamGlobalLandingNew() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('copy');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState('');

  const activeMode = useMemo(() => MODES.find((m) => m.id === mode) || MODES[0], [mode]);

  useEffect(() => {
    document.title = 'slam-global — 당신이 잠든 사이에도';
  }, []);

  const persistAndLogin = useCallback(() => {
    const hint = input.trim();
    if (hint) {
      try {
        sessionStorage.setItem(LANDING_INTENT_KEY, hint);
      } catch {
        /* ignore */
      }
    }
    navigate('/login', {
      state: { from: '/dashboard', landingCampaignIntent: hint || undefined },
    });
  }, [input, navigate]);

  const scrollToLab = useCallback(() => {
    document.getElementById('slam-lab')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const run = useCallback(async () => {
    setBusy(true);
    setOutput('');
    setError('');

    if (mode === 'estimate') {
      await new Promise((r) => window.setTimeout(r, 120));
      setOutput(runLocalEstimate(input));
      setBusy(false);
      return;
    }

    try {
      const res = await fetch('/api/gemini-playground', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, input }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const parts = [data.error, data.hint, data.detail].filter(Boolean);
        setError(parts.join('\n\n') || `요청 실패 (${res.status})`);
        return;
      }

      if (typeof data.text === 'string' && data.text.trim()) {
        setOutput(data.text.trim());
      } else {
        setError('응답 형식을 해석하지 못했습니다.');
      }
    } catch (e) {
      setError(
        `연결에 실패했습니다. 로컬에서는 보통 \`vercel dev\`로 API를 띄운 뒤 Vite와 함께 쓰면 됩니다.\n\n${String(e?.message || e)}`,
      );
    } finally {
      setBusy(false);
    }
  }, [mode, input]);

  const copyOut = useCallback(async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setToast('복사했습니다');
    } catch {
      setToast('복사 실패 — 직접 선택해 주세요');
    }
    window.setTimeout(() => setToast(''), 2000);
  }, [output]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        void run();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [run]);

  return (
    <div className="min-h-screen bg-[#07080f] text-slate-100 antialiased">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,119,198,0.22),transparent)]" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
      </div>

      <header className="relative z-20 border-b border-white/[0.06] bg-[#07080f]/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3.5 sm:px-6">
          <Link to="/" className="flex items-center gap-2 text-sm font-semibold text-white">
            <span className="rounded-lg bg-gradient-to-br from-violet-500 to-cyan-400 px-2 py-1 text-[10px] font-black tracking-widest text-white shadow-lg shadow-violet-500/20">
              SLAM
            </span>
            <span className="text-white/80">global</span>
          </Link>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={scrollToLab}
              className="hidden rounded-lg px-3 py-2 text-xs font-medium text-white/55 transition hover:bg-white/5 hover:text-white md:inline"
            >
              AI 체험
            </button>
            <Link to="/login" className="rounded-lg px-3 py-2 text-xs font-semibold text-white/70 hover:bg-white/5">
              로그인
            </Link>
            <button
              type="button"
              onClick={persistAndLogin}
              className="rounded-lg bg-gradient-to-r from-violet-600 to-cyan-500 px-4 py-2 text-xs font-bold text-white shadow-md shadow-violet-600/25 hover:brightness-110"
            >
              시작하기
            </button>
          </div>
        </div>
      </header>

      {toast ? (
        <p
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-white/10 bg-slate-900/95 px-5 py-2 text-xs text-white shadow-xl"
          role="status"
        >
          {toast}
        </p>
      ) : null}

      <main className="relative z-10">
        <section className="mx-auto flex min-h-[min(78vh,720px)] max-w-4xl flex-col items-center justify-center px-4 pb-16 pt-12 text-center sm:px-6 sm:pb-20 sm:pt-16">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-violet-300/75">Miro 메인 슬로건</p>
          <h1 className="mt-5 text-[1.65rem] font-bold leading-[1.18] tracking-tight text-white sm:text-4xl sm:leading-[1.12] lg:text-[2.65rem]">
            <span className="bg-gradient-to-r from-[#e0e7ff] via-[#a5b4fc] to-[#22d3ee] bg-clip-text text-transparent">
              당신이 잠든 사이에도 시스템은 콘텐츠를 추적하고 성과를 쌓고 있습니다.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-md text-sm leading-relaxed text-white/45">
            아래에서 <span className="text-violet-200/90">Gemini</span>로 카피·훅·브리프를 바로 만들어 보세요. 키는 서버에만 둡니다.
          </p>
          <div className="mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={persistAndLogin}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-7 py-3.5 text-sm font-black text-slate-900 shadow-xl transition hover:bg-slate-100"
            >
              캠페인 시작하기
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={scrollToLab}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.04] px-7 py-3.5 text-sm font-semibold text-white/85 backdrop-blur-sm transition hover:border-white/25 hover:bg-white/[0.07]"
            >
              AI로 시험해 보기
              <ArrowDown className="h-4 w-4 opacity-70" />
            </button>
          </div>
        </section>

        <section id="slam-lab" className="scroll-mt-20 border-t border-white/[0.06] bg-[#0a0c14]/95 py-14 sm:py-20">
          <div className="relative mx-auto max-w-3xl px-4 sm:px-6">
            <div className="mb-8 flex flex-col items-center gap-2 text-center sm:mb-10">
              <BarChart3 className="h-7 w-7 text-violet-400/90" aria-hidden />
              <h2 className="text-xl font-bold text-white sm:text-2xl">SLAM Lab</h2>
              <p className="max-w-lg text-sm text-white/45">
                채팅형 입력창에 적고 실행하면, 서버의 Gemini가 결과를 돌려줍니다. (규모·견적만 이 브라우저에서 계산)
              </p>
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0e1018] shadow-2xl shadow-black/50">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] bg-black/25 px-4 py-3 sm:px-5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white/90">새 대화</span>
                  <span className="rounded-md bg-violet-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-200/90">
                    Gemini
                  </span>
                </div>
                <span className="text-[10px] text-white/35">⌘/Ctrl + Enter 로 실행</span>
              </div>

              <div className="border-b border-white/[0.06] px-3 py-3 sm:px-4">
                <div className="flex flex-wrap gap-1.5">
                  {MODES.map((m) => {
                    const Icon = m.icon;
                    const on = mode === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setMode(m.id);
                          setOutput('');
                          setError('');
                        }}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                          on
                            ? 'border-violet-400/45 bg-violet-500/20 text-white'
                            : 'border-white/10 bg-transparent text-white/45 hover:border-white/18 hover:text-white/75'
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5 opacity-90" />
                        {m.label}
                        {m.ai ? (
                          <span className="ml-0.5 text-[9px] font-bold uppercase text-cyan-300/70">api</span>
                        ) : (
                          <span className="ml-0.5 text-[9px] font-bold uppercase text-white/30">local</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="px-4 py-4 sm:px-5 sm:py-5">
                <label className="block">
                  <span className="text-xs font-medium text-white/50">{activeMode.hint}</span>
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    rows={mode === 'brief' ? 5 : 4}
                    className="mt-2 w-full resize-y rounded-xl border border-white/10 bg-[#12141c] px-4 py-3.5 text-sm leading-relaxed text-white placeholder:text-white/22 outline-none transition focus:border-violet-400/35 focus:ring-1 focus:ring-violet-400/15"
                    placeholder={
                      mode === 'estimate'
                        ? '예: 25 (10~50명)'
                        : '예: 비건 선크림 — 미국 Z세대 시딩, 틱톡 중심…'
                    }
                    maxLength={4000}
                  />
                </label>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => void run()}
                    disabled={busy}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:brightness-110 disabled:opacity-60 sm:flex-none"
                  >
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    실행
                  </button>
                  <Link to="/#pricing" className="text-xs font-semibold text-cyan-300/85 hover:underline">
                    요금제 보기 →
                  </Link>
                </div>
              </div>

              <div className="border-t border-white/[0.06] bg-[#080a10] px-4 py-4 sm:px-5 sm:py-5">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/35">응답</span>
                  {output ? (
                    <button
                      type="button"
                      onClick={() => void copyOut()}
                      className="inline-flex items-center gap-1 rounded-lg bg-white/6 px-2.5 py-1 text-[11px] font-semibold text-white/75 hover:bg-white/10"
                    >
                      <Copy className="h-3 w-3" />
                      복사
                    </button>
                  ) : null}
                </div>

                {busy ? (
                  <div className="flex items-center gap-2 text-sm text-white/45">
                    <Loader2 className="h-4 w-4 animate-spin text-violet-400" />
                    생성 중…
                  </div>
                ) : error ? (
                  <pre className="max-h-[min(50vh,380px)] overflow-auto whitespace-pre-wrap break-words rounded-lg border border-red-500/20 bg-red-500/[0.07] p-4 text-sm leading-relaxed text-red-100/95">
                    {error}
                  </pre>
                ) : output ? (
                  <div className="rounded-xl border border-white/[0.06] bg-[#12141c] p-4">
                    <pre className="max-h-[min(50vh,380px)] overflow-auto whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-200/95">
                      {output}
                    </pre>
                  </div>
                ) : (
                  <p className="text-sm text-white/38">
                    모드를 고른 뒤 <strong className="text-white/55">실행</strong>하면 여기에 결과가 표시됩니다.
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        <footer className="border-t border-white/[0.06] py-10 text-center">
          <div className="mx-auto flex max-w-6xl flex-wrap justify-center gap-x-8 gap-y-2 px-4 text-xs text-white/40">
            <Link to="/consulting" className="hover:text-cyan-300">
              1:1 문의
            </Link>
            <Link to="/#pricing" className="hover:text-white/70">
              요금제
            </Link>
            <a href="https://www.slam-global.com" className="hover:text-white/70" target="_blank" rel="noreferrer">
              slam-global.com
            </a>
          </div>
        </footer>
      </main>
    </div>
  );
}
