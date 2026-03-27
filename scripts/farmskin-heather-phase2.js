/**
 * 팜스킨(heather@fromom.net) 2차 반영:
 * 1) 주문 BS-20260316-BEF0DBCE 캠페인: creator_drops 전부 삭제, 드랍됐던 명단은 admin_delivery_creators(BS-US-FARMSKIN)에서 제거 후
 *    엑셀 scale50 시트 11명 insert
 * 2) 주문 BS-20260324-FC62D99F Visit: admin_delivery_creators list_slug BS-US-FARMSKIN-VISIT 를 비우고 visit 시트 1명 insert
 * 3) delivery_list_sessions: 해당 캠페인에 대해 확정 되돌림(drop_confirmed_at null, status sent)
 *
 * 사용:
 *   $env:SUPABASE_SERVICE_ROLE_KEY="..."; node scripts/farmskin-heather-phase2.js "C:\Users\...\팜스킨 2차 추가.xlsx"
 *
 * dry-run (DB 쓰기 없음):
 *   node scripts/farmskin-heather-phase2.js "경로.xlsx" --dry-run
 *
 * creator_drops 가 이미 비어 있을 때(명단에서만 11명 추가):
 *   ... "경로.xlsx" --force-no-drops
 */
import XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const ORDER_SCALE = 'BS-20260316-BEF0DBCE';
const ORDER_VISIT = 'BS-20260324-FC62D99F';
const SLUG_MAIN = 'BS-US-FARMSKIN';
const SLUG_VISIT = 'BS-US-FARMSKIN-VISIT';

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
  const s = String(v).trim().replace(/,\s*$/, '');
  return s === '' ? null : s;
}

function normDropKey(s) {
  if (s == null || s === '') return '';
  const t = String(s).trim();
  if (!t.includes('|')) return t.toLowerCase();
  return t.split('|')[0].trim().toLowerCase();
}

function rowToAdminRow(row) {
  const name = pickCell(row, 'name', 'Name') || '';
  const shippingCountry = trimCell(pickCell(row, 'Shipping country', 'Shipping_country', 'Shipping Country', 'shipping country')) || '';
  let tiktokUrl = trimCell(pickCell(row, 'Tiktok_URL', 'TikTok_URL', 'tiktok_url', 'Tiktok URL', 'TikTok URL'));
  let instagramUrl = trimCell(pickCell(row, 'Instagram_URL', 'instagram_url', 'Instagram URL', 'Instagram url'));
  if (instagramUrl) instagramUrl = instagramUrl.replace(/,\s*$/, '').trim();

  const tiktokFollowerRaw = pickCell(row, 'Tiktok_Follower', 'TikTok_Follower', 'tiktok_follower', 'Tiktok Follower');
  const instagramFollowerRaw = pickCell(row, 'Instagram_Follower', 'instagram_follower', 'Instagram Follower');

  const tiktokFollower =
    tiktokFollowerRaw != null && String(tiktokFollowerRaw).trim() !== '' ? String(tiktokFollowerRaw).trim() : null;
  const instagramFollower =
    instagramFollowerRaw != null && String(instagramFollowerRaw).trim() !== '' ? String(instagramFollowerRaw).trim() : null;

  return {
    list_slug: SLUG_MAIN,
    name: name.trim(),
    shipping_country: shippingCountry,
    tiktok_url: tiktokUrl,
    tiktok_follower: tiktokFollower,
    instagram_url: instagramUrl,
    instagram_follower: instagramFollower,
  };
}

function rowToAdminRowVisit(row) {
  const r = rowToAdminRow(row);
  return { ...r, list_slug: SLUG_VISIT };
}

async function main() {
  const args = process.argv.slice(2).filter((a) => !['--dry-run', '--force-no-drops'].includes(a));
  const dryRun = process.argv.includes('--dry-run');
  const forceNoDrops = process.argv.includes('--force-no-drops');
  const excelPath = args[0] || join(__dirname, '../src/data/팜스킨-2차-추가.xlsx');

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey && !dryRun) {
    console.error('SUPABASE_SERVICE_ROLE_KEY 가 필요합니다. (--dry-run 만 엑셀 검증)');
    process.exit(1);
  }

  console.log('Reading:', excelPath);
  const wb = XLSX.readFile(excelPath);
  const scaleSheetName = wb.SheetNames.find((n) => /scale50/i.test(n) && /delivery/i.test(n)) || wb.SheetNames[0];
  const visitSheetName = wb.SheetNames.find((n) => /^visit/i.test(n.trim())) || wb.SheetNames[1];
  console.log('Sheets:', { scale: scaleSheetName, visit: visitSheetName });

  const scaleRows = XLSX.utils.sheet_to_json(wb.Sheets[scaleSheetName]).filter((r) => pickCell(r, 'name', 'Name'));
  const visitRows = XLSX.utils.sheet_to_json(wb.Sheets[visitSheetName]).filter((r) => pickCell(r, 'name', 'Name'));

  if (scaleRows.length !== 11) {
    console.warn(`경고: scale 시트 행 수가 11이 아님 (${scaleRows.length}). 계속 진행합니다.`);
  }
  const toInsertMain = scaleRows.map(rowToAdminRow);
  const toInsertVisit = visitRows.map(rowToAdminRowVisit);

  console.log('Scale50 insert preview:', toInsertMain.length, '명');
  console.log('Visit insert preview:', toInsertVisit.length, '명');

  if (dryRun) {
    console.log('DRY-RUN: DB 작업 생략');
    process.exit(0);
  }

  const supabaseUrl = process.env.SUPABASE_URL || 'https://grlayjybcxrcaufnwysb.supabase.co';
  const supabase = createClient(supabaseUrl, serviceKey);

  const { data: campScale, error: e1 } = await supabase
    .from('campaigns')
    .select('id,user_id,order_number')
    .eq('order_number', ORDER_SCALE)
    .maybeSingle();
  if (e1 || !campScale?.id) {
    console.error('캠페인 조회 실패 (order_number):', ORDER_SCALE, e1 || campScale);
    process.exit(1);
  }
  const scaleCampaignId = String(campScale.id);

  const { data: campVisit, error: e2 } = await supabase
    .from('campaigns')
    .select('id,user_id,order_number')
    .eq('order_number', ORDER_VISIT)
    .maybeSingle();
  if (e2 || !campVisit?.id) {
    console.error('Visit 캠페인 조회 실패 (order_number):', ORDER_VISIT, e2 || campVisit);
    process.exit(1);
  }

  const { data: drops, error: eDrop } = await supabase
    .from('creator_drops')
    .select('creator_identifier,creator_name')
    .eq('reference_type', 'campaign')
    .eq('reference_id', scaleCampaignId);

  if (eDrop) {
    console.error('creator_drops 조회 실패:', eDrop);
    process.exit(1);
  }

  const droppedKeys = new Set(
    (drops || []).map((d) => normDropKey(d.creator_identifier || d.creator_name)).filter(Boolean),
  );
  console.log('드랍된 creator_drops:', drops?.length ?? 0, '고유 이름 키:', droppedKeys.size);

  let idsToDelete = [];

  if ((drops?.length ?? 0) === 0) {
    if (!forceNoDrops) {
      console.error(
        'creator_drops 가 비어 있습니다. 드랍 기록이 이미 지워졌거나 order_number 가 다를 수 있습니다. 명단만 11명 추가하려면 --force-no-drops 를 사용하세요.',
      );
      process.exit(1);
    }
    console.warn('WARNING: --force-no-drops — BS-US-FARMSKIN 에서 드랍자 삭제 없이 11명만 추가합니다(총원 증가).');
  } else {
    const { data: poolRows, error: ePool } = await supabase.from('admin_delivery_creators').select('id,name').eq('list_slug', SLUG_MAIN);
    if (ePool) {
      console.error('admin_delivery_creators 조회 실패:', ePool);
      process.exit(1);
    }

    idsToDelete = (poolRows || [])
      .filter((r) => droppedKeys.has(normDropKey(r.name)))
      .map((r) => r.id);

    console.log('명단에서 삭제할 admin_delivery_creators 행:', idsToDelete.length, '/', droppedKeys.size);

    if (idsToDelete.length === 0) {
      console.error(
        'creator_drops 는 있으나 admin_delivery_creators(BS-US-FARMSKIN)에서 이름이 매칭되지 않았습니다. 드랍 식별자·명단 이름(공백·철자)을 확인하세요.',
      );
      console.error('드랍 키:', [...droppedKeys]);
      process.exit(1);
    }
    if (idsToDelete.length < droppedKeys.size) {
      console.error(
        `명단 삭제가 드랍 인원과 불일치합니다 (삭제 예정 ${idsToDelete.length}행 / 드랍 고유 이름 ${droppedKeys.size}). 중단합니다.`,
      );
      process.exit(1);
    }

    const { error: delPoolErr } = await supabase.from('admin_delivery_creators').delete().in('id', idsToDelete);
    if (delPoolErr) {
      console.error('명단 삭제 실패:', delPoolErr);
      process.exit(1);
    }
  }

  const { error: insMainErr } = await supabase.from('admin_delivery_creators').insert(toInsertMain);
  if (insMainErr) {
    console.error('11명 insert 실패:', insMainErr);
    process.exit(1);
  }
  console.log('OK: BS-US-FARMSKIN 에', toInsertMain.length, '명 추가');

  const { error: delDropsErr } = await supabase
    .from('creator_drops')
    .delete()
    .eq('reference_type', 'campaign')
    .eq('reference_id', scaleCampaignId);
  if (delDropsErr) {
    console.error('creator_drops 삭제 실패:', delDropsErr);
    process.exit(1);
  }
  console.log('OK: 해당 캠페인 creator_drops 전부 삭제');

  const nowIso = new Date().toISOString();
  const { error: sessErr } = await supabase
    .from('delivery_list_sessions')
    .update({ drop_confirmed_at: null, status: 'sent', updated_at: nowIso })
    .eq('reference_type', 'campaign')
    .eq('reference_id', scaleCampaignId);
  if (sessErr) console.warn('delivery_list_sessions 갱신 경고(행 없을 수 있음):', sessErr.message);
  else console.log('OK: delivery_list_sessions 확정 되돌림 (해당 캠페인)');

  const { error: delVisitSlugErr } = await supabase.from('admin_delivery_creators').delete().eq('list_slug', SLUG_VISIT);
  if (delVisitSlugErr) {
    console.error('VISIT slug 삭제 실패:', delVisitSlugErr);
    process.exit(1);
  }
  const { error: insVisitErr } = await supabase.from('admin_delivery_creators').insert(toInsertVisit);
  if (insVisitErr) {
    console.error('Visit 명단 insert 실패:', insVisitErr);
    process.exit(1);
  }
  console.log('OK:', SLUG_VISIT, '에', toInsertVisit.length, '명');

  const visitCampaignId = String(campVisit.id);
  const { error: delVisitDrops } = await supabase
    .from('creator_drops')
    .delete()
    .eq('reference_type', 'campaign')
    .eq('reference_id', visitCampaignId);
  if (delVisitDrops) console.warn('Visit 캠페인 creator_drops 삭제 경고:', delVisitDrops.message);
  else console.log('OK: Visit 캠페인 creator_drops 정리');

  const { error: sessVisitErr } = await supabase
    .from('delivery_list_sessions')
    .update({ drop_confirmed_at: null, status: 'sent', updated_at: nowIso })
    .eq('reference_type', 'campaign')
    .eq('reference_id', visitCampaignId);
  if (sessVisitErr) console.warn('Visit delivery_list_sessions 갱신 경고:', sessVisitErr.message);
  else console.log('OK: Visit 캠페인 delivery_list_sessions 확정 되돌림');

  console.log('\n완료. 대시보드에서 새로고침하세요.');
}

main().catch(console.error);
