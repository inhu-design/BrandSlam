/**
 * BS-US-FARMSKIN.xlsx → admin_delivery_creators + test-influencers.json
 * 
 * 사용법:
 *   node scripts/import-farmskin-excel.js "C:\Users\...\Downloads\BS-US-FARMSKIN.xlsx"
 * 
 * 환경변수: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (Supabase 업로드 시)
 * 없으면 JSON 파일만 생성합니다.
 */
import XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const LIST_SLUG = 'BS-US-FARMSKIN';

/** "11.5K", "1.2M" 등 파싱 → 숫자 */
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

/** 엑셀 행 → 표준 레코드 */
function rowToRecord(row, idx) {
  const name = row['name'] || row['Name'] || '';
  const shippingCountry = row['Shipping country'] || row['shipping country'] || row['Shipping Country'] || '';
  const tiktokUrl = row['Tiktok_URL'] || row['tiktok url'] || null;
  const tiktokFollower = row['Tiktok_Follower'] != null ? String(row['Tiktok_Follower']) : null;
  const instagramUrl = row['Instagram_URL'] || row['instagram url'] || null;
  const instagramFollower = row['Instagram_Follower'] != null ? String(row['Instagram_Follower']) : null;

  const ttCount = parseFollower(tiktokFollower);
  const igCount = parseFollower(instagramFollower);

  // 둘 다 있으면 팔로워 많은 쪽, 하나만 있으면 그쪽
  let platform, snsUrl, followers;
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
    // 표시용 (4필드)
    platform,
    handle: snsUrl || '-',
    followers: String(followers),
    location: shippingCountry,
    status: 'Pending Review',
    contact: '-',
  };
}

async function main() {
  const excelPath = process.argv[2] || join(__dirname, '../src/data/BS-US-FARMSKIN.xlsx');
  console.log('Reading:', excelPath);

  const wb = XLSX.readFile(excelPath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws);

  const records = rows
    .filter((r) => r['name'] || r['Name'])
    .map((r, i) => rowToRecord(r, i));

  console.log(`Parsed ${records.length} creators`);

  // 1) JSON 저장 (대시보드 fallback)
  const jsonPath = join(__dirname, '../src/data/test-influencers.json');
  const jsonData = records.map((r) => ({
    id: r.id,
    name: r.name,
    handle: r.handle,
    platform: r.platform,
    followers: r.followers,
    location: r.location,
    status: r.status,
    contact: r.contact,
  }));
  writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2), 'utf8');
  console.log('Written:', jsonPath);

  // 2) Supabase 업로드
  const supabaseUrl = process.env.SUPABASE_URL || 'https://grlayjybcxrcaufnwysb.supabase.co';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (serviceKey) {
    const supabase = createClient(supabaseUrl, serviceKey);
    const toInsert = records.map((r) => ({
      list_slug: LIST_SLUG,
      name: r.name,
      shipping_country: r.shipping_country,
      tiktok_url: r.tiktok_url,
      tiktok_follower: r.tiktok_follower,
      instagram_url: r.instagram_url,
      instagram_follower: r.instagram_follower,
    }));

    const { error: delErr } = await supabase
      .from('admin_delivery_creators')
      .delete()
      .eq('list_slug', LIST_SLUG);

    if (delErr) console.warn('Delete warning:', delErr.message);

    const { data, error } = await supabase.from('admin_delivery_creators').insert(toInsert).select('id');

    if (error) {
      console.error('Supabase insert error:', error);
      process.exit(1);
    }
    console.log(`Supabase: inserted ${data?.length ?? 0} rows into admin_delivery_creators`);
  } else {
    console.log('SUPABASE_SERVICE_ROLE_KEY 없음 → JSON만 생성. Supabase 업로드하려면 환경변수 설정.');
  }
}

main().catch(console.error);
