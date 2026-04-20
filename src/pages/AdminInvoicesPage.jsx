import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, Loader2, Receipt, Search } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { useAuth } from '../contexts/AuthContext';
import { useAdminSession } from '../hooks/useAdminSession';
import { supabase } from '../lib/supabase';
import { InvoiceDetail } from './Dashboard';

const PAYMENT_PENDING = 'PAYMENT_PENDING';

const STATUS_KO = {
  PAYMENT_PENDING: '입금·계약 대기',
  KICKOFF: '착수(온보딩)',
  CONTACTING: '인플루언서 섭외 중',
  SHIPPING: '제품 발송 중',
  UPLOADING: '콘텐츠 업로드 중',
  TRACKING: '성과 트래킹',
  COMPLETED: '캠페인 완료',
};

function formatStatuses(statuses) {
  const uniq = [...new Set(statuses.filter(Boolean))];
  if (uniq.length === 0) return '—';
  return uniq.map((s) => STATUS_KO[s] || s).join(', ');
}

/**
 * 입금·계약 대기를 지난 캠페인만 — 동일 주문번호는 한 줄로 묶어 대표 캠페인 1건으로 인보이스를 봅니다.
 */
function buildInvoiceRows(campaigns) {
  const progressed = (campaigns || []).filter((c) => c && String(c.status || '') !== PAYMENT_PENDING);
  const byKey = new Map();
  for (const c of progressed) {
    const key = c.order_number ? `ord:${c.order_number}` : `id:${c.id}`;
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key).push(c);
  }
  const rows = [];
  for (const [, list] of byKey) {
    const sorted = [...list].sort((a, b) => {
      const ta = new Date(a.created_at || 0).getTime();
      const tb = new Date(b.created_at || 0).getTime();
      return tb - ta;
    });
    const representative = sorted[0];
    rows.push({
      key: sorted[0].order_number || sorted[0].id,
      representative,
      campaignCount: sorted.length,
      statuses: sorted.map((x) => x.status),
    });
  }
  rows.sort((a, b) => {
    const ta = new Date(a.representative.created_at || 0).getTime();
    const tb = new Date(b.representative.created_at || 0).getTime();
    return tb - ta;
  });
  return rows;
}

export default function AdminInvoicesPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminSession();
  const [campaigns, setCampaigns] = useState([]);
  const [loadError, setLoadError] = useState(null);
  const [listLoading, setListLoading] = useState(true);
  const [selectedKey, setSelectedKey] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login', { replace: true, state: { from: '/admin/invoices' } });
      return;
    }
    if (adminLoading) return;
    if (!isAdmin) {
      navigate('/dashboard', { replace: true });
    }
  }, [authLoading, adminLoading, user, isAdmin, navigate]);

  const loadCampaigns = useCallback(async () => {
    if (!user || !isAdmin) return;
    setLoadError(null);
    setListLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      let list = [];
      if (token) {
        const res = await fetch(`${window.location.origin}/api/admin/dashboard-overview`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const adminData = await res.json();
          list = adminData?.campaigns || [];
        } else {
          const t = await res.text();
          throw new Error(t || `HTTP ${res.status}`);
        }
      }
      if (list.length === 0) {
        const { data, error } = await supabase
          .from('campaigns')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        list = data || [];
      }
      setCampaigns(list);
    } catch (e) {
      console.warn('[AdminInvoicesPage]', e);
      setLoadError(e?.message || '목록을 불러오지 못했습니다.');
      setCampaigns([]);
    } finally {
      setListLoading(false);
    }
  }, [user, isAdmin]);

  useEffect(() => {
    if (!user || !isAdmin || adminLoading) return;
    void loadCampaigns();
  }, [user, isAdmin, adminLoading, loadCampaigns]);

  const rows = useMemo(() => buildInvoiceRows(campaigns), [campaigns]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const c = r.representative;
      const hay = `${c.order_number || ''} ${c.brand_name || ''} ${c.product_name || ''} ${c.customer_email || ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [rows, search]);

  const selectedRow = filteredRows.find((r) => r.key === selectedKey) || null;

  useEffect(() => {
    if (filteredRows.length === 0) {
      setSelectedKey(null);
      return;
    }
    if (!selectedKey || !filteredRows.some((r) => r.key === selectedKey)) {
      setSelectedKey(filteredRows[0].key);
    }
  }, [filteredRows, selectedKey]);

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-300">
        <Loader2 className="w-10 h-10 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 text-xs font-bold text-cyan-400 hover:text-cyan-300 mb-3"
            >
              <ChevronLeft size={16} />
              관리자 대시보드로
            </Link>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <Receipt className="text-cyan-400" size={28} />
              진행 캠페인 인보이스
            </h1>
            <p className="text-sm text-slate-400 mt-2 max-w-2xl">
              입금·계약 대기를 제외한 캠페인의 인보이스를 주문번호 기준으로 모았습니다. 행을 선택하면 아래에서 PDF로 저장할 수 있습니다.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadCampaigns()}
            disabled={listLoading}
            className="shrink-0 px-4 py-2.5 rounded-xl text-xs font-bold bg-white/10 border border-white/15 hover:bg-white/15 disabled:opacity-50"
          >
            {listLoading ? '불러오는 중…' : '새로고침'}
          </button>
        </div>

        {loadError && (
          <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">{loadError}</div>
        )}

        <div className="rounded-2xl border border-white/10 bg-slate-950/60 overflow-hidden mb-8">
          <div className="px-4 py-3 border-b border-white/10 flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="주문번호, 브랜드, 상품명, 이메일 검색"
                className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-slate-500"
              />
            </div>
            <p className="text-xs text-slate-500">
              총 <span className="text-slate-300 font-bold">{filteredRows.length}</span>건 (진행 단계 필터 적용)
            </p>
          </div>
          <div className="overflow-x-auto">
            {listLoading ? (
              <div className="flex justify-center py-16 text-slate-500">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
              </div>
            ) : (
              <table className="w-full text-left text-xs min-w-[720px]">
                <thead className="bg-[#0c1422] text-slate-400 border-b border-white/10">
                  <tr>
                    <th className="px-4 py-3 font-semibold">주문번호</th>
                    <th className="px-4 py-3 font-semibold">브랜드 / 상품</th>
                    <th className="px-4 py-3 font-semibold">고객 이메일</th>
                    <th className="px-4 py-3 font-semibold">진행 상태</th>
                    <th className="px-4 py-3 font-semibold text-right">캠페인 수</th>
                    <th className="px-4 py-3 font-semibold">생성일</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredRows.map((row) => {
                    const c = row.representative;
                    const active = row.key === selectedKey;
                    return (
                      <tr
                        key={row.key}
                        onClick={() => setSelectedKey(row.key)}
                        className={`cursor-pointer transition-colors ${active ? 'bg-cyan-500/15' : 'hover:bg-white/[0.04]'}`}
                      >
                        <td className="px-4 py-3 font-mono text-cyan-200/90">{c.order_number || '—'}</td>
                        <td className="px-4 py-3 text-slate-100 max-w-[220px]">
                          <div className="font-bold truncate">{c.brand_name || '—'}</div>
                          <div className="text-slate-500 truncate">{c.product_name || c.order_summary?.plan_name || ''}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-300 truncate max-w-[200px]" title={c.customer_email}>
                          {c.customer_email || '—'}
                        </td>
                        <td className="px-4 py-3 text-slate-400">{formatStatuses(row.statuses)}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{row.campaignCount}</td>
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                          {c.created_at ? new Date(c.created_at).toLocaleDateString('ko-KR') : '—'}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredRows.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                        {rows.length === 0
                          ? '진행 중인 캠페인이 없거나, 모두 입금·계약 대기 상태입니다.'
                          : '검색 조건에 맞는 항목이 없습니다.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {selectedRow && (
          <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 sm:p-10">
            <h2 className="text-lg font-black text-white mb-6 flex items-center gap-2">
              <Receipt size={20} className="text-cyan-400" />
              인보이스 미리보기
            </h2>
            <InvoiceDetail campaign={selectedRow.representative} adminReadOnly />
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
