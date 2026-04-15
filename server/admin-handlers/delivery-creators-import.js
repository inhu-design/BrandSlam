/**
 * 관리자: 납품 엑셀 → admin_delivery_creators 일괄 반영 (재배포 없이)
 * POST /api/admin/delivery-creators-import
 * Content-Type: application/json
 * Body: {
 *   file_base64: string (xlsx/xls, data URL prefix 없이 pure base64),
 *   list_slug?: string (레거시 공유 풀, 예: BS-US-FARMSKIN),
 *   campaign_id?: string (권장: campaigns.id UUID — 해당 캠페인에만 행 귀속),
 *   mode: "replace" | "append",
 *   dry_run?: boolean
 * }
 * list_slug 와 campaign_id 중 하나는 필수입니다.
 */
import { createClient } from '@supabase/supabase-js';
import { supabase as supabaseAdmin } from '../lib/supabase-server.js';
import {
  parseDeliveryCreatorsWorkbook,
  toDbInsertRows,
} from '../lib/delivery-creators-xlsx.js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

const LIST_SLUG_RE = /^[A-Za-z0-9][A-Za-z0-9_.-]{1,79}$/;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
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

  const campaignIdRaw = String(body.campaign_id || '').trim();
  const listSlugManual = String(body.list_slug || '').trim();

  let listSlug = '';
  let campaignId = null;
  if (UUID_RE.test(campaignIdRaw)) {
    const { data: campRow, error: campErr } = await supabaseAdmin
      .from('campaigns')
      .select('id')
      .eq('id', campaignIdRaw)
      .maybeSingle();
    if (campErr) return res.status(500).json({ error: campErr.message || '캠페인 조회 실패' });
    if (!campRow?.id) {
      return res.status(404).json({ error: 'campaign_id에 해당하는 캠페인이 없습니다.' });
    }
    campaignId = campaignIdRaw;
    listSlug = `c${campaignIdRaw.replace(/-/g, '')}`;
  } else if (LIST_SLUG_RE.test(listSlugManual)) {
    listSlug = listSlugManual;
  } else {
    return res.status(400).json({
      error:
        'campaign_id(캠페인 UUID) 또는 list_slug(영문·숫자·._- 조합 2~80자) 중 하나를 올바르게 보내 주세요.',
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

  let toInsert = toDbInsertRows(parsed.rows, listSlug, {
    campaignId: campaignId || undefined,
    /** 고객 대시보드에서 신규 반영 인원으로 표시 (컬럼 없으면 Supabase 마이그레이션 실행) */
    markReplacements: true,
  });

  const stripVisitDate = !!body.omit_visit_date;
  if (stripVisitDate) {
    toInsert = toInsert.map((row) => {
      const rest = { ...row };
      delete rest.visit_date;
      return rest;
    });
  }

  if (dryRun) {
    return res.status(200).json({
      ok: true,
      dry_run: true,
      list_slug: listSlug,
      campaign_id: campaignId,
      mode,
      sheet_name: parsed.sheetName,
      raw_row_count: parsed.rawCount,
      valid_row_count: parsed.rows.length,
      sample: toInsert.slice(0, 3),
    });
  }

  try {
    if (mode === 'replace') {
      const del = campaignId
        ? supabaseAdmin.from('admin_delivery_creators').delete().eq('campaign_id', campaignId)
        : supabaseAdmin.from('admin_delivery_creators').delete().eq('list_slug', listSlug);
      const { error: delErr } = await del;
      if (delErr) {
        const hint =
          delErr.message?.includes('campaign_id') || String(delErr).includes('campaign_id')
            ? ' Supabase에 supabase-migration-admin-delivery-creators-campaign-id.sql 을 실행했는지 확인하세요.'
            : '';
        return res.status(500).json({ error: `${delErr.message || '기존 행 삭제 실패'}${hint}` });
      }
    }

    let inserted = 0;
    for (let i = 0; i < toInsert.length; i += INSERT_CHUNK) {
      const chunk = toInsert.slice(i, i + INSERT_CHUNK);
      const { data, error: insErr } = await supabaseAdmin.from('admin_delivery_creators').insert(chunk).select('id');
      if (insErr) {
        const msg = String(insErr.message || '');
        let hint = '';
        if (msg.toLowerCase().includes('visit_date') || msg.includes('visit_date')) {
          hint =
            ' visit_date 컬럼이 없다면 supabase-migration-admin-delivery-visit-date.sql 을 실행하거나, 요청에 omit_visit_date: true 를 넣어 주세요.';
        } else if (msg.toLowerCase().includes('is_replacement') || msg.includes('is_replacement')) {
          hint =
            ' is_replacement 컬럼이 없다면 supabase-migration-admin-delivery-creators-is-replacement.sql 을 Supabase에서 실행해 주세요.';
        }
        return res.status(500).json({ error: `${msg}${hint}` });
      }
      inserted += data?.length || 0;
    }

    return res.status(200).json({
      ok: true,
      list_slug: listSlug,
      campaign_id: campaignId,
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
