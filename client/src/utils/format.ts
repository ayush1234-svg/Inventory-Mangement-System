/**
 * Currency & Date formatting utilities
 */

export function paiseToRupees(paise: number): number {
  if (typeof paise !== 'number' || isNaN(paise)) return 0;
  return Number((paise / 100).toFixed(2));
}

export function rupeesToPaise(rupees: number): number {
  if (typeof rupees !== 'number' || isNaN(rupees)) return 0;
  return Math.round(rupees * 100);
}

export function formatCurrency(paise: number, symbol = '₹'): string {
  const rupees = paiseToRupees(paise);
  return `${symbol}${rupees.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(dateStringOrDate: string | Date): string {
  if (!dateStringOrDate) return '—';
  const d = new Date(dateStringOrDate);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(dateStringOrDate: string | Date): string {
  if (!dateStringOrDate) return '—';
  const d = new Date(dateStringOrDate);
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatPaymentMethod(method: string): string {
  switch (method?.toLowerCase()) {
    case 'cash':
      return 'Cash';
    case 'upi':
      return 'UPI';
    case 'card':
      return 'Card';
    case 'other':
      return 'Other';
    default:
      return method || 'Cash';
  }
}

export function amountInWords(paise: number): string {
  if (paise <= 0) return 'Rupees Zero Only';

  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = [
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertTwoDigits(n: number): string {
    if (n < 10) return units[n];
    if (n >= 10 && n < 20) return teens[n - 10];
    const unit = n % 10;
    return `${tens[Math.floor(n / 10)]}${unit ? ' ' + units[unit] : ''}`;
  }

  function convertThreeDigits(n: number): string {
    const hundred = Math.floor(n / 100);
    const rest = n % 100;
    if (hundred > 0 && rest > 0) {
      return `${units[hundred]} Hundred ${convertTwoDigits(rest)}`;
    }
    if (hundred > 0) {
      return `${units[hundred]} Hundred`;
    }
    return convertTwoDigits(rest);
  }

  const rupees = Math.floor(paise / 100);
  const remainingPaise = Math.round(paise % 100);

  let result = '';

  if (rupees > 0) {
    const crore = Math.floor(rupees / 10000000);
    const lakh = Math.floor((rupees % 10000000) / 100000);
    const thousand = Math.floor((rupees % 100000) / 1000);
    const remainder = rupees % 1000;

    const parts: string[] = [];
    if (crore > 0) parts.push(`${convertTwoDigits(crore)} Crore`);
    if (lakh > 0) parts.push(`${convertTwoDigits(lakh)} Lakh`);
    if (thousand > 0) parts.push(`${convertTwoDigits(thousand)} Thousand`);
    if (remainder > 0) parts.push(convertThreeDigits(remainder));

    result = `Rupees ${parts.join(' ')}`;
  } else {
    result = 'Rupees Zero';
  }

  if (remainingPaise > 0) {
    result += ` and ${convertTwoDigits(remainingPaise)} Paise Only`;
  } else {
    result += ' Only';
  }

  return result;
}

