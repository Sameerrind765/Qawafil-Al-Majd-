import React, { useState } from 'react';
import { useLang } from '../context/LangContext';
import { VehicleData, getVehicleImageUrl } from '../data/vehicles';
import { 
  Users, 
  MessageSquare, 
  Snowflake, 
  Wifi, 
  Usb, 
  Armchair, 
  Music, 
  Briefcase, 
  Sparkles, 
  Heart, 
  ChevronRight, 
  Star 
} from 'lucide-react';

interface VehicleCardProps {
  key?: string | number;
  vehicle: VehicleData;
  onBookNow: (vehicle: VehicleData) => void;
}

export default function VehicleCard({ vehicle, onBookNow }: VehicleCardProps) {
  const { lang, t } = useLang();
  const [isFavorite, setIsFavorite] = useState(false);

  const name = lang === 'en' ? vehicle.nameEn : vehicle.nameAr;
  const typeBadge = lang === 'en' ? vehicle.typeEn : vehicle.typeAr;
  const tags = lang === 'en' ? vehicle.tagsEn : vehicle.tagsAr;

  // WhatsApp click link pre-filled message specifically for this vehicle
  const whatsappNumber = "966501234567";
  const getWhatsAppURL = () => {
    const msg = lang === 'en'
      ? `Hello Qawafil Al Majd! I am interested in booking the "${vehicle.nameEn}" (${vehicle.typeEn}) with ${vehicle.seats} seats at the fixed rate of SAR ${vehicle.price}. Please let me know how to proceed.`
      : `مرحباً قوافل المجد! أرغب في الاستفسار وحجز مركبة "${vehicle.nameAr}" (${vehicle.typeAr}) التي تتسع لـ ${vehicle.seats} مقاعد بسعرها الثابت البالغ ${vehicle.price} ريال سعودي. يرجى إفادتي بالتفاصيل.`;
    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`;
  };

  const getTagIcon = (tag: string) => {
    const lower = tag.toLowerCase();
    if (lower.includes('a/c') || lower.includes('klimat') || lower.includes('تكييف') || lower.includes('هو')) {
      return <Snowflake className="w-4 h-4 text-[#C0272D]" />;
    }
    if (lower.includes('wifi') || lower.includes('إنترنت') || lower.includes('وايفاي')) {
      return <Wifi className="w-4 h-4 text-[#C0272D]" />;
    }
    if (lower.includes('usb') || lower.includes('شواحن') || lower.includes('charg')) {
      return <Usb className="w-4 h-4 text-[#C0272D]" />;
    }
    if (lower.includes('seat') || lower.includes('مقاعد') || lower.includes('جلدي')) {
      return <Armchair className="w-4 h-4 text-[#C0272D]" />;
    }
    if (lower.includes('audio') || lower.includes('صوت') || lower.includes('mic') || lower.includes('بلوتوث')) {
      return <Music className="w-4 h-4 text-[#C0272D]" />;
    }
    if (lower.includes('lugg') || lower.includes('bag') || lower.includes('أمتعة') || lower.includes('حقائب')) {
      return <Briefcase className="w-4 h-4 text-[#C0272D]" />;
    }
    return <Sparkles className="w-4 h-4 text-[#C0272D]" />;
  };

  const getBottomLeftBadge = () => {
    if (vehicle.recommended) {
      return (
        <div className="bg-[#FAECEC] text-brand-primary text-[10px] font-black uppercase tracking-widest px-3.5 py-2 rounded-xl flex items-center gap-1.5 border border-brand-primary/10">
          <Star className="w-3.5 h-3.5 fill-brand-primary text-brand-primary" />
          <span>{lang === 'en' ? 'Recommended' : 'موصى به'}</span>
        </div>
      );
    }
    
    // Fallback badges to keep visual symmetry
    switch (vehicle.classFilter) {
      case 'vip':
        return (
          <div className="bg-amber-50 text-amber-700 text-[10px] font-black uppercase tracking-widest px-3.5 py-2 rounded-xl flex items-center gap-1.5 border border-amber-200">
            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-600" />
            <span>{lang === 'en' ? 'VIP Luxury' : 'فخامة VIP'}</span>
          </div>
        );
      case 'business':
        return (
          <div className="bg-brand-light text-brand-primary text-[10px] font-black uppercase tracking-widest px-3.5 py-2 rounded-xl flex items-center gap-1.5 border border-brand-primary/10">
            <Star className="w-3.5 h-3.5 fill-brand-primary text-brand-primary" />
            <span>{lang === 'en' ? 'Premium Class' : 'فئة ممتازة'}</span>
          </div>
        );
      case 'economy':
        return (
          <div className="bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest px-3.5 py-2 rounded-xl flex items-center gap-1.5 border border-emerald-200">
            <Star className="w-3.5 h-3.5 fill-emerald-500 text-emerald-600" />
            <span>{lang === 'en' ? 'Best Value' : 'أفضل قيمة'}</span>
          </div>
        );
      default:
        return (
          <div className="bg-slate-50 text-slate-700 text-[10px] font-black uppercase tracking-widest px-3.5 py-2 rounded-xl flex items-center gap-1.5 border border-slate-200">
            <Star className="w-3.5 h-3.5 fill-slate-400 text-slate-500" />
            <span>{lang === 'en' ? 'Standard' : 'قياسي'}</span>
          </div>
        );
    }
  };

  return (
    <div className="bg-white border border-rose-100 rounded-3xl shadow-md hover:shadow-xl hover:border-brand-primary/20 transition-all duration-300 overflow-hidden flex flex-col justify-between group" id={`vehicle-card-${vehicle.id}`}>
      
      {/* Top Graphic Stage with full cover image */}
      <div className="h-48 sm:h-56 w-full relative overflow-hidden bg-slate-100">
        <img 
          src={getVehicleImageUrl(vehicle.id)} 
          alt={name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {/* Soft dark vignette on image */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-60 pointer-events-none" />
        
        {/* Elegant Slanted white divider overlay at bottom of image */}
        <svg className="absolute bottom-0 left-0 w-full h-8 text-white fill-current pointer-events-none" viewBox="0 0 100 10" preserveAspectRatio="none">
          <polygon points="0,10 100,10 100,0 0,7" />
        </svg>

        {/* Action circle widgets on top right */}
        <div className="absolute top-4 right-4 flex gap-2 z-10">
          {/* WhatsApp Circle */}
          <a
            href={getWhatsAppURL()}
            target="_blank"
            referrerPolicy="no-referrer"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white flex items-center justify-center shadow-md cursor-pointer hover:scale-110 active:scale-95 transition-all duration-200 text-emerald-600 border border-emerald-50"
            title={lang === 'en' ? 'Enquire on WhatsApp' : 'الاستفسار عبر الواتساب'}
          >
            <MessageSquare className="w-4.5 h-4.5 sm:w-5 sm:h-5 fill-emerald-50/20 text-emerald-600" />
          </a>

          {/* Favorite Heart Circle */}
          <button
            type="button"
            onClick={() => setIsFavorite(!isFavorite)}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white flex items-center justify-center shadow-md cursor-pointer hover:scale-110 active:scale-95 transition-all duration-200 border border-rose-50"
          >
            <Heart className={`w-4.5 h-4.5 sm:w-5 sm:h-5 transition-colors duration-200 ${isFavorite ? 'fill-[#C0272D] text-[#C0272D]' : 'text-slate-400'}`} />
          </button>
        </div>

        {/* Overlapping Price Badge at bottom right of image */}
        <div className="absolute bottom-0 right-4 bg-white px-5 py-3 rounded-t-2xl shadow-lg border-x border-t border-rose-50 flex flex-col items-center justify-center translate-y-[2px] z-10">
          <div className="flex items-baseline gap-0.5">
            <span className="text-xl sm:text-2xl font-black text-[#C0272D] leading-none">
              {vehicle.price}
            </span>
            <span className="text-[10px] font-black text-[#C0272D] uppercase ml-0.5">
              {t.currency || 'SAR'}
            </span>
          </div>
          <span className="text-[9px] font-black text-slate-400 tracking-widest uppercase mt-1 leading-none">
            {lang === 'en' ? 'FLAT RATE' : 'سعر ثابت'}
          </span>
        </div>
      </div>

      {/* Details Area */}
      <div className="p-6 flex-1 flex flex-col justify-between">
        <div>
          {/* Header row with vehicle illustration icon + Title & Subtitle */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#FAECEC] flex items-center justify-center text-3xl shrink-0 border border-rose-100 shadow-sm">
              <span className="transform group-hover:scale-110 transition-transform duration-200 select-none">
                {vehicle.emoji === 'SUV' ? '🚙' : vehicle.emoji}
              </span>
            </div>
            <div className="min-w-0">
              <h4 className="text-base sm:text-lg font-black text-slate-900 tracking-tight truncate group-hover:text-brand-primary transition-colors">
                {name}
              </h4>
              <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5 truncate">
                {typeBadge}
              </p>
            </div>
          </div>

          <div className="border-t border-slate-100 my-4" />

          {/* Capacities & Grid */}
          <div className="flex flex-col md:flex-row gap-4 items-stretch">
            {/* Seats Pill */}
            <div className="bg-[#FAECEC]/60 rounded-2xl py-3 px-4 flex items-center gap-3 shrink-0 self-start md:self-center">
              <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-sm">
                <Users className="w-4.5 h-4.5 text-brand-primary" />
              </div>
              <div className="text-xs sm:text-sm font-bold text-slate-800">
                <span className="text-slate-500 font-medium">{lang === 'en' ? 'Seats: ' : 'المقاعد: '}</span>
                <span className="text-brand-primary font-black text-sm sm:text-base">{vehicle.seats}</span>
              </div>
            </div>

            {/* Features list (2x2 grid) */}
            <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-3 pl-1 border-l border-slate-100/60 md:pl-4">
              {tags.slice(0, 4).map((tag, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  {getTagIcon(tag)}
                  <span className="text-[11px] sm:text-xs font-bold text-slate-700 truncate" title={tag}>
                    {tag}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar with visual badge + Book Now CTA button */}
        <div className="flex items-center justify-between gap-4 mt-6 pt-4 border-t border-slate-100">
          <div>
            {getBottomLeftBadge()}
          </div>

          <button
            type="button"
            onClick={() => onBookNow(vehicle)}
            className="bg-brand-primary hover:bg-brand-dark text-white font-extrabold text-xs sm:text-sm px-5 py-3.5 rounded-2xl shadow-md hover:shadow-lg hover:translate-y-[-1px] active:translate-y-[1px] transition-all duration-200 cursor-pointer flex items-center gap-1.5 group-hover:scale-[1.02]"
            id={`book-btn-${vehicle.id}`}
          >
            <span>{lang === 'en' ? 'Book Now' : 'احجز الآن'}</span>
            <ChevronRight className={`w-4 h-4 transition-transform duration-200 group-hover:translate-x-1 ${lang === 'en' ? '' : 'rotate-180 group-hover:-translate-x-1'}`} />
          </button>
        </div>
      </div>

    </div>
  );
}
