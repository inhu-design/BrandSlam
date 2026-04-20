import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

/** 로그인 시 대시보드 lazy 청크를 미리 받아 My Campaign 첫 클릭 지연을 줄임 */
export default function DashboardChunkWarmup() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    void import('../pages/Dashboard.jsx');
  }, [user]);

  return null;
}
