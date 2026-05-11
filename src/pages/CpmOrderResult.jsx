import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

export default function CpmOrderResult() {
  const [params] = useSearchParams();
  const success = params.get('success') === '1';
  const orderNumber = params.get('order_number') || '';
  const msg = params.get('msg') || '';

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-xl mx-auto px-4 py-24 w-full">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
          {success ? (
            <CheckCircle2 className="mx-auto text-emerald-400 mb-4" size={48} aria-hidden />
          ) : (
            <XCircle className="mx-auto text-rose-400 mb-4" size={48} aria-hidden />
          )}
          <h1 className="text-xl font-black tracking-tight text-white mb-2">
            {success ? 'CPM 결제가 완료되었습니다' : '결제가 완료되지 않았습니다'}
          </h1>
          {orderNumber ? (
            <p className="text-xs font-mono text-cyan-200/90 break-all">{orderNumber}</p>
          ) : null}
          {msg ? (
            <p className="mt-4 text-sm text-slate-400 leading-relaxed whitespace-pre-wrap">{msg}</p>
          ) : null}
          {!success ? (
            <p className="mt-6 text-xs text-slate-500 leading-relaxed">
              창만 닫힌 경우에도 카드 정보가 처리 중일 수 있습니다. 카드 빌링 내역과 주문 상태를 확인해 주세요.
            </p>
          ) : null}
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/cpm"
              className="px-6 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 font-bold text-sm text-white"
            >
              CPM 홈
            </Link>
            <Link
              to="/dashboard"
              className="px-6 py-3 rounded-xl border border-white/20 hover:bg-white/5 font-bold text-sm"
            >
              대시보드
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
