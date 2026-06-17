import React from 'react';
import { useLang } from '../context/LangContext';
import { ShieldCheck, Users, Coins, HeartHandshake } from 'lucide-react';

export default function TrustBar() {
  const { t } = useLang();

  const trustItems = [
    {
      icon: <ShieldCheck className="w-10 h-10 text-brand-primary" />,
      title: t.trust1Title,
      desc: t.trust1Desc
    },
    {
      icon: <Users className="w-10 h-10 text-brand-primary" />,
      title: t.trust2Title,
      desc: t.trust2Desc
    },
    {
      icon: <Coins className="w-10 h-10 text-brand-primary" />,
      title: t.trust3Title,
      desc: t.trust3Desc
    },
    {
      icon: <HeartHandshake className="w-10 h-10 text-brand-primary" />,
      title: t.trust4Title,
      desc: t.trust4Desc
    }
  ];

  return (
    <section className="bg-rose-50/40 py-12 border-y border-rose-100/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title Section */}
        <div className="text-center max-w-xl mx-auto mb-10">
          <h3 className="text-xl sm:text-2xl font-extrabold text-slate-950 tracking-tight" id="trust-bar-title">
            {t.whyTitle}
          </h3>
          <div className="h-1.5 w-16 bg-brand-primary mx-auto mt-3 rounded-full" />
        </div>

        {/* Bento/Flex Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {trustItems.map((item, index) => (
            <div 
              key={index} 
              className="bg-white border border-rose-50 p-6 rounded-2xl shadow-sm text-center hover:scale-[1.02] hover:shadow-md transition-all duration-300"
              id={`trust-feature-${index}`}
            >
              <div className="inline-flex py-3 px-3 rounded-xl bg-rose-50 mb-4">
                {item.icon}
              </div>
              <h4 className="text-sm font-bold text-slate-900 mb-2">
                {item.title}
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                {item.desc}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
