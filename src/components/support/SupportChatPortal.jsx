import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useAdminSession } from '../../hooks/useAdminSession';
import SupportChatWidget from './SupportChatWidget';

/**
 * 로그인 고객에게만 플로팅 문의 위젯 (관리자 계정은 대시보드·/admin/support 사용)
 */
export default function SupportChatPortal() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminSession();

  if (authLoading || adminLoading) return null;
  if (!user || isAdmin) return null;

  return <SupportChatWidget />;
}
