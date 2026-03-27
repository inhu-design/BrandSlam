/**
 * BS-MX-웰코스.xlsx → admin_delivery_creators (list_slug = BS-MX-WELCOS)
 *
 * 사용법:
 *   node scripts/import-welcos-excel.js "C:\Users\...\Downloads\BS-MX-웰코스.xlsx"
 *
 * 환경변수: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const LIST_SLUG = 'BS-MX-WELCOS';

function parseFollower(val) {
  if (val == null || val === '') return 0;
  const n = Number(val);
  if (!isNaN(n)) return n;
  const s = String(val).trim().toUpperCase();
  const match = s.match(/^([\d.]+)\s*([KMB])?$/);
  if (!match) return 0;
  let num = parseFloat(match[1]);
  const unit = match[2];
  if (unit === 'K') num *= 1000;
  else if (unit === 'M') num *= 1000000;
  else if (unit === 'B') num *= 1000000000;
  return Math.round(num);
}

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

function rowToRecord(row, idx) {
  const name = pickCell(row, 'name', 'Name') || '';
  const shippingCountry = trimCell(pickCell(row, 'Shipping country', 'Shipping Country', 'shipping country')) || '';
  const tiktokUrl = trimCell(pickCell(row, 'Tiktok_URL', 'TikTok_URL', 'tiktok_url', 'Tiktok URL', 'TikTok URL'));
  const tiktokFollowerRaw = pickCell(row, 'Tiktok_Follower', 'TikTok_Follower', 'tiktok_follower', 'Tiktok Follower');
  const instagramUrl = trimCell(pickCell(row, 'Instagram_URL', 'instagram_url', 'Instagram URL', 'Instagram url'));
  const instagramFollowerRaw = pickCell(row, 'Instagram_Follower', 'instagram_follower', 'Instagram Follower');
  const visitDateRaw = pickCell(row, 'visit date', 'Visit Date', 'visit_date', 'Visit date', 'VISIT DATE');

  const tiktokFollower =
    tiktokFollowerRaw != null && String(tiktokFollowerRaw).trim() !== '' ? String(tiktokFollowerRaw).trim() : null;
  const instagramFollower =
    instagramFollowerRaw != null && String(instagramFollowerRaw).trim() !== '' ? String(instagramFollowerRaw).trim() : null;
  const visit_date = visitDateRaw != null && String(visitDateRaw).trim() !== '' ? String(visitDateRaw).trim() : null;

  const ttCount = parseFollower(tiktokFollower);
  const igCount = parseFollower(instagramFollower);

  let platform;
  let snsUrl;
  let followers;
  if (ttCount > 0 && igCount > 0) {
    if (ttCount >= igCount) {
      platform = 'TikTok';
      snsUrl = tiktokUrl;
      followers = tiktokFollower;
    } else {
      platform = 'Instagram';
      snsUrl = instagramUrl;
      followers = instagramFollower;
    }
  } else if (ttCount > 0) {
    platform = 'TikTok';
    snsUrl = tiktokUrl;
    followers = tiktokFollower;
  } else if (igCount > 0) {
    platform = 'Instagram';
    snsUrl = instagramUrl;
    followers = instagramFollower;
  } else {
    platform = 'SNS';
    snsUrl = tiktokUrl || instagramUrl;
    followers = '0';
  }

  return {
    id: idx + 1,
    name,
    shipping_country: shippingCountry,
    tiktok_url: tiktokUrl,
    tiktok_follower: tiktokFollower,
    instagram_url: instagramUrl,
    instagram_follower: instagramFollower,
    visit_date,
    platform,
    handle: snsUrl || '-',
    followers: String(followers),
    location: shippingCountry,
    status: 'Pending Review',
    contact: '-',
  };
}

async function main() {
  const excelPath = process.argv[2] || join(__dirname, '../src/data/BS-MX-웰코스.xlsx');
  console.log('Reading:', excelPath);

  const wb = XLSX.readFile(excelPath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws);

  const records = rows
    .filter((r) => pickCell(r, 'name', 'Name'))
    .map((r, i) => rowToRecord(r, i));

  console.log(`Parsed ${records.length} creators`);

  const supabaseUrl = process.env.SUPABASE_URL || 'https://grlayjybcxrcaufnwysb.supabase.co';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceKey) {
    console.error('SUPABASE_SERVICE_ROLE_KEY 가 없습니다. Supabase에 업로드할 수 없습니다.');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceKey);
  const toInsert = records.map((r) => ({
    list_slug: LIST_SLUG,
    name: r.name,
    shipping_country: r.shipping_country,
    tiktok_url: r.tiktok_url,
    tiktok_follower: r.tiktok_follower,
    instagram_url: r.instagram_url,
    instagram_follower: r.instagram_follower,
    visit_date: r.visit_date,
  }));

  const { error: delErr } = await supabase.from('admin_delivery_creators').delete().eq('list_slug', LIST_SLUG);

  if (delErr) console.warn('Delete warning:', delErr.message);

  const { data, error } = await supabase.from('admin_delivery_creators').insert(toInsert).select('id');

  if (error) {
    console.error('Supabase insert error:', error);
    console.error('visit_date 컬럼이 없다면 supabase-migration-admin-delivery-visit-date.sql 을 실행했는지 확인하세요.');
    process.exit(1);
  }
  console.log(`Supabase: inserted ${data?.length ?? 0} rows (list_slug=${LIST_SLUG})`);
}

main().catch(console.error);
