import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const PERF_FILES = ['sheet1.csv', 'sheet2.csv', 'sheet3.csv', 'sheet4.csv'];
const COMMENT_FILES = ['sheet5.csv', 'sheet6.csv'];
const REPORT_EMAIL = 'cocostar@report.com';

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

function aggregateFromCsv(baseDir) {
  const rawPerf = [];
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
    for (const r of rows) {
      const ig = String(r[hIg] || '').trim();
      const tt = String(r[hTt] || '').trim();
      if (!ig && !tt) continue;
      rawPerf.push({
        name: String(r.name || '').trim() || 'Unknown',
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
  };
  summary.engagement_rate = summary.views
    ? Number((((summary.likes + summary.comments + summary.shares) / summary.views) * 100).toFixed(2))
    : 0;

  const creators = new Map();
  for (const p of posts) {
    if (!creators.has(p.name)) {
      creators.set(p.name, { name: p.name, views: 0, likes: 0, comments: 0, shares: 0, posts: 0, platforms: new Set() });
    }
    const c = creators.get(p.name);
    c.views += p.views;
    c.likes += p.likes;
    c.comments += p.comments;
    c.shares += p.shares;
    c.posts += 1;
    c.platforms.add(p.platform);
  }
  const topCreators = [...creators.values()]
    .map((c) => ({
      name: c.name,
      platform: [...c.platforms].sort().join('/'),
      views: c.views,
      likes: c.likes,
      comments: c.comments,
      shares: c.shares,
      posts: c.posts,
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 20);

  const topPosts = [...posts].sort((a, b) => b.views - a.views).slice(0, 40);

  const comments = [];
  for (const fn of COMMENT_FILES) {
    const full = path.join(baseDir, fn);
    const text = fs.readFileSync(full, 'utf8');
    const rows = parseCsv(text);
    if (!rows.length) continue;
    const headers = Object.keys(rows[0]);
    const hText = pickHeader(headers, ['text']);
    const hDigg = pickHeader(headers, ['digg']);
    const hReply = pickHeader(headers, ['reply']);
    const hLang = pickHeader(headers, ['language']);
    for (const r of rows) {
      const t = String(r[hText] || '').trim();
      if (!t) continue;
      comments.push({
        text: t.toLowerCase(),
        likes: toNum(r[hDigg]),
        replies: toNum(r[hReply]),
        lang: String(r[hLang] || '').trim().toLowerCase(),
      });
    }
  }

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
  for (const c of comments) {
    if (hasAny(c.text, posKw)) pos += 1;
    if (hasAny(c.text, negKw)) neg += 1;
    if (hasAny(c.text, buyKw)) buy += 1;
    if (hasAny(c.text, viralKw)) viral += 1;
    if (c.lang) langMap.set(c.lang, (langMap.get(c.lang) || 0) + 1);
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
  };

  return { summary, topCreators, topPosts, commentSummary };
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
  for (const fn of [...PERF_FILES, ...COMMENT_FILES]) {
    if (!fs.existsSync(path.join(baseDir, fn))) throw new Error(`Missing CSV: ${fn}`);
  }

  const agg = aggregateFromCsv(baseDir);
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
  const orderNumber = existing?.[0]?.order_number || `BS-COCOSTAR-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;

  const campaignRow = {
    user_id: userId,
    order_number: orderNumber,
    plan: 'Cocostar Report',
    status: 'COMPLETED',
    brand_name: 'KOCOSTAR',
    product_name: 'Cocostar Performance & Comment Report',
    customer_name: 'COCOSTAR',
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
    contactName: 'COCOSTAR Report Bot',
    contactEmail: REPORT_EMAIL,
    productName: 'Cocostar Completed Campaign Report',
    targetAudienceCountry: 'Global (US 중심)',
    guidelineStatus: 'completed',
    report_summary: {
      ...agg.summary,
      ...agg.commentSummary,
    },
    report_links: {
      notion: 'https://bald-cushion-d59.notion.site/KOCOSTAR-2-358192bcb5a78019837ced78eb5f3d9e',
      data_studio: 'https://datastudio.google.com/u/0/reporting/8f1fa90e-189d-4ab9-b685-5272221cf30d/page/H7prF',
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
    report_top_creators: agg.topCreators.slice(0, 10),
    report_top_posts: agg.topPosts.slice(0, 10),
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
  }, null, 2));
}

main().catch((e) => {
  console.error(e?.message || e);
  process.exit(1);
});
