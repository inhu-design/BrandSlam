/**
 * SupportChatPortal 스택: bottom-10 + 카카오(h-16) + gap-3 + 1:1 버튼(h-14) — 패널 bottom 산출용
 * (버튼/카카오 높이를 바꾸면 이 rem 값과 Tailwind 클래스를 함께 맞출 것)
 */
export const FLOAT_RIGHT_CLASS = 'right-10';
/** 스택 전체의 viewport 하단 오프셋 = bottom-10 */
export const FLOAT_KAKAO_BOTTOM_REM = 2.5;
/** 카카오 이미지 한 변 = 4rem (w-16 h-16) */
export const FLOAT_KAKAO_SIZE_REM = 4;
/** 스택 요소 사이 간격 = gap-3 */
export const FLOAT_GAP_REM = 0.75;
/** 1:1 문의 pill 높이 ≈ h-14 */
export const FLOAT_CHAT_BUTTON_REM = 3.5;

/** 채팅 패널 bottom = 1:1 버튼 위(열림 시 패널이 버튼·카카오와 겹치지 않도록) */
export function floatingChatPanelBottomStyle() {
  return {
    bottom: `calc(${FLOAT_KAKAO_BOTTOM_REM}rem + ${FLOAT_KAKAO_SIZE_REM}rem + ${FLOAT_GAP_REM}rem + ${FLOAT_CHAT_BUTTON_REM}rem + ${FLOAT_GAP_REM}rem)`,
  };
}
