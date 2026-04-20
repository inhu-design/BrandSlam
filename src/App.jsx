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
import CheckoutResult from './pages/CheckoutResult';
import CampaignSetup from './pages/CampaignSetup';
import SetPassword from './pages/SetPassword';
import Impersonate from './pages/Impersonate';
import SupportInboxPage from './pages/SupportInboxPage';
import AdminInvoicesPage from './pages/AdminInvoicesPage';
import SlamGlobalLandingNew from './pages/SlamGlobalLandingNew';
import SupportChatPortal from './components/support/SupportChatPortal';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SupportChatPortal />
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
          <Route path="/checkout/result" element={<CheckoutResult />} />
          <Route path="/set-password" element={<SetPassword />} />
          <Route path="/auth/impersonate" element={<Impersonate />} />
          <Route path="/admin/support" element={<SupportInboxPage />} />
          <Route path="/admin/invoices" element={<AdminInvoicesPage />} />
          <Route path="/landing-new" element={<SlamGlobalLandingNew />} />
          {/* 매직 링크 등으로 잘못된 경로 진입 시 대시보드로 (SPA 폴백) */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;