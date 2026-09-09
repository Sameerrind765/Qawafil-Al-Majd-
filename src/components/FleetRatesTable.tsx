import React, { useState, useEffect } from 'react';
import { useLang } from '../context/LangContext';
import { vehiclesData, VehicleData } from '../data/vehicles';
import { 
  getVehicleHajjTerminalRate, 
  getCityRoutePrice, 
  getVehicleKmFallbackRate 
} from '../data/ratesService';
import { Plane, Tag, CheckCircle2, Info, ChevronRight, Sparkles } from 'lucide-react';

interface FleetRatesTableProps {
  onSelectVehicle?: (vehicle: VehicleData) => void;
  highlightHajjTerminal?: boolean;
}

export default function FleetRatesTable({ onSelectVehicle, highlightHajjTerminal = true }: FleetRatesTableProps) {
  const { lang } = useLang();
  const [activeCategory, setActiveCategory] = useState<'all' | 'sedan' | 'suv_mpv' | 'bus'>('all');
  const [, setRefreshKey] = useState(0);

  // Re-render when custom rates are updated by admin
  useEffect(() => {
    const handleRatesUpdate = () => {
      setRefreshKey(prev => prev + 1);
    };
    window.addEventListener('rates-updated', handleRatesUpdate);
    return () => window.removeEventListener('rates-updated', handleRatesUpdate);
  }, []);

  const filteredVehicles = vehiclesData.filter(v => {
    if (activeCategory === 'all') return true;
    if (activeCategory === 'sedan') return v.id === 'camry' || v.id === 'fordTaurus';
    if (activeCategory === 'suv_mpv') return v.id === 'gmc_yukon_xl_ac' || v.id === 'h1_hyundai';
    if (activeCategory === 'bus') return v.id === 'hiace' || v.id === 'coaster';
    return true;
  });

  return (
    <div id="rates-section" className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs">
      {/* Header with Title and Hajj Terminal Notice */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-rose-50 text-[#C0272D] text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full mb-2">
            <Tag className="w-3.5 h-3.5" />
            <span>{lang === 'en' ? 'Official Rates & Tariffs Section' : 'قسم الأسعار والتعريفة الرسمية'}</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {lang === 'en' ? 'Vehicle Tariff & Hajj Terminal Rate Breakdown' : 'جدول أسعار الأسطول وإضافات صالة الحجاج'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-1">
            {lang === 'en' 
              ? 'Transparent pricing per vehicle model with distinct, customized Hajj Terminal additions.' 
              : 'أسعار واضحة ومحددة لكل طراز مركبة مع تفصيل إضافة صالة الحجاج الخاصة بكل سيارة.'}
          </p>
        </div>

        {/* Highlight Banner on Hajj Terminal Policy */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50/70 border border-amber-200/80 rounded-2xl p-3.5 max-w-md shrink-0">
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Plane className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-amber-950">
                  {lang === 'en' ? 'Customized Hajj Terminal Addition' : 'إضافة صالة الحجاج الخاصة بكل مركبة'}
                </span>
                <span className="text-[9px] bg-amber-200/70 text-amber-900 font-extrabold px-1.5 py-0.5 rounded">
                  {lang === 'en' ? 'Per Vehicle' : 'محددة لكل مركبة'}
                </span>
              </div>
              <p className="text-[11px] text-amber-900/80 font-medium mt-0.5 leading-snug">
                {lang === 'en' 
                  ? 'Each vehicle has its own dedicated Hajj Terminal surcharge applied exclusively when selecting Jeddah KAIA Hajj Terminal.'
                  : 'تُضاف تسعيرة صالة الحجاج المعتمدة لكل فئة فقط عند اختيار صالة الحجاج بمطار الملك عبدالعزيز الدولي.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Pills Filter */}
      <div className="flex items-center gap-2 pt-6 pb-4 overflow-x-auto no-scrollbar">
        <span className="text-xs font-black text-slate-400 uppercase mr-1 shrink-0">
          {lang === 'en' ? 'Filter Model:' : 'تصفية الفئة:'}
        </span>
        {[
          { id: 'all', en: 'All Fleet Models (6)', ar: 'كامل الأسطول (6 مركبات)' },
          { id: 'sedan', en: 'Sedan Cars', ar: 'سيارات سيدان' },
          { id: 'suv_mpv', en: 'VIP SUV & MPV Family', ar: 'عائلية وVIP' },
          { id: 'bus', en: 'Group Minivans & Buses', ar: 'حافلات الوفود والمجموعات' },
        ].map(cat => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActiveCategory(cat.id as any)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
              activeCategory === cat.id
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
            }`}
          >
            {lang === 'en' ? cat.en : cat.ar}
          </button>
        ))}
      </div>

      {/* Responsive Rates Table */}
      <div className="overflow-x-auto border border-slate-150 rounded-2xl">
        <table className="w-full text-left rtl:text-right border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-700 font-black text-[11px] uppercase tracking-wider">
              <th className="py-3.5 px-4">{lang === 'en' ? 'Vehicle & Capacity' : 'المركبة والسعة'}</th>
              <th className="py-3.5 px-4 bg-emerald-50/60 text-emerald-950 font-black border-x border-emerald-100">{lang === 'en' ? 'Intercity (Apt ➔ Hotel)' : 'توصيل داخلي (مطار ➔ فندق)'}</th>
              <th className="py-3.5 px-4">{lang === 'en' ? 'Jeddah ➔ Makkah' : 'جدة ➔ مكة'}</th>
              <th className="py-3.5 px-4">{lang === 'en' ? 'Jeddah ➔ Madinah' : 'جدة ➔ المدينة'}</th>
              <th className="py-3.5 px-4">{lang === 'en' ? 'Makkah ➔ Madinah' : 'مكة ➔ المدينة'}</th>
              <th className="py-3.5 px-4">{lang === 'en' ? 'Fallback / KM' : 'بالكيلومتر'}</th>
              <th className="py-3.5 px-4 bg-amber-50/90 text-amber-950 font-black border-x border-amber-200/70">
                <div className="flex items-center gap-1.5">
                  <Plane className="w-3.5 h-3.5 text-amber-600" />
                  <span>{lang === 'en' ? 'Hajj Terminal Addition' : 'إضافة صالة الحجاج'}</span>
                </div>
              </th>
              {onSelectVehicle && (
                <th className="py-3.5 px-4 text-center">{lang === 'en' ? 'Action' : 'الحجز'}</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
            {filteredVehicles.map((vehicle) => {
              const hajjRate = getVehicleHajjTerminalRate(vehicle.rateKey);
              const jeddahInternal = getCityRoutePrice(vehicle.rateKey, 'cityJeddahInternal') || 100;
              const jeddahMakkah = getCityRoutePrice(vehicle.rateKey, 'cityJeddahToMakkah');
              const jeddahMadinah = getCityRoutePrice(vehicle.rateKey, 'cityJeddahToMadinah');
              const makkahMadinah = getCityRoutePrice(vehicle.rateKey, 'cityMakkahToMadinah');
              const kmFallback = getVehicleKmFallbackRate(vehicle.rateKey);

              return (
                <tr key={vehicle.id} className="hover:bg-slate-50/60 transition-colors">
                  {/* Vehicle Identity */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-lg shrink-0 border border-slate-200">
                        {vehicle.emoji === 'SUV' ? '🚙' : vehicle.emoji}
                      </div>
                      <div>
                        <div className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                          <span>{lang === 'en' ? vehicle.nameEn : vehicle.nameAr}</span>
                          {vehicle.recommended && (
                            <span className="text-[9px] bg-rose-50 text-[#C0272D] font-extrabold px-1.5 py-0.2 rounded">
                              {lang === 'en' ? 'Popular' : 'مطلوب'}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">
                          {vehicle.capacity} • {vehicle.seats} {lang === 'en' ? 'Pax' : 'ركاب'}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Intercity: Airport to Hotel */}
                  <td className="py-3 px-4 font-mono font-black text-emerald-800 bg-emerald-50/30 border-x border-emerald-100/70 whitespace-nowrap">
                    {jeddahInternal} <span className="text-[10px] text-emerald-600 font-sans">SAR</span>
                  </td>

                  {/* Route 1: Jeddah to Makkah */}
                  <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                    {jeddahMakkah} <span className="text-[10px] text-slate-400 font-sans">SAR</span>
                  </td>

                  {/* Route 2: Jeddah to Madinah */}
                  <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                    {jeddahMadinah} <span className="text-[10px] text-slate-400 font-sans">SAR</span>
                  </td>

                  {/* Route 3: Makkah to Madinah */}
                  <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                    {makkahMadinah} <span className="text-[10px] text-slate-400 font-sans">SAR</span>
                  </td>

                  {/* Per KM Fallback */}
                  <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                    {kmFallback} <span className="text-[10px] text-slate-400 font-sans">SAR/km</span>
                  </td>

                  {/* Hajj Terminal Addition (Prominently Highlighted) */}
                  <td className="py-3 px-4 bg-amber-50/50 border-x border-amber-200/50 whitespace-nowrap">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-100/90 text-amber-900 font-black font-mono border border-amber-300 shadow-2xs">
                      <span>+{hajjRate}</span>
                      <span className="text-[10px] font-sans font-extrabold text-amber-800">SAR</span>
                    </div>
                  </td>

                  {/* Booking Action */}
                  {onSelectVehicle && (
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onSelectVehicle(vehicle)}
                        className="bg-[#C0272D] hover:bg-[#a61f24] text-white text-xs font-black px-3.5 py-1.5 rounded-xl transition-all shadow-xs cursor-pointer inline-flex items-center gap-1"
                      >
                        <span>{lang === 'en' ? 'Select' : 'اختيار'}</span>
                        <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footnote on Terminal Policies */}
      <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] text-slate-400 font-semibold pt-3 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-slate-400 shrink-0" />
          <span>
            {lang === 'en' 
              ? 'Standard Terminals (Terminal 1 and North Terminal) incur NO addition (0 SAR). Hajj Terminal additions apply per vehicle as specified above.' 
              : 'الصالة رقم 1 والصالة الشمالية بدون أي رسوم إضافية (0 ريال). تُطبق إضافة صالة الحجاج حصرياً وفق ما هو موضح لكل مركبة أعلاه.'}
          </span>
        </div>
        <div className="text-slate-400 text-[10px] font-mono">
          ✓ {lang === 'en' ? 'TGA Certified Rates' : 'تعريفة معتمدة من هيئة النقل'}
        </div>
      </div>
    </div>
  );
}
