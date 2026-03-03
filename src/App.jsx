import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';


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


function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />    
          <Route path="/consulting" element={<Consulting />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/about" element={<About />} />
          <Route path="/management" element={<Management />} />
          <Route path="/diagnosis" element={<Diagnosis />} />
          <Route path="/checkout" element={<Checkout />} />
          
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;