/**
 * تحويل الأرقام إلى كلمات عربية
 * Arabic Number to Words Converter
 */

const ones = [
  '', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة',
  'ستة', 'سبعة', 'ثمانية', 'تسعة', 'عشرة',
  'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر',
  'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'
];

const tens = [
  '', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون',
  'ستون', 'سبعون', 'ثمانون', 'تسعون'
];

const hundreds = [
  '', 'مائة', 'مائتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة',
  'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'
];

function convertGroup(num: number): string {
  if (num === 0) return '';
  
  const h = Math.floor(num / 100);
  const remainder = num % 100;
  const t = Math.floor(remainder / 10);
  const o = remainder % 10;
  
  let result = '';
  
  if (h > 0) {
    result = hundreds[h];
  }
  
  if (remainder > 0) {
    if (result) result += ' و';
    
    if (remainder < 20) {
      result += ones[remainder];
    } else {
      if (o > 0) {
        result += ones[o] + ' و';
      }
      result += tens[t];
    }
  }
  
  return result;
}

export function numberToArabicWords(num: number, currency: string = 'ريال'): string {
  if (num === 0) return 'صفر ' + currency + ' فقط لا غير';
  
  const isNegative = num < 0;
  num = Math.abs(num);
  
  // Handle decimal part
  const intPart = Math.floor(num);
  
  if (intPart === 0) {
    return 'صفر ' + currency + ' فقط لا غير';
  }
  
  // Break into groups of 3
  const groups: number[] = [];
  let temp = intPart;
  while (temp > 0) {
    groups.push(temp % 1000);
    temp = Math.floor(temp / 1000);
  }
  
  const groupNames = ['', 'ألف', 'مليون', 'مليار'];
  const groupNamesPlural = ['', 'آلاف', 'ملايين', 'مليارات'];
  const groupNamesDual = ['', 'ألفان', 'مليونان', 'ملياران'];
  
  const parts: string[] = [];
  
  for (let i = groups.length - 1; i >= 0; i--) {
    const g = groups[i];
    if (g === 0) continue;
    
    if (i === 0) {
      // Units group
      parts.push(convertGroup(g));
    } else if (g === 1) {
      // Exactly 1 thousand/million/etc
      parts.push(groupNames[i]);
    } else if (g === 2) {
      // Exactly 2 thousand/million/etc  
      parts.push(groupNamesDual[i]);
    } else if (g >= 3 && g <= 10) {
      parts.push(convertGroup(g) + ' ' + groupNamesPlural[i]);
    } else if (g > 10) {
      // For numbers > 10 in a group, use singular
      parts.push(convertGroup(g) + ' ' + groupNames[i] + 'اً');
    }
  }
  
  let result = parts.join(' و');
  
  if (isNegative) {
    result = 'سالب ' + result;
  }
  
  result += ' ' + currency + ' فقط لا غير';
  
  return result;
}

// Calculation functions
export function calculateInvoice(data: {
  previousReading: number;
  currentReading: number;
  unitPrice: number;
  servicesAmount: number;
  arrearsAmount: number;
  paidDuringPeriod: number;
}) {
  const consumptionKwh = data.currentReading - data.previousReading;
  const baseValue = consumptionKwh * data.unitPrice;
  const grossAmount = baseValue + data.servicesAmount + data.arrearsAmount;
  const netDue = grossAmount - data.paidDuringPeriod;
  const netDueWords = numberToArabicWords(netDue);
  
  return {
    consumptionKwh,
    baseValue,
    grossAmount,
    netDue,
    netDueWords,
  };
}

export function generateInvoiceNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const random = String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0');
  return `INV-${year}-${month}-${random}`;
}

export function formatNumber(num: number): string {
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
