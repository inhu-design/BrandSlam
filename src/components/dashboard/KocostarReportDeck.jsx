/**
 * 완료 캠페인용 KOCOSTAR 성과 리포트 — 한 뷰포트 단위 슬라이드(가로 네비, 세로 스크롤 최소화)
 */
import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, BarChart2 } from 'lucide-react';

const NAV_SLIDES = [
  { key: 'overview', label: '1. 개요 · 핵심 수치' },
  { key: 'comments-live-a', label: '2. 실제 TikTok 댓글 (1)' },
  { key: 'comments-live-b', label: '3. 실제 TikTok 댓글 (2)' },
  { key: 'daily', label: '4. 일별 조회 추이' },
  { key: 'sentiment', label: '5. 댓글 감성 · 반응 신호' },
  { key: 'creators', label: '6. 상위 크리에이터' },
  { key: 'insight-action', label: '7. 인사이트 · 추천 액션' },
  { key: 'best-posts-a', label: '8. 베스트 콘텐츠 (1)' },
  { key: 'best-posts-b', label: '9. 베스트 콘텐츠 (2)' },
  { key: 'metrics-keywords', label: '10. 성과 카드 · 키워드' },
  { key: 'table-personas', label: '11. 리포트 표 · 유저 특성' },
  { key: 'comments-core', label: '12. 댓글 정량 · 핵심 강점' },
  { key: 'topic-matrix', label: '13. 토픽 매트릭스' },
  { key: 'deep-strategy', label: '14. 심층 분석 · 전략' },
];

/** IG·TT 등 동일 인플루언서 이름 매칭(대소문자·양끝·연속 공백 무시) */
function normalizeCreatorKey(name) {
  const s = String(name ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
  return s || '__missing__';
}

/** 서버 레거시 행까지 합산: 동일 이름(정규 키) 1행, 플랫폼·지표 합류 */
function mergeReportRowsByCreator(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return [];
  const ingestPlatform = (set, plat) => {
    String(plat ?? '-')
      .split(/[/|,]+/)
      .map((x) => x.trim())
      .filter(Boolean)
      .forEach((p) => set.add(p));
  };
  const m = new Map();
  for (const r of rows) {
    const nk = normalizeCreatorKey(r?.creator ?? r?.name);
    if (nk === '__missing__') continue;
    let cur = m.get(nk);
    const label = String(r?.creator ?? r?.name ?? '-').trim() || '-';
    if (!cur) {
      cur = {
        creator: label,
        platformSet: new Set(),
        upload_day: r.upload_day || '-',
        views: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        url: r.url ?? null,
        _bestViews: -1,
      };
      ingestPlatform(cur.platformSet, r.platform);
      m.set(nk, cur);
    }
    if (label.length > cur.creator.length) cur.creator = label;
    ingestPlatform(cur.platformSet, r.platform);
    const v = Number(String(r.views ?? '').replace(/[^0-9.]/g, '')) || 0;
    cur.views += v;
    cur.likes += Number(String(r.likes ?? '').replace(/[^0-9.]/g, '')) || 0;
    cur.comments += Number(String(r.comments ?? '').replace(/[^0-9.]/g, '')) || 0;
    cur.shares += Number(String(r.shares ?? '').replace(/[^0-9.]/g, '')) || 0;
    if (v > cur._bestViews) {
      cur._bestViews = v;
      cur.upload_day = r.upload_day || cur.upload_day;
      cur.url = r.url ?? cur.url;
    }
  }
  return [...m.values()]
    .sort((a, b) => Number(b.views) - Number(a.views))
    .slice(0, 25)
    .map((row, idx) => ({
      rank: idx + 1,
      creator: row.creator,
      platform: [...row.platformSet].sort().join('/'),
      upload_day: row.upload_day,
      views: row.views,
      likes: row.likes,
      comments: row.comments,
      shares: row.shares,
      url: row.url,
    }));
}

/** 인플루언서별 대표 게시 1건(조회 순 첫 게시글)만 표시용 슬라이드에 노출 */
function dedupePostsByCreator(posts, parseViewsFn) {
  if (!Array.isArray(posts) || posts.length === 0) return [];
  const bestLabel = new Map();
  for (const p of posts) {
    const nk = normalizeCreatorKey(p?.name ?? p?.creator);
    const raw = String(p?.name ?? p?.creator ?? '').trim();
    if (nk === '__missing__') continue;
    const prev = bestLabel.get(nk) || '';
    if (raw.length > prev.length) bestLabel.set(nk, raw);
  }
  const sorted = [...posts].sort((a, b) => parseViewsFn(b?.views || 0) - parseViewsFn(a?.views || 0));
  const seen = new Set();
  const out = [];
  for (const p of sorted) {
    const nk = normalizeCreatorKey(p?.name ?? p?.creator);
    if (nk === '__missing__' || seen.has(nk)) continue;
    seen.add(nk);
    out.push({ ...p, name: bestLabel.get(nk) || p?.name });
  }
  return out.slice(0, 24);
}

function SlideFrame({ title, eyebrow, children }) {
  return (
    <div
      className="w-full max-w-none min-w-0 h-full snap-start snap-always flex flex-col rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_20px_50px_-24px_rgba(15,23,42,0.25)] overflow-hidden box-border"
      style={{ height: 'min(calc(100dvh - 13rem), 900px)', maxHeight: 'min(calc(100dvh - 13rem), 900px)' }}
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
      <div className="flex-1 min-h-0 flex flex-col p-4 md:p-5 overflow-y-auto overscroll-contain [scrollbar-width:thin] scrollbar-thin">{children}</div>
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
  const reportLinks = fd?.report_links && typeof fd.report_links === 'object' ? fd.report_links : {};
  const reportCommentSamplesRaw = Array.isArray(fd?.report_comment_samples) ? fd.report_comment_samples : [];

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
  const viralPoints = Array.isArray(reportNotion?.viral_point_analysis) ? reportNotion.viral_point_analysis : [];
  const improvementsList = Array.isArray(reportNotion?.improvements_and_complements) ? reportNotion.improvements_and_complements : [];
  const contentFormatHints = Array.isArray(reportNotion?.content_format_hints) ? reportNotion.content_format_hints : [];
  const recruitmentStrategy = Array.isArray(reportNotion?.recruitment_strategy) ? reportNotion.recruitment_strategy : [];
  const productReactionCmp = reportNotion?.product_reaction_comparison || null;
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

  const dedupedReportTopCreators = useMemo(() => [...reportTopCreators.reduce((acc, creator) => {
    const display = String(creator?.name ?? '-').trim();
    const nk = normalizeCreatorKey(creator?.name);
    const prev = acc.get(nk) || {
      name: display,
      platformSet: new Set(),
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      posts: 0,
    };
    if (display.length > prev.name.length && display !== '-') prev.name = display;
    String(creator?.platform ?? '-')
      .split(/[/|,]+/)
      .map((x) => x.trim())
      .filter(Boolean)
      .forEach((platform) => prev.platformSet.add(platform));
    prev.views += Number(creator?.views || 0);
    prev.likes += Number(creator?.likes || 0);
    prev.comments += Number(creator?.comments || 0);
    prev.shares += Number(creator?.shares || 0);
    prev.posts += Number(creator?.posts || 1);
    acc.set(nk, prev);
    return acc;
  }, new Map()).values()]
    .map((creator) => ({
      ...creator,
      platform: [...creator.platformSet].sort().join('/'),
    }))
    .sort((a, b) => b.views - a.views), [reportTopCreators]);

  const mergedReportTable = useMemo(() => mergeReportRowsByCreator(reportDataStudio?.report_table), [reportDataStudio?.report_table]);

  const mergedTopPosts = useMemo(() => dedupePostsByCreator(reportTopPosts, (v) => parseNum(v)), [reportTopPosts]);

  const commentExampleSnippets = useMemo(() => [...topicMatrix.flatMap((row) => Array.isArray(row?.evidence) ? row.evidence : []),
    ...highIntentExamples,
    ...midIntentExamples,
    ...viralExamples,
  ].filter(Boolean).slice(0, 180), [topicMatrix, highIntentExamples, midIntentExamples, viralExamples]);

  const reportCommentSamples = useMemo(() => {
    const norm = reportCommentSamplesRaw
      .map((row) => ({
        text: String(row?.text ?? row?.comment ?? '').trim(),
        digg_count: row?.digg_count ?? row?.diggCount ?? null,
        reply_comment_total: row?.reply_comment_total ?? row?.replyCommentTotal ?? null,
        unique_id: row?.unique_id ?? row?.uniqueId ?? null,
        video_url: row?.video_url ?? row?.videoWebUrl ?? null,
        created_at: row?.created_at ?? row?.createTimeISO ?? null,
      }))
      .filter((r) => r.text && !/^\[Sticker\]$/i.test(r.text.trim()));
    if (norm.length) return norm;
    return commentExampleSnippets.map((text) => ({
      text,
      digg_count: null,
      reply_comment_total: null,
      unique_id: null,
      video_url: null,
      created_at: null,
    }));
  }, [reportCommentSamplesRaw, commentExampleSnippets]);

  const commentStreamChunks = useMemo(() => {
    const n = reportCommentSamples.length;
    const mid = Math.ceil(n / 2);
    return [reportCommentSamples.slice(0, mid), reportCommentSamples.slice(mid)];
  }, [reportCommentSamples]);

  /** Notion 표기와 동일 순서로 라벨 */
  const productReactionRows = useMemo(() => {
    const p = productReactionCmp || {};
    return [
      { key: 'lip_mask', label: '립 마스크', blob: p.lip_mask },
      { key: 'face_mask', label: '페이스/시트', blob: p.face_mask },
      { key: 'others', label: '기타/혼합', blob: p.others },
    ].filter((r) => r.blob && typeof r.blob === 'object');
  }, [productReactionCmp]);

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

  const bestPostsChunks = useMemo(() => [mergedTopPosts.slice(0, 6), mergedTopPosts.slice(6, 12)], [mergedTopPosts]);

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
        Notion · Looker Studio와 동일한 지표와 댓글 원문을 카드별로 노출합니다. 각 슬라이드 안에서 세로 스크롤하면 나머지 내용까지 이어서 볼 수 있습니다.
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
            <div className="flex flex-col gap-3">
              {(reportLinks.notion || reportLinks.data_studio) ? (
                <div className="flex flex-wrap gap-2 shrink-0 rounded-xl border border-cyan-100 bg-cyan-50/60 p-3">
                  <span className="text-[10px] font-black uppercase tracking-wider text-cyan-900 w-full">원본 리포트 바로가기</span>
                  {reportLinks.notion ? (
                    <a href={reportLinks.notion} target="_blank" rel="noreferrer" className="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-white border border-cyan-200 text-indigo-800 hover:bg-cyan-50 no-underline">
                      Notion
                    </a>
                  ) : null}
                  {reportLinks.data_studio ? (
                    <a href={reportLinks.data_studio} target="_blank" rel="noreferrer" className="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-white border border-cyan-200 text-indigo-800 hover:bg-cyan-50 no-underline">
                      Looker Studio (1)
                    </a>
                  ) : null}
                  {reportLinks.data_studio_page2 ? (
                    <a href={reportLinks.data_studio_page2} target="_blank" rel="noreferrer" className="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-white border border-cyan-200 text-indigo-800 hover:bg-cyan-50 no-underline">
                      Looker Studio (2)
                    </a>
                  ) : null}
                </div>
              ) : null}
              <p className="text-xs md:text-sm text-slate-700 font-semibold leading-snug shrink-0">
                누적 <span className="text-cyan-700 font-black">{fmt(summaryViews)}</span> 조회 ·{' '}
                <span className="text-emerald-800 font-black">{fmt(summaryComments)}</span> 영상 단 댓글 ·{' '}
                수집·분석 <span className="text-indigo-800 font-black">{fmt(reportCommentSamples.length)}</span>건의 코멘트 원문 포함
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
              <div className="rounded-xl border border-fuchsia-100 bg-gradient-to-r from-fuchsia-50 via-indigo-50 to-cyan-50 p-3 flex flex-col min-h-[120px] max-h-[340px]">
                <p className="text-[10px] font-black uppercase tracking-widest text-fuchsia-800 shrink-0 mb-2">Looker 요약 블록 (data_driven_insights)</p>
                <ul className="space-y-2 overflow-y-auto flex-1 pr-1">
                  {(dataDrivenInsights.length > 0 ? dataDrivenInsights : defaultInsights).map((line, idx) => (
                    <li key={`dd-${idx}`} className="text-[11px] md:text-xs text-slate-800 leading-snug rounded-lg bg-white/80 border border-white/70 px-2.5 py-1.5">
                      {typeof line === 'string' ? line : JSON.stringify(line)}
                    </li>
                  ))}
                </ul>
              </div>
              {productReactionRows.length ? (
                <div className="rounded-xl border border-slate-100 bg-white p-3 shrink-0">
                  <p className="text-[10px] font-black uppercase text-slate-500 mb-2">제품 라인별 참여도 (표)</p>
                  <div className="grid sm:grid-cols-3 gap-2">
                    {productReactionRows.map((row) => (
                      <div key={row.key} className="rounded-lg border border-slate-100 bg-slate-50 px-2 py-1.5">
                        <p className="text-[10px] font-black text-slate-800">{row.label}</p>
                        <p className="text-[10px] text-slate-600 tabular-nums mt-1">뷰 {fmt(row.blob?.views)} · ♥ {fmt(row.blob?.likes)} · 댓 {fmt(row.blob?.comments)} · 공유 {fmt(row.blob?.shares)}</p>
                        <p className="text-[9px] text-slate-500 mt-0.5">{fmt(row.blob?.posts || 0)} posts</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </SlideFrame>
        </div>

        {commentStreamChunks.map((chunk, ci) => (
          <div className="min-w-0" data-slide-item key={`cstream-${ci}`}>
            <SlideFrame title={ci === 0 ? '실제 TikTok 댓글 (1)' : '실제 TikTok 댓글 (2)'} eyebrow="Comment verbatim · scraped feed">
              <div className="flex flex-col gap-3 min-h-0">
                <div className="rounded-lg border border-amber-200 bg-amber-50/70 px-3 py-2 shrink-0">
                  <p className="text-[11px] md:text-xs text-amber-950 font-bold leading-snug">
                    업계에서 차별점인 «댓글 원문·작성 계정 메타». 스프레드시트 원본과 동일한 텍스트이며 영상 링크로 바로 검증할 수 있습니다.
                  </p>
                  <p className="text-[10px] text-amber-900/90 mt-1">
                    노출 순서 ≈ 분석 원본 순서 상위 분할 · 총 {fmt(reportCommentSamples.length)}건
                  </p>
                </div>
                <div className="grid sm:grid-cols-2 gap-2 flex-1 min-h-0">
                  {chunk.length ? chunk.map((c, idx) => (
                    <div
                      key={`${ci}-${idx}-${String(c.unique_id || '')}-${c.text.slice(0, 12)}`}
                      className="rounded-xl border border-slate-100 bg-white p-2.5 shadow-sm flex flex-col gap-1 text-left min-h-[72px]"
                    >
                      <p className="text-[12px] md:text-[13px] text-slate-900 leading-snug whitespace-pre-wrap break-words">{c.text}</p>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-slate-500 mt-auto pt-2 border-t border-slate-50">
                        {c.unique_id ? (
                          <span className="font-mono text-slate-600 truncate max-w-[160px]" title={String(c.unique_id)}>@{String(c.unique_id)}</span>
                        ) : null}
                        {(c.digg_count != null && c.digg_count !== '') ? <span className="tabular-nums">♥ {fmt(Number(c.digg_count) || 0)}</span> : null}
                        {(c.reply_comment_total != null && c.reply_comment_total !== '') ? <span className="tabular-nums">↩ {fmt(Number(c.reply_comment_total) || 0)}</span> : null}
                        {c.video_url ? (
                          <a href={c.video_url} target="_blank" rel="noreferrer" className="text-cyan-700 font-black no-underline hover:underline">
                            TikTok 영상
                          </a>
                        ) : null}
                      </div>
                      {c.created_at ? (
                        <p className="text-[9px] text-slate-400 font-mono tabular-nums">{c.created_at}</p>
                      ) : null}
                    </div>
                  )) : (
                    <p className="col-span-full text-sm text-slate-500 py-16 text-center">댓글 샘이 비어 있습니다. CSV 임포트(npm 스크립트 import:kocostar-report)로 report_comment_samples를 채워 주세요.</p>
                  )}
                </div>
              </div>
            </SlideFrame>
          </div>
        ))}

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
          <SlideFrame title="댓글 감성 · 반응 신호" eyebrow="Audience signals · Notion + Studio">
            <div className="flex flex-col gap-4">
              <div className="grid md:grid-cols-2 gap-4 shrink-0">
                <div className="flex flex-col gap-3">
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
                <div className="flex flex-col gap-2">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-lg border border-slate-100 bg-slate-50 p-2">
                      <p className="text-[9px] text-slate-500 font-black uppercase tracking-wider">구매의도</p>
                      <p className="text-base font-black text-slate-900 tabular-nums">{pct(reportSummary.purchase_intent_pct)}</p>
                    </div>
                    <div className="rounded-lg border border-slate-100 bg-slate-50 p-2">
                      <p className="text-[9px] text-slate-500 font-black uppercase tracking-wider">바이럴 신호</p>
                      <p className="text-base font-black text-slate-900 tabular-nums">{pct(reportSummary.viral_signal_pct)}</p>
                    </div>
                    {quantSummary.feedback_pct != null ? (
                      <div className="rounded-lg border border-slate-100 bg-slate-50 p-2">
                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-wider">피드백</p>
                        <p className="text-base font-black text-slate-900 tabular-nums">{pct(quantSummary.feedback_pct)}</p>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/50 p-2">
                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider">피드백</p>
                        <p className="text-[11px] text-slate-500 leading-tight mt-1">Studio 지표 매핑 시 표시</p>
                      </div>
                    )}
                  </div>
                  {topLang.length ? (
                    <div className="flex flex-wrap gap-1.5 content-start">
                      <span className="text-[10px] font-black text-slate-500 uppercase w-full">언어</span>
                      {topLang.map(([lang, cnt]) => (
                        <span key={lang} className="text-[10px] px-2 py-1 rounded-full border border-slate-200 text-slate-700 bg-white font-semibold">
                          {String(lang).toUpperCase()} · {cnt}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400">언어 분포 데이터 없음.</p>
                  )}
                  {topRegions.length ? (
                    <div className="flex flex-wrap gap-1.5 content-start mt-2">
                      <span className="text-[10px] font-black text-slate-500 uppercase w-full">지역 신호</span>
                      {topRegions.slice(0, 12).map((entry, ri) => {
                        const lbl = Array.isArray(entry) ? entry[0] : (entry?.region ?? entry?.label ?? entry?.code ?? '?');
                        const cnt = Array.isArray(entry) ? entry[1] : (entry?.count ?? entry?.cnt);
                        const hasCnt = cnt !== undefined && cnt !== null && cnt !== '';
                        return (
                          <span key={`rg-${lbl}-${ri}`} className="text-[10px] px-2 py-1 rounded-full border border-violet-100 text-violet-900 bg-violet-50 font-semibold">
                            {String(lbl)}{hasCnt ? ` · ${cnt}` : ''}
                          </span>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              </div>
              {(qualitativeSummary.length > 0) && (
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 max-h-[28vh] overflow-y-auto">
                  <p className="text-[10px] font-black text-slate-600 uppercase shrink-0 mb-2">정성 요약 (Studio)</p>
                  <ul className="space-y-1">
                    {qualitativeSummary.map((x, i) => (
                      <li key={`qs-${i}`} className="text-[11px] text-slate-800 leading-snug">• {typeof x === 'string' ? x : JSON.stringify(x)}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="grid lg:grid-cols-2 gap-3 flex-1 min-h-0">
                <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3 min-h-[140px] max-h-[32vh] flex flex-col">
                  <p className="text-[10px] font-black uppercase text-indigo-900 shrink-0">구매·관심 코멘트 예시</p>
                  <div className="mt-2 space-y-2 overflow-y-auto flex-1">
                    {[...highIntentExamples, ...midIntentExamples].filter(Boolean).slice(0, 14).map((t, ti) => (
                      <blockquote key={`ie-${ti}`} className="text-[11px] text-indigo-950 leading-snug border-l-4 border-indigo-300 pl-2 py-0.5 bg-white/80 rounded-r-md whitespace-pre-wrap break-words">
                        {typeof t === 'string' ? t : JSON.stringify(t)}
                      </blockquote>
                    ))}
                    {![...highIntentExamples, ...midIntentExamples].length && (
                      <p className="text-[11px] text-slate-600">예시 문자열 미등록 (Notion 블록)</p>
                    )}
                  </div>
                </div>
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3 min-h-[140px] max-h-[32vh] flex flex-col">
                  <p className="text-[10px] font-black uppercase text-emerald-900 shrink-0">확산·태그 라인 예시</p>
                  <div className="mt-2 space-y-2 overflow-y-auto flex-1">
                    {(viralExamples || []).slice(0, 14).map((t, vi) => (
                      <blockquote key={`ve-${vi}`} className="text-[11px] text-emerald-950 leading-snug border-l-4 border-emerald-300 pl-2 py-0.5 bg-white/80 rounded-r-md whitespace-pre-wrap break-words">
                        {typeof t === 'string' ? t : JSON.stringify(t)}
                      </blockquote>
                    ))}
                  </div>
                </div>
              </div>
              {viralPoints.length ? (
                <div className="rounded-xl border border-fuchsia-100 bg-fuchsia-50/40 p-3 max-h-[24vh] overflow-y-auto shrink-0">
                  <p className="text-[10px] font-black uppercase text-fuchsia-900 mb-2">바이럴 트리거 (Notion)</p>
                  <ul className="space-y-1.5">
                    {viralPoints.map((v) => (
                      <li key={v.rank} className="text-[11px] text-slate-800">
                        <span className="font-black text-fuchsia-800 mr-2">{v.rank}.</span>
                        <span className="font-bold">{v.trigger}</span>
                        <span className="text-slate-600 text-[10px]"> — {Array.isArray(v.evidence) ? v.evidence.join(', ') : v.evidence}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <div className="rounded-lg border border-slate-200 bg-slate-900 text-slate-100 px-3 py-2 text-center text-[11px] font-bold shrink-0">
                상단 슬라이드 2~3에서는 스프레드시트 원문 댓글 전량을 카드 형태로 펼칩니다 →
              </div>
            </div>
          </SlideFrame>
        </div>

        <div className="min-w-0" data-slide-item>
          <SlideFrame title="상위 크리에이터" eyebrow={`Top performers · ${Math.min(dedupedReportTopCreators.length, 12)}명`}>
            <div className="rounded-xl border border-slate-100 max-h-[75vh] flex flex-col min-h-[200px]">
              <div className="grid grid-cols-12 gap-1 text-[10px] font-black text-slate-500 uppercase tracking-tighter px-3 py-2 bg-slate-50 border-b border-slate-100 shrink-0">
                <div className="col-span-1">#</div>
                <div className="col-span-5">이름</div>
                <div className="col-span-3">플랫폼</div>
                <div className="col-span-3 text-right">조회 · ER%</div>
              </div>
              <div className="divide-y divide-slate-100 overflow-y-auto flex-1 min-h-0">
                {(dedupedReportTopCreators.slice(0, 12)).map((c, idx) => {
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
            <div className="grid md:grid-cols-2 gap-4 gap-y-6">
              <div className="min-h-0 flex flex-col rounded-xl border border-slate-100 bg-slate-50/70 p-3 max-h-[72vh]">
                <p className="text-[10px] font-black uppercase text-slate-500 mb-2 shrink-0 tracking-wider">Insights</p>
                <ul className="space-y-2 overflow-y-auto flex-1 pr-1">
                  {(reportInsights.length > 0 ? reportInsights : defaultInsights).slice(0, 20).map((x, idx) => (
                    <li key={`ins-${idx}`} className="text-[11px] md:text-xs text-slate-800 leading-snug rounded-lg bg-white border border-slate-100 px-2 py-1.5">
                      {typeof x === 'string' ? x : JSON.stringify(x)}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="min-h-0 flex flex-col rounded-xl border border-cyan-100 bg-cyan-50/50 p-3 max-h-[72vh]">
                <p className="text-[10px] font-black uppercase text-cyan-800 mb-2 shrink-0 tracking-wider">Actions</p>
                <ul className="space-y-2 overflow-y-auto flex-1 pr-1">
                  {(reportActions.length > 0 ? reportActions : defaultActions).slice(0, 20).map((x, idx) => (
                    <li key={`act-${idx}`} className="text-[11px] md:text-xs text-slate-800 leading-snug rounded-lg bg-white border border-cyan-100/80 px-2 py-1.5">
                      {typeof x === 'string' ? x : JSON.stringify(x)}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="md:col-span-2 rounded-xl border border-slate-200 bg-white p-3 max-h-[36vh] flex flex-col">
                <p className="text-[10px] font-black uppercase text-slate-600 mb-2 shrink-0">다음 실행 제안 — next_action_plan (Studio)</p>
                <ul className="flex-1 overflow-y-auto space-y-1.5 list-decimal list-inside text-[11px] text-slate-800 leading-snug">
                  {(nextActionPlan.length ? nextActionPlan : []).map((ln, ix) => (
                    <li key={`nap-${ix}`}>{typeof ln === 'string' ? ln : JSON.stringify(ln)}</li>
                  ))}
                  {!nextActionPlan.length ? <li className="text-slate-500">등록 없음.</li> : null}
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
            <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/60 p-3 flex flex-col min-h-[120px] max-h-[480px]">
              <p className="text-[10px] font-black text-slate-600 uppercase mb-2 tracking-wider shrink-0">전체 키워드 멘션 (표)</p>
              <div className="space-y-1 overflow-y-auto flex-1">
                {(reportDataStudio?.keyword_mentions || []).length ? (
                  (reportDataStudio?.keyword_mentions || []).map((k, idx) => (
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
                    {(mergedReportTable.length) ? (
                      mergedReportTable.map((r, idx) => (
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
          <SlideFrame title="댓글 정량 · 핵심 강점" eyebrow="Why this matters · verbatims">
            <div className="flex flex-col gap-3">
              <div className="grid md:grid-cols-12 gap-3">
                <div className="md:col-span-4 rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-600 shrink-0">정량 버킷</p>
                  <div className="space-y-2 text-[11px]">
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
                <div className="md:col-span-8 rounded-xl border border-cyan-200 bg-cyan-50/70 p-3 flex flex-col max-h-[40vh] min-h-[120px]">
                  <p className="text-[10px] font-black text-cyan-900 uppercase shrink-0">핵심 메시지 (정성 블록)</p>
                  <ul className="mt-2 space-y-2 flex-1 overflow-y-auto pr-1">
                    {(qualitativeSummary.length > 0 ? qualitativeSummary : [
                      '긍정/중립 비중이 높아 전반적인 제품 수용도가 양호합니다.',
                      '구매처·가격 문의 비중이 존재하여 전환형 CTA 강화 여지가 있습니다.',
                    ]).slice(0, 12).map((x, idx) => (
                      <li key={`qual-${idx}`} className={`rounded-lg border border-white/80 bg-gradient-to-r ${keyStatementClass[idx % keyStatementClass.length]} px-3 py-2 shrink-0`}>
                        <p className="text-[11px] text-slate-900 font-semibold leading-snug whitespace-pre-wrap">{typeof x === 'string' ? x : JSON.stringify(x)}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3 flex flex-col min-h-[200px] max-h-[440px]">
                <div className="flex items-center justify-between gap-2 shrink-0 mb-2">
                  <p className="text-[10px] font-black uppercase text-slate-600">예시 댓글·근거 줄 (증거 카드 전체)</p>
                  <span className="text-[10px] text-slate-500 tabular-nums">{fmt(commentExampleSnippets.length)}건</span>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 overflow-y-auto flex-1 pr-1 content-start">
                  {commentExampleSnippets.map((text, idx) => (
                    <blockquote key={`cex-${idx}`} className="text-[11px] text-slate-800 italic border border-slate-100 bg-slate-50 rounded-lg px-2.5 py-2 leading-snug whitespace-pre-wrap break-words">
                      “{typeof text === 'string' ? text : JSON.stringify(text)}”
                    </blockquote>
                  ))}
                  {!commentExampleSnippets.length ? <p className="text-[12px] text-slate-500 col-span-full">예시 줄이 비어 있습니다.</p> : null}
                </div>
              </div>
            </div>
          </SlideFrame>
        </div>

        <div className="min-w-0" data-slide-item>
          <SlideFrame title="토픽 매트릭스" eyebrow="Comment themes · evidence">
            <div className="space-y-3">
              {topicMatrix.length ? (
                topicMatrix.map((row, idx) => (
                  <div key={`tm-${idx}`} className="rounded-xl border border-slate-100 bg-white p-3">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      <span className="text-xs font-black text-slate-900 truncate max-w-[70%]">{row.topic}</span>
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-fuchsia-50 border border-fuchsia-200 font-bold text-fuchsia-900">{row.intensity}</span>
                    </div>
                    <p className="text-[11px] text-slate-800 leading-snug"><strong className="text-slate-900">Insight:</strong> {row.insight}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {(row.evidence || []).map((e, eIdx) => (
                        <span key={`ev-${eIdx}`} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-50 border border-slate-100 max-w-full whitespace-pre-wrap break-words">{e}</span>
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
          <SlideFrame title="심층 분석 · 전략" eyebrow="Notion synthesis · full appendix">
            <div className="flex flex-col gap-3 text-[11px]">
              <div className="grid md:grid-cols-5 gap-2">
                <div className="md:col-span-2 rounded-lg border border-slate-100 bg-slate-50 p-3 flex flex-col min-h-[100px] max-h-[260px]">
                  <p className="font-black text-[10px] uppercase text-slate-600 mb-1 shrink-0">감정 레이블 · 대표 키워드</p>
                  <p className="text-[11px] text-slate-800 shrink-0">
                    긍정 {pct(reportNotion?.sentiment_analysis?.positive_pct || reportSummary.positive_pct)} ·
                    중립 {pct(reportNotion?.sentiment_analysis?.neutral_pct || reportSummary.neutral_pct)} ·
                    부정 {pct(reportNotion?.sentiment_analysis?.negative_pct || reportSummary.negative_pct)}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2 overflow-y-auto flex-1 content-start">
                    {sentimentKeywords.map((k, ki) => (
                      <span key={`sk-${ki}`} className="text-[10px] px-2 py-0.5 rounded bg-white border border-slate-200 leading-tight">{k.keyword}:{fmt(k.mentions)}</span>
                    ))}
                  </div>
                </div>
                <div className="md:col-span-3 rounded-lg border border-indigo-100 bg-indigo-50/60 p-3 max-h-[260px] flex flex-col">
                  <p className="font-black text-[10px] uppercase text-indigo-900 shrink-0">핵심 인사이트 전체</p>
                  <ul className="mt-2 space-y-2 overflow-y-auto flex-1 pr-1">
                    {(insightStatements.length ? insightStatements : defaultInsights).map((line, lx) => (
                      <li key={`is-${lx}`} className="text-[11px] text-indigo-950 font-semibold leading-snug whitespace-pre-wrap border-l-2 border-indigo-300 pl-2">
                        {typeof line === 'string' ? line : JSON.stringify(line)}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3 flex flex-col max-h-[240px] min-h-[100px]">
                <p className="text-[10px] font-black text-emerald-900 uppercase shrink-0">전략 요약 블록</p>
                <div className="mt-2 grid sm:grid-cols-2 gap-2 overflow-y-auto flex-1">
                  {(strategySummaryList.length ? strategySummaryList : []).map((x, idx) => (
                    <div key={`ssf-${idx}`} className="rounded-lg border border-emerald-100 bg-white px-2 py-1.5 text-[11px] text-slate-800 leading-snug font-semibold whitespace-pre-wrap">
                      {typeof x === 'string' ? x : ''}
                    </div>
                  ))}
                  {strategySummaryList.length === 0 && insightStatements.slice(0, 8).map((x, idx) => (
                    <div key={`isf-${idx}`} className="rounded-lg border border-slate-100 bg-white px-2 py-1.5 text-[11px] text-slate-800 leading-snug whitespace-pre-wrap">
                      {x}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid lg:grid-cols-3 gap-2">
                {strategyAssetDirection.map((row, idx) => (
                  <div key={`sadf-${idx}`} className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1.5 min-h-[72px]">
                    <p className="text-[10px] font-black uppercase text-emerald-900 whitespace-pre-wrap break-words">{row.asset}</p>
                    <p className="text-[11px] text-emerald-950 leading-snug mt-1 whitespace-pre-wrap">{row.direction}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-indigo-100 bg-white p-3 max-h-[240px] flex flex-col">
                <p className="text-[10px] font-black uppercase text-indigo-900 shrink-0">페르소나 / 오디언스</p>
                <div className="mt-2 space-y-2 overflow-y-auto flex-1">
                  {(userPersonas.length ? userPersonas : []).map((p, pi) => (
                    <div key={`upe-${pi}`} className="rounded-lg border border-indigo-100 bg-indigo-50/60 px-2 py-1.5">
                      <p className="text-[11px] font-black text-indigo-900">{p.title}</p>
                      {Array.isArray(p.traits) ? (
                        <p className="text-[10px] text-indigo-800 mt-0.5">{p.traits.join(' · ')}</p>
                      ) : null}
                      <p className="text-[11px] text-slate-800 leading-snug mt-1 whitespace-pre-wrap">{p.analysis}</p>
                    </div>
                  ))}
                </div>
              </div>

              {contentFormatHints.length ? (
                <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-3 max-h-[200px] flex flex-col">
                  <p className="text-[10px] font-black text-amber-900 uppercase shrink-0">콘텐츠 포맷 제안</p>
                  <ul className="mt-2 list-disc list-inside space-y-1 overflow-y-auto flex-1 text-[11px] text-amber-950">
                    {contentFormatHints.map((h, hi) => <li key={`cfh-${hi}`}>{h}</li>)}
                  </ul>
                </div>
              ) : null}

              {recruitmentStrategy.length ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 max-h-[180px] flex flex-col">
                  <p className="text-[10px] font-black text-slate-700 uppercase shrink-0">리크루팅 우선순위</p>
                  <ul className="mt-2 space-y-1 overflow-y-auto flex-1 list-decimal list-inside text-[11px] text-slate-900">
                    {recruitmentStrategy.map((r, ri) => <li key={`rs-${ri}`}>{r}</li>)}
                  </ul>
                </div>
              ) : null}

              {improvementsList.length ? (
                <div className="rounded-xl border border-rose-100 bg-rose-50/40 p-3 flex flex-col min-h-[120px] max-h-[340px]">
                  <p className="text-[10px] font-black text-rose-900 uppercase shrink-0">보완 액션 — 문제 / 증거 / 실행안</p>
                  <div className="overflow-x-auto mt-2 flex-1 rounded-lg border border-rose-100 bg-white">
                    <table className="w-full text-[10px] min-w-[560px] text-left">
                      <thead className="bg-rose-100/80 sticky top-0 text-rose-900 font-black uppercase">
                        <tr>
                          <th className="py-1.5 px-2 align-top max-w-[100px]">Issue</th>
                          <th className="py-1.5 px-2 align-top">증거 코멘트</th>
                          <th className="py-1.5 px-2 align-top">실행안</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-rose-100">
                        {improvementsList.map((row, im) => (
                          <tr key={`imp-${im}`}>
                            <td className="py-1 px-2 font-semibold text-slate-900 align-top">{row.problem}</td>
                            <td className="py-1 px-2 text-slate-700 align-top whitespace-pre-wrap">{row.evidence}</td>
                            <td className="py-1 px-2 text-rose-900 font-semibold align-top whitespace-pre-wrap">{row.action}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}

              {langMarketMatrix.length ? (
                <div className="rounded-lg border border-slate-100 overflow-hidden shrink-0 max-h-[220px] flex flex-col">
                  <table className="w-full text-[10px]">
                    <thead className="bg-slate-100 text-slate-600 font-bold shrink-0">
                      <tr>
                        <th className="text-left py-1 px-2">언어</th>
                        <th className="text-left px-2">비중</th>
                        <th className="text-left px-2">반응</th>
                        <th className="text-left px-2">가능성</th>
                      </tr>
                    </thead>
                  </table>
                  <div className="overflow-y-auto flex-1">
                    <table className="w-full text-[10px]">
                      <tbody>
                        {langMarketMatrix.map((row, mi) => (
                          <tr key={`lm-${mi}`} className="border-t border-slate-100">
                            <td className="py-1 px-2 font-semibold text-slate-900 truncate max-w-[140px] align-top">{row.language}</td>
                            <td className="py-1 px-2 text-cyan-900 font-black align-top whitespace-nowrap">{row.ratio}</td>
                            <td className="py-1 px-2 text-slate-700 align-top whitespace-pre-wrap">{row.reaction}</td>
                            <td className="py-1 px-2 text-slate-700 align-top whitespace-pre-wrap">{row.market_potential}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
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
