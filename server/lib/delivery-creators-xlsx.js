/**
 * 납품 엑셀 → admin_delivery_creators INSERT용 행
 * scripts/import-farmskin-excel.js / import-welcos-excel.js 와 동일 매핑 규칙
 */
import XLSX from 'xlsx';

function pickCell(row, ...wantedKeys) {
  for (const k of wantedKeys) {
    if (row[k] != null && String(row[k]).trim() !== '') return row[k];
  }
  const norm = (s) => String(s).toLowerCase().replace(/\s+/g, ' ').trim();
  const rowEntries = Object.entries(row);
  for (const want of wantedKeys) {
    const w = norm(want);
    const hit = rowEntries.find(([key]) => norm(key) === w);
    if (hit && hit[1] != null && String(hit[1]).trim() !== '') return hit[1];
  }
  return null;
}

function trimCell(v) {
  if (v == null) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
}

/** 한 셀에 `...?lang=eshttps://...` 처럼 URL이 붙은 경우 분리 */
function splitHttpsChunks(s) {
  if (s == null || s === '') return [];
  return String(s)
    .split(/(?=https:\/\/)/i)
    .map((x) => x.trim())
    .filter(Boolean);
}

function postingTiktokFromRow(row) {
  const raw = pickCell(
    row,
    'Posting URL (TT)',
    'Posting URL(TT)',
    'posting_url_tt',
    'Posting URL TT',
    'posting_tiktok_url',
  );
  if (raw == null || String(raw).trim() === '' || String(raw).trim() === '-') return null;
  const chunks = splitHttpsChunks(raw);
  if (chunks.length === 0) return trimCell(raw);
  const hit = chunks.find((u) => /tiktok\.com|vt\.tiktok\.com/i.test(u));
  return trimCell(hit || chunks[0]);
}

function postingInstagramFromRow(row) {
  const raw = pickCell(
    row,
    'Posting URL (IG)',
    'Posting URL(IG)',
    'posting_url_ig',
    'Posting URL IG',
    'posting_instagram_url',
  );
  if (raw == null || String(raw).trim() === '' || String(raw).trim() === '-') return null;
  const chunks = splitHttpsChunks(raw);
  if (chunks.length === 0) return trimCell(raw);
  const hit = chunks.find((u) => /instagram\.com/i.test(u));
  return trimCell(hit || chunks[0]);
}

function metricCell(row, ...keys) {
  const v = pickCell(row, ...keys);
  if (v == null || v === '') return null;
  const s = String(v).trim();
  if (s === '' || s === '-') return null;
  return s;
}

/**
 * @param {Buffer|Uint8Array} buffer
 * @param {{ sheetIndex?: number }} [opts]
 * @returns {{ ok: true, rows: object[], sheetName: string, rawCount: number } | { ok: false, error: string }}
 */
export function parseDeliveryCreatorsWorkbook(buffer, opts = {}) {
  let wb;
  try {
    wb = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  } catch (e) {
    return { ok: false, error: `엑셀을 읽을 수 없습니다: ${e?.message || e}` };
  }
  const names = wb.SheetNames || [];
  if (names.length === 0) return { ok: false, error: '시트가 없습니다.' };
  const idx = Number.isInteger(opts.sheetIndex) ? opts.sheetIndex : 0;
  const sheetName = names[idx] || names[0];
  const ws = wb.Sheets[sheetName];
  if (!ws) return { ok: false, error: '첫 시트를 찾을 수 없습니다.' };

  const jsonRows = XLSX.utils.sheet_to_json(ws, { defval: '' });
  const rawCount = jsonRows.length;

  const rows = [];
  for (const row of jsonRows) {
    const name = pickCell(row, 'name', 'Name');
    if (!name || String(name).trim() === '') continue;

    const shippingCountry =
      trimCell(pickCell(row, 'Shipping country', 'Shipping Country', 'shipping country')) || '';
    const tiktokUrl = trimCell(
      pickCell(row, 'Tiktok_URL', 'TikTok_URL', 'tiktok_url', 'Tiktok URL', 'TikTok URL'),
    );
    const tiktokFollowerRaw = pickCell(
      row,
      'Tiktok_Follower',
      'TikTok_Follower',
      'tiktok_follower',
      'Tiktok Follower',
    );
    const instagramUrl = trimCell(
      pickCell(row, 'Instagram_URL', 'instagram_url', 'Instagram URL', 'Instagram url'),
    );
    const instagramFollowerRaw = pickCell(
      row,
      'Instagram_Follower',
      'instagram_follower',
      'Instagram Follower',
    );
    const visitDateRaw = pickCell(row, 'visit date', 'Visit Date', 'visit_date', 'Visit date', 'VISIT DATE');

    const tiktokFollower =
      tiktokFollowerRaw != null && String(tiktokFollowerRaw).trim() !== ''
        ? String(tiktokFollowerRaw).trim()
        : null;
    const instagramFollower =
      instagramFollowerRaw != null && String(instagramFollowerRaw).trim() !== ''
        ? String(instagramFollowerRaw).trim()
        : null;
    const visit_date =
      visitDateRaw != null && String(visitDateRaw).trim() !== '' ? String(visitDateRaw).trim() : null;

    const posting_tiktok_url = postingTiktokFromRow(row);
    const posting_instagram_url = postingInstagramFromRow(row);
    const metric_views = metricCell(row, 'Views', 'views');
    const metric_likes = metricCell(row, 'Likes♥', 'Likes', 'likes');
    const metric_comments = metricCell(row, 'Comments', 'comments');
    const metric_saves = metricCell(row, 'Saves', 'saves');
    const metric_shares = metricCell(row, 'share', 'Share', 'shares', 'Shares');
    const companion_info = metricCell(row, '동반자 정보', 'companion_info', 'Companion', '동반자');
    const spark_ads = metricCell(row, 'spark ads', 'Spark ads', 'Spark Ads', 'spark_ads');

    rows.push({
      name: String(name).trim(),
      shipping_country: shippingCountry || null,
      tiktok_url: tiktokUrl,
      tiktok_follower: tiktokFollower,
      instagram_url: instagramUrl,
      instagram_follower: instagramFollower,
      visit_date,
      posting_tiktok_url,
      posting_instagram_url,
      metric_views,
      metric_likes,
      metric_comments,
      metric_saves,
      metric_shares,
      companion_info,
      spark_ads,
    });
  }

  return { ok: true, rows, sheetName, rawCount };
}

/**
 * DB insert 행 (list_slug 주입 전)
 * @param {string} listSlug DB NOT NULL 대응용 풀 키(레거시·캠페인 모드 모두)
 * @param {{ campaignId?: string }} [opts] campaign_id 가 있으면 해당 캠페인에만 귀속
 */
export function toDbInsertRows(parsedRows, listSlug, opts = {}) {
  const { campaignId, markReplacements } = opts;
  return parsedRows.map((r) => {
    const base = {
      list_slug: listSlug,
      name: r.name,
      shipping_country: r.shipping_country,
      tiktok_url: r.tiktok_url,
      tiktok_follower: r.tiktok_follower,
      instagram_url: r.instagram_url,
      instagram_follower: r.instagram_follower,
    };
    if (campaignId) base.campaign_id = campaignId;
    if (markReplacements) base.is_replacement = true;
    if (r.visit_date != null && String(r.visit_date).trim() !== '') {
      base.visit_date = r.visit_date;
    }
    if (r.posting_tiktok_url) base.posting_tiktok_url = r.posting_tiktok_url;
    if (r.posting_instagram_url) base.posting_instagram_url = r.posting_instagram_url;
    if (r.metric_views) base.metric_views = r.metric_views;
    if (r.metric_likes) base.metric_likes = r.metric_likes;
    if (r.metric_comments) base.metric_comments = r.metric_comments;
    if (r.metric_saves) base.metric_saves = r.metric_saves;
    if (r.metric_shares) base.metric_shares = r.metric_shares;
    if (r.companion_info) base.companion_info = r.companion_info;
    if (r.spark_ads) base.spark_ads = r.spark_ads;
    return base;
  });
}
