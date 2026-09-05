/**
 * Qawafil Al Majd Al Mithaliyah Transport Pricing & Rate Guarantee Policy
 *
 * POLICY SPECIFICATION:
 * - Bookings made for dates within the current month retain a guaranteed fixed price at time of booking.
 * - Bookings made for dates beyond the current month are still accepted and confirmed (reservation guaranteed),
 *   but without a locked-in price. The rate will be finalized 2 weeks before travel, set at 10% below
 *   the prevailing market rate at that time — offering the customer a discount in exchange for accepting rate flexibility.
 * - Customer communication at booking time MUST clearly state:
 *   "Reservation confirmed; final price will be finalized 2 weeks before travel at 10% below the market rate."
 *   (Arabic: "الحجز مؤكد؛ سيتم اعتماد السعر النهائي قبل أسبوعين من موعد السفر بخصم 10% عن سعر السوق السائد.")
 */

export interface RateGuaranteePolicy {
  isCurrentMonth: boolean;
  isBeyondCurrentMonth: boolean;
  isLaterThanThreeMonths: boolean;
  status: 'guaranteed_fixed' | 'market_discount_10';
  badgeEn: string;
  badgeAr: string;
  shortLabelEn: string;
  shortLabelAr: string;
  policyStatementEn: string;
  policyStatementAr: string;
  detailedExplanationEn: string;
  detailedExplanationAr: string;
  priceTagEn: string;
  priceTagAr: string;
  displayPrice: string | null;
}

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isDateInCurrentMonth(dateStr?: string): boolean {
  if (!dateStr) return true;
  try {
    const parts = dateStr.trim().split('-');
    if (parts.length >= 2) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // 0-indexed month
      const now = new Date();
      return year === now.getFullYear() && month === now.getMonth();
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return true;
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  } catch {
    return true;
  }
}

export function isDateBeyondCurrentMonth(dateStr?: string): boolean {
  if (!dateStr) return false;
  try {
    const parts = dateStr.trim().split('-');
    if (parts.length >= 2) {
      const targetYear = parseInt(parts[0], 10);
      const targetMonth = parseInt(parts[1], 10) - 1;
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();

      return (
        targetYear > currentYear ||
        (targetYear === currentYear && targetMonth > currentMonth)
      );
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;
    const now = new Date();
    return (
      d.getFullYear() > now.getFullYear() ||
      (d.getFullYear() === now.getFullYear() && d.getMonth() > now.getMonth())
    );
  } catch {
    return false;
  }
}

export function isDateLaterThanThreeMonths(dateStr?: string): boolean {
  if (!dateStr) return false;
  try {
    const parts = dateStr.trim().split('-');
    if (parts.length >= 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const target = new Date(year, month, day);

      const now = new Date();
      now.setHours(0, 0, 0, 0);

      // Threshold: strictly 3 calendar months from today
      const threshold = new Date(now);
      threshold.setMonth(threshold.getMonth() + 3);

      return target.getTime() > threshold.getTime();
    }
    const target = new Date(dateStr);
    if (isNaN(target.getTime())) return false;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const threshold = new Date(now);
    threshold.setMonth(threshold.getMonth() + 3);
    return target.getTime() > threshold.getTime();
  } catch {
    return false;
  }
}

export function getRateGuaranteePolicy(dateStr?: string, benchmarkPrice?: number): RateGuaranteePolicy {
  const isCurrent = isDateInCurrentMonth(dateStr);
  const isBeyond = isDateBeyondCurrentMonth(dateStr);
  const isLater3Mo = isDateLaterThanThreeMonths(dateStr);

  // Case 1: Later than 3 months -> Remove estimated price completely, just state 10% below market rate fact
  if (isLater3Mo) {
    return {
      isCurrentMonth: false,
      isBeyondCurrentMonth: true,
      isLaterThanThreeMonths: true,
      status: 'market_discount_10',
      badgeEn: '10% Below Market Rate',
      badgeAr: 'خصم 10% عن سعر السوق',
      shortLabelEn: '10% Below Market Rate',
      shortLabelAr: 'أقل بـ 10% من سعر السوق',
      policyStatementEn: 'Reservation confirmed; final price will be finalized 2 weeks before travel at 10% below the market rate.',
      policyStatementAr: 'الحجز مؤكد؛ سيتم اعتماد السعر النهائي قبل أسبوعين من موعد السفر بخصم 10% عن سعر السوق السائد.',
      detailedExplanationEn: 'Reservation confirmed; final price will be finalized 2 weeks before travel at 10% below the market rate.',
      detailedExplanationAr: 'الحجز مؤكد؛ سيتم اعتماد السعر النهائي قبل أسبوعين من موعد السفر بخصم 10% عن سعر السوق السائد.',
      priceTagEn: '10% Below Market Rate',
      priceTagAr: 'أقل بـ 10% من سعر السوق',
      displayPrice: null
    };
  }

  // Case 2: Beyond current month, but within 3 months -> Show benchmark reference price with 10% market policy note
  if (!isCurrent && isBeyond) {
    return {
      isCurrentMonth: false,
      isBeyondCurrentMonth: true,
      isLaterThanThreeMonths: false,
      status: 'market_discount_10',
      badgeEn: 'Rate Guarantee Window (-10% Market)',
      badgeAr: 'نافذة ضمان السعر (خصم 10% عن السوق)',
      shortLabelEn: '10% Below Market Rate',
      shortLabelAr: 'أقل بـ 10% من سعر السوق',
      policyStatementEn: 'Reservation confirmed; final price will be finalized 2 weeks before travel at 10% below the market rate.',
      policyStatementAr: 'الحجز مؤكد؛ سيتم اعتماد السعر النهائي قبل أسبوعين من موعد السفر بخصم 10% عن سعر السوق السائد.',
      detailedExplanationEn: benchmarkPrice
        ? `Estimated benchmark: SAR ${benchmarkPrice}. Final fare will be finalized 2 weeks before travel at 10% below prevailing market rates.`
        : 'Final fare will be finalized 2 weeks before travel at 10% below prevailing market rates.',
      detailedExplanationAr: benchmarkPrice
        ? `السعر المرجعي التقديري: ${benchmarkPrice} ريال. سيتم اعتماد السعر النهائي قبل أسبوعين من موعد الرحلة بخصم 10% عن أسعار السوق السائدة.`
        : 'سيتم اعتماد السعر النهائي قبل أسبوعين من موعد الرحلة بخصم 10% عن أسعار السوق السائدة.',
      priceTagEn: 'Est. Benchmark (-10% Market)',
      priceTagAr: 'مرجعي تقديري (-10% من السوق)',
      displayPrice: benchmarkPrice ? String(benchmarkPrice) : null
    };
  }

  // Case 3: Current Month -> Guaranteed fixed price locked at booking
  return {
    isCurrentMonth: true,
    isBeyondCurrentMonth: false,
    isLaterThanThreeMonths: false,
    status: 'guaranteed_fixed',
    badgeEn: 'Guaranteed Fixed Rate',
    badgeAr: 'سعر ثابت ومضمون',
    shortLabelEn: 'Guaranteed Fixed Rate',
    shortLabelAr: 'سعر ثابت ومضمون',
    policyStatementEn: 'Guaranteed fixed price locked at time of booking for in-month travel.',
    policyStatementAr: 'سعر ثابت ومضمون ومثبت عند الحجز لرحلات الشهر الحالي.',
    detailedExplanationEn: benchmarkPrice
      ? `Guaranteed fixed rate of SAR ${benchmarkPrice} locked in at time of booking.`
      : 'Guaranteed fixed rate locked in at time of booking.',
    detailedExplanationAr: benchmarkPrice
      ? `سعر ثابت مضمون بقيمة ${benchmarkPrice} ريال مثبت ومؤكد عند الحجز.`
      : 'سعر ثابت ومضمون مثبت ومؤكد عند الحجز.',
    priceTagEn: 'Guaranteed Flat Rate',
    priceTagAr: 'سعر ثابت ومضمون',
    displayPrice: benchmarkPrice ? String(benchmarkPrice) : null
  };
}
