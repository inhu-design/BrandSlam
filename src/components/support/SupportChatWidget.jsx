import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MessageCircle, Send, X, Loader2, Bell, BellOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useAdminSession } from '../../hooks/useAdminSession';
import { ensureCustomerConversation, useSupportMessages } from '../../hooks/useSupportChat';
import {
  SUPPORT_CHAT_BASE_TAB_TITLE,
  applyUnreadTabTitle,
  notifyStaffMessage,
  requestSupportChatNotificationPermission,
  stripUnreadTitlePrefix,
} from '../../lib/supportChatNotify';

const MAX_LEN = 8000;
const READ_PREFIX = 'bs_support_last_read_';

/** 카카오(Footer: bottom-10 right-10, h-16) 위에 문의 FAB·패널을 쌓음. inset은 인라인으로 고정해 LTR/레이아웃 간섭 방지 */
const FAB_FIXED_STYLE = {
  position: 'fixed',
  left: 'auto',
  right: '2.5rem',
  bottom: '7.25rem',
  zIndex: 9999,
};
const PANEL_FIXED_STYLE = {
  position: 'fixed',
  left: 'auto',
  right: '2.5rem',
  bottom: '11.25rem',
  zIndex: 9999,
};

export default function SupportChatWidget() {
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminSession();
  const [open, setOpen] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [bootError, setBootError] = useState(null);
  const [booting, setBooting] = useState(true);
  const [draft, setDraft] = useState('');
  const [sendErr, setSendErr] = useState(null);
  const [lastReadAt, setLastReadAt] = useState(0);
  const [notifyPerm, setNotifyPerm] = useState(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported',
  );
  const listRef = useRef(null);
  const prevLastMessageIdRef = useRef(null);
  const baseTitleRef = useRef(SUPPORT_CHAT_BASE_TAB_TITLE);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    baseTitleRef.current = stripUnreadTitlePrefix(document.title) || SUPPORT_CHAT_BASE_TAB_TITLE;
  }, []);

  useEffect(() => {
    if (!user?.id) {
      queueMicrotask(() => {
        setConversation(null);
        setBooting(false);
      });
      return undefined;
    }
    let cancelled = false;
    const boot = () => {
      if (cancelled) return;
      setBooting(true);
      setBootError(null);
      (async () => {
        const { conversation: conv, error: err } = await ensureCustomerConversation(user);
        if (cancelled) return;
        queueMicrotask(() => {
          if (cancelled) return;
          setBooting(false);
          if (err) {
            setBootError(typeof err === 'string' ? err : '대화를 불러오지 못했습니다.');
            setConversation(null);
          } else {
            setConversation(conv);
          }
        });
      })();
    };
    queueMicrotask(boot);
    return () => {
      cancelled = true;
    };
  }, [user]);

  const { messages, loading, error, sendMessage } = useSupportMessages(
    conversation?.id,
    user,
    0,
  );

  const readKey =
    user?.id && conversation?.id ? `${READ_PREFIX}${user.id}_${conversation.id}` : null;

  useEffect(() => {
    if (!readKey || typeof window === 'undefined') return;
    queueMicrotask(() => {
      try {
        const s = window.localStorage.getItem(readKey);
        setLastReadAt(s ? new Date(s).getTime() : 0);
      } catch {
        setLastReadAt(0);
      }
    });
  }, [readKey]);

  useEffect(() => {
    if (!open || !user?.id || !conversation?.id || !readKey) return;
    const t =
      messages.length > 0
        ? Math.max(...messages.map((m) => new Date(m.created_at || 0).getTime()))
        : Date.now();
    queueMicrotask(() => {
      try {
        window.localStorage.setItem(readKey, new Date(t).toISOString());
      } catch {
        /* ignore quota */
      }
      setLastReadAt(t);
    });
  }, [open, messages, user?.id, conversation?.id, readKey]);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, open]);

  const unreadCount =
    !user?.id
      ? 0
      : messages.filter((m) => {
          if (m.sender_id === user.id) return false;
          const ts = new Date(m.created_at || 0).getTime();
          return ts > lastReadAt;
        }).length;

  useEffect(() => {
    if (!adminLoading && isAdmin) {
      if (typeof document !== 'undefined') {
        document.title = SUPPORT_CHAT_BASE_TAB_TITLE;
      }
      return;
    }
    applyUnreadTabTitle(unreadCount);
  }, [unreadCount, adminLoading, isAdmin]);

  useEffect(() => {
    return () => {
      if (typeof document !== 'undefined') {
        document.title = baseTitleRef.current || SUPPORT_CHAT_BASE_TAB_TITLE;
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    queueMicrotask(() => {
      setNotifyPerm(Notification.permission);
    });
  }, []);

  useEffect(() => {
    prevLastMessageIdRef.current = null;
  }, [readKey]);

  useEffect(() => {
    if (!messages.length || !user?.id) return;
    const last = messages[messages.length - 1];
    if (!last?.id) return;

    if (prevLastMessageIdRef.current === null) {
      prevLastMessageIdRef.current = last.id;
      return;
    }
    if (last.id === prevLastMessageIdRef.current) return;

    prevLastMessageIdRef.current = last.id;

    if (last.sender_id === user.id) return;

    const shouldPing = !open || (typeof document !== 'undefined' && document.hidden);
    if (shouldPing && Notification.permission === 'granted') {
      notifyStaffMessage({ body: last.body, tag: `support-${last.id}` });
    }
  }, [messages, user?.id, open]);

  const handleSend = async (e) => {
    e.preventDefault();
    setSendErr(null);
    const text = draft.trim();
    if (!text || !user?.id) return;
    if (text.length > MAX_LEN) {
      setSendErr(`메시지는 ${MAX_LEN}자 이하로 보내 주세요.`);
      return;
    }
    const { error: err } = await sendMessage(text);
    if (err) setSendErr(typeof err === 'string' ? err : '전송에 실패했습니다.');
    else setDraft('');
  };

  const handleEnableNotify = async () => {
    const { supported, permission } = await requestSupportChatNotificationPermission();
    if (!supported) {
      alert('이 브라우저에서는 알림을 사용할 수 없습니다.');
      return;
    }
    setNotifyPerm(permission);
    if (permission === 'denied') {
      alert('브라우저 설정에서 이 사이트의 알림을 허용해 주세요.');
    }
  };

  if (!user?.id) return null;
  if (!adminLoading && isAdmin) return null;

  const floatingUi = (
    <>
      <button
        type="button"
        aria-expanded={open}
        aria-controls="support-chat-panel"
        onClick={() => setOpen((v) => !v)}
        style={FAB_FIXED_STYLE}
        className="relative flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-gradient-to-br from-slate-800 to-slate-900 text-cyan-300 shadow-lg shadow-black/40 transition hover:from-slate-700 hover:to-slate-800 hover:text-cyan-200"
      >
        {!open && unreadCount > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-[22px] min-w-[22px] items-center justify-center rounded-full border-2 border-slate-950 bg-rose-500 px-1 text-[10px] font-black text-white tabular-nums shadow-md">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        ) : null}
        {open ? <X className="h-6 w-6" aria-hidden /> : <MessageCircle className="h-6 w-6" aria-hidden />}
        <span className="sr-only">{open ? '문의창 닫기' : '운영팀에게 문의하기'}</span>
      </button>

      {open && (
        <div
          id="support-chat-panel"
          style={PANEL_FIXED_STYLE}
          className="flex w-[min(100vw-2.5rem,22rem)] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-950/95 shadow-2xl shadow-black/50 backdrop-blur-md"
          role="dialog"
          aria-label="운영팀 1:1 문의"
        >
          <div className="border-b border-white/10 bg-slate-900/90 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-wide text-cyan-300/90">Brand Slam</p>
            <p className="text-sm font-bold text-white">운영팀에게 문의</p>
            <p className="mt-0.5 text-[11px] leading-snug text-slate-400">
              사이트 이용·캠페인 관련 질문을 남겨 주시면 담당자가 확인 후 답변 드립니다.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-black/25 px-3 py-2">
              {notifyPerm === 'unsupported' ? (
                <span className="text-[10px] text-slate-500 leading-snug">
                  이 브라우저에서는 알림 API를 사용할 수 없습니다. 탭 제목의 (숫자) 표시는 계속 됩니다.
                </span>
              ) : notifyPerm === 'granted' ? (
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-300/95">
                  <Bell size={12} aria-hidden /> 브라우저 알림 사용 중 · 다른 탭이어도 답변 시 알림
                </span>
              ) : notifyPerm === 'denied' ? (
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-amber-200/90">
                  <BellOff size={12} aria-hidden /> 알림이 꺼져 있음 — 브라우저 주소창 왼쪽 자물쇠에서 허용해 주세요
                </span>
              ) : (
                <>
                  <span className="text-[10px] text-slate-400 leading-snug">
                    운영진 답변 시 탭 제목에 (1)이 붙고, 아래를 누르면 브라우저 알림도 받을 수 있습니다.
                  </span>
                  <button
                    type="button"
                    onClick={handleEnableNotify}
                    className="ml-auto inline-flex items-center gap-1 rounded-lg bg-cyan-600/90 px-2.5 py-1 text-[10px] font-black text-white hover:bg-cyan-500"
                  >
                    <Bell size={11} aria-hidden /> 알림 허용
                  </button>
                </>
              )}
            </div>
          </div>

          <div ref={listRef} className="max-h-[min(52vh,320px)] min-h-[200px] flex-1 space-y-2 overflow-y-auto px-3 py-3">
            {(booting && !conversation) || (loading && messages.length === 0 && conversation) ? (
              <div className="flex h-full items-center justify-center gap-2 text-slate-400">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-xs">불러오는 중…</span>
              </div>
            ) : bootError || error ? (
              <p className="text-xs leading-relaxed text-amber-200/90">
                {bootError || error}
                {bootError?.includes('row-level security') || error?.includes('row-level security')
                  ? ' (DB에 직원 등록·마이그레이션 적용 여부를 확인해 주세요.)'
                  : ''}
              </p>
            ) : messages.length === 0 ? (
              <p className="text-xs text-slate-500">첫 메시지를 보내 주시면 대화가 시작됩니다.</p>
            ) : (
              messages.map((m) => {
                const mine = m.sender_id === user.id;
                return (
                  <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[92%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                        mine
                          ? 'bg-cyan-600/90 text-white'
                          : 'border border-white/10 bg-white/[0.06] text-slate-100'
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{m.body}</p>
                      <p className={`mt-1 text-[10px] ${mine ? 'text-cyan-100/80' : 'text-slate-500'}`}>
                        {m.created_at
                          ? new Date(m.created_at).toLocaleString('ko-KR', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : ''}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <form onSubmit={handleSend} className="border-t border-white/10 bg-slate-900/80 p-3">
            {sendErr && <p className="mb-2 text-[11px] text-amber-300">{sendErr}</p>}
            <div className="flex gap-2">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={2}
                maxLength={MAX_LEN}
                placeholder="메시지 입력…"
                className="min-h-[44px] flex-1 resize-none rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/30"
              />
              <button
                type="submit"
                disabled={!draft.trim() || booting || !conversation}
                className="shrink-0 self-end rounded-xl bg-cyan-500 px-3 py-2 text-white disabled:opacity-40 hover:bg-cyan-400"
                aria-label="보내기"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(floatingUi, document.body);
}
