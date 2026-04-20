import { Navigate } from 'react-router-dom';

/** @deprecated App 라우트에서 /dashboard 로 병합됨. 북마크 호환용 re-export */
export default function AdminInvoicesPage() {
  return <Navigate to="/dashboard" replace state={{ adminPanel: 'all_invoices' }} />;
}
