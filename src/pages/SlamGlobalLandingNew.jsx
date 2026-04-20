import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Database,
  LayoutDashboard,
  LineChart,
  Megaphone,
  Sparkles,
} from 'lucide-react';

/**
 * slam-global 리뉴얼 랜딩 (와이어프레임 수준 UI)
 *
 * 이 파일만 삭제하면 실험을 되돌릴 수 있습니다. 기존 라우트를 바꾸지 않으려면
 * App.jsx에 아래 한 줄을 추가해 미리보기 경로를 열 수 있습니다.
 *
 * import SlamGlobalLandingNew from './pages/SlamGlobalLandingNew';
 * <Route path="/landing-new" element={<SlamGlobalLandingNew />} />
 */

const steps = [
  {
    id: 1,
    title: '데이터 등록',
    desc: '연동 또는 입력으로 소스를 연결합니다.',
    icon: Database,
    mock: (
      <div className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="h-2 w-24 rounded bg-white/20" />
        <div className="flex gap-2">
          <div className="h-2 flex-1 rounded bg-violet-500/40" />
          <div className="h-2 flex-1 rounded bg-white/10" />
        </div>
        <div className="mt-3 flex gap-2">
          <div className="h-8 flex-1 rounded-lg border border-dashed border-white/20 bg-white/[0.03]" />
          <div className="h-8 w-20 rounded-lg bg-gradient-to-r from-violet-500 to-cyan-400/80" />
        </div>
      </div>
    ),
  },
  {
    id: 2,
    title: '추적',
    desc: '시스템이 자동으로 모니터링합니다.',
    icon: LayoutDashboard,
    mock: (
      <div className="relative overflow-hidden rounded-xl border border-white/10 bg-slate-950/80 p-4">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(139,92,246,0.15),transparent_50%)]" />
        <div className="relative flex gap-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 flex-1 rounded-lg bg-white/[0.06] ring-1 ring-white/10"
              style={{
                animation: `pulse 2.4s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
        <div className="relative mt-3 flex items-end gap-1">
          {[40, 55, 35, 70, 50, 85, 65].map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-t bg-gradient-to-t from-cyan-500/50 to-violet-500/60"
              style={{ height: `${h}%`, minHeight: '28px' }}
            />
          ))}
        </div>
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 0.6; transform: scaleY(1); }
            50% { opacity: 1; transform: scaleY(1.02); }
          }
        `}</style>
      </div>
    ),
  },
  {
    id: 3,
    title: '광고',
    desc: '타겟과 소재를 설정해 집행합니다.',
    icon: Megaphone,
    mock: (
      <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="flex gap-2">
          <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] font-medium text-violet-200">
            Audience
          </span>
          <span className="rounded-full bg-cyan-500/15 px-2 py-0.5 text-[10px] font-medium text-cyan-200">
            Creative
          </span>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <div className="h-2 rounded bg-white/15" />
          <div className="h-2 rounded bg-white/10" />
          <div className="h-2 rounded bg-white/10" />
          <div className="h-2 rounded bg-white/15" />
        </div>
        <div className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-2">
          <span className="text-[10px] text-white/50">Campaign</span>
          <span className="text-[10px] font-medium text-violet-200">Launch</span>
        </div>
      </div>
    ),
  },
  {
    id: 4,
    title: '매출',
    desc: '성과가 누적되는 흐름을 확인합니다.',
    icon: LineChart,
    mock: (
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="mb-2 flex items-center gap-2 text-[10px] text-emerald-300/90">
          <BarChart3 className="h-3.5 w-3.5" />
          Revenue trend
        </div>
        <div className="mt-2 flex items-end gap-0.5">
          {[20, 28, 24, 35, 42, 48, 55, 62, 68, 74, 82, 90].map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-t bg-gradient-to-t from-emerald-500/20 to-emerald-400/80"
              style={{ height: `${h}px` }}
            />
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2 text-[10px] text-white/40">
          <span className="inline-flex items-center gap-1 rounded bg-emerald-500/15 px-2 py-0.5 text-emerald-200">
            <ArrowRight className="h-3 w-3 rotate-[-45deg]" />
            +24%
          </span>
          <span>vs last period</span>
        </div>
      </div>
    ),
  },
];

export default function SlamGlobalLandingNew() {
  const [campaignHint, setCampaignHint] = useState('');

  return (
    <div className="min-h-screen bg-[#05070f] text-slate-100 antialiased">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 top-20 h-[420px] w-[420px] rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="absolute -right-32 top-1/3 h-[380px] w-[380px] rounded-full bg-cyan-500/15 blur-[100px]" />
        <div className="absolute bottom-0 left-1/2 h-[280px] w-[min(90%,720px)] -translate-x-1/2 rounded-full bg-indigo-500/10 blur-[90px]" />
      </div>

      <header className="relative z-10 border-b border-white/[0.06] bg-[#05070f]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2 text-sm font-semibold tracking-tight text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-cyan-400 text-white shadow-lg shadow-violet-500/25">
              <Sparkles className="h-4 w-4" />
            </span>
            slam-global
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/login"
              className="rounded-full px-3 py-1.5 text-sm font-medium text-white/80 transition hover:bg-white/5 hover:text-white"
            >
              로그인
            </Link>
            <Link
              to="/login"
              className="rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-600/30 transition hover:brightness-110"
            >
              시작하기
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        {/* Hero */}
        <section className="mx-auto max-w-5xl px-4 pb-20 pt-16 text-center sm:px-6 sm:pt-24 lg:px-8">
          <p className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-violet-200/90">
            AI SaaS
          </p>
          <h1 className="mx-auto max-w-4xl font-sans text-3xl font-bold leading-[1.15] tracking-tight text-white sm:text-4xl md:text-5xl lg:text-[2.75rem] lg:leading-[1.12]">
            <span className="bg-gradient-to-r from-[#e0e7ff] via-[#a5b4fc] to-[#22d3ee] bg-clip-text text-transparent">
              당신이 잠든 사이에도 시스템은 콘텐츠를 추적하고 성과를 쌓고 있습니다.
            </span>
          </h1>

          <div className="mx-auto mt-12 max-w-2xl">
            <label
              htmlFor="campaign-intent"
              className="mb-2 block text-left text-sm font-medium text-white/70"
            >
              어떤 캠페인을 만들고 싶으신가요?
            </label>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
              <input
                id="campaign-intent"
                type="text"
                value={campaignHint}
                onChange={(e) => setCampaignHint(e.target.value)}
                placeholder="예: 브랜드 인지도, 신제품 런칭, 리타겟팅"
                className="min-h-[52px] flex-1 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none ring-0 transition focus:border-violet-400/50 focus:bg-white/[0.08]"
              />
              <Link
                to="/login"
                className="inline-flex min-h-[52px] shrink-0 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 px-6 text-sm font-semibold text-white shadow-xl shadow-violet-600/25 transition hover:brightness-110"
              >
                내 캠페인 바로 만들기
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="border-t border-white/[0.06] bg-[#05070f]/50 py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 text-center">
              <h2 className="text-lg font-semibold text-white sm:text-xl">작동 방식</h2>
              <p className="mt-2 text-sm text-white/45">등록 → 추적 → 광고 → 매출까지 한 흐름</p>
            </div>

            {/* Desktop: horizontal stepper */}
            <div className="hidden lg:block">
              <div className="flex items-center justify-between gap-4">
                {steps.map((step, i) => {
                  const Icon = step.icon;
                  return (
                    <React.Fragment key={step.id}>
                      <div className="flex min-w-0 flex-1 flex-col items-center text-center">
                        <div className="relative mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-violet-200 shadow-inner">
                          <Icon className="h-6 w-6" />
                          <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-violet-600 text-[10px] font-bold text-white">
                            {step.id}
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold text-white">{step.title}</h3>
                        <p className="mt-1 text-xs text-white/45">{step.desc}</p>
                        <div className="mt-4 w-full">{step.mock}</div>
                      </div>
                      {i < steps.length - 1 && (
                        <div className="flex shrink-0 items-center pb-32 text-white/20">
                          <ArrowRight className="h-5 w-5" />
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* Mobile / tablet: vertical flow */}
            <div className="space-y-10 lg:hidden">
              {steps.map((step, i) => {
                const Icon = step.icon;
                return (
                  <div key={step.id} className="relative">
                    {i < steps.length - 1 && (
                      <div
                        aria-hidden
                        className="absolute left-[1.4rem] top-14 bottom-0 w-px bg-gradient-to-b from-violet-500/40 to-transparent"
                      />
                    )}
                    <div className="flex gap-4">
                      <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-violet-200">
                        <Icon className="h-5 w-5" />
                        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-violet-600 text-[9px] font-bold text-white">
                          {step.id}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-semibold text-white">{step.title}</h3>
                        <p className="mt-0.5 text-sm text-white/45">{step.desc}</p>
                        <div className="mt-4">{step.mock}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <footer className="border-t border-white/[0.06] py-8 text-center text-xs text-white/35">
          <p>slam-global — 리뉴얼 프리뷰 페이지</p>
        </footer>
      </main>
    </div>
  );
}
