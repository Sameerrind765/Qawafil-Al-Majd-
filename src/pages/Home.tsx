import React, { useState } from 'react';
import { useLang } from '../context/LangContext';
import { vehiclesData, VehicleData } from '../data/vehicles';
import BookingModal from '../components/BookingModal';
import { saveLead } from '../firebaseService';
import { HomepageLead } from '../types';

// Lucide Icons
import { 
  Compass, 
  Sparkles, 
  CheckCircle2, 
  MessageSquare, 
  Phone, 
  MapPin, 
  Users, 
  Star, 
  ArrowRight, 
  Calculator, 
  ShieldCheck, 
  Layers, 
  Clock, 
  Send,
  Calendar,
  Briefcase,
  Flag,
  Heart,
  ChevronRight,
  Snowflake,
  Wifi,
  Usb,
  Armchair,
  Music
} from 'lucide-react';

const vehicleImages: { [key: string]: string } = {
  "toyota-camry": "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=800&q=80",
  "hyundai-staria": "https://images.unsplash.com/photo-1695663335275-c54cc41a5472?auto=format&fit=crop&w=800&q=80",
  "gmc-yukon-xl": "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=800&q=80",
  "toyota-hiace": "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80",
  "sprinter-van": "https://images.unsplash.com/photo-1608222351212-18fe0ec7b13b?auto=format&fit=crop&w=800&q=80",
  "coaster-bus": "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=800&q=80"
};

export default function Home() {
  const { lang, t } = useLang();
  
  // State for card favorites
  const [favorites, setFavorites] = useState<{ [key: string]: boolean }>({});
  
  // Selected vehicle for booking trigger
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleData | null>(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);

  // New customized tabbed booking form states
  const [heroWorkflow, setHeroWorkflow] = useState<'precise' | 'quick'>('precise');
  const [tripType, setTripType] = useState<'Point to Point' | 'By Hour' | 'By KM' | 'Full Contract'>('Point to Point');
  const [fromLocation, setFromLocation] = useState('Jeddah Airport (KAIA)');
  const [toLocation, setToLocation] = useState('Makkah Hotel (near Haram)');
  const [durationHours, setDurationHours] = useState('8 Hours');
  const [distanceKm, setDistanceKm] = useState('150 KM');
  const [contractDays, setContractDays] = useState('7 Days');
  const [bookingDate, setBookingDate] = useState('2026-06-15');
  const [passengers, setPassengers] = useState('1–4 passengers');
  const [luggage, setLuggage] = useState('Standard');
  
  const [filteredVehicles, setFilteredVehicles] = useState<VehicleData[]>(vehiclesData);
  const [isFiltered, setIsFiltered] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<{
    tripType: string;
    fromLocation: string;
    toLocation: string;
    date: string;
    passengers: string;
    luggage: string;
  } | undefined>(undefined);

  const getDynamicVehiclePrice = (vehicle: VehicleData): number => {
    let multiplier = 1.0;
    
    if (tripType === 'By Hour') {
      const hrs = parseInt(durationHours) || 8;
      if (vehicle.classFilter === 'economy') multiplier = (hrs * 35) / vehicle.price;
      else if (vehicle.classFilter === 'business') multiplier = (hrs * 55) / vehicle.price;
      else if (vehicle.classFilter === 'vip') multiplier = (hrs * 100) / vehicle.price;
      else multiplier = (hrs * 140) / vehicle.price;
    } else if (tripType === 'By KM') {
      const kms = parseInt(distanceKm) || 150;
      multiplier = kms / 140;
    } else if (tripType === 'Full Contract') {
      const days = parseInt(contractDays) || 7;
      multiplier = days * 0.82;
    } else {
      // Point to Point route-based multiplier
      const isAirport = fromLocation.toLowerCase().includes("airport") || toLocation.toLowerCase().includes("airport");
      const isMakkah = fromLocation.includes("Makkah") || toLocation.includes("Makkah");
      const isMadinah = fromLocation.includes("Madinah") || toLocation.includes("Madinah");

      if (isAirport && isMakkah) multiplier = 1.0;
      else if (isAirport && isMadinah) multiplier = 2.4;
      else if (isMakkah && isMadinah) multiplier = 2.1;
      else multiplier = 1.15;
    }

    if (luggage === 'Excess / Heavy Cargo' || luggage === 'أمتعة إضافية / ثقيلة') {
      multiplier *= 1.12;
    } else if (luggage === 'Medium / Large Bags' || luggage === 'حقائب متوسطة / كبيرة') {
      multiplier *= 1.04;
    }

    return Math.max(90, Math.round(vehicle.price * multiplier));
  };

  const handleShowVehiclesAndPrices = (e: React.FormEvent) => {
    e.preventDefault();
    
    let finalTo = toLocation;
    if (tripType === 'By Hour') {
      finalTo = lang === 'en' ? `Hourly Rental (${durationHours})` : `إيجار بالساعة (${durationHours})`;
    } else if (tripType === 'By KM') {
      finalTo = lang === 'en' ? `Distance Drive (${distanceKm})` : `توصيل بالمسافة (${distanceKm})`;
    } else if (tripType === 'Full Contract') {
      finalTo = lang === 'en' ? `Campaign Campaign (${contractDays})` : `عقد كامل للحملة (${contractDays})`;
    }

    setBookingDetails({
      tripType: lang === 'en' ? tripType : (tripType === 'Point to Point' ? 'نقطة إلى نقطة' : tripType === 'By Hour' ? 'بالساعة' : tripType === 'By KM' ? 'بالكيلو' : 'عقد كامل'),
      fromLocation,
      toLocation: finalTo,
      date: bookingDate,
      passengers,
      luggage
    });

    let filtered = [...vehiclesData];
    if (passengers.includes('1–4') || passengers.includes('1 إلى 4')) {
      filtered = vehiclesData.filter(v => v.seats <= 12);
    } else if (passengers.includes('5-7') || passengers.includes('5 إلى 7')) {
      filtered = vehiclesData.filter(v => v.seats >= 5 && v.seats <= 15);
    } else if (passengers.includes('8-15') || passengers.includes('8 إلى 15')) {
      filtered = vehiclesData.filter(v => v.seats >= 8 && v.seats <= 25);
    } else {
      filtered = vehiclesData.filter(v => v.seats >= 15);
    }

    setFilteredVehicles(filtered);
    setIsFiltered(true);

    setTimeout(() => {
      document.getElementById('home-fleet-title')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
  };

  // Form states for Quick Lead Capture Widget
  const [leadName, setLeadName] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadService, setLeadService] = useState('Airport Pickups & Hotel Shuttles');
  const [leadCaravan, setLeadCaravan] = useState('Toyota Camry');
  const [leadCustomStation, setLeadCustomStation] = useState('');
  const [leadSuccessVisible, setLeadSuccessVisible] = useState(false);
  const [leadLoading, setLeadLoading] = useState(false);

  // Quote Calculator states
  const [calcSource, setCalcSource] = useState('Jeddah (Airport / Hotels)');
  const [calcTarget, setCalcTarget] = useState('Makkah Al-Mukarramah');
  const [calcClass, setCalcClass] = useState<'economy' | 'business' | 'vip' | 'group'>('business');
  
  // Bilingual copywriting database
  const localCopy = {
    en: {
      quickBookTitle: "30-Second Quick Booking",
      quickBookSub: "Book now to claim your premium licensed caravan and driver.",
      serviceLabel: "Service Requirement",
      caravanLabel: "Preferred Caravan Level",
      nameLabel: "Your Contact Name",
      phoneLabel: "WhatsApp Number",
      stationLabel: "Pickup Station / Hotel Detail",
      dispatchBtn: "Confirm & Dispatch on WhatsApp",
      dispatchSuccessTitle: "Inquiry Shared Successfully!",
      dispatchSuccessMsg: "Jazakallah. Your booking inquiry details have been registered at our 24/7 central control desk. Press the button below to initiate instantaneous WhatsApp dispatch and confirm your driver.",
      openWhatsApp: "Open Mobile WhatsApp Connection",
      noPrepay: "✓ Zero Online Prepayment Required • Instant Confirmation",
      
      calculatorTitle: "Interactive Route Quote Calculator",
      calculatorSub: "Select your route configuration to view dynamic, guaranteed flat rates.",
      pickupCity: "Pick-up Hub",
      destinationCity: "Destination Hub",
      estimatedRate: "Estimated Flat Rate",
      guaranteedRateNote: "Guaranteed locked rate with no fuel surcharges or peak fees.",
      bookLockedBtn: "Book At Locked Price",

      coordTitle: "Hajj & Umrah Campaign Logistics Unit",
      coordSub: "Are you a pilgrim group leader, travel coordinator, or campaign operator?",
      coordDesc: "We provide coordinated heavy coach shuttles, 45-seat Mercedes Tourismo fleets, schedule management boards, and priority VIP airport lanes to ensure flawless operation for groups of all sizes.",
      coordBtn: "Contact Group Coordinator Desk",
      
      fleetTitle: "Explore Meticulously Selected Fleet",
      fleetSub: "All caravans are 100% compliant with Saudi Transport General Authority (TGA) regulations, ensuring absolute safety.",
      safetyActive: "Active Fleet Telemetry Monitoring Line",
      
      hajjAirport: "Airport Pickups & Hotel Shuttles",
      makkahHistoric: "Makkah Sacred Landmarks Tour",
      madinahProphet: "Madinah Noble Prophet's Sites Tour",
      intercityCap: "Inter-City Quick Caravan",
      campaignLarge: "Campaign Bulk Group Charter",

      verifiedTag: "TGA REGULATED & CERTIFIED",
    },
    ar: {
      quickBookTitle: "الطلب والـتأكيد السريع خلال 30 ثانية",
      quickBookSub: "قدم طلبك فوراً لحيازة مركبتك المرخصة وتأمين حجز سائقك المناوب.",
      serviceLabel: "نوع الخدمة المطلوبة",
      caravanLabel: "فئة الناقلة المفضلة",
      nameLabel: "اسم التواصل الكريم",
      phoneLabel: "رقم الواتساب النشط",
      stationLabel: "نقطة الاستلام / تفاصيل الفندق",
      dispatchBtn: "تأكيد وتوجيه الرحلة عبر وتساب",
      dispatchSuccessTitle: "تم حفظ وتسجيل طلبك بنجاح!",
      dispatchSuccessMsg: "جزاك الله خيراً. تم تسجيل مسار طلبك في لوحة مركز العمليات لـ قوافل المجد. اضغط على الزر أدناه لبدء تفريج العربة والتواصل الفوري مع مأمور غرف التنسيق عبر وتساب لحسم التفاصيل.",
      openWhatsApp: "التواصل الفوري عبر الواتساب",
      noPrepay: "✓ لا يتطلب دفع مسبق أونلاين • تأكيد تشغيلي فوري",

      calculatorTitle: "مستشار تسعير المسارات وحساب الرحلة",
      calculatorSub: "اختر نقاط الانطلاق والوصول لحساب التسعيرة المسطحة الثابتة والمضمونة فوراً.",
      pickupCity: "محطة الانطلاق",
      destinationCity: "محطة الوصول والوجهة",
      estimatedRate: "السعر التقديري المسطح",
      guaranteedRateNote: "تسعيرة ثابتة مضمونة تشمل رسوم الطرق ولا تخضع لزيادات أوقات الذروة.",
      bookLockedBtn: "احجز الآن بالسعر المضمون",

      coordTitle: "إسناد وتنسيق حملات الحج والعمرة والوفود الكبيرة",
      coordSub: "هل أنت مدير حملة عائلية، منسق رحلات وفود، أو مسؤول تفويج ديني؟",
      coordDesc: "نحن في قوافل المجد نضع تحت تصرفك أساطيل الحافلات الفاخرة سعة 45 مقعداً، وسيارات الـ SUV، مع جدولة برية متكاملة وتغطية مراقبة GPS حية لتفادي الازدحام المروري وضمان أفضل تجربة لك لخدمة وفدك الكريم.",
      coordBtn: "مخاطبة قسم شؤون التنسيق والحملات الكبرى",

      fleetTitle: "تصفح أسطول مركبات قوافل المجد المصنفة",
      fleetSub: "جميع مركباتنا مؤهلة ببطاقات تشغيل معتمدة وتخضع للفحص الشامل الدوري من الهيئة العامة للنقل لمراعاة السلامة.",
      safetyActive: "نظام تحديد المواقع المتصل وتتبع السلامة نشط",

      hajjAirport: "استقبال وتوصيل المطارات والفنادق",
      makkahHistoric: "برنامج زيارة المشاعر المقدسة بمكة",
      madinahProphet: "زيارة المعالم النبوية الشريفة بالمدينة",
      intercityCap: "التفويج السريع والربط بين المدن الثلاث",
      campaignLarge: "تفويج حملات ومجموعات الوفود الكبرى",

      verifiedTag: "قوافل مرخصة وخاضعة لأنظمة الهيئة العامة للنقل",
    }
  };

  const copy = lang === 'ar' ? localCopy.ar : localCopy.en;

  // Handle lead booking submission
  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadName.trim() || !leadPhone.trim()) {
      return;
    }
    setLeadLoading(true);
    
    try {
      const generatedId = 'lead_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
      const newLead: HomepageLead = {
        id: generatedId,
        name: leadName.trim(),
        phone: leadPhone.trim(),
        service: leadService,
        caravan: leadCaravan,
        customStation: leadCustomStation.trim() || 'N/A',
        createdAt: new Date().toISOString(),
        status: 'Pending',
        price: 1500 // default price for land service inquiries
      };
      
      await saveLead(newLead);
      
      setLeadLoading(false);
      setLeadSuccessVisible(true);
    } catch (error) {
      console.error("Failed to submit pilgrim lead to Firestore:", error);
      // Fallback: still show success to keep UX friendly for the pilgrim, but notify in console
      setLeadLoading(false);
      setLeadSuccessVisible(true);
    }
  };

  // Pre-filled WhatsApp message generation from Hero quick assistant
  const getHeroWhatsAppURL = () => {
    const whatsappNum = "966501234567";
    const serviceName = leadService;
    const caravanClass = leadCaravan;
    const pickupDetail = leadCustomStation || "Not specified yet";

    const msg = lang === 'en'
      ? `Assalamu Alaikum Qawafil Al Majd! I want to confirm my quick landing reservation:\n\n- *Requested Service:* ${serviceName}\n- *Caravan Level:* ${caravanClass}\n- *My Name:* ${leadName}\n- *WhatsApp:* ${leadPhone}\n- *Pickup Details:* ${pickupDetail}\n\nPlease dispatch, Jazakallah Khayran.`
      : `السلام عليكم قوافل المجد! أرغب في تأكيد حجز تفويج سريع بري عبر الموقع:\n\n- *الخدمة المطلوبة:* ${serviceName}\n- *فئة ومستوى الناقلة:* ${caravanClass}\n- *الاسم الكريم:* ${leadName}\n- *رقم التواصل:* ${leadPhone}\n- *تفاصيل الاستلام:* ${pickupDetail}\n\nيرجى تأكيد الحجز وتوجيه السائق، بارك الله فيكم.`;

    return `https://wa.me/${whatsappNum}?text=${encodeURIComponent(msg)}`;
  };

  // Base pricing calculator logic depending on input values (estimates)
  const calculateEstimate = (): number => {
    let basePrice = 200; // default camry style rate

    // Calculate distance-based factors depending on selected cities
    if (calcSource.includes("Jeddah") && calcTarget.includes("Makkah")) basePrice = 250;
    else if (calcSource.includes("Jeddah") && calcTarget.includes("Madinah")) basePrice = 550;
    else if (calcSource.includes("Makkah") && calcTarget.includes("Madinah")) basePrice = 500;
    else if (calcSource.includes("Riyadh")) basePrice = 1200;
    else if (calcSource === calcTarget) basePrice = 150;

    // Class multiplication factors
    if (calcClass === 'economy') return Math.round(basePrice * 0.7);
    if (calcClass === 'business') return basePrice;
    if (calcClass === 'vip') return Math.round(basePrice * 1.8);
    if (calcClass === 'group') return Math.round(basePrice * 2.5);

    return basePrice;
  };

  const handleCalculatorBook = () => {
    // Generate a surrogate vehicle data block and trigger modal
    const approxVal = calculateEstimate();
    const surrogate: VehicleData = {
      id: "calc-surrogate",
      nameEn: `Custom Route Arrangement (${calcSource} ➔ ${calcTarget})`,
      nameAr: `ترتيب مسار مخصص (${lang === 'en' ? calcSource : 'محطة البدء'} ➔ ${lang === 'en' ? calcTarget : 'محطة الوصول'})`,
      typeEn: "Locked Route Plan",
      typeAr: "مسار محدد ومؤمن",
      seats: calcClass === 'group' ? 45 : calcClass === 'vip' ? 7 : calcClass === 'business' ? 7 : 4,
      price: approxVal,
      tagsEn: [calcSource, calcTarget, "Direct Highway Transfer"],
      tagsAr: [calcSource, calcTarget, "تفويج بري مباشر عبر الفنادق والمطار"],
      classFilter: calcClass,
      recommended: true,
      emoji: "🕌"
    };

    setSelectedVehicle(surrogate);
    setBookingModalOpen(true);
  };

  const triggerDirectVehicleBooking = (vehicle: VehicleData) => {
    setSelectedVehicle(vehicle);
    setBookingModalOpen(true);
  };

  const triggerTourBooking = (tourNameEn: string, tourNameAr: string, price: number) => {
    const tourSurrogate: VehicleData = {
      id: "tour-surrogate",
      nameEn: tourNameEn,
      nameAr: tourNameAr,
      typeEn: "Special Ziyarat Tour Program",
      typeAr: "برنامج زيارة ومزارات سياحية دينية",
      seats: 7,
      price: price,
      tagsEn: ["Ziyarat", "Tour Guide", "Makkah / Madinah Landmarks"],
      tagsAr: ["مزارات", "مرشد سياحي", "معالم الحرمين الشريفين"],
      classFilter: "vip",
      recommended: true,
      emoji: "🕌"
    };
    setSelectedVehicle(tourSurrogate);
    setBookingModalOpen(true);
  };

  return (
    <div className="flex-1 font-sans text-slate-800 bg-[#fbf9f6] select-none" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* 1. LUXURIOUS HERO CONVERSION STAGE */}
      <section className="relative bg-brand-bg-dark text-white border-b border-rose-950 overflow-hidden py-16 lg:py-24">
        {/* Subtle patterned gold grids and atmospheric overlays */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(192,39,45,0.18),transparent_55%)] pointer-events-none" />
        <div className="absolute -right-16 -bottom-16 text-white/[0.03] text-9xl font-black pointer-events-none select-none">
          🕋 QAWAFIL
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:items-center">
            
            {/* Left pitch and elevator copy (7 cols on Desktop) */}
            <div className="lg:col-span-7 space-y-6 lg:pe-6">
              
              {/* TGA regulatory badge */}
              <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 py-1.5 px-3.5 rounded-full text-amber-500 font-black text-xs uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-amber-500" />
                <span>{copy.verifiedTag}</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight tracking-tight">
                {t.heroTitle}
              </h1>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-semibold max-w-xl">
                {t.heroSubtitle}
              </p>

              {/* Core capabilities bullet grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                <div className="flex items-center gap-2.5 text-slate-200 font-bold">
                  <CheckCircle2 className="w-5 h-5 text-brand-primary shrink-0" />
                  <span>{lang === 'en' ? "100% Licensed Saudi Pilots" : "سائقون سعوديون مرخصون بالكامل"}</span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-200 font-bold">
                  <CheckCircle2 className="w-5 h-5 text-brand-primary shrink-0" />
                  <span>{lang === 'en' ? "Flat upfront quotes - Zero surprises" : "تسعيرة مسطحة ثابتة معلنة"}</span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-200 font-bold">
                  <CheckCircle2 className="w-5 h-5 text-brand-primary shrink-0" />
                  <span>{lang === 'en' ? "GPS tracked live safety feeds" : "تتبع GPS ومتابعة فورية على مدار الساعة"}</span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-200 font-bold">
                  <CheckCircle2 className="w-5 h-5 text-brand-primary shrink-0" />
                  <span>{lang === 'en' ? "VIP airport & hotel priority access" : "ممرات أولوية مرخصة بالمطارات والفنادق"}</span>
                </div>
              </div>

              {/* Trust pilot bar */}
              <div className="flex items-center gap-3 pt-4 border-t border-rose-950/40 max-w-sm">
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-slate-400 text-xs font-bold font-sans">
                  {lang === 'en' 
                    ? "Rated 4.9/5 by 3,420+ Pilgrim Coordinators" 
                    : "تقييم 4.9/5 من قبل المنسقين ومسؤولي الحملات"}
                </p>
              </div>

            </div>

            {/* Right: Instant booking assistant widget form (5 cols on Desktop) */}
            <div className="lg:col-span-5 relative">
              <div className="bg-white text-slate-850 rounded-2xl p-6 shadow-2xl border border-rose-100 relative" id="quick-booking-card">
                
                {/* Visual Accent Badge */}
                <span className="absolute -top-3 right-6 bg-[#C0272D] text-white text-[9px] font-black tracking-widest px-2.5 py-1 rounded-md shadow-md uppercase">
                  {lang === 'en' ? "60s conversion path" : "تفويج بري فوري"}
                </span>

                {/* Dual Workflow Switch */}
                <div className="grid grid-cols-2 bg-slate-100 p-1 rounded-xl mb-5 border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setHeroWorkflow('precise')}
                    className={`text-center py-2.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      heroWorkflow === 'precise'
                        ? 'bg-[#C0272D] text-white shadow'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/40'
                    }`}
                  >
                    {lang === 'ar' ? '🔍 تسعير دقيق' : '🔍 Route Planner'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setHeroWorkflow('quick')}
                    className={`text-center py-2.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      heroWorkflow === 'quick'
                        ? 'bg-[#C0272D] text-white shadow border border-emerald-100'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/40'
                    }`}
                  >
                    {lang === 'ar' ? '⚡ طلب تفويج سريع' : '⚡ Quick Inquiry (30s)'}
                  </button>
                </div>

                {heroWorkflow === 'precise' ? (
                  <>
                    {/* Tab select header bar */}
                    <div className="flex bg-slate-50 p-1 rounded-xl mb-6 border border-slate-100">
                      {(['Point to Point', 'By Hour', 'By KM', 'Full Contract'] as const).map((tab) => {
                        const isActive = tripType === tab;
                        return (
                          <button
                            key={tab}
                            type="button"
                            onClick={() => setTripType(tab)}
                            className={`flex-1 text-center py-2.5 px-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                              isActive 
                                ? 'bg-[#C0272D] text-white shadow' 
                                : 'text-slate-600 hover:bg-slate-200/50'
                            }`}
                          >
                            {lang === 'ar' 
                              ? (tab === 'Point to Point' ? 'نقطة لنقطة' : tab === 'By Hour' ? 'بالساعة' : tab === 'By KM' ? 'بالكيلو' : 'عقد كامل') 
                              : tab}
                          </button>
                        );
                      })}
                    </div>

                    <form onSubmit={handleShowVehiclesAndPrices} className="space-y-4" id="hero-quick-form">
                      
                      {/* Row 1: From & To */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* From Section */}
                        <div className="space-y-1.5">
                          <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wide">
                            <MapPin className="w-4 h-4 text-[#C0272D]" />
                            <span>{lang === 'ar' ? 'من' : 'From'}</span>
                          </label>
                          <select
                            value={fromLocation}
                            onChange={(e) => setFromLocation(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-[#C0272D] cursor-pointer"
                          >
                            {[
                              "Jeddah Airport (KAIA)",
                              "Makkah Hotel (near Haram)",
                              "Madinah Hotel (near Nabawi)",
                              "Jeddah Hotel / Residence",
                              "Madinah Airport (PMIA)"
                            ].map((loc, idx) => (
                              <option key={idx} value={loc}>
                                {lang === 'ar' 
                                  ? (loc === "Jeddah Airport (KAIA)" ? "مطار جدة الدولي (KAIA)" : loc === "Makkah Hotel (near Haram)" ? "فندق مكة (قرب الحرم الشريف)" : loc === "Madinah Hotel (near Nabawi)" ? "فندق المدينة (قرب المسجد النبوي)" : loc === "Jeddah Hotel / Residence" ? "فندق أو سكن بجدة" : "مطار المدينة المنورة (PMIA)")
                                  : loc}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* To Section or Duration */}
                        <div className="space-y-1.5">
                          <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wide">
                            <Flag className="w-4 h-4 text-[#C0272D]" />
                            <span>
                              {tripType === 'By Hour' 
                                ? (lang === 'ar' ? 'المدة' : 'Duration') 
                                : tripType === 'Full Contract' 
                                  ? (lang === 'ar' ? 'مدة العقد' : 'Term') 
                                  : (lang === 'ar' ? 'إلى' : 'To')}
                            </span>
                          </label>
                          {tripType === 'Point to Point' || tripType === 'By KM' ? (
                            <select
                              value={toLocation}
                              onChange={(e) => setToLocation(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-[#C0272D] cursor-pointer"
                            >
                              {[
                                "Makkah Hotel (near Haram)",
                                "Jeddah Airport (KAIA)",
                                "Madinah Hotel (near Nabawi)",
                                "Jeddah Hotel / Residence",
                                "Madinah Airport (PMIA)"
                              ].map((loc, idx) => (
                                <option key={idx} value={loc}>
                                  {lang === 'ar' 
                                    ? (loc === "Jeddah Airport (KAIA)" ? "مطار جدة الدولي (KAIA)" : loc === "Makkah Hotel (near Haram)" ? "فندق مكة (قرب الحرم الشريف)" : loc === "Madinah Hotel (near Nabawi)" ? "فندق المدينة (قرب المسجد النبوي)" : loc === "Jeddah Hotel / Residence" ? "فندق أو سكن بجدة" : "مطار المدينة المنورة (PMIA)")
                                    : loc}
                                </option>
                              ))}
                            </select>
                          ) : tripType === 'By Hour' ? (
                            <select
                              value={durationHours}
                              onChange={(e) => setDurationHours(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-[#C0272D] cursor-pointer"
                            >
                              {['4 Hours', '8 Hours', '12 Hours', '24 Hours'].map((h, i) => (
                                <option key={i} value={h}>
                                  {lang === 'ar' ? (h === '4 Hours' ? '٤ ساعات' : h === '8 Hours' ? '٨ ساعات' : h === '12 Hours' ? '١٢ ساعة' : 'يوم كامل 24 ساعة') : h}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <select
                              value={contractDays}
                              onChange={(e) => setContractDays(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-[#C0272D] cursor-pointer"
                            >
                              {['3 Days', '5 Days', '7 Days', '14 Days'].map((d, i) => (
                                <option key={i} value={d}>
                                  {lang === 'ar' ? (d === '3 Days' ? '٣ أيام' : d === '5 Days' ? '٥ أيام' : d === '7 Days' ? 'أسبوع كامل 7 أيام' : 'أسبوعين 14 يومًا') : d}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      </div>

                      {/* Row 2: Date, Passengers, Luggage */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* Date */}
                        <div className="space-y-1.5">
                          <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wide">
                            <Calendar className="w-4 h-4 text-[#C0272D]" />
                            <span>{lang === 'ar' ? 'التاريخ' : 'Date'}</span>
                          </label>
                          <input
                            type="date"
                            required
                            value={bookingDate}
                            onChange={(e) => setBookingDate(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-2.5 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-[#C0272D]"
                          />
                        </div>

                        {/* Passengers */}
                        <div className="space-y-1.5">
                          <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wide">
                            <Users className="w-4 h-4 text-[#C0272D]" />
                            <span>{lang === 'ar' ? 'الركاب' : 'Passengers'}</span>
                          </label>
                          <select
                            value={passengers}
                            onChange={(e) => setPassengers(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-2 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-[#C0272D] cursor-pointer"
                          >
                            {[
                              "1–4 passengers",
                              "5-7 passengers",
                              "8-15 passengers",
                              "Group / Bus Caravan"
                            ].map((p, idx) => (
                              <option key={idx} value={p}>
                                {lang === 'ar' 
                                  ? (p === "1–4 passengers" ? "من 1 لـ 4 ركاب" : p === "5-7 passengers" ? "من 5 لـ 7 ركاب" : p === "8-15 passengers" ? "من 8 لـ 15 راكب" : "حملات كبرى (حافلة)")
                                  : p}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Luggage */}
                        <div className="space-y-1.5">
                          <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wide">
                            <Briefcase className="w-4 h-4 text-[#C0272D]" />
                            <span>{lang === 'ar' ? 'الأمتعة' : 'Luggage'}</span>
                          </label>
                          <select
                            value={luggage}
                            onChange={(e) => setLuggage(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-2 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-[#C0272D] cursor-pointer"
                          >
                            {[
                              "Standard",
                              "Medium / Large Bags",
                              "Excess / Heavy Cargo"
                            ].map((l, idx) => (
                              <option key={idx} value={l}>
                                {lang === 'ar' 
                                  ? (l === "Standard" ? "حقائب قياسية" : l === "Medium / Large Bags" ? "حقائب كبيرة" : "أمتعة جماعية إضافية")
                                  : l}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full mt-2 bg-[#C0272D] hover:bg-[#a61f24] text-white font-extrabold text-xs py-3.5 px-4 rounded-xl shadow-lg transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
                        id="hero-quick-submit"
                      >
                        <span>🔍</span>
                        <span>{lang === 'ar' ? "عرض السيارات المتاحة والأسعار" : "Show available vehicles & prices"}</span>
                      </button>

                      <p className="text-[9.5px] text-center text-slate-400 font-extrabold block">
                        {copy.noPrepay}
                      </p>

                    </form>
                  </>
                ) : (
                  <div className="mt-2 text-slate-800 text-left" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                    <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                       <Sparkles className="w-5 h-5 text-[#C0272D] shrink-0" />
                       <span>{copy.quickBookTitle}</span>
                    </h3>
                    
                    <p className="text-[11px] text-slate-500 font-semibold leading-relaxed mt-1 mb-4">
                      {copy.quickBookSub}
                    </p>

                    {leadSuccessVisible ? (
                      <div className="space-y-4 py-4 text-center" id="lead-success-block">
                        <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mx-auto mb-3">
                          <CheckCircle2 className="w-8 h-8" />
                        </div>

                        <h4 className="text-sm font-extrabold text-[#C0272D]">
                          {copy.dispatchSuccessTitle}
                        </h4>

                        <p className="text-[11.5px] text-slate-600 font-medium leading-relaxed max-w-xs mx-auto">
                          {copy.dispatchSuccessMsg}
                        </p>

                        <div className="pt-3 space-y-3">
                          <a
                            href={getHeroWhatsAppURL()}
                            target="_blank"
                            referrerPolicy="no-referrer"
                            className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-3.5 px-4 rounded-xl shadow-md transition-all decoration-transparent"
                            id="hero-whatsapp-redirect-btn"
                          >
                            <MessageSquare className="w-4 h-4" />
                            <span>{copy.openWhatsApp}</span>
                          </a>

                          <button
                            type="button"
                            onClick={() => {
                              setLeadSuccessVisible(false);
                              setLeadName('');
                              setLeadPhone('');
                              setLeadCustomStation('');
                            }}
                            className="text-xs font-bold text-[#C0272D] hover:underline cursor-pointer block mx-auto"
                          >
                            {lang === 'en' ? "Submit Another Response" : "تقديم طلب صالحة آخر"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleLeadSubmit} className="space-y-4 text-left" id="hero-quick-form" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                        
                        {/* Requirement/Service */}
                        <div className="space-y-1 text-left" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                          <label className="text-[10px] font-black text-slate-500 uppercase block tracking-wider">
                            {copy.serviceLabel}
                          </label>
                          <select
                            value={leadService}
                            onChange={(e) => setLeadService(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-[#C0272D] cursor-pointer"
                          >
                            <option value="Airport Pickups & Hotel Shuttles">{copy.hajjAirport}</option>
                            <option value="Makkah Sacred Landmarks Tour">{copy.makkahHistoric}</option>
                            <option value="Madinah Noble Prophet's Sites Tour">{copy.madinahProphet}</option>
                            <option value="Inter-City Quick Caravan">{copy.intercityCap}</option>
                            <option value="Campaign Bulk Group Charter">{copy.campaignLarge}</option>
                          </select>
                        </div>

                        {/* Preferred Level */}
                        <div className="space-y-1 text-left" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                          <label className="text-[10px] font-black text-slate-500 uppercase block tracking-wider">
                            {copy.caravanLabel}
                          </label>
                          <select
                            value={leadCaravan}
                            onChange={(e) => setLeadCaravan(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-[#C0272D] cursor-pointer"
                          >
                            {vehiclesData.map((v) => (
                              <option key={v.id} value={v.nameEn}>
                                {v.emoji} {lang === 'en' ? v.nameEn : v.nameAr}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Custom Station inputs */}
                        <div className="space-y-1 text-left" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                          <label className="text-[10px] font-black text-slate-500 uppercase block tracking-wider">
                            {copy.stationLabel}
                          </label>
                          <input
                            type="text"
                            required
                            value={leadCustomStation}
                            onChange={(e) => setLeadCustomStation(e.target.value)}
                            placeholder={lang === 'en' ? "e.g., Jeddah Airport Terminal 1, or Hilton Makkah" : "مثال: صالة 1 مطار جدة، فندق أبراج مكة"}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-[#C0272D]"
                          />
                        </div>

                        {/* Dual fields: Contact Name and Phone */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-left" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase block tracking-wider">
                              {copy.nameLabel}
                            </label>
                            <input
                              type="text"
                              required
                              value={leadName}
                              onChange={(e) => setLeadName(e.target.value)}
                              placeholder={lang === 'en' ? "Your Name" : "اسم الكريم"}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-[#C0272D]"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase block tracking-wider">
                              {copy.phoneLabel}
                            </label>
                            <input
                              type="tel"
                              required
                              value={leadPhone}
                              onChange={(e) => setLeadPhone(e.target.value)}
                              placeholder="+966 5..."
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-[#C0272D] text-left"
                              dir="ltr"
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={leadLoading}
                          className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-3.5 px-4 rounded-xl shadow-lg transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
                          id="hero-quick-submit"
                        >
                          {leadLoading ? (
                            <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                          <span>{leadLoading ? t.loading : copy.dispatchBtn}</span>
                        </button>

                        <p className="text-[9.5px] text-center text-slate-400 font-extrabold block">
                          {copy.noPrepay}
                        </p>

                      </form>
                    )}
                  </div>
                )}

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. LIVE ROUTE LOGISTICS CO-PILOT (calculator and fast-rate display) */}
      <section className="py-12 bg-white border-b border-rose-50 select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-xl mx-auto lg:max-w-none grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left: Quotes explanations (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="inline-flex items-center gap-1.5 bg-rose-50 border border-rose-100 py-1 px-3 rounded-full text-[#C0272D] font-extrabold text-[10px] tracking-wider uppercase">
                <Calculator className="w-3.5 h-3.5" />
                <span>Estimate Guarantee Desk</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-none">
                {copy.calculatorTitle}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 font-semibold leading-relaxed">
                {copy.calculatorSub}
              </p>
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                <p className="text-xs text-slate-600 font-bold leading-normal">
                  {copy.guaranteedRateNote}
                </p>
              </div>
            </div>

            {/* Right: Dynamic Interactive quote panel calculator card (7 cols) */}
            <div className="lg:col-span-7 bg-slate-50 border border-slate-200 rounded-2xl p-6 relative">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Station origin selection block */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                    {copy.pickupCity}
                  </span>
                  <select
                    value={calcSource}
                    onChange={(e) => setCalcSource(e.target.value)}
                    className="w-full bg-white border border-slate-250 rounded-xl py-2.5 px-3 text-xs font-bold text-slate-800 outline-none focus:ring-1 focus:ring-[#C0272D] cursor-pointer"
                  >
                    <option value="Jeddah (Airport / Hotels)">{t.jeddah}</option>
                    <option value="Makkah Al-Mukarramah">{t.makkah}</option>
                    <option value="Al-Madinah Al-Munawwarah">{t.madinah}</option>
                    <option value="Riyadh Metropolitan">{t.riyadh}</option>
                    <option value="Yanbu Port City">{t.yanbu}</option>
                    <option value="Taif Mountain Resort">{t.taif}</option>
                  </select>
                </div>

                {/* Destination station origin block */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                    {copy.destinationCity}
                  </span>
                  <select
                    value={calcTarget}
                    onChange={(e) => setCalcTarget(e.target.value)}
                    className="w-full bg-white border border-slate-250 rounded-xl py-2.5 px-3 text-xs font-bold text-slate-800 outline-none focus:ring-1 focus:ring-[#C0272D] cursor-pointer"
                  >
                    <option value="Makkah Al-Mukarramah">{t.makkah}</option>
                    <option value="Al-Madinah Al-Munawwarah">{t.madinah}</option>
                    <option value="Jeddah (Airport / Hotels)">{t.jeddah}</option>
                    <option value="Riyadh Metropolitan">{t.riyadh}</option>
                    <option value="Yanbu Port City">{t.yanbu}</option>
                    <option value="Taif Mountain Resort">{t.taif}</option>
                  </select>
                </div>

              </div>

              {/* Vehicle class select slider tabs */}
              <div className="mt-5 space-y-2">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                  {lang === 'en' ? "Preferred Cabin Class" : "فئة المقصورة المطلوبة"}
                </span>
                <div className="flex flex-wrap gap-1.5 bg-slate-200/60 p-1 rounded-xl">
                  {['economy', 'business', 'vip', 'group'].map((cls) => (
                    <button
                      key={cls}
                      type="button"
                      onClick={() => setCalcClass(cls as any)}
                      className={`flex-1 py-2 text-[11px] font-extrabold capitalize text-center rounded-lg cursor-pointer transition-all duration-200 ${
                        calcClass === cls 
                          ? 'bg-white text-slate-900 shadow-sm' 
                          : 'text-slate-600 hover:bg-white/30'
                      }`}
                    >
                      {cls === 'economy' ? (lang === 'en' ? 'Economy' : 'اقتصادي') :
                       cls === 'business' ? (lang === 'en' ? 'Premium MPV' : 'عائلي ستاريا') :
                       cls === 'vip' ? (lang === 'en' ? 'VIP SUV' : 'يوكن ملكي') : 
                       (lang === 'en' ? 'Bus / Coach' : 'حافلة حملات')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Calculated dynamic flat rate readout card */}
              <div className="mt-6 bg-[#C0272D]/5 border border-[#C0272D]/20 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                    {copy.estimatedRate}
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-black text-[#C0272D]">
                      {calculateEstimate()}
                    </span>
                    <span className="text-[11px] font-black text-slate-500 uppercase">{t.currency}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCalculatorBook}
                  className="bg-[#C0272D] hover:bg-[#a61f24] text-white font-extrabold text-xs py-2.5 px-4 rounded-xl cursor-pointer shadow-sm transition-colors duration-200"
                  id="calc-fast-book-btn"
                >
                  {copy.bookLockedBtn} ➔
                </button>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* 3. TGA REGULATED & CERTIFIED VEHICLE SECTION (Grid) */}
      <section className="py-16 bg-[#fbf9f6] select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-1.5 bg-[#C0272D]/10 text-[#C0272D] py-1.5 px-3.5 rounded-full text-xs font-black uppercase tracking-widest mb-4">
              <Compass className="w-4 h-4" />
              <span>{lang === 'en' ? "Fully Certified Operations Fleet" : "الأسطول اللوجستي الرسمي المرخص بمواصفات الأمان"}</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight" id="home-fleet-title">
              {copy.fleetTitle}
            </h2>

            <p className="text-slate-500 text-xs sm:text-sm font-semibold mt-2.5 leading-relaxed">
              {copy.fleetSub}
            </p>
          </div>

          {isFiltered && (
            <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3">
                <div className="bg-[#C0272D] text-white p-2 rounded-lg text-sm shrink-0">💡</div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">
                    {lang === 'en' ? "Custom Pricing & Fleet Active" : "الأسعار والعربات المفروزة نشطة"}
                  </h4>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {lang === 'en' 
                      ? `Rates customized for: ${bookingDetails?.tripType} | ${bookingDetails?.fromLocation} ➔ ${bookingDetails?.toLocation}`
                      : `تم تقدير الأسعار لـ: ${bookingDetails?.tripType} | من ${bookingDetails?.fromLocation} إلى ${bookingDetails?.toLocation}`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFilteredVehicles(vehiclesData);
                  setIsFiltered(false);
                  setBookingDetails(undefined);
                }}
                className="text-xs font-black text-[#C0272D] hover:underline whitespace-nowrap cursor-pointer text-left sm:text-right"
              >
                {lang === 'en' ? "← Reset Filter & View Standard Fleet" : "← عرض عربات الأسعار الثابتة القياسية"}
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVehicles.map((vehicle) => {
              const displayPrice = getDynamicVehiclePrice(vehicle);
              const name = lang === 'en' ? vehicle.nameEn : vehicle.nameAr;
              const typeBadge = lang === 'en' ? vehicle.typeEn : vehicle.typeAr;
              const tags = lang === 'en' ? vehicle.tagsEn : vehicle.tagsAr;

              const whatsappNumber = "966501234567";
              const getWhatsAppURL = () => {
                const msg = lang === 'en' 
                  ? `Hello Qawafil! I am interested in booking the ${vehicle.nameEn} (${vehicle.seats} Seats) for my Umrah trip. Please share availability & process.`
                  : `مرحباً قوافل! أود الاستفسار عن حجز سيارة ${vehicle.nameAr} (${vehicle.seats} مقعد) لرحلة العمرة. يرجى تزويدي بالتوفر والخطوات.`;
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

              const isFav = !!favorites[vehicle.id];

              return (
                <div 
                  key={vehicle.id} 
                  className="bg-white border border-rose-100 rounded-3xl shadow-md hover:shadow-xl hover:border-brand-primary/20 transition-all duration-300 overflow-hidden flex flex-col justify-between group"
                  id={`vehicle-card-${vehicle.id}`}
                >
                  {/* Top Cover Image with slanted bottom */}
                  <div className="h-48 sm:h-56 w-full relative overflow-hidden bg-slate-100">
                    <img 
                      src={vehicleImages[vehicle.id] || "https://images.unsplash.com/photo-1619551483344-0de91dda9c16?auto=format&fit=crop&w=800&q=80"} 
                      alt={name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-60 pointer-events-none" />
                    
                    <svg className="absolute bottom-0 left-0 w-full h-8 text-white fill-current pointer-events-none" viewBox="0 0 100 10" preserveAspectRatio="none">
                      <polygon points="0,10 100,10 100,0 0,7" />
                    </svg>

                    {/* Quick action widgets on top right */}
                    <div className="absolute top-4 right-4 flex gap-2 z-10">
                      {/* WhatsApp Button */}
                      <a
                        href={getWhatsAppURL()}
                        target="_blank"
                        referrerPolicy="no-referrer"
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white flex items-center justify-center shadow-md cursor-pointer hover:scale-110 active:scale-95 transition-all duration-200 text-emerald-600 border border-emerald-50"
                        title={lang === 'en' ? 'Enquire on WhatsApp' : 'الاستفسار عبر الواتساب'}
                      >
                        <MessageSquare className="w-4.5 h-4.5 sm:w-5 sm:h-5 fill-emerald-50/20 text-emerald-600" />
                      </a>

                      {/* Favorite Button */}
                      <button
                        type="button"
                        onClick={() => setFavorites(prev => ({ ...prev, [vehicle.id]: !prev[vehicle.id] }))}
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white flex items-center justify-center shadow-md cursor-pointer hover:scale-110 active:scale-95 transition-all duration-200 border border-rose-50"
                      >
                        <Heart className={`w-4.5 h-4.5 sm:w-5 sm:h-5 transition-colors duration-200 ${isFav ? 'fill-[#C0272D] text-[#C0272D]' : 'text-slate-400'}`} />
                      </button>
                    </div>

                    {/* Overlapping Price Badge */}
                    <div className="absolute bottom-0 right-4 bg-white px-5 py-3 rounded-t-2xl shadow-lg border-x border-t border-rose-50 flex flex-col items-center justify-center translate-y-[2px] z-10">
                      <div className="flex items-baseline gap-0.5">
                        <span className="text-xl sm:text-2xl font-black text-[#C0272D] leading-none">
                          {displayPrice}
                        </span>
                        <span className="text-[10px] font-black text-[#C0272D] uppercase ml-0.5">
                          {t.currency || 'SAR'}
                        </span>
                      </div>
                      <span className="text-[9px] font-black text-slate-400 tracking-widest uppercase mt-1 leading-none">
                        {isFiltered ? (lang === 'en' ? "EST. QUOTE" : "سعر تقديري") : (lang === 'en' ? "FLAT RATE" : "سعر ثابت")}
                      </span>
                    </div>
                  </div>

                  {/* Details Area */}
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Vehicle Header with illustration & Name */}
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

                      {/* Seat Capacity & Feature list */}
                      <div className="flex flex-col md:flex-row gap-4 items-stretch">
                        <div className="bg-[#FAECEC]/60 rounded-2xl py-3 px-4 flex items-center gap-3 shrink-0 self-start md:self-center">
                          <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-sm">
                            <Users className="w-4.5 h-4.5 text-[#C0272D]" />
                          </div>
                          <div className="text-xs sm:text-sm font-bold text-slate-800">
                            <span className="text-slate-500 font-medium">{lang === 'en' ? 'Seats: ' : 'المقاعد: '}</span>
                            <span className="text-brand-primary font-black text-sm sm:text-base">{vehicle.seats}</span>
                          </div>
                        </div>

                        {/* Features 2x2 list */}
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

                    {/* Footer Row with badges & Book CTA button */}
                    <div className="flex items-center justify-between gap-4 mt-6 pt-4 border-t border-slate-100">
                      <div>
                        {getBottomLeftBadge()}
                      </div>

                      <button
                        type="button"
                        onClick={() => triggerDirectVehicleBooking({ ...vehicle, price: displayPrice })}
                        className="bg-brand-primary hover:bg-brand-dark text-white font-extrabold text-xs sm:text-sm px-5 py-3.5 rounded-2xl shadow-md hover:shadow-lg hover:translate-y-[-1px] active:translate-y-[1px] transition-all duration-200 cursor-pointer flex items-center gap-1.5 group-hover:scale-[1.02]"
                      >
                        <span>{t.navBookNow}</span>
                        <ChevronRight className={`w-4 h-4 transition-transform duration-200 group-hover:translate-x-1 ${lang === 'en' ? '' : 'rotate-180 group-hover:-translate-x-1'}`} />
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* 4. HOLY LANDMARK tours (Ziyarat programs quick links) */}
      <section className="py-16 bg-white border-y border-rose-50 select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left: Text and CTA (5 cols) */}
            <div className="lg:col-span-5 space-y-5">
              <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-150 text-amber-700 py-1 px-3.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase">
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                <span>Islamic Landmark Tours</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none" id="landmark-ziyarat-desc">
                {t.ziyaratTitle}
              </h2>

              <p className="text-slate-500 font-semibold text-xs sm:text-sm leading-relaxed">
                {t.ziyaratDesc}
              </p>

              <div className="space-y-3 pt-2 text-xs">
                <div className="flex items-start gap-2.5 font-bold text-slate-700">
                  <span className="text-[#C0272D] mt-0.5 font-extrabold">✓</span>
                  <span>{lang === 'en' ? "Visits Cave of Hira, Uhud Memorial, Quba Mosque." : "تغطية كامل معالم غار حراء، شهداء أحد، مسجد قباء والقبلتين."}</span>
                </div>
                <div className="flex items-start gap-2.5 font-bold text-slate-700">
                  <span className="text-[#C0272D] mt-0.5 font-extrabold">✓</span>
                  <span>{lang === 'en' ? "Includes cold Zamzam water distributions." : "مرافقة سائق مؤهل تشمل توفير وتوزيع مياه زمزم والمعدنية."}</span>
                </div>
              </div>

              {/* Direct links to Ziyarat page */}
              <div className="pt-4">
                <a 
                  href="#/ziyarat" 
                  className="inline-flex items-center gap-2 bg-[#C0272D] hover:bg-[#a61f24] text-white font-extrabold text-xs px-5 py-3 rounded-xl shadow-md decoration-transparent"
                >
                  <span>{lang === 'en' ? "Select Sacred Ziyarat Program" : "تصفح باقات الزيارات التفصيلية"}</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Right: Premium visual showcase split mock (7 cols) */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6 relative">
              
              {/* Makkah Tour Box */}
              <div className="bg-slate-900 text-white p-6 rounded-2xl relative overflow-hidden select-none shadow hover:shadow-lg transition-all duration-300">
                <span className="absolute -right-6 -bottom-6 text-7xl opacity-5">🕋</span>
                <div className="relative z-10 space-y-3">
                  <span className="bg-brand-primary text-[9px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-sm">
                    Makkah Al-Mukarramah
                  </span>
                  <h4 className="text-base font-extrabold pb-2 border-b border-white/10">
                    {lang === 'en' ? "Sacred Lands Visit" : "مزارات المشاعر المقدسة"}
                  </h4>
                  <p className="text-[11px] text-slate-400 font-medium leading-relaxed leading-snug">
                    {t.makkahTourDesc}
                  </p>
                  <div className="pt-2 flex items-center justify-between text-xs gap-3">
                    <div className="flex flex-col">
                      <span className="text-slate-400 font-bold text-[10px] uppercase">Flat rate</span>
                      <span className="text-brand-primary font-black text-sm">380 SAR</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => triggerTourBooking("Makkah Sacred Landmarks Tour", "مزارات المشاعر المقدسة بمكة", 380)}
                      className="bg-brand-primary hover:bg-brand-dark text-white font-extrabold text-[10px] uppercase tracking-wider px-3.5 py-2 rounded-lg transition-colors cursor-pointer border-0"
                    >
                      {lang === 'en' ? "Book Now" : "احجز الآن"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Madinah Tour Box */}
              <div className="bg-slate-900 text-white p-6 rounded-2xl relative overflow-hidden select-none shadow hover:shadow-lg transition-all duration-300">
                <span className="absolute -right-6 -bottom-6 text-7xl opacity-5">🟢</span>
                <div className="relative z-10 space-y-3">
                  <span className="bg-emerald-600 text-[9px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-sm">
                    Al-Madinah Al-Munawwarah
                  </span>
                  <h4 className="text-base font-extrabold pb-2 border-b border-white/10">
                    {lang === 'en' ? "Historical Mosques Visit" : "مزارات الروضة والمعالم النبوية"}
                  </h4>
                  <p className="text-[11px] text-slate-400 font-medium leading-relaxed leading-snug">
                    {t.madinahTourDesc}
                  </p>
                  <div className="pt-2 flex items-center justify-between text-xs gap-3">
                    <div className="flex flex-col">
                      <span className="text-slate-400 font-bold text-[10px] uppercase">Flat rate</span>
                      <span className="text-brand-primary font-black text-sm">360 SAR</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => triggerTourBooking("Madinah Noble Prophet's Sites Tour", "مزارات المعالم النبوية بالمدينة", 360)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] uppercase tracking-wider px-3.5 py-2 rounded-lg transition-colors cursor-pointer border-0"
                    >
                      {lang === 'en' ? "Book Now" : "احجز الآن"}
                    </button>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* 5. TRAVEL COORDINATOR & CAMPAIGN LEADS CONVERSION HERO BOARD */}
      <section className="py-16 bg-[#111622] text-white border-b border-rose-950 overflow-hidden relative select-none">
        
        {/* Subtle glowing elements */}
        <div className="absolute inset-x-0 bottom-0 h-40 bg-[radial-gradient(circle_at_center,rgba(192,39,45,0.12),transparent_30%)] pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-6">
          <div className="inline-flex items-center gap-1 bg-[#C0272D]/20 text-brand-primary border border-[#C0272D]/50 py-1.5 px-4 rounded-full text-[10px] font-black uppercase tracking-widest">
            <Layers className="w-3.5 h-3.5" />
            <span>{copy.coordTitle}</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black tracking-tight max-w-2xl mx-auto text-white">
            {copy.coordSub}
          </h2>

          <p className="text-slate-400 text-xs sm:text-sm font-semibold max-w-xl mx-auto leading-relaxed">
            {copy.coordDesc}
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md mx-auto">
            {/* Quick action button opening direct WhatsApp coordination ticket */}
            <a
              href="https://wa.me/966501234567?text=%D8%A7%D9%84%D8%B3%D9%84%D8%A7%D9%85%20%D8%B9%D9%84%D9%8A%D9%83%D9%85%20%D9%82%D9%84%D8%B9%20%D8%A7%D9%84%D9%85%25D8%25AC%25D8%25AF%21%20%D8%A3%D9%86%D8%A7%20%D9%85%D9%86%D8%B3%D9%82%20%D8%AD%D9%85%D9%84%D8%A7%D8%AA%20%D9%88%D8%A3%D8%B1%D8%BA%D8%A8%20%D9%81%D9%8A%20%D8%A7%D9%84%D8%AA%D9%86%D8%B3%D9%8A%D9%82%20%D8%A7%D9%84%D9%84%D9%88%D8%AC%D8%B3%D8%AA%D9%8A%20%D9%84%D9%85%D8%AC%D9%85%D9%88%D8%B9%D8%A9%20%D9%83%D8%A8%D9%8A%D8%B1%D8%A9%20%D9%85%D9%86%20%D8%A7%D9%84%D9%85%D8%B9%D8%AA%D9%85%D8%B1%D9%8A%D9%86%20%D8%AA%D9%81%D9%88%D9%8A%D8%AC%20%D8%AD%D8%A7%D9%81%D9%84%D8%A7%D8%AA."
              target="_blank"
              referrerPolicy="no-referrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#C0272D] hover:bg-[#a61f24] text-white font-extrabold text-xs px-6 py-3.5 rounded-xl shadow-md transition-colors decoration-transparent"
              id="travel-coord-whatsapp-lead"
            >
              <MessageSquare className="w-5 h-5" />
              <span>{copy.coordBtn}</span>
            </a>

            <a
              href="#/contact"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-750 text-slate-300 font-extrabold text-xs px-6 py-3.5 rounded-xl border border-slate-700 decoration-transparent"
            >
              <span>{lang === 'en' ? "Open Custom Quote Ticket" : "تعبئة بطاقة استفسار مخصصة"}</span>
            </a>
          </div>

        </div>
      </section>

      {/* 6. TRUSTED BY CORPORATES PANEL */}
      <section className="py-12 bg-white select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-[10px] text-slate-400 font-black tracking-widest uppercase mb-6">
            {lang === 'en' ? "Fully Authorized Under Ministry Of Transport Safeguards" : "عمليات معتمدة وخاضعة للائحة الفنية والتراخيص البرية"}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-300">
            <div className="text-xs font-black tracking-wider text-slate-500 font-sans">
              🇸🇦 KINGDOM TRANSPORT LAWS
            </div>
            <div className="text-xs font-black tracking-wider text-slate-500 font-sans">
              ✓ TGA COMPLIANCE ID: 966-A
            </div>
            <div className="text-xs font-black tracking-wider text-slate-500 font-sans">
              🛡 SAFE CARAVANS SHIELD01
            </div>
            <div className="text-xs font-black tracking-wider text-slate-500 font-sans">
              ⚡ LIVE GPS TELEMETRY
            </div>
          </div>
        </div>
      </section>

      {/* Booking Controller modal popup connecting everything */}
      <BookingModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        selectedVehicle={selectedVehicle}
        bookingDetails={bookingDetails}
      />

    </div>
  );
}
