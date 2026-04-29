import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookmarkPlus,
  Calculator,
  Calendar,
  ChevronDown,
  ChevronUp,
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
  Settings2,
  Sparkles,
  TrendingUp,
  Trash2,
  Users,
  X,
  Zap,
} from 'lucide-react';

// ─── Storage keys ─────────────────────────────────────────────────────────────
const BRAND_KEY = 'bs_lab_brand_v1';
const SAVED_KEY = 'bs_lab_saved_v1';
const LANDING_INTENT_KEY = 'bs_landing_campaign_intent_v1';

// ─── Brand profile options ────────────────────────────────────────────────────
const COUNTRY_OPTS = ['', '미국', '영국', '멕시코', '일본', '호주', '브라질', '전체 글로벌'];
const CHANNEL_OPTS = ['TikTok', 'Instagram', 'YouTube', '혼합'];
const TONE_OPTS = ['친근함', '전문적', '트렌디', '고급'];
const DEFAULT_PROFILE = { brand: '', country: '', channel: 'TikTok', tone: '친근함' };

// ─── Estimate ─────────────────────────────────────────────────────────────────
const ESTIMATE_TIERS = [
  { creators: 10, price: 590_000 },
  { creators: 20, price: 990_000 },
  { creators: 50, price: 2_390_000 },
];

const CREATOR_TIER_OPTS = [
  { value: 'nano',  label: '나노 (1K–10K)',      mult: 0.80 },
  { value: 'micro', label: '마이크로 (10K–100K)', mult: 1.00 },
  { value: 'macro', label: '매크로 (100K+)',      mult: 1.50 },
];

const CHANNEL_MULT = { TikTok: 1.0, Instagram: 1.1, YouTube: 1.6, '혼합': 1.2 };

const COUNTRY_CURRENCY = {
  '미국':       { code: 'USD', fmt: (n) => `$${Math.round(n * 0.00072).toLocaleString('en-US')}` },
  '영국':       { code: 'GBP', fmt: (n) => `£${Math.round(n * 0.00057).toLocaleString('en-GB')}` },
  '멕시코':     { code: 'MXN', fmt: (n) => `MX$${Math.round(n * 0.013).toLocaleString('es-MX')}` },
  '일본':       { code: 'JPY', fmt: (n) => `¥${Math.round(n * 0.11).toLocaleString('ja-JP')}` },
  '호주':       { code: 'AUD', fmt: (n) => `A$${Math.round(n * 0.0011).toLocaleString('en-AU')}` },
  '브라질':     { code: 'BRL', fmt: (n) => `R$${Math.round(n * 0.0037).toLocaleString('pt-BR')}` },
};

function estimateBasePrice(n) {
  const clamped = Math.max(10, n);
  if (clamped <= 20) {
    const [a, b] = [ESTIMATE_TIERS[0], ESTIMATE_TIERS[1]];
    return Math.round(a.price + ((clamped - a.creators) / (b.creators - a.creators)) * (b.price - a.price));
  }
  if (clamped <= 50) {
    const [b, c] = [ESTIMATE_TIERS[1], ESTIMATE_TIERS[2]];
    return Math.round(b.price + ((clamped - b.creators) / (c.creators - b.creators)) * (c.price - b.price));
  }
  // Linear extension beyond 50, slight volume discount
  const perCreator = ESTIMATE_TIERS[2].price / 50;
  return Math.round(ESTIMATE_TIERS[2].price + (clamped - 50) * perCreator * 0.90);
}

function runLocalEstimate(raw, profile) {
  const text = (raw || '').toLowerCase();
  const numMatch = text.match(/\d+/);
  const n = numMatch ? Math.min(200, Math.max(10, parseInt(numMatch[0], 10))) : 20;

  let tier = CREATOR_TIER_OPTS[1];
  if (/나노|nano/.test(text)) tier = CREATOR_TIER_OPTS[0];
  else if (/매크로|macro/.test(text)) tier = CREATOR_TIER_OPTS[2];

  const channel = profile?.channel || '혼합';
  const channelMult = CHANNEL_MULT[channel] ?? 1.2;

  const basePrice = estimateBasePrice(n);
  const adjPrice = Math.round(basePrice * tier.mult * channelMult);
  const vat = Math.round(adjPrice * 1.1);
  const currObj = COUNTRY_CURRENCY[profile?.country];

  const lines = [
    '## 규모·견적 스케치',
    '_채널·등급 보정 포함 · 참고용_',
    '',
    `- **목표 규모:** \`${n}\`명`,
    `- **크리에이터 등급:** ${tier.label}`,
    `- **채널:** ${channel} (×${channelMult.toFixed(1)})`,
    `- **참고 계약가:** **${adjPrice.toLocaleString('ko-KR')}원** (VAT 별도)`,
    `- **VAT 포함:** **${vat.toLocaleString('ko-KR')}원**`,
  ];
  if (currObj) lines.push(`- **${currObj.code} 환산:** **${currObj.fmt(adjPrice)}** (참고)`);
  lines.push('', '정확한 견적은 **1:1 문의**로 확인하세요.');
  return lines.join('\n');
}

// ─── Mode definitions ─────────────────────────────────────────────────────────
const MODE_GROUPS = [
  {
    id: 'content',
    label: '콘텐츠',
    modes: [
      { id: 'copy',         label: '캠페인 카피',    icon: Sparkles,    hint: '브랜드·제품·캠페인을 한 줄로.' },
      { id: 'hook',         label: '숏폼 훅',        icon: Zap,         hint: '틱톡·릴스 첫 3초 오프닝 주제.' },
      { id: 'tags',         label: '해시태그',       icon: Hash,        hint: '키워드를 띄어쓰기나 쉼표로.' },
      { id: 'product_desc', label: '제품 소개문',    icon: PackageOpen, hint: '크리에이터 포스팅용 제품 설명.' },
    ],
  },
  {
    id: 'ops',
    label: '운영',
    modes: [
      { id: 'brief',            label: '캠페인 브리프',    icon: FileText,      hint: '무엇을 파는지, 어디서 돌릴지.' },
      { id: 'creator_guide',    label: '크리에이터 가이드', icon: Users,         hint: '시딩 제품·브랜드·국가·채널.' },
      { id: 'ugc_angles',       label: 'UGC 각도',         icon: Clapperboard,  hint: '제품·무드·타겟.' },
      { id: 'dm_outreach',      label: '협찬 멘트',         icon: MessageCircle, hint: '브랜드, 제품, 크리에이터 규모.' },
      { id: 'content_calendar', label: '콘텐츠 캘린더',    icon: Calendar,      hint: '기간·크리에이터 수·채널.' },
      { id: 'creator_faq',      label: 'Creator FAQ',      icon: HelpCircle,    hint: '제품명·주요 성분·사용법.' },
    ],
  },
  {
    id: 'analysis',
    label: '분석',
    modes: [
      { id: 'tracking_kpi',    label: '추적·리포트',  icon: LineChart,  hint: '기간, 채널, 목표.' },
      { id: 'campaign_result', label: '성과 해석',    icon: TrendingUp, hint: '수치를 붙여넣으면 요약합니다.' },
      { id: 'translate',       label: '다국어 번역',  icon: Languages,  hint: '번역할 내용 + 목표 언어.' },
      { id: 'estimate',        label: '규모·견적',    icon: Calculator, hint: '크리에이터 수와 등급을 입력하세요 (예: 20 마이크로).', local: true },
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
  estimate:         ['10 나노', '20 마이크로', '50 매크로'],
};

function buildBrandContext(profile) {
  const parts = [];
  if (profile.brand)   parts.push(`브랜드·제품: ${profile.brand}`);
  if (profile.country) parts.push(`타겟 국가: ${profile.country}`);
  if (profile.channel) parts.push(`주 채널: ${profile.channel}`);
  if (profile.tone)    parts.push(`톤앤매너: ${profile.tone}`);
  return parts.join(' / ');
}

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

// ─── Brand Profile Bar ────────────────────────────────────────────────────────
function BrandProfileBar({ profile, onChange, open, onToggle }) {
  const hasProfile = !!(profile.brand || profile.country);
  return (
    <div className="shrink-0 border-b border-white/[0.06]">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-2 py-2.5 text-left"
      >
        <Settings2 className="h-3.5 w-3.5 shrink-0 text-violet-400/60" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-white/35">
          브랜드 프로필
        </span>
        {hasProfile && !open && (
          <div className="ml-1 flex items-center gap-1 overflow-hidden">
            {profile.brand && (
              <span className="max-w-[140px] truncate rounded-md bg-violet-500/15 px-1.5 py-0.5 text-[10px] font-medium text-violet-200/80">
                {profile.brand}
              </span>
            )}
            {profile.country && (
              <span className="rounded-md bg-white/[0.05] px-1.5 py-0.5 text-[10px] text-white/40">
                {profile.country}
              </span>
            )}
            {profile.channel && (
              <span className="rounded-md bg-white/[0.05] px-1.5 py-0.5 text-[10px] text-white/40">
                {profile.channel}
              </span>
            )}
            {profile.tone && (
              <span className="rounded-md bg-white/[0.05] px-1.5 py-0.5 text-[10px] text-white/40">
                {profile.tone}
              </span>
            )}
          </div>
        )}
        {!hasProfile && !open && (
          <span className="ml-1 text-[10px] text-white/20">설정하면 AI가 맥락을 유지합니다</span>
        )}
        <span className="ml-auto text-white/20">
          {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </span>
      </button>

      {open && (
        <div className="pb-3 space-y-2.5">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-[10px] font-medium text-white/35">브랜드 · 제품명</label>
              <input
                type="text"
                value={profile.brand}
                onChange={(e) => onChange({ ...profile, brand: e.target.value })}
                placeholder="예: Farmskin 선크림 SPF50"
                className="w-full rounded-lg border border-white/[0.09] bg-white/[0.03] px-3 py-2 text-xs text-white placeholder:text-white/20 outline-none transition focus:border-violet-400/35 focus:ring-1 focus:ring-violet-400/15"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-medium text-white/35">타겟 국가</label>
              <select
                value={profile.country}
                onChange={(e) => onChange({ ...profile, country: e.target.value })}
                className="w-full rounded-lg border border-white/[0.09] bg-[#12141c] px-3 py-2 text-xs text-white outline-none transition focus:border-violet-400/35"
              >
                {COUNTRY_OPTS.map((c) => (
                  <option key={c} value={c}>{c || '국가 선택'}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-medium text-white/35">주 채널</label>
              <select
                value={profile.channel}
                onChange={(e) => onChange({ ...profile, channel: e.target.value })}
                className="w-full rounded-lg border border-white/[0.09] bg-[#12141c] px-3 py-2 text-xs text-white outline-none transition focus:border-violet-400/35"
              >
                {CHANNEL_OPTS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-[10px] font-medium text-white/35">톤앤매너</label>
            <div className="flex flex-wrap gap-1.5">
              {TONE_OPTS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => onChange({ ...profile, tone: t })}
                  className={`rounded-full border px-3 py-1 text-[11px] font-medium transition ${
                    profile.tone === t
                      ? 'border-violet-400/50 bg-violet-500/20 text-white'
                      : 'border-white/[0.09] text-white/35 hover:border-white/20 hover:text-white/60'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Saved Panel ──────────────────────────────────────────────────────────────
function SavedPanel({ items, onClose, onDelete, onCopyItem, onCopyAll }) {
  return (
    <>
      <div className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="fixed inset-y-0 right-0 z-40 flex w-full max-w-xs flex-col border-l border-white/[0.07] bg-[#0d0f1a] shadow-2xl sm:max-w-sm">
        <div className="flex shrink-0 items-center justify-between border-b border-white/[0.06] px-4 py-3">
          <div className="flex items-center gap-2">
            <BookmarkPlus className="h-4 w-4 text-violet-400/70" />
            <span className="text-sm font-semibold text-white">저장된 결과</span>
            {items.length > 0 && (
              <span className="rounded-full bg-violet-500/20 px-1.5 py-0.5 text-[10px] font-bold text-violet-300">
                {items.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {items.length > 0 && (
              <button
                type="button"
                onClick={onCopyAll}
                className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-[10px] font-medium text-white/55 hover:bg-white/[0.08] hover:text-white/80 transition"
              >
                <Copy className="h-3 w-3" />
                전체 복사
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-white/35 hover:bg-white/[0.06] hover:text-white/65 transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto p-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
              <BookmarkPlus className="h-8 w-8 text-white/10" />
              <p className="text-sm text-white/30">저장된 결과 없음</p>
              <p className="max-w-[200px] text-[11px] text-white/20">AI 응답 위에 커서를 올리면 저장 버튼이 나타납니다</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="rounded-md bg-violet-500/15 px-2 py-0.5 text-[10px] font-semibold text-violet-200/80">
                    {item.modeLabel}
                  </span>
                  <div className="flex gap-0.5">
                    <button
                      type="button"
                      onClick={() => onCopyItem(item.text)}
                      className="rounded-md p-1.5 text-white/25 hover:bg-white/[0.06] hover:text-white/55 transition"
                      title="복사"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(item.id)}
                      className="rounded-md p-1.5 text-white/25 hover:bg-red-500/10 hover:text-red-300/70 transition"
                      title="삭제"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                <p className="line-clamp-5 whitespace-pre-wrap break-words text-[11px] leading-relaxed text-white/55">
                  {item.text}
                </p>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="shrink-0 border-t border-white/[0.06] px-4 py-3">
            <p className="text-center text-[10px] text-white/20">
              전체 복사로 캠페인 키트를 한 번에 저장합니다
            </p>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────
function MessageBubble({ msg, isLast, onCopy, onRegenerate, onSave, busy }) {
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
      <div className="group relative rounded-2xl border border-violet-400/20 bg-gradient-to-b from-[#121528]/95 to-[#0a0c14] p-4 sm:p-5 ring-1 ring-violet-500/10">
        <FormattedResponse text={msg.text} />
        {onSave && (
          <button
            type="button"
            onClick={() => onSave(msg.text)}
            className="absolute right-3 top-3 rounded-md p-1.5 text-white/0 transition hover:bg-white/[0.08] hover:text-violet-300/80 group-hover:text-white/25"
            title="저장"
          >
            <BookmarkPlus className="h-3.5 w-3.5" />
          </button>
        )}
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
          {onSave && (
            <button
              type="button"
              onClick={() => onSave(msg.text)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-medium text-white/55 hover:bg-white/[0.08] hover:text-white/80 transition"
            >
              <BookmarkPlus className="h-3 w-3" />
              저장
            </button>
          )}
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

  const [brandProfile, setBrandProfile] = useState(() => {
    try {
      const stored = localStorage.getItem(BRAND_KEY);
      return stored ? JSON.parse(stored) : { ...DEFAULT_PROFILE };
    } catch {
      return { ...DEFAULT_PROFILE };
    }
  });
  const [profileOpen, setProfileOpen] = useState(false);

  const [savedItems, setSavedItems] = useState(() => {
    try {
      const stored = localStorage.getItem(SAVED_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [savedOpen, setSavedOpen] = useState(false);

  const chatEndRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);

  const activeMode = useMemo(() => ALL_MODES.find((m) => m.id === mode) || ALL_MODES[0], [mode]);
  const chips = EXAMPLE_CHIPS[mode] || [];
  const hasChat = messages.length > 0 || !!streaming || !!error;
  const brandContext = useMemo(() => buildBrandContext(brandProfile), [brandProfile]);

  useEffect(() => { document.title = 'SLAM Lab'; }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streaming, busy]);

  useEffect(() => {
    try { localStorage.setItem(BRAND_KEY, JSON.stringify(brandProfile)); } catch { /**/ }
  }, [brandProfile]);

  useEffect(() => {
    try { localStorage.setItem(SAVED_KEY, JSON.stringify(savedItems)); } catch { /**/ }
  }, [savedItems]);

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

  const saveItem = useCallback((text) => {
    const modeInfo = ALL_MODES.find((m) => m.id === mode);
    setSavedItems((prev) => [{
      id: Date.now(),
      mode,
      modeLabel: modeInfo?.label || mode,
      text,
      savedAt: new Date().toISOString(),
    }, ...prev].slice(0, 50));
    showToast('저장했습니다');
  }, [mode, showToast]);

  const deleteItem = useCallback((id) => {
    setSavedItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const copyItem = useCallback(async (text) => {
    try { await navigator.clipboard.writeText(text); showToast('복사했습니다'); }
    catch { showToast('복사 실패'); }
  }, [showToast]);

  const copyAllSaved = useCallback(async () => {
    if (!savedItems.length) return;
    const text = savedItems
      .map((item) => `# ${item.modeLabel}\n\n${item.text}`)
      .join('\n\n---\n\n');
    try { await navigator.clipboard.writeText(text); showToast('캠페인 키트 복사 완료'); }
    catch { showToast('복사 실패'); }
  }, [savedItems, showToast]);

  const run = useCallback(async (overrideHistory) => {
    const currentInput = input.trim();
    if (!overrideHistory && !currentInput) return;

    if (mode === 'estimate' && !overrideHistory) {
      setMessages((prev) => [
        ...prev,
        { role: 'user', text: currentInput },
        { role: 'assistant', text: runLocalEstimate(currentInput, brandProfile) },
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
        body: JSON.stringify({ mode, messages: history, lang, stream: true, brandContext }),
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
  }, [mode, messages, input, lang, brandContext, brandProfile]);

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
      <div className="pointer-events-none fixed inset-0" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_45%_at_50%_-15%,rgba(120,119,198,0.2),transparent)]" />
      </div>

      {savedOpen && (
        <SavedPanel
          items={savedItems}
          onClose={() => setSavedOpen(false)}
          onDelete={deleteItem}
          onCopyItem={copyItem}
          onCopyAll={copyAllSaved}
        />
      )}

      {/* ── Header ── */}
      <header className="relative z-20 shrink-0 border-b border-white/[0.06] bg-[#07080f]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
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

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSavedOpen(true)}
              className="relative inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-[11px] font-medium text-white/45 hover:border-white/20 hover:text-white/70 transition"
            >
              <BookmarkPlus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">저장함</span>
              {savedItems.length > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-violet-500 text-[9px] font-bold text-white">
                  {savedItems.length > 9 ? '9+' : savedItems.length}
                </span>
              )}
            </button>

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

        {/* Brand Profile Bar */}
        <BrandProfileBar
          profile={brandProfile}
          onChange={setBrandProfile}
          open={profileOpen}
          onToggle={() => setProfileOpen((v) => !v)}
        />

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
              onSave={msg.role === 'assistant' ? saveItem : null}
              onRegenerate={msg.role === 'assistant' && i === messages.length - 1 && !busy && !streaming ? regenerate : null}
              busy={busy}
            />
          ))}

          {streaming && (
            <div className="flex flex-col gap-1.5">
              <div className="relative rounded-2xl border border-violet-400/25 bg-gradient-to-b from-[#121528]/95 to-[#0a0c14] p-4 sm:p-5 ring-1 ring-violet-500/10">
                <FormattedResponse text={streaming} />
                <span className="inline-block h-4 w-0.5 animate-[pulse_0.8s_ease-in-out_infinite] bg-violet-400 ml-0.5 align-text-bottom" aria-hidden />
              </div>
            </div>
          )}

          {busy && !streaming && (
            <div className="flex items-center gap-3 rounded-2xl border border-violet-500/20 bg-violet-500/[0.05] px-5 py-4 text-sm text-violet-100/80">
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-violet-400" />
              <span className="font-medium">생성 중…</span>
            </div>
          )}

          {error && (
            <pre className="whitespace-pre-wrap break-words rounded-2xl border border-red-400/25 bg-red-500/[0.07] p-4 text-xs text-red-100/90">
              {error}
            </pre>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* ── Input area ── */}
        <div className="shrink-0 border-t border-white/[0.06] pb-5 pt-3">
          {brandContext && !hasChat && (
            <div className="mb-2 flex items-center gap-1.5">
              <Settings2 className="h-3 w-3 shrink-0 text-violet-400/40" />
              <span className="truncate text-[10px] text-violet-300/45">{brandContext}</span>
            </div>
          )}

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

          <p className="mt-2 text-center text-[10px] text-white/20">
            {hasChat ? '모드를 바꾸면 새 대화가 시작됩니다.' : '⌘ / Ctrl + Enter 로 실행'}
          </p>
        </div>
      </div>
    </div>
  );
}
