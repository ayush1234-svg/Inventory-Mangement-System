import { describe, expect, it } from 'vitest';
import {
  calculateDiscountAmount,
  calculateLineTotal,
  calculateTaxAmount,
  formatPaise,
  paiseToRupees,
  rupeesToPaise,
} from '../utils/money.js';

describe('Monetary & Currency Utilities (Integer Paise Precision)', () => {
  it('converts rupees to integer paise correctly', () => {
    expect(rupeesToPaise(100)).toBe(10000);
    expect(rupeesToPaise(1499.5)).toBe(149950);
    expect(rupeesToPaise(0.99)).toBe(99);
    expect(rupeesToPaise(0)).toBe(0);
  });

  it('converts paise to rupees with exact two decimal places', () => {
    expect(paiseToRupees(10000)).toBe(100);
    expect(paiseToRupees(149950)).toBe(1499.5);
    expect(paiseToRupees(99)).toBe(0.99);
  });

  it('formats currency correctly in Indian numbering system', () => {
    expect(formatPaise(149900)).toBe('₹1,499.00');
    expect(formatPaise(7199900)).toBe('₹71,999.00');
  });

  it('calculates line total accurately in paise without floating point inaccuracy', () => {
    const unitPricePaise = 149900; // ₹1,499.00
    const quantity = 3;
    expect(calculateLineTotal(unitPricePaise, quantity)).toBe(449700);
  });

  it('calculates discount amount correctly for percentage and fixed types', () => {
    const subtotalPaise = 100000; // ₹1,000.00

    // 10% discount on ₹1,000 -> ₹100 = 10000 paise
    expect(calculateDiscountAmount(subtotalPaise, 'percentage', 10)).toBe(10000);

    // Fixed ₹250 discount = 25000 paise
    expect(calculateDiscountAmount(subtotalPaise, 'fixed', 25000)).toBe(25000);

    // No discount
    expect(calculateDiscountAmount(subtotalPaise, 'none', 10)).toBe(0);

    // Discount cannot exceed subtotal
    expect(calculateDiscountAmount(subtotalPaise, 'fixed', 200000)).toBe(100000);
  });

  it('calculates tax amount correctly on taxable paise amount', () => {
    const taxablePaise = 100000; // ₹1,000.00
    // 18% GST -> ₹180 = 18000 paise
    expect(calculateTaxAmount(taxablePaise, 18)).toBe(18000);

    // 0% tax -> 0
    expect(calculateTaxAmount(taxablePaise, 0)).toBe(0);
  });
});
