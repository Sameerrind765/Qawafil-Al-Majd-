import React from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';

import { LangProvider } from './context/LangContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
import Home from './pages/Home';
import Fleet from './pages/Fleet';
import Ziyarat from './pages/Ziyarat';
import Contact from './pages/Contact';
import AdminDashboard from './pages/AdminDashboard';

function AppContent() {
  const location = useLocation();
  const isAdminPath = location.pathname === '/admin' || location.pathname === '/dashboard';

  return (
    <div className="min-h-screen flex flex-col bg-white">
      
      {/* Navigation Bar - only show if not on admin paths */}
      {!isAdminPath && <Navbar />}

      {/* Dynamic Route views */}
      <main className="flex-1 flex flex-col">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/fleet" element={<Fleet />} />
          <Route path="/ziyarat" element={<Ziyarat />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/dashboard" element={<AdminDashboard />} />
        </Routes>
      </main>

      {/* Brand Footer - only show if not on admin paths */}
      {!isAdminPath && <Footer />}

    </div>
  );
}

export default function App() {
  return (
    <LangProvider>
      <Router>
        <AppContent />
      </Router>
    </LangProvider>
  );
}
