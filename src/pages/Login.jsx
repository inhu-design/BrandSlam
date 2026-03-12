import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, Lock, Loader2, ChevronLeft } from 'lucide-react'; // ChevronLeft 아이콘 추가
import { useNavigate, useLocation } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = location.state?.from || '/dashboard';
  const returnState = location.state?.checkoutState || null;
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [activeTab, setActiveTab] = useState('magic'); // 'magic' or 'password'
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

// 1. 매직 링크 로그인 (신규/기존 모두 가능)
const handleMagicLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // 기존: window.location.origin + '/dashboard', 
        // 수정: 메인 페이지로 리다이렉트 (404 방지용)
        emailRedirectTo: returnTo !== '/dashboard'
          ? `${window.location.origin}${returnTo}${returnState?.plan ? `?plan=${typeof returnState.plan === 'object' ? returnState.plan.id : returnState.plan}` : ''}`
          : window.location.origin, 
      },
    });
  
    if (error) alert(error.message);
    else setSent(true);
    
    setLoading(false);
  };
  // 2. 비밀번호 로그인 (비번 설정한 유저만)
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert("로그인 실패: 이메일이나 비밀번호를 확인해주세요.\n(아직 비밀번호를 설정하지 않았다면 '간편 로그인'을 이용하세요)");
    } else {
      navigate(returnTo, { state: returnState });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
        
        {/* [추가됨] 메인으로 돌아가기 버튼 */}
        <button 
          onClick={() => navigate('/')}
          className="mb-6 flex items-center text-sm text-gray-500 hover:text-black transition-colors"
        >
          <ChevronLeft size={20} className="mr-1" />
          메인으로
        </button>

        <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-900">로그인 / 회원가입</h2>
            <p className="text-slate-500 text-sm mt-2">
                이메일만 있으면 즉시 시작할 수 있습니다.<br/>
                설문이나 견적을 제출하지 않았어도 이용 가능합니다.
            </p>
        </div>

        {/* 탭 전환 버튼 */}
        <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
            <button 
                onClick={() => { setActiveTab('magic'); setSent(false); }}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'magic' ? 'bg-white text-black shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
                이메일 간편 로그인
            </button>
            <button 
                onClick={() => setActiveTab('password')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'password' ? 'bg-white text-black shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
                비밀번호 로그인
            </button>
        </div>

        {/* --- [TAB 1] 매직 링크 로그인 --- */}
        {activeTab === 'magic' && (
            <div>
                {sent ? (
                    <div className="bg-green-50 p-6 rounded-2xl text-center animate-fade-in-up">
                        <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Mail size={24} />
                        </div>
                        <h3 className="font-bold text-green-800 mb-1">메일을 확인해주세요!</h3>
                        <p className="text-green-700 text-sm">
                            <b>{email}</b>로 로그인 링크를 보냈습니다.<br/>
                            링크를 클릭하면 바로 로그인됩니다.
                        </p>
                        <p className="text-green-600/90 text-xs mt-3">
                            로그인 후 <strong>비밀번호를 한 번 설정</strong>해 두시면, 다음부터는 이메일+비밀번호만으로 로그인할 수 있고, 구매 시에도 비밀번호 입력이 더 간단해집니다.
                        </p>
                        <button onClick={() => setSent(false)} className="mt-4 text-xs text-green-600 underline">
                            이메일 다시 입력하기
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleMagicLogin} className="space-y-4 animate-fade-in-up">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">이메일 주소</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-4 text-slate-400" size={20}/>
                                <input
                                    type="email"
                                    placeholder="name@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full p-4 pl-12 rounded-xl border border-slate-200 focus:border-black outline-none transition-all"
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-black text-white rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : '로그인 링크 받기'}
                        </button>
                        <p className="text-xs text-center text-slate-400">
                            * 처음이신가요? 링크를 받으면 자동으로 가입됩니다. 로그인 후 한 번만 비밀번호를 설정해두시면, 다음부터는 이메일+비밀번호로 바로 로그인할 수 있어요.
                        </p>
                    </form>
                )}
            </div>
        )}

        {/* --- [TAB 2] 비밀번호 로그인 --- */}
        {activeTab === 'password' && (
            <form onSubmit={handlePasswordLogin} className="space-y-4 animate-fade-in-up">
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">이메일 주소</label>
                    <div className="relative">
                        <Mail className="absolute left-4 top-4 text-slate-400" size={20}/>
                        <input
                            type="email"
                            placeholder="name@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full p-4 pl-12 rounded-xl border border-slate-200 focus:border-black outline-none transition-all"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">비밀번호</label>
                    <div className="relative">
                        <Lock className="absolute left-4 top-4 text-slate-400" size={20}/>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full p-4 pl-12 rounded-xl border border-slate-200 focus:border-black outline-none transition-all"
                        />
                    </div>
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-black text-white rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    {loading ? <Loader2 className="animate-spin" /> : '로그인하기'}
                </button>
                <div className="text-center">
                    <button type="button" onClick={() => { setActiveTab('magic'); setSent(false); }} className="text-xs text-slate-400 hover:text-black underline">
                        비밀번호를 잊으셨나요? (간편 로그인 이용)
                    </button>
                </div>
            </form>
        )}
      </div>
    </div>
  );
}