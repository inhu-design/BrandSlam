/**
 * magic link / redirect용 기준 오리진 (Open Redirect 방지)
 * - 반드시 ALLOWED_ORIGINS(쉼표 구분) 또는 SITE_ORIGIN 중 하나를 프로덕션에 설정하세요.
 * - 요청 Origin 이 허용 목록에 없으면 목록의 첫 값(또는 VERCEL_URL)을 사용합니다.
 */
export function resolveAllowedRedirectOrigin(req) {
  const raw = (process.env.ALLOWED_ORIGINS || process.env.SITE_ORIGIN || '').trim();
  const allowed = raw
    ? raw.split(',').map((s) => s.trim().replace(/\/$/, '')).filter(Boolean)
    : [];
  if (process.env.VERCEL_URL && !allowed.includes(`https://${process.env.VERCEL_URL}`)) {
    allowed.push(`https://${process.env.VERCEL_URL}`);
  }
  const normalize = (u) => {
    if (!u) return '';
    const t = u.replace(/\/$/, '');
    return t.startsWith('http') ? t : `https://${t}`;
  };
  const originHeader = (req.headers.origin || '').trim().replace(/\/$/, '');
  const originNorm = originHeader.startsWith('http') ? originHeader : originHeader ? `https://${originHeader}` : '';

  for (const a of allowed) {
    const an = normalize(a);
    if (originNorm && (originNorm === an || originNorm.startsWith(`${an}/`))) {
      return originNorm.startsWith('http') ? originNorm : `https://${originNorm}`;
    }
  }
  if (allowed.length > 0) {
    return normalize(allowed[0]);
  }
  return 'https://www.slam-global.com';
}
