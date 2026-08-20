import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { LangProvider } from './context/LangContext';
import Navbar from './components/Navbar';
import { lazy, Suspense } from 'react';

// Pages
import Home from './pages/Home';
// import Fleet from './pages/Fleet';
// import Ziyarat from './pages/Ziyarat';
// import Contact from './pages/Contact';
const Footer = lazy(() => import('./components/Footer'));
const Fleet = lazy(() => import('./pages/Fleet'));
const Contact = lazy(() => import('./pages/Contact'));
const Ziyarat = lazy(() => import('./pages/Ziyarat'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

export function AppContent() {
  const location = useLocation();
  const isAdminPath = location.pathname === '/admin' || location.pathname === '/dashboard';

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Navigation Bar - only show if not on admin paths */}
      {!isAdminPath && <Navbar />}

      {/* Dynamic Route views */}
      <main className="flex-1 flex flex-col">
        <Suspense fallback={<div>Loading...</div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/fleet" element={<Fleet />} />
            <Route path="/ziyarat" element={<Ziyarat />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/dashboard" element={<AdminDashboard />} />
          </Routes>
        </Suspense>
      </main>

      {/* Brand Footer - only show if not on admin paths */}
        <Suspense fallback={<div>null</div>}>

      {!isAdminPath && <Footer />}
      </Suspense>
    </div>
  );
}

export default function App({ children }: { children?: React.ReactNode }) {
  return (
    <LangProvider>
      {children ? children : (
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      )}
    </LangProvider>
  );
}
