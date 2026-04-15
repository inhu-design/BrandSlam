/** index.html 기본 탭 제목과 동기 (미읽음 접두사 제거용) */
export const SUPPORT_CHAT_BASE_TAB_TITLE = 'slam-global';

export function stripUnreadTitlePrefix(title) {
  return String(title || '').replace(/^\(\d{1,3}\)\s+/, '').trim() || SUPPORT_CHAT_BASE_TAB_TITLE;
}

export function applyUnreadTabTitle(unreadCount) {
  if (typeof document === 'undefined') return;
  const base = SUPPORT_CHAT_BASE_TAB_TITLE;
  document.title = unreadCount > 0 ? `(${Math.min(unreadCount, 99)}) ${base}` : base;
}

export function notifyStaffMessage({ body, tag = 'support-chat' }) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  const text = String(body || '').trim().slice(0, 120) || '새 답변이 도착했습니다.';
  try {
    const n = new Notification('SLAM GLOBAL · 운영팀 답변', {
      body: text,
      tag,
      renotify: true,
      silent: false,
    });
    n.onclick = () => {
      window.focus();
      n.close();
    };
  } catch {
    /* 일부 환경에서 Notification 생성 실패 무시 */
  }
}

export async function requestSupportChatNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return { supported: false, permission: 'unsupported' };
  }
  if (Notification.permission === 'granted') {
    return { supported: true, permission: 'granted' };
  }
  if (Notification.permission === 'denied') {
    return { supported: true, permission: 'denied' };
  }
  try {
    const permission = await Notification.requestPermission();
    return { supported: true, permission };
  } catch {
    return { supported: true, permission: Notification.permission };
  }
}
