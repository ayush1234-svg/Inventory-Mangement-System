/**
 * Financial calculation utilities.
 * All monetary amounts in database & backend logic are stored strictly as integer paise (1 INR = 100 paise)
 * to eliminate floating-point precision/rounding errors.
 */

export function rupeesToPaise(rupees: number): number {
  if (typeof rupees !== 'number' || isNaN(rupees)) return 0;
  return Math.round(rupees * 100);
}

export function paiseToRupees(paise: number): number {
  if (typeof paise !== 'number' || isNaN(paise)) return 0;
  return Number((paise / 100).toFixed(2));
}

export function formatPaise(paise: number, currencySymbol = '₹'): string {
  const rupees = paiseToRupees(paise);
  return `${currencySymbol}${rupees.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function calculateLineTotal(unitPricePaise: number, quantity: number): number {
  const safeQty = Math.max(0, Math.floor(quantity));
  return Math.max(0, Math.round(unitPricePaise * safeQty));
}

export function calculateDiscountAmount(
  subtotalPaise: number,
  discountType: 'percentage' | 'fixed' | 'none',
  discountValue: number
): number {
  if (discountType === 'none' || discountValue <= 0) return 0;

  if (discountType === 'percentage') {
    const rate = Math.min(100, Math.max(0, discountValue));
    return Math.min(subtotalPaise, Math.round((subtotalPaise * rate) / 100));
  }

  if (discountType === 'fixed') {
    // discountValue is passed in paise if fixed
    const fixedAmount = Math.max(0, Math.round(discountValue));
    return Math.min(subtotalPaise, fixedAmount);
  }

  return 0;
}

export function calculateTaxAmount(taxableAmountPaise: number, taxRatePercentage: number): number {
  if (taxRatePercentage <= 0) return 0;
  return Math.max(0, Math.round((taxableAmountPaise * taxRatePercentage) / 100));
}
