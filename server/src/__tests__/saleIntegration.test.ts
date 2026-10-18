import mongoose, { Types } from 'mongoose';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { connectDB, disconnectDB } from '../config/db.js';
import { Product } from '../models/Product.js';
import { Sale } from '../models/Sale.js';
import { StockAdjustment } from '../models/StockAdjustment.js';
import { createSale } from '../services/saleService.js';

describe('Sale Service & Concurrency Integration Tests', () => {
  let testProductId: string;
  const initialStock = 5;
  const testSellingPrice = 50000; // ₹500.00
  const testPurchasePrice = 30000; // ₹300.00

  beforeAll(async () => {
    await connectDB();

    // Create isolated test product
    const prod = await Product.create({
      name: 'Test Charger Unit',
      category: 'Cables & Chargers',
      brand: 'TestBrand',
      purchasePrice: testPurchasePrice,
      sellingPrice: testSellingPrice,
      stockQuantity: initialStock,
      lowStockThreshold: 2,
    });
    testProductId = prod._id.toString();
  });

  afterAll(async () => {
    // Clean up test data
    if (testProductId) {
      await Product.findByIdAndDelete(testProductId);
      await Sale.deleteMany({ 'items.productId': new Types.ObjectId(testProductId) });
      await StockAdjustment.deleteMany({ productId: new Types.ObjectId(testProductId) });
    }
    await disconnectDB();
  });

  it('atomically decrements stock upon successful sale and creates immutable line-item snapshot', async () => {
    const sale = await createSale({
      items: [{ productId: testProductId, quantity: 2 }],
      paymentMethod: 'cash',
      customerName: 'Test Customer',
    });

    expect(sale).toBeDefined();
    expect(sale.invoiceNumber).toMatch(/^WTL-\d{6}-\d{5}$/);
    expect(sale.items).toHaveLength(1);
    expect(sale.items[0].quantity).toBe(2);
    expect(sale.items[0].purchaseCost).toBe(testPurchasePrice); // Historical snapshot verified
    expect(sale.items[0].lineTotal).toBe(testSellingPrice * 2);

    // Verify product stock in DB was decremented to 3
    const updatedProd = await Product.findById(testProductId);
    expect(updatedProd?.stockQuantity).toBe(3);

    // Verify stock adjustment audit log was created
    const adjustments = await StockAdjustment.find({ productId: new Types.ObjectId(testProductId), reason: 'SALE' });
    expect(adjustments.length).toBeGreaterThanOrEqual(1);
  });

  it('enforces idempotency: duplicate submission returns existing sale without double-decrementing stock', async () => {
    const idempotencyKey = `idemp-test-${Date.now()}`;

    // First submission
    const firstSale = await createSale({
      idempotencyKey,
      items: [{ productId: testProductId, quantity: 1 }],
      paymentMethod: 'upi',
    });

    expect(firstSale).toBeDefined();

    // Verify stock is now 2
    let prod = await Product.findById(testProductId);
    expect(prod?.stockQuantity).toBe(2);

    // Second submission with exact same idempotencyKey
    const duplicateSale = await createSale({
      idempotencyKey,
      items: [{ productId: testProductId, quantity: 1 }],
      paymentMethod: 'upi',
    });

    expect(duplicateSale._id?.toString()).toBe(firstSale._id?.toString());
    expect(duplicateSale.invoiceNumber).toBe(firstSale.invoiceNumber);

    // Verify stock was NOT decremented a second time!
    prod = await Product.findById(testProductId);
    expect(prod?.stockQuantity).toBe(2);
  });

  it('rejects sale when requested quantity exceeds available stock and preserves inventory', async () => {
    // Current stock is 2. Attempting to purchase 5 must fail!
    await expect(
      createSale({
        items: [{ productId: testProductId, quantity: 5 }],
        paymentMethod: 'cash',
      })
    ).rejects.toThrow(/Insufficient stock/);

    // Stock must remain unchanged at 2
    const prod = await Product.findById(testProductId);
    expect(prod?.stockQuantity).toBe(2);
  });
});
