import React, { useState } from 'react';
import { useLang } from '../context/LangContext';
import BookingModal from '../components/BookingModal';
import { VehicleData } from '../data/vehicles';
import { Compass, Sparkles, Star, Calendar, CheckSquare, MessageSquare, Ticket } from 'lucide-react';

export default function Ziyarat() {
  const { lang, t } = useLang();
  
  // Custom Booking modal context for Ziyarat packages
  const [modalOpen, setModalOpen] = useState(false);
  const [surrogateVehicle, setSurrogateVehicle] = useState<VehicleData | null>(null);

  const makkahSurrogate: VehicleData = {
    id: "makkah-ziyarat-package",
    nameEn: "Makkah Sacred Ziyarat Program",
    nameAr: "برنامج زيارة المشاعر المقدسة بمكة",
    typeEn: "Guided Spiritual Tour",
    typeAr: "برنامج زيارات المشاعر الشريفة",
    seats: 7,
    price: 380,
    tagsEn: ["Licensed Local Guide", "A/C Coaster/SUV", "Sacred Waters Included"],
    tagsAr: ["مرشد محلي متحدث", "سيارة حديثة مكيفة", "توزيع مياه زمزم والمعدنية"],
    classFilter: "vip",
    recommended: true,
    emoji: "🕌"
  };

  const madinahSurrogate: VehicleData = {
    id: "madinah-ziyarat-package",
    nameEn: "Madinah Noble Ziyarat Program",
    nameAr: "برنامج زيارة المعالم النبوية بالمدينة",
    typeEn: "Spiritual History Tour",
    typeAr: "مزارات المعالم النبوية الشريفة",
    seats: 7,
    price: 360,
    tagsEn: ["Islamic Scholars Guide", "Pure Cold Water", "Comfortable Seating"],
    tagsAr: ["مرافقة مرشد ديني", "قوارير مياه باردة", "سيارة مكيفة مريحة"],
    classFilter: "business",
    recommended: false,
    emoji: "🕌"
  };

  const customSurrogate: VehicleData = {
    id: "custom-group-holy-caravan",
    nameEn: "Custom Holy Caravan (Multi-City)",
    nameAr: "قافلة لوجستية مخصصة لعدة أيام وتنقلات بين المدن",
    typeEn: "Group Dynamic Charter",
    typeAr: "حافلة ركاب للمجموعات الكبيرة",
    seats: 45,
    price: 1500,
    tagsEn: ["Jeddah, Makkah & Madinah Link", "Hotel Drop-offs", "Flexible Stops"],
    tagsAr: ["ربط كامل جدة، مكة، والمدينة", "توصيل للفنادق", "مرونة عالية في التوقف"],
    classFilter: "group",
    recommended: true,
    emoji: "🕋"
  };

  const handleBookPackage = (surrogate: VehicleData) => {
    setSurrogateVehicle(surrogate);
    setModalOpen(true);
  };

  // WhatsApp click link pre-filled template specifically for Ziyarat packages
  const whatsappNumber = "966501234567";
  const getWhatsAppURL = (titleEn: string, titleAr: string, rate: number) => {
    const title = lang === 'en' ? titleEn : titleAr;
    const msg = lang === 'en'
      ? `Ahlalan Wa Sahlan Qawafil Al Majd! I am looking to confirm a booking reservation for the guided spiritual tour program: "${title}" at the flat rate of SAR ${rate}. Please advise.`
      : `السلام عليكم قوافل المجد! أرغب في تأكيد حجز برنامج الزيارات الشريفة: "${title}" بسعر ثابت قدره ${rate} ريال. يرجى إرشادي بخصوص تفاصيل التفويج والخدمة.`;
    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`;
  };

  return (
    <div className="flex-1 py-12 bg-rose-50/20 font-sans select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title and Intro */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 bg-brand-primary/10 border border-brand-primary/20 py-1.5 px-3.5 rounded-full text-brand-primary font-bold text-xs uppercase tracking-wider mb-4">
            <Star className="w-4 h-4 fill-brand-primary" />
            <span>Spiritual Landmarks & Tours</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight" id="ziyarat-page-title">
            {t.ziyaratTitle}
          </h2>

          <p className="text-slate-500 text-xs sm:text-sm font-semibold leading-relaxed max-w-xl mx-auto mt-3">
            {t.ziyaratDesc}
          </p>
        </div>

        {/* 3 Packages Display */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          
          {/* Makkah Tour card */}
          <div className="bg-white border border-rose-100 rounded-2xl shadow-md hover:shadow-xl hover:border-brand-primary/20 transition-all duration-300 overflow-hidden flex flex-col justify-between group" id="ziyarat-makkah-card">
            <div>
              <div className="bg-brand-bg-dark h-48 relative flex items-center justify-center p-6 text-center select-none overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-brand-bg-dark via-brand-bg-dark/80 to-transparent z-10" />
                <span className="text-6xl text-white/10 absolute -right-4 -bottom-4 font-black select-none">🕋</span>
                
                <div className="relative z-20 text-center text-white">
                  <span className="bg-brand-primary text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-full">
                    Makkah Holy Sites
                  </span>
                  <h3 className="text-base font-extrabold mt-3 tracking-tight">
                    {t.makkahTour}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-1 font-semibold">
                    {t.durationHours}
                  </p>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-xs text-slate-600 font-bold leading-relaxed line-clamp-3">
                  {t.makkahTourDesc}
                </p>

                {/* Inclusions */}
                <div className="bg-rose-50/50 p-3 rounded-xl border border-rose-100/30 text-[11px] text-slate-500 font-bold leading-relaxed">
                  ✓ {t.packageIncludes}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-rose-50 bg-slate-50/50">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] uppercase font-bold text-slate-500">
                  Flat Tour Price
                </span>
                <span className="text-brand-primary font-black text-xl">
                  {makkahSurrogate.price} <span className="text-xs font-bold font-mono">{t.currency}</span>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <a
                  href={getWhatsAppURL(makkahSurrogate.nameEn, makkahSurrogate.nameAr, makkahSurrogate.price)}
                  target="_blank"
                  referrerPolicy="no-referrer"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-2.5 px-2 rounded-xl text-center flex items-center justify-center gap-1.5 shadow"
                  id={`wa-ziyarat-${makkahSurrogate.id}`}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>WhatsApp</span>
                </a>

                <button
                  type="button"
                  onClick={() => handleBookPackage(makkahSurrogate)}
                  className="bg-brand-primary hover:bg-brand-dark text-white font-extrabold text-xs py-2.5 px-2 rounded-xl text-center flex items-center justify-center gap-1.5 shadow cursor-pointer"
                  id={`book-ziyarat-${makkahSurrogate.id}`}
                >
                  <Ticket className="w-4 h-4" />
                  <span>{t.navBookNow}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Madinah Tour card */}
          <div className="bg-white border border-rose-100 rounded-2xl shadow-md hover:shadow-xl hover:border-brand-primary/20 transition-all duration-300 overflow-hidden flex flex-col justify-between group" id="ziyarat-madinah-card">
            <div>
              <div className="bg-brand-bg-dark h-48 relative flex items-center justify-center p-6 text-center select-none overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-brand-bg-dark via-brand-bg-dark/80 to-transparent z-10" />
                <span className="text-6xl text-white/10 absolute -right-4 -bottom-4 font-black select-none">🟢</span>
                
                <div className="relative z-20 text-center text-white">
                  <span className="bg-emerald-600 text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-full">
                    Madinah Noble Sites
                  </span>
                  <h3 className="text-base font-extrabold mt-3 tracking-tight">
                    {t.madinahTour}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-1 font-semibold">
                    {t.durationHours}
                  </p>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-xs text-slate-600 font-bold leading-relaxed line-clamp-3">
                  {t.madinahTourDesc}
                </p>

                {/* Inclusions */}
                <div className="bg-rose-50/50 p-3 rounded-xl border border-rose-100/30 text-[11px] text-slate-500 font-bold leading-relaxed">
                  ✓ {t.packageIncludes}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-rose-50 bg-slate-50/50">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] uppercase font-bold text-slate-500">
                  Flat Tour Price
                </span>
                <span className="text-brand-primary font-black text-xl">
                  {madinahSurrogate.price} <span className="text-xs font-bold font-mono">{t.currency}</span>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <a
                  href={getWhatsAppURL(madinahSurrogate.nameEn, madinahSurrogate.nameAr, madinahSurrogate.price)}
                  target="_blank"
                  referrerPolicy="no-referrer"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-2.5 px-2 rounded-xl text-center flex items-center justify-center gap-1.5 shadow"
                  id={`wa-ziyarat-${madinahSurrogate.id}`}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>WhatsApp</span>
                </a>

                <button
                  type="button"
                  onClick={() => handleBookPackage(madinahSurrogate)}
                  className="bg-brand-primary hover:bg-brand-dark text-white font-extrabold text-xs py-2.5 px-2 rounded-xl text-center flex items-center justify-center gap-1.5 shadow cursor-pointer"
                  id={`book-ziyarat-${madinahSurrogate.id}`}
                >
                  <Ticket className="w-4 h-4" />
                  <span>{t.navBookNow}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Custom Group Holy Caravan Tour card */}
          <div className="bg-white border border-rose-100 rounded-2xl shadow-md hover:shadow-xl hover:border-brand-primary/20 transition-all duration-300 overflow-hidden flex flex-col justify-between group" id="ziyarat-custom-card">
            <div>
              <div className="bg-brand-bg-dark h-48 relative flex items-center justify-center p-6 text-center select-none overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-brand-bg-dark via-brand-bg-dark/80 to-transparent z-10" />
                <span className="text-6xl text-white/10 absolute -right-4 -bottom-4 font-black select-none">🚍</span>
                
                <div className="relative z-20 text-center text-white">
                  <span className="bg-amber-600 text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-full">
                    Custom Large Group
                  </span>
                  <h3 className="text-base font-extrabold mt-3 tracking-tight">
                    {t.customTour}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-1 font-semibold">
                    Flexible / Multi-Day Schedule
                  </p>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-xs text-slate-600 font-bold leading-relaxed line-clamp-3">
                  {t.customTourDesc}
                </p>

                {/* Inclusions */}
                <div className="bg-rose-50/50 p-3 rounded-xl border border-rose-100/30 text-[11px] text-slate-500 font-bold leading-relaxed">
                  ✓ Includes multi-day bus allocation, toll handling, 24/7 dedicated dispatch supervisor.
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-rose-50 bg-slate-50/50">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] uppercase font-bold text-slate-500">
                  Est. Base Group Rate
                </span>
                <span className="text-brand-primary font-black text-xl">
                  {customSurrogate.price} <span className="text-xs font-bold font-mono">{t.currency}</span>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <a
                  href={getWhatsAppURL(customSurrogate.nameEn, customSurrogate.nameAr, customSurrogate.price)}
                  target="_blank"
                  referrerPolicy="no-referrer"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-2.5 px-2 rounded-xl text-center flex items-center justify-center gap-1.5 shadow"
                  id={`wa-ziyarat-${customSurrogate.id}`}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>WhatsApp</span>
                </a>

                <button
                  type="button"
                  onClick={() => handleBookPackage(customSurrogate)}
                  className="bg-brand-primary hover:bg-brand-dark text-white font-extrabold text-xs py-2.5 px-2 rounded-xl text-center flex items-center justify-center gap-1.5 shadow cursor-pointer"
                  id={`book-ziyarat-${customSurrogate.id}`}
                >
                  <Ticket className="w-4 h-4" />
                  <span>{t.navBookNow}</span>
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>

      <BookingModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        selectedVehicle={surrogateVehicle}
      />
    </div>
  );
}
