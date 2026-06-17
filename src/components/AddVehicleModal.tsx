import React, { useState } from 'react';
import { Vehicle } from '../types';
import { TRANSLATIONS } from '../data';
import { X, Truck, Landmark, ShieldCheck } from 'lucide-react';

interface AddVehicleModalProps {
  onClose: () => void;
  onSave: (vehicle: Vehicle) => void;
  lang: 'en' | 'ar';
}

const CITIES_COORDS = [
  { city: 'Riyadh', lat: 24.7136, lng: 46.6753 },
  { city: 'Jeddah', lat: 21.5433, lng: 39.1728 },
  { city: 'Dammam', lat: 26.4207, lng: 50.0888 },
  { city: 'Mecca', lat: 21.3891, lng: 39.8579 },
  { city: 'Medina', lat: 24.4672, lng: 39.6111 },
  { city: 'Jubail', lat: 27.0112, lng: 49.6583 },
  { city: 'Yanbu', lat: 24.0891, lng: 38.0637 }
];

export default function AddVehicleModal({ onClose, onSave, lang }: AddVehicleModalProps) {
  const t = TRANSLATIONS[lang];
  const [plateNumber, setPlateNumber] = useState('');
  const [vehicleType, setVehicleType] = useState<'Water Tanker' | 'Heavy Trailer' | 'Flatbed Truck' | 'Passenger Bus' | 'Excavator'>('Water Tanker');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [capacity, setCapacity] = useState('');
  const [selectedCity, setSelectedCity] = useState('Riyadh');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plateNumber || !driverName || !driverPhone) return;

    const matchedCoord = CITIES_COORDS.find(c => c.city === selectedCity) || CITIES_COORDS[0];

    const newVehicle: Vehicle = {
      id: `QMF-${Math.floor(107 + Math.random() * 890)}`,
      plateNumber,
      type: vehicleType,
      driverName,
      driverPhone,
      status: 'Available',
      location: {
        lat: matchedCoord.lat,
        lng: matchedCoord.lng,
        city: selectedCity
      },
      capacity: capacity || (vehicleType === 'Water Tanker' ? '19,000 Liters' : '25 Tons'),
      fuelLevel: 100,
      lastMaintenance: new Date().toISOString().split('T')[0]
    };

    onSave(newVehicle);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div 
        id="add-vehicle-modal-container"
        className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-700 animate-pulse" />
            <h3 className="text-base font-bold text-slate-800 tracking-wide">
              {t.addVehicle}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                {t.arabicPlate} *
              </label>
              <input
                type="text"
                required
                value={plateNumber}
                onChange={(e) => setPlateNumber(e.target.value)}
                placeholder="e.g. د ر س ٥ ٦ ٧ ٨"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-blue-700 font-bold focus:outline-none focus:border-blue-500 uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                {t.chooseType}
              </label>
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value as any)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500 font-semibold"
              >
                <option value="Water Tanker">Water Tanker</option>
                <option value="Heavy Trailer">Heavy Trailer</option>
                <option value="Flatbed Truck">Flatbed Truck</option>
                <option value="Passenger Bus">Passenger Bus</option>
                <option value="Excavator">Excavator</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                {lang === 'en' ? 'Driver Full Name' : 'اسم السائق بالكامل'} *
              </label>
              <input
                type="text"
                required
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                placeholder={t.driverNamePlaceholder}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 font-semibold focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                {lang === 'en' ? 'Driver Phone' : 'جوال السائق'} *
              </label>
              <input
                type="text"
                required
                value={driverPhone}
                onChange={(e) => setDriverPhone(e.target.value)}
                placeholder={t.driverPhonePlaceholder}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 font-semibold focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                {t.capacity}
              </label>
              <input
                type="text"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                placeholder={t.capacityPlaceholder}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 font-semibold focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                {lang === 'en' ? 'Base Station City' : 'المدينة التابعة لها'}
              </label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 font-semibold focus:outline-none focus:border-blue-500"
              >
                {CITIES_COORDS.map((c) => (
                  <option key={c.city} value={c.city}>{c.city}</option>
                ))}
              </select>
            </div>
          </div>

          {/* SLA and regulatory compliance label */}
          <div className="flex gap-2 items-start bg-emerald-50 border border-emerald-200 rounded-xl p-3 shadow-inner">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-[11px] text-emerald-800">
              <span className="font-bold block">{lang === 'en' ? 'Transport Authority compliant' : 'التطابق مع هيئة النقل العام'}</span>
              {lang === 'en'
                ? 'This asset undergoes standard safety integration with Saudi transport portals dynamically.'
                : 'يتم تفعيل هذا الأصل وربطه مع بوابات هيئة النقل تلقائياً بشكل رسمي.'}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
            <button
              id="submit-register-vehicle-button"
              type="submit"
              className="flex-1 bg-blue-700 hover:bg-blue-800 text-white text-sm font-bold rounded-lg py-2.5 transition-colors duration-200 shadow-sm cursor-pointer"
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
