import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import SupportChatWidget from './SupportChatWidget';
import KakaoFloatingButton from './KakaoFloatingButton';

/**
 * 우측 하단: 카카오 + (로그인 고객) 1:1 문의를 한 세로축(items-center)에 정렬합니다.
 * 화살표로 전체 스택을 접어 콘텐츠 가리지 않도록 할 수 있습니다.
 */
export default function SupportChatPortal() {
  const { user, loading: authLoading } = useAuth();
  const [stackVisible, setStackVisible] = useState(true);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="pointer-events-none fixed bottom-10 right-10 z-[9999] flex flex-row-reverse items-end gap-2">
      <button
        type="button"
        onClick={() => setStackVisible((v) => !v)}
        className="pointer-events-auto mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/25 bg-slate-900/95 text-white shadow-[0_8px_28px_rgba(0,0,0,0.35)] backdrop-blur-sm transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2"
        aria-expanded={stackVisible}
        aria-controls="support-floating-stack"
        aria-label={stackVisible ? '카카오·1:1 문의 버튼 접기' : '카카오·1:1 문의 버튼 펼치기'}
      >
        {stackVisible ? (
          <ChevronRight className="h-5 w-5 rotate-180 shrink-0" aria-hidden />
        ) : (
          <ChevronRight className="h-5 w-5 shrink-0" aria-hidden />
        )}
      </button>
      <div
        id="support-floating-stack"
        className={`flex flex-col items-center gap-3 transition-all duration-300 ease-out ${
          stackVisible ? 'pointer-events-auto translate-x-0 opacity-100' : 'pointer-events-none w-0 translate-x-4 opacity-0 overflow-hidden'
        }`}
        aria-hidden={!stackVisible}
      >
        {!authLoading && user && stackVisible ? <SupportChatWidget /> : null}
        {stackVisible ? <KakaoFloatingButton /> : null}
      </div>
    </div>,
    document.body,
  );
}
