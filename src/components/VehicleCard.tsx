import React, { useState, useMemo } from 'react';
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
  Sliders
} from 'lucide-react';
import { 
  rates, 
  PICKUP_OPTIONS, 
  DESTINATION_OPTIONS, 
  FULL_CIRCUIT_OPTIONS,
  resolveCityToCityRoute, 
  getCityRoutePrice, 
  getVehicleKmPrice,
  getVehicleKmFallbackRate,
  FullCircuitOption
} from '../data/ratesService';

interface VehicleCardProps {
  vehicle: VehicleData;
  onBookNow: (vehicle: VehicleData, customDetails?: {
    pickup: string;
    destination: string;
    routeName: string;
    computedPrice: number;
    isEstimated: boolean;
    distanceKm?: number;
    circuitPackageId?: string;
  }) => void;
}

export default function VehicleCard({ vehicle, onBookNow }: VehicleCardProps) {
  const { lang, t } = useLang();
  const [isFavorite, setIsFavorite] = useState(false);

  // 3 Distinct Trip Modes:
  // 'city': Standard City-to-City preset routes
  // 'circuit': Full Circuit / Full Ground Transport package (Exclusive mode)
  // 'custom': Custom Destination with distance-based per-km calculation
  const [tripMode, setTripMode] = useState<'city' | 'circuit' | 'custom'>('city');

  // City-to-city route selections
  const [pickupId, setPickupId] = useState<string>('jeddah_airport');
  const [destinationId, setDestinationId] = useState<string>('makkah_hotel');

  // Full Circuit selection
  const [circuitOptionId, setCircuitOptionId] = useState<'standard_circuit' | 'circuit_with_ziyarat'>('standard_circuit');

  // Custom trip inputs
  const [customDestinationText, setCustomDestinationText] = useState<string>('');
  const [customDistanceKm, setCustomDistanceKm] = useState<number>(100);

  // Per-vehicle fallback KM rate (Camry: 3.89, Taurus: 4.44, Yukon: 5.56, H1: 2.56, Hiace: 3.67, Coaster: 5.89)
  const kmRate = useMemo(() => {
    return getVehicleKmFallbackRate(vehicle.rateKey);
  }, [vehicle.rateKey]);

  // Selected circuit object
  const selectedCircuit = useMemo(() => {
    return FULL_CIRCUIT_OPTIONS.find(c => c.id === circuitOptionId) || FULL_CIRCUIT_OPTIONS[0];
  }, [circuitOptionId]);

  // Dynamic Calculation based on mode and city-to-city logic
  const { computedPrice, isEstimated, routeLabel, distanceKm } = useMemo(() => {
    // 1. FULL CIRCUIT MODE (Exclusive)
    if (tripMode === 'circuit') {
      const price = getCityRoutePrice(vehicle.rateKey, selectedCircuit.rateKey);
      const label = lang === 'en' ? selectedCircuit.nameEn : selectedCircuit.nameAr;
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
      const pickupName = pickupObj ? (lang === 'en' ? pickupObj.nameEn : pickupObj.nameAr) : pickupId;

      return {
        computedPrice: totalPrice,
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
        return {
          computedPrice: price,
          isEstimated: false,
          routeLabel: lang === 'en' ? matchedCityRoute.routeNameEn : matchedCityRoute.routeNameAr,
          distanceKm: undefined
        };
      }
    }

    // Fallback: Default vehicle price
    return {
      computedPrice: vehicle.price,
      isEstimated: false,
      routeLabel: lang === 'en' ? 'Standard Route' : 'مسار اعتيادي',
      distanceKm: undefined
    };
  }, [
    tripMode, 
    pickupId, 
    destinationId, 
    circuitOptionId, 
    customDestinationText, 
    customDistanceKm, 
    vehicle.rateKey, 
    vehicle.price, 
    selectedCircuit, 
    lang
  ]);

  const name = lang === 'en' ? vehicle.nameEn : vehicle.nameAr;
  const typeBadge = lang === 'en' ? vehicle.typeEn : vehicle.typeAr;
  const tags = (lang === 'en' ? vehicle.tagsEn : vehicle.tagsAr) || [];

  // WhatsApp helper
  const getWhatsAppURL = () => {
    let modeText = '';
    if (tripMode === 'circuit') {
      modeText = `[Full Circuit Package: ${selectedCircuit.nameEn}]`;
    } else if (tripMode === 'custom') {
      modeText = `[Custom Trip: ${customDistanceKm} KM @ ${kmRate} SAR/KM]`;
    } else {
      modeText = `[City Route: ${routeLabel}]`;
    }

    const text = encodeURIComponent(
      `Assalamu Alaikum, I would like to book ${vehicle.nameEn} with Qawafil Al Majd.\n` +
      `Trip Type: ${modeText}\n` +
      `Route: ${routeLabel}\n` +
      `Price: ${computedPrice} SAR (${isEstimated ? 'Estimated' : 'Flat Rate'})\n` +
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
        <div className="absolute bottom-0 right-3 bg-white px-4 py-2 rounded-t-2xl shadow-lg border-x border-t border-rose-100 flex flex-col items-center justify-center translate-y-[2px] z-10">
          <div className="flex items-baseline gap-0.5">
            <span className="text-xl sm:text-2xl font-black text-[#C0272D] leading-none">
              {computedPrice}
            </span>
            <span className="text-[10px] font-black text-[#C0272D] uppercase ml-1">
              {t.currency || 'SAR'}
            </span>
          </div>
          <span className={`text-[8px] font-black tracking-wider uppercase mt-1 leading-none ${
            isEstimated 
              ? 'text-amber-700 bg-amber-100/70 px-1.5 py-0.5 rounded' 
              : tripMode === 'circuit'
                ? 'text-purple-700 bg-purple-100/70 px-1.5 py-0.5 rounded'
                : 'text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded'
          }`}>
            {isEstimated 
              ? (lang === 'en' ? 'KM ESTIMATED' : 'حساب بالمسافة') 
              : tripMode === 'circuit'
                ? (lang === 'en' ? 'CIRCUIT PACKAGE' : 'باقة تفويج شاملة')
                : (lang === 'en' ? 'CITY FLAT RATE' : 'سعر مدينة لمدينة')}
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

          {/* TRIP MODE SELECTOR TABS: City Route | Full Circuit | Custom Trip */}
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
              {lang === 'en' ? 'Full Circuit' : 'التفويج الشامل'}
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
          {/* 1. EXCLUSIVE FULL CIRCUIT MODE (Hides all other routes and dropdowns)     */}
          {/* ========================================================================= */}
          {tripMode === 'circuit' && (
            <div className="bg-purple-50/70 border border-purple-200 rounded-2xl p-3 mb-3.5 space-y-2.5 transition-all animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-purple-700" />
                  <span>{lang === 'en' ? 'Full Ground Transport Package' : 'باقة التفويج والانتقال الشامل'}</span>
                </span>
                <span className="text-[9px] font-extrabold text-purple-700 bg-white px-2 py-0.5 rounded-full border border-purple-200">
                  {lang === 'en' ? 'Exclusive Mode' : 'حزمة حصرية'}
                </span>
              </div>

              {/* Package selector options */}
              <div className="space-y-1.5">
                {FULL_CIRCUIT_OPTIONS.map((circ) => {
                  const isSelected = circuitOptionId === circ.id;
                  const price = getCityRoutePrice(vehicle.rateKey, circ.rateKey);
                  return (
                    <div
                      key={circ.id}
                      onClick={() => setCircuitOptionId(circ.id)}
                      className={`p-2 rounded-xl border cursor-pointer transition-all ${
                        isSelected 
                          ? 'bg-white border-purple-500 shadow-xs ring-1 ring-purple-400' 
                          : 'bg-white/60 border-purple-200/80 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${isSelected ? 'border-purple-600 bg-purple-600 text-white' : 'border-slate-300'}`}>
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                          <span className="text-xs font-black text-slate-800">
                            {lang === 'en' ? circ.nameEn : circ.nameAr}
                          </span>
                        </div>
                        <span className="text-xs font-black text-purple-800">
                          {price} SAR
                        </span>
                      </div>
                      <p className="text-[9.5px] text-slate-500 mt-1 pl-5">
                        {lang === 'en' ? circ.descriptionEn : circ.descriptionAr}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Itinerary route stops */}
              <div className="bg-white rounded-xl p-2 border border-purple-100">
                <span className="text-[9px] font-black text-purple-900 uppercase tracking-wider block mb-1">
                  {lang === 'en' ? 'Included Itinerary Transfers:' : 'المحطات المشمولة في خطة التفويج:'}
                </span>
                <div className="grid grid-cols-2 gap-1 text-[9px] font-bold text-slate-600">
                  {(lang === 'en' ? selectedCircuit.stopsEn : selectedCircuit.stopsAr).map((stop, idx) => (
                    <div key={idx} className="flex items-center gap-1 truncate">
                      <CheckCircle2 className="w-2.5 h-2.5 text-purple-600 shrink-0" />
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

              {/* Pickup Location Dropdown (Strictly real geographic locations) */}
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
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wide">
              {lang === 'en' ? 'Official License' : 'مرخص نظامياً'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => onBookNow(vehicle, {
              pickup: pickupId,
              destination: tripMode === 'custom' 
                ? (customDestinationText || 'Custom Destination') 
                : tripMode === 'circuit' 
                  ? selectedCircuit.nameEn 
                  : destinationId,
              routeName: routeLabel,
              computedPrice,
              isEstimated,
              distanceKm: tripMode === 'custom' ? customDistanceKm : undefined,
              circuitPackageId: tripMode === 'circuit' ? circuitOptionId : undefined
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
