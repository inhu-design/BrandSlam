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

/** 엑셀 열 이름이 시트마다 조금 달라도 읽기 (공백·대소문자 무시) */
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

/** 엑셀 행 → 표준 레코드 (TikTok·인스타 컬럼이 둘 다 있으면 둘 다 보존) */
function rowToRecord(row, idx) {
  const name = pickCell(row, 'name', 'Name') || '';
  const shippingCountry = trimCell(pickCell(row, 'Shipping country', 'Shipping Country', 'shipping country')) || '';
  const tiktokUrl = trimCell(pickCell(row, 'Tiktok_URL', 'TikTok_URL', 'tiktok_url', 'Tiktok URL', 'TikTok URL'));
  const tiktokFollowerRaw = pickCell(row, 'Tiktok_Follower', 'TikTok_Follower', 'tiktok_follower', 'Tiktok Follower');
  const instagramUrl = trimCell(pickCell(row, 'Instagram_URL', 'instagram_url', 'Instagram URL', 'Instagram url'));
  const instagramFollowerRaw = pickCell(row, 'Instagram_Follower', 'instagram_follower', 'Instagram Follower');

  const tiktokFollower = tiktokFollowerRaw != null && String(tiktokFollowerRaw).trim() !== '' ? String(tiktokFollowerRaw).trim() : null;
  const instagramFollower = instagramFollowerRaw != null && String(instagramFollowerRaw).trim() !== '' ? String(instagramFollowerRaw).trim() : null;

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

  // 1) JSON 저장 (대시보드 fallback) — TikTok·인스타 둘 다 노출용 sns_channels + 원본 4필드
  const jsonPath = join(__dirname, '../src/data/test-influencers.json');
  const jsonData = records.map((r) => {
    const sns_channels = [];
    if (r.tiktok_url || r.tiktok_follower) {
      sns_channels.push({ platform: 'TikTok', url: r.tiktok_url || null, followers: String(r.tiktok_follower ?? '0') });
    }
    if (r.instagram_url || r.instagram_follower) {
      sns_channels.push({ platform: 'Instagram', url: r.instagram_url || null, followers: String(r.instagram_follower ?? '0') });
    }
    if (sns_channels.length === 0) {
      sns_channels.push({ platform: 'SNS', url: r.tiktok_url || r.instagram_url || null, followers: '0' });
    }
    return {
      id: r.id,
      name: r.name,
      handle: r.handle,
      platform: r.platform,
      followers: r.followers,
      location: r.location,
      status: r.status,
      contact: r.contact,
      tiktok_url: r.tiktok_url,
      tiktok_follower: r.tiktok_follower,
      instagram_url: r.instagram_url,
      instagram_follower: r.instagram_follower,
      sns_channels,
    };
  });
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
