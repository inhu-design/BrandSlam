/**
 * 관리자: campaigns에 한 번도 연결되지 않은 auth 사용자(회원가입만 한 계정) 목록
 * GET /api/admin/signup-only-users
 */
import { createClient } from '@supabase/supabase-js';
import { supabase as supabaseAdmin } from '../lib/supabase-server.js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
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

  const adminEmail = (user.email || '').toLowerCase();
  if (!ADMIN_EMAILS.includes(adminEmail)) return res.status(403).json({ error: 'Admin only' });

  try {
    const { data: campRows, error: campErr } = await supabaseAdmin.from('campaigns').select('user_id');
    if (campErr) return res.status(500).json({ error: campErr.message || 'Failed to load campaigns' });

    const withCampaign = new Set(
      (campRows || []).map((r) => r.user_id).filter(Boolean),
    );

    const allUsers = [];
    let page = 1;
    const perPage = 1000;
    for (;;) {
      const { data: pageData, error: listErr } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage,
      });
      if (listErr) {
        return res.status(500).json({ error: listErr.message || 'Failed to list users' });
      }
      const batch = pageData?.users || [];
      allUsers.push(...batch);
      if (batch.length < perPage) break;
      page += 1;
      if (page > 50) break;
    }

    const signupOnly = allUsers
      .filter((u) => u.id && !withCampaign.has(u.id))
      .map((u) => ({
        id: u.id,
        email: u.email || '',
        created_at: u.created_at || null,
        last_sign_in_at: u.last_sign_in_at || null,
        email_confirmed_at: u.email_confirmed_at || null,
      }))
      .sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));

    return res.status(200).json({
      ok: true,
      users: signupOnly,
      total_auth_users: allUsers.length,
      users_with_campaigns: withCampaign.size,
    });
  } catch (err) {
    console.error('[admin/signup-only-users]', err);
    return res.status(500).json({ error: String(err?.message || err) });
  }
}
