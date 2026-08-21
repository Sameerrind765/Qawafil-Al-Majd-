import ratesData from './rates.json';

export function getVehicleImageUrl(vehicleId: string): string {
  const images: Record<string, string> = {
    'camry': 'https://res.cloudinary.com/hre1igvz/image/upload/c_fill,g_auto,w_1164,h_672,dpr_auto,f_auto,q_auto/v1784725441/white-toyota-camry.jpg',
    'fordTaurus': 'https://res.cloudinary.com/hre1igvz/image/upload/c_fill,g_auto,w_1164,h_672,dpr_auto,f_auto,q_auto/black-fordTaurus.jpg',
    'toyota-camry': 'https://res.cloudinary.com/hre1igvz/image/upload/c_fill,g_auto,w_1164,h_672,dpr_auto,f_auto,q_auto/v1784725441/white-toyota-camry.jpg',
    'h1_hyundai': 'https://res.cloudinary.com/hre1igvz/image/upload/c_fill,g_auto,w_1164,h_672,dpr_auto,f_auto,q_auto/v1784725441/white-hyundai-staria.jpg',
    'hyundai-staria': 'https://res.cloudinary.com/hre1igvz/image/upload/c_fill,g_auto,w_1164,h_672,dpr_auto,f_auto,q_auto/v1784725441/white-hyundai-staria.jpg',
    'gmc_yukon_xl_ac': 'https://res.cloudinary.com/hre1igvz/image/upload/c_fill,g_auto,w_1164,h_672,dpr_auto,f_auto,q_auto/v1784725441/white-gmc-yukon-xl.jpg',
    'hiace': 'https://res.cloudinary.com/hre1igvz/image/upload/c_fill,g_auto,w_1164,h_672,dpr_auto,f_auto,q_auto/v1784725441/white-toyota-hiace.jpg',
    'toyota-hiace': 'https://res.cloudinary.com/hre1igvz/image/upload/c_fill,g_auto,w_1164,h_672,dpr_auto,f_auto,q_auto/v1784725441/white-toyota-hiace.jpg',
    'coaster': 'https://res.cloudinary.com/hre1igvz/image/upload/c_fill,g_auto,w_1164,h_672,dpr_auto,f_auto,q_auto/v1784725441/white-coaster-bus.jpg',
    'coaster-bus': 'https://res.cloudinary.com/hre1igvz/image/upload/c_fill,g_auto,w_1164,h_672,dpr_auto,f_auto,q_auto/v1784725441/white-coaster-bus.jpg'
  };

  return images[vehicleId] || `https://res.cloudinary.com/hre1igvz/image/upload/c_fill,g_auto,w_1164,h_672,dpr_auto,f_auto,q_auto/v1784725441/white-${vehicleId}.jpg`;
}

export interface VehicleData {
  id: string;
  rateKey?: string;
  nameEn: string;
  nameAr: string;
  typeEn: string;
  typeAr: string;
  capacity?: string;
  seats: number;
  price: number;
  tagsEn: string[];
  tagsAr: string[];
  classFilter: 'economy' | 'business' | 'vip' | 'group';
  isBusOrVan?: boolean;
  recommended: boolean;
  emoji: string;
}

// Compute standard base price dynamically with globalMultiplier
const mult = ratesData.globalMultiplier || 1.0;
const vRates = ratesData.vehicles;

export const vehiclesData: VehicleData[] = [
  {
    id: "camry",
    rateKey: "camry",
    nameEn: "Camry Car",
    nameAr: "تويوتا كامري",
    typeEn: "Standard Sedan",
    typeAr: "سيدان قياسي",
    capacity: vRates.camry.capacity,
    seats: 3,
    price: Math.round(vRates.camry.baseRates.jeddahAirportToMakkahHotel * mult),
    tagsEn: ["A/C Klimat", "USB Fast Chargers", "Bluetooth Audio", "Standard Trunk"],
    tagsAr: ["تكييف هواء فائق", "شواحن USB سريعة", "نظام صوتي بلوتوث", "صندوق أمتعة"],
    classFilter: "economy",
    isBusOrVan: false,
    recommended: false,
    emoji: "🚗"
  },
  {
    id: "fordTaurus",
    rateKey: "fordTaurus",
    nameEn: "Ford Taurus",
    nameAr: "فورد تورس",
    typeEn: "Premium Sedan",
    typeAr: "سيدان فاخرة",
    capacity: vRates.fordTaurus.capacity,
    seats: 3,
    price: Math.round(vRates.fordTaurus.baseRates.jeddahAirportToMakkahHotel * mult),
    tagsEn: ["A/C Climate Control", "USB Fast Chargers", "Bluetooth Audio", "Large Trunk"],
    tagsAr: ["تكييف هواء", "شواحن USB سريعة", "نظام صوتي بلوتوث", "صندوق أمتعة كبير"],
    classFilter: "business",
    isBusOrVan: false,
    recommended: false,
    emoji: "🚘"
  },
  {
    id: "gmc_yukon_xl_ac",
    rateKey: "gmc_yukon_xl_ac",
    nameEn: "AC GMC Yukon XL",
    nameAr: "جي إم سي يوكن XL (VIP A/C)",
    typeEn: "VIP Presidential SUV",
    typeAr: "فخامة رئاسية مكيفة",
    capacity: vRates.gmc_yukon_xl_ac.capacity,
    seats: 3,
    price: Math.round(vRates.gmc_yukon_xl_ac.baseRates.jeddahAirportToMakkahHotel * mult),
    tagsEn: ["Dual Climate Control", "Captain Chairs", "High Privacy Tint", "VIP Airport Fast Track"],
    tagsAr: ["تحكم مناخي مستقل", "مقاعد كابتن وثيره", "عزل حراري وخصوصية", "مسار أولوية بالمطار"],
    classFilter: "vip",
    isBusOrVan: false,
    recommended: true,
    emoji: "SUV"
  },
  {
    id: "h1_hyundai",
    rateKey: "h1_hyundai",
    nameEn: "H1 Hyundai",
    nameAr: "هيونداي H1 عائلي",
    typeEn: "Family Passenger MPV",
    typeAr: "عائلية ممتازة",
    capacity: vRates.h1_hyundai.capacity,
    seats: 7,
    price: Math.round(vRates.h1_hyundai.baseRates.jeddahAirportToMakkahHotel * mult),
    tagsEn: ["Powerful Dual A/C", "Spacious Cabin", "USB Charging Hub", "Family Luggage"],
    tagsAr: ["تكييف هواء مزدوج", "مقصورة رحبة", "منافذ شحن USB", "مساحة أمتعة عائلية"],
    classFilter: "business",
    isBusOrVan: false,
    recommended: true,
    emoji: "🚐"
  },
  {
    id: "hiace",
    rateKey: "hiace",
    nameEn: "Toyota Hiace",
    nameAr: "تويوتا هايس",
    typeEn: "Passenger Minivan",
    typeAr: "ميني فان للركاب",
    capacity: vRates.hiace.capacity,
    seats: 12,
    price: Math.round(vRates.hiace.baseRates.jeddahAirportToMakkahHotel * mult),
    tagsEn: ["Dual A/C", "High Roof Seating", "Adjustable Seats", "Group Luggage"],
    tagsAr: ["تكييف هواء ثنائي", "سقف مرتفع مريح", "مقاعد قابلة للتعديل", "مساحة حقائب جماعية"],
    classFilter: "group",
    isBusOrVan: true,
    recommended: false,
    emoji: "🚐"
  },
  {
    id: "coaster",
    rateKey: "coaster",
    nameEn: "Toyota Coaster",
    nameAr: "حافلة تويوتا كوستر",
    typeEn: "Medium Group Coach",
    typeAr: "حافلة ركاب للمجموعات والوفود",
    capacity: vRates.coaster.capacity,
    seats: 18,
    price: Math.round(vRates.coaster.baseRates.jeddahAirportToMakkahHotel * mult),
    tagsEn: ["Powerful Central A/C", "PA Microphone", "Emergency Exit", "Massive Luggage Trunk"],
    tagsAr: ["تكييف مركزي قوي", "ميكروفون إرشادي", "مخارج طوارئ آمنة", "صندوق أمتعة ضخم جداً"],
    classFilter: "group",
    isBusOrVan: true,
    recommended: true,
    emoji: "🚌"
  }
];
