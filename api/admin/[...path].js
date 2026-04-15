/**
 * Hobby 플랜: 서버리스 함수 개수 제한 대응 — /api/admin/* 를 단일 함수로 라우팅
 * URL은 기존과 동일 (예: GET /api/admin/dashboard-overview)
 */
import dashboardOverview from '../../server/admin-handlers/dashboard-overview.js';
import orderUpdate from '../../server/admin-handlers/order-update.js';
import campaignSchedule from '../../server/admin-handlers/campaign-schedule.js';
import signupOnlyUsers from '../../server/admin-handlers/signup-only-users.js';
import customPaymentOffers from '../../server/admin-handlers/custom-payment-offers.js';
import recentOrders from '../../server/admin-handlers/recent-orders.js';
import linkCustomerUser from '../../server/admin-handlers/link-customer-user.js';
import deliveryCreatorsImport from '../../server/admin-handlers/delivery-creators-import.js';
import campaignUpdate from '../../server/admin-handlers/campaign-update.js';
import campaignRuntimeSettings from '../../server/admin-handlers/campaign-runtime-settings.js';
import impersonateLogin from '../../server/admin-handlers/impersonate-login.js';
import campaignCreate from '../../server/admin-handlers/campaign-create.js';
import campaignDelete from '../../server/admin-handlers/campaign-delete.js';
import adminSession from '../../server/admin-handlers/admin-session.js';

const handlers = {
  'dashboard-overview': dashboardOverview,
  'order-update': orderUpdate,
  'campaign-schedule': campaignSchedule,
  'signup-only-users': signupOnlyUsers,
  'custom-payment-offers': customPaymentOffers,
  'recent-orders': recentOrders,
  'link-customer-user': linkCustomerUser,
  'delivery-creators-import': deliveryCreatorsImport,
  'campaign-update': campaignUpdate,
  'campaign-runtime-settings': campaignRuntimeSettings,
  'impersonate-login': impersonateLogin,
  'campaign-create': campaignCreate,
  'campaign-delete': campaignDelete,
  'admin-session': adminSession,
};

/**
 * 비-Next(Vite 등)에서 Vercel은 catch-all 쿼리 키를 `path`가 아니라 `...path`로 넣는다.
 * @see https://github.com/vercel/community/discussions/947
 */
function segmentsFromQuery(query) {
  const q = query || {};
  const p = q.path ?? q['...path'];
  if (p == null || p === '') return [];
  return Array.isArray(p) ? p : [p];
}

function segmentsFromUrl(req) {
  try {
    const raw = req.url || '/';
    const pathOnly = raw.split('?')[0] || '/';
    const parts = pathOnly.split('/').filter(Boolean);
    const adminIdx = parts.indexOf('admin');
    if (adminIdx < 0 || adminIdx >= parts.length - 1) return [];
    return parts.slice(adminIdx + 1);
  } catch {
    return [];
  }
}

export default async function handler(req, res) {
  let segments = segmentsFromQuery(req.query || {});
  if (segments.length === 0) {
    segments = segmentsFromUrl(req);
  }
  if (segments.length !== 1) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.status(404).json({ error: 'Not found' });
  }
  const key = String(segments[0] || '').trim();
  const fn = handlers[key];
  if (!fn) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.status(404).json({ error: 'Not found' });
  }
  return fn(req, res);
}
