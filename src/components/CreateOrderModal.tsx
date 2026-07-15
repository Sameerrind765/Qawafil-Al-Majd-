import React, { useState } from 'react';
import { CargoOrder } from '../types';
import { TRANSLATIONS } from '../data';
import { X, Box, Truck, Compass, PhoneCall } from 'lucide-react';

interface CreateOrderModalProps {
  onClose: () => void;
  onSave: (order: CargoOrder) => void;
  lang: 'en' | 'ar';
}

const SAUDI_CITIES = ['Riyadh', 'Jeddah', 'Dammam', 'Mecca', 'Medina', 'Jubail', 'Yanbu'];

export default function CreateOrderModal({ onClose, onSave, lang }: CreateOrderModalProps) {
  const t = TRANSLATIONS[lang];
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [vehicleType, setVehicleType] = useState('Heavy Trailer');
  const [origin, setOrigin] = useState('Riyadh');
  const [destination, setDestination] = useState('Jeddah');
  const [cargoType, setCargoType] = useState('Potable Drinking Water');
  const [weightOrVolume, setWeightOrVolume] = useState('19,000 Liters');
  const [notes, setNotes] = useState('');

  // Auto-calculated estimated logistics price in SAR
  const calculatePrice = () => {
    let base = 1200;
    if (vehicleType === 'Water Tanker') base = 950;
    if (vehicleType === 'Passenger Bus') base = 2500;
    if (vehicleType === 'Excavator') base = 4800;

    // Route complexity penalty
    if (origin !== destination) {
      base += 1500;
    }
    return base;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !clientPhone) return;

    const newOrder: CargoOrder = {
      id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      clientName,
      clientPhone,
      vehicleType,
      origin,
      destination,
      cargoType,
      weightOrVolume,
      status: 'Pending',
      estimatedPrice: calculatePrice(),
      createdAt: new Date().toISOString(),
      notes
    };

    onSave(newOrder);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div 
        id="create-order-modal-container"
        className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-2">
            <Box className="w-5 h-5 text-brand-primary animate-pulse" />
            <h3 className="text-base font-bold text-slate-800 tracking-wide">
              {t.newCargoBooking}
            </h3>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-800 transition-colors duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[80vh] space-y-4">
          {/* Client Identity details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                {lang === 'en' ? 'Client Org / Name' : 'اسم العميل / الشركة'} *
              </label>
              <input
                type="text"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. Aramco Projects Division"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 font-semibold focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                {lang === 'en' ? 'Client Phone Number' : 'رقم هاتف العميل'} *
              </label>
              <input
                type="text"
                required
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="e.g. +966 50 000 0000"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 font-semibold focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30"
              />
            </div>
          </div>

          {/* Rigs / Vehicle specifications */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              {t.chooseType}
            </label>
            <select
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-brand-primary font-bold focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30"
            >
              <option value="Water Tanker">{lang === 'en' ? 'Water Tanker (ناقلة مياه)' : 'ناقلة مياه (Water Tanker)'}</option>
              <option value="Heavy Trailer">{lang === 'en' ? 'Heavy Trailer (شاحنة ثقيلة)' : 'شاحنة ثقيلة (Heavy Trailer)'}</option>
              <option value="Flatbed Truck">{lang === 'en' ? 'Flatbed Truck (شاحنة مسطحة)' : 'شاحنة مسطحة (Flatbed Truck)'}</option>
              <option value="Passenger Bus">{lang === 'en' ? 'Passenger Bus (حافلة ركاب)' : 'حافلة ركاب (Passenger Bus)'}</option>
              <option value="Excavator">{lang === 'en' ? 'Excavator (حفار ثقيل)' : 'حفار ثقيل (Excavator)'}</option>
            </select>
          </div>

          {/* Logistics Route (Origin / Destination) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                {t.origin}
              </label>
              <select
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 font-semibold focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30"
              >
                {SAUDI_CITIES.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                {t.destination}
              </label>
              <select
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 font-semibold focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30"
              >
                {SAUDI_CITIES.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Cargo payload info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                {lang === 'en' ? 'Descriptive Cargo Type' : 'نوع البضاعة / الشحنة'}
              </label>
              <input
                type="text"
                value={cargoType}
                onChange={(e) => setCargoType(e.target.value)}
                placeholder="e.g. Sweet Water / Fuel / Iron rods"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 font-semibold focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                {t.weightVol}
              </label>
              <input
                type="text"
                value={weightOrVolume}
                onChange={(e) => setWeightOrVolume(e.target.value)}
                placeholder="e.g. 19k Liters / 20 Tons"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 font-semibold focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30"
              />
            </div>
          </div>

          {/* Special Operator Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              {lang === 'en' ? 'Special Dispatch Notes' : 'تعليمات تشغيلية خاصة'}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Provide directions, gate codes, or temperature requirements..."
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 font-semibold focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/30 resize-none"
            />
          </div>

          {/* Dynamically Calibrated SAR Price Alert */}
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-center justify-between shadow-inner">
            <span className="text-xs font-bold text-emerald-800">
              {lang === 'en' ? 'Dynamic Route Price' : 'التسعير الجغرافي المقدر'}
            </span>
            <span className="text-sm font-extrabold text-emerald-700 font-mono">
              {calculatePrice().toLocaleString()} {t.priceCurrency}
            </span>
          </div>

          {/* Submit buttons */}
          <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
            <button
              id="submit-create-order-button"
              type="submit"
              className="flex-1 bg-brand-primary hover:bg-brand-dark text-white text-sm font-bold rounded-lg py-2.5 transition-colors duration-200 shadow-sm cursor-pointer"
            >
              {t.saveBtn}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 text-sm font-semibold rounded-lg py-2.5 transition-colors duration-200 cursor-pointer"
            >
              {t.cancelBtn}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
