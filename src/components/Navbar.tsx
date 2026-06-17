import React, { useState } from 'react';
import { useLang } from '../context/LangContext';
import { Link, useLocation } from 'react-router-dom';
import { Truck, Globe, Menu, X, MessageSquare } from 'lucide-react';

export default function Navbar() {
  const { lang, setLang, t } = useLang();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const handleLangToggle = () => {
    setLang(lang === 'en' ? 'ar' : 'en');
  };

  const menuItems = [
    { path: '/', label: t.navHome },
    { path: '/fleet', label: t.navFleet },
    { path: '/ziyarat', label: t.navZiyarat },
    { path: '/contact', label: t.navContact },
  ];

  // WhatsApp click link pre-filled template message
  const whatsappNumber = "966501234567"; // Sample TGA office number
  const defaultMsg = lang === 'en' 
    ? "Hello Qawafil Al Majd! I am looking to inquire about premium vehicle transportation services."
    : "مرحباً قوافل المجد! أرغب في الاستفسار عن خدمات النقل وتأجير الحافلات المتميزة.";
  const linkUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(defaultMsg)}`;

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-rose-100 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          
          {/* Logo Section */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 group decoration-transparent">
              <div className="w-11 h-11 rounded-xl bg-brand-primary flex items-center justify-center text-white font-bold shadow-md shadow-brand-primary/20 group-hover:bg-brand-dark transition-colors duration-200">
                <Truck className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight leading-none">
                  {t.brandName}
                </span>
                <span className="text-[10px] sm:text-[11px] text-brand-primary font-bold tracking-wide mt-1">
                  {lang === 'en' ? "Perfect Caravans of Glory" : "قوافل المجد اللوجستية المتميزة"}
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links (Large Screen) */}
          <div className="hidden md:flex items-center gap-1 lg:gap-3">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 rounded-lg text-sm font-bold transition-all duration-200 decoration-transparent ${
                    isActive 
                      ? 'text-brand-primary bg-brand-light' 
                      : 'text-slate-700 hover:text-brand-primary hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Controls - Lang and WhatsApp action */}
          <div className="hidden md:flex items-center gap-3">
            {/* Lang switcher */}
            <button
              onClick={handleLangToggle}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-brand-primary hover:bg-slate-50 border border-slate-200 flex items-center gap-1.5 cursor-pointer transition-all duration-300"
              id="navbar-lang-toggle"
              aria-label="Toggle language"
            >
              <Globe className="w-4 h-4 text-brand-primary" />
              <span>{lang === 'en' ? 'بالعربية' : 'English'}</span>
            </button>

            {/* Whatsapp CTA */}
            <a
              href={linkUrl}
              target="_blank"
              referrerPolicy="no-referrer"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md cursor-pointer transition-all duration-200 decoration-transparent"
              id="navbar-whatsapp-cta"
            >
              <MessageSquare className="w-4 h-4" />
              <span>{t.navWhatsappCTA}</span>
            </a>
          </div>

          {/* Mobile Menu Action Icon */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={handleLangToggle}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
              title="Change Language"
            >
              <Globe className="w-5 h-5 text-brand-primary" />
            </button>
            
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-700 hover:bg-slate-100 focus:outline-none"
              id="navbar-hamburger-btn"
              aria-label="Open menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white shadow-lg animate-fadeIn">
          <div className="px-2 pt-2 pb-4 space-y-1 sm:px-3">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-3 rounded-xl text-sm font-bold decoration-transparent transition-all duration-200 ${
                    isActive 
                      ? 'text-brand-primary bg-brand-light' 
                      : 'text-slate-700 hover:text-brand-primary hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            <div className="pt-4 border-t border-slate-100 flex flex-col gap-2 px-4">
              <a
                href={linkUrl}
                target="_blank"
                referrerPolicy="no-referrer"
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm py-3 rounded-xl shadow-sm text-center decoration-transparent"
              >
                <MessageSquare className="w-5 h-5" />
                <span>{t.navWhatsappCTA}</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
