/**
 * 완료 캠페인용 KOCOSTAR 성과 리포트 — 한 뷰포트 단위 슬라이드(가로 네비, 세로 스크롤 최소화)
 */
import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, BarChart2 } from 'lucide-react';

const NAV_SLIDES = [
  { key: 'overview', label: '1. 개요 · 핵심 수치' },
  { key: 'daily', label: '2. 일별 조회 추이' },
  { key: 'sentiment', label: '3. 댓글 감성 · 반응' },
  { key: 'creators', label: '4. 상위 크리에이터' },
  { key: 'insight-action', label: '5. 인사이트 · 추천 액션' },
  { key: 'best-posts-a', label: '6. 베스트 콘텐츠 (1)' },
  { key: 'best-posts-b', label: '7. 베스트 콘텐츠 (2)' },
  { key: 'metrics-keywords', label: '8. 성과 카드 · 키워드' },
  { key: 'table-personas', label: '9. 리포트 표 · 유저 특성' },
  { key: 'comments-core', label: '10. 댓글 정량 · 핵심 강점' },
  { key: 'topic-matrix', label: '11. 토픽 매트릭스' },
  { key: 'deep-strategy', label: '12. 심층 분석 · 전략' },
];

function SlideFrame({ title, eyebrow, children }) {
  return (
    <div
      className="w-full max-w-none min-w-0 h-full snap-start snap-always flex flex-col rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_20px_50px_-24px_rgba(15,23,42,0.25)] overflow-hidden box-border"
      style={{ height: 'min(calc(100dvh - 13rem), 760px)', maxHeight: 'min(calc(100dvh - 13rem), 760px)' }}
      role="group"
      aria-roledescription="slide"
    >
      <div className="shrink-0 px-4 py-3 md:px-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-start justify-between gap-3">
        <div className="min-w-0">
          {eyebrow ? (
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-700 mb-0.5 flex items-center gap-1">{eyebrow}</div>
          ) : null}
          <p className="text-sm md:text-base font-black text-slate-900 tracking-tight leading-snug truncate">{title}</p>
        </div>
      </div>
      <div className="flex-1 min-h-0 flex flex-col p-4 md:p-5 overflow-hidden">{children}</div>
    </div>
  );
}

export default function KocostarReportDeck({ campaign }) {
  const fd = campaign?.setup_submission_summary?.form_data || {};
  const reportSummary = fd?.report_summary || {};
  const reportDataStudio = fd?.report_data_studio || {};
  const reportNotion = fd?.report_notion || {};
  const reportTopCreatorsRaw = Array.isArray(fd?.report_top_creators) ? fd.report_top_creators : [];
  const reportTopPostsRaw = Array.isArray(fd?.report_top_posts) ? fd.report_top_posts : [];
  const reportInsights = Array.isArray(fd?.report_insights) ? fd.report_insights : [];
  const reportActions = Array.isArray(fd?.report_actions) ? fd.report_actions : [];

  const fmt = (n) => Number(n || 0).toLocaleString();
  const pct = (n) => `${Number(n || 0).toFixed(2)}%`;
  const parseNum = (v) => Number(String(v ?? '').replace(/[^0-9]/g, '') || 0);
  const analytics = campaign?.analytics || {};
  const dailyViews = Array.isArray(analytics?.daily_views) ? analytics.daily_views : [];
  const dates = Array.isArray(analytics?.dates) ? analytics.dates : [];
  const maxDaily = Math.max(1, ...dailyViews);

  const topLang = Array.isArray(reportSummary?.top_languages) ? reportSummary.top_languages : [];
  const quantSummary = reportDataStudio?.comment_quantitative_summary || {};
  const qualitativeSummary = Array.isArray(reportDataStudio?.comment_qualitative_summary)
    ? reportDataStudio.comment_qualitative_summary
    : [];
  const dataDrivenInsights = Array.isArray(reportDataStudio?.data_driven_insights)
    ? reportDataStudio.data_driven_insights
    : [];
  const nextActionPlan = Array.isArray(reportDataStudio?.next_action_plan)
    ? reportDataStudio.next_action_plan
    : [];
  const sentimentKeywords = Array.isArray(reportNotion?.sentiment_analysis?.representative_keywords)
    ? reportNotion.sentiment_analysis.representative_keywords
    : [];
  const topicMatrix = Array.isArray(reportDataStudio?.comment_topic_matrix) ? reportDataStudio.comment_topic_matrix : [];
  const userPersonas = Array.isArray(reportDataStudio?.user_personas) ? reportDataStudio.user_personas : [];
  const langMarketMatrix = Array.isArray(reportNotion?.language_market_matrix) ? reportNotion.language_market_matrix : [];
  const highIntentExamples = Array.isArray(reportNotion?.purchase_intent_signal_analysis?.high_intent_examples)
    ? reportNotion.purchase_intent_signal_analysis.high_intent_examples
    : [];
  const midIntentExamples = Array.isArray(reportNotion?.purchase_intent_signal_analysis?.mid_intent_examples)
    ? reportNotion.purchase_intent_signal_analysis.mid_intent_examples
    : [];
  const viralExamples = Array.isArray(reportNotion?.purchase_intent_signal_analysis?.viral_examples)
    ? reportNotion.purchase_intent_signal_analysis.viral_examples
    : [];
  const strategyAssetDirection = Array.isArray(reportNotion?.strategy_asset_direction)
    ? reportNotion.strategy_asset_direction
    : [];
  const insightStatements = dataDrivenInsights.length > 0 ? dataDrivenInsights : reportInsights;
  const strategySummaryList = Array.isArray(reportNotion?.strategy_summary) ? reportNotion.strategy_summary : [];
  const keyStatementClass = [
    'from-fuchsia-500/18 via-indigo-500/12 to-cyan-500/18',
    'from-cyan-500/18 via-blue-500/12 to-emerald-500/18',
    'from-rose-500/18 via-fuchsia-500/12 to-indigo-500/18',
    'from-emerald-500/18 via-cyan-500/12 to-blue-500/18',
  ];
  const fallbackCreators = Array.isArray(campaign?.creators) ? campaign.creators : [];
  const fallbackPosts = Array.isArray(campaign?.contents) ? campaign.contents : [];

  const reportTopCreators = reportTopCreatorsRaw.length > 0
    ? reportTopCreatorsRaw
    : fallbackCreators.slice(0, 10).map((c) => ({
        name: c.name || '-',
        platform: c.platform || '-',
        views: parseNum(c.views),
        likes: 0,
        comments: 0,
        shares: 0,
        posts: 1,
      }));

  const reportTopPosts = reportTopPostsRaw.length > 0
    ? reportTopPostsRaw
    : fallbackPosts.slice(0, 12).map((c) => ({
        name: c.creator || '-',
        platform: 'POST',
        views: parseNum(c.views),
        likes: 0,
        comments: 0,
        shares: 0,
        url: null,
      }));

  const summaryViews = parseNum(campaign.kpi_views) || Number(reportSummary.views || 0);
  const summaryLikes = parseNum(campaign.kpi_likes) || Number(reportSummary.likes || 0);
  const summaryComments = parseNum(campaign.kpi_comments) || Number(reportSummary.comments || 0);
  const summaryShares = parseNum(campaign.kpi_shares) || Number(reportSummary.shares || 0);
  const summaryPosts = Number(reportSummary.posts || campaign.content_count || reportTopPosts.length || 0);
  const engagementPct = analytics?.engagement_rate
    || (summaryViews > 0
      ? `${(((summaryLikes + summaryComments + summaryShares) / summaryViews) * 100).toFixed(2)}%`
      : pct(reportSummary.engagement_rate));

  const dedupedReportTopCreators = [...reportTopCreators.reduce((acc, creator) => {
    const name = String(creator?.name || '-').trim();
    const key = name.toLowerCase();
    const prev = acc.get(key) || {
      name,
      platformSet: new Set(),
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      posts: 0,
    };
    String(creator?.platform || '-')
      .split('/')
      .map((x) => x.trim())
      .filter(Boolean)
      .forEach((platform) => prev.platformSet.add(platform));
    prev.views += Number(creator?.views || 0);
    prev.likes += Number(creator?.likes || 0);
    prev.comments += Number(creator?.comments || 0);
    prev.shares += Number(creator?.shares || 0);
    prev.posts += Number(creator?.posts || 1);
    acc.set(key, prev);
    return acc;
  }, new Map()).values()]
    .map((creator) => ({
      ...creator,
      platform: [...creator.platformSet].sort().join('/'),
    }))
    .sort((a, b) => b.views - a.views);

  const commentExampleSnippets = useMemo(() => [...topicMatrix.flatMap((row) => Array.isArray(row?.evidence) ? row.evidence : []),
    ...highIntentExamples,
    ...midIntentExamples,
    ...viralExamples,
  ].filter(Boolean).slice(0, 18), [topicMatrix, highIntentExamples, midIntentExamples, viralExamples]);

  const userCharacteristicNotes = useMemo(() => ([
    {
      label: 'Creator-like bio',
      value: reportDataStudio?.user_characteristics?.creator_like || 0,
      help: '댓글 작성자 프로필에 제작자 성향 단어가 감지된 수입니다.',
    },
    {
      label: 'Shopper-like bio',
      value: reportDataStudio?.user_characteristics?.shopper_like || 0,
      help: '프로필에 쇼핑·할인 탐색 성향 단어가 감지된 수입니다.',
    },
    {
      label: 'Skincare-interest bio',
      value: reportDataStudio?.user_characteristics?.skincare_interest || 0,
      help: '뷰티·스킨케어 관심 단어가 감지된 수입니다.',
    },
  ]), [reportDataStudio?.user_characteristics]);

  const topRegions = Array.isArray(reportSummary?.top_regions) ? reportSummary.top_regions : [];

  const bestPostsChunks = useMemo(() => [reportTopPosts.slice(0, 6), reportTopPosts.slice(6, 12)], [reportTopPosts]);

  const [slideIdx, setSlideIdx] = useState(0);
  const trackRef = useRef(null);

  /** 페이지 세로 스크롤 유발하지 않도록 가로 트랙만 scrollLeft 이동 (한 칼럼 폭 = 트랙 clientWidth) */
  const scrollTrackToIndex = useCallback((index, behavior = 'smooth') => {
    const track = trackRef.current;
    if (!track) return;
    const w = track.clientWidth;
    if (!(w > 0)) return;
    const clamped = Math.max(0, Math.min(NAV_SLIDES.length - 1, index));
    track.scrollTo({ left: clamped * w, behavior: behavior === 'smooth' ? 'smooth' : 'auto' });
  }, []);

  useEffect(() => {
    scrollTrackToIndex(slideIdx, 'smooth');
  }, [slideIdx, scrollTrackToIndex]);

  /** 드래그·트랙패드 등으로 스크롤했을 때 인덱스 동기화 */
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let t;
    const onScroll = () => {
      window.clearTimeout(t);
      t = window.setTimeout(() => {
        const w = track.clientWidth;
        if (!(w > 0)) return;
        const i = Math.round(track.scrollLeft / w);
        setSlideIdx((prev) => (i === prev ? prev : Math.max(0, Math.min(NAV_SLIDES.length - 1, i))));
      }, 80);
    };
    track.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.clearTimeout(t);
      track.removeEventListener('scroll', onScroll);
    };
  }, []);

  useEffect(() => {
    const onResize = () => {
      scrollTrackToIndex(slideIdx, 'auto');
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [slideIdx, scrollTrackToIndex]);

  const go = (delta) => {
    setSlideIdx((i) => Math.max(0, Math.min(NAV_SLIDES.length - 1, i + delta)));
  };

  const defaultInsights =
    [
      `총 ${fmt(summaryPosts)}개 포스팅에서 ${fmt(summaryViews)} 조회를 확보했습니다.`,
      `좋아요+댓글+공유 기반 참여율은 ${engagementPct}입니다.`,
      `댓글 감성은 긍정 ${pct(reportSummary.positive_pct)} / 부정 ${pct(reportSummary.negative_pct)}로 안정적입니다.`,
    ];
  const defaultActions = [
    '상위 조회 콘텐츠 포맷을 다음 물량 가이드의 기본 템플릿으로 고정',
    '구매의도 댓글이 붙은 영상에 링크 고정/프로필 CTA 재강화',
    '언어 비중 상위 국가 중심으로 차기 시딩 크리에이터를 재배치',
  ];

  const barW = `${100 / Math.max(1, dailyViews.length)}%`;

  return (
    <div className="space-y-6 animate-fade-in-up text-slate-900">
      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 md:px-6 shadow-sm flex flex-wrap items-center gap-4 justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <BarChart2 size={26} className="text-cyan-600 shrink-0" aria-hidden />
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">Client report</p>
            <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight truncate">KOCOSTAR 캠페인 리포트</h3>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-black tracking-widest uppercase px-3 py-1.5 bg-cyan-50 border border-cyan-200 rounded-xl text-cyan-800 whitespace-nowrap">
            Full-Funnel
          </span>
          <button
            type="button"
            aria-label="이전 페이지"
            onClick={() => go(-1)}
            className="w-10 h-10 rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm inline-flex items-center justify-center hover:bg-slate-50 disabled:opacity-40"
            disabled={slideIdx === 0}
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            aria-label="다음 페이지"
            onClick={() => go(1)}
            className="w-10 h-10 rounded-full border border-slate-900 bg-slate-900 text-white shadow-sm inline-flex items-center justify-center hover:bg-slate-800 disabled:opacity-40"
            disabled={slideIdx === NAV_SLIDES.length - 1}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <p className="text-xs md:text-sm text-slate-600 font-medium px-1 leading-relaxed">
        각 페이지가 한 화면에 들어오도록 정보를 나누었습니다. 아래 목록을 누르거나 좌우 버튼으로 이동하세요.
      </p>

      <nav aria-label="리포트 페이지" className="flex flex-wrap gap-2 px-1 scroll-mt-28 md:scroll-mt-32">
        {NAV_SLIDES.map((s, i) => (
          <button
            key={s.key}
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => {
              e.preventDefault();
              setSlideIdx(i);
              requestAnimationFrame(() => scrollTrackToIndex(i, 'smooth'));
            }}
            className={`text-left px-3 py-2 rounded-xl text-[11px] md:text-xs font-bold border transition-colors max-w-[200px] sm:max-w-none ${
              i === slideIdx
                ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400 hover:bg-slate-50'
            }`}
          >
            {s.label}
          </button>
        ))}
      </nav>

      <p className="text-[11px] text-slate-500 px-1 font-mono tabular-nums">
        {slideIdx + 1} / {NAV_SLIDES.length}
      </p>

      <div className="w-full overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-slate-100/40">
        <div
          ref={trackRef}
          className="grid w-full grid-flow-col auto-cols-[100%] overflow-x-auto overflow-y-hidden snap-x snap-mandatory snap-always overscroll-x-contain scroll-smooth scrollbar-thin [scrollbar-width:thin] touch-pan-x"
          style={{
            scrollbarColor: '#cbd5e1 transparent',
            WebkitOverflowScrolling: 'touch',
          }}
          role="region"
          aria-label="리포트 슬라이드 영역"
        >
        <div className="min-w-0" data-slide-item>
          <SlideFrame title="개요 · 핵심 수치" eyebrow="Executive Overview">
            <div className="flex-1 min-h-0 flex flex-col gap-4 overflow-hidden">
              <p className="text-xs md:text-sm text-slate-700 font-semibold leading-snug shrink-0">
                누적 <span className="text-cyan-700 font-black">{fmt(summaryViews)}</span> 조회를 기반으로 감성·구매 의도·바이럴 신호를 한 번에 검토합니다.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 shrink-0">
                <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                  <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Posts</p>
                  <p className="text-lg font-black text-slate-900 mt-0.5 tabular-nums">{fmt(summaryPosts)}</p>
                </div>
                <div className="rounded-xl border border-violet-100 bg-violet-50/70 px-3 py-2">
                  <p className="text-[9px] text-violet-600 font-black uppercase tracking-widest">Views</p>
                  <p className="text-lg font-black text-slate-900 mt-0.5 tabular-nums">{fmt(summaryViews)}</p>
                </div>
                <div className="rounded-xl border border-rose-100 bg-rose-50/70 px-3 py-2">
                  <p className="text-[9px] text-rose-600 font-black uppercase tracking-widest">Likes</p>
                  <p className="text-lg font-black text-slate-900 mt-0.5 tabular-nums">{fmt(summaryLikes)}</p>
                </div>
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 px-3 py-2">
                  <p className="text-[9px] text-emerald-700 font-black uppercase tracking-widest">Eng.</p>
                  <p className="text-lg font-black text-slate-900 mt-0.5 tabular-nums">{engagementPct}</p>
                </div>
              </div>
              <div className="flex-1 min-h-0 rounded-xl border border-fuchsia-100 bg-gradient-to-r from-fuchsia-50 via-indigo-50 to-cyan-50 p-3 overflow-hidden flex flex-col">
                <p className="text-[10px] font-black uppercase tracking-widest text-fuchsia-800 shrink-0">하이라이트</p>
                <p className="text-[11px] md:text-xs text-slate-800 mt-2 leading-snug overflow-hidden flex-1 line-clamp-6 md:line-clamp-8">
                  상위 크리에이터 성과, 댓글 정량/정성, 언어권 반응, 다음 실행 전략까지 카드별로 확인할 수 있습니다.
                </p>
              </div>
            </div>
          </SlideFrame>
        </div>

        <div className="min-w-0" data-slide-item>
          <SlideFrame title="일별 조회 추이" eyebrow="Daily View Trend">
            <div className="flex-1 flex flex-col min-h-0">
              <p className="text-[11px] text-slate-500 mb-3 shrink-0 leading-snug">막대는 일별 피크 대비 높이로 환산했습니다.</p>
              <div className="flex-1 flex items-end pb-12 pl-8 pr-2 gap-1 rounded-xl bg-slate-50 border border-slate-100 min-h-[180px] max-h-[48vh] px-3 pt-3 relative">
                <div className="absolute top-4 left-2 h-[calc(100%-3.75rem)] flex flex-col justify-between text-[9px] text-slate-500 font-black uppercase tracking-wider leading-none">
                  <span>{fmt(maxDaily)}</span>
                  <span>{fmt(Math.round(maxDaily * 0.66))}</span>
                  <span>{fmt(Math.round(maxDaily * 0.33))}</span>
                  <span>0</span>
                </div>
                {dailyViews.map((views, idx) => (
                  <div key={`${dates[idx] || idx}-bar`} className="relative h-full flex flex-col justify-end group" style={{ width: barW }}>
                    <div
                      className="w-full mx-0.5 bg-gradient-to-t from-cyan-700 to-sky-400 rounded-t-lg shadow-sm"
                      style={{ height: `${Math.max(4, (Number(views || 0) / maxDaily) * 100)}%` }}
                    />
                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] font-bold text-slate-600 truncate max-w-full">
                      {dates[idx]}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </SlideFrame>
        </div>

        <div className="min-w-0" data-slide-item>
          <SlideFrame title="댓글 감성 · 반응 신호" eyebrow="Audience signals">
            <div className="flex-1 min-h-0 grid gap-4 md:grid-cols-2 overflow-hidden">
              <div className="min-h-0 flex flex-col gap-3 overflow-hidden">
                <div>
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-emerald-700 font-bold">긍정</span>
                    <span className="text-slate-600 tabular-nums">{pct(reportSummary.positive_pct)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, Number(reportSummary.positive_pct || 0))}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-sky-700 font-bold">중립</span>
                    <span className="text-slate-600 tabular-nums">{pct(reportSummary.neutral_pct)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-sky-500 rounded-full" style={{ width: `${Math.min(100, Number(reportSummary.neutral_pct || 0))}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-rose-700 font-bold">부정</span>
                    <span className="text-slate-600 tabular-nums">{pct(reportSummary.negative_pct)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-rose-500 rounded-full" style={{ width: `${Math.min(100, Number(reportSummary.negative_pct || 0))}%` }} />
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2 min-h-0">
                <div className="grid grid-cols-2 gap-2 shrink-0">
                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-2">
                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-wider">구매의도</p>
                    <p className="text-base font-black text-slate-900 tabular-nums">{pct(reportSummary.purchase_intent_pct)}</p>
                  </div>
                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-2">
                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-wider flex items-center gap-1">
                      바이럴
                      <span className="font-normal cursor-help underline decoration-dotted" title="확산·공유 가능성 신호입니다.">
                        (?)
                      </span>
                    </p>
                    <p className="text-base font-black text-slate-900 tabular-nums">{pct(reportSummary.viral_signal_pct)}</p>
                  </div>
                </div>
                {topLang.length ? (
                  <div className="flex flex-wrap gap-1.5 mt-2 overflow-auto max-h-[20vh] content-start">
                    {topLang.map(([lang, cnt]) => (
                      <span key={lang} className="text-[10px] px-2 py-1 rounded-full border border-slate-200 text-slate-700 bg-white font-semibold">
                        {String(lang).toUpperCase()} · {cnt}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400">언어 분포 데이터 없음.</p>
                )}
              </div>
            </div>
          </SlideFrame>
        </div>

        <div className="min-w-0" data-slide-item>
          <SlideFrame title="상위 크리에이터" eyebrow={`Top performers · 최대 ${Math.min(dedupedReportTopCreators.length, 8)}명`}>
            <div className="flex-1 min-h-0 overflow-hidden rounded-xl border border-slate-100">
              <div className="grid grid-cols-12 gap-1 text-[10px] font-black text-slate-500 uppercase tracking-tighter px-3 py-2 bg-slate-50 border-b border-slate-100">
                <div className="col-span-1">#</div>
                <div className="col-span-5">이름</div>
                <div className="col-span-3">플랫폼</div>
                <div className="col-span-3 text-right">조회 · ER%</div>
              </div>
              <div className="divide-y divide-slate-100">
                {(dedupedReportTopCreators.slice(0, 8)).map((c, idx) => {
                  const v = Number(c?.views || 0);
                  const er = v > 0 ? (((Number(c?.likes || 0) + Number(c?.comments || 0) + Number(c?.shares || 0)) / v) * 100).toFixed(1) : '0';
                  return (
                    <div key={`${c?.name}-${idx}`} className="grid grid-cols-12 gap-1 px-3 py-1.5 text-[11px] items-center hover:bg-slate-50">
                      <div className="col-span-1 text-slate-400 font-black">{idx + 1}</div>
                      <div className="col-span-5 font-bold text-slate-900 truncate">{c?.name || '-'}</div>
                      <div className="col-span-3 text-slate-600 truncate">{c?.platform || '-'}</div>
                      <div className="col-span-3 text-right tabular-nums text-cyan-800 font-semibold">{fmt(v)} · {er}%</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </SlideFrame>
        </div>

        <div className="min-w-0" data-slide-item>
          <SlideFrame title="핵심 인사이트 · 추천 액션" eyebrow="What it means · What to do">
            <div className="flex-1 grid md:grid-cols-2 gap-4 min-h-0 overflow-hidden">
              <div className="min-h-0 flex flex-col rounded-xl border border-slate-100 bg-slate-50/70 p-3 overflow-hidden">
                <p className="text-[10px] font-black uppercase text-slate-500 mb-2 shrink-0 tracking-wider">Insights</p>
                <ul className="flex-1 min-h-0 space-y-1.5 overflow-hidden">
                  {(reportInsights.length > 0 ? reportInsights : defaultInsights).slice(0, 5).map((x, idx) => (
                    <li key={`ins-${idx}`} className="text-[11px] md:text-xs text-slate-800 leading-snug line-clamp-3 rounded-lg bg-white border border-slate-100 px-2 py-1.5">
                      {typeof x === 'string' ? x : JSON.stringify(x)}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="min-h-0 flex flex-col rounded-xl border border-cyan-100 bg-cyan-50/50 p-3 overflow-hidden">
                <p className="text-[10px] font-black uppercase text-cyan-800 mb-2 shrink-0 tracking-wider">Actions</p>
                <ul className="flex-1 min-h-0 space-y-1.5 overflow-hidden">
                  {(reportActions.length > 0 ? reportActions : defaultActions).slice(0, 5).map((x, idx) => (
                    <li key={`act-${idx}`} className="text-[11px] md:text-xs text-slate-800 leading-snug line-clamp-3 rounded-lg bg-white border border-cyan-100/80 px-2 py-1.5">
                      {typeof x === 'string' ? x : JSON.stringify(x)}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </SlideFrame>
        </div>

        {bestPostsChunks.map((chunk, chunkIdx) => (
          <div className="min-w-0" data-slide-item key={`best-${chunkIdx}`}>
            <SlideFrame title={chunkIdx === 0 ? '베스트 콘텐츠 (1)' : '베스트 콘텐츠 (2)'} eyebrow="Top-performing posts">
              <div className="flex-1 min-h-0 grid grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3 auto-rows-fr">
                {(chunk.length ? chunk : []).map((p, idx) => {
                  const globalIdx = chunkIdx * 6 + idx;
                  return (
                    <a
                      key={`bp-${globalIdx}-${p?.url}`}
                      href={p?.url || '#'}
                      target={p?.url ? '_blank' : undefined}
                      rel={p?.url ? 'noreferrer noopener' : undefined}
                      className="rounded-xl border border-slate-100 bg-white p-2 flex flex-col min-h-[88px] max-h-[24vh] shadow-sm hover:shadow-md transition-shadow overflow-hidden no-underline"
                    >
                      <p className="text-[10px] font-black text-amber-700 truncate">TOP {globalIdx + 1}</p>
                      <p className="font-bold text-slate-900 text-[11px] md:text-xs leading-tight line-clamp-2">{p?.name || '-'}</p>
                      <p className="text-[10px] text-slate-500 truncate mt-1">{p?.platform || '-'}</p>
                      <div className="mt-auto pt-2 grid grid-cols-2 gap-1 text-[10px] text-slate-700 font-semibold tabular-nums">
                        <span>V {fmt(p?.views)}</span>
                        <span>L {fmt(p?.likes)}</span>
                      </div>
                    </a>
                  );
                })}
                {!chunk.length && (
                  <p className="col-span-full text-[12px] text-slate-500 self-center justify-self-center py-12">표시할 인기 게시물이 부족합니다.</p>
                )}
              </div>
            </SlideFrame>
          </div>
        ))}

        <div className="min-w-0" data-slide-item>
          <SlideFrame title="성과 카드 · 키워드" eyebrow="Data studio pulse">
            <div className="flex-1 min-h-0 grid grid-cols-2 md:grid-cols-4 gap-2 overflow-hidden shrink-0">
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-2">
                <p className="text-[9px] text-slate-500 uppercase font-black tracking-wider">포스팅</p>
                <p className="text-lg font-black text-slate-900">{fmt(reportDataStudio?.overview_cards?.posting_count || summaryPosts)}</p>
              </div>
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-2">
                <p className="text-[9px] text-slate-500 uppercase font-black tracking-wider">누적 뷰</p>
                <p className="text-lg font-black text-slate-900">{fmt(reportDataStudio?.overview_cards?.cumulative_views || summaryViews)}</p>
              </div>
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-2">
                <p className="text-[9px] text-slate-500 uppercase font-black tracking-wider">피크 뷰</p>
                <p className="text-lg font-black text-slate-900">{fmt(reportDataStudio?.overview_cards?.max_single_view || 0)}</p>
              </div>
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-2">
                <p className="text-[9px] text-slate-500 uppercase font-black tracking-wider">배송</p>
                <p className="text-lg font-black text-slate-900">{pct(reportDataStudio?.overview_cards?.shipping_reach_rate || 0)}</p>
              </div>
            </div>
            <div className="mt-4 flex-1 min-h-0 overflow-hidden rounded-xl border border-slate-100 bg-slate-50/60 p-3">
              <p className="text-[10px] font-black text-slate-600 uppercase mb-2 tracking-wider">주요 키워드</p>
              <div className="space-y-1 max-h-[30vh] overflow-hidden">
                {((reportDataStudio?.keyword_mentions || []).slice(0, 8)).length ? (
                  (reportDataStudio?.keyword_mentions || []).slice(0, 8).map((k, idx) => (
                    <div key={`kw-${idx}`} className="flex justify-between rounded-md bg-white border border-slate-100 px-2 py-1 text-[11px]">
                      <span className="text-slate-800 font-semibold truncate mr-2">{k.keyword}</span>
                      <span className="text-cyan-800 font-black tabular-nums shrink-0">{fmt(k.mentions)}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-[11px] text-slate-500">등록된 키워드 집계가 없습니다.</p>
                )}
              </div>
            </div>
          </SlideFrame>
        </div>

        <div className="min-w-0" data-slide-item>
          <SlideFrame title="리포트 표 · 유저 특성" eyebrow="Table & commenter traits">
            <div className="flex-1 min-h-0 flex flex-col gap-3 md:flex-row overflow-hidden">
              <div className="flex-1 min-h-0 border border-slate-100 rounded-xl overflow-auto">
                <table className="w-full text-[9px] md:text-[10px] text-left min-w-[520px]">
                  <thead className="sticky top-0 bg-slate-100 text-slate-600 font-black uppercase tracking-tighter">
                    <tr>
                      <th className="py-1.5 px-2">#</th>
                      <th className="py-1.5 px-2">Creator</th>
                      <th className="py-1.5 px-2">Pltf</th>
                      <th className="py-1.5 px-2 tabular-nums">Views</th>
                      <th className="py-1.5 px-2 tabular-nums">Lkes</th>
                      <th className="py-1.5 px-2 tabular-nums">Cmts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {((reportDataStudio?.report_table || []).slice(0, 14)).length ? (
                      ((reportDataStudio?.report_table || []).slice(0, 14)).map((r, idx) => (
                        <tr key={`tbl-${idx}`} className="hover:bg-slate-50">
                          <td className="py-1 px-2 text-slate-500">{r.rank || idx + 1}</td>
                          <td className="py-1 px-2 font-semibold text-slate-900 truncate max-w-[140px]">{r.creator || '-'}</td>
                          <td className="py-1 px-2 text-slate-600 truncate max-w-[64px]">{r.platform || '-'}</td>
                          <td className="py-1 px-2 tabular-nums text-cyan-900">{fmt(r.views)}</td>
                          <td className="py-1 px-2 tabular-nums">{fmt(r.likes)}</td>
                          <td className="py-1 px-2 tabular-nums">{fmt(r.comments)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-500 text-xs">
                          표 데이터가 없거나 상위 카드 참고 바랍니다.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="w-full md:w-44 shrink-0 flex flex-col gap-1 overflow-hidden rounded-xl border border-slate-100 bg-slate-50/80 p-2">
                <p className="text-[10px] font-black text-slate-700 uppercase shrink-0">유저(bio) 특성</p>
                <div className="flex-1 min-h-0 space-y-1 overflow-hidden">
                  {userCharacteristicNotes.map((note) => (
                    <div key={note.label} className="rounded-lg bg-white border border-slate-100 px-2 py-1">
                      <p className="text-[10px] font-bold text-slate-900 flex justify-between gap-1 tabular-nums">
                        <span className="truncate">{note.label}</span>
                        <span>{fmt(note.value)}</span>
                      </p>
                      <p className="text-[9px] text-slate-500 leading-snug line-clamp-2 mt-0.5">{note.help}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </SlideFrame>
        </div>

        <div className="min-w-0" data-slide-item>
          <SlideFrame title="댓글 정량 · 핵심 강점" eyebrow="Why this matters">
            <div className="flex-1 min-h-0 grid md:grid-cols-5 gap-3 overflow-hidden">
              <div className="md:col-span-2 rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-2 overflow-hidden shrink-0">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-600 shrink-0">정량 버킷</p>
                <div className="space-y-2 text-[10px] max-h-[32vh] overflow-hidden">
                  <div className="flex justify-between bg-white rounded-md border px-2 py-1 font-semibold text-slate-800">
                    <span>총 댓글</span>
                    <span className="tabular-nums">{fmt(quantSummary.total_comments || reportSummary.total_comments)}</span>
                  </div>
                  <div className="flex justify-between bg-white rounded-md border px-2 py-1 font-semibold text-slate-800">
                    <span>댓글 좋아요</span>
                    <span className="tabular-nums">{fmt(quantSummary.total_comment_likes || reportSummary.total_comment_likes)}</span>
                  </div>
                  <div className="flex justify-between bg-white rounded-md border px-2 py-1 font-semibold text-slate-800">
                    <span>바이럴 신호%</span>
                    <span className="tabular-nums">{pct(quantSummary.viral_signal_pct || reportSummary.viral_signal_pct)}</span>
                  </div>
                  <div className="flex justify-between bg-white rounded-md border px-2 py-1 font-semibold text-slate-800">
                    <span>구매의향%</span>
                    <span className="tabular-nums">{pct(quantSummary.purchase_intent_pct || reportSummary.purchase_intent_pct)}</span>
                  </div>
                </div>
              </div>
              <div className="md:col-span-3 rounded-xl border border-cyan-200 bg-cyan-50/70 p-3 flex flex-col min-h-0 overflow-hidden">
                <p className="text-[10px] font-black text-cyan-900 uppercase shrink-0">핵심 메시지</p>
                <ul className="mt-2 space-y-2 flex-1 min-h-0 overflow-hidden">
                  {(qualitativeSummary.length > 0 ? qualitativeSummary : [
                    '긍정/중립 비중이 높아 전반적인 제품 수용도가 양호합니다.',
                    '구매처·가격 문의 비중이 존재하여 전환형 CTA 강화 여지가 있습니다.',
                  ]).slice(0, 4).map((x, idx) => (
                    <li key={`qual-${idx}`} className={`rounded-lg border border-white/80 bg-gradient-to-r ${keyStatementClass[idx % keyStatementClass.length]} px-3 py-2`}>
                      <p className="text-[11px] text-slate-900 font-semibold leading-snug line-clamp-4">{typeof x === 'string' ? x : JSON.stringify(x)}</p>
                    </li>
                  ))}
                </ul>
                {commentExampleSnippets.length ? (
                  <div className="mt-3 border-t border-cyan-200/60 pt-2 shrink-0">
                    <p className="text-[9px] font-black uppercase text-slate-500 mb-1">예시 댓글</p>
                    <div className="flex gap-2 overflow-hidden">
                      {commentExampleSnippets.slice(0, 2).map((text, idx) => (
                        <blockquote key={`ce-${idx}`} className="flex-1 min-w-0 text-[10px] text-slate-800 italic border border-cyan-100 bg-white rounded-md px-2 py-1.5 leading-snug line-clamp-3">
                          “{text}”
                        </blockquote>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </SlideFrame>
        </div>

        <div className="min-w-0" data-slide-item>
          <SlideFrame title="토픽 매트릭스" eyebrow="Comment themes · evidence">
            <div className="flex-1 min-h-0 space-y-2 overflow-hidden">
              {topicMatrix.slice(0, 3).length ? (
                topicMatrix.slice(0, 3).map((row, idx) => (
                  <div key={`tm-${idx}`} className="rounded-xl border border-slate-100 bg-white p-2.5 shrink-0">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      <span className="text-xs font-black text-slate-900 truncate max-w-[60%]">{row.topic}</span>
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-fuchsia-50 border border-fuchsia-200 font-bold text-fuchsia-900">{row.intensity}</span>
                    </div>
                    <p className="text-[10px] text-slate-700 leading-snug line-clamp-2"><strong className="text-slate-900">Insight:</strong> {row.insight}</p>
                    <div className="mt-1 flex flex-wrap gap-1 overflow-hidden max-h-[4.25rem]">
                      {(row.evidence || []).slice(0, 5).map((e, eIdx) => (
                        <span key={`ev-${eIdx}`} className="text-[9px] px-1.5 py-0.5 rounded-md bg-slate-50 border border-slate-100 truncate max-w-full">{e}</span>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500 pt-16 text-center">토픽 매트릭스 데이터 없음.</p>
              )}
            </div>
          </SlideFrame>
        </div>

        <div className="min-w-0" data-slide-item>
          <SlideFrame title="심층 분석 · 전략" eyebrow="Notion synthesis">
            <div className="flex-1 min-h-0 overflow-hidden flex flex-col gap-3 text-[11px]">
              <div className="grid md:grid-cols-3 gap-2 shrink-0">
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-2 md:col-span-1 overflow-hidden leading-snug">
                  <p className="font-black text-[10px] uppercase text-slate-600 mb-1">감정</p>
                  <p className="text-[10px] text-slate-800">
                    긍정 {pct(reportNotion?.sentiment_analysis?.positive_pct || reportSummary.positive_pct)} ·
                    부정 {pct(reportNotion?.sentiment_analysis?.negative_pct || reportSummary.negative_pct)}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1 max-h-[3.25rem] overflow-hidden">
                    {sentimentKeywords.slice(0, 5).map((k, ki) => (
                      <span key={`sk-${ki}`} className="text-[9px] px-1.5 py-0.5 rounded bg-white border">{k.keyword}:{fmt(k.mentions)}</span>
                    ))}
                  </div>
                </div>
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-2 md:col-span-2 leading-snug max-h-[32vh] overflow-hidden">
                  <p className="font-black text-[10px] uppercase text-slate-600 mb-1">핵심 인사이트</p>
                  {insightStatements[0] ? (
                    <p className="text-xs font-black text-indigo-950 leading-snug line-clamp-4">{insightStatements[0]}</p>
                  ) : (
                    <p className="text-[10px] text-slate-600">등록 없음.</p>
                  )}
                </div>
              </div>
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3 flex-1 min-h-0 overflow-hidden">
                <p className="text-[10px] font-black text-emerald-900 uppercase shrink-0">전략 · 페르소나</p>
                <div className="mt-2 grid md:grid-cols-3 gap-2 overflow-hidden auto-rows-fr">
                  {strategySummaryList.slice(0, 3).map((x, idx) => (
                    <div key={`ss-${idx}`} className="rounded-lg border border-emerald-100 bg-white px-2 py-1.5 text-[10px] text-slate-800 leading-snug line-clamp-5 font-semibold">
                      {typeof x === 'string' ? x : ''}
                    </div>
                  ))}
                  {(strategySummaryList.length === 0) && insightStatements.slice(1, 4).map((x, idx) => (
                    <div key={`ins2-${idx}`} className="rounded-lg border border-slate-100 bg-white px-2 py-1.5 text-[10px] text-slate-800 leading-snug line-clamp-5">
                      {x}
                    </div>
                  ))}
                  {strategyAssetDirection.slice(0, 2).map((row, idx) => (
                    <div key={`sad-${idx}`} className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1">
                      <p className="text-[9px] font-black uppercase text-emerald-900 truncate">{row.asset}</p>
                      <p className="text-[10px] text-emerald-950 leading-snug line-clamp-3 mt-1">{row.direction}</p>
                    </div>
                  ))}
                  {(userPersonas.length ? userPersonas : []).slice(0, 1).map((p, pi) => (
                    <div key={`per-${pi}`} className="rounded-lg border border-indigo-100 bg-white px-2 py-1.5 md:col-span-3">
                      <p className="text-[10px] font-black mb-1 text-indigo-900">{p.title}</p>
                      <p className="text-[10px] text-slate-700 leading-snug line-clamp-3">{p.analysis}</p>
                    </div>
                  ))}
                  {!strategySummaryList.length && !userPersonas.length && !strategyAssetDirection.length && insightStatements.length <= 1 && (
                    <p className="text-[11px] text-slate-600 col-span-full">추가 전략 카드 데이터가 들어오면 이 페이지가 더 풍성해집니다.</p>
                  )}
                </div>
              </div>
              {langMarketMatrix.length ? (
                <div className="rounded-lg border border-slate-100 overflow-hidden shrink-0 max-h-[22vh]">
                  <table className="w-full text-[10px]">
                    <thead className="bg-slate-100 text-slate-600 font-bold">
                      <tr>
                        <th className="text-left py-1 px-2">언어</th>
                        <th className="text-left px-2">비중</th>
                        <th className="text-left px-2">가능성</th>
                      </tr>
                    </thead>
                    <tbody>
                      {langMarketMatrix.slice(0, 4).map((row, mi) => (
                        <tr key={`lm-${mi}`} className="border-t border-slate-100">
                          <td className="py-1 px-2 font-semibold text-slate-900 truncate max-w-[100px]">{row.language}</td>
                          <td className="px-2 text-cyan-900 font-black">{row.ratio}</td>
                          <td className="px-2 text-[10px] text-slate-700 line-clamp-2">{row.market_potential}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </div>
          </SlideFrame>
        </div>
      </div>
      </div>
      <style>{`
        .scrollbar-thin::-webkit-scrollbar { height: 8px; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 999px; }
      `}</style>
    </div>
  );
}
