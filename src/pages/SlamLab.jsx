import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calculator,
  Calendar,
  Clapperboard,
  Copy,
  FileText,
  Hash,
  HelpCircle,
  Languages,
  LineChart,
  Loader2,
  MessageCircle,
  PackageOpen,
  Plus,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';

// ─── Estimate (local) ─────────────────────────────────────────────────────────

const ESTIMATE_TIERS = [
  { creators: 10, price: 590_000 },
  { creators: 20, price: 990_000 },
  { creators: 50, price: 2_390_000 },
];

function estimatePriceForCreators(n) {
  const x = Math.min(50, Math.max(10, Math.round(n)));
  if (x <= 20) {
    const [a, b] = [ESTIMATE_TIERS[0], ESTIMATE_TIERS[1]];
    return Math.round(a.price + ((x - a.creators) / (b.creators - a.creators)) * (b.price - a.price));
  }
  const [b, c] = [ESTIMATE_TIERS[1], ESTIMATE_TIERS[2]];
  return Math.round(b.price + ((x - b.creators) / (c.creators - b.creators)) * (c.price - b.price));
}

function runLocalEstimate(raw) {
  const n = (raw || '').match(/\d+/)
    ? Math.min(50, Math.max(10, parseInt((raw || '').match(/\d+/)[0], 10)))
    : 20;
  const p = estimatePriceForCreators(n);
  const vat = Math.round(p * 1.1);
  return [
    '## 규모·견적 스케치',
    '_메인 플랜 구간 보간 · 참고용_',
    '',
    `- **목표 규모:** \`${n}\`명`,
    `- **참고 계약가:** **${p.toLocaleString('ko-KR')}원** (VAT 별도)`,
    `- **VAT 포함:** **${vat.toLocaleString('ko-KR')}원**`,
    '',
    '정확한 견적은 **1:1 문의**로 확인하세요.',
  ].join('\n');
}

// ─── Mode definitions ─────────────────────────────────────────────────────────

const MODE_GROUPS = [
  {
    id: 'content',
    label: '콘텐츠',
    modes: [
      { id: 'copy',         label: '캠페인 카피',   icon: Sparkles,   hint: '브랜드·제품·캠페인을 한 줄로.' },
      { id: 'hook',         label: '숏폼 훅',       icon: Zap,        hint: '틱톡·릴스 첫 3초 오프닝 주제.' },
      { id: 'tags',         label: '해시태그',      icon: Hash,       hint: '키워드를 띄어쓰기나 쉼표로.' },
      { id: 'product_desc', label: '제품 소개문',   icon: PackageOpen, hint: '크리에이터 포스팅용 제품 설명.' },
    ],
  },
  {
    id: 'ops',
    label: '운영',
    modes: [
      { id: 'brief',            label: '캠페인 브리프',   icon: FileText,    hint: '무엇을 파는지, 어디서 돌릴지.' },
      { id: 'creator_guide',    label: '크리에이터 가이드', icon: Users,      hint: '시딩 제품·브랜드·국가·채널.' },
      { id: 'ugc_angles',       label: 'UGC 각도',       icon: Clapperboard, hint: '제품·무드·타겟.' },
      { id: 'dm_outreach',      label: '협찬 멘트',       icon: MessageCircle, hint: '브랜드, 제품, 크리에이터 규모.' },
      { id: 'content_calendar', label: '콘텐츠 캘린더',   icon: Calendar,    hint: '기간·크리에이터 수·채널.' },
      { id: 'creator_faq',      label: 'Creator FAQ',    icon: HelpCircle,  hint: '제품명·주요 성분·사용법.' },
    ],
  },
  {
    id: 'analysis',
    label: '분석',
    modes: [
      { id: 'tracking_kpi',    label: '추적·리포트',  icon: LineChart,  hint: '기간, 채널, 목표.' },
      { id: 'campaign_result', label: '성과 해석',    icon: TrendingUp, hint: '수치를 붙여넣으면 요약합니다.' },
      { id: 'translate',       label: '다국어 번역',  icon: Languages,  hint: '번역할 내용 + 목표 언어(영어/스페인어).' },
      { id: 'estimate',        label: '규모·견적',    icon: Calculator, hint: '인원 수 숫자만 (10~50). 로컬 계산.', local: true },
    ],
  },
];

const ALL_MODES = MODE_GROUPS.flatMap((g) => g.modes);

const EXAMPLE_CHIPS = {
  copy:             ['비건 선크림 — 미국 Z세대 틱톡', 'K-뷰티 앰플 — 인스타 나노 시딩', '무선 이어폰 — 릴스 20대'],
  hook:             ['스킨케어 루틴 아침 3초', '언박싱 반전 오프닝', 'Before/After 반전 영상'],
  tags:             ['비건 선크림 미국 여름 SPF', 'K-뷰티 스킨케어 Z세대'],
  product_desc:     ['비건 선크림 SPF50 — 영어권 크리에이터용', 'K-뷰티 앰플 세럼 — 틱톡용 설명'],
  brief:            ['K-뷰티 선크림 — 북미 나노 릴스 20명', '비건 코스메틱 — 멕시코 틱톡 시딩'],
  creator_guide:    ['Farmskin 앰플 — 미국 인스타 나노 20명', 'K-뷰티 선크림 — 틱톡 영어권'],
  ugc_angles:       ['무선 이어폰 — 언박싱/통학 일상', '선크림 — 야외 여름 비포애프터'],
  dm_outreach:      ['스킨케어 — 틱톡 1만 이하 크리에이터', 'K-뷰티 — 인스타 마이크로 협찬'],
  content_calendar: ['4주 틱톡 20명 — K-뷰티 런칭', '2주 릴스 10명 — 신제품 출시'],
  creator_faq:      ['비건 선크림 SPF50 성분·사용법 Q&A', 'K-뷰티 앰플 효과·주의사항 FAQ'],
  tracking_kpi:     ['2주 릴스 시딩 20명 — 전환 추적', '틱톡 50명 — 브랜드 인지도'],
  campaign_result:  ['릴스 20건: 조회 120만, 저장 8천, 댓글 450', '틱톡 50건: 평균 조회 5만, 클릭 340'],
  translate:        ['크리에이터 가이드 → 영어로', '캠페인 브리프 → 스페인어로'],
  estimate:         ['10', '20', '50'],
};

const LANDING_INTENT_KEY = 'bs_landing_campaign_intent_v1';

// ─── Markdown renderer ────────────────────────────────────────────────────────

function parseInlineRich(str) {
  if (!str) return null;
  const out = [];
  let k = 0;
  const parts = str.split(/(\*\*[^*]+\*\*|`[^`]+`|_[^_]+_)/g);
  for (const part of parts) {
    if (!part) continue;
    if (part.startsWith('**') && part.endsWith('**')) {
      out.push(<strong key={k++} className="font-semibold text-white">{part.slice(2, -2)}</strong>);
    } else if (part.startsWith('`') && part.endsWith('`')) {
      out.push(
        <code key={k++} className="rounded border border-white/[0.08] bg-violet-500/10 px-1.5 py-0.5 font-mono text-[0.88em] text-cyan-200/95">
          {part.slice(1, -1)}
        </code>
      );
    } else if (part.startsWith('_') && part.endsWith('_') && part.length > 2) {
      out.push(<em key={k++} className="italic text-violet-200/80">{part.slice(1, -1)}</em>);
    } else {
      out.push(<span key={k++}>{part}</span>);
    }
  }
  return out;
}

function FormattedResponse({ text }) {
  const blocks = useMemo(() => {
    const lines = text.split('\n');
    const result = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trimEnd();
      const trimmed = line.trim();
      if (!trimmed) { result.push({ type: 'spacer', key: `s-${i}` }); continue; }
      if (/^---+$/.test(trimmed)) { result.push({ type: 'rule', key: `r-${i}` }); continue; }
      const hm = trimmed.match(/^(#{1,3})\s+(.+)$/);
      if (hm) { result.push({ type: 'heading', level: hm[1].length, content: hm[2], key: `h-${i}` }); continue; }
      if (/^[-*•]\s/.test(trimmed)) { result.push({ type: 'bullet', content: trimmed.replace(/^[-*•]\s+/, ''), key: `b-${i}` }); continue; }
      if (/^\d+\.\s/.test(trimmed)) { result.push({ type: 'ordered', content: trimmed.replace(/^\d+\.\s+/, ''), num: trimmed.match(/^(\d+)\./)[1], key: `o-${i}` }); continue; }
      result.push({ type: 'p', content: trimmed, key: `p-${i}` });
    }
    return result;
  }, [text]);

  return (
    <div className="space-y-2 text-[14px] leading-[1.65] text-slate-200/95 sm:text-[15px]">
      {blocks.map((b) => {
        if (b.type === 'spacer') return <div key={b.key} className="h-1" aria-hidden />;
        if (b.type === 'rule') return <div key={b.key} className="my-2 h-px bg-gradient-to-r from-transparent via-violet-400/25 to-transparent" aria-hidden />;
        if (b.type === 'heading') {
          const cls = b.level === 1
            ? 'bg-gradient-to-r from-white via-violet-100 to-cyan-100/90 bg-clip-text pb-0.5 text-base font-bold tracking-tight text-transparent sm:text-lg'
            : b.level === 2
              ? 'pt-1 text-sm font-bold tracking-tight text-white sm:text-base'
              : 'text-xs font-semibold uppercase tracking-wide text-violet-200/90';
          return <div key={b.key} className={cls}>{parseInlineRich(b.content)}</div>;
        }
        if (b.type === 'bullet') {
          return (
            <div key={b.key} className="flex gap-2.5 pl-0.5">
              <span className="mt-[0.6em] h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-br from-violet-400 to-cyan-400" aria-hidden />
              <div className="min-w-0 flex-1">{parseInlineRich(b.content)}</div>
            </div>
          );
        }
        if (b.type === 'ordered') {
          return (
            <div key={b.key} className="flex gap-2.5 pl-0.5">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-violet-500/15 text-[11px] font-bold tabular-nums text-violet-200">
                {b.num}
              </span>
              <div className="min-w-0 flex-1 pt-0.5">{parseInlineRich(b.content)}</div>
            </div>
          );
        }
        return <p key={b.key} className="text-slate-200/90">{parseInlineRich(b.content)}</p>;
      })}
    </div>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function MessageBubble({ msg, isLast, onCopy, onRegenerate, busy }) {
  if (msg.role === 'user') {
    return (
      <div className="flex justify-end px-1">
        <div className="max-w-[82%] rounded-2xl rounded-tr-sm bg-violet-600/20 border border-violet-500/20 px-4 py-2.5 text-sm text-white/85 whitespace-pre-wrap break-words">
          {msg.text}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="relative rounded-2xl border border-violet-400/20 bg-gradient-to-b from-[#121528]/95 to-[#0a0c14] p-4 sm:p-5 ring-1 ring-violet-500/10">
        <FormattedResponse text={msg.text} />
      </div>
      {isLast && (
        <div className="flex gap-1.5 pl-1">
          <button
            type="button"
            onClick={() => onCopy(msg.text)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-medium text-white/55 hover:bg-white/[0.08] hover:text-white/80 transition"
          >
            <Copy className="h-3 w-3" />
            복사
          </button>
          {onRegenerate && !busy && (
            <button
              type="button"
              onClick={onRegenerate}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-medium text-white/55 hover:bg-white/[0.08] hover:text-white/80 transition"
            >
              <RefreshCw className="h-3 w-3" />
              다시 생성
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function SlamLab() {
  const navigate = useNavigate();

  const [mode, setMode] = useState('copy');
  const [activeGroup, setActiveGroup] = useState('content');
  const [lang, setLang] = useState('ko');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [streaming, setStreaming] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const chatEndRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);

  const activeMode = useMemo(() => ALL_MODES.find((m) => m.id === mode) || ALL_MODES[0], [mode]);
  const chips = EXAMPLE_CHIPS[mode] || [];
  const hasChat = messages.length > 0 || !!streaming || !!error;

  useEffect(() => { document.title = 'SLAM Lab'; }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streaming, busy]);

  const showToast = useCallback((msg) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 2000);
  }, []);

  const persistAndLogin = useCallback(() => {
    const hint = input.trim();
    if (hint) { try { sessionStorage.setItem(LANDING_INTENT_KEY, hint); } catch { /**/ } }
    navigate('/login', { state: { from: '/dashboard', landingCampaignIntent: hint || undefined } });
  }, [input, navigate]);

  const newChat = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setStreaming('');
    setError('');
    setInput('');
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const switchMode = useCallback((newMode) => {
    if (newMode === mode) return;
    abortRef.current?.abort();
    setMode(newMode);
    setMessages([]);
    setStreaming('');
    setError('');
    setInput('');
    const group = MODE_GROUPS.find((g) => g.modes.some((m) => m.id === newMode));
    if (group) setActiveGroup(group.id);
  }, [mode]);

  const run = useCallback(async (overrideHistory) => {
    const currentInput = input.trim();
    if (!overrideHistory && !currentInput) return;

    // Local estimate — no API call
    if (mode === 'estimate' && !overrideHistory) {
      setMessages((prev) => [
        ...prev,
        { role: 'user', text: currentInput },
        { role: 'assistant', text: runLocalEstimate(currentInput) },
      ]);
      setInput('');
      return;
    }

    const newUserMsg = { role: 'user', text: currentInput };
    const history = overrideHistory ?? [...messages, newUserMsg];

    if (!overrideHistory) {
      setMessages((prev) => [...prev, newUserMsg]);
      setInput('');
    }

    setBusy(true);
    setStreaming('');
    setError('');
    abortRef.current = new AbortController();

    try {
      const res = await fetch('/api/gemini-playground', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, messages: history, lang, stream: true }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || `요청 실패 (${res.status})`);
        setBusy(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const raw = trimmed.slice(5).trim();
          if (!raw || raw === '[DONE]') continue;
          try {
            const parsed = JSON.parse(raw);
            if (parsed.error) { setError(parsed.error); continue; }
            if (parsed.text) { fullText += parsed.text; setStreaming(fullText); }
          } catch { /**/ }
        }
      }

      if (fullText) setMessages((prev) => [...prev, { role: 'assistant', text: fullText }]);
      setStreaming('');
    } catch (e) {
      if (e?.name !== 'AbortError') setError(String(e?.message || e));
    } finally {
      setBusy(false);
    }
  }, [mode, messages, input, lang]);

  const regenerate = useCallback(() => {
    const lastIdx = [...messages].map((m) => m.role).lastIndexOf('assistant');
    if (lastIdx === -1) return;
    const trimmed = messages.slice(0, lastIdx);
    setMessages(trimmed);
    run(trimmed);
  }, [messages, run]);

  const copyText = useCallback(async (text) => {
    try { await navigator.clipboard.writeText(text); showToast('복사했습니다'); }
    catch { showToast('복사 실패'); }
  }, [showToast]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && !busy) {
        e.preventDefault();
        void run();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [run, busy]);

  const currentGroup = MODE_GROUPS.find((g) => g.id === activeGroup) || MODE_GROUPS[0];

  return (
    <div className="min-h-screen bg-[#07080f] text-slate-100 antialiased flex flex-col">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_45%_at_50%_-15%,rgba(120,119,198,0.2),transparent)]" />
      </div>

      {/* ── Header ── */}
      <header className="relative z-20 shrink-0 border-b border-white/[0.06] bg-[#07080f]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          {/* Left: logo + new chat */}
          <div className="flex items-center gap-2.5">
            <Link to="/" className="flex items-center gap-2 text-sm font-semibold text-white">
              <span className="rounded-lg bg-gradient-to-br from-violet-500 to-cyan-400 px-2 py-1 text-[10px] font-black tracking-widest text-white shadow-lg shadow-violet-500/20">
                SLAM
              </span>
              <span className="text-white/45 font-medium text-xs tracking-wide">Lab</span>
            </Link>
            <div className="h-4 w-px bg-white/[0.08]" aria-hidden />
            <button
              type="button"
              onClick={newChat}
              className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1.5 text-[11px] font-medium text-white/45 hover:border-white/20 hover:text-white/70 transition"
            >
              <Plus className="h-3 w-3" />
              새 대화
            </button>
          </div>

          {/* Right: lang toggle + auth */}
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-lg border border-white/10 bg-white/[0.03] p-0.5">
              {['ko', 'en'].map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLang(l)}
                  className={`rounded-md px-2.5 py-1 text-[11px] font-bold tracking-wide transition ${
                    lang === l ? 'bg-violet-500/30 text-white' : 'text-white/35 hover:text-white/65'
                  }`}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
            <Link to="/login" className="rounded-lg px-3 py-2 text-xs font-semibold text-white/60 hover:bg-white/5 transition">
              로그인
            </Link>
            <button
              type="button"
              onClick={persistAndLogin}
              className="rounded-lg bg-gradient-to-r from-violet-600 to-cyan-500 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-violet-600/25 hover:brightness-110 transition"
            >
              시작하기
            </button>
          </div>
        </div>
      </header>

      {/* ── Toast ── */}
      {toast && (
        <p
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-white/10 bg-slate-900/95 px-5 py-2 text-xs text-white shadow-xl"
          role="status"
        >
          {toast}
        </p>
      )}

      {/* ── Body ── */}
      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col overflow-hidden px-4 sm:px-6" style={{ minHeight: 0 }}>

        {/* Mode selector */}
        <div className="shrink-0 border-b border-white/[0.06] pt-3.5 pb-3">
          {/* Group tabs */}
          <div className="flex gap-0.5 mb-2.5">
            {MODE_GROUPS.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => {
                  setActiveGroup(g.id);
                  if (!g.modes.some((m) => m.id === mode)) switchMode(g.modes[0].id);
                }}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  activeGroup === g.id ? 'bg-white/10 text-white' : 'text-white/35 hover:text-white/65'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>

          {/* Mode chips */}
          <div className="flex flex-wrap gap-1.5">
            {currentGroup.modes.map((m) => {
              const Icon = m.icon;
              const active = mode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => switchMode(m.id)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    active
                      ? 'border-violet-400/50 bg-violet-500/20 text-white'
                      : 'border-white/[0.09] text-white/40 hover:border-white/[0.16] hover:text-white/70'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  {m.label}
                  {m.local && (
                    <span className="ml-0.5 rounded-sm bg-white/10 px-1 py-px text-[9px] text-white/40">로컬</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Chat area ── */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3" style={{ minHeight: 0 }}>
          {!hasChat && (
            <div className="flex flex-col items-center justify-center h-full gap-3 pb-8 text-center select-none">
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                {(() => { const Icon = activeMode.icon; return <Icon className="h-6 w-6 text-violet-400/50" />; })()}
              </div>
              <p className="text-sm text-white/30 max-w-xs">{activeMode.hint}</p>
              <p className="text-[11px] text-white/18">⌘ / Ctrl + Enter 로 실행</p>
            </div>
          )}

          {messages.map((msg, i) => (
            <MessageBubble
              key={i}
              msg={msg}
              isLast={i === messages.length - 1 && !streaming && !busy}
              onCopy={copyText}
              onRegenerate={msg.role === 'assistant' && i === messages.length - 1 && !busy && !streaming ? regenerate : null}
              busy={busy}
            />
          ))}

          {/* Streaming output */}
          {streaming && (
            <div className="flex flex-col gap-1.5">
              <div className="relative rounded-2xl border border-violet-400/25 bg-gradient-to-b from-[#121528]/95 to-[#0a0c14] p-4 sm:p-5 ring-1 ring-violet-500/10">
                <FormattedResponse text={streaming} />
                <span className="inline-block h-4 w-0.5 animate-[pulse_0.8s_ease-in-out_infinite] bg-violet-400 ml-0.5 align-text-bottom" aria-hidden />
              </div>
            </div>
          )}

          {/* Loading (before first chunk) */}
          {busy && !streaming && (
            <div className="flex items-center gap-3 rounded-2xl border border-violet-500/20 bg-violet-500/[0.05] px-5 py-4 text-sm text-violet-100/80">
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-violet-400" />
              <span className="font-medium">생성 중…</span>
            </div>
          )}

          {/* Error */}
          {error && (
            <pre className="whitespace-pre-wrap break-words rounded-2xl border border-red-400/25 bg-red-500/[0.07] p-4 text-xs text-red-100/90">
              {error}
            </pre>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* ── Input area ── */}
        <div className="shrink-0 border-t border-white/[0.06] pb-5 pt-3">
          {/* Example chips — only shown before first message */}
          {!hasChat && chips.length > 0 && (
            <div className="mb-2.5 flex flex-wrap gap-1.5">
              {chips.map((chip, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => { setInput(chip); inputRef.current?.focus(); }}
                  className="rounded-full border border-white/[0.09] bg-white/[0.02] px-3 py-1 text-[11px] text-white/40 hover:border-white/[0.18] hover:text-white/65 transition"
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          {/* Textarea + send */}
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={hasChat ? 2 : 3}
              className="flex-1 resize-none rounded-xl border border-white/10 bg-[#12141c] px-4 py-3 text-sm leading-relaxed text-white placeholder:text-white/20 outline-none transition focus:border-violet-400/35 focus:ring-1 focus:ring-violet-400/15 disabled:opacity-50"
              placeholder={hasChat ? '이어서 입력하세요 — 예: 더 짧게, 영어로, 격식체로…' : activeMode.hint}
              maxLength={4000}
              disabled={busy}
            />
            <button
              type="button"
              onClick={() => void run()}
              disabled={busy || !input.trim()}
              className="shrink-0 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 p-3 text-white shadow-lg transition hover:brightness-110 disabled:opacity-35"
              title="실행 (⌘+Enter)"
            >
              {busy
                ? <Loader2 className="h-5 w-5 animate-spin" />
                : <Sparkles className="h-5 w-5" />
              }
            </button>
          </div>

          {/* Footer hint */}
          <p className="mt-2 text-center text-[10px] text-white/20">
            {hasChat ? '모드를 바꾸면 새 대화가 시작됩니다.' : '⌘ / Ctrl + Enter 로 실행'}
          </p>
        </div>
      </div>
    </div>
  );
}
