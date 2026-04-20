/**
 * `/api/admin/admin-session` 호출을 페이지 내에서 중복하지 않도록 메모·인플라이트 공유.
 * 대시보드 초기 로딩 + SupportChatWidget(useAdminSession) 등이 동시에 뜰 때 RTT를 한 번으로 줄임.
 */
let cached = { token: null, isAdmin: false, until: 0 };
let inflight = null;
let inflightToken = null;

const CACHE_MS = 45_000;
const NEGATIVE_CACHE_MS = 12_000;

export function fetchAdminSessionIsAdmin(accessToken) {
  if (!accessToken) return Promise.resolve(false);
  const now = Date.now();
  if (cached.token === accessToken && now < cached.until) {
    return Promise.resolve(cached.isAdmin);
  }
  if (inflight && inflightToken === accessToken) {
    return inflight;
  }
  inflightToken = accessToken;
  inflight = fetch(`${window.location.origin}/api/admin/admin-session`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
    .then(async (res) => {
      const j = await res.json().catch(() => ({}));
      const isAdmin = !!(res.ok && j.is_admin);
      cached = {
        token: accessToken,
        isAdmin,
        until: Date.now() + CACHE_MS,
      };
      return isAdmin;
    })
    .catch(() => {
      cached = {
        token: accessToken,
        isAdmin: false,
        until: Date.now() + NEGATIVE_CACHE_MS,
      };
      return false;
    })
    .finally(() => {
      inflight = null;
      inflightToken = null;
    });
  return inflight;
}
