import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';


import { AuthProvider } from './contexts/AuthProvider';
import { SupportStaffUnreadProvider } from './contexts/SupportStaffUnreadContext';

// --- Pages Import ---
import Home from './pages/Home';
import Login from './pages/Login';
import Consulting from './pages/Consulting';
const Dashboard = lazy(() => import('./pages/Dashboard'));

const dashboardFallback = (
  <div className="min-h-screen flex items-center justify-center bg-[#020617]">
    <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
  </div>
);
import About from './pages/About';
import Management from './pages/Management';
import Diagnosis from './pages/Diagnosis';
import Checkout from './pages/Checkout';
import CheckoutResult from './pages/CheckoutResult';
import CampaignSetup from './pages/CampaignSetup';
import SetPassword from './pages/SetPassword';
import Impersonate from './pages/Impersonate';
import SlamGlobalLandingNew from './pages/SlamGlobalLandingNew';
import SupportChatPortal from './components/support/SupportChatPortal';
import DashboardChunkWarmup from './components/DashboardChunkWarmup';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SupportStaffUnreadProvider>
        <DashboardChunkWarmup />
        <SupportChatPortal />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />    
          <Route path="/consulting" element={<Consulting />} />
          <Route
            path="/dashboard"
            element={(
              <Suspense fallback={dashboardFallback}>
                <Dashboard />
              </Suspense>
            )}
          />
          <Route path="/campaign-setup/:campaignId" element={<CampaignSetup />} />
          <Route path="/about" element={<About />} />
          <Route path="/management" element={<Management />} />
          <Route path="/diagnosis" element={<Diagnosis />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/checkout/result" element={<CheckoutResult />} />
          <Route path="/set-password" element={<SetPassword />} />
          <Route path="/auth/impersonate" element={<Impersonate />} />
          <Route
            path="/admin/support"
            element={<Navigate to="/dashboard" replace state={{ adminPanel: 'support_inbox' }} />}
          />
          <Route
            path="/admin/invoices"
            element={<Navigate to="/dashboard" replace state={{ adminPanel: 'all_invoices' }} />}
          />
          <Route path="/landing-new" element={<SlamGlobalLandingNew />} />
          {/* 매직 링크 등으로 잘못된 경로 진입 시 대시보드로 (SPA 폴백) */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </SupportStaffUnreadProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;