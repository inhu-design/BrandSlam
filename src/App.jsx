import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// --- Context & Auth Guard ---
import { AuthProvider } from './contexts/AuthProvider';
import ProtectedRoute from './components/auth/ProtectedRoute';

// --- Pages Import ---
import Home from './pages/Home';
import Features from './pages/Features';
import Pricing from './pages/Pricing';
import Customers from './pages/Customers';
import Survey from './pages/Survey';
import Login from './pages/Login';
import Checkout from './pages/Checkout';
import Consulting from './pages/Consulting';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    // [Crucial] BrowserRouter가 최상위에서 감싸야 라우팅이 작동함
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* --- Public Routes (누구나 접근 가능) --- */}
          <Route path="/" element={<Home />} />
          <Route path="/features" element={<Features />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/survey" element={<Survey />} />
          <Route path="/login" element={<Login />} />
          
          {/* --- Protected Routes (로그인 필수) --- */}
          {/* 1. 결제 페이지 */}
          <Route 
            path="/checkout" 
            element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            } 
          />
          
          {/* 2. 상담 예약 페이지 */}
          <Route 
            path="/consulting" 
            element={
              <ProtectedRoute>
                <Consulting />
              </ProtectedRoute>
            } 
          />

          {/* 3. 대시보드 (로그인 후 본인 캠페인 확인용) */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;