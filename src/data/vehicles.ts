export function getVehicleImageUrl(vehicleId: string): string {
  return `https://res.cloudinary.com/hre1igvz/image/upload/c_fill,g_auto,w_1164,h_672,dpr_auto,f_auto,q_auto/v1784725441/white-${vehicleId}.jpg`;
}

export interface VehicleData {
  id: string;
  nameEn: string;
  nameAr: string;
  typeEn: string;
  typeAr: string;
  seats: number;
  price: number;
  tagsEn: string[];
  tagsAr: string[];
  classFilter: 'economy' | 'business' | 'vip' | 'group';
  recommended: boolean;
  emoji: string;
}

export const vehiclesData: VehicleData[] = [
  {
    id: "toyota-camry",
    nameEn: "Toyota Camry",
    nameAr: "تويوتا كامري",
    typeEn: "Sedan (Standard)",
    typeAr: "سيدان (قياسي)",
    seats: 4,
    price: 120,
    tagsEn: ["A/C Klimat", "USB Chargers", "Bluetooth Audio", "Compact Luggage"],
    tagsAr: ["تكييف هواء فائق", "شواحن USB", "نظام صوتي بلوتوث", "أمتعة متوسطة"],
    classFilter: "economy",
    recommended: false,
    emoji: "🚗"
  },
  {
    id: "hyundai-staria",
    nameEn: "Hyundai Staria",
    nameAr: "هيونداي ستاريا",
    typeEn: "Premium MPV",
    typeAr: "عائلية ممتازة",
    seats: 7,
    price: 220,
    tagsEn: ["Powerful A/C", "Spacious Seats", "Free Wi-Fi", "USB Charging"],
    tagsAr: ["تكييف هواء مزدوج", "مقاعد مريحة واسعة", "إنترنت مجاني", "شواحن USB تيار سريع"],
    classFilter: "business",
    recommended: true,
    emoji: "🚐"
  },
  {
    id: "gmc-yukon-xl",
    nameEn: "GMC Yukon XL",
    nameAr: "جي إم سي يوكن XL",
    typeEn: "VIP Executive SUV",
    typeAr: "رياضية متعددة الأغراض فخمة",
    seats: 7,
    price: 480,
    tagsEn: ["Royal Leather Seats", "Premium Sound System", "Spacious Bag Room", "Bottled Water"],
    tagsAr: ["مقاعد جلدية ملكية", "نظام صوتي فاخر", "مساحة حقائب لارج", "ضيافة مياه معدنية"],
    classFilter: "vip",
    recommended: true,
    emoji: "SUV"
  },
  {
    id: "toyota-hiace",
    nameEn: "Toyota Hiace",
    nameAr: "تويوتا هايس",
    typeEn: "Passenger Minivan",
    typeAr: "ميني فان للركاب",
    seats: 12,
    price: 350,
    tagsEn: ["Dual A/C", "Adjustable Seats", "High Roof", "Group Luggage"],
    tagsAr: ["تكييف هواء ثنائي", "مقاعد قابلة للتعديل", "سقف مرتفع مريح", "مساحة حقائب جماعية"],
    classFilter: "group",
    recommended: false,
    emoji: "🚐"
  },
  {
    id: "sprinter-van",
    nameEn: "Mercedes Sprinter Van",
    nameAr: "مرسيدس سبرينتر فان",
    typeEn: "Luxury Group Charter",
    typeAr: "فان فاخر للمجموعات والوفود",
    seats: 14,
    price: 550,
    tagsEn: ["Individual A/C vents", "Premium Seats", "Ambient Lighting", "Free Wi-Fi"],
    tagsAr: ["فتحات تكييف فردية", "مقاعد مخملية مريحة", "إضاءة محيطية هادئة", "إنترنت مجاني فائق السرعة"],
    classFilter: "business",
    recommended: false,
    emoji: "🚍"
  },
  {
    id: "coaster-bus",
    nameEn: "Toyota Coaster Bus",
    nameAr: "حافلة تويوتا كوستر",
    typeEn: "Medium Group Coach",
    typeAr: "حافلة ركاب للمجموعات الكبيرة",
    seats: 25,
    price: 800,
    tagsEn: ["Powerful Core A/C", "PA Microphone", "Emergency Exit", "Massive Cargo Trunk"],
    tagsAr: ["تكييف مركزي قوي", "ميكروفون إرشادي", "مخارج طوارئ آمنة", "صندوق أمتعة ضخم جداً"],
    classFilter: "group",
    recommended: true,
    emoji: "🚌"
  }
];
