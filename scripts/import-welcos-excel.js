/**
 * BS-MX-웰코스.xlsx → admin_delivery_creators (list_slug = BS-MX-WELCOS)
 * 엑셀의 Posting URL (TT)/(IG), Views 등은 업로드·트래킹 대시보드에 반영됩니다.
 * (DB에 컬럼이 없으면 supabase-migration-admin-delivery-posting-metrics.sql 실행)
 *
 * 사용법:
 *   node scripts/import-welcos-excel.js "C:\Users\...\Downloads\BS-MX-웰코스.xlsx"
 *
 * 환경변수: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { parseDeliveryCreatorsWorkbook, toDbInsertRows } from '../server/lib/delivery-creators-xlsx.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const LIST_SLUG = 'BS-MX-WELCOS';

async function main() {
  const excelPath = process.argv[2] || join(__dirname, '../src/data/BS-MX-웰코스.xlsx');
  console.log('Reading:', excelPath);

  let buf;
  try {
    buf = readFileSync(excelPath);
  } catch (e) {
    console.error('파일을 읽을 수 없습니다:', e?.message || e);
    process.exit(1);
  }

  const parsed = parseDeliveryCreatorsWorkbook(buf);
  if (!parsed.ok) {
    console.error(parsed.error);
    process.exit(1);
  }

  console.log(`Parsed ${parsed.rows.length} creators (sheet: ${parsed.sheetName})`);

  const supabaseUrl = process.env.SUPABASE_URL || 'https://grlayjybcxrcaufnwysb.supabase.co';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceKey) {
    console.error('SUPABASE_SERVICE_ROLE_KEY 가 없습니다. Supabase에 업로드할 수 없습니다.');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceKey);
  const toInsert = toDbInsertRows(parsed.rows, LIST_SLUG);

  const { error: delErr } = await supabase.from('admin_delivery_creators').delete().eq('list_slug', LIST_SLUG);

  if (delErr) console.warn('Delete warning:', delErr.message);

  const { data, error } = await supabase.from('admin_delivery_creators').insert(toInsert).select('id');

  if (error) {
    console.error('Supabase insert error:', error);
    console.error(
      'visit_date / posting 컬럼 오류 시 supabase-migration-admin-delivery-visit-date.sql 및 supabase-migration-admin-delivery-posting-metrics.sql 적용 여부를 확인하세요.',
    );
    process.exit(1);
  }
  console.log(`Supabase: inserted ${data?.length ?? 0} rows (list_slug=${LIST_SLUG})`);
}

main().catch(console.error);
