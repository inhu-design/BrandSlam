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

    rows.push({
      name: String(name).trim(),
      shipping_country: shippingCountry || null,
      tiktok_url: tiktokUrl,
      tiktok_follower: tiktokFollower,
      instagram_url: instagramUrl,
      instagram_follower: instagramFollower,
      visit_date,
    });
  }

  return { ok: true, rows, sheetName, rawCount };
}

/**
 * DB insert 행 (list_slug 주입 전)
 */
export function toDbInsertRows(parsedRows, listSlug) {
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
    if (r.visit_date != null && String(r.visit_date).trim() !== '') {
      base.visit_date = r.visit_date;
    }
    return base;
  });
}
