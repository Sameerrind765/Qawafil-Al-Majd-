import React from 'react';
import { useLang } from '../context/LangContext';
import { Send, FileText, Compass } from 'lucide-react';

export default function HowItWorks() {
  const { t } = useLang();

  const steps = [
    {
      icon: <FileText className="w-6 h-6 text-white" />,
      title: t.step1Title,
      desc: t.step1Desc
    },
    {
      icon: <Compass className="w-6 h-6 text-white" />,
      title: t.step2Title,
      desc: t.step2Desc
    },
    {
      icon: <Send className="w-6 h-6 text-white" />,
      title: t.step3Title,
      desc: t.step3Desc
    }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title */}
        <div className="text-center max-w-xl mx-auto mb-12">
          <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight" id="how-it-works-title">
            {t.howTitle}
          </h3>
          <div className="h-1.5 w-16 bg-brand-primary mx-auto mt-3 rounded-full" />
        </div>

        {/* Dynamic connection pipeline */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          
          {/* Timeline connecting lines behind steps (screen-wide desktop only) */}
          <div className="hidden md:block absolute top-12 left-1/6 right-1/6 h-0.5 border-t border-dashed border-rose-200 z-0" />

          {steps.map((step, idx) => (
            <div 
              key={idx} 
              className="relative z-10 flex flex-col items-center text-center p-4"
              id={`how-step-${idx}`}
            >
              {/* Connected Stage circle badge */}
              <div className="w-16 h-16 rounded-full bg-brand-primary border-4 border-rose-100 flex items-center justify-center text-white font-extrabold shadow-lg shadow-brand-primary/20 mb-5 relative group">
                {step.icon}
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-slate-900 border border-white text-[10px] flex items-center justify-center font-bold">
                  {idx + 1}
                </div>
              </div>

              {/* Text Blocks */}
              <h4 className="text-sm font-extrabold text-slate-900 mb-2 tracking-tight">
                {step.title}
              </h4>
              <p className="text-xs text-slate-500 font-semibold leading-relaxed max-w-sm">
                {step.desc}
              </p>
            </div>
          ))}

        </div>

      </div>
    </section>
  );
}
