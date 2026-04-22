import React from 'react';
import kakaoLogo from '../../assets/kakaotalk.png';

/**
 * 우측 하단 플로팅 스택 안에서만 사용 (fixed 아님 — 부모 스택이 위치 담당)
 */
export default function KakaoFloatingButton() {
  return (
    <a
      href="http://pf.kakao.com/_VxmWxon/chat"
      target="_blank"
      rel="noopener noreferrer"
      className="pointer-events-auto group relative block size-16 shrink-0 overflow-hidden rounded-xl shadow-[0_8px_28px_rgba(0,0,0,0.35)] ring-2 ring-black/10 transition-transform duration-300 hover:scale-105 hover:ring-yellow-300/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
      aria-label="카카오톡으로 실시간 상담"
    >
      <img
        src={kakaoLogo}
        alt=""
        className="block size-full rounded-xl object-cover"
        width={64}
        height={64}
        decoding="async"
      />
      <span className="sr-only">카카오톡 실시간 톡상담</span>
      <div className="pointer-events-none absolute right-full mr-3 top-1/2 hidden -translate-y-1/2 rounded-full border border-white/10 bg-slate-900/90 px-4 py-2 text-[10px] font-black tracking-[0.2em] text-white opacity-0 shadow-lg backdrop-blur-md transition-opacity duration-300 group-hover:opacity-100 sm:block whitespace-nowrap">
        실시간 톡상담
      </div>
    </a>
  );
}
