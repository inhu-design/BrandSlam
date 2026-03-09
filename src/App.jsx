import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';


import { AuthProvider } from './contexts/AuthProvider';

// --- Pages Import ---
import Home from './pages/Home';
import Login from './pages/Login';
import Consulting from './pages/Consulting';
import Dashboard from './pages/Dashboard';
import About from './pages/About';
import Management from './pages/Management';
import Diagnosis from './pages/Diagnosis';
import Checkout from './pages/Checkout';
import CampaignSetup from './pages/CampaignSetup';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />    
          <Route path="/consulting" element={<Consulting />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/campaign-setup/:campaignId" element={<CampaignSetup />} />
          <Route path="/about" element={<About />} />
          <Route path="/management" element={<Management />} />
          <Route path="/diagnosis" element={<Diagnosis />} />
          <Route path="/checkout" element={<Checkout />} />
          {/* 매직 링크 등으로 잘못된 경로 진입 시 대시보드로 (SPA 폴백) */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;