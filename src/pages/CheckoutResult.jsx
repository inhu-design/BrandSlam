import React, { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle, ExternalLink } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

export default function CheckoutResult() {
  const [searchParams] = useSearchParams();
  const success = searchParams.get('success') === '1';
  const orderNumber = searchParams.get('order_number') || '';
  const msg = searchParams.get('msg') || '';
  const tid = searchParams.get('tid') || '';

  useEffect(() => {
    if (window.opener) {
      if (success && orderNumber) {
        window.opener.postMessage(
          { type: 'INICIS_PAYMENT_SUCCESS', order_number: orderNumber },
          window.location.origin
        );
      }
      setTimeout(() => {
        if (window.opener) {
          window.opener.location.href = `${window.location.pathname}${window.location.search}`;
        }
        window.close();
      }, 100);
    }
  }, [success, orderNumber]);

  return (
    <div className="font-sans antialiased text-white bg-[#020617] min-h-screen flex flex-col selection:bg-purple-500/30">
      <Navbar />
      <div className="flex-1 pt-36 pb-24 px-4">
        <div className="max-w-lg mx-auto text-center">
          {success ? (
            <>
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping opacity-50" />
                <div className="relative w-full h-full bg-green-500/10 border border-green-500/30 rounded-full flex items-center justify-center">
                  <CheckCircle2 size={40} className="text-green-400" />
                </div>
              </div>
              <h1 className="text-2xl font-black text-white mb-3">결제가 완료되었습니다</h1>
              <p className="text-slate-400 mb-6">
                신용카드 결제가 정상적으로 처리되었습니다.<br />
                캠페인 대시보드에서 진행 상황을 확인하실 수 있습니다.
              </p>
              {orderNumber && (
                <p className="text-sm text-slate-500 mb-2">주문번호: {orderNumber}</p>
              )}
              {tid && (
                <p className="text-sm text-emerald-400/80 mb-8 font-mono">PG 승인번호(TID): {tid}</p>
              )}
              {success && orderNumber && !tid && (
                <p className="text-sm text-amber-400/90 mb-8">
                  PG 승인번호가 없습니다. 카드 앱에 결제 알림이 없다면 실제 승인되지 않았을 수 있습니다.
                </p>
              )}
            </>
          ) : (
            <>
              <div className="w-20 h-20 mx-auto mb-6 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center">
                <XCircle size={40} className="text-red-400" />
              </div>
              <h1 className="text-2xl font-black text-white mb-3">결제에 실패했습니다</h1>
              <p className="text-slate-400 mb-6">
                {msg || '결제가 완료되지 않았거나 취소되었습니다.'}<br />
                문제가 반복되면 고객센터로 문의해 주세요.
              </p>
            </>
          )}

          <div className="space-y-3">
            <Link
              to="/dashboard"
              className="w-full py-4 rounded-2xl font-bold text-lg bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:-translate-y-0.5 shadow-lg shadow-purple-500/20 transition-all flex items-center justify-center gap-2"
            >
              캠페인 대시보드 <ExternalLink size={18} />
            </Link>
            <Link
              to="/"
              className="w-full py-4 rounded-2xl font-bold text-slate-300 bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex items-center justify-center"
            >
              메인으로
            </Link>
          </div>

          {window.opener && (
            <p className="text-sm text-slate-500 mt-8">이 창을 닫아도 됩니다.</p>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
