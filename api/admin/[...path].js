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
import { segmentsAfterNamespace } from '../../server/lib/api-catch-all-segments.js';

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

export default async function handler(req, res) {
  const segments = segmentsAfterNamespace(req, 'admin');
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
