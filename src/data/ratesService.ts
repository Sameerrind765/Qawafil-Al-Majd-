import ratesData from './rates.json';

export interface VehicleRateInfo {
  name: string;
  capacity: string;
  kmFallbackRate: number;
  baseRates: {
    cityJeddahToMakkah?: number;
    cityJeddahToMadinah?: number;
    cityMakkahToMadinah?: number;
    cityMadinahInternal?: number;
    makkahZiyarat?: number;
    madinaZiyarat?: number;
    makkahToTaifReturn?: number;
    fullGroundTransport?: number;
    fullGroundTransportWithZiyarat?: number;
    [key: string]: number | undefined;
  };
}

export interface RatesFile {
  globalMultiplier: number;
  vehicles: {
    [key: string]: VehicleRateInfo;
  };
}

export const rates: RatesFile = (ratesData as unknown) as RatesFile;

// Official fallback per-KM rate for custom trips = vehicle's flat rate ÷ 90 km (Jeddah–Makkah reference)
export const VEHICLE_KM_FALLBACK_RATES: Record<string, number> = {
  camry: 3.89,
  fordTaurus: 4.44,
  gmc_yukon_xl_ac: 5.56,
  h1_hyundai: 2.56,
  hiace: 3.67,
  coaster: 5.89
};

export type CityKey = 'jeddah' | 'makkah' | 'madina' | 'taif' | 'special';

export interface LocationOption {
  id: string;
  city: CityKey;
  nameEn: string;
  nameAr: string;
}

// Geographic Pickup Locations for Point-to-Point and Custom Trips
// (Strictly excludes Full Circuit and Hourly options)
export const PICKUP_OPTIONS: LocationOption[] = [
  { id: 'jeddah_airport', city: 'jeddah', nameEn: 'Jeddah Airport (KAIA)', nameAr: 'مطار جدة الدولي (KAIA)' },
  { id: 'jeddah_hotel', city: 'jeddah', nameEn: 'Jeddah City / Hotel', nameAr: 'مدينة / فندق جدة' },
  { id: 'makkah_hotel', city: 'makkah', nameEn: 'Makkah Hotel (near Haram)', nameAr: 'فندق مكة المكرمة (قرب الحرم)' },
  { id: 'madina_hotel', city: 'madina', nameEn: 'Madina Hotel (Markaziyah)', nameAr: 'فندق المدينة المنورة (المركزية)' },
  { id: 'madina_airport', city: 'madina', nameEn: 'Madina Airport (PMIA)', nameAr: 'مطار المدينة المنورة (PMIA)' }
];

// Preset Destinations for City-to-City and Tours
export const DESTINATION_OPTIONS: LocationOption[] = [
  { id: 'makkah_hotel', city: 'makkah', nameEn: 'Makkah Hotel (near Haram)', nameAr: 'فندق مكة المكرمة (قرب الحرم)' },
  { id: 'madina_hotel', city: 'madina', nameEn: 'Madina Hotel (Markaziyah)', nameAr: 'فندق المدينة المنورة (المركزية)' },
  { id: 'madina_airport', city: 'madina', nameEn: 'Madina Airport (PMIA)', nameAr: 'مطار المدينة المنورة (PMIA)' },
  { id: 'jeddah_airport', city: 'jeddah', nameEn: 'Jeddah Airport (KAIA)', nameAr: 'مطار جدة الدولي (KAIA)' },
  { id: 'jeddah_hotel', city: 'jeddah', nameEn: 'Jeddah City / Hotel', nameAr: 'مدينة / فندق جدة' },
  { id: 'makkah_ziyarat', city: 'special', nameEn: 'Makkah Ziyarat Tour (Holy Sites)', nameAr: 'جولة مزارات مكة المكرمة' },
  { id: 'madina_ziyarat', city: 'special', nameEn: 'Madina Ziyarat Tour (Noble Sites)', nameAr: 'جولة مزارات المدينة المنورة' },
  { id: 'taif_return', city: 'taif', nameEn: 'Taif Mountain Tour (Return)', nameAr: 'جولة الطائف (ذهاب وعودة)' },
  { id: 'custom', city: 'special', nameEn: 'Custom Destination...', nameAr: 'وجهة وصول مخصصة...' }
];

export interface FullCircuitOption {
  id: 'standard_circuit' | 'circuit_with_ziyarat';
  rateKey: 'fullGroundTransport' | 'fullGroundTransportWithZiyarat';
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  stopsEn: string[];
  stopsAr: string[];
}

export const FULL_CIRCUIT_OPTIONS: FullCircuitOption[] = [
  {
    id: 'standard_circuit',
    rateKey: 'fullGroundTransport',
    nameEn: 'Full Ground Transport Package',
    nameAr: 'باقة التفويج والتنقل الشامل',
    descriptionEn: 'Complete multi-city pilgrim ground itinerary connecting arrival to departure.',
    descriptionAr: 'خطة التفويج الكامل لنقل ضيوف الرحمن من الوصول حتى المغادرة.',
    stopsEn: ['Jeddah Airport Arrival', 'Makkah Haram Stay', 'Intercity Madinah Transfer', 'Madinah / Jeddah Airport Departure'],
    stopsAr: ['استقبال مطار جدة', 'الإقامة بفندق مكة', 'التفويج إلى المدينة المنورة', 'التوديع للمطار للمغادرة']
  },
  {
    id: 'circuit_with_ziyarat',
    rateKey: 'fullGroundTransportWithZiyarat',
    nameEn: 'Full Ground Transport + Ziyarat (All-Inclusive)',
    nameAr: 'باقة التفويج الشامل + المزارات الدينية',
    descriptionEn: 'All-inclusive multi-city transport including private guided tours to holy sites in Makkah & Madinah.',
    descriptionAr: 'خطة النقل الشاملة متضمنة جولات المزارات والمعالم التاريخية في مكة والمدينة.',
    stopsEn: ['Jeddah Arrival', 'Makkah Hotels', 'Makkah Ziyarat (Arafat, Mina)', 'Madinah Transfer', 'Madinah Ziyarat (Uhud, Quba)', 'Airport Transfer'],
    stopsAr: ['استقبال جدة', 'فنادق مكة', 'مزارات مكة (عرفات، منى، ثور)', 'الانتقال للمدينة', 'مزارات المدينة (أحد، قباء)', 'توصيل المطار']
  }
];

export interface RouteMatchResult {
  isCityToCity: boolean;
  rateKey?: string;
  routeNameEn: string;
  routeNameAr: string;
  cityPair: string;
}

/**
 * Maps a location ID to its representative city
 */
export function getLocationCity(locationId: string): CityKey {
  const found = [...PICKUP_OPTIONS, ...DESTINATION_OPTIONS].find(opt => opt.id === locationId);
  if (found) return found.city;
  if (locationId.includes('jeddah')) return 'jeddah';
  if (locationId.includes('makkah')) return 'makkah';
  if (locationId.includes('madina') || locationId.includes('madinah')) return 'madina';
  if (locationId.includes('taif')) return 'taif';
  return 'special';
}

/**
 * Resolves city-to-city pricing rule.
 * Crucial Rule: Specific pickup/drop-off point (airport, hotel, station) DOES NOT affect the price.
 * ONLY the city pair determines the price:
 * - Jeddah Airport -> Madina Hotel == Jeddah Airport -> Madina Airport == any Jeddah point -> any Madina point!
 */
export function resolveCityToCityRoute(pickupId: string, destinationId: string): RouteMatchResult | null {
  if (pickupId === 'custom' || destinationId === 'custom') {
    return null;
  }

  // Check special standalone tours first
  if (destinationId === 'makkah_ziyarat') {
    return {
      isCityToCity: false,
      rateKey: 'makkahZiyarat',
      routeNameEn: 'Makkah Ziyarat Tour (Holy Sites)',
      routeNameAr: 'جولة مزارات مكة المكرمة',
      cityPair: 'makkah_ziyarat'
    };
  }

  if (destinationId === 'madina_ziyarat') {
    return {
      isCityToCity: false,
      rateKey: 'madinaZiyarat',
      routeNameEn: 'Madina Ziyarat Tour (Noble Sites)',
      routeNameAr: 'جولة مزارات المدينة المنورة',
      cityPair: 'madina_ziyarat'
    };
  }

  if (destinationId === 'taif_return' || pickupId === 'taif_return') {
    return {
      isCityToCity: false,
      rateKey: 'makkahToTaifReturn',
      routeNameEn: 'Makkah ➔ Taif Mountain Tour (Return)',
      routeNameAr: 'مكة ➔ الطائف (ذهاب وعودة)',
      cityPair: 'makkah_taif'
    };
  }

  const pickupCity = getLocationCity(pickupId);
  const destCity = getLocationCity(destinationId);

  // 1. City Pair: Jeddah ⇄ Makkah (e.g., Jeddah Airport ➔ Makkah Hotel, Makkah Hotel ➔ Jeddah Airport, Jeddah Hotel ➔ Makkah Hotel)
  if ((pickupCity === 'jeddah' && destCity === 'makkah') || (pickupCity === 'makkah' && destCity === 'jeddah')) {
    const isJeddahToMakkah = pickupCity === 'jeddah';
    return {
      isCityToCity: true,
      rateKey: 'cityJeddahToMakkah',
      routeNameEn: isJeddahToMakkah ? 'Jeddah ➔ Makkah' : 'Makkah ➔ Jeddah',
      routeNameAr: isJeddahToMakkah ? 'جدة ➔ مكة المكرمة' : 'مكة المكرمة ➔ جدة',
      cityPair: 'jeddah_makkah'
    };
  }

  // 2. City Pair: Jeddah ⇄ Madinah (e.g., Jeddah Airport ➔ Madina Hotel, Jeddah Airport ➔ Madina Airport, Madina Hotel ➔ Jeddah Airport, etc.)
  if ((pickupCity === 'jeddah' && destCity === 'madina') || (pickupCity === 'madina' && destCity === 'jeddah')) {
    const isJeddahToMadina = pickupCity === 'jeddah';
    return {
      isCityToCity: true,
      rateKey: 'cityJeddahToMadinah',
      routeNameEn: isJeddahToMadina ? 'Jeddah ➔ Madinah' : 'Madinah ➔ Jeddah',
      routeNameAr: isJeddahToMadina ? 'جدة ➔ المدينة المنورة' : 'المدينة المنورة ➔ جدة',
      cityPair: 'jeddah_madina'
    };
  }

  // 3. City Pair: Makkah ⇄ Madinah (e.g., Makkah Hotel ➔ Madina Hotel, Makkah Hotel ➔ Madina Airport, Madina Hotel ➔ Makkah Hotel)
  if ((pickupCity === 'makkah' && destCity === 'madina') || (pickupCity === 'madina' && destCity === 'makkah')) {
    const isMakkahToMadina = pickupCity === 'makkah';
    return {
      isCityToCity: true,
      rateKey: 'cityMakkahToMadinah',
      routeNameEn: isMakkahToMadina ? 'Makkah ➔ Madinah' : 'Madinah ➔ Makkah',
      routeNameAr: isMakkahToMadina ? 'مكة المكرمة ➔ المدينة المنورة' : 'المدينة المنورة ➔ مكة المكرمة',
      cityPair: 'makkah_madina'
    };
  }

  // 4. City Pair: Madinah ⇄ Madinah (Internal transfers like Madina Airport ➔ Madina Hotel or vice-versa)
  if (pickupCity === 'madina' && destCity === 'madina') {
    return {
      isCityToCity: true,
      rateKey: 'cityMadinahInternal',
      routeNameEn: 'Madinah Internal Transfer',
      routeNameAr: 'توصيل داخلي بالمدينة المنورة',
      cityPair: 'madina_internal'
    };
  }

  // 5. Internal Jeddah or Makkah Transfer
  if (pickupCity === 'jeddah' && destCity === 'jeddah') {
    return {
      isCityToCity: true,
      rateKey: 'cityJeddahToMakkah', // Falls back to local city flat transfer
      routeNameEn: 'Jeddah Local Transfer',
      routeNameAr: 'توصيل محلي بجدة',
      cityPair: 'jeddah_internal'
    };
  }

  if (pickupCity === 'makkah' && destCity === 'makkah') {
    return {
      isCityToCity: true,
      rateKey: 'makkahZiyarat', // Local Makkah transfer
      routeNameEn: 'Makkah Local Transfer',
      routeNameAr: 'توصيل محلي بمكة المكرمة',
      cityPair: 'makkah_internal'
    };
  }

  return null;
}

/**
 * Computes exact city-to-city or circuit package price for a vehicle
 */
export function getCityRoutePrice(vehicleRateKey: string | undefined, rateKey: string): number {
  if (!vehicleRateKey) return 0;
  const vehicle = rates.vehicles[vehicleRateKey];
  if (!vehicle || !vehicle.baseRates) return 0;

  const basePrice = vehicle.baseRates[rateKey];
  if (typeof basePrice === 'number') {
    return Math.round(basePrice * (rates.globalMultiplier || 1.0));
  }

  // Fallback lookups if specific key was aliased
  if (rateKey === 'cityJeddahToMakkah') {
    const alt = vehicle.baseRates.jeddahAirportToMakkahHotel || 350;
    return Math.round(alt * rates.globalMultiplier);
  }
  if (rateKey === 'cityJeddahToMadinah') {
    const alt = vehicle.baseRates.jeddahAirportToMadinaHotel || 500;
    return Math.round(alt * rates.globalMultiplier);
  }
  if (rateKey === 'cityMakkahToMadinah') {
    const alt = vehicle.baseRates.makkahHotelToMadinaHotel || 500;
    return Math.round(alt * rates.globalMultiplier);
  }
  if (rateKey === 'cityMadinahInternal') {
    const alt = vehicle.baseRates.madinaAirportToMadinaHotel || 250;
    return Math.round(alt * rates.globalMultiplier);
  }

  return 0;
}

/**
 * Calculates custom destination trip price using the vehicle's official fallback per-KM rate:
 * Camry: 3.89 SAR/km
 * Ford Taurus: 4.44 SAR/km
 * GMC Yukon XL: 5.56 SAR/km
 * H1 Hyundai: 2.56 SAR/km
 * Toyota Hiace: 3.67 SAR/km
 * Toyota Coaster: 5.89 SAR/km
 */
export function getVehicleKmFallbackRate(vehicleRateKey?: string): number {
  if (!vehicleRateKey) return 3.89;
  return VEHICLE_KM_FALLBACK_RATES[vehicleRateKey] || rates.vehicles[vehicleRateKey]?.kmFallbackRate || 3.89;
}

export function getVehicleKmPrice(vehicleRateKey: string | undefined, distanceKm: number): {
  perKmRate: number;
  totalPrice: number;
} {
  const perKmRate = getVehicleKmFallbackRate(vehicleRateKey);
  const validDist = Math.max(5, distanceKm || 50);
  const totalPrice = Math.round(validDist * perKmRate * (rates.globalMultiplier || 1.0));
  return { perKmRate, totalPrice };
}
