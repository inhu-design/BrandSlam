/**
 * Footer 카카오 플로팅(`right-10 bottom-10`, 이미지 w-16 h-16)과
 * SupportChatWidget 1:1 버튼의 우측·하단 기준을 동일하게 맞춘다.
 * (inline style 의 rem 과 Tailwind 의 spacing 이 어긋나지 않도록 클래스 기준 통일)
 */
export const FLOAT_RIGHT_CLASS = 'right-10';
/** 카카오 버튼 하단 = bottom-10 = 2.5rem */
export const FLOAT_KAKAO_BOTTOM_REM = 2.5;
/** 카카오 이미지 한 변 = 4rem (w-16) */
export const FLOAT_KAKAO_SIZE_REM = 4;
/** 카카오 ↔ 1:1 버튼 사이 간격 */
export const FLOAT_GAP_REM = 0.75;
/** 1:1 FAB 기본 높이(닫기/문의 pill, 대략 w-16 높이에 맞춤) */
export const FLOAT_CHAT_BUTTON_REM = 4;

/** 1:1 문의 버튼 컨테이너 bottom = 카카오 위 */
export function floatingChatWrapperBottomStyle() {
  return {
    bottom: `calc(${FLOAT_KAKAO_BOTTOM_REM}rem + ${FLOAT_KAKAO_SIZE_REM}rem + ${FLOAT_GAP_REM}rem)`,
  };
}

/** 채팅 패널 bottom = 1:1 버튼 위 */
export function floatingChatPanelBottomStyle() {
  return {
    bottom: `calc(${FLOAT_KAKAO_BOTTOM_REM}rem + ${FLOAT_KAKAO_SIZE_REM}rem + ${FLOAT_GAP_REM}rem + ${FLOAT_CHAT_BUTTON_REM}rem + ${FLOAT_GAP_REM}rem)`,
  };
}
