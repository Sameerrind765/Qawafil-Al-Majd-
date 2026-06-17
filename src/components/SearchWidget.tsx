import React, { useState } from 'react';
import { useLang } from '../context/LangContext';
import { MapPin, Calendar, Users, Briefcase, Clock, Route, ShieldCheck, Search } from 'lucide-react';

interface SearchWidgetProps {
  onSearch: (formValues: any) => void;
}

export default function SearchWidget({ onSearch }: SearchWidgetProps) {
  const { lang, t } = useLang();
  const [activeTab, setActiveTab] = useState<'p2p' | 'hourly' | 'km' | 'contract'>('p2p');
  
  // States for each type of layout
  const [p2pValues, setP2pValues] = useState({
    from: '',
    to: '',
    date: '',
    passengers: '2',
    luggage: '2'
  });

  const [hourlyValues, setHourlyValues] = useState({
    baseCity: '',
    hoursNeeded: '4',
    date: '',
    passengers: '2'
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
    } else if (activeTab === 'hourly') {
      payload = { type: 'hourly', ...hourlyValues };
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
          onClick={() => setActiveTab('hourly')}
          className={`flex items-center justify-center gap-2 py-3 px-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
            activeTab === 'hourly' 
              ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/20' 
              : 'text-slate-700 hover:text-brand-primary hover:bg-white/60'
          }`}
          id="tab-hourly"
        >
          <Clock className="w-4 h-4 shrink-0" />
          <span>{t.tabHourly}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('km')}
          className={`flex items-center justify-center gap-2 py-3 px-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
            activeTab === 'km' 
              ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/20' 
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
              <label className="text-xs font-bold text-slate-705 block font-mono tracking-wider text-slate-800 uppercase">
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
              <label className="text-xs font-bold text-slate-705 block font-mono tracking-wider text-slate-800 uppercase">
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
              <label className="text-xs font-bold text-slate-750 block font-mono tracking-wider text-slate-800 uppercase">
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
              <label className="text-xs font-bold text-slate-750 block font-mono tracking-wider text-slate-800 uppercase">
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
              <label className="text-xs font-bold text-slate-750 block font-mono tracking-wider text-slate-800 uppercase">
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

        {/* BY HOUR TAB FIELD LAYOUT */}
        {activeTab === 'hourly' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-750 block font-mono tracking-wider text-slate-800 uppercase">
                {t.labelBaseCity}
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-primary" />
                <select
                  value={hourlyValues.baseCity}
                  onChange={(e) => setHourlyValues({ ...hourlyValues, baseCity: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-9.5 pr-4 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-brand-primary"
                  required
                >
                  <option value="">{t.selectCityPlaceholder}</option>
                  {cities.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-750 block font-mono tracking-wider text-slate-800 uppercase">
                {t.labelHoursNeeded}
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-primary" />
                <select
                  value={hourlyValues.hoursNeeded}
                  onChange={(e) => setHourlyValues({ ...hourlyValues, hoursNeeded: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-9.5 pr-4 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-brand-primary"
                  required
                >
                  <option value="4">4 {lang === 'en' ? 'Hours' : 'ساعات'}</option>
                  <option value="6">6 {lang === 'en' ? 'Hours' : 'ساعات'}</option>
                  <option value="8">8 {lang === 'en' ? 'Hours' : 'ساعات'}</option>
                  <option value="12">12 {lang === 'en' ? 'Hours' : 'ساعة'}</option>
                  <option value="24">24 {lang === 'en' ? 'Full Day' : 'يوم كامل'}</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-750 block font-mono tracking-wider text-slate-800 uppercase">
                {t.labelDate}
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-primary" />
                <input
                  type="datetime-local"
                  value={hourlyValues.date}
                  onChange={(e) => setHourlyValues({ ...hourlyValues, date: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-9.5 pr-4 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-brand-primary"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-750 block font-mono tracking-wider text-slate-800 uppercase">
                {t.labelPassengers}
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-primary" />
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={hourlyValues.passengers}
                  onChange={(e) => setHourlyValues({ ...hourlyValues, passengers: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-9.5 pr-4 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-brand-primary"
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
              <label className="text-xs font-bold text-slate-750 block font-mono tracking-wider text-slate-800 uppercase">
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
              <label className="text-xs font-bold text-slate-750 block font-mono tracking-wider text-slate-800 uppercase">
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
              <label className="text-xs font-bold text-slate-750 block font-mono tracking-wider text-slate-800 uppercase">
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
              <label className="text-xs font-bold text-slate-750 block font-mono tracking-wider text-slate-800 uppercase">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-750 block font-mono tracking-wider text-slate-800 uppercase">
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
              <label className="text-xs font-bold text-slate-750 block font-mono tracking-wider text-slate-800 uppercase">
                {t.labelDuration}
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-primary" />
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
              <label className="text-xs font-bold text-slate-750 block font-mono tracking-wider text-slate-800 uppercase">
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

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-750 block font-mono tracking-wider text-slate-800 uppercase">
                {t.labelGroupSize}
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-primary" />
                <input
                  type="number"
                  min="5"
                  max="5000"
                  value={contractValues.groupSize}
                  onChange={(e) => setContractValues({ ...contractValues, groupSize: e.target.value })}
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
