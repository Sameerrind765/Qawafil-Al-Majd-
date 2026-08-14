import React, { useState, useMemo } from 'react';
import { useLang } from '../context/LangContext';
import { VehicleData, getVehicleImageUrl } from '../data/vehicles';
import { 
  rates, 
  RouteKey,
  PICKUP_OPTIONS_CARS, 
  DESTINATION_OPTIONS_CARS,
  PICKUP_OPTIONS_BUSES,
  DESTINATION_OPTIONS_BUSES,
  matchPredefinedRoute,
  getScaledRoutePrice,
  getKmEstimatedPrice
} from '../data/ratesService';
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
  Star,
  MapPin,
  Route,
  Gauge
} from 'lucide-react';

interface VehicleCardProps {
  key?: string | number;
  vehicle: VehicleData;
  onBookNow: (vehicle: VehicleData, customDetails?: {
    pickup: string;
    destination: string;
    routeName: string;
    computedPrice: number;
    isEstimated: boolean;
    distanceKm?: number;
  }) => void;
}

export default function VehicleCard({ vehicle, onBookNow }: VehicleCardProps) {
  const { lang, t } = useLang();
  const [isFavorite, setIsFavorite] = useState(false);

  // Dropdown states for interactive card-level route selection
  const isBusOrVan = vehicle.isBusOrVan;
  const [pickupId, setPickupId] = useState<string>('jeddah_airport');
  const [destinationId, setDestinationId] = useState<string>('makkah_hotel');
  const [customDistanceKm, setCustomDistanceKm] = useState<number>(50);

  const name = lang === 'en' ? vehicle.nameEn : vehicle.nameAr;
  const typeBadge = lang === 'en' ? vehicle.typeEn : vehicle.typeAr;
  const tags = lang === 'en' ? vehicle.tagsEn : vehicle.tagsAr;

  // Resolve pricing & route mode
  const { computedPrice, isEstimated, routeLabel, distanceKm } = useMemo(() => {
    const matchedRoute = matchPredefinedRoute(pickupId, destinationId);

    if (matchedRoute && vehicle.rateKey) {
      // Predefined route match - Flat rate
      const flatPrice = getScaledRoutePrice(vehicle.rateKey, matchedRoute.key as RouteKey);
      const label = lang === 'en' ? matchedRoute.nameEn : matchedRoute.nameAr;
      return {
        computedPrice: flatPrice > 0 ? flatPrice : vehicle.price,
        isEstimated: false,
        routeLabel: label,
        distanceKm: undefined
      };
    }

    // Custom or unmatched location:
    if (!isBusOrVan) {
      // Private vehicle / Car KM Fallback rate calculation
      const dist = Math.max(5, customDistanceKm || 50);
      const kmCalc = getKmEstimatedPrice(dist);
      const p = kmCalc.avg;
      const pickupOpt = PICKUP_OPTIONS_CARS.find(o => o.id === pickupId);
      const destOpt = DESTINATION_OPTIONS_CARS.find(o => o.id === destinationId);
      const pName = pickupOpt ? (lang === 'en' ? pickupOpt.nameEn : pickupOpt.nameAr) : (lang === 'en' ? 'Custom Pickup' : 'موقع استلام مخصص');
      const dName = destOpt ? (lang === 'en' ? destOpt.nameEn : destOpt.nameAr) : (lang === 'en' ? 'Custom Destination' : 'وجهة مخصصة');
      
      return {
        computedPrice: p,
        isEstimated: true,
        routeLabel: `${pName} ➔ ${dName}`,
        distanceKm: dist
      };
    }

    // Bus fallback default to base route rate
    const fallbackRate = getScaledRoutePrice(vehicle.rateKey, 'jeddahAirportToMakkahHotel');
    return {
      computedPrice: fallbackRate > 0 ? fallbackRate : vehicle.price,
      isEstimated: false,
      routeLabel: lang === 'en' ? 'Standard Route' : 'مسار قياسي',
      distanceKm: undefined
    };
  }, [pickupId, destinationId, customDistanceKm, vehicle, lang, isBusOrVan]);

  // WhatsApp link tailored with the card's live selected route and price
  const whatsappNumber = "966542049512";
  const getWhatsAppURL = () => {
    const rateTypeStr = isEstimated 
      ? (lang === 'en' ? `Estimated Distance Rate (${distanceKm} km)` : `تسعيرة تقديرية للمسافة (${distanceKm} كم)`)
      : (lang === 'en' ? 'Fixed Flat Rate' : 'سعر مسطح ثابت');

    const msg = lang === 'en'
      ? `Hello Qawafil Al Majd Al Misaliya! I am interested in booking the "${vehicle.nameEn}" (${vehicle.capacity}).\n- Route: ${routeLabel}\n- Price: SAR ${computedPrice} (${rateTypeStr})\nPlease let me know how to proceed.`
      : `مرحباً قوافل المجد المثالية! أرغب في الاستفسار وحجز مركبة "${vehicle.nameAr}" (${vehicle.capacity}).\n- المسار: ${routeLabel}\n- السعر: ${computedPrice} ريال سعودي (${rateTypeStr})\nيرجى إفادتي بالتفاصيل.`;
    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`;
  };

  const getTagIcon = (tag: string) => {
    const lower = tag.toLowerCase();
    if (lower.includes('a/c') || lower.includes('klimat') || lower.includes('تكييف') || lower.includes('هو') || lower.includes('climate')) {
      return <Snowflake className="w-4 h-4 text-[#C0272D]" />;
    }
    if (lower.includes('wifi') || lower.includes('إنترنت') || lower.includes('وايفاي')) {
      return <Wifi className="w-4 h-4 text-[#C0272D]" />;
    }
    if (lower.includes('usb') || lower.includes('شواحن') || lower.includes('charg')) {
      return <Usb className="w-4 h-4 text-[#C0272D]" />;
    }
    if (lower.includes('seat') || lower.includes('مقاعد') || lower.includes('جلدي') || lower.includes('chair')) {
      return <Armchair className="w-4 h-4 text-[#C0272D]" />;
    }
    if (lower.includes('audio') || lower.includes('صوت') || lower.includes('mic') || lower.includes('بلوتوث')) {
      return <Music className="w-4 h-4 text-[#C0272D]" />;
    }
    if (lower.includes('lugg') || lower.includes('bag') || lower.includes('أمتعة') || lower.includes('حقائب') || lower.includes('trunk')) {
      return <Briefcase className="w-4 h-4 text-[#C0272D]" />;
    }
    return <Sparkles className="w-4 h-4 text-[#C0272D]" />;
  };

  const getBottomLeftBadge = () => {
    if (vehicle.recommended) {
      return (
        <div className="bg-[#FAECEC] text-brand-primary text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl flex items-center gap-1.5 border border-brand-primary/10">
          <Star className="w-3.5 h-3.5 fill-brand-primary text-brand-primary" />
          <span>{lang === 'en' ? 'Recommended' : 'موصى به'}</span>
        </div>
      );
    }
    
    switch (vehicle.classFilter) {
      case 'vip':
        return (
          <div className="bg-amber-50 text-amber-700 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl flex items-center gap-1.5 border border-amber-200">
            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-600" />
            <span>{lang === 'en' ? 'VIP Luxury' : 'فخامة VIP'}</span>
          </div>
        );
      case 'business':
        return (
          <div className="bg-brand-light text-brand-primary text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl flex items-center gap-1.5 border border-brand-primary/10">
            <Star className="w-3.5 h-3.5 fill-brand-primary text-brand-primary" />
            <span>{lang === 'en' ? 'Premium Class' : 'فئة ممتازة'}</span>
          </div>
        );
      case 'economy':
        return (
          <div className="bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl flex items-center gap-1.5 border border-emerald-200">
            <Star className="w-3.5 h-3.5 fill-emerald-500 text-emerald-600" />
            <span>{lang === 'en' ? 'Best Value' : 'أفضل قيمة'}</span>
          </div>
        );
      default:
        return (
          <div className="bg-slate-50 text-slate-700 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl flex items-center gap-1.5 border border-slate-200">
            <Star className="w-3.5 h-3.5 fill-slate-400 text-slate-500" />
            <span>{lang === 'en' ? 'Standard' : 'قياسي'}</span>
          </div>
        );
    }
  };

  const pickupOptions = isBusOrVan ? PICKUP_OPTIONS_BUSES : PICKUP_OPTIONS_CARS;
  const destinationOptions = isBusOrVan ? DESTINATION_OPTIONS_BUSES : DESTINATION_OPTIONS_CARS;

  return (
    <div 
      className="bg-white border border-rose-100 rounded-3xl shadow-md hover:shadow-xl hover:border-brand-primary/30 transition-all duration-300 overflow-hidden flex flex-col justify-between group" 
      id={`vehicle-card-${vehicle.id}`}
    >
      
      {/* Top Graphic Stage with full cover image */}
      <div className="h-48 sm:h-52 w-full relative overflow-hidden bg-slate-100">
        <img 
          src={getVehicleImageUrl(vehicle.id)} 
          alt={name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {/* Soft dark vignette on image */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-70 pointer-events-none" />
        
        {/* Slanted white divider overlay at bottom of image */}
        <svg className="absolute bottom-0 left-0 w-full h-7 text-white fill-current pointer-events-none" viewBox="0 0 100 10" preserveAspectRatio="none">
          <polygon points="0,10 100,10 100,0 0,7" />
        </svg>

        {/* Action circle widgets on top right */}
        <div className="absolute top-3.5 right-3.5 flex gap-2 z-10">
          {/* WhatsApp Circle */}
          <a
            href={getWhatsAppURL()}
            target="_blank"
            referrerPolicy="no-referrer"
            className="w-9 h-9 rounded-full bg-white/95 backdrop-blur-sm flex items-center justify-center shadow-md cursor-pointer hover:scale-110 active:scale-95 transition-all duration-200 text-emerald-600 border border-emerald-100"
            title={lang === 'en' ? 'Enquire on WhatsApp' : 'الاستفسار عبر الواتساب'}
          >
            <MessageSquare className="w-4 h-4 fill-emerald-50 text-emerald-600" />
          </a>

          {/* Favorite Heart Circle */}
          <button
            type="button"
            onClick={() => setIsFavorite(!isFavorite)}
            className="w-9 h-9 rounded-full bg-white/95 backdrop-blur-sm flex items-center justify-center shadow-md cursor-pointer hover:scale-110 active:scale-95 transition-all duration-200 border border-rose-100"
          >
            <Heart className={`w-4 h-4 transition-colors duration-200 ${isFavorite ? 'fill-[#C0272D] text-[#C0272D]' : 'text-slate-400'}`} />
          </button>
        </div>

        {/* Live Overlapping Price Badge at bottom right of image */}
        <div className="absolute bottom-0 right-3 bg-white px-4 py-2.5 rounded-t-2xl shadow-lg border-x border-t border-rose-100 flex flex-col items-center justify-center translate-y-[2px] z-10">
          <div className="flex items-baseline gap-0.5">
            <span className="text-xl sm:text-2xl font-black text-[#C0272D] leading-none">
              {computedPrice}
            </span>
            <span className="text-[10px] font-black text-[#C0272D] uppercase ml-1">
              {t.currency || 'SAR'}
            </span>
          </div>
          <span className={`text-[8.5px] font-black tracking-wider uppercase mt-1 leading-none ${isEstimated ? 'text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded' : 'text-slate-400'}`}>
            {isEstimated ? (lang === 'en' ? 'ESTIMATED PRICE' : 'سعر تقديري') : (lang === 'en' ? 'FLAT RATE' : 'سعر ثابت')}
          </span>
        </div>
      </div>

      {/* Details Area */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Header row with vehicle illustration icon + Title & Subtitle */}
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#FAECEC] flex items-center justify-center text-2xl shrink-0 border border-rose-100 shadow-sm">
              <span className="transform group-hover:scale-110 transition-transform duration-200 select-none">
                {vehicle.emoji === 'SUV' ? '🚙' : vehicle.emoji}
              </span>
            </div>
            <div className="min-w-0">
              <h4 className="text-base font-black text-slate-900 tracking-tight truncate group-hover:text-brand-primary transition-colors">
                {name}
              </h4>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                  {typeBadge}
                </span>
                <span className="text-[10px] font-bold text-brand-primary/80 bg-brand-light px-2 py-0.5 rounded-md">
                  {vehicle.capacity}
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 my-3.5" />

          {/* LIVE PICKUP & DESTINATION DROPDOWNS (Always visible, built directly into card) */}
          <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-3 mb-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                <Route className="w-3.5 h-3.5 text-brand-primary" />
                <span>{lang === 'en' ? 'Select Trip Route' : 'تحديد مسار الرحلة'}</span>
              </span>
              {isBusOrVan ? (
                <span className="text-[9px] font-extrabold text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                  {lang === 'en' ? 'Fixed Routes Only' : 'مسارات محددة'}
                </span>
              ) : (
                <span className="text-[9px] font-extrabold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                  {lang === 'en' ? 'Custom or Fixed' : 'مخصص أو ثابت'}
                </span>
              )}
            </div>

            {/* Pickup Location Dropdown */}
            <div className="space-y-1">
              <label className="text-[9.5px] font-bold text-slate-500 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-emerald-600" />
                <span>{lang === 'en' ? 'Pickup Location' : 'موقع الانطلاق'}</span>
              </label>
              <select
                value={pickupId}
                onChange={(e) => setPickupId(e.target.value)}
                className="w-full bg-white border border-slate-200 hover:border-brand-primary/40 focus:border-brand-primary rounded-xl py-1.5 px-2.5 text-xs font-bold text-slate-800 outline-none cursor-pointer transition-colors shadow-2xs"
                id={`pickup-select-${vehicle.id}`}
              >
                {pickupOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {lang === 'en' ? opt.nameEn : opt.nameAr}
                  </option>
                ))}
              </select>
            </div>

            {/* Destination Location Dropdown */}
            <div className="space-y-1">
              <label className="text-[9.5px] font-bold text-slate-500 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#C0272D]" />
                <span>{lang === 'en' ? 'Destination' : 'الوجهة والوصول'}</span>
              </label>
              <select
                value={destinationId}
                onChange={(e) => setDestinationId(e.target.value)}
                className="w-full bg-white border border-slate-200 hover:border-brand-primary/40 focus:border-brand-primary rounded-xl py-1.5 px-2.5 text-xs font-bold text-slate-800 outline-none cursor-pointer transition-colors shadow-2xs"
                id={`destination-select-${vehicle.id}`}
              >
                {destinationOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {lang === 'en' ? opt.nameEn : opt.nameAr}
                  </option>
                ))}
              </select>
            </div>

            {/* Distance Input for Cars / Private Vehicles with Custom Location */}
            {!isBusOrVan && isEstimated && (
              <div className="pt-1.5 border-t border-slate-200/60 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-amber-600" />
                  <span className="text-[10px] font-bold text-slate-700">
                    {lang === 'en' ? 'Distance (km):' : 'المسافة (كم):'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="5"
                    max="1500"
                    value={customDistanceKm}
                    onChange={(e) => setCustomDistanceKm(Number(e.target.value) || 0)}
                    className="w-20 bg-white border border-amber-300 focus:border-brand-primary rounded-lg py-1 px-2 text-xs font-black text-slate-900 text-center outline-none"
                    placeholder="50"
                  />
                  <span className="text-[10px] font-extrabold text-slate-400">KM</span>
                </div>
              </div>
            )}

            {/* Rate notes */}
            <div className="text-[9px] font-bold text-slate-400 flex items-center justify-between pt-0.5">
              <span className="truncate max-w-[200px]" title={routeLabel}>
                {routeLabel}
              </span>
              {isEstimated && (
                <span className="text-amber-600 font-extrabold shrink-0">
                  {rates.kmFallbackRate.min * rates.globalMultiplier}–{rates.kmFallbackRate.max * rates.globalMultiplier} SAR/km
                </span>
              )}
            </div>
          </div>

          {/* Features summary 2x2 grid */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-2 mb-2">
            {tags.slice(0, 4).map((tag, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                {getTagIcon(tag)}
                <span className="text-[11px] font-bold text-slate-700 truncate" title={tag}>
                  {tag}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar with visual badge + Book Now CTA button */}
        <div className="flex items-center justify-between gap-3 mt-4 pt-3.5 border-t border-slate-100">
          <div>
            {getBottomLeftBadge()}
          </div>

          <button
            type="button"
            onClick={() => onBookNow(vehicle, {
              pickup: pickupId,
              destination: destinationId,
              routeName: routeLabel,
              computedPrice,
              isEstimated,
              distanceKm: isEstimated ? customDistanceKm : undefined
            })}
            className="bg-brand-primary hover:bg-brand-dark text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md hover:shadow-lg hover:translate-y-[-1px] active:translate-y-[1px] transition-all duration-200 cursor-pointer flex items-center gap-1.5 group-hover:scale-[1.02]"
            id={`book-btn-${vehicle.id}`}
          >
            <span>{lang === 'en' ? 'Book Now' : 'احجز الآن'}</span>
            <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5 ${lang === 'en' ? '' : 'rotate-180 group-hover:-translate-x-0.5'}`} />
          </button>
        </div>
      </div>

    </div>
  );
}
