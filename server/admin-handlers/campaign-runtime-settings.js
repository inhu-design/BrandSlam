/**
 * 관리자 전용: 캠페인 런타임 설정 수정 (코드 재배포 없이 반영)
 * - POST /api/admin/campaign-runtime-settings
 * - Body: {
 *   campaign_id,
 *   linked_list_slug?,
 *   notion_guideline_url?,
 *   notion_guideline_title?,
 *   notion_guideline_description?,
 *   force_drop_complete_message?
 * }
 */
import { createClient } from '@supabase/supabase-js';
import { supabase as supabaseAdmin } from '../lib/supabase-server.js';

const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const STRING_FIELDS = [
  'linked_list_slug',
  'notion_guideline_url',
  'notion_guideline_title',
  'notion_guideline_description',
];

function parseStringOrNull(v) {
  if (v == null) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (ADMIN_EMAILS.length === 0) return res.status(503).json({ error: 'ADMIN_EMAILS not configured' });
  if (!supabaseAnonKey) return res.status(503).json({ error: 'SUPABASE_ANON_KEY required' });
  if (!supabaseAdmin) return res.status(503).json({ error: 'SUPABASE_SERVICE_ROLE_KEY required' });

  const supabaseUrl = (process.env.SUPABASE_URL || '').trim();
  if (!supabaseUrl) return res.status(503).json({ error: 'SUPABASE_URL not configured' });

  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'Authorization required' });

  const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
  const {
    data: { user },
    error: authError,
  } = await supabaseAuth.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: 'Invalid or expired token' });
  const email = (user.email || '').toLowerCase();
  if (!ADMIN_EMAILS.includes(email)) return res.status(403).json({ error: 'Admin only' });

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const campaignId = String(body.campaign_id || '').trim();
  if (!campaignId || !UUID_RE.test(campaignId)) {
    return res.status(400).json({ error: 'Valid campaign_id (UUID) required' });
  }

  const update = { campaign_id: campaignId, updated_by: user.id, updated_at: new Date().toISOString() };
  for (const key of STRING_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(body, key)) continue;
    const parsed = parseStringOrNull(body[key]);
    if (key === 'notion_guideline_url' && parsed && !/^https?:\/\//i.test(parsed)) {
      return res.status(400).json({ error: 'notion_guideline_url must start with http:// or https://' });
    }
    update[key] = parsed;
  }
  if (Object.prototype.hasOwnProperty.call(body, 'force_drop_complete_message')) {
    update.force_drop_complete_message = !!body.force_drop_complete_message;
  }

  const { data, error } = await supabaseAdmin
    .from('campaign_admin_settings')
    .upsert(update, { onConflict: 'campaign_id' })
    .select(
      'campaign_id, linked_list_slug, notion_guideline_url, notion_guideline_title, notion_guideline_description, force_drop_complete_message, updated_at',
    )
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message || 'Save failed' });
  return res.status(200).json({ ok: true, settings: data || null });
}
