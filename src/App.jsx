import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// --- Context ---
// AuthProvider는 로그인 상태 관리를 위해 남겨두어도 되지만,
// 강제 접근 제어(ProtectedRoute)는 제거합니다.
import { AuthProvider } from './contexts/AuthProvider';

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
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/features" element={<Features />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/survey" element={<Survey />} />
          <Route path="/login" element={<Login />} />    
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/consulting" element={<Consulting />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;