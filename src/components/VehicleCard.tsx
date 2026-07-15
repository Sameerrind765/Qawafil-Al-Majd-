import React from 'react';
import { useLang } from '../context/LangContext';
import { VehicleData } from '../data/vehicles';
import { Users, Info, MessageSquare, Ticket, Snowflake, Wifi } from 'lucide-react';

interface VehicleCardProps {
  key?: string | number;
  vehicle: VehicleData;
  onBookNow: (vehicle: VehicleData) => void;
}

export default function VehicleCard({ vehicle, onBookNow }: VehicleCardProps) {
  const { lang, t } = useLang();

  const name = lang === 'en' ? vehicle.nameEn : vehicle.nameAr;
  const typeBadge = lang === 'en' ? vehicle.typeEn : vehicle.typeAr;
  const tags = lang === 'en' ? vehicle.tagsEn : vehicle.tagsAr;

  // Render proper badge color depending on category
  const getBadgeColor = () => {
    switch (vehicle.classFilter) {
      case 'vip':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'business':
        return 'bg-brand-light text-brand-primary border-brand-primary/20';
      case 'economy':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  // WhatsApp click link pre-filled message specifically for this vehicle
  const whatsappNumber = "966501234567";
  const getWhatsAppURL = () => {
    const msg = lang === 'en'
      ? `Hello Qawafil Al Majd! I am interested in booking the "${vehicle.nameEn}" (${vehicle.typeEn}) with ${vehicle.seats} seats at the fixed rate of SAR ${vehicle.price}. Please let me know how to proceed.`
      : `مرحباً قوافل المجد! أرغب في الاستفسار وحجز مركبة "${vehicle.nameAr}" (${vehicle.typeAr}) التي تتسع لـ ${vehicle.seats} مقاعد بسعرها الثابت البالغ ${vehicle.price} ريال سعودي. يرجى إفادتي بالتفاصيل.`;
    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`;
  };

  return (
    <div className="bg-white border border-rose-100 rounded-2xl shadow-md hover:shadow-xl hover:border-brand-primary/20 transition-all duration-300 overflow-hidden flex flex-col justify-between group" id={`vehicle-card-${vehicle.id}`}>
      
      {/* Top Graphic Stage */}
      <div className="bg-gradient-to-br from-rose-50/50 to-white p-6 pb-2 relative flex flex-col items-center">
        {/* Recommended Badge Indicator */}
        {vehicle.recommended && (
          <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 bg-brand-primary text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow shadow-brand-primary/10">
            ★ Recommended
          </span>
        )}
        
        {/* Large Emoji Representation */}
        <div className="w-20 h-20 bg-white rounded-3xl border border-rose-50 shadow-sm flex items-center justify-center text-4xl group-hover:scale-105 transition-transform duration-300 mt-2">
          {vehicle.emoji === 'SUV' ? '🚙' : vehicle.emoji}
        </div>

        {/* Vehicle Class Pill */}
        <div className="mt-4">
          <span className={`text-[10px] uppercase tracking-wider font-extrabold px-3 py-1 rounded-full border ${getBadgeColor()}`}>
            {typeBadge}
          </span>
        </div>
      </div>

      {/* Details Box */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h4 className="text-base font-extrabold text-slate-850 tracking-tight group-hover:text-brand-primary transition-colors">
            {name}
          </h4>

          {/* Seat Capacity layout */}
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold mt-1.5 mb-3">
            <Users className="w-4 h-4 text-brand-primary" />
            <span>{vehicle.seats} {t.seats}</span>
          </div>

          {/* Luxury Tags List */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {tags.map((tag, idx) => (
              <span key={idx} className="bg-slate-50 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1">
                {tag.toLowerCase().includes('wifi') || tag.toLowerCase().includes('إنترنت') ? (
                  <Wifi className="w-3 h-3 text-emerald-500" />
                ) : tag.toLowerCase().includes('a/c') || tag.toLowerCase().includes('تكييف') ? (
                  <Snowflake className="w-3 h-3 text-blue-500" />
                ) : null}
                <span>{tag}</span>
              </span>
            ))}
          </div>
        </div>

        <div>
          {/* Price Tag box */}
          <div className="bg-rose-50/40 p-3 rounded-xl flex items-center justify-between mb-4 border border-rose-100/30">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">
              Flat Guaranteed Rate
            </span>
            <div className="text-right">
              <span className="text-brand-primary text-lg font-extrabold">
                {vehicle.price}
              </span>
              <span className="text-xs text-brand-primary font-extrabold ml-1 font-mono">
                {t.currency}
              </span>
            </div>
          </div>

          {/* Dispatch/Booking buttons */}
          <div className="grid grid-cols-2 gap-2">
            <a
              href={getWhatsAppURL()}
              target="_blank"
              referrerPolicy="no-referrer"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-2.5 px-2 rounded-xl text-center flex items-center justify-center gap-1.5 shadow hover:shadow-md cursor-pointer transition-all duration-200 decoration-transparent"
              id={`whatsapp-btn-${vehicle.id}`}
            >
              <MessageSquare className="w-3.5 h-3.5 shrink-0" />
              <span>WhatsApp</span>
            </a>

            <button
              type="button"
              onClick={() => onBookNow(vehicle)}
              className="bg-brand-primary hover:bg-brand-dark text-white font-extrabold text-xs py-2.5 px-2 rounded-xl text-center flex items-center justify-center gap-1.5 shadow hover:shadow-md cursor-pointer transition-all duration-200"
              id={`book-btn-${vehicle.id}`}
            >
              <Ticket className="w-3.5 h-3.5 shrink-0" />
              <span>{t.navBookNow}</span>
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
