import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useLang } from '../context/LangContext';
import SEO from '../components/SEO';
import { 
  CheckCircle2, 
  MessageSquare, 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Phone, 
  ArrowLeft, 
  ArrowRight,
  ShieldCheck, 
  Tag,
  Car,
  FileCheck
} from 'lucide-react';
import { getRateGuaranteePolicy } from '../utils/pricingPolicy';

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    _fbq?: any;
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
  }
}

export interface BookingConfirmationData {
  id?: string;
  name?: string;
  phone?: string;
  service?: string;
  caravan?: string;
  customStation?: string;
  date?: string;
  time?: string;
  price?: number;
  ratePolicy?: 'guaranteed_fixed' | 'market_discount_10';
  rateGuaranteeNotice?: string;
  vehicleImage?: string;
  vehicleNameEn?: string;
  vehicleNameAr?: string;
  createdAt?: string;
}

export default function BookingConfirmation() {
  const { lang, t } = useLang();
  const location = useLocation();
  const navigate = useNavigate();
  const hasTrackedRef = useRef(false);

  // Retrieve booking details from state, search params, or session storage
  const booking: BookingConfirmationData = (() => {
    // 1. React Router navigation state
    if (location.state && (location.state as any).booking) {
      return (location.state as any).booking;
    }

    // 2. URL search parameters
    const params = new URLSearchParams(location.search);
    const paramId = params.get('id');
    if (paramId) {
      const paramName = params.get('name') || '';
      const paramPhone = params.get('phone') || '';
      const paramService = params.get('service') || '';
      const paramCaravan = params.get('caravan') || '';
      const paramDate = params.get('date') || '';
      const paramTime = params.get('time') || '';
      const paramPrice = params.get('price') ? parseFloat(params.get('price')!) : undefined;
      const paramStation = params.get('station') || '';

      if (paramName || paramPhone || paramService) {
        return {
          id: paramId,
          name: paramName,
          phone: paramPhone,
          service: paramService,
          caravan: paramCaravan,
          customStation: paramStation,
          date: paramDate,
          time: paramTime,
          price: paramPrice,
          createdAt: new Date().toISOString()
        };
      }
    }

    // 3. Fallback to session storage
    if (typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem('qam_last_booking');
        if (stored) {
          return JSON.parse(stored);
        }
      } catch (e) {
        console.error('Failed to parse cached booking:', e);
      }
    }

    return {
      id: 'QAM-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      name: lang === 'en' ? 'Valued Pilgrim' : 'ضيف الرحمن',
      phone: '',
      service: lang === 'en' ? 'Umrah & Transport VIP Booking' : 'حجز نقل VIP للعمرة والزيارات',
      caravan: 'VIP Luxury Caravan',
      customStation: 'Makkah / Madinah / Jeddah Transfer',
      date: new Date().toISOString().split('T')[0],
      time: '09:30',
      price: 1200,
      createdAt: new Date().toISOString()
    };
  })();

  const travelDate = booking.date || '';
  const ratePolicy = getRateGuaranteePolicy(travelDate, booking.price);

  // Trigger Meta Pixel & Analytics Event Tracking once on mount
  useEffect(() => {
    if (hasTrackedRef.current) return;
    hasTrackedRef.current = true;

    const bookingValue = typeof booking.price === 'number' ? booking.price : 1200;
    const bookingId = booking.id || `lead_${Date.now()}`;
    const vehicleName = booking.caravan || booking.service || 'VIP Transport';

    // 1. Meta Pixel PageView (ensuring SPA route change is recognized)
    if (typeof window.fbq === 'function') {
      try {
        window.fbq('track', 'PageView');
      } catch (err) {
        console.warn('Meta Pixel PageView error:', err);
      }

      // 2. Meta Pixel Standard "Lead" Event
      try {
        window.fbq('track', 'Lead', {
          content_name: vehicleName,
          content_category: 'Pilgrim Transportation',
          value: bookingValue,
          currency: 'SAR',
          booking_id: bookingId
        });
      } catch (err) {
        console.warn('Meta Pixel Lead event error:', err);
      }

      // 3. Meta Pixel Custom "BookingConfirmation" Event
      try {
        window.fbq('trackCustom', 'BookingConfirmation', {
          booking_id: bookingId,
          service: booking.service,
          caravan: booking.caravan,
          travel_date: booking.date,
          pickup: booking.customStation,
          rate_policy: ratePolicy.status,
          currency: 'SAR',
          value: bookingValue
        });
      } catch (err) {
        console.warn('Meta Pixel custom event error:', err);
      }
    }

    // 4. Google Analytics / Google Tag Manager
    if (typeof window.gtag === 'function') {
      try {
        window.gtag('event', 'generate_lead', {
          currency: 'SAR',
          value: bookingValue,
          transaction_id: bookingId,
          item_name: vehicleName
        });
        window.gtag('event', 'booking_confirmed', {
          booking_id: bookingId,
          vehicle: vehicleName,
          date: booking.date
        });
      } catch (err) {
        console.warn('Google Analytics event error:', err);
      }
    }

    // 5. DataLayer push for tag management systems
    if (typeof window !== 'undefined') {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: 'booking_confirmation',
        booking_id: bookingId,
        service: booking.service,
        vehicle: booking.caravan,
        value: bookingValue,
        currency: 'SAR',
        rate_policy: ratePolicy.status
      });
    }
  }, [booking, ratePolicy.status]);

  // WhatsApp link preparation
  const whatsappNumber = "966542049512";
  const getWhatsAppURL = () => {
    const bookingCode = booking.id || 'N/A';
    const clientName = booking.name || 'Pilgrim';
    const clientPhone = booking.phone || 'N/A';
    const vehicle = booking.caravan || 'VIP Vehicle';
    const pickup = booking.customStation || 'Not specified';
    const travelDay = booking.date || 'TBD';
    const travelTime = booking.time || 'TBD';

    let rateLine = '';
    if (ratePolicy.isLaterThanThreeMonths) {
      rateLine = lang === 'en'
        ? `- *Rate Policy:* ${ratePolicy.policyStatementEn}\n`
        : `- *سياسة التسعير:* ${ratePolicy.policyStatementAr}\n`;
    } else if (ratePolicy.isCurrentMonth) {
      rateLine = lang === 'en'
        ? `- *Fare:* SAR ${booking.price || 'Fixed'} (Locked Fixed Rate)\n`
        : `- *السعر:* ${booking.price || 'محدد'} ريال (سعر ثابت مضمون)\n`;
    } else {
      rateLine = lang === 'en'
        ? `- *Rate Policy:* ${ratePolicy.policyStatementEn}\n- *Estimated Benchmark:* SAR ${booking.price || 'Estimated'}\n`
        : `- *سياسة التسعير:* ${ratePolicy.policyStatementAr}\n- *السعر المرجعي التقديري:* ${booking.price || 'تقديري'} ريال\n`;
    }

    const msg = lang === 'en'
      ? `Assalamu Alaikum Qawafil Al Majd Al Misaliya! I have just completed my booking on your website:\n\n` +
        `- *Booking Reference:* ${bookingCode}\n` +
        `- *Name:* ${clientName}\n` +
        `- *Phone:* ${clientPhone}\n` +
        `- *Vehicle/Caravan:* ${vehicle}\n` +
        `- *Travel Date:* ${travelDay} at ${travelTime}\n` +
        `- *Pickup Location:* ${pickup}\n` +
        `${rateLine}` +
        `\nPlease confirm the assignment of our professional driver and vehicle availability. Jazakum Allah Khair!`
      : `السلام عليكم قوافل المجد المثالية! لقد قمت للتو بتأكيد الحجز عبر الموقع الإلكتروني:\n\n` +
        `- *رقم الحجز المرجعي:* ${bookingCode}\n` +
        `- *الاسم الكريم:* ${clientName}\n` +
        `- *رقم التواصل:* ${clientPhone}\n` +
        `- *المركبة المطلوبة:* ${vehicle}\n` +
        `- *تاريخ الرحلة:* ${travelDay} الساعة ${travelTime}\n` +
        `- *موقع الاستلام:* ${pickup}\n` +
        `${rateLine}` +
        `\nيرجى تأكيد استلام الحجز واعتماد تعيين السائق والناقلة. جزاكم الله خيراً!`;

    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`;
  };

  const bookingCodeDisplay = booking.id ? booking.id.toUpperCase() : 'QAM-PENDING';

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <SEO 
        title={lang === 'ar' ? 'تم تأكيد الحجز بنجاح' : 'Booking Confirmed Successfully'} 
        description={lang === 'ar' ? 'تم تأكيد حجزك في قوافل المجد المثالية بنجاح.' : 'Your booking has been confirmed with Qawafil Al Majd Al Misaliya.'}
        noIndex={true}
      />

      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Success Header Banner */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-sm text-center relative overflow-hidden">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
            <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-black uppercase tracking-wider mb-2 border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>{lang === 'en' ? 'Reservation 100% Secured' : 'الحجز مؤكد ومضمون ١٠٠٪'}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {lang === 'en' ? 'Booking Confirmed Successfully!' : 'تم تأكيد طلب الحجز بنجاح!'}
          </h1>
          
          <p className="text-slate-600 text-sm sm:text-base mt-2 max-w-xl mx-auto leading-relaxed">
            {lang === 'en' 
              ? 'Jazakallah Khayran. Your transportation request has been recorded into our 24/7 operations dispatch system. Our team is coordinating your itinerary.'
              : 'جزاكم الله خيراً. تم تسجيل طلب رحلتكم في نظام التنسيق لعمليات قوافل المجد المثالية على مدار الساعة، ويجري تجهيز الحافلة وتعيين السائق.'}
          </p>

          <div className="mt-5 inline-block bg-slate-50 border border-slate-200 px-4 py-2 rounded-2xl">
            <span className="text-xs text-slate-500 font-bold block">
              {lang === 'en' ? 'Booking Reference Code' : 'رمز الحجز المرجعي'}
            </span>
            <span className="text-base sm:text-lg font-black text-brand-primary tracking-widest font-mono">
              #{bookingCodeDisplay}
            </span>
          </div>
        </div>

        {/* Rate Guarantee / Pricing Policy Card */}
        <div 
          className={`p-5 sm:p-6 rounded-3xl border ${
            ratePolicy.isCurrentMonth 
              ? 'bg-emerald-50/90 border-emerald-200 text-emerald-950' 
              : 'bg-amber-50/90 border-amber-200 text-amber-950'
          }`}
          id="confirmation-policy-card"
        >
          <div className="flex items-center gap-2 font-black text-sm mb-2">
            <ShieldCheck className={`w-5 h-5 ${ratePolicy.isCurrentMonth ? 'text-emerald-600' : 'text-amber-600'}`} />
            <span>{lang === 'en' ? ratePolicy.badgeEn : ratePolicy.badgeAr}</span>
          </div>
          
          <p className="font-extrabold text-sm sm:text-base leading-relaxed">
            {lang === 'en' ? ratePolicy.policyStatementEn : ratePolicy.policyStatementAr}
          </p>
          
          {!ratePolicy.isCurrentMonth ? (
            <p className="text-xs text-amber-900 mt-2 leading-relaxed">
              {lang === 'en'
                ? 'Your reservation is secured! 2 weeks before your travel date, our operations team will finalize and lock in your final fare at 10% below the prevailing market price.'
                : 'حجز مركبتك مؤكد ومضمون! وقبل موعد الرحلة بأسبوعين سيتواصل معك فريق التشغيل لتثبيت السعر النهائي بخصم 10% أقل من سعر السوق السائد.'}
            </p>
          ) : (
            <p className="text-xs text-emerald-800 mt-2 leading-relaxed">
              {lang === 'en'
                ? `Your locked fare of SAR ${booking.price || 'Fixed'} is guaranteed for in-month service.`
                : `سعرك الثابت البالغ ${booking.price || 'محدد'} ريال مضمون ومثبت لرحلتك خلال هذا الشهر.`}
            </p>
          )}
        </div>

        {/* Reservation Details Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden" id="booking-details-card">
          <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-brand-primary" />
              <h2 className="text-sm sm:text-base font-bold tracking-tight">
                {lang === 'en' ? 'Pilgrim Reservation Details' : 'تفاصيل الحجز المؤكد'}
              </h2>
            </div>
            <span className="text-xs text-slate-300 font-mono">
              {new Date().toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US')}
            </span>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            
            {/* Vehicle & Service Overview */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  {lang === 'en' ? 'Reserved Caravan & Service' : 'المركبة والخدمة المحجوزة'}
                </span>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 mt-1 flex items-center gap-2">
                  <Car className="w-5 h-5 text-brand-primary" />
                  <span>{booking.caravan || booking.service || 'VIP Transport'}</span>
                </h3>
                {booking.service && (
                  <p className="text-xs text-slate-500 font-semibold mt-1">
                    {booking.service}
                  </p>
                )}
              </div>

              <div className="sm:text-right">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  {lang === 'en' ? 'Fare Status' : 'حالة التسعير'}
                </span>
                {ratePolicy.isLaterThanThreeMonths ? (
                  <div className="mt-1">
                    <span className="inline-block px-2.5 py-1 bg-amber-100 text-amber-900 font-black text-xs rounded-lg border border-amber-200">
                      {lang === 'en' ? '10% Below Market Rate' : 'خصم 10% عن سعر السوق'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold block mt-1">
                      {lang === 'en' ? 'Finalized 2 weeks before travel' : 'يُعتمد قبل أسبوعين من السفر'}
                    </span>
                  </div>
                ) : (
                  <div className="mt-1">
                    <span className="text-xl font-black text-brand-primary">
                      {booking.price ? `${booking.price} ${t.currency}` : 'Fixed'}
                    </span>
                    {!ratePolicy.isCurrentMonth && (
                      <span className="text-[10px] text-slate-500 block">
                        {lang === 'en' ? '(Est. Benchmark)' : '(سعر مرجعي)'}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Itinerary Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
              
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-500 font-bold text-xs">
                  <User className="w-4 h-4 text-slate-400" />
                  <span>{lang === 'en' ? 'Passenger Name' : 'اسم الحاج / العميل'}</span>
                </div>
                <p className="text-slate-900 font-black text-sm">
                  {booking.name || (lang === 'en' ? 'Valued Customer' : 'العميل الكريم')}
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-500 font-bold text-xs">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span>{lang === 'en' ? 'WhatsApp Contact' : 'رقم الواتساب'}</span>
                </div>
                <p className="text-slate-900 font-black text-sm font-mono" dir="ltr">
                  {booking.phone || 'N/A'}
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-500 font-bold text-xs">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>{lang === 'en' ? 'Travel Date' : 'تاريخ الرحلة'}</span>
                </div>
                <p className="text-slate-900 font-black text-sm">
                  {booking.date || (lang === 'en' ? 'To be confirmed' : 'يحدد لاحقاً')}
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-500 font-bold text-xs">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>{lang === 'en' ? 'Departure Time' : 'وقت الانطلاق'}</span>
                </div>
                <p className="text-slate-900 font-black text-sm">
                  {booking.time || '09:30'}
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1 sm:col-span-2">
                <div className="flex items-center gap-1.5 text-slate-500 font-bold text-xs">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span>{lang === 'en' ? 'Pickup Location / Station' : 'موقع التجمع أو الاستلام'}</span>
                </div>
                <p className="text-slate-800 font-medium text-xs leading-relaxed">
                  {booking.customStation || (lang === 'en' ? 'Makkah / Madinah / Jeddah Terminal' : 'مكة / المدينة / مطار جدة')}
                </p>
              </div>

            </div>

            {/* Next Steps Guide */}
            <div className="bg-rose-50/50 rounded-2xl p-4 border border-rose-100 text-xs space-y-2">
              <span className="font-black text-slate-800 block text-xs">
                {lang === 'en' ? 'What Happens Next?' : 'ماذا يحدث بعد تأكيد الحجز؟'}
              </span>
              <ul className="space-y-1 text-slate-600 list-disc list-inside">
                <li>
                  {lang === 'en' 
                    ? 'Our operations desk registers your booking details and matches an appropriate certified driver.' 
                    : 'يقوم فريق العمليات بمطابقة مركبتكم وتعيين سائق معتمد ذو خبرة بالطرق.'}
                </li>
                <li>
                  {lang === 'en' 
                    ? 'You will receive driver contact, live tracking, and vehicle plate details via WhatsApp.' 
                    : 'ستصلك بيانات السائق ورقم اللوحة والتواصل عبر الواتساب فور استكمال التعيين.'}
                </li>
                <li>
                  {lang === 'en'
                    ? 'For inquiries or immediate assistance, click the WhatsApp button below anytime.'
                    : 'لأي استفسار أو تعديل، يمكنك الضغط على زر الواتساب للتحدث مباشرة مع المشرف.'}
                </li>
              </ul>
            </div>

          </div>

          {/* Action Buttons Footer */}
          <div className="bg-slate-50 px-6 py-5 border-t border-slate-200">
            <a
              href={getWhatsAppURL()}
              target="_blank"
              referrerPolicy="no-referrer"
              className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm sm:text-base py-3.5 px-6 rounded-2xl shadow-md transition-all decoration-transparent"
              id="whatsapp-dispatch-btn"
            >
              <MessageSquare className="w-5 h-5" />
              <span>{lang === 'en' ? 'Chat with Dispatch on WhatsApp' : 'إرسال التفاصيل للمنسق عبر وتساب'}</span>
            </a>
          </div>

        </div>

        {/* Back navigation options */}
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 px-2 gap-3">
          <Link
            to={{ pathname: '/', search: `?lang=${lang}` }}
            className="inline-flex items-center gap-1 font-bold text-slate-700 hover:text-brand-primary transition-colors decoration-transparent"
          >
            {lang === 'ar' ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
            <span>{lang === 'en' ? 'Return to Home' : 'العودة للصفحة الرئيسية'}</span>
          </Link>

          <Link
            to={{ pathname: '/fleet', search: `?lang=${lang}` }}
            className="inline-flex items-center gap-1 font-bold text-slate-700 hover:text-brand-primary transition-colors decoration-transparent"
          >
            <span>{lang === 'en' ? 'Explore Fleet & Caravans' : 'تصفح باقي الأسطول'}</span>
            {lang === 'ar' ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
          </Link>
        </div>

      </div>
    </div>
  );
}
