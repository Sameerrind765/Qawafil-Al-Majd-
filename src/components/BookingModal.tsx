import React, { useState, useEffect, useRef } from 'react';
import { useLang } from '../context/LangContext';
import { VehicleData } from '../data/vehicles';
import { X, CheckCircle2, MessageSquare, ShieldCheck, Mail, User, Phone, MapPin, Sparkles } from 'lucide-react';
import { saveLead } from '../firebaseService';
import { HomepageLead } from '../types';
import { serverTimestamp } from 'firebase/firestore';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedVehicle: VehicleData | null;
  bookingDetails?: {
    tripType: string;
    fromLocation: string;
    toLocation: string;
    date: string;
    passengers: string;
    luggage: string;
  };
}

export default function BookingModal({ isOpen, onClose, selectedVehicle, bookingDetails }: BookingModalProps) {
  const { lang, t } = useLang();
  
  // Controlled inputs state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [pickupHotel, setPickupHotel] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [travelDate, setTravelDate] = useState('');
  const [departureTime, setDepartureTime] = useState('09:30');
  const [dateError, setDateError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);

  // Sync state with bookingDetails whenever modal opens or details change
  useEffect(() => {
    if (bookingDetails?.date) {
      setTravelDate(bookingDetails.date);
      setDateError('');
    } else {
      setTravelDate('');
    }
  }, [bookingDetails, isOpen]);

  // Focus trap / Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Click outside listener
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!travelDate) {
      setDateError(lang === 'en' ? "Please select a travel date" : "يرجى تحديد تاريخ السفر");
      return;
    }
    setDateError('');
    setLoading(true);

    try {
      const generatedId = 'lead_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
      
      const serviceStr = bookingDetails
        ? `${bookingDetails.tripType}: ${bookingDetails.fromLocation} to ${bookingDetails.toLocation} (${selectedVehicle?.nameEn || ''})`
        : `Direct Vehicle Booking: ${selectedVehicle?.nameEn || ''}`;

      const finalDate = travelDate;
      const finalTime = departureTime || '09:30';

      const detailsStr = bookingDetails
        ? `Date: ${finalDate} | Time: ${finalTime} | Pax: ${bookingDetails.passengers} | Luggage: ${bookingDetails.luggage} | Hotel: ${pickupHotel} | Notes: ${specialRequests}`
        : `Hotel: ${pickupHotel} | Notes: ${specialRequests}`;
      
      const newLead: HomepageLead = {
        id: generatedId,
        name: fullName.trim(),
        phone: phone.trim(),
        service: serviceStr,
        caravan: selectedVehicle?.nameEn || 'Default Fleet',
        customStation: detailsStr,
        createdAt: serverTimestamp(),
        status: 'Pending',
        date: finalDate,
        time: finalTime
      };

      await saveLead(newLead);
      setIsSuccess(true);
    } catch (err) {
      console.error("Failed to save booking custom lead to Firestore:", err);
      // Fallback: still show complete window for UX
      setIsSuccess(true);
    } finally {
      setLoading(false);
    }
  };

  const resetAndClose = () => {
    setIsSuccess(false);
    setFullName('');
    setPhone('');
    setPickupHotel('');
    setSpecialRequests('');
    onClose();
  };

  // Pre-filled WhatsApp message URL
  const whatsappNumber = "966501234567";
  const getWhatsAppURL = () => {
    const vName = lang === 'en' ? selectedVehicle?.nameEn : selectedVehicle?.nameAr;
    const vPrice = selectedVehicle?.price;
    
    let routeInfo = '';
    if (bookingDetails) {
      routeInfo = lang === 'en'
        ? `\n- *Trip Type:* ${bookingDetails.tripType}\n- *From:* ${bookingDetails.fromLocation}\n- *To:* ${bookingDetails.toLocation}\n- *Date:* ${bookingDetails.date}\n- *Passengers:* ${bookingDetails.passengers}\n- *Luggage:* ${bookingDetails.luggage}`
        : `\n- *نوع الرحلة:* ${bookingDetails.tripType}\n- *من:* ${bookingDetails.fromLocation}\n- *إلى:* ${bookingDetails.toLocation}\n- *التاريخ:* ${bookingDetails.date}\n- *الركاب:* ${bookingDetails.passengers}\n- *الحقائب:* ${bookingDetails.luggage}`;
    }

    const msg = lang === 'en'
      ? `Assalamu Alaikum Qawafil Al Majd! I want to confirm my booking reservation for:\n\n- *Vehicle:* ${vName}\n- *Rate:* SAR ${vPrice}${routeInfo}\n- *My Name:* ${fullName}\n- *WhatsApp:* ${phone}\n- *Pickup Details:* ${pickupHotel}\n- *Notes:* ${specialRequests}\n\nPlease dispatch, thank you.`
      : `السلام عليكم قوافل المجد! أرغب في تأكيد حجز الرحلة:\n\n- *المركبة المطلوبة:* ${vName}\n- *التسعيرة المقدرة:* ${vPrice} ريال${routeInfo}\n- *الاسم الكريم:* ${fullName}\n- *رقم التواصل:* ${phone}\n- *موقع الاستلام:* ${pickupHotel}\n- *متطلبات خاصة:* ${specialRequests}\n\nيرجى تأكيد التفويج والخدمة البرية، شكراً لكم.`;
    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`;
  };

  return (
    <div 
      className="fixed inset-0 z-55 bg-black/65 flex items-center justify-center p-4 backdrop-blur-sm transition-all duration-300 animate-fadeIn"
      onClick={handleOverlayClick}
      id="booking-modal-overlay"
    >
      <div 
        ref={modalRef}
        className="bg-white rounded-2xl shadow-2xl border border-rose-100 max-w-lg w-full overflow-hidden transform transition-all duration-300"
        id="booking-modal-card"
      >
        {/* Header bar */}
        <div className="bg-brand-bg-dark text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-primary" />
            <h3 className="text-sm font-extrabold tracking-tight">
              {t.bookTitle}
            </h3>
          </div>
          <button 
            type="button"
            onClick={resetAndClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            id="modal-close-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected vehicle summary preview */}
        {selectedVehicle && !isSuccess && (
          <div className="bg-rose-50/70 border-b border-rose-100/50 px-6 py-3.5 flex justify-between items-center text-xs">
            <div>
              <p className="font-semibold text-slate-500 uppercase tracking-wide">
                Selected Caravan
              </p>
              <h4 className="font-bold text-slate-850 text-sm mt-0.5">
                {selectedVehicle.emoji} {lang === 'en' ? selectedVehicle.nameEn : selectedVehicle.nameAr}
              </h4>
            </div>
            <div className="text-right">
              <p className="font-semibold text-slate-500 uppercase tracking-wide">
                Guaranteed Flat Rate
              </p>
              <p className="text-brand-primary font-extrabold text-sm mt-0.5">
                {selectedVehicle.price} {t.currency}
              </p>
            </div>
          </div>
        )}

        {/* Modal body */}
        <div className="p-6">
          {isSuccess ? (
            <div className="text-center py-6" id="booking-success-container">
              <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mx-auto mb-5 animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-lg font-extrabold text-slate-900 mb-2">
                {t.bookingSuccessTitle}
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto mb-6">
                {t.bookingSuccessDesc}
              </p>

              <div className="space-y-3">
                <a
                  href={getWhatsAppURL()}
                  target="_blank"
                  referrerPolicy="no-referrer"
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-3.5 px-4 rounded-xl shadow-md transition-colors decoration-transparent"
                  id="success-whatsapp-dispatch-btn"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>{lang === 'en' ? "Open WhatsApp Dispatch" : "متابعة التفويج عبر وتساب"}</span>
                </a>

                <button
                  type="button"
                  onClick={resetAndClose}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 px-4 rounded-xl transition-colors"
                >
                  {t.closeWindow}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleConfirm} className="space-y-4" id="booking-form">
              {/* Name Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block font-mono uppercase">
                  {t.fullName} <span className="text-brand-primary font-bold">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={t.fullNamePlaceholder}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-9.5 pr-4 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-brand-primary"
                  />
                </div>
              </div>

              {/* Whatsapp/Phone Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-705 block font-mono uppercase">
                  {t.whatsappNum} <span className="text-brand-primary font-bold">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={t.whatsappNumPlaceholder}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-9.5 pr-4 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-brand-primary text-left"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Hotel / Pickup location */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block font-mono uppercase">
                  {t.hotel} <span className="text-brand-primary font-bold">*</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={pickupHotel}
                    onChange={(e) => setPickupHotel(e.target.value)}
                    placeholder={t.hotelPlaceholder}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-9.5 pr-4 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-brand-primary"
                  />
                </div>
              </div>

              {/* Date and Departure Time inputs side-by-side */}
              <div className="grid grid-cols-2 gap-4">
                {/* Date Picker */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block font-mono uppercase">
                    {lang === 'en' ? 'Travel Date' : 'تاريخ السفر'} <span className="text-brand-primary font-bold">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={travelDate}
                    onChange={(e) => {
                      setTravelDate(e.target.value);
                      if (e.target.value) setDateError('');
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-brand-primary"
                  />
                  {dateError && (
                    <p className="text-[10px] text-[#C0272D] font-bold mt-1">
                      ⚠️ {dateError}
                    </p>
                  )}
                </div>

                {/* Departure Time Picker */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block font-mono uppercase">
                    {lang === 'en' ? 'Departure Time' : 'وقت المغادرة'} <span className="text-brand-primary font-bold">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={departureTime}
                    onChange={(e) => setDepartureTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-brand-primary"
                  />
                </div>
              </div>

              {/* Special Requests Log */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block font-mono uppercase">
                  {t.specialRequests}
                </label>
                <textarea
                  rows={2}
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  placeholder={t.specialRequestsPlaceholder}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-brand-primary resize-none"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-primary hover:bg-brand-dark text-white font-extrabold text-xs py-3.5 px-4 rounded-xl shadow-md transition-colors duration-200 cursor-pointer flex items-center justify-center gap-2"
                id="modal-confirm-btn"
              >
                {loading && (
                  <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                )}
                <span>{loading ? t.loading : t.confirmReservationLetter}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
