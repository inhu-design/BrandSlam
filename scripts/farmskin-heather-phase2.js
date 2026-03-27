/**
 * 팜스킨(heather) 2차: BS-US-FARMSKIN 에서 빠질 11명을 제거한 뒤, 엑셀 scale 시트의 **교체 11명만** insert (총원 50 유지).
 * Visit: BS-US-FARMSKIN-VISIT 전부 삭제 후 visit 시트만 insert.
 *
 * 제거할 이름 출처 (합집합):
 * 1) creator_drops (해당 Scale 캠페인)
 * 2) 엑셀 scale 시트에서 `드롭 인원` / `드랍 인원` 등이 참인 행의 name
 * 3) 환경변수 FARMSKIN_NAMES_TO_REMOVE="이름1,이름2,..." (드랍 기록이 이미 지워졌을 때)
 *
 * 삽입: scale 시트에서 드롭 표시가 **아닌** 행만 (보통 교체 11명).
 *
 *   $env:SUPABASE_SERVICE_ROLE_KEY="..."; npm run import:farmskin-phase2 -- "C:\...\팜스킨 2차 추가.xlsx"
 *
 * dry-run: ... --dry-run
 * 드랍 DB 없이 이름만으로 제거: FARMSKIN_NAMES_TO_REMOVE="a,b,c" ... 또는 --force-no-drops (명단만 추가·총원 증가)
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

function normPersonKey(s) {
  if (s == null || s === '') return '';
  let t = String(s).trim();
  if (t.includes('|')) t = t.split('|')[0].trim();
  try {
    t = t.normalize('NFKC');
  } catch {
    /* ignore */
  }
  return t.replace(/\s+/g, ' ').trim().toLowerCase();
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
  const s = String(v).trim().replace(/,\s*$/, '');
  return s === '' ? null : s;
}

function isExcelMarkedDrop(row) {
  const v = pickCell(row, '드롭 인원', '드롭인원', '드랍 인원', '드랍인원', 'Drop', 'drop', 'REMOVE', 'remove');
  if (v === undefined || v === null || v === '') return false;
  if (typeof v === 'boolean') return v === true;
  if (typeof v === 'number') return v === 1;
  const s = String(v).toLowerCase().trim();
  return (
    s === 'true' ||
    s === 'y' ||
    s === 'yes' ||
    s === '1' ||
    s === '드랍' ||
    s === '드롭' ||
    s === 'drop' ||
    s === 'o' ||
    s === 'x'
  );
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

  const scaleRowsAll = XLSX.utils.sheet_to_json(wb.Sheets[scaleSheetName]).filter((r) => pickCell(r, 'name', 'Name'));
  const visitRows = XLSX.utils.sheet_to_json(wb.Sheets[visitSheetName]).filter((r) => pickCell(r, 'name', 'Name'));

  const toInsertMain = scaleRowsAll.filter((r) => !isExcelMarkedDrop(r)).map(rowToAdminRow);
  const namesFromExcelDrop = scaleRowsAll
    .filter(isExcelMarkedDrop)
    .map((r) => normPersonKey(pickCell(r, 'name', 'Name')))
    .filter(Boolean);

  console.log('Scale: 교체 insert 대상 행', toInsertMain.length, '명 (드롭 표시 행 제외)');
  console.log('Scale: 엑셀에서 제거 대상 이름', namesFromExcelDrop.length, '개');
  console.log('Visit insert:', visitRows.length, '명');

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

  const droppedKeys = new Set();

  for (const n of namesFromExcelDrop) {
    droppedKeys.add(n);
  }

  const envRemove = process.env.FARMSKIN_NAMES_TO_REMOVE || '';
  for (const n of envRemove.split(',').map((s) => s.trim()).filter(Boolean)) {
    droppedKeys.add(normPersonKey(n));
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

  for (const d of drops || []) {
    const k = normPersonKey(d.creator_identifier || d.creator_name);
    if (k) droppedKeys.add(k);
  }

  console.log('제거할 고유 이름 키(합집합):', droppedKeys.size, droppedKeys.size ? [...droppedKeys].join(' | ') : '(없음)');

  let idsToDelete = [];

  if (droppedKeys.size === 0) {
    if (!forceNoDrops) {
      console.error(
        '제거할 인원이 없습니다. (1) 대시보드에 드랍 저장이 남아 있는지, (2) 엑셀에 드롭 표시 행이 있는지, (3) FARMSKIN_NAMES_TO_REMOVE 환경변수로 이름을 넣거나 --force-no-drops 로 확인하세요.',
      );
      process.exit(1);
    }
    console.warn('WARNING: --force-no-drops — BS-US-FARMSKIN 에서 삭제 없이 교체 행만 추가합니다.');
  } else {
    const { data: poolRows, error: ePool } = await supabase.from('admin_delivery_creators').select('id,name').eq('list_slug', SLUG_MAIN);
    if (ePool) {
      console.error('admin_delivery_creators 조회 실패:', ePool);
      process.exit(1);
    }

    const matchedKeys = new Set();
    for (const r of poolRows || []) {
      const k = normPersonKey(r.name);
      if (droppedKeys.has(k)) matchedKeys.add(k);
    }
    if (matchedKeys.size < droppedKeys.size) {
      const missing = [...droppedKeys].filter((k) => !matchedKeys.has(k));
      console.error('명단(BS-US-FARMSKIN)에 없는 제거 대상 이름:', missing.join(' | '));
      process.exit(1);
    }

    idsToDelete = (poolRows || []).filter((r) => droppedKeys.has(normPersonKey(r.name))).map((r) => r.id);

    console.log('명단에서 삭제할 행:', idsToDelete.length, '개 (고유 이름', droppedKeys.size, '개 모두 매칭)');

    const { error: delPoolErr } = await supabase.from('admin_delivery_creators').delete().in('id', idsToDelete);
    if (delPoolErr) {
      console.error('명단 삭제 실패:', delPoolErr);
      process.exit(1);
    }
  }

  if (toInsertMain.length === 0) {
    console.error('엑셀에 삽입할 행이 없습니다. (모든 행이 드롭 표시로만 되어 있지 않은지 확인)');
    process.exit(1);
  }

  const { error: insMainErr } = await supabase.from('admin_delivery_creators').insert(toInsertMain);
  if (insMainErr) {
    console.error('교체 인원 insert 실패:', insMainErr);
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
  console.log('OK: Scale 캠페인 creator_drops 삭제');

  const nowIso = new Date().toISOString();
  const { error: sessErr } = await supabase
    .from('delivery_list_sessions')
    .update({ drop_confirmed_at: null, status: 'sent', updated_at: nowIso })
    .eq('reference_type', 'campaign')
    .eq('reference_id', scaleCampaignId);
  if (sessErr) console.warn('delivery_list_sessions 갱신 경고:', sessErr.message);
  else console.log('OK: delivery_list_sessions 확정 되돌림 (Scale 캠페인)');

  const { error: delVisitSlugErr } = await supabase.from('admin_delivery_creators').delete().eq('list_slug', SLUG_VISIT);
  if (delVisitSlugErr) {
    console.error('VISIT slug 삭제 실패:', delVisitSlugErr);
    process.exit(1);
  }
  const toInsertVisit = visitRows.map(rowToAdminRowVisit);
  const { error: insVisitErr } = await supabase.from('admin_delivery_creators').insert(toInsertVisit);
  if (insVisitErr) {
    console.error('Visit 명단 insert 실패:', insVisitErr);
    process.exit(1);
  }
  console.log('OK:', SLUG_VISIT, '에', toInsertVisit.length, '명');

  const visitCampaignId = String(campVisit.id);
  await supabase.from('creator_drops').delete().eq('reference_type', 'campaign').eq('reference_id', visitCampaignId);
  await supabase
    .from('delivery_list_sessions')
    .update({ drop_confirmed_at: null, status: 'sent', updated_at: nowIso })
    .eq('reference_type', 'campaign')
    .eq('reference_id', visitCampaignId);

  console.log('\n완료. BS-US-FARMSKIN 총원은 Supabase Table Editor에서 50명인지 확인하세요. 대시보드 새로고침.');
}

main().catch(console.error);
