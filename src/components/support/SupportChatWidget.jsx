import React, { useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, X, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ensureCustomerConversation, useSupportMessages } from '../../hooks/useSupportChat';

const MAX_LEN = 8000;

export default function SupportChatWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [bootError, setBootError] = useState(null);
  const [booting, setBooting] = useState(false);
  const [draft, setDraft] = useState('');
  const [sendErr, setSendErr] = useState(null);
  const listRef = useRef(null);

  const { messages, loading, error, sendMessage } = useSupportMessages(conversation?.id, user);

  useEffect(() => {
    if (!open || !user?.id) return;
    let cancelled = false;
    setBooting(true);
    setBootError(null);
    (async () => {
      const { conversation: conv, error: err } = await ensureCustomerConversation(user);
      if (cancelled) return;
      setBooting(false);
      if (err) {
        setBootError(typeof err === 'string' ? err : '대화를 불러오지 못했습니다.');
        setConversation(null);
      } else {
        setConversation(conv);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, user]);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, open]);

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

  if (!user?.id) return null;

  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        aria-controls="support-chat-panel"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-5 right-5 z-[190] flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-gradient-to-br from-slate-800 to-slate-900 text-cyan-300 shadow-lg shadow-black/40 transition hover:from-slate-700 hover:to-slate-800 hover:text-cyan-200"
      >
        {open ? <X className="h-6 w-6" aria-hidden /> : <MessageCircle className="h-6 w-6" aria-hidden />}
        <span className="sr-only">{open ? '문의창 닫기' : '운영팀에게 문의하기'}</span>
      </button>

      {open && (
        <div
          id="support-chat-panel"
          className="fixed bottom-[5.25rem] right-5 z-[190] flex w-[min(100vw-2.5rem,22rem)] flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-950/95 shadow-2xl shadow-black/50 backdrop-blur-md"
          role="dialog"
          aria-label="운영팀 1:1 문의"
        >
          <div className="border-b border-white/10 bg-slate-900/90 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-wide text-cyan-300/90">Brand Slam</p>
            <p className="text-sm font-bold text-white">운영팀에게 문의</p>
            <p className="mt-0.5 text-[11px] leading-snug text-slate-400">
              사이트 이용·캠페인 관련 질문을 남겨 주시면 담당자가 확인 후 답변 드립니다.
            </p>
          </div>

          <div ref={listRef} className="max-h-[min(52vh,320px)] min-h-[200px] flex-1 space-y-2 overflow-y-auto px-3 py-3">
            {booting || loading ? (
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
}
