/**
 * GoTrue Admin: 이메일로 auth.users id 조회 (대소문자 무시)
 * @param {import('@supabase/supabase-js').SupabaseClient} supabaseAdmin - service role 클라이언트
 * @param {string} emailNorm - trim + toLowerCase 된 이메일
 * @returns {Promise<string|null>} user id uuid 또는 null
 */
export async function resolveAuthUserIdByEmail(supabaseAdmin, emailNorm) {
  let page = 1;
  const perPage = 1000;
  for (; page <= 25; page += 1) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(error.message || 'listUsers failed');
    const batch = data?.users || [];
    const hit = batch.find((u) => (u.email || '').toLowerCase().trim() === emailNorm);
    if (hit?.id) return hit.id;
    if (batch.length < perPage) break;
  }
  return null;
}
