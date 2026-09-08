import React, { useState, useEffect } from 'react';
import { useLang } from '../context/LanguageContext';
import { 
  rates, 
  VehicleRateInfo, 
  getCustomRatesOverride, 
  saveCustomRatesOverride, 
  resetCustomRatesOverride,
  getVehicleHajjTerminalRate
} from '../data/ratesService';
import { vehiclesData } from '../data/vehicles';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  Plane, 
  Save, 
  RotateCcw, 
  Copy, 
  Check, 
  Sparkles, 
  AlertCircle, 
  Sliders, 
  DollarSign, 
  Car,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

interface EditableVehicleConfig {
  key: string;
  name: string;
  capacity: string;
  hajjTerminalRate: number;
  kmFallbackRate: number;
  cityJeddahToMakkah: number;
  cityJeddahToMadinah: number;
  cityMakkahToMadinah: number;
  cityMadinahInternal: number;
  makkahZiyarat: number;
  madinaZiyarat: number;
}

export default function AdminRatesManager() {
  const { lang } = useLang();

  // Map vehicles to state
  const loadInitialConfigs = (): Record<string, EditableVehicleConfig> => {
    const custom = getCustomRatesOverride() || {};
    const result: Record<string, EditableVehicleConfig> = {};

    Object.keys(rates.vehicles).forEach((key) => {
      const v = rates.vehicles[key];
      const cust = custom[key] || {};
      const base = v.baseRates || {};
      const custBase = (cust as any).baseRates || {};

      const hajjRate = cust.hajjTerminalRate !== undefined 
        ? Number(cust.hajjTerminalRate) 
        : (v.hajjTerminalRate !== undefined ? Number(v.hajjTerminalRate) : (base.hajjTerminalRate || 30));

      result[key] = {
        key,
        name: v.name,
        capacity: v.capacity,
        hajjTerminalRate: hajjRate,
        kmFallbackRate: cust.kmFallbackRate !== undefined ? Number(cust.kmFallbackRate) : v.kmFallbackRate,
        cityJeddahToMakkah: custBase.cityJeddahToMakkah !== undefined ? Number(custBase.cityJeddahToMakkah) : (base.cityJeddahToMakkah || 300),
        cityJeddahToMadinah: custBase.cityJeddahToMadinah !== undefined ? Number(custBase.cityJeddahToMadinah) : (base.cityJeddahToMadinah || 500),
        cityMakkahToMadinah: custBase.cityMakkahToMadinah !== undefined ? Number(custBase.cityMakkahToMadinah) : (base.cityMakkahToMadinah || 500),
        cityMadinahInternal: custBase.cityMadinahInternal !== undefined ? Number(custBase.cityMadinahInternal) : (base.cityMadinahInternal || 250),
        makkahZiyarat: custBase.makkahZiyarat !== undefined ? Number(custBase.makkahZiyarat) : (base.makkahZiyarat || 250),
        madinaZiyarat: custBase.madinaZiyarat !== undefined ? Number(custBase.madinaZiyarat) : (base.madinaZiyarat || 250),
      };
    });

    return result;
  };

  const [configs, setConfigs] = useState<Record<string, EditableVehicleConfig>>(loadInitialConfigs);
  const [selectedVehicleKey, setSelectedVehicleKey] = useState<string>('camry');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [cloudSaving, setCloudSaving] = useState(false);

  // Sync with Firestore settings if available
  useEffect(() => {
    const fetchCloudRates = async () => {
      try {
        const docRef = doc(db, 'settings', 'vehicle_rates');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data.ratesOverride) {
            saveCustomRatesOverride(data.ratesOverride);
            setConfigs(loadInitialConfigs());
          }
        }
      } catch (e) {
        // quiet ignore
      }
    };
    fetchCloudRates();
  }, []);

  const handleFieldChange = (vehicleKey: string, field: keyof EditableVehicleConfig, value: number) => {
    setConfigs(prev => ({
      ...prev,
      [vehicleKey]: {
        ...prev[vehicleKey],
        [field]: value
      }
    }));
  };

  const handleSaveAll = async () => {
    setCloudSaving(true);
    const overrides: Record<string, Partial<VehicleRateInfo>> = {};

    Object.keys(configs).forEach(key => {
      const cfg = configs[key];
      overrides[key] = {
        hajjTerminalRate: Number(cfg.hajjTerminalRate),
        kmFallbackRate: Number(cfg.kmFallbackRate),
        baseRates: {
          hajjTerminalRate: Number(cfg.hajjTerminalRate),
          cityJeddahToMakkah: Number(cfg.cityJeddahToMakkah),
          cityJeddahToMadinah: Number(cfg.cityJeddahToMadinah),
          cityMakkahToMadinah: Number(cfg.cityMakkahToMadinah),
          cityMadinahInternal: Number(cfg.cityMadinahInternal),
          makkahZiyarat: Number(cfg.makkahZiyarat),
          madinaZiyarat: Number(cfg.madinaZiyarat),
        }
      };
    });

    // Save locally
    saveCustomRatesOverride(overrides);

    // Save to Firestore
    try {
      const docRef = doc(db, 'settings', 'vehicle_rates');
      await setDoc(docRef, {
        ratesOverride: overrides,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (e) {
      console.warn("Could not save to firestore settings (local storage active):", e);
    }

    setCloudSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3500);
  };

  const handleResetDefaults = () => {
    if (window.confirm(lang === 'en' ? 'Reset all vehicle rates and Hajj terminal additions to factory code defaults?' : 'هل تود استعادة جميع الأسعار وإضافات صالة الحجاج للافتراضي الأصلي؟')) {
      resetCustomRatesOverride();
      setConfigs(loadInitialConfigs());
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    }
  };

  const generateFullRatesJson = () => {
    const fullJson = {
      globalMultiplier: 1.0,
      vehicles: {} as any
    };

    Object.keys(rates.vehicles).forEach(key => {
      const v = rates.vehicles[key];
      const cfg = configs[key];
      fullJson.vehicles[key] = {
        name: v.name,
        capacity: v.capacity,
        kmFallbackRate: cfg ? cfg.kmFallbackRate : v.kmFallbackRate,
        hajjTerminalRate: cfg ? cfg.hajjTerminalRate : (v.hajjTerminalRate || 30),
        baseRates: {
          hajjTerminalRate: cfg ? cfg.hajjTerminalRate : (v.hajjTerminalRate || 30),
          cityJeddahToMakkah: cfg ? cfg.cityJeddahToMakkah : v.baseRates.cityJeddahToMakkah,
          cityJeddahToMadinah: cfg ? cfg.cityJeddahToMadinah : v.baseRates.cityJeddahToMadinah,
          cityMakkahToMadinah: cfg ? cfg.cityMakkahToMadinah : v.baseRates.cityMakkahToMadinah,
          cityMadinahInternal: cfg ? cfg.cityMadinahInternal : v.baseRates.cityMadinahInternal,
          makkahZiyarat: cfg ? cfg.makkahZiyarat : v.baseRates.makkahZiyarat,
          madinaZiyarat: cfg ? cfg.madinaZiyarat : v.baseRates.madinaZiyarat,
          makkahToTaifReturn: v.baseRates.makkahToTaifReturn,
          fullGroundTransport: v.baseRates.fullGroundTransport,
          fullGroundTransportWithZiyarat: v.baseRates.fullGroundTransportWithZiyarat,
          jeddahAirportToMakkahHotel: cfg ? cfg.cityJeddahToMakkah : v.baseRates.jeddahAirportToMakkahHotel,
          makkahHotelToMadinaHotel: cfg ? cfg.cityMakkahToMadinah : v.baseRates.makkahHotelToMadinaHotel,
          jeddahAirportToMadinaHotel: cfg ? cfg.cityJeddahToMadinah : v.baseRates.jeddahAirportToMadinaHotel,
          madinaAirportToMadinaHotel: cfg ? cfg.cityMadinahInternal : v.baseRates.madinaAirportToMadinaHotel,
          madinaHotelToMadinaAirport: cfg ? cfg.cityMadinahInternal : v.baseRates.madinaHotelToMadinaAirport,
          madinaHotelToMakkahHotel: cfg ? cfg.cityMakkahToMadinah : v.baseRates.madinaHotelToMakkahHotel,
          madinaHotelToJeddahAirport: cfg ? cfg.cityJeddahToMadinah : v.baseRates.madinaHotelToJeddahAirport,
          makkahHotelToJeddahAirport: cfg ? cfg.cityJeddahToMakkah : v.baseRates.makkahHotelToJeddahAirport
        }
      };
    });

    return JSON.stringify(fullJson, null, 2);
  };

  const handleCopyJson = () => {
    const jsonStr = generateFullRatesJson();
    navigator.clipboard.writeText(jsonStr);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2500);
  };

  const activeVehicle = configs[selectedVehicleKey] || configs['camry'];

  return (
    <div className="space-y-6 animate-fadeIn" id="admin-rates-manager">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-900 border border-amber-200 text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full mb-2">
            <Plane className="w-3.5 h-3.5 text-amber-600" />
            <span>{lang === 'en' ? 'Hajj Terminal & Vehicle Tariff Control' : 'لوحة ضبط أسعار وإضافات صالة الحجاج'}</span>
          </div>
          <h3 className="text-xl font-black text-slate-900">
            {lang === 'en' ? 'Vehicle-Specific Hajj Terminal Rates' : 'تحديد إضافة صالة الحجاج والأسعار لكل مركبة'}
          </h3>
          <p className="text-xs text-slate-500 font-semibold mt-1 max-w-2xl">
            {lang === 'en'
              ? 'Configure custom Hajj Terminal surcharges for each vehicle differently. Changes apply instantly across customer booking forms, route calculators, and rate sheets.'
              : 'يمكنك هنا تحديد تسعيرة إضافية مختلفة لصالة الحجاج لكل سيارة على حدة. تنعكس التعديلات فوراً على استمارات الحجز وحاسبة المسارات وجداول الأسعار.'}
          </p>
        </div>

        {/* Global Actions */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCopyJson}
            className="bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-black px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            title="Copy rates.json code"
          >
            {copiedJson ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copiedJson ? (lang === 'en' ? 'Copied JSON!' : 'تم نسخ JSON!') : (lang === 'en' ? 'Copy rates.json' : 'نسخ ملف rates.json')}</span>
          </button>

          <button
            type="button"
            onClick={handleResetDefaults}
            className="bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-black px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{lang === 'en' ? 'Reset Defaults' : 'استعادة الافتراضي'}</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={cloudSaving}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {cloudSaving ? (
              <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{lang === 'en' ? 'Save All Rates' : 'حفظ التغييرات وتطبيقها'}</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>
            {lang === 'en'
              ? 'Success! All vehicle rates and Hajj terminal additions have been saved and applied across the platform.'
              : 'تم الحفظ بنجاح! تم تطبيق إضافات صالة الحجاج وأسعار المركبات فوراً في جميع أنحاء المنصة.'}
          </span>
        </div>
      )}

      {/* Grid of Vehicles Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {Object.keys(configs).map((key) => {
          const cfg = configs[key];
          const isSelected = selectedVehicleKey === key;
          const vData = vehiclesData.find(v => v.rateKey === key);

          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedVehicleKey(key)}
              className={`p-3.5 rounded-2xl text-left rtl:text-right transition-all cursor-pointer border flex flex-col justify-between ${
                isSelected
                  ? 'bg-amber-500/10 border-amber-500 shadow-xs ring-2 ring-amber-500/20'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="text-xl mb-1">
                  {vData?.emoji === 'SUV' ? '🚙' : vData?.emoji || '🚗'}
                </div>
                <h4 className="text-xs font-black text-slate-900 truncate">
                  {cfg.name}
                </h4>
                <p className="text-[10px] text-slate-400 font-bold truncate">
                  {cfg.capacity}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100">
                <span className="text-[9px] uppercase font-black text-slate-400 block">
                  {lang === 'en' ? 'Hajj Addition' : 'صالة الحجاج'}
                </span>
                <span className="text-xs font-mono font-black text-amber-700">
                  +{cfg.hajjTerminalRate} SAR
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Vehicle Editor Panel */}
      {activeVehicle && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 flex items-center justify-center font-black text-base">
                <Sliders className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h4 className="text-base font-black text-slate-900">
                  {lang === 'en' ? `Configure Pricing: ${activeVehicle.name}` : `تعديل أسعار: ${activeVehicle.name}`}
                </h4>
                <span className="text-xs text-slate-400 font-bold font-mono">
                  Key: {activeVehicle.key} • {activeVehicle.capacity}
                </span>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-300/80 px-3 py-1.5 rounded-xl">
              <Plane className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-black text-amber-950">
                {lang === 'en' ? 'Current Hajj Terminal Rate:' : 'رسم صالة الحجاج الحالي:'}
              </span>
              <span className="text-sm font-mono font-black text-amber-700">
                +{activeVehicle.hajjTerminalRate} SAR
              </span>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* PRIMARY FOCUS: HAJJ TERMINAL SURCHARGE */}
            <div className="lg:col-span-2 bg-gradient-to-br from-amber-50/80 to-amber-100/40 border-2 border-amber-300 rounded-2xl p-4.5 space-y-2">
              <label className="flex items-center justify-between text-xs font-black text-amber-950 uppercase tracking-wide">
                <span className="flex items-center gap-1.5">
                  <Plane className="w-4 h-4 text-amber-600" />
                  <span>{lang === 'en' ? 'Hajj Terminal Rate Addition (SAR)' : 'إضافة صالة الحجاج للمركبة (ريال)'}</span>
                </span>
                <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded font-black">
                  {lang === 'en' ? 'Dedicated' : 'مخصص للمركبة'}
                </span>
              </label>
              <p className="text-[11px] text-amber-900/80 font-medium">
                {lang === 'en'
                  ? `Flat amount added to the fare when this vehicle picks up or drops off at KAIA Hajj Terminal.`
                  : `المبلغ المالي المضاف للأجرة عند اختيار صالة الحجاج بمطار الملك عبدالعزيز لهذه المركبة.`}
              </p>
              <div className="relative pt-1">
                <input
                  type="number"
                  min="0"
                  step="5"
                  value={activeVehicle.hajjTerminalRate}
                  onChange={(e) => handleFieldChange(activeVehicle.key, 'hajjTerminalRate', Number(e.target.value))}
                  className="w-full bg-white border-2 border-amber-400 focus:border-amber-600 rounded-xl py-2.5 px-3 text-base font-black text-amber-950 font-mono outline-none shadow-xs"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-amber-700 font-mono pt-1">
                  SAR
                </span>
              </div>
            </div>

            {/* Per KM Fallback Rate */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4.5 space-y-2">
              <label className="text-xs font-black text-slate-800 uppercase tracking-wide block">
                {lang === 'en' ? 'Fallback Rate / KM' : 'سعر الكيلومتر التقديري'}
              </label>
              <p className="text-[10px] text-slate-400 font-medium">
                {lang === 'en' ? 'Used for custom distances.' : 'يُستخدم للمسافات الحرة.'}
              </p>
              <div className="relative pt-1">
                <input
                  type="number"
                  step="0.01"
                  value={activeVehicle.kmFallbackRate}
                  onChange={(e) => handleFieldChange(activeVehicle.key, 'kmFallbackRate', Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 focus:border-slate-800 rounded-xl py-2.5 px-3 text-sm font-black text-slate-900 font-mono outline-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 font-mono pt-1">
                  SAR/km
                </span>
              </div>
            </div>

            {/* Jeddah to Makkah Base Rate */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4.5 space-y-2">
              <label className="text-xs font-black text-slate-800 uppercase tracking-wide block">
                {lang === 'en' ? 'Jeddah ➔ Makkah (Base)' : 'جدة ➔ مكة (أساسي)'}
              </label>
              <p className="text-[10px] text-slate-400 font-medium">
                {lang === 'en' ? 'Standard terminal flat rate.' : 'سعر الصالات القياسية.'}
              </p>
              <div className="relative pt-1">
                <input
                  type="number"
                  step="10"
                  value={activeVehicle.cityJeddahToMakkah}
                  onChange={(e) => handleFieldChange(activeVehicle.key, 'cityJeddahToMakkah', Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 focus:border-slate-800 rounded-xl py-2.5 px-3 text-sm font-black text-slate-900 font-mono outline-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 font-mono pt-1">
                  SAR
                </span>
              </div>
            </div>

            {/* Jeddah to Madinah */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4.5 space-y-2">
              <label className="text-xs font-black text-slate-800 uppercase tracking-wide block">
                {lang === 'en' ? 'Jeddah ➔ Madinah' : 'جدة ➔ المدينة'}
              </label>
              <div className="relative pt-1">
                <input
                  type="number"
                  step="10"
                  value={activeVehicle.cityJeddahToMadinah}
                  onChange={(e) => handleFieldChange(activeVehicle.key, 'cityJeddahToMadinah', Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 focus:border-slate-800 rounded-xl py-2.5 px-3 text-sm font-black text-slate-900 font-mono outline-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 font-mono pt-1">
                  SAR
                </span>
              </div>
            </div>

            {/* Makkah to Madinah */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4.5 space-y-2">
              <label className="text-xs font-black text-slate-800 uppercase tracking-wide block">
                {lang === 'en' ? 'Makkah ➔ Madinah' : 'مكة ➔ المدينة'}
              </label>
              <div className="relative pt-1">
                <input
                  type="number"
                  step="10"
                  value={activeVehicle.cityMakkahToMadinah}
                  onChange={(e) => handleFieldChange(activeVehicle.key, 'cityMakkahToMadinah', Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 focus:border-slate-800 rounded-xl py-2.5 px-3 text-sm font-black text-slate-900 font-mono outline-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 font-mono pt-1">
                  SAR
                </span>
              </div>
            </div>

            {/* Madinah Internal */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4.5 space-y-2">
              <label className="text-xs font-black text-slate-800 uppercase tracking-wide block">
                {lang === 'en' ? 'Madinah Internal Transfer' : 'توصيل داخلي بالمدينة'}
              </label>
              <div className="relative pt-1">
                <input
                  type="number"
                  step="10"
                  value={activeVehicle.cityMadinahInternal}
                  onChange={(e) => handleFieldChange(activeVehicle.key, 'cityMadinahInternal', Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 focus:border-slate-800 rounded-xl py-2.5 px-3 text-sm font-black text-slate-900 font-mono outline-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 font-mono pt-1">
                  SAR
                </span>
              </div>
            </div>

            {/* Makkah Ziyarat */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4.5 space-y-2">
              <label className="text-xs font-black text-slate-800 uppercase tracking-wide block">
                {lang === 'en' ? 'Makkah Ziyarat Tour' : 'جولة مزارات مكة المكرمة'}
              </label>
              <div className="relative pt-1">
                <input
                  type="number"
                  step="10"
                  value={activeVehicle.makkahZiyarat}
                  onChange={(e) => handleFieldChange(activeVehicle.key, 'makkahZiyarat', Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 focus:border-slate-800 rounded-xl py-2.5 px-3 text-sm font-black text-slate-900 font-mono outline-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 font-mono pt-1">
                  SAR
                </span>
              </div>
            </div>
          </div>

          {/* Real-Time Pricing Simulation Preview */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <h5 className="text-xs font-black uppercase text-slate-500 tracking-wider mb-3">
              {lang === 'en' ? 'Live Fare Simulation for this Model:' : 'محاكاة الأسعار الحية لهذا الطراز:'}
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 block font-bold">
                    {lang === 'en' ? 'Terminal 1 ➔ Makkah Hotel' : 'الصالة 1 ➔ فندق مكة'}
                  </span>
                  <span className="text-xs font-extrabold text-slate-700">
                    {lang === 'en' ? 'Standard Arrival (0 SAR surcharge)' : 'وصول قياسي (بدون رسوم)'}
                  </span>
                </div>
                <span className="text-base font-black font-mono text-slate-900">
                  {activeVehicle.cityJeddahToMakkah} SAR
                </span>
              </div>

              <div className="bg-amber-50/80 border border-amber-200 p-3 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-amber-800 block font-bold">
                    {lang === 'en' ? 'Hajj Terminal ➔ Makkah Hotel' : 'صالة الحجاج ➔ فندق مكة'}
                  </span>
                  <span className="text-xs font-extrabold text-amber-900">
                    {lang === 'en' ? `Base + ${activeVehicle.hajjTerminalRate} SAR` : `الأساسي + ${activeVehicle.hajjTerminalRate} ريال`}
                  </span>
                </div>
                <span className="text-base font-black font-mono text-amber-950">
                  {activeVehicle.cityJeddahToMakkah + activeVehicle.hajjTerminalRate} SAR
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 block font-bold">
                    {lang === 'en' ? 'Hajj Terminal ➔ Madinah Hotel' : 'صالة الحجاج ➔ فندق المدينة'}
                  </span>
                  <span className="text-xs font-extrabold text-slate-700">
                    {lang === 'en' ? `Base + ${activeVehicle.hajjTerminalRate} SAR` : `الأساسي + ${activeVehicle.hajjTerminalRate} ريال`}
                  </span>
                </div>
                <span className="text-base font-black font-mono text-slate-900">
                  {activeVehicle.cityJeddahToMadinah + activeVehicle.hajjTerminalRate} SAR
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
