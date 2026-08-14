import ratesData from './rates.json';

export interface VehicleRateInfo {
  name: string;
  capacity: string;
  baseRates: {
    fullGroundTransport?: number;
    fullGroundTransportWithZiyarat?: number;
    jeddahAirportToMakkahHotel?: number;
    makkahHotelToMadinaHotel?: number;
    jeddahAirportToMadinaHotel?: number;
    madinaAirportToMadinaHotel?: number;
    madinaHotelToMadinaAirport?: number;
    makkahZiyarat?: number;
    madinaZiyarat?: number;
    makkahToTaifReturn?: number;
    perHourRate?: number;
    madinaHotelToMakkahHotel?: number;
    madinaHotelToJeddahAirport?: number;
    makkahHotelToJeddahAirport?: number;
    [key: string]: number | undefined;
  };
}

export interface RatesFile {
  globalMultiplier: number;
  kmFallbackRate: {
    min: number;
    max: number;
  };
  vehicles: {
    [key: string]: VehicleRateInfo;
  };
}

export const rates: RatesFile = (ratesData as unknown) as RatesFile;

export type RouteKey = keyof VehicleRateInfo['baseRates'];

export interface PredefinedRouteDef {
  key: RouteKey;
  pickupId: string;
  destinationId: string;
  nameEn: string;
  nameAr: string;
}

export const PREDEFINED_ROUTES: PredefinedRouteDef[] = [
  {
    key: 'jeddahAirportToMakkahHotel',
    pickupId: 'jeddah_airport',
    destinationId: 'makkah_hotel',
    nameEn: 'Jeddah Airport (KAIA) ➔ Makkah Hotel',
    nameAr: 'مطار جدة (KAIA) ➔ فندق مكة'
  },
  {
    key: 'makkahHotelToJeddahAirport',
    pickupId: 'makkah_hotel',
    destinationId: 'jeddah_airport',
    nameEn: 'Makkah Hotel ➔ Jeddah Airport (KAIA)',
    nameAr: 'فندق مكة ➔ مطار جدة (KAIA)'
  },
  {
    key: 'makkahHotelToMadinaHotel',
    pickupId: 'makkah_hotel',
    destinationId: 'madina_hotel',
    nameEn: 'Makkah Hotel ➔ Madina Hotel',
    nameAr: 'فندق مكة ➔ فندق المدينة'
  },
  {
    key: 'madinaHotelToMakkahHotel',
    pickupId: 'madina_hotel',
    destinationId: 'makkah_hotel',
    nameEn: 'Madina Hotel ➔ Makkah Hotel',
    nameAr: 'فندق المدينة ➔ فندق مكة'
  },
  {
    key: 'jeddahAirportToMadinaHotel',
    pickupId: 'jeddah_airport',
    destinationId: 'madina_hotel',
    nameEn: 'Jeddah Airport (KAIA) ➔ Madina Hotel',
    nameAr: 'مطار جدة (KAIA) ➔ فندق المدينة'
  },
  {
    key: 'madinaHotelToJeddahAirport',
    pickupId: 'madina_hotel',
    destinationId: 'jeddah_airport',
    nameEn: 'Madina Hotel ➔ Jeddah Airport (KAIA)',
    nameAr: 'فندق المدينة ➔ مطار جدة (KAIA)'
  },
  {
    key: 'madinaAirportToMadinaHotel',
    pickupId: 'madina_airport',
    destinationId: 'madina_hotel',
    nameEn: 'Madina Airport (PMIA) ➔ Madina Hotel',
    nameAr: 'مطار المدينة (PMIA) ➔ فندق المدينة'
  },
  {
    key: 'madinaHotelToMadinaAirport',
    pickupId: 'madina_hotel',
    destinationId: 'madina_airport',
    nameEn: 'Madina Hotel ➔ Madina Airport (PMIA)',
    nameAr: 'فندق المدينة ➔ مطار المدينة (PMIA)'
  },
  {
    key: 'makkahZiyarat',
    pickupId: 'makkah_hotel',
    destinationId: 'makkah_ziyarat',
    nameEn: 'Makkah Ziyarat Tour (Holy Sites)',
    nameAr: 'جولة مزارات مكة المكرمة'
  },
  {
    key: 'madinaZiyarat',
    pickupId: 'madina_hotel',
    destinationId: 'madina_ziyarat',
    nameEn: 'Madina Ziyarat Tour (Noble Sites)',
    nameAr: 'جولة مزارات المدينة المنورة'
  },
  {
    key: 'makkahToTaifReturn',
    pickupId: 'makkah_hotel',
    destinationId: 'taif_return',
    nameEn: 'Makkah ➔ Taif Mountain Tour (Return)',
    nameAr: 'مكة ➔ الطائف (ذهاب وعودة)'
  },
  {
    key: 'fullGroundTransport',
    pickupId: 'full_ground_package',
    destinationId: 'full_ground_complete',
    nameEn: 'Full Ground Transport (Jeddah ➔ Makkah ➔ Madina ➔ Airport)',
    nameAr: 'التفويج الكامل (جدة ➔ مكة ➔ المدينة ➔ المطار)'
  },
  {
    key: 'fullGroundTransportWithZiyarat',
    pickupId: 'full_ground_ziyarat_package',
    destinationId: 'full_ground_ziyarat_complete',
    nameEn: 'Full Ground Transport + Ziyarat (All-Inclusive)',
    nameAr: 'التفويج الكامل مع المزارات الشاملة'
  },
  {
    key: 'perHourRate',
    pickupId: 'hourly_service',
    destinationId: 'hourly_duration',
    nameEn: 'Hourly Service (Per Hour Rate)',
    nameAr: 'خدمة بالساعة (لكل ساعة)'
  }
];

export interface LocationOption {
  id: string;
  nameEn: string;
  nameAr: string;
}

export const PICKUP_OPTIONS_BUSES: LocationOption[] = [
  { id: 'jeddah_airport', nameEn: 'Jeddah Airport (KAIA)', nameAr: 'مطار جدة الدولي (KAIA)' },
  { id: 'makkah_hotel', nameEn: 'Makkah Hotel', nameAr: 'فندق مكة المكرمة' },
  { id: 'madina_hotel', nameEn: 'Madina Hotel', nameAr: 'فندق المدينة المنورة' },
  { id: 'madina_airport', nameEn: 'Madina Airport (PMIA)', nameAr: 'مطار المدينة المنورة (PMIA)' },
  { id: 'full_ground_package', nameEn: 'Full Ground Transport Package', nameAr: 'باقة التفويج الكامل' },
  { id: 'full_ground_ziyarat_package', nameEn: 'Full Ground + Ziyarat Package', nameAr: 'باقة التفويج الكامل مع المزارات' },
  { id: 'hourly_service', nameEn: 'Hourly Rental Service', nameAr: 'خدمة بالساعة' }
];

export const DESTINATION_OPTIONS_BUSES: LocationOption[] = [
  { id: 'makkah_hotel', nameEn: 'Makkah Hotel', nameAr: 'فندق مكة المكرمة' },
  { id: 'madina_hotel', nameEn: 'Madina Hotel', nameAr: 'فندق المدينة المنورة' },
  { id: 'jeddah_airport', nameEn: 'Jeddah Airport (KAIA)', nameAr: 'مطار جدة الدولي (KAIA)' },
  { id: 'madina_airport', nameEn: 'Madina Airport (PMIA)', nameAr: 'مطار المدينة المنورة (PMIA)' },
  { id: 'makkah_ziyarat', nameEn: 'Makkah Ziyarat Tour', nameAr: 'جولة مزارات مكة المكرمة' },
  { id: 'madina_ziyarat', nameEn: 'Madina Ziyarat Tour', nameAr: 'جولة مزارات المدينة المنورة' },
  { id: 'taif_return', nameEn: 'Taif (Return Trip)', nameAr: 'الطائف (ذهاب وعودة)' },
  { id: 'full_ground_complete', nameEn: 'Complete Full Circuit', nameAr: 'اكتمال خطة التفويج الكامل' },
  { id: 'full_ground_ziyarat_complete', nameEn: 'Complete Full Circuit + Ziyarat', nameAr: 'اكتمال خطة التفويج + المزارات' },
  { id: 'hourly_duration', nameEn: 'Hourly Duration (1 Hour)', nameAr: 'مدة الخدمة (ساعة واحدة)' }
];

export const PICKUP_OPTIONS_CARS: LocationOption[] = [
  ...PICKUP_OPTIONS_BUSES,
  { id: 'custom', nameEn: 'Custom Pickup Location...', nameAr: 'موقع استلام مخصص...' }
];

export const DESTINATION_OPTIONS_CARS: LocationOption[] = [
  ...DESTINATION_OPTIONS_BUSES,
  { id: 'custom', nameEn: 'Custom Destination...', nameAr: 'وجهة وصول مخصصة...' }
];

/**
 * Calculates the exact scaled price for a given vehicle and route
 */
export function getScaledRoutePrice(vehicleKey: string, routeKey: RouteKey): number {
  const vehicle = rates.vehicles[vehicleKey];
  if (!vehicle || !vehicle.baseRates[routeKey]) {
    return 0;
  }
  const base = vehicle.baseRates[routeKey];
  return Math.round(base * rates.globalMultiplier);
}

/**
 * Calculates the estimated price for custom distance using kmFallbackRate and globalMultiplier
 */
export function getKmEstimatedPrice(distanceKm: number): {
  min: number;
  max: number;
  avg: number;
  rateMin: number;
  rateMax: number;
} {
  const rateMin = rates.kmFallbackRate.min * rates.globalMultiplier;
  const rateMax = rates.kmFallbackRate.max * rates.globalMultiplier;
  const min = Math.round(distanceKm * rateMin);
  const max = Math.round(distanceKm * rateMax);
  const avg = Math.round(distanceKm * ((rateMin + rateMax) / 2));
  return { min, max, avg, rateMin, rateMax };
}

/**
 * Resolves whether a pickup and destination pair matches a predefined route
 */
export function matchPredefinedRoute(pickupId: string, destinationId: string): PredefinedRouteDef | null {
  if (pickupId === 'custom' || destinationId === 'custom') {
    return null;
  }

  // Exact match
  const exact = PREDEFINED_ROUTES.find(r => r.pickupId === pickupId && r.destinationId === destinationId);
  if (exact) return exact;

  // Handle special pairings
  if (destinationId === 'makkah_ziyarat') {
    return PREDEFINED_ROUTES.find(r => r.key === 'makkahZiyarat') || null;
  }
  if (destinationId === 'madina_ziyarat') {
    return PREDEFINED_ROUTES.find(r => r.key === 'madinaZiyarat') || null;
  }
  if (destinationId === 'taif_return') {
    return PREDEFINED_ROUTES.find(r => r.key === 'makkahToTaifReturn') || null;
  }
  if (pickupId === 'full_ground_package' || destinationId === 'full_ground_complete') {
    return PREDEFINED_ROUTES.find(r => r.key === 'fullGroundTransport') || null;
  }
  if (pickupId === 'full_ground_ziyarat_package' || destinationId === 'full_ground_ziyarat_complete') {
    return PREDEFINED_ROUTES.find(r => r.key === 'fullGroundTransportWithZiyarat') || null;
  }
  if (pickupId === 'hourly_service' || destinationId === 'hourly_duration') {
    return PREDEFINED_ROUTES.find(r => r.key === 'perHourRate') || null;
  }

  return null;
}
