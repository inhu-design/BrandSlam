/**
 * 관리자: 납품 엑셀 → admin_delivery_creators 일괄 반영 (재배포 없이)
 * POST /api/admin/delivery-creators-import
 * Content-Type: application/json
 * Body: {
 *   file_base64: string (xlsx/xls, data URL prefix 없이 pure base64),
 *   list_slug: string (예: BS-US-FARMSKIN),
 *   mode: "replace" | "append",
 *   dry_run?: boolean
 * }
 */
import { createClient } from '@supabase/supabase-js';
import { supabase as supabaseAdmin } from '../../server/lib/supabase-server.js';
import {
  parseDeliveryCreatorsWorkbook,
  toDbInsertRows,
} from '../../server/lib/delivery-creators-xlsx.js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

const LIST_SLUG_RE = /^[A-Za-z0-9][A-Za-z0-9_.-]{1,79}$/;
const MAX_DECODED_BYTES = 6 * 1024 * 1024;
const MAX_ROWS = 5000;
const INSERT_CHUNK = 250;

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (ADMIN_EMAILS.length === 0) return res.status(503).json({ error: 'ADMIN_EMAILS not configured' });
  if (!supabaseAnonKey) return res.status(503).json({ error: 'SUPABASE_ANON_KEY required' });
  if (!supabaseAdmin) return res.status(503).json({ error: 'SUPABASE_SERVICE_ROLE_KEY required' });

  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'Authorization required' });

  const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
  const {
    data: { user },
    error: authError,
  } = await supabaseAuth.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: 'Invalid or expired token' });

  if (!ADMIN_EMAILS.includes((user.email || '').toLowerCase())) {
    return res.status(403).json({ error: 'Admin only' });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const listSlug = String(body.list_slug || '').trim();
  if (!LIST_SLUG_RE.test(listSlug)) {
    return res.status(400).json({
      error: 'list_slug은 영문·숫자·._- 조합 2~80자 (예: BS-US-FARMSKIN) 이어야 합니다.',
    });
  }

  const mode = String(body.mode || 'replace').toLowerCase();
  if (mode !== 'replace' && mode !== 'append') {
    return res.status(400).json({ error: 'mode는 replace 또는 append 여야 합니다.' });
  }

  const dryRun = !!body.dry_run;
  const b64 = String(body.file_base64 || '').replace(/^data:[^;]+;base64,/, '').trim();
  if (!b64) {
    return res.status(400).json({ error: 'file_base64가 필요합니다.' });
  }

  let buffer;
  try {
    buffer = Buffer.from(b64, 'base64');
  } catch {
    return res.status(400).json({ error: 'file_base64가 올바른 base64가 아닙니다.' });
  }
  if (!buffer.length) return res.status(400).json({ error: '빈 파일입니다.' });
  if (buffer.length > MAX_DECODED_BYTES) {
    return res.status(413).json({ error: `파일이 너무 큽니다. (${MAX_DECODED_BYTES / 1024 / 1024}MB 이하)` });
  }

  const parsed = parseDeliveryCreatorsWorkbook(buffer);
  if (!parsed.ok) return res.status(400).json({ error: parsed.error });

  if (parsed.rows.length > MAX_ROWS) {
    return res.status(400).json({ error: `행이 너무 많습니다. 최대 ${MAX_ROWS}명까지 업로드할 수 있습니다.` });
  }
  if (parsed.rows.length === 0) {
    return res.status(400).json({ error: 'name 열이 있는 데이터 행이 없습니다. 첫 시트·헤더명을 확인해 주세요.' });
  }

  let toInsert = toDbInsertRows(parsed.rows, listSlug);

  const stripVisitDate = !!body.omit_visit_date;
  if (stripVisitDate) {
    toInsert = toInsert.map(({ visit_date, ...rest }) => rest);
  }

  if (dryRun) {
    return res.status(200).json({
      ok: true,
      dry_run: true,
      list_slug: listSlug,
      mode,
      sheet_name: parsed.sheetName,
      raw_row_count: parsed.rawCount,
      valid_row_count: parsed.rows.length,
      sample: toInsert.slice(0, 3),
    });
  }

  try {
    if (mode === 'replace') {
      const { error: delErr } = await supabaseAdmin.from('admin_delivery_creators').delete().eq('list_slug', listSlug);
      if (delErr) {
        return res.status(500).json({ error: delErr.message || '기존 행 삭제 실패' });
      }
    }

    let inserted = 0;
    for (let i = 0; i < toInsert.length; i += INSERT_CHUNK) {
      const chunk = toInsert.slice(i, i + INSERT_CHUNK);
      const { data, error: insErr } = await supabaseAdmin.from('admin_delivery_creators').insert(chunk).select('id');
      if (insErr) {
        const msg = String(insErr.message || '');
        const hint =
          msg.toLowerCase().includes('visit_date') || msg.includes('visit_date')
            ? ' visit_date 컬럼이 없다면 supabase-migration-admin-delivery-visit-date.sql 을 실행하거나, 요청에 omit_visit_date: true 를 넣어 주세요.'
            : '';
        return res.status(500).json({ error: `${msg}${hint}` });
      }
      inserted += data?.length || 0;
    }

    return res.status(200).json({
      ok: true,
      list_slug: listSlug,
      mode,
      sheet_name: parsed.sheetName,
      raw_row_count: parsed.rawCount,
      inserted,
    });
  } catch (err) {
    console.error('[admin/delivery-creators-import]', err);
    return res.status(500).json({ error: String(err?.message || err) });
  }
}
