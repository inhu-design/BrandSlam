/**
 * 관리자가 생성한 고객 로그인 링크 처리
 * /auth/impersonate?token_hash=xxx
 * - token_hash로 verifyOtp 호출 → 고객 세션 생성 → 대시보드로 리다이렉트
 */
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2, AlertCircle } from 'lucide-react';

export default function Impersonate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tokenHash = searchParams.get('token_hash');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tokenHash) {
      setError('유효하지 않은 링크입니다.');
      setLoading(false);
      return;
    }

    const verify = async () => {
      try {
        const { data, error: err } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: 'magiclink',
        });
        if (err) throw err;
        if (data?.session) {
          navigate('/dashboard', { replace: true });
        } else {
          setError('세션 생성에 실패했습니다.');
        }
      } catch (e) {
        console.error('[Impersonate]', e);
        setError(e?.message || '로그인 처리 중 오류가 발생했습니다. 링크가 만료되었을 수 있습니다.');
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [tokenHash, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#020617] text-white">
        <Loader2 className="w-12 h-12 animate-spin text-cyan-500 mb-4" />
        <p className="text-slate-400">고객 화면으로 로그인 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#020617] text-white px-4">
        <div className="max-w-md w-full bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-300 mb-2">로그인 실패</h2>
          <p className="text-slate-400 text-sm mb-6">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl font-medium transition-all"
          >
            대시보드로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return null;
}
