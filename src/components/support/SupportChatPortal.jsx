import React from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../contexts/AuthContext';
import SupportChatWidget from './SupportChatWidget';
import KakaoFloatingButton from './KakaoFloatingButton';

/**
 * 우측 하단: 카카오 + (로그인 고객) 1:1 문의를 한 세로축(items-center)에 정렬합니다.
 * 관리자 여부는 위젯 내부에서 처리합니다.
 */
export default function SupportChatPortal() {
  const { user, loading: authLoading } = useAuth();

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="pointer-events-none fixed bottom-10 right-10 z-[9999] flex flex-col items-center gap-3">
      {!authLoading && user ? <SupportChatWidget /> : null}
      <KakaoFloatingButton />
    </div>,
    document.body,
  );
}
