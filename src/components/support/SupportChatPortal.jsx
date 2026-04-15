import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import SupportChatWidget from './SupportChatWidget';

/**
 * 로그인 사용자에게 문의 위젯을 마운트합니다.
 * 관리자 여부 판별은 위젯 내부에서 처리(API 지연 시에도 고객 화면에서 플로터가 사라지지 않도록 함).
 */
export default function SupportChatPortal() {
  const { user, loading: authLoading } = useAuth();

  if (authLoading || !user) return null;

  return <SupportChatWidget />;
}
