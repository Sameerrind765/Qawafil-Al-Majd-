import React, { useState, useMemo, useEffect } from 'react';
import { useLang } from '../context/LangContext';
import { VehicleData, getVehicleImageUrl } from '../data/vehicles';
import { 
  Heart, 
  ChevronRight, 
  MapPin, 
  Sparkles, 
  Route, 
  Gauge, 
  MessageSquare, 
  Star, 
  ShieldCheck, 
  Users, 
  Briefcase, 
  Compass, 
  Layers,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
  Sliders,
  Plane
} from 'lucide-react';
import { 
  rates, 
  PICKUP_OPTIONS, 
  DESTINATION_OPTIONS, 
  PACKAGE_OPTIONS,
  FULL_CIRCUIT_OPTIONS,
  resolveCityToCityRoute, 
  getLocationCity,
  getCityRoutePrice, 
  getVehicleKmPrice, 
  getVehicleKmFallbackRate,
  PackageOption,
  JEDDAH_TERMINAL_OPTIONS,
  JeddahTerminalId,
  HAJJ_TERMINAL_SURCHARGE,
  getTerminalSurcharge
} from '../data/ratesService';
import { isDateInCurrentMonth, getRateGuaranteePolicy } from '../utils/pricingPolicy';

interface VehicleCardProps {
  vehicle: VehicleData;
  bookingDate?: string;
  initialPickupId?: string;
  initialDestinationId?: string;
  initialPickupTerminal?: JeddahTerminalId;
  initialDestinationTerminal?: JeddahTerminalId;
  onBookNow: (vehicle: VehicleData, customDetails?: {
    pickup: string;
    destination: string;
    routeName: string;
    computedPrice: number;
    isEstimated: boolean;
    distanceKm?: number;
    circuitPackageId?: string;
    terminalSurcharge?: number;
    pickupTerminal?: JeddahTerminalId;
    destinationTerminal?: JeddahTerminalId;
  }) => void;
}

export default function VehicleCard({ 
  vehicle, 
  bookingDate,
  initialPickupId,
  initialDestinationId,
  initialPickupTerminal,
  initialDestinationTerminal,
  onBookNow 
}: VehicleCardProps) {
  const { lang, t } = useLang();
  const [isFavorite, setIsFavorite] = useState(false);

  // 3 Distinct Trip Modes:
  // 'city': Standard City-to-City preset routes
  // 'circuit': Packages (Full Ground Transport & Ziyarat Tours)
  // 'custom': Custom Destination with distance-based per-km calculation
  const [tripMode, setTripMode] = useState<'city' | 'circuit' | 'custom'>('city');

  // City-to-city route selections
  const [pickupId, setPickupId] = useState<string>(initialPickupId || 'jeddah_airport');
  const [destinationId, setDestinationId] = useState<string>(initialDestinationId || 'makkah_hotel');

  // Conditional Jeddah Airport terminal selections (Hajj Terminal +30 SAR surcharge; Terminal 1 & North Terminal: 0 SAR)
  const [pickupTerminal, setPickupTerminal] = useState<JeddahTerminalId>(initialPickupTerminal || 'terminal_1');
  const [destinationTerminal, setDestinationTerminal] = useState<JeddahTerminalId>(initialDestinationTerminal || 'terminal_1');

  // Sync if initial props change
  useEffect(() => {
    if (initialPickupId) setPickupId(initialPickupId);
    if (initialDestinationId) setDestinationId(initialDestinationId);
    if (initialPickupTerminal) setPickupTerminal(initialPickupTerminal);
    if (initialDestinationTerminal) setDestinationTerminal(initialDestinationTerminal);
  }, [initialPickupId, initialDestinationId, initialPickupTerminal, initialDestinationTerminal]);

  // Package selection
  const [packageOptionId, setPackageOptionId] = useState<string>('standard_circuit');

  // Custom trip inputs
  const [customDestinationText, setCustomDestinationText] = useState<string>('');
  const [customDistanceKm, setCustomDistanceKm] = useState<number>(100);

  // Per-vehicle fallback KM rate (Camry: 3.89, Taurus: 4.44, Yukon: 5.56, H1: 2.56, Hiace: 3.67, Coaster: 5.89)
  const kmRate = useMemo(() => {
    return getVehicleKmFallbackRate(vehicle.rateKey);
  }, [vehicle.rateKey]);

  // Selected package object
  const selectedPackage = useMemo(() => {
    return PACKAGE_OPTIONS.find(c => c.id === packageOptionId) || PACKAGE_OPTIONS[0];
  }, [packageOptionId]);

  // Calculate terminal surcharge (Hajj Terminal = +30 SAR; others = 0)
  const terminalSurcharge = useMemo(() => {
    let surcharge = 0;
    if (pickupId === 'jeddah_airport') {
      surcharge += getTerminalSurcharge(pickupTerminal);
    }
    if (destinationId === 'jeddah_airport') {
      surcharge += getTerminalSurcharge(destinationTerminal);
    }
    return surcharge;
  }, [pickupId, pickupTerminal, destinationId, destinationTerminal]);

  // Dynamic Calculation based on mode and city-to-city logic
  const { computedPrice, isEstimated, routeLabel, distanceKm } = useMemo(() => {
    // 1. PACKAGE MODE (Exclusive)
    if (tripMode === 'circuit') {
      const price = getCityRoutePrice(vehicle.rateKey, selectedPackage.rateKey);
      const label = lang === 'en' ? selectedPackage.nameEn : selectedPackage.nameAr;
      return {
        computedPrice: price || vehicle.price,
        isEstimated: false,
        routeLabel: label,
        distanceKm: undefined
      };
    }

    // 2. CUSTOM DESTINATION MODE (Distance-based per-KM fallback)
    if (tripMode === 'custom' || destinationId === 'custom') {
      const { totalPrice } = getVehicleKmPrice(vehicle.rateKey, customDistanceKm);
      const destName = customDestinationText.trim() 
        ? customDestinationText.trim() 
        : (lang === 'en' ? 'Custom Destination' : 'وجهة مخصصة');
      
      const pickupObj = PICKUP_OPTIONS.find(p => p.id === pickupId);
      let pickupName = pickupObj ? (lang === 'en' ? pickupObj.nameEn : pickupObj.nameAr) : pickupId;
      if (pickupId === 'jeddah_airport') {
        const termObj = JEDDAH_TERMINAL_OPTIONS.find(t => t.id === pickupTerminal);
        pickupName = lang === 'en' 
          ? `Jeddah [${termObj?.nameEn || 'Terminal'}]` 
          : `جدة [${termObj?.nameAr || 'الصالة'}]`;
      }

      const customPickupSurcharge = pickupId === 'jeddah_airport' ? getTerminalSurcharge(pickupTerminal) : 0;

      return {
        computedPrice: totalPrice + customPickupSurcharge,
        isEstimated: true,
        routeLabel: `${pickupName} ➔ ${destName} (${customDistanceKm} km)`,
        distanceKm: customDistanceKm
      };
    }

    // 3. CITY-TO-CITY PRESET ROUTE MODE
    // Evaluates cities involved (e.g. Jeddah Airport ➔ Madina Hotel == Jeddah Airport ➔ Madina Airport)
    const matchedCityRoute = resolveCityToCityRoute(pickupId, destinationId);

    if (matchedCityRoute && matchedCityRoute.rateKey) {
      const price = getCityRoutePrice(vehicle.rateKey, matchedCityRoute.rateKey);
      if (price > 0) {
        let label = '';
        if (!matchedCityRoute.isCityToCity) {
          label = lang === 'en' ? matchedCityRoute.routeNameEn : matchedCityRoute.routeNameAr;
        } else {
          const pickupCity = getLocationCity(pickupId);
          const destCity = getLocationCity(destinationId);

          let fromName = '';
          if (pickupCity === 'jeddah') {
            const termObj = JEDDAH_TERMINAL_OPTIONS.find(t => t.id === pickupTerminal);
            fromName = pickupId === 'jeddah_airport' && termObj
              ? (lang === 'en' ? `Jeddah [${termObj.nameEn}]` : `جدة [${termObj.nameAr}]`)
              : (lang === 'en' ? 'Jeddah' : 'جدة');
          } else if (pickupCity === 'makkah') {
            fromName = lang === 'en' ? 'Makkah' : 'مكة المكرمة';
          } else if (pickupCity === 'madina') {
            fromName = lang === 'en' ? 'Madinah' : 'المدينة المنورة';
          } else if (pickupCity === 'taif') {
            fromName = lang === 'en' ? 'Taif' : 'الطائف';
          } else {
            const pObj = PICKUP_OPTIONS.find(p => p.id === pickupId);
            fromName = pObj ? (lang === 'en' ? pObj.nameEn : pObj.nameAr) : pickupId;
          }

          let toName = '';
          if (destCity === 'jeddah') {
            const termObj = JEDDAH_TERMINAL_OPTIONS.find(t => t.id === destinationTerminal);
            toName = destinationId === 'jeddah_airport' && termObj
              ? (lang === 'en' ? `Jeddah [${termObj.nameEn}]` : `جدة [${termObj.nameAr}]`)
              : (lang === 'en' ? 'Jeddah' : 'جدة');
          } else if (destCity === 'makkah') {
            toName = lang === 'en' ? 'Makkah' : 'مكة المكرمة';
          } else if (destCity === 'madina') {
            toName = lang === 'en' ? 'Madinah' : 'المدينة المنورة';
          } else if (destCity === 'taif') {
            toName = lang === 'en' ? 'Taif' : 'الطائف';
          } else {
            const dObj = DESTINATION_OPTIONS.find(d => d.id === destinationId);
            toName = dObj ? (lang === 'en' ? dObj.nameEn : dObj.nameAr) : destinationId;
          }

          label = `${fromName} ➔ ${toName}`;
        }

        return {
          computedPrice: price + terminalSurcharge,
          isEstimated: false,
          routeLabel: label,
          distanceKm: undefined
        };
      }
    }

    // Fallback: Default vehicle price + terminal surcharge
    return {
      computedPrice: vehicle.price + terminalSurcharge,
      isEstimated: false,
      routeLabel: lang === 'en' ? 'Standard Route' : 'مسار اعتيادي',
      distanceKm: undefined
    };
  }, [
    tripMode, 
    pickupId, 
    destinationId, 
    packageOptionId, 
    customDestinationText, 
    customDistanceKm, 
    vehicle.rateKey, 
    vehicle.price, 
    selectedPackage, 
    lang,
    terminalSurcharge,
    pickupTerminal,
    destinationTerminal
  ]);

  const name = lang === 'en' ? vehicle.nameEn : vehicle.nameAr;
  const typeBadge = lang === 'en' ? vehicle.typeEn : vehicle.typeAr;
  const tags = (lang === 'en' ? vehicle.tagsEn : vehicle.tagsAr) || [];

  // WhatsApp helper
  const ratePolicy = getRateGuaranteePolicy(bookingDate, computedPrice);

  const getWhatsAppURL = () => {
    let modeText = '';
    if (tripMode === 'circuit') {
      modeText = `[Package: ${selectedPackage.nameEn}]`;
    } else if (tripMode === 'custom') {
      modeText = `[Custom Trip: ${customDistanceKm} KM @ ${kmRate} SAR/KM]`;
    } else {
      modeText = `[City Route: ${routeLabel}]`;
    }

    let policyNote = '';
    let priceLine = '';
    if (ratePolicy.isLaterThanThreeMonths) {
      priceLine = `Price: ${lang === 'en' ? 'Reservation confirmed; final price will be finalized 2 weeks before travel at 10% below the market rate.' : 'الحجز مؤكد؛ سيتم اعتماد السعر النهائي قبل أسبوعين من موعد السفر بخصم 10% عن سعر السوق السائد.'}`;
      policyNote = `- *Rate Policy:* ${ratePolicy.policyStatementEn}`;
    } else if (ratePolicy.isCurrentMonth) {
      priceLine = `Price: ${computedPrice} SAR (${isEstimated ? 'Estimated' : 'Flat Rate'})`;
      policyNote = `- *Rate Policy:* Guaranteed Fixed Rate (${computedPrice} SAR)`;
    } else {
      priceLine = `Price: ${computedPrice} SAR (Benchmark Reference)`;
      policyNote = `- *Rate Policy:* ${ratePolicy.policyStatementEn} (Benchmark: ${computedPrice} SAR)`;
    }

    const text = encodeURIComponent(
      `Assalamu Alaikum, I would like to book ${vehicle.nameEn} with Qawafil Al Majd.\n` +
      `Trip Type: ${modeText}\n` +
      `Route: ${routeLabel}\n` +
      `${priceLine}\n` +
      `${policyNote}\n` +
      `Vehicle Capacity: ${vehicle.capacity}`
    );
    return `https://wa.me/966567540263?text=${text}`;
  };

  const getTagIcon = (tag: string) => {
    const tLower = tag.toLowerCase();
    if (tLower.includes('bag') || tLower.includes('luggage') || tLower.includes('حقيبة')) {
      return <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
    }
    if (tLower.includes('seat') || tLower.includes('pax') || tLower.includes('راكب')) {
      return <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
    }
    return <Sparkles className="w-3.5 h-3.5 text-brand-primary shrink-0" />;
  };

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
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent pointer-events-none" />
        
        {/* Slanted white divider overlay at bottom of image */}
        <svg className="absolute bottom-0 left-0 w-full h-7 text-white fill-current pointer-events-none" viewBox="0 0 100 10" preserveAspectRatio="none">
          <polygon points="0,10 100,10 100,0 0,7" />
        </svg>

        {/* Action circle widgets on top right */}
        <div className="absolute top-3.5 right-3.5 flex gap-2 z-10">
          <a
            href={getWhatsAppURL()}
            target="_blank"
            referrerPolicy="no-referrer"
            className="w-9 h-9 rounded-full bg-white/95 backdrop-blur-sm flex items-center justify-center shadow-md cursor-pointer hover:scale-110 active:scale-95 transition-all duration-200 text-emerald-600 border border-emerald-100"
            title={lang === 'en' ? 'Enquire on WhatsApp' : 'الاستفسار عبر الواتساب'}
          >
            <MessageSquare className="w-4 h-4 fill-emerald-50 text-emerald-600" />
          </a>

          <button
            type="button"
            onClick={() => setIsFavorite(!isFavorite)}
            className="w-9 h-9 rounded-full bg-white/95 backdrop-blur-sm flex items-center justify-center shadow-md cursor-pointer hover:scale-110 active:scale-95 transition-all duration-200 border border-rose-100"
          >
            <Heart className={`w-4 h-4 transition-colors duration-200 ${isFavorite ? 'fill-[#C0272D] text-[#C0272D]' : 'text-slate-400'}`} />
          </button>
        </div>

        {/* Top left Class Badge */}
        <div className="absolute top-3.5 left-3.5 z-10">
          <span className="bg-white/90 backdrop-blur-sm text-slate-800 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border border-white/50 shadow-sm">
            {typeBadge}
          </span>
        </div>

        {/* Live Overlapping Price Badge at bottom right of image */}
        <div className="absolute bottom-0 right-3 bg-white px-3.5 py-1.5 rounded-t-2xl shadow-lg border-x border-t border-rose-100 flex flex-col items-center justify-center translate-y-[2px] z-10 min-w-[125px]">
          {ratePolicy.isLaterThanThreeMonths ? (
            <>
              <div className="flex items-center gap-1">
                <span className="text-xl sm:text-2xl font-black text-amber-700 leading-none">
                  -10%
                </span>
                <span className="text-[9px] font-black text-slate-700 uppercase tracking-tight">
                  {lang === 'en' ? 'MARKET RATE' : 'سعر السوق'}
                </span>
              </div>
              <span className="text-[8px] font-black tracking-wider uppercase mt-1 leading-none text-amber-900 bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded text-center whitespace-nowrap">
                {lang === 'en' ? '10% BELOW MARKET' : 'أقل بـ 10% من السوق'}
              </span>
            </>
          ) : (
            <>
              <div className="flex items-baseline gap-0.5">
                <span className="text-xl sm:text-2xl font-black text-[#C0272D] leading-none">
                  {computedPrice}
                </span>
                <span className="text-[10px] font-black text-[#C0272D] uppercase ml-1">
                  {t.currency || 'SAR'}
                </span>
              </div>
              <span className={`text-[8px] font-black tracking-wider uppercase mt-1 leading-none ${
                bookingDate && !isDateInCurrentMonth(bookingDate)
                  ? 'text-amber-900 bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded'
                  : isEstimated 
                    ? 'text-amber-700 bg-amber-100/70 px-1.5 py-0.5 rounded' 
                    : tripMode === 'circuit'
                      ? 'text-purple-700 bg-purple-100/70 px-1.5 py-0.5 rounded'
                      : 'text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded'
              }`}>
                {bookingDate && !isDateInCurrentMonth(bookingDate)
                  ? (lang === 'en' ? '10% BELOW MARKET' : 'خصم 10% عن السوق')
                  : isEstimated 
                    ? (lang === 'en' ? 'KM ESTIMATED' : 'حساب بالمسافة') 
                    : tripMode === 'circuit'
                      ? (lang === 'en' ? 'PACKAGE DEAL' : 'باقة رحلات')
                      : (lang === 'en' ? 'FIXED FARE' : 'سعر ثابت')}
              </span>
            </>
          )}
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
            <div className="min-w-0 flex-1">
              <h4 className="text-base font-black text-slate-900 tracking-tight truncate group-hover:text-brand-primary transition-colors">
                {name}
              </h4>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                  {vehicle.capacity}
                </span>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                  {kmRate} SAR/km
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 my-3" />

          {/* TRIP MODE SELECTOR TABS: City Route | Packages | Custom Trip */}
          <div className="flex items-center p-1 bg-slate-100/80 rounded-xl mb-3 text-[10px] font-extrabold">
            <button
              type="button"
              onClick={() => {
                setTripMode('city');
                if (destinationId === 'custom') setDestinationId('makkah_hotel');
              }}
              className={`flex-1 py-1.5 px-2 rounded-lg text-center transition-all cursor-pointer ${
                tripMode === 'city'
                  ? 'bg-white text-brand-primary shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {lang === 'en' ? 'City Route' : 'مسار المدن'}
            </button>
            <button
              type="button"
              onClick={() => setTripMode('circuit')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-center transition-all cursor-pointer ${
                tripMode === 'circuit'
                  ? 'bg-purple-600 text-white shadow-xs font-black'
                  : 'text-slate-600 hover:text-purple-700'
              }`}
            >
              {lang === 'en' ? 'Packages' : 'الباقات'}
            </button>
            <button
              type="button"
              onClick={() => {
                setTripMode('custom');
                setDestinationId('custom');
              }}
              className={`flex-1 py-1.5 px-2 rounded-lg text-center transition-all cursor-pointer ${
                tripMode === 'custom'
                  ? 'bg-amber-500 text-slate-950 shadow-xs font-black'
                  : 'text-slate-600 hover:text-amber-700'
              }`}
            >
              {lang === 'en' ? 'Custom KM' : 'مسار مخصص'}
            </button>
          </div>

          {/* ========================================================================= */}
          {/* 1. EXCLUSIVE PACKAGES & ZIYARAT MODE                                      */}
          {/* ========================================================================= */}
          {tripMode === 'circuit' && (
            <div className="bg-purple-50/70 border border-purple-200 rounded-2xl p-3 mb-3.5 space-y-2.5 transition-all animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-purple-700" />
                  <span>{lang === 'en' ? 'Travel & Ziyarat Packages' : 'باقات التنقل والمزارات الشريفة'}</span>
                </span>
                <span className="text-[9px] font-extrabold text-purple-700 bg-white px-2 py-0.5 rounded-full border border-purple-200">
                  {lang === 'en' ? 'Special Package' : 'باقة مميزة'}
                </span>
              </div>

              {/* Package selector options */}
              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {PACKAGE_OPTIONS.map((pkg) => {
                  const isSelected = packageOptionId === pkg.id;
                  const price = getCityRoutePrice(vehicle.rateKey, pkg.rateKey);
                  const isZiyarat = pkg.category === 'ziyarat';

                  return (
                    <div
                      key={pkg.id}
                      onClick={() => setPackageOptionId(pkg.id)}
                      className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected 
                          ? isZiyarat
                            ? 'bg-white border-emerald-500 shadow-xs ring-1 ring-emerald-400'
                            : 'bg-white border-purple-500 shadow-xs ring-1 ring-purple-400' 
                          : 'bg-white/70 border-purple-100 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-3.5 h-3.5 rounded-full border shrink-0 flex items-center justify-center ${
                            isSelected 
                              ? isZiyarat ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-purple-600 bg-purple-600 text-white' 
                              : 'border-slate-300'
                          }`}>
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                          <span className="text-xs font-black text-slate-850 truncate">
                            {lang === 'en' ? pkg.nameEn : pkg.nameAr}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={`text-[8.5px] font-black px-1.5 py-0.5 rounded ${
                            isZiyarat 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {lang === 'en' ? pkg.badgeEn : pkg.badgeAr}
                          </span>
                          <span className={`text-xs font-black ${isZiyarat ? 'text-emerald-800' : 'text-purple-800'}`}>
                            {price} SAR
                          </span>
                        </div>
                      </div>
                      <p className="text-[9.5px] text-slate-500 mt-1 pl-5 leading-tight">
                        {lang === 'en' ? pkg.descriptionEn : pkg.descriptionAr}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Itinerary route stops */}
              <div className="bg-white rounded-xl p-2.5 border border-purple-100">
                <span className="text-[9px] font-black text-purple-900 uppercase tracking-wider block mb-1.5">
                  {lang === 'en' ? 'Included Itinerary & Holy Sites:' : 'المحطات والمزارات المشمولة في الباقة:'}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[9.5px] font-bold text-slate-600">
                  {(lang === 'en' ? selectedPackage.stopsEn : selectedPackage.stopsAr).map((stop, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 truncate">
                      <CheckCircle2 className={`w-3 h-3 shrink-0 ${selectedPackage.category === 'ziyarat' ? 'text-emerald-600' : 'text-purple-600'}`} />
                      <span className="truncate">{stop}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 2. ADAPTIVE CUSTOM DESTINATION MODE (Visible layout change & per-km rate)  */}
          {/* ========================================================================= */}
          {tripMode === 'custom' && (
            <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-3 mb-3.5 space-y-2.5 transition-all animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-amber-700" />
                  <span>{lang === 'en' ? 'Custom Destination & Distance Mode' : 'وضع الوجهة والمسار المخصص'}</span>
                </span>
                <span className="text-[9px] font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                  {kmRate} SAR/km
                </span>
              </div>

              {/* Filtered Pickup Location: STRICTLY actual geographic pickups, NO Full Circuit */}
              <div className="space-y-1">
                <label className="text-[9.5px] font-bold text-slate-700 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-emerald-600" />
                  <span>{lang === 'en' ? 'Pickup Location' : 'موقع الانطلاق'}</span>
                </label>
                <select
                  value={pickupId}
                  onChange={(e) => setPickupId(e.target.value)}
                  className="w-full bg-white border border-amber-200 focus:border-amber-500 rounded-xl py-1.5 px-2.5 text-xs font-bold text-slate-800 outline-none cursor-pointer shadow-2xs"
                  id={`custom-pickup-${vehicle.id}`}
                >
                  {PICKUP_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {lang === 'en' ? opt.nameEn : opt.nameAr}
                    </option>
                  ))}
                </select>
              </div>

              {/* Conditional Jeddah Airport Terminal Selection for Custom Pickup */}
              {pickupId === 'jeddah_airport' && (
                <div className="space-y-1 animate-fadeIn">
                  <label className="text-[9.5px] font-bold text-slate-700 flex items-center gap-1">
                    <Plane className="w-3 h-3 text-slate-400" />
                    <span>{lang === 'en' ? 'Jeddah Pickup Terminal' : 'صالة الانطلاق بمطار جدة'}</span>
                  </label>
                  <select
                    value={pickupTerminal}
                    onChange={(e) => setPickupTerminal(e.target.value as JeddahTerminalId)}
                    className="w-full bg-white border border-amber-200 focus:border-amber-500 rounded-xl py-1.5 px-2.5 text-xs font-bold text-slate-800 outline-none cursor-pointer shadow-2xs"
                    id={`custom-pickup-terminal-${vehicle.id}`}
                  >
                    {JEDDAH_TERMINAL_OPTIONS.map((term) => (
                      <option key={term.id} value={term.id}>
                        {lang === 'en' ? term.nameEn : term.nameAr}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Custom Destination Text Input */}
              <div className="space-y-1">
                <label className="text-[9.5px] font-bold text-slate-700 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#C0272D]" />
                  <span>{lang === 'en' ? 'Custom Destination / City' : 'وجهة الوصول المخصصة'}</span>
                </label>
                <input
                  type="text"
                  value={customDestinationText}
                  onChange={(e) => setCustomDestinationText(e.target.value)}
                  placeholder={lang === 'en' ? 'e.g. Yanbu, Badr, Taif, Private Residence...' : 'مثال: ينبع، بدر، رابغ، سكن خاص...'}
                  className="w-full bg-white border border-amber-200 focus:border-amber-500 rounded-xl py-1.5 px-2.5 text-xs font-bold text-slate-800 outline-none shadow-2xs"
                />
              </div>

              {/* Distance Slider and Numeric Input */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-[9.5px] font-bold text-slate-700 flex items-center gap-1">
                    <Gauge className="w-3 h-3 text-amber-700" />
                    <span>{lang === 'en' ? 'Trip Distance (Kilometers):' : 'مسافة الرحلة (بالكيلومتر):'}</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="10"
                      max="1500"
                      value={customDistanceKm}
                      onChange={(e) => setCustomDistanceKm(Math.max(5, Number(e.target.value) || 0))}
                      className="w-16 bg-white border border-amber-300 focus:border-amber-500 rounded-lg py-0.5 px-1.5 text-xs font-black text-slate-900 text-center outline-none"
                    />
                    <span className="text-[10px] font-black text-slate-500">KM</span>
                  </div>
                </div>

                <input
                  type="range"
                  min="20"
                  max="500"
                  step="10"
                  value={customDistanceKm}
                  onChange={(e) => setCustomDistanceKm(Number(e.target.value))}
                  className="w-full accent-amber-600 h-1.5 bg-amber-200 rounded-lg cursor-pointer"
                />

                {/* Quick Presets */}
                <div className="flex items-center justify-between gap-1 pt-0.5">
                  {[50, 90, 150, 300, 450].map((km) => (
                    <button
                      key={km}
                      type="button"
                      onClick={() => setCustomDistanceKm(km)}
                      className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                        customDistanceKm === km 
                          ? 'bg-amber-600 text-white border-amber-600' 
                          : 'bg-white text-slate-600 border-amber-200 hover:bg-amber-100'
                      }`}
                    >
                      {km} km
                    </button>
                  ))}
                </div>

                {/* Live Formula breakdown */}
                <div className="bg-white/80 rounded-lg p-1.5 border border-amber-200 flex items-center justify-between text-[9px] font-bold text-slate-600">
                  <span>{customDistanceKm} km × {kmRate} SAR/km =</span>
                  <span className="text-amber-900 font-black text-xs">{computedPrice} SAR</span>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 3. STANDARD CITY-TO-CITY ROUTE MODE                                      */}
          {/* ========================================================================= */}
          {tripMode === 'city' && (
            <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-3 mb-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Route className="w-3.5 h-3.5 text-brand-primary" />
                  <span>{lang === 'en' ? 'Select City-to-City Route' : 'تحديد مسار المدينة'}</span>
                </span>
                <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {lang === 'en' ? 'Fixed Fare' : 'سعر ثابت'}
                </span>
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
                  {PICKUP_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {lang === 'en' ? opt.nameEn : opt.nameAr}
                    </option>
                  ))}
                </select>
              </div>

              {/* Conditional Jeddah Airport Terminal Selection for Pickup */}
              {pickupId === 'jeddah_airport' && (
                <div className="space-y-1 animate-fadeIn">
                  <label className="text-[9.5px] font-bold text-slate-500 flex items-center gap-1">
                    <Plane className="w-3 h-3 text-slate-400" />
                    <span>{lang === 'en' ? 'Jeddah Pickup Terminal' : 'صالة الانطلاق بمطار جدة'}</span>
                  </label>
                  <select
                    value={pickupTerminal}
                    onChange={(e) => setPickupTerminal(e.target.value as JeddahTerminalId)}
                    className="w-full bg-white border border-slate-200 hover:border-brand-primary/40 focus:border-brand-primary rounded-xl py-1.5 px-2.5 text-xs font-bold text-slate-800 outline-none cursor-pointer transition-colors shadow-2xs"
                    id={`pickup-terminal-${vehicle.id}`}
                  >
                    {JEDDAH_TERMINAL_OPTIONS.map((term) => (
                      <option key={term.id} value={term.id}>
                        {lang === 'en' ? term.nameEn : term.nameAr}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Destination Dropdown */}
              <div className="space-y-1">
                <label className="text-[9.5px] font-bold text-slate-500 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#C0272D]" />
                  <span>{lang === 'en' ? 'Destination' : 'الوجهة والوصول'}</span>
                </label>
                <select
                  value={destinationId}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'custom') {
                      setTripMode('custom');
                    }
                    setDestinationId(val);
                  }}
                  className="w-full bg-white border border-slate-200 hover:border-brand-primary/40 focus:border-brand-primary rounded-xl py-1.5 px-2.5 text-xs font-bold text-slate-800 outline-none cursor-pointer transition-colors shadow-2xs"
                  id={`destination-select-${vehicle.id}`}
                >
                  {DESTINATION_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {lang === 'en' ? opt.nameEn : opt.nameAr}
                    </option>
                  ))}
                </select>
              </div>

              {/* Conditional Jeddah Airport Terminal Selection for Destination */}
              {destinationId === 'jeddah_airport' && (
                <div className="space-y-1 animate-fadeIn">
                  <label className="text-[9.5px] font-bold text-slate-500 flex items-center gap-1">
                    <Plane className="w-3 h-3 text-slate-400" />
                    <span>{lang === 'en' ? 'Jeddah Drop-off Terminal' : 'صالة الوصول بمطار جدة'}</span>
                  </label>
                  <select
                    value={destinationTerminal}
                    onChange={(e) => setDestinationTerminal(e.target.value as JeddahTerminalId)}
                    className="w-full bg-white border border-slate-200 hover:border-brand-primary/40 focus:border-brand-primary rounded-xl py-1.5 px-2.5 text-xs font-bold text-slate-800 outline-none cursor-pointer transition-colors shadow-2xs"
                    id={`dest-terminal-${vehicle.id}`}
                  >
                    {JEDDAH_TERMINAL_OPTIONS.map((term) => (
                      <option key={term.id} value={term.id}>
                        {lang === 'en' ? term.nameEn : term.nameAr}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Active Route display */}
              <div className="text-[9px] font-bold text-slate-500 pt-0.5">
                <span className="truncate block" title={routeLabel}>
                  {routeLabel}
                </span>
              </div>
            </div>
          )}

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

        {/* Bottom bar with Vehicle Type indicator + Book Now CTA button */}
        <div className="flex items-center justify-between gap-3 mt-4 pt-3.5 border-t border-slate-100">
          <div className="flex items-center gap-1.5 min-w-0">
            {bookingDate && !isDateInCurrentMonth(bookingDate) ? (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="text-[10px] font-extrabold text-amber-900 uppercase tracking-wide truncate">
                  {lang === 'en' ? '10% Below Market' : 'خصم 10% عن السوق'}
                </span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wide truncate">
                  {lang === 'en' ? 'Guaranteed Rate' : 'سعر مضمون ومثبت'}
                </span>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              const pickupObj = PICKUP_OPTIONS.find(p => p.id === pickupId);
              let pickupDisplay = pickupObj ? (lang === 'en' ? pickupObj.nameEn : pickupObj.nameAr) : pickupId;
              if (pickupId === 'jeddah_airport') {
                const term = JEDDAH_TERMINAL_OPTIONS.find(t => t.id === pickupTerminal);
                pickupDisplay = lang === 'en' 
                  ? `Jeddah Airport [${term?.nameEn || 'Terminal'}]` 
                  : `مطار جدة [${term?.nameAr || 'الصالة'}]`;
              }

              const destObj = DESTINATION_OPTIONS.find(d => d.id === destinationId);
              let destDisplay = tripMode === 'custom' 
                ? (customDestinationText || (lang === 'en' ? 'Custom Destination' : 'وجهة مخصصة'))
                : tripMode === 'circuit' 
                  ? (lang === 'en' ? selectedPackage.nameEn : selectedPackage.nameAr) 
                  : (destObj ? (lang === 'en' ? destObj.nameEn : destObj.nameAr) : destinationId);

              if (tripMode === 'city' && destinationId === 'jeddah_airport') {
                const term = JEDDAH_TERMINAL_OPTIONS.find(t => t.id === destinationTerminal);
                destDisplay = lang === 'en' 
                  ? `Jeddah Airport [${term?.nameEn || 'Terminal'}]` 
                  : `مطار جدة [${term?.nameAr || 'الصالة'}]`;
              }

              onBookNow(vehicle, {
                pickup: pickupDisplay,
                destination: destDisplay,
                routeName: routeLabel,
                computedPrice,
                isEstimated,
                distanceKm: tripMode === 'custom' ? customDistanceKm : undefined,
                circuitPackageId: tripMode === 'circuit' ? packageOptionId : undefined,
                terminalSurcharge,
                pickupTerminal: pickupId === 'jeddah_airport' ? pickupTerminal : undefined,
                destinationTerminal: destinationId === 'jeddah_airport' ? destinationTerminal : undefined
              });
            }}
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
