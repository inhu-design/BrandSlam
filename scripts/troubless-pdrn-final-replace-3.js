/**
 * Troubless GLASS GLOW+ PDRN COLLAGEN SUNSCREEN (주문 BS-20260316-BEF0DBCE) — `BS-US-FARMSKIN` 풀:
 * 브랜드 드랍 3명 행 삭제 후 교체 3명 insert (총원 50 유지).
 * 대시보드 `finalizeTroublessPdrnScale50DisplayCreators` 와 동일 인원·SNS 필드.
 *
 *   $env:SUPABASE_SERVICE_ROLE_KEY="..."; npm run import:troubless-pdrn-replace3
 *
 * dry-run: ... --dry-run
 */
import { createClient } from '@supabase/supabase-js';

const SLUG = 'BS-US-FARMSKIN';

const NAMES_TO_REMOVE = [
  'Gabrielle Diane Comeau',
  'Holly  Curtis',
  'Stephanie Padilla',
];

function normName(s) {
  if (s == null || s === '') return '';
  return String(s)
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

const REMOVE_KEYS = new Set(NAMES_TO_REMOVE.map(normName));

const TO_INSERT = [
  {
    list_slug: SLUG,
    name: 'Svitlana Zakharkiv',
    shipping_country: 'US',
    tiktok_url: 'https://www.tiktok.com/@svitlana_ugc?_r=1&_t=ZT-959mCApCEgP',
    tiktok_follower: '3550',
    instagram_url: 'https://www.instagram.com/svitlana_ugc?igsh=Y2xqMTlidXU1dHFq&utm_source=qr',
    instagram_follower: '6484',
  },
  {
    list_slug: SLUG,
    name: 'Aleksandra Martynova',
    shipping_country: 'US',
    tiktok_url: 'https://www.tiktok.com/@sasha_probuyer?_r=1&_t=ZP-959JcsZTIsw',
    tiktok_follower: '1059',
    instagram_url: 'https://www.instagram.com/sasha_probuyer?igsh=b2RlaXVmbTN2bGxx&utm_source=qr',
    instagram_follower: '1333',
  },
  {
    list_slug: SLUG,
    name: 'Anna Harrison',
    shipping_country: 'US',
    tiktok_url: 'https://www.tiktok.com/@alh_ugc?_r=1&_t=ZP-93AtErZ74Vr',
    tiktok_follower: '11',
    instagram_url: 'https://www.instagram.com/_annalharrison?igsh=eTFwYmcxNGk1dmkw&utm_source=qr',
    instagram_follower: '2129',
  },
];

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey && !dryRun) {
    console.error('SUPABASE_SERVICE_ROLE_KEY 가 필요합니다. (--dry-run 만 검증)');
    process.exit(1);
  }

  console.log('Remove (normalized):', [...REMOVE_KEYS].join(' | '));
  console.log('Insert:', TO_INSERT.map((r) => r.name).join(', '));

  if (dryRun) {
    console.log('DRY-RUN: DB 작업 생략');
    process.exit(0);
  }

  const supabaseUrl = process.env.SUPABASE_URL || 'https://grlayjybcxrcaufnwysb.supabase.co';
  const supabase = createClient(supabaseUrl, serviceKey);

  const { data: rows, error: fetchErr } = await supabase.from('admin_delivery_creators').select('id,name').eq('list_slug', SLUG);
  if (fetchErr) {
    console.error('admin_delivery_creators 조회 실패:', fetchErr);
    process.exit(1);
  }

  const idsToDelete = (rows || [])
    .filter((r) => REMOVE_KEYS.has(normName(r.name)))
    .map((r) => r.id)
    .filter(Boolean);

  if (idsToDelete.length !== REMOVE_KEYS.size) {
    const foundNames = (rows || []).filter((r) => REMOVE_KEYS.has(normName(r.name))).map((r) => r.name);
    console.warn('경고: 제거 대상', REMOVE_KEYS.size, '명 중 DB에서', idsToDelete.length, '명만 매칭:', foundNames.join(' | ') || '(없음)');
  }

  if (idsToDelete.length > 0) {
    const { error: delErr } = await supabase.from('admin_delivery_creators').delete().in('id', idsToDelete);
    if (delErr) {
      console.error('삭제 실패:', delErr);
      process.exit(1);
    }
    console.log('OK: 삭제', idsToDelete.length, '행');
  } else {
    console.log('삭제할 행 없음 (이미 반영됐을 수 있음)');
  }

  const { data: afterRows, error: afterErr } = await supabase.from('admin_delivery_creators').select('name').eq('list_slug', SLUG);
  if (afterErr) {
    console.error('명단 재조회 실패:', afterErr);
    process.exit(1);
  }
  const existingKeys = new Set((afterRows || []).map((r) => normName(r.name)));
  const toInsertNow = TO_INSERT.filter((r) => !existingKeys.has(normName(r.name)));
  if (toInsertNow.length === 0) {
    console.log('OK: 교체 3명이 이미 명단에 있어 insert 생략');
  } else {
    const { error: insErr } = await supabase.from('admin_delivery_creators').insert(toInsertNow);
    if (insErr) {
      console.error('insert 실패:', insErr);
      process.exit(1);
    }
    console.log('OK: insert', toInsertNow.length, '행');
  }

  const { count, error: cErr } = await supabase
    .from('admin_delivery_creators')
    .select('*', { count: 'exact', head: true })
    .eq('list_slug', SLUG);
  if (!cErr) console.log('OK: BS-US-FARMSKIN 총', count, '명 (50명인지 Table Editor에서 확인)');
  console.log('\n참고: 해당 캠페인 creator_drops 에 옛 드랍 이름이 남아 있으면 Supabase에서 정리하거나, 대시보드에서 자동 정리됩니다.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
