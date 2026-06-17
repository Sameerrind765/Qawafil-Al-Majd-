import React, { useState } from 'react';
import { useLang } from '../context/LangContext';
import { vehiclesData, VehicleData } from '../data/vehicles';
import VehicleCard from '../components/VehicleCard';
import BookingModal from '../components/BookingModal';
import { Sparkles, Compass, ShieldCheck } from 'lucide-react';

export default function Fleet() {
  const { lang, t } = useLang();
  
  // Selected category filter
  const [activeFilter, setActiveFilter] = useState<'all' | 'economy' | 'business' | 'vip' | 'group'>('all');
  
  // Booking modal connection
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleData | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const filterOptions = [
    { value: 'all', label: t.filterAll },
    { value: 'economy', label: t.filterEconomy },
    { value: 'business', label: t.filterBusiness },
    { value: 'vip', label: t.filterVip },
    { value: 'group', label: t.filterGroup }
  ];

  const handleOpenBooking = (vehicle: VehicleData) => {
    setSelectedVehicle(vehicle);
    setModalOpen(true);
  };

  const filteredVehicles = activeFilter === 'all' 
    ? vehiclesData 
    : vehiclesData.filter(v => v.classFilter === activeFilter);

  return (
    <div className="flex-1 py-12 bg-slate-50 font-sans select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title stage */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 bg-brand-primary/10 border border-brand-primary/20 py-1.5 px-3.5 rounded-full text-brand-primary font-bold text-xs uppercase tracking-wider mb-4">
            <Compass className="w-4 h-4" />
            <span>{lang === 'en' ? 'Fully Audited Fleet Lineup' : 'أسطول التشغيل الشامل المرخص'}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight" id="fleet-page-title">
            {lang === 'en' ? 'Explore Our Logistics Caravans' : 'تصفح أسطول قوافل النقل الفاخر واللوجستي'}
          </h2>

          <p className="text-slate-500 text-xs sm:text-sm font-semibold max-w-lg mx-auto leading-relaxed mt-2">
            {lang === 'en' 
              ? 'Browse certified and maintained sedans, VIP SUVs, passenger minivans, and mass transit buses.'
              : 'طيف متكامل من المركبات الحديثة المؤهلة ببطاقات تشغيل رسمية لضمان سلامة الركاب وإسناد اللوجستيات.'
            }
          </p>
        </div>

        {/* Real-time Category Filtering Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10" id="fleet-filter-pills">
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setActiveFilter(opt.value as any)}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold border cursor-pointer transition-all duration-350 ${
                activeFilter === opt.value
                  ? 'bg-brand-primary text-white border-brand-primary shadow-md shadow-brand-primary/20'
                  : 'bg-white text-slate-750 hover:text-brand-primary border-slate-200 hover:border-rose-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Fleet Grid List */}
        {filteredVehicles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVehicles.map((vehicle) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                onBookNow={handleOpenBooking}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white border border-rose-50 rounded-2xl max-w-md mx-auto">
            <ShieldCheck className="w-12 h-12 text-slate-350 mx-auto mb-4" />
            <h4 className="text-sm font-extrabold text-slate-800">
              {lang === 'en' ? 'No Vehicles Registered' : 'لا توجد مركبات مضافة'}
            </h4>
          </div>
        )}

      </div>

      {/* Booking Controller modal */}
      <BookingModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        selectedVehicle={selectedVehicle}
      />
    </div>
  );
}
