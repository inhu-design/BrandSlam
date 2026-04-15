/**
 * 관리자 전용: 고객 이메일로 로그인 링크 생성 (고객 화면 확인용)
 * - POST /api/admin/impersonate-login
 * - Body: { email: "customer@example.com" }
 * - Authorization: Bearer <관리자 JWT>
 * - ADMIN_EMAILS 환경변수에 등록된 이메일만 호출 가능
 */
import { createClient } from '@supabase/supabase-js';
import { supabase as supabaseAdmin } from '../lib/supabase-server.js';
import { resolveAllowedRedirectOrigin } from '../lib/allowed-redirect-origin.js';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);
 
export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (ADMIN_EMAILS.length === 0) {
    return res.status(503).json({ error: 'ADMIN_EMAILS not configured' });
  }

  if (!supabaseAdmin) {
    return res.status(503).json({ error: 'SUPABASE_SERVICE_ROLE_KEY required' });
  }

  const supabaseUrl = (process.env.SUPABASE_URL || '').trim();
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl) {
    return res.status(503).json({ error: 'SUPABASE_URL not configured' });
  }
  if (!supabaseAnonKey) {
    return res.status(503).json({ error: 'SUPABASE_ANON_KEY required' });
  }

  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) {
    return res.status(401).json({ error: 'Authorization required' });
  }

  const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
  const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const adminEmail = (user.email || '').toLowerCase();
  if (!ADMIN_EMAILS.includes(adminEmail)) {
    return res.status(403).json({ error: 'Admin only' });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const customerEmail = (body.email || '').toString().trim().toLowerCase();
  if (!customerEmail || !customerEmail.includes('@')) {
    return res.status(400).json({ error: 'Valid email required' });
  }

  try {
    const baseUrl = resolveAllowedRedirectOrigin(req).replace(/\/$/, '');
    const redirectTo = `${baseUrl}/dashboard`;

    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: customerEmail,
      options: { redirectTo },
    });

    if (linkError) {
      return res.status(400).json({ error: linkError.message || 'Failed to generate link' });
    }

    // action_link: Supabase가 생성한 전체 URL (바로 사용 가능)
    // hashed_token: /auth/impersonate 페이지에서 verifyOtp용
    let impersonateUrl = linkData?.properties?.action_link;
    if (!impersonateUrl) {
      const hashedToken = linkData?.properties?.hashed_token;
      if (!hashedToken) {
        return res.status(500).json({ error: 'No token in response' });
      }
      impersonateUrl = `${baseUrl}/auth/impersonate?token_hash=${encodeURIComponent(hashedToken)}`;
    }

    return res.status(200).json({
      ok: true,
      impersonate_url: impersonateUrl,
      email: customerEmail,
      message: '링크는 1회용입니다. 새 탭에서 열어 고객 화면을 확인하세요.',
    });
  } catch (err) {
    console.error('[impersonate-login]', err);
    return res.status(500).json({ error: String(err?.message || err) });
  }
}
