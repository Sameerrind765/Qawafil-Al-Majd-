import React, { useState } from 'react';
import { useLang } from '../context/LangContext';
import { MapPin, Calendar, Users, Briefcase, Route, ShieldCheck, Search, Compass, CheckCircle2 } from 'lucide-react';
import { FULL_CIRCUIT_OPTIONS } from '../data/ratesService';

interface SearchWidgetProps {
  onSearch: (formValues: any) => void;
}

export default function SearchWidget({ onSearch }: SearchWidgetProps) {
  const { lang, t } = useLang();
  const [activeTab, setActiveTab] = useState<'p2p' | 'circuit' | 'km' | 'contract'>('p2p');
  
  // States for each type of layout
  const [p2pValues, setP2pValues] = useState({
    from: '',
    to: '',
    date: '',
    passengers: '2',
    luggage: '2'
  });

  const [circuitValues, setCircuitValues] = useState({
    circuitType: 'standard_circuit',
    arrivalDate: '',
    passengers: '4',
    luggage: '4'
  });

  const [kmValues, setKmValues] = useState({
    startPoint: '',
    estDistance: '100',
    date: '',
    passengers: '2'
  });

  const [contractValues, setContractValues] = useState({
    routeType: '',
    duration: '3 Months',
    startDate: '',
    groupSize: '50'
  });

  const [hasSearched, setHasSearched] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setHasSearched(true);
    let payload = {};
    if (activeTab === 'p2p') {
      payload = { type: 'p2p', ...p2pValues };
    } else if (activeTab === 'circuit') {
      payload = { type: 'circuit', ...circuitValues };
    } else if (activeTab === 'km') {
      payload = { type: 'km', ...kmValues };
    } else {
      payload = { type: 'contract', ...contractValues };
    }
    
    // Fire callback back to Home page
    onSearch(payload);

    setTimeout(() => {
      setHasSearched(false);
    }, 2000);
  };

  const cities = [
    { value: 'makkah', label: t.makkah },
    { value: 'madinah', label: t.madinah },
    { value: 'jeddah', label: t.jeddah },
    { value: 'riyadh', label: t.riyadh },
    { value: 'yanbu', label: t.yanbu },
    { value: 'taif', label: t.taif }
  ];

  const routes = [
    { value: 'shuttle', label: t.routeDaily },
    { value: 'intercity', label: t.routeIntercity },
    { value: 'pilgrim', label: t.routeSeasonal },
    { value: 'corporate', label: t.routeCorporate }
  ];

  return (
    <div className="bg-white rounded-2xl border border-rose-100 shadow-xl overflow-hidden max-w-5xl mx-auto -mt-16 relative z-10 p-2 sm:p-5">
      {/* Search Type Tab Switcher */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 p-1.5 bg-rose-50/50 rounded-xl mb-6">
        <button
          type="button"
          onClick={() => setActiveTab('p2p')}
          className={`flex items-center justify-center gap-2 py-3 px-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
            activeTab === 'p2p' 
              ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/20' 
              : 'text-slate-700 hover:text-brand-primary hover:bg-white/60'
          }`}
          id="tab-p2p"
        >
          <MapPin className="w-4 h-4 shrink-0" />
          <span>{t.tabPointToPoint}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('circuit')}
          className={`flex items-center justify-center gap-2 py-3 px-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
            activeTab === 'circuit' 
              ? 'bg-purple-700 text-white shadow-md shadow-purple-700/20' 
              : 'text-slate-700 hover:text-purple-700 hover:bg-white/60'
          }`}
          id="tab-circuit"
        >
          <Compass className="w-4 h-4 shrink-0" />
          <span>{lang === 'en' ? 'Packages' : 'الباقات'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('km')}
          className={`flex items-center justify-center gap-2 py-3 px-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
            activeTab === 'km' 
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20' 
              : 'text-slate-700 hover:text-brand-primary hover:bg-white/60'
          }`}
          id="tab-km"
        >
          <Route className="w-4 h-4 shrink-0" />
          <span>{t.tabByKm}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('contract')}
          className={`flex items-center justify-center gap-2 py-3 px-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
            activeTab === 'contract' 
              ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/20' 
              : 'text-slate-700 hover:text-brand-primary hover:bg-white/60'
          }`}
          id="tab-contract"
        >
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>{t.tabContract}</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* POINT TO POINT TAB FIELD LAYOUT */}
        {activeTab === 'p2p' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold block font-mono tracking-wider text-slate-800 uppercase">
                {t.labelFrom}
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-primary" />
                <select
                  value={p2pValues.from}
                  onChange={(e) => setP2pValues({ ...p2pValues, from: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 hover:border-rose-200 rounded-xl py-3 pl-9.5 pr-4 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-brand-primary"
                  required
                >
                  <option value="">{t.selectCityPlaceholder}</option>
                  {cities.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold block font-mono tracking-wider text-slate-800 uppercase">
                {t.labelTo}
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-800" />
                <select
                  value={p2pValues.to}
                  onChange={(e) => setP2pValues({ ...p2pValues, to: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 hover:border-rose-200 rounded-xl py-3 pl-9.5 pr-4 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-brand-primary"
                  required
                >
                  <option value="">{t.selectDropoffPlaceholder}</option>
                  {cities.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold block font-mono tracking-wider text-slate-800 uppercase">
                {t.labelDate}
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-primary" />
                <input
                  type="datetime-local"
                  value={p2pValues.date}
                  onChange={(e) => setP2pValues({ ...p2pValues, date: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-9.5 pr-4 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-brand-primary"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold block font-mono tracking-wider text-slate-800 uppercase">
                {t.labelPassengers}
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-primary" />
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={p2pValues.passengers}
                  onChange={(e) => setP2pValues({ ...p2pValues, passengers: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-9.5 pr-4 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-brand-primary"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold block font-mono tracking-wider text-slate-800 uppercase">
                {t.labelLuggage}
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-primary" />
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={p2pValues.luggage}
                  onChange={(e) => setP2pValues({ ...p2pValues, luggage: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-9.5 pr-4 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-brand-primary"
                  required
                />
              </div>
            </div>
          </div>
        )}

        {/* PACKAGES TAB FIELD LAYOUT */}
        {activeTab === 'circuit' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-purple-50/40 p-3 rounded-2xl border border-purple-100">
            <div className="space-y-1.5">
              <label className="text-xs font-bold block font-mono tracking-wider text-purple-950 uppercase">
                {lang === 'en' ? 'Select Package' : 'اختر باقة الرحلة أو المزارات'}
              </label>
              <div className="relative">
                <Compass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-700" />
                <select
                  value={circuitValues.circuitType}
                  onChange={(e) => setCircuitValues({ ...circuitValues, circuitType: e.target.value })}
                  className="w-full bg-white border border-purple-200 rounded-xl py-3 pl-9.5 pr-4 text-xs font-bold text-slate-800 outline-none focus:ring-1 focus:ring-purple-700"
                  required
                >
                  <option value="standard_circuit">
                    {lang === 'en' ? 'Full Ground Circuit (Jeddah-Makkah-Madinah-Airport)' : 'التفويج القياسي الشامل (جدة-مكة-المدينة-المطار)'}
                  </option>
                  <option value="circuit_with_ziyarat">
                    {lang === 'en' ? 'All-Inclusive Circuit + Holy Sites Ziyarat' : 'التفويج الشامل + زيارات المزارات الدينية'}
                  </option>
                  <option value="makkah_ziyarat">
                    {lang === 'en' ? 'Makkah Holy Sites Ziyarat Tour (Hira, Thawr, Arafat)' : 'جولة مزارات مكة المكرمة (حراء، ثور، عرفات)'}
                  </option>
                  <option value="madina_ziyarat">
                    {lang === 'en' ? 'Madinah Noble Sites Ziyarat Tour (Quba, Uhud, Khandaq)' : 'جولة مزارات المدينة المنورة (قباء، أحد، الخندق)'}
                  </option>
                  <option value="both_ziyarat">
                    {lang === 'en' ? 'Dual Holy Cities Ziyarat Package (Makkah & Madinah)' : 'باقة المزارات المزدوجة (مكة المكرمة والمدينة)'}
                  </option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold block font-mono tracking-wider text-purple-950 uppercase">
                {lang === 'en' ? 'Arrival Date' : 'تاريخ الوصول'}
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-700" />
                <input
                  type="date"
                  value={circuitValues.arrivalDate}
                  onChange={(e) => setCircuitValues({ ...circuitValues, arrivalDate: e.target.value })}
                  className="w-full bg-white border border-purple-200 rounded-xl py-2.5 pl-9.5 pr-4 text-xs font-bold text-slate-800 outline-none focus:ring-1 focus:ring-purple-700"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold block font-mono tracking-wider text-purple-950 uppercase">
                {t.labelPassengers}
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-700" />
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={circuitValues.passengers}
                  onChange={(e) => setCircuitValues({ ...circuitValues, passengers: e.target.value })}
                  className="w-full bg-white border border-purple-200 rounded-xl py-2.5 pl-9.5 pr-4 text-xs font-bold text-slate-800 outline-none focus:ring-1 focus:ring-purple-700"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold block font-mono tracking-wider text-purple-950 uppercase">
                {t.labelLuggage}
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-700" />
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={circuitValues.luggage}
                  onChange={(e) => setCircuitValues({ ...circuitValues, luggage: e.target.value })}
                  className="w-full bg-white border border-purple-200 rounded-xl py-2.5 pl-9.5 pr-4 text-xs font-bold text-slate-800 outline-none focus:ring-1 focus:ring-purple-700"
                  required
                />
              </div>
            </div>
          </div>
        )}

        {/* BY KM TAB FIELD LAYOUT */}
        {activeTab === 'km' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold block font-mono tracking-wider text-slate-800 uppercase">
                {t.labelStartPoint}
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-primary" />
                <select
                  value={kmValues.startPoint}
                  onChange={(e) => setKmValues({ ...kmValues, startPoint: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-9.5 pr-4 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-brand-primary"
                  required
                >
                  <option value="">{t.selectCityPlaceholder}</option>
                  {cities.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold block font-mono tracking-wider text-slate-800 uppercase">
                {t.labelEstDistance}
              </label>
              <div className="relative">
                <Route className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-primary" />
                <input
                  type="number"
                  min="10"
                  max="5000"
                  value={kmValues.estDistance}
                  onChange={(e) => setKmValues({ ...kmValues, estDistance: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-9.5 pr-4 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-brand-primary"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold block font-mono tracking-wider text-slate-800 uppercase">
                {t.labelDate}
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-primary" />
                <input
                  type="datetime-local"
                  value={kmValues.date}
                  onChange={(e) => setKmValues({ ...kmValues, date: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-9.5 pr-4 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-brand-primary"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold block font-mono tracking-wider text-slate-800 uppercase">
                {t.labelPassengers}
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-primary" />
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={kmValues.passengers}
                  onChange={(e) => setKmValues({ ...kmValues, passengers: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-9.5 pr-4 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-brand-primary"
                  required
                />
              </div>
            </div>
          </div>
        )}

        {/* FULL CONTRACT TAB FIELD LAYOUT */}
        {activeTab === 'contract' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold block font-mono tracking-wider text-slate-800 uppercase">
                {t.labelRouteType}
              </label>
              <div className="relative">
                <Route className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-primary" />
                <select
                  value={contractValues.routeType}
                  onChange={(e) => setContractValues({ ...contractValues, routeType: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-9.5 pr-4 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-brand-primary"
                  required
                >
                  <option value="">{t.selectRoutePlaceholder}</option>
                  {routes.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold block font-mono tracking-wider text-slate-800 uppercase">
                {t.labelDuration}
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-primary" />
                <input
                  type="text"
                  value={contractValues.duration}
                  onChange={(e) => setContractValues({ ...contractValues, duration: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-9.5 pr-4 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-brand-primary"
                  placeholder="e.g., 6 Months, 1 Year"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold block font-mono tracking-wider text-slate-800 uppercase">
                {t.labelDate}
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-primary" />
                <input
                  type="date"
                  value={contractValues.startDate}
                  onChange={(e) => setContractValues({ ...contractValues, startDate: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-9.5 pr-4 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-brand-primary"
                  required
                />
              </div>
            </div>
          </div>
        )}

        {/* Submit Search Button */}
        <div className="flex justify-end pt-3">
          <button
            type="submit"
            className="w-full sm:w-auto bg-brand-primary hover:bg-brand-dark text-white font-extrabold text-sm px-8 py-3.5 rounded-xl cursor-pointer shadow-lg shadow-brand-primary/20 flex items-center justify-center gap-2 transition-all duration-200"
            id="search-widget-submit-btn"
          >
            {hasSearched ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>{t.loading}</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>{t.search}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
