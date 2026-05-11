/**
 * 댓글 원문: 기본은 아래 공개 스프레드시트에서 CSV를 받아 옵니다(실행 환경이 인터넷에 연결돼 있어야 함).
 * 받기 실패 시 tmp_reports 폴더의 백업 CSV를 사용합니다.
 * 오프라인·로컬만: 환경변수 KOCOSTAR_COMMENTS_LOCAL_ONLY=1
 *
 * gid=496390458 → 우선 크롤, 폴백 tmp_reports/sheet5.csv
 * gid=481172263 → 우선 크롤, 폴백 tmp_reports/sheet6.csv
 */
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const PERF_FILES = ['sheet1.csv', 'sheet2.csv', 'sheet3.csv', 'sheet4.csv'];
const KOCOSTAR_SPREADSHEET_ID = '16KCVpfEvWS3ZPHMspHcodL_GChhMruB-O6k5RhZuk4Y';
/** 시트별 gid + 웹 실패 시 tmp_reports 폴더 내 백업 CSV */
const COMMENT_SHEET_TABS = [
  { gid: '496390458', fallbackCsv: 'sheet5.csv', label: 'TikTok 댓글 탭1' },
  { gid: '481172263', fallbackCsv: 'sheet6.csv', label: 'TikTok 댓글 탭2' },
];
/** 대시보드 2페이지에 실을 원문 JSON 상한(집계·감성 통계는 전체 댓글 기준 그대로) */
const MAX_COMMENT_SAMPLES_STORAGE = 220;
const REPORT_EMAIL = 'kocostar@report.com';

function loadEnvLocal() {
  const p = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(p)) return;
  const raw = fs.readFileSync(p, 'utf8');
  for (const line of raw.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i <= 0) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (process.env[k] === undefined) process.env[k] = v;
  }
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (!inQuotes && ch === ',') {
      row.push(cur);
      cur = '';
      continue;
    }
    if (!inQuotes && (ch === '\n' || ch === '\r')) {
      if (ch === '\r' && text[i + 1] === '\n') i += 1;
      row.push(cur);
      cur = '';
      if (row.some((x) => String(x).trim() !== '')) rows.push(row);
      row = [];
      continue;
    }
    cur += ch;
  }
  if (cur.length > 0 || row.length > 0) {
    row.push(cur);
    if (row.some((x) => String(x).trim() !== '')) rows.push(row);
  }
  if (rows.length === 0) return [];
  const header = rows[0].map((x) => String(x).trim());
  return rows.slice(1).map((vals) => {
    const out = {};
    for (let i = 0; i < header.length; i += 1) out[header[i]] = vals[i] ?? '';
    return out;
  });
}

function pickHeader(headers, candidates) {
  const low = headers.map((h) => String(h || '').toLowerCase());
  for (const c of candidates) {
    const idx = low.findIndex((h) => h.includes(c));
    if (idx >= 0) return headers[idx];
  }
  return null;
}

function toNum(v) {
  if (v == null) return 0;
  const s = String(v).trim().replaceAll(',', '').replaceAll(' ', '');
  if (!s) return 0;
  const m = s.match(/^([0-9]+(?:\.[0-9]+)?)([kmbKMB]?)$/);
  if (m) {
    let n = Number(m[1]) || 0;
    const u = m[2].toUpperCase();
    if (u === 'K') n *= 1000;
    else if (u === 'M') n *= 1000000;
    else if (u === 'B') n *= 1000000000;
    return Math.round(n);
  }
  const nums = s.match(/[0-9]+/g);
  return nums ? Number(nums.join('')) : 0;
}

function formatInt(n) {
  return Number(n || 0).toLocaleString('en-US');
}

/** 동일 인물 IG+TT 처리: 이름 정규 키(대소문자·양끝/연속 공백 무시) */
function normalizeCreatorKey(name) {
  return String(name || '').trim().replace(/\s+/g, ' ').toLowerCase();
}

async function loadCommentSheetCsv(baseDir, { gid, fallbackCsv, label }) {
  const full = path.join(baseDir, fallbackCsv);
  if (process.env.KOCOSTAR_COMMENTS_LOCAL_ONLY === '1') {
    if (!fs.existsSync(full)) throw new Error(`KOCOSTAR_COMMENTS_LOCAL_ONLY: 로컬 ${fallbackCsv} 없음`);
    return fs.readFileSync(full, 'utf8');
  }
  const exportUrl = `https://docs.google.com/spreadsheets/d/${KOCOSTAR_SPREADSHEET_ID}/export?format=csv&gid=${gid}`;
  try {
    const res = await fetch(exportUrl, {
      redirect: 'follow',
      headers: {
        Accept: 'text/csv,text/plain;q=0.9,*/*;q=0.8',
        'User-Agent': 'Mozilla/5.0 (compatible; BrandSlam-kocostar-import/1.0)',
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    if (/^\s*<!DOCTYPE\b/i.test(text) || /<html\s/i.test(text.slice(0, 400))) {
      throw new Error('HTML 응답(링크 접근 또는 시트 공개 설정 확인)');
    }
    if (text.trim().length < 40) throw new Error('응답이 비어 있음');
    console.log(`[comments] ✅ Google Sheets ${label} (gid=${gid}) ${(text.length / 1024).toFixed(1)} KB`);
    return text;
  } catch (err) {
    if (!fs.existsSync(full)) {
      throw new Error(`${label}: 웹 불러오기 실패 (${err.message}) — 백업 ${fallbackCsv}도 없습니다. 시트 공개 또는 CSV 내보내기로 tmp_reports에 두세요.`);
    }
    console.warn(`[comments] ⚠️ ${label}: 웹 실패 → 로컬 ${fallbackCsv} 사용 (${err.message})`);
    return fs.readFileSync(full, 'utf8');
  }
}

function appendCommentsFromCsvText(text, comments) {
  const rows = parseCsv(text);
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const hText = pickHeader(headers, ['text']);
  const hDigg = pickHeader(headers, ['digg', 'diggcount']);
  const hReply = pickHeader(headers, ['reply', 'replycomment']);
  const hLang = pickHeader(headers, ['language']);
  const hRegion = pickHeader(headers, ['region']);
  const hBio = pickHeader(headers, ['bio']);
  const hUid = pickHeader(headers, ['uniqueid', 'unique']);
  const hVideo = pickHeader(headers, ['videoweburl', 'video', 'url']);
  const hCreated = pickHeader(headers, ['createtimeiso', 'createtime', 'time']);
  if (!hText) {
    console.warn('[comments] CSV에 text 열이 없음, 건너뜀. 헤더:', headers.slice(0, 12));
    return;
  }
  for (const r of rows) {
    const raw = String(r[hText] || '').trim();
    if (!raw) continue;
    comments.push({
      text_norm: raw.toLowerCase(),
      display_text: raw,
      likes: toNum(r[hDigg]),
      replies: toNum(r[hReply]),
      lang: String(r[hLang] || '').trim().toLowerCase(),
      region: String(r[hRegion] || '').trim().toLowerCase(),
      bio: String(r[hBio] || '').trim().toLowerCase(),
      unique_id: hUid ? String(r[hUid] || '').trim() : '',
      video_url: hVideo ? String(r[hVideo] || '').trim() : '',
      created_at: hCreated ? String(r[hCreated] || '').trim() : '',
    });
  }
}

async function aggregateReportData(baseDir) {
  const rawPerf = [];
  const rawShipmentRows = [];
  for (const fn of PERF_FILES) {
    const full = path.join(baseDir, fn);
    const text = fs.readFileSync(full, 'utf8');
    const rows = parseCsv(text);
    if (!rows.length) continue;
    const headers = Object.keys(rows[0]);
    const hIg = pickHeader(headers, ['posting url (ig)']);
    const hTt = pickHeader(headers, ['posting url (tt)']);
    const hUp = pickHeader(headers, ['upload day']);
    const hViews = pickHeader(headers, ['views']);
    const hLikes = pickHeader(headers, ['likes']);
    const hComments = pickHeader(headers, ['comments']);
    const hShares = pickHeader(headers, ['share']);
    const hShipping = pickHeader(headers, ['shipping process', 'shipping']);
    const hDelivered = pickHeader(headers, ['delivered']);
    const hProduct = pickHeader(headers, ['product']);
    for (const r of rows) {
      const name = String(r.name || '').trim() || 'Unknown';
      const ig = String(r[hIg] || '').trim();
      const tt = String(r[hTt] || '').trim();
      const hasPosting = !!(ig || tt);
      const shippingValue = String(r[hShipping] || '').trim();
      const deliveredValue = String(r[hDelivered] || '').trim().toLowerCase();
      const shipped =
        !!shippingValue
        || ['true', 'yes', 'y', '완료', 'delivered', 'done'].includes(deliveredValue);
      const product = String(r[hProduct] || '').trim();

      rawShipmentRows.push({
        name,
        product,
        hasPosting,
        shipped,
      });

      if (!hasPosting) continue;
      rawPerf.push({
        name,
        product,
        ig,
        tt,
        upload_day: String(r[hUp] || '').trim(),
        views: toNum(r[hViews]),
        likes: toNum(r[hLikes]),
        comments: toNum(r[hComments]),
        shares: toNum(r[hShares]),
      });
    }
  }

  const posts = [];
  const seen = new Set();
  for (const r of rawPerf) {
    for (const [platform, url] of [['IG', r.ig], ['TT', r.tt]]) {
      if (!url) continue;
      const key = `${platform}|${url}`;
      if (seen.has(key)) continue;
      seen.add(key);
      posts.push({ ...r, platform, url });
    }
  }

  const summary = {
    posts: posts.length,
    ig_posts: posts.filter((p) => p.platform === 'IG').length,
    tt_posts: posts.filter((p) => p.platform === 'TT').length,
    views: posts.reduce((s, p) => s + p.views, 0),
    likes: posts.reduce((s, p) => s + p.likes, 0),
    comments: posts.reduce((s, p) => s + p.comments, 0),
    shares: posts.reduce((s, p) => s + p.shares, 0),
    max_single_view: posts.reduce((m, p) => Math.max(m, p.views), 0),
  };
  summary.engagement_rate = summary.views
    ? Number((((summary.likes + summary.comments + summary.shares) / summary.views) * 100).toFixed(2))
    : 0;

  const shippedCreators = new Set(rawShipmentRows.filter((r) => r.shipped).map((r) => normalizeCreatorKey(r.name)));
  const postedCreators = new Set(rawShipmentRows.filter((r) => r.hasPosting).map((r) => normalizeCreatorKey(r.name)));
  const rawReach = shippedCreators.size
    ? (postedCreators.size / shippedCreators.size) * 100
    : 0;
  summary.shipping_reach_rate = Number(Math.min(100, rawReach).toFixed(2));
  summary.shipped_creators = shippedCreators.size;
  summary.posted_creators = postedCreators.size;

  const creators = new Map();
  for (const p of posts) {
    const nk = normalizeCreatorKey(p.name) || '__missing__';
    const displayName = String(p.name || '').trim() || 'Unknown';
    if (!creators.has(nk)) {
      creators.set(nk, {
        displayName,
        views: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        posts: 0,
        platforms: new Set(),
      });
    }
    const c = creators.get(nk);
    if (displayName.length > c.displayName.length) c.displayName = displayName;
    c.views += p.views;
    c.likes += p.likes;
    c.comments += p.comments;
    c.shares += p.shares;
    c.posts += 1;
    c.platforms.add(p.platform);
  }
  const topCreators = [...creators.values()]
    .map((c) => ({
      name: c.displayName,
      platform: [...c.platforms].sort().join('/'),
      views: c.views,
      likes: c.likes,
      comments: c.comments,
      shares: c.shares,
      posts: c.posts,
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 20);

  /** 동일 크리에이터의 대표 게시글(조회 최고) 기준 업로드일·링크 — 표용 */
  const creatorBestPostByKey = new Map();
  for (const p of posts) {
    const nk = normalizeCreatorKey(p.name) || '__missing__';
    const prev = creatorBestPostByKey.get(nk);
    if (!prev || Number(p.views || 0) > Number(prev.views || 0)) creatorBestPostByKey.set(nk, p);
  }

  /** 인플루언서별 1행(플랫폼 합산) — 조회 많은 순 */
  const topPostsUniq = [];
  const seenNk = new Set();
  for (const p of [...posts].sort((a, b) => Number(b.views || 0) - Number(a.views || 0))) {
    const nk = normalizeCreatorKey(p.name) || '__missing__';
    if (seenNk.has(nk)) continue;
    seenNk.add(nk);
    const canonicalName = creators.get(nk)?.displayName || String(p.name || '').trim();
    topPostsUniq.push({ ...p, name: canonicalName });
  }
  const topPosts = topPostsUniq.slice(0, 60);

  const reportTable = topCreators.slice(0, 25).map((c, idx) => {
    const nk = normalizeCreatorKey(c.name) || '__missing__';
    const bp = creatorBestPostByKey.get(nk);
    return {
      rank: idx + 1,
      creator: c.name,
      platform: c.platform,
      upload_day: bp?.upload_day || '-',
      views: c.views,
      likes: c.likes,
      comments: c.comments,
      shares: c.shares,
      url: bp?.url ?? null,
    };
  });

  const comments = [];
  const commentCsvTexts = await Promise.all(
    COMMENT_SHEET_TABS.map((tab) => loadCommentSheetCsv(baseDir, tab)),
  );
  for (const csvText of commentCsvTexts) {
    appendCommentsFromCsvText(csvText, comments);
  }
  console.log(`[comments] 합계 ${comments.length}건 파싱 (저장 폼 표본 최대 ${MAX_COMMENT_SAMPLES_STORAGE}건)`);

  const posKw = ['love', 'amazing', 'good', 'great', 'need', 'want', 'beautiful', 'gorgeous', 'cute', 'glow', 'perfect', '좋', '짱'];
  const negKw = ['bad', 'hate', 'worse', 'awful', 'expensive', 'not good', 'terrible', 'ugly', '별로', '싫'];
  const buyKw = ['where to buy', 'where can i buy', 'how much', 'link', 'price', 'buy', 'cart', 'need this', 'i want this', '구매', '어디서'];
  const viralKw = ['tag', 'friend', 'share', 'send', 'my mom', 'my daughter', 'my wife', 'my husband', '친구'];
  const hasAny = (t, kws) => kws.some((k) => t.includes(k));

  let pos = 0;
  let neg = 0;
  let buy = 0;
  let viral = 0;
  const langMap = new Map();
  const regionMap = new Map();
  const userTrait = {
    creator_like: 0,
    shopper_like: 0,
    skincare_interest: 0,
  };
  const keywordBuckets = {
    lip_mask: ['lip mask', 'lipmask', 'lip', '입술'],
    clear_mask: ['clear mask', 'transparent', '투명'],
    glow: ['glow', 'glass skin', '글로우'],
    ingredients: ['collagen', 'glutathione', '성분'],
    packaging: ['packaging', 'case', 'cute', '패키징'],
    on_the_go: ['on the go', 'commute', '출근', '이동'],
  };
  const keywordCounts = Object.fromEntries(Object.keys(keywordBuckets).map((k) => [k, 0]));

  for (const c of comments) {
    const tn = c.text_norm || '';
    if (hasAny(tn, posKw)) pos += 1;
    if (hasAny(tn, negKw)) neg += 1;
    if (hasAny(tn, buyKw)) buy += 1;
    if (hasAny(tn, viralKw)) viral += 1;
    if (c.lang) langMap.set(c.lang, (langMap.get(c.lang) || 0) + 1);
    if (c.region) regionMap.set(c.region, (regionMap.get(c.region) || 0) + 1);

    const bio = c.bio || '';
    if (/(ugc|creator|influencer|content)/i.test(bio)) userTrait.creator_like += 1;
    if (/(shop|deal|coupon|save|sale)/i.test(bio)) userTrait.shopper_like += 1;
    if (/(skin|beauty|cosmetic|makeup|skincare)/i.test(bio)) userTrait.skincare_interest += 1;

    for (const [k, kws] of Object.entries(keywordBuckets)) {
      if (hasAny(tn, kws)) keywordCounts[k] += 1;
    }
  }
  const totalComments = comments.length || 1;
  const commentSummary = {
    total_comments: comments.length,
    total_comment_likes: comments.reduce((s, c) => s + c.likes, 0),
    total_comment_replies: comments.reduce((s, c) => s + c.replies, 0),
    positive_pct: Number(((pos / totalComments) * 100).toFixed(2)),
    negative_pct: Number(((neg / totalComments) * 100).toFixed(2)),
    neutral_pct: Number(Math.max(0, 100 - ((pos / totalComments) * 100) - ((neg / totalComments) * 100)).toFixed(2)),
    purchase_intent_pct: Number(((buy / totalComments) * 100).toFixed(2)),
    viral_signal_pct: Number(((viral / totalComments) * 100).toFixed(2)),
    top_languages: [...langMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8),
    top_regions: [...regionMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8),
  };

  const productSplit = new Map();
  for (const r of rawPerf) {
    const p = (r.product || '').toLowerCase();
    const bucket = p.includes('lip') ? 'lip_mask'
      : (p.includes('mask') || p.includes('face')) ? 'face_mask'
      : 'others';
    if (!productSplit.has(bucket)) productSplit.set(bucket, { views: 0, likes: 0, comments: 0, shares: 0, posts: 0 });
    const t = productSplit.get(bucket);
    t.views += r.views; t.likes += r.likes; t.comments += r.comments; t.shares += r.shares; t.posts += 1;
  }

  const keywordMentions = Object.entries(keywordCounts)
    .map(([k, v]) => ({ keyword: k, mentions: v }))
    .sort((a, b) => b.mentions - a.mentions);

  const dataStudioSections = {
    overview_cards: {
      posting_count: summary.posts,
      cumulative_views: summary.views,
      max_single_view: summary.max_single_view,
      shipping_reach_rate: summary.shipping_reach_rate,
    },
    report_table: reportTable,
    comment_quantitative_summary: {
      total_comments: commentSummary.total_comments,
      total_comment_likes: commentSummary.total_comment_likes,
      total_comment_replies: commentSummary.total_comment_replies,
      positive_pct: commentSummary.positive_pct,
      neutral_pct: commentSummary.neutral_pct,
      negative_pct: commentSummary.negative_pct,
      purchase_intent_pct: commentSummary.purchase_intent_pct,
      viral_signal_pct: commentSummary.viral_signal_pct,
    },
    comment_qualitative_summary: [
      `긍정 반응이 ${commentSummary.positive_pct}%로 우세하며 부정은 ${commentSummary.negative_pct}%로 매우 낮습니다.`,
      `구매 의향 신호는 ${commentSummary.purchase_intent_pct}%로, 구매 링크 노출 최적화 여지가 있습니다.`,
      `바이럴 신호는 ${commentSummary.viral_signal_pct}%로 리퍼럴/친구 태그 트리거를 강화할 수 있습니다.`,
    ],
    comment_topic_matrix: [
      {
        topic: '피부 표현 (광채/수분)',
        intensity: '높음',
        evidence: ['GlassSkin', 'so hydrating', 'glowing skin achieved'],
        insight: "제품의 소구점인 '수분감'과 '글래스 스킨'이 영상에서 설득력 있게 전달됨",
      },
      {
        topic: '축하/인맥 반응',
        intensity: '보통',
        evidence: ['Wowww congratss', 'just received mine today'],
        insight: '크리에이터 지인/동일 PR 패키지 기반 초기 인게이지먼트가 섞여 있음',
      },
      {
        topic: '질문/구매처 문의',
        intensity: '보통',
        evidence: ['where do I find this', 'Can you use it overnight?', 'does it work?'],
        insight: '전환 신호는 존재하나 구매처/사용법 안내 부족으로 마찰 발생',
      },
      {
        topic: '시각적 특징 (투명함)',
        intensity: '높음',
        evidence: ['literally invisible', 'First transparent mask I’ve seen'],
        insight: '투명 하이드로겔 자체가 숏폼의 강한 후킹 포인트로 작동',
      },
      {
        topic: '립 마스크',
        intensity: '매우 높음',
        evidence: ['What lip mask? I need asap', 'The lip mask container is adorable'],
        insight: '이번 캠페인의 히어로 제품으로 작동, 단독 구매 충동 유발',
      },
    ],
    keyword_mentions: keywordMentions,
    user_characteristics: {
      creator_like: userTrait.creator_like,
      shopper_like: userTrait.shopper_like,
      skincare_interest: userTrait.skincare_interest,
      top_languages: commentSummary.top_languages,
      top_regions: commentSummary.top_regions,
    },
    user_personas: [
      {
        title: 'PR 협찬 희망 나노/마이크로 크리에이터',
        traits: ['UGC Creator', 'DM for PR & collabs', 'Honest reviews', '비즈니스 이메일 적극 노출'],
        analysis: '구매 의사와 함께 브랜드 인지도 어필 및 리뷰 협업 니즈가 동반됨',
      },
      {
        title: 'K-뷰티 어필리에이트 활동군',
        traits: ['YesStyle', 'Stylevana', 'StyleKorean', '할인 코드 중심 바이오'],
        analysis: '해외 K-뷰티 전환 구조에 익숙해 트렌드 아이템 감지 속도가 빠름',
      },
      {
        title: '글로벌 뷰티 커뮤니티',
        traits: ['북미/유럽/중동 분포', '스킨케어 고관여', '나노 인플루언서 비중 높음'],
        analysis: '규모는 작아도 국가별 정밀 타겟 도달 효율이 높음',
      },
    ],
    data_driven_insights: [
      `누적 ${formatInt(summary.views)} 조회, 단일 최대 ${formatInt(summary.max_single_view)} 조회로 상위 콘텐츠 편차가 큽니다.`,
      `배송 도달 대비 포스팅 도달률은 ${summary.shipping_reach_rate.toFixed(2)}%입니다.`,
      `상위 10 크리에이터가 전체 노출의 큰 비중을 차지해 상위 풀 집중 운영이 효율적입니다.`,
      "립 마스크 용기 디자인 언급이 집중되어 기능성보다 '인스타그래머블 패키징'이 초기 바이럴을 견인합니다.",
      "투명 마스크 반응은 기존 불투명 시트팩 대비 신선함과 시각적 만족 포인트를 확인시켜 줍니다.",
      '구매처/사용법 질문 증가로 보아 구매 전환 직전 병목이 댓글/본문 CTA에서 발생합니다.',
    ],
    next_action_plan: [
      'Top 조회 포맷을 차기 시딩 가이드의 필수 레이아웃으로 고정',
      '구매 의향 댓글이 많은 포스트에 구매 링크/고정댓글 CTA 강화',
      '언어 상위권 국가 중심으로 로컬라이즈드 크리에이터 재모집',
      '저성과 포스팅은 썸네일·후킹 문구 A/B 테스트 후 확장',
      'Q&A 리플라이형 후속 영상으로 구매처/사용시간/피부타입 FAQ를 선제 해소',
    ],
  };

  const notionSections = {
    sentiment_analysis: {
      positive_pct: commentSummary.positive_pct,
      neutral_pct: commentSummary.neutral_pct,
      negative_pct: commentSummary.negative_pct,
      representative_keywords: keywordMentions.slice(0, 24),
    },
    product_reaction_comparison: {
      lip_mask: productSplit.get('lip_mask') || { views: 0, likes: 0, comments: 0, shares: 0, posts: 0 },
      face_mask: productSplit.get('face_mask') || { views: 0, likes: 0, comments: 0, shares: 0, posts: 0 },
      others: productSplit.get('others') || { views: 0, likes: 0, comments: 0, shares: 0, posts: 0 },
    },
    language_reaction_analysis: commentSummary.top_languages,
    language_market_matrix: [
      { language: '영어 (미국/영국)', ratio: '65%', reaction: '구매 의향, 글로우 효과', market_potential: '현재 주력' },
      { language: '스페인어 (중남미)', ratio: '20%', reaction: 'Necesito, Amoooo', market_potential: '확장 여지 큼' },
      { language: '필리핀어', ratio: '8%', reaction: 'Ganda, Try ko nga', market_potential: '동남아 잠재력' },
      { language: '프랑스어', ratio: '4%', reaction: 'Je le veux, Trop sympa', market_potential: '유럽 가능성' },
      { language: '기타', ratio: '3%', reaction: '네팔어/아랍어 등', market_potential: '추후 검토' },
    ],
    purchase_intent_signal_analysis: {
      purchase_intent_pct: commentSummary.purchase_intent_pct,
      prompt: '구매 링크/가격/구매처 질문성 코멘트 비중',
      high_intent_examples: ['Running to add to cart', 'Added to cart so fast', 'Where to buy?'],
      mid_intent_examples: ["I want to try this", "Curious to try it", "It's on my wishlist"],
      viral_examples: ['Tag a friend', 'My daughter is waiting for lip mask', 'Need this for husband/wife'],
    },
    viral_point_analysis: [
      { rank: 1, trigger: '립마스크 패키징', evidence: 'The case is adorable, So cute' },
      { rank: 2, trigger: '투명 마스크 신선함', evidence: 'Never seen a clear mask, So cool' },
      { rank: 3, trigger: '글로우 효과', evidence: 'Glass skin, The glow is insane' },
      { rank: 4, trigger: '이동 중 사용', evidence: 'On the go, Life hack' },
      { rank: 5, trigger: '성분 조합', evidence: 'Collagen + Glutathione combo' },
    ],
    content_format_hints: [
      '상위 조회 콘텐츠의 초반 3초 훅(제품 클로즈업/효과 강조) 유지',
      '전후 대비/사용 장면/패키징 클로즈업 포맷 우선',
      '짧은 CTA 문구(구매처/링크) 삽입 시 전환 효율 개선',
      '이동 중/출근길 착용 콘셉트 영상 확장',
      '립마스크 단독 언박싱 포맷 별도 운영',
      '성분 설명형 교육 콘텐츠를 혼합 편성',
    ],
    improvements_and_complements: [
      { problem: '구매처 안내 부족', evidence: 'Where to buy?', action: '링크 인 바이오 + 고정댓글 운영' },
      { problem: '사용시간 안내 부족', evidence: 'How long do you keep it on?', action: '콘텐츠 내 사용시간 명시' },
      { problem: '피부타입 안내 부족', evidence: 'Good for any skin type?', action: '민감성 피부 사용 가이드 강조' },
      { problem: '립마스크 단품 문의', evidence: 'Do you sell lip mask separately?', action: '단품 판매 여부 명확히 안내' },
      { problem: '남성 진입장벽', evidence: "My beard won't let it stick", action: '남성 타겟 별도 크리에이티브 테스트' },
    ],
    recruitment_strategy: [
      'Priority 1: 미국 뷰티 크리에이터(건성/민감성 + 립케어 관심층) 우선',
      'Priority 2: On-the-go 라이프스타일 크리에이터(출근길/이동 중 루틴) 확장',
      'Priority 3: 스페인어권 뷰티 크리에이터 비중 확대',
    ],
    strategy_summary: [
      `핵심 KPI는 ${formatInt(summary.views)} 조회 / ${formatInt(summary.likes)} 좋아요 / ${formatInt(summary.comments)} 댓글 / ${formatInt(summary.shares)} 공유`,
      `감성은 긍정 ${commentSummary.positive_pct}% 중심으로 브랜드 안전성이 높은 편`,
      '다음 사이클은 상위 콘텐츠 포맷 복제 + 구매 전환 CTA 강화에 집중',
      '핵심 바이럴 자산: 립마스크 패키징 + 투명 마스크 + 글로우 효과',
    ],
    strategy_asset_direction: [
      { asset: '립마스크 패키징', direction: '언박싱 + 케이스 클로즈업 필수 요청' },
      { asset: '투명 마스크 신선함', direction: '착용 순간 리액션 영상 강조' },
      { asset: '글로우 효과', direction: '비포/애프터 필수 포함 가이드라인 제공' },
    ],
  };

  const commentSamples = comments.slice(0, MAX_COMMENT_SAMPLES_STORAGE).map((c) => ({
    text: c.display_text,
    digg_count: c.likes,
    reply_comment_total: c.replies,
    unique_id: c.unique_id || null,
    video_url: c.video_url || null,
    created_at: c.created_at || null,
  }));

  return {
    summary,
    topCreators,
    topPosts,
    commentSamples,
    commentSummary,
    dataStudioSections,
    notionSections,
  };
}

async function resolveAuthUserIdByEmail(admin, email) {
  let page = 1;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(`listUsers failed: ${error.message}`);
    const users = data?.users || [];
    const hit = users.find((u) => String(u.email || '').toLowerCase() === email.toLowerCase());
    if (hit?.id) return hit.id;
    if (users.length < 200) break;
    page += 1;
    if (page > 50) break;
  }
  return null;
}

async function main() {
  loadEnvLocal();
  const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  if (!url || !serviceKey) throw new Error('SUPABASE_URL/VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');

  const baseDir = path.resolve(process.cwd(), 'tmp_reports');
  for (const fn of PERF_FILES) {
    if (!fs.existsSync(path.join(baseDir, fn))) throw new Error(`Missing CSV (성과용): ${fn}`);
  }

  const agg = await aggregateReportData(baseDir);
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  const userId = await resolveAuthUserIdByEmail(admin, REPORT_EMAIL);
  if (!userId) throw new Error(`Auth user not found: ${REPORT_EMAIL}`);

  const { data: existing } = await admin
    .from('campaigns')
    .select('id, order_number')
    .eq('customer_email', REPORT_EMAIL)
    .eq('brand_name', 'KOCOSTAR')
    .order('created_at', { ascending: false })
    .limit(1);

  let campaignId = existing?.[0]?.id || null;
  const now = new Date();
  let orderNumber =
    existing?.[0]?.order_number
    || `BS-KOCOSTAR-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  orderNumber = String(orderNumber).replace(/^BS-COCOSTAR/i, 'BS-KOCOSTAR');

  const campaignRow = {
    user_id: userId,
    order_number: orderNumber,
    plan: 'Kocostar Report',
    status: 'COMPLETED',
    brand_name: 'KOCOSTAR',
    product_name: 'Kocostar Performance & Comment Report',
    customer_name: 'KOCOSTAR',
    customer_email: REPORT_EMAIL,
    target_creators: agg.topCreators.length,
    matched_creators: agg.topCreators.length,
    content_count: agg.summary.posts,
    kpi_views: formatInt(agg.summary.views),
    kpi_likes: formatInt(agg.summary.likes),
    kpi_comments: `${formatInt(agg.summary.comments)} (긍정 ${agg.commentSummary.positive_pct}%)`,
    kpi_shares: `${formatInt(agg.summary.shares)} (구매의도 ${agg.commentSummary.purchase_intent_pct}%)`,
    plan_price: 0,
  };

  if (!campaignId) {
    const { data: created, error: insErr } = await admin.from('campaigns').insert([campaignRow]).select('id').single();
    if (insErr) throw new Error(`campaign insert failed: ${insErr.message}`);
    campaignId = created.id;
  } else {
    const { error: upErr } = await admin.from('campaigns').update(campaignRow).eq('id', campaignId);
    if (upErr) throw new Error(`campaign update failed: ${upErr.message}`);
  }

  await admin.from('creators').delete().eq('campaign_id', campaignId);
  await admin.from('contents').delete().eq('campaign_id', campaignId);

  const creatorRows = agg.topCreators.slice(0, 20).map((c) => ({
    campaign_id: campaignId,
    name: c.name,
    platform: c.platform,
    status: 'Uploaded',
    link: null,
    engagement: `${c.posts} posts · ${(c.views ? (((c.likes + c.comments + c.shares) / c.views) * 100).toFixed(2) : '0.00')}%`,
    views: formatInt(c.views),
  }));
  if (creatorRows.length > 0) {
    const { error: ce } = await admin.from('creators').insert(creatorRows);
    if (ce) throw new Error(`creators insert failed: ${ce.message}`);
  }

  const contentRows = agg.topPosts.slice(0, 40).map((p) => ({
    campaign_id: campaignId,
    thumbnail_url: null,
    views: formatInt(p.views),
    creator: `${p.name} (${p.platform})`,
  }));
  if (contentRows.length > 0) {
    const { error: coe } = await admin.from('contents').insert(contentRows);
    if (coe) throw new Error(`contents insert failed: ${coe.message}`);
  }

  const reportForm = {
    companyName: 'KOCOSTAR',
    contactName: 'KOCOSTAR Report Bot',
    contactEmail: REPORT_EMAIL,
    productName: 'Kocostar Completed Campaign Report',
    targetAudienceCountry: 'Global (US 중심)',
    guidelineStatus: 'completed',
    report_summary: {
      ...agg.summary,
      ...agg.commentSummary,
    },
    report_data_studio: agg.dataStudioSections,
    report_notion: agg.notionSections,
    report_links: {
      notion: 'https://bald-cushion-d59.notion.site/KOCOSTAR-2-358192bcb5a78019837ced78eb5f3d9e',
      data_studio: 'https://datastudio.google.com/u/0/reporting/8f1fa90e-189d-4ab9-b685-5272221cf30d/page/H7prF',
      data_studio_page2: 'https://datastudio.google.com/u/0/reporting/8f1fa90e-189d-4ab9-b685-5272221cf30d/page/p_giszr66c2d',
    },
    report_insights: [
      `총 ${formatInt(agg.summary.posts)}개 포스팅에서 ${formatInt(agg.summary.views)} 조회를 확보했습니다.`,
      `좋아요·댓글·공유 합산 참여율은 ${agg.summary.engagement_rate.toFixed(2)}%로 안정 구간입니다.`,
      `댓글 감성 비중은 긍정 ${agg.commentSummary.positive_pct}% / 부정 ${agg.commentSummary.negative_pct}%입니다.`,
      `구매의도 신호는 ${agg.commentSummary.purchase_intent_pct}%로 CTA 최적화 여지가 있습니다.`,
    ],
    report_actions: [
      '상위 조회 Top 포맷을 차기 가이드라인 템플릿으로 고정',
      '구매의도 댓글 발생 게시물에 링크 고정 및 랜딩 연결 강화',
      '반응 높은 언어권 중심으로 크리에이터 풀 재배치',
      '저성과 포스트는 썸네일/후킹 문구 A/B 테스트 권장',
    ],
    report_top_creators: agg.topCreators.slice(0, 12),
    report_top_posts: agg.topPosts.slice(0, 12),
    report_comment_samples: agg.commentSamples,
  };

  await admin.from('campaign_setup_submissions').delete().eq('campaign_id', campaignId);
  const { error: sErr } = await admin
    .from('campaign_setup_submissions')
    .insert([{ campaign_id: campaignId, user_id: userId, form_data: reportForm }]);
  if (sErr) {
    // already has setup rows is fine; do not fail hard
    console.warn('campaign_setup_submissions insert warn:', sErr.message);
  }

  const { error: rErr } = await admin
    .from('campaign_admin_settings')
    .upsert([{
      campaign_id: campaignId,
      notion_guideline_url: reportForm.report_links.notion,
      notion_guideline_title: 'KOCOSTAR 캠페인 리포트',
      notion_guideline_description: '댓글/성과 통합 분석 리포트',
      linked_list_slug: null,
      force_drop_complete_message: false,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    }], { onConflict: 'campaign_id' });
  if (rErr) {
    console.warn('campaign_admin_settings upsert warn:', rErr.message);
  }

  console.log(JSON.stringify({
    ok: true,
    campaign_id: campaignId,
    order_number: orderNumber,
    summary: agg.summary,
    comment_summary: agg.commentSummary,
    report_comment_samples_stored: agg.commentSamples.length,
  }, null, 2));
}

main().catch((e) => {
  console.error(e?.message || e);
  process.exit(1);
});
