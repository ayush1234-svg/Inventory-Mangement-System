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
