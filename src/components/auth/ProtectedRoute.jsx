import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  // 1. 로그인 상태 확인 중일 때 (로딩 화면)
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  // 2. 로그인이 안 되어 있다면 -> 로그인 페이지로 강제 이동
  if (!user) {
    // alert("로그인이 필요한 페이지입니다."); // 필요하면 주석 해제
    return <Navigate to="/login" replace />;
  }

  // 3. 로그인 되어 있다면 -> 원래 가려던 페이지 보여줌
  return children;
};

export default ProtectedRoute;