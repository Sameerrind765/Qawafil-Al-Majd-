import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { LangProvider } from './context/LangContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Public SEO-critical pages statically imported
import Home from './pages/Home';
import Fleet from './pages/Fleet';
import Ziyarat from './pages/Ziyarat';
import Contact from './pages/Contact';

// Only keep AdminDashboard lazy — it's genuinely large AND shouldn't be indexed
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
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/fleet" element={<Fleet />} />
          <Route path="/ziyarat" element={<Ziyarat />} />
          <Route path="/contact" element={<Contact />} />
          <Route
            path="/admin"
            element={
              <Suspense
                fallback={
                  <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-amber-500 border-t-transparent" />
                  </div>
                }
              >
                <AdminDashboard />
              </Suspense>
            }
          />
          <Route
            path="/dashboard"
            element={
              <Suspense
                fallback={
                  <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-amber-500 border-t-transparent" />
                  </div>
                }
              >
                <AdminDashboard />
              </Suspense>
            }
          />
        </Routes>
      </main>

      {/* Brand Footer - only show if not on admin paths */}
      {!isAdminPath && <Footer />}
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
