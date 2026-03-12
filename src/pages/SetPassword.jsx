import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Mail, Loader2, ChevronLeft, CheckCircle2 } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function SetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const from = searchParams.get('from') || '/dashboard';
  const { user, loading: authLoading } = useAuth();
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login', { state: { from: '/set-password', returnTo: from }, replace: true });
      return;
    }
    if (user?.user_metadata?.password_set) {
      navigate(from, { replace: true });
    }
  }, [user, authLoading, navigate, from]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) {
      alert('비밀번호는 8자 이상이어야 합니다.');
      return;
    }
    if (password !== passwordConfirm) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }
    setSubmitting(true);
    try {
      const { error: err1 } = await supabase.auth.updateUser({ password });
      if (err1) throw err1;
      await supabase.auth.updateUser({
        data: { ...(user?.user_metadata || {}), password_set: true },
      });
      setDone(true);
      setTimeout(() => navigate(from, { replace: true }), 1500);
    } catch (err) {
      alert(err?.message || '설정에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    navigate(from, { replace: true });
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020617]">
        <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
      </div>
    );
  }

  if (user?.user_metadata?.password_set) return null;

  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4 py-24">
        <div className="w-full max-w-md">
          <button
            onClick={handleSkip}
            className="mb-6 flex items-center text-sm text-slate-500 hover:text-white transition-colors"
          >
            <ChevronLeft size={20} className="mr-1" />
            건너뛰기
          </button>

          {done ? (
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 text-center animate-fade-in-up">
              <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={28} />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">비밀번호가 설정되었어요</h2>
              <p className="text-slate-400 text-sm">다음부터는 이메일 + 비밀번호로 로그인할 수 있습니다.</p>
              <p className="text-slate-500 text-xs mt-4">잠시 후 대시보드로 이동합니다...</p>
            </div>
          ) : (
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-3xl p-8 md:p-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                  <Lock size={24} className="text-purple-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-white tracking-tight">비밀번호 설정</h1>
                  <p className="text-slate-500 text-sm mt-0.5">한 번만 설정하면 됩니다</p>
                </div>
              </div>
              <p className="text-slate-400 text-sm mb-6 mt-4">
                설정해두시면 다음 로그인부터는 <strong className="text-slate-300">이메일 + 비밀번호</strong>만으로
                바로 들어올 수 있어요. 매번 메일을 확인하지 않아도 됩니다.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">이메일</label>
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 text-sm">
                    <Mail size={18} />
                    {user?.email}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">비밀번호 (8자 이상)</label>
                  <input
                    type="password"
                    placeholder="비밀번호 입력"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-purple-500 outline-none transition-all"
                    required
                    minLength={8}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">비밀번호 확인</label>
                  <input
                    type="password"
                    placeholder="비밀번호 다시 입력"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-purple-500 outline-none transition-all"
                    required
                  />
                  {password && passwordConfirm && password !== passwordConfirm && (
                    <p className="text-red-400 text-sm font-medium mt-1">비밀번호가 일치하지 않습니다.</p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={submitting || password.length < 8 || password !== passwordConfirm}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold hover:shadow-[0_0_20px_rgba(147,51,234,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : '설정 완료'}
                </button>
              </form>

              <button
                type="button"
                onClick={handleSkip}
                className="w-full mt-4 py-3 text-slate-500 hover:text-slate-300 text-sm font-medium transition-colors"
              >
                나중에 할게요
              </button>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
