import React from 'react';
import { useLang } from '../context/LangContext';
import { Truck, Mail, Phone, MapPin, ExternalLink, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const { lang, t } = useLang();

  return (
    <footer className="bg-brand-bg-dark text-slate-300 py-12 border-t border-red-950 mt-auto select-none font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Upper branding and contact grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-10 border-b border-rose-950/40">
          
          {/* Brand Division description */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-primary flex items-center justify-center text-white font-bold border border-brand-primary/10">
                <Truck className="w-5 h-5" />
              </div>
              <span className="text-lg font-black text-white tracking-widest uppercase">
                {t.brandName}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-semibold leading-relaxed max-w-sm">
              {t.brandSub}
            </p>
            <div className="text-[10px] text-brand-primary uppercase font-bold tracking-widest">
              {t.hqWorkingHours}
            </div>
          </div>

          {/* Quick Page Links */}
          <div>
            <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-4 border-l-2 border-brand-primary pl-2">
              {lang === 'en' ? 'Quick Portal Access' : 'روابط سريعة للمنصة'}
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/" className="text-slate-400 hover:text-brand-primary transition-colors decoration-transparent font-bold">
                  {t.navHome}
                </Link>
              </li>
              <li>
                <Link to="/fleet" className="text-slate-400 hover:text-brand-primary transition-colors decoration-transparent font-bold">
                  {t.navFleet}
                </Link>
              </li>
              <li>
                <Link to="/ziyarat" className="text-slate-400 hover:text-brand-primary transition-colors decoration-transparent font-bold">
                  {t.navZiyarat}
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-slate-400 hover:text-brand-primary transition-colors decoration-transparent font-bold">
                  {t.navContact}
                </Link>
              </li>
            </ul>
          </div>

          {/* Operations Contact info */}
          <div className="space-y-3.5">
            <h4 className="text-white text-xs font-bold uppercase tracking-wider border-l-2 border-brand-primary pl-2">
              {t.hqTitle}
            </h4>
            
            <div className="flex items-start gap-2.5 text-xs text-slate-400">
              <MapPin className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
              <span className="font-semibold leading-snug">{t.hqAddress}</span>
            </div>

            <div className="flex items-center gap-2.5 text-xs text-slate-400">
              <Phone className="w-4 h-4 text-brand-primary shrink-0" />
              <span className="font-mono">{t.hqPhone}</span>
            </div>

            <div className="flex items-center gap-2.5 text-xs text-slate-400">
              <Mail className="w-4 h-4 text-brand-primary shrink-0" />
              <span className="font-mono">{t.hqEmail}</span>
            </div>
          </div>

        </div>

        {/* Lower Legal Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 font-bold tracking-wider space-y-4 sm:space-y-0">
          <div className="uppercase">
            © 2026 {t.brandName} Integrated Hub. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <Link 
              to="/admin" 
              className="hover:text-brand-primary text-slate-400 transition-colors duration-200 decoration-transparent font-bold flex items-center gap-1"
              id="footer-admin-link"
            >
              🔐 <span>{lang === 'en' ? 'Admin Portal' : 'بوابة الإدارة'}</span>
            </Link>
            <span className="text-slate-700">|</span>
            <span className="hover:text-slate-300 cursor-pointer flex items-center gap-1.5 font-bold">
              <ShieldAlert className="w-3.5 h-3.5 text-brand-primary" />
              <span>Minister of Transport Approved (TGA License)</span>
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
}
