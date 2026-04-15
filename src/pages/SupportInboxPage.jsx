import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, Loader2, MessageCircle, Send } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { useAuth } from '../contexts/AuthContext';
import { useAdminSession } from '../hooks/useAdminSession';
import { fetchStaffConversations, useSupportMessages } from '../hooks/useSupportChat';

const MAX_LEN = 8000;

export default function SupportInboxPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminSession();
  const [rows, setRows] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [draft, setDraft] = useState('');
  const [sendErr, setSendErr] = useState(null);
  const listRef = useRef(null);

  const selected = rows.find((r) => r.id === selectedId) || null;
  const { messages, loading: msgLoading, error: msgError, sendMessage, reload } = useSupportMessages(
    selectedId,
    user,
  );

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login', { replace: true, state: { from: '/admin/support' } });
      return;
    }
    if (adminLoading) return;
    if (!isAdmin) {
      navigate('/dashboard', { replace: true });
    }
  }, [authLoading, adminLoading, user, isAdmin, navigate]);

  const refreshList = async () => {
    setListError(null);
    const { rows: next, error } = await fetchStaffConversations();
    if (error) {
      setListError(error);
      setRows([]);
    } else {
      setRows(next);
    }
    setListLoading(false);
  };

  useEffect(() => {
    if (!user || !isAdmin || adminLoading) return;
    refreshList();
  }, [user, isAdmin, adminLoading]);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, selectedId]);

  const handleSend = async (e) => {
    e.preventDefault();
    setSendErr(null);
    const text = draft.trim();
    if (!text || !user?.id || !selectedId) return;
    if (text.length > MAX_LEN) {
      setSendErr(`메시지는 ${MAX_LEN}자 이하로 보내 주세요.`);
      return;
    }
    const { error: err } = await sendMessage(text);
    if (err) setSendErr(typeof err === 'string' ? err : '전송에 실패했습니다.');
    else {
      setDraft('');
      refreshList();
    }
  };

  if (authLoading || adminLoading || !user || !isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
            대시보드
          </Link>
          <span className="text-slate-600">/</span>
          <h1 className="text-xl font-black text-white">고객 1:1 문의</h1>
        </div>

        <p className="mb-6 max-w-2xl text-sm text-slate-400">
          고객이 사이트 플로팅 채팅으로 남긴 문의가 여기에 모입니다. DB 마이그레이션 후{' '}
          <code className="rounded bg-white/10 px-1 text-xs text-cyan-200">support_chat_staff</code>에
          본인 <code className="rounded bg-white/10 px-1 text-xs">user_id</code>가 있어야 목록·답변이
          됩니다.
        </p>

        <div className="grid min-h-[480px] gap-4 lg:grid-cols-[minmax(0,280px)_1fr]">
          <section className="rounded-2xl border border-white/10 bg-slate-900/50 overflow-hidden flex flex-col">
            <div className="border-b border-white/10 px-4 py-3 flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-cyan-300" />
              <span className="text-sm font-bold">대화 목록</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {listLoading ? (
                <div className="flex justify-center py-8 text-slate-500">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : listError ? (
                <p className="p-3 text-xs text-amber-200">{listError}</p>
              ) : rows.length === 0 ? (
                <p className="p-3 text-xs text-slate-500">아직 문의가 없습니다.</p>
              ) : (
                <ul className="space-y-1">
                  {rows.map((r) => {
                    const active = r.id === selectedId;
                    return (
                      <li key={r.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedId(r.id);
                            setDraft('');
                            setSendErr(null);
                          }}
                          className={`w-full rounded-xl px-3 py-2.5 text-left text-xs transition ${
                            active
                              ? 'bg-cyan-500/20 border border-cyan-400/40 text-white'
                              : 'border border-transparent hover:bg-white/5 text-slate-300'
                          }`}
                        >
                          <p className="font-bold truncate">{r.customer_email || r.customer_user_id}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5 font-mono truncate">{r.id}</p>
                          {r.last_message_at && (
                            <p className="text-[10px] text-slate-500 mt-1">
                              {new Date(r.last_message_at).toLocaleString('ko-KR')}
                            </p>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-slate-900/40 flex flex-col min-h-[420px]">
            {!selectedId ? (
              <div className="flex flex-1 items-center justify-center text-sm text-slate-500">
                왼쪽에서 대화를 선택하세요.
              </div>
            ) : (
              <>
                <div className="border-b border-white/10 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500">고객</p>
                    <p className="text-sm font-bold truncate">
                      {selected?.customer_email || selected?.customer_user_id}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => reload()}
                    className="text-xs font-bold text-cyan-300 hover:text-cyan-200"
                  >
                    새로고침
                  </button>
                </div>
                <div ref={listRef} className="flex-1 overflow-y-auto space-y-2 px-3 py-3">
                  {msgLoading ? (
                    <div className="flex justify-center py-10 text-slate-500">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : msgError ? (
                    <p className="text-xs text-amber-200">{msgError}</p>
                  ) : (
                    messages.map((m) => {
                      const mine = m.sender_id === user.id;
                      return (
                        <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
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
                      placeholder="답장 입력…"
                      className="min-h-[44px] flex-1 resize-none rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/30"
                    />
                    <button
                      type="submit"
                      disabled={!draft.trim()}
                      className="shrink-0 self-end rounded-xl bg-cyan-500 px-3 py-2 text-white disabled:opacity-40 hover:bg-cyan-400"
                      aria-label="보내기"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </form>
              </>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
