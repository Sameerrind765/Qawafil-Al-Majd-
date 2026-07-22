import React, { useState } from 'react';
import { useLang } from '../context/LangContext';
import BookingModal from '../components/BookingModal';
import { VehicleData } from '../data/vehicles';
import { 
  Clock, 
  ShieldCheck, 
  UserCheck, 
  Wind, 
  Droplet, 
  Ticket, 
  MessageSquare, 
  Headphones, 
  Award, 
  Landmark,
  Compass,
  CheckCircle2
} from 'lucide-react';

export default function Ziyarat() {
  const { lang, t } = useLang();
  
  // Tab state for single screen focus: 'madinah' | 'makkah' | 'custom' | 'all'
  const [activeTab, setActiveTab] = useState<string>('madinah');

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
      ? `Ahlalan Wa Sahlan Qawafil Al Majd! I am looking to confirm a booking reservation for the guided spiritual tour program: "${title}" at the rate of SAR ${rate}. Please advise.`
      : `السلام عليكم قوافل المجد! أرغب في تأكيد حجز برنامج الزيارات الشريفة: "${title}" بسعر ${rate} ريال. يرجى إرشادي بخصوص تفاصيل التفويج والخدمة.`;
    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`;
  };

  const tourPackages = [
    {
      id: "madinah",
      badgeText: t.madinahBadge,
      title: t.madinahTour,
      duration: t.durationHours,
      description: t.madinahTourDesc,
      inclusionsText: t.packageIncludes,
      priceLabel: t.flatTourPrice,
      price: madinahSurrogate.price,
      image: "https://images.unsplash.com/photo-1591604466107-ec97de577aff?auto=format&fit=crop&w=1200&q=80",
      surrogate: madinahSurrogate,
      waUrl: getWhatsAppURL(madinahSurrogate.nameEn, madinahSurrogate.nameAr, madinahSurrogate.price)
    },
    {
      id: "makkah",
      badgeText: t.makkahBadge,
      title: t.makkahTour,
      duration: t.durationHours,
      description: t.makkahTourDesc,
      inclusionsText: t.packageIncludes,
      priceLabel: t.flatTourPrice,
      price: makkahSurrogate.price,
      image: "https://images.unsplash.com/photo-1564769625905-50e93615e769?auto=format&fit=crop&w=1200&q=80",
      surrogate: makkahSurrogate,
      waUrl: getWhatsAppURL(makkahSurrogate.nameEn, makkahSurrogate.nameAr, makkahSurrogate.price)
    },
    {
      id: "custom",
      badgeText: t.customBadge,
      title: t.customTour,
      duration: t.durationFlexible,
      description: t.customTourDesc,
      inclusionsText: t.customPackageIncludes,
      priceLabel: t.estBasePrice,
      price: customSurrogate.price,
      image: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80",
      surrogate: customSurrogate,
      waUrl: getWhatsAppURL(customSurrogate.nameEn, customSurrogate.nameAr, customSurrogate.price)
    }
  ];

  const displayedPackages = activeTab === 'all' 
    ? tourPackages 
    : tourPackages.filter(p => p.id === activeTab);

  return (
    <div className="flex-1 py-6 sm:py-8 bg-[#f8f9fa] font-sans select-none">
      <div className="max-w-2xl mx-auto px-3 sm:px-4">
        
        {/* Title and Intro Header */}
        <div className="text-center mb-5 sm:mb-6">
          <div className="inline-flex items-center gap-1.5 bg-emerald-100/80 border border-emerald-200 py-1 px-3 rounded-full text-[#0d6b46] font-extrabold text-[11px] uppercase tracking-wider mb-2 shadow-xs">
            <Compass className="w-3.5 h-3.5 text-[#0d6b46]" />
            <span>Spiritual Landmarks & Tours</span>
          </div>

          <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight" id="ziyarat-page-title">
            {t.ziyaratTitle}
          </h2>

          <p className="text-slate-500 text-xs font-semibold leading-relaxed max-w-lg mx-auto mt-1.5">
            {t.ziyaratDesc}
          </p>
        </div>

        {/* Tour Selection Tabs (Ensures single screen focused viewing) */}
        <div className="flex items-center justify-center p-1 bg-slate-200/70 rounded-2xl mb-5 sm:mb-6 gap-1 max-w-lg mx-auto text-xs font-extrabold">
          <button
            type="button"
            onClick={() => setActiveTab('madinah')}
            className={`flex-1 py-2 px-2 sm:px-3 rounded-xl transition-all duration-200 text-center cursor-pointer ${
              activeTab === 'madinah'
                ? 'bg-[#055c3c] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            {t.madinahBadge}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('makkah')}
            className={`flex-1 py-2 px-2 sm:px-3 rounded-xl transition-all duration-200 text-center cursor-pointer ${
              activeTab === 'makkah'
                ? 'bg-[#055c3c] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            {t.makkahBadge}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('custom')}
            className={`flex-1 py-2 px-2 sm:px-3 rounded-xl transition-all duration-200 text-center cursor-pointer ${
              activeTab === 'custom'
                ? 'bg-[#055c3c] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            {t.customBadge}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`py-2 px-2 sm:px-3 rounded-xl transition-all duration-200 text-center cursor-pointer ${
              activeTab === 'all'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            {lang === 'en' ? "All" : "الكل"}
          </button>
        </div>

        {/* Tour Cards Container (Single screen compact layout) */}
        <div className="space-y-8">
          {displayedPackages.map((tour) => (
            <div 
              key={tour.id}
              id={`ziyarat-${tour.id}-card`}
              className="bg-white rounded-[22px] border border-slate-200/90 shadow-md hover:shadow-xl overflow-hidden transition-all duration-300 flex flex-col justify-between"
            >
              {/* 1. Hero Image Header Stage - Reduced height for single-screen view */}
              <div className="relative h-44 sm:h-52 w-full overflow-hidden select-none bg-slate-900">
                <img 
                  src={tour.image} 
                  alt={tour.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/45 to-slate-950/10" />

                {/* Overlay Header Content */}
                <div className="absolute inset-0 p-4 sm:p-5 flex flex-col justify-between z-10 text-white">
                  {/* Top Badge */}
                  <div className="flex items-center justify-start">
                    <span className="inline-flex items-center gap-1.5 bg-[#055c3c] text-emerald-100 font-extrabold text-[10px] sm:text-[11px] uppercase tracking-wider px-3 py-1 rounded-full shadow-sm border border-emerald-500/20">
                      <Landmark className="w-3.5 h-3.5 text-emerald-300" />
                      <span>{tour.badgeText}</span>
                    </span>
                  </div>

                  {/* Bottom Title & Duration */}
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white drop-shadow-sm leading-tight">
                      {tour.title}
                    </h3>
                    
                    {/* Gold Accent Divider Bar */}
                    <div className="w-8 h-0.5 bg-amber-400 rounded-full my-1.5" />
                    
                    {/* Clock & Duration */}
                    <div className="flex items-center gap-1.5 text-amber-300 font-bold text-xs">
                      <Clock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                      <span>{tour.duration}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Card Body Content - Compact padding and typography */}
              <div className="p-4 sm:p-5 space-y-4">
                
                {/* Description Paragraph */}
                <p className="text-slate-700 text-xs sm:text-sm font-semibold leading-relaxed">
                  {tour.description}
                </p>

                {/* Highlighted Inclusions Callout Box */}
                <div className="bg-[#f0f8f4] border border-[#d3ece0] rounded-xl p-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#d8f3e5] text-[#0d6b46] flex items-center justify-center flex-shrink-0 shadow-xs">
                    <ShieldCheck className="w-4 h-4 text-[#0d6b46]" />
                  </div>
                  <p className="text-xs text-slate-700 font-bold leading-snug">
                    {tour.inclusionsText}
                  </p>
                </div>

                {/* Price & Amenities Section */}
                <div className="border-t border-slate-100 pt-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  
                  {/* Price Block */}
                  <div className="space-y-0.5 flex-shrink-0">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                      {tour.priceLabel}
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl sm:text-4xl font-black text-[#055c3c] tracking-tight">
                        {tour.price}
                      </span>
                      <span className="text-emerald-700 font-bold text-xs sm:text-sm font-mono">
                        {t.currency}
                      </span>
                    </div>
                  </div>

                  {/* Vertical Divider for SM+ */}
                  <div className="hidden sm:block w-px h-10 bg-slate-200/80 mx-1" />

                  {/* Amenities Grid (4 items) */}
                  <div className="grid grid-cols-4 gap-2 flex-1 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    {/* Driver */}
                    <div className="flex flex-col items-center text-center">
                      <div className="w-9 h-9 rounded-full bg-[#e8f5ee] text-[#0d6b46] flex items-center justify-center mb-1 shadow-xs">
                        <UserCheck className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-700 leading-tight">
                        {t.amenityDriver}
                      </span>
                    </div>

                    {/* High-speed A/C */}
                    <div className="flex flex-col items-center text-center">
                      <div className="w-9 h-9 rounded-full bg-[#e8f5ee] text-[#0d6b46] flex items-center justify-center mb-1 shadow-xs">
                        <Wind className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-700 leading-tight">
                        {t.amenityAC}
                      </span>
                    </div>

                    {/* Cold Mineral Water */}
                    <div className="flex flex-col items-center text-center">
                      <div className="w-9 h-9 rounded-full bg-[#e8f5ee] text-[#0d6b46] flex items-center justify-center mb-1 shadow-xs">
                        <Droplet className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-700 leading-tight">
                        {t.amenityWater}
                      </span>
                    </div>

                    {/* Toll Charges */}
                    <div className="flex flex-col items-center text-center">
                      <div className="w-9 h-9 rounded-full bg-[#e8f5ee] text-[#0d6b46] flex items-center justify-center mb-1 shadow-xs">
                        <Ticket className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-700 leading-tight">
                        {t.amenityTolls}
                      </span>
                    </div>
                  </div>

                </div>

                {/* 3. Action Buttons Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {/* WhatsApp Button */}
                  <a
                    href={tour.waUrl}
                    target="_blank"
                    referrerPolicy="no-referrer"
                    className="bg-[#058a58] hover:bg-[#04774b] text-white py-3 px-4 rounded-xl flex items-center justify-center gap-2.5 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.99] text-left group decoration-transparent"
                    id={`wa-ziyarat-${tour.id}`}
                  >
                    <MessageSquare className="w-5 h-5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    <div>
                      <span className="text-sm sm:text-base font-black block leading-tight">
                        WhatsApp
                      </span>
                      <span className="text-[10px] text-emerald-100 font-semibold block leading-none mt-0.5">
                        {t.waChatSub}
                      </span>
                    </div>
                  </a>

                  {/* Book Now Button */}
                  <button
                    type="button"
                    onClick={() => handleBookPackage(tour.surrogate)}
                    className="bg-[#d92d20] hover:bg-[#b82116] text-white py-3 px-4 rounded-xl flex items-center justify-center gap-2.5 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.99] text-left cursor-pointer group"
                    id={`book-ziyarat-${tour.id}`}
                  >
                    <Ticket className="w-5 h-5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    <div>
                      <span className="text-sm sm:text-base font-black block leading-tight">
                        {t.navBookNow || "Book Now"}
                      </span>
                      <span className="text-[10px] text-rose-100 font-semibold block leading-none mt-0.5">
                        {t.bookSub}
                      </span>
                    </div>
                  </button>
                </div>

              </div>

              {/* 4. Footer Trust Badges Strip */}
              <div className="bg-[#f4f7f5] border-t border-slate-100 px-4 py-2.5 flex flex-wrap items-center justify-around text-[10px] sm:text-[11px] text-slate-600 font-bold gap-2">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{t.trustVerified}</span>
                </div>
                <div className="hidden sm:block w-px h-3 bg-slate-300" />
                <div className="flex items-center gap-1.5">
                  <Headphones className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{t.trustSupport}</span>
                </div>
                <div className="hidden sm:block w-px h-3 bg-slate-300" />
                <div className="flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{t.trustPrice}</span>
                </div>
              </div>

            </div>
          ))}
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
