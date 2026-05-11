/**
 * Vercel catch-all 라우터에서 세그먼트 추출 (비-Next: query 키 `...path`)
 * @see https://github.com/vercel/community/discussions/947
 */
export function segmentsFromQuery(query) {
  const q = query || {};
  const p = q.path ?? q['...path'];
  if (p == null || p === '') return [];
  return Array.isArray(p) ? p : [p];
}

/** @param {string} segment 'admin' | 'cpm' | 'checkout' | 'inicis' */
export function segmentsAfterNamespace(req, segment) {
  let segments = segmentsFromQuery(req.query || {});
  if (segments.length > 0) return segments;
  try {
    const raw = req.url || '/';
    const pathOnly = raw.split('?')[0] || '/';
    const parts = pathOnly.split('/').filter(Boolean);
    const idx = parts.indexOf(segment);
    if (idx < 0 || idx >= parts.length - 1) return [];
    return parts.slice(idx + 1);
  } catch {
    return [];
  }
}
