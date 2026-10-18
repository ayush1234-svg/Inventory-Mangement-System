import mongoose, { Types } from 'mongoose';
type FilterQuery<T> = Record<string, any>;
import { IProduct, Product } from '../models/Product.js';
import { ISale, ISaleItem, Sale } from '../models/Sale.js';
import { Settings } from '../models/Settings.js';
import { StockAdjustment } from '../models/StockAdjustment.js';
import { generateInvoiceNumber } from '../utils/invoice.js';
import { calculateDiscountAmount, calculateLineTotal, calculateTaxAmount } from '../utils/money.js';

export interface CreateSaleInput {
  idempotencyKey?: string;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  discountType?: 'percentage' | 'fixed' | 'none';
  discountValue?: number;
  paymentMethod: 'cash' | 'upi' | 'card' | 'other';
  customerName?: string;
  customerPhone?: string;
  notes?: string;
}

export async function createSale(input: CreateSaleInput, userId?: string): Promise<ISale> {
  // 1. Idempotency Check: if idempotencyKey is provided and sale already exists, return it
  if (input.idempotencyKey) {
    const existingSale = await Sale.findOne({ idempotencyKey: input.idempotencyKey }).lean();
    if (existingSale) {
      return existingSale as ISale;
    }
  }

  // 2. Fetch Shop Settings for tax and invoice prefix
  let settings = await Settings.findOne().lean();
  if (!settings) {
    settings = await Settings.create({});
  }

  // 3. Extract and validate unique product IDs
  const itemMap = new Map<string, number>();
  for (const item of input.items) {
    const current = itemMap.get(item.productId) || 0;
    itemMap.set(item.productId, current + item.quantity);
  }

  const productObjectIds = Array.from(itemMap.keys()).map((id) => new Types.ObjectId(id));
  const products = await Product.find({ _id: { $in: productObjectIds } });

  if (products.length !== itemMap.size) {
    const error: any = new Error('One or more requested products could not be found.');
    error.statusCode = 404;
    throw error;
  }

  // 4. Validate stock availability and archive status
  const productLookup = new Map<string, IProduct>();
  for (const prod of products) {
    if (prod.isArchived) {
      const error: any = new Error(`Product '${prod.name}' is archived and cannot be sold.`);
      error.statusCode = 400;
      throw error;
    }

    const requestedQty = itemMap.get(prod._id.toString())!;
    if (prod.stockQuantity < requestedQty) {
      const error: any = new Error(
        `Insufficient stock for '${prod.name}'. Available: ${prod.stockQuantity}, requested: ${requestedQty}.`
      );
      error.statusCode = 400;
      throw error;
    }

    productLookup.set(prod._id.toString(), prod);
  }

  // 5. Authoritatively build immutable line items and monetary amounts
  let subtotal = 0;
  const lineItems: ISaleItem[] = [];

  for (const [prodId, qty] of itemMap.entries()) {
    const prod = productLookup.get(prodId)!;
    const unitPrice = prod.sellingPrice;
    const purchaseCost = prod.purchasePrice; // Captured snapshot for gross profit!
    const lineTotal = calculateLineTotal(unitPrice, qty);

    subtotal += lineTotal;

    lineItems.push({
      productId: prod._id as Types.ObjectId,
      name: prod.name,
      brand: prod.brand,
      model: prod.model || '',
      storage: prod.storage || '',
      color: prod.color || '',
      unitPrice,
      purchaseCost,
      quantity: qty,
      lineTotal,
    });
  }

  // 6. Calculate discounts, taxes, and final payable amount (all in paise)
  const discountType = input.discountType || 'none';
  const discountValue = input.discountValue || 0;
  const discountAmount = calculateDiscountAmount(subtotal, discountType, discountValue);

  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxRate = settings.taxEnabled ? settings.taxRate : 0;
  const taxAmount = settings.taxEnabled ? calculateTaxAmount(taxableAmount, taxRate) : 0;
  const finalAmount = taxableAmount + taxAmount;

  // 7. Execute Atomic Inventory Decrement & Sale Creation
  // We first try a session transaction (Atlas / Replica set).
  // If not supported in the running environment, we use atomic conditional decrements with compensation rollback.
  let isTransactionSupported = true;
  let session: mongoose.ClientSession | null = null;

  try {
    session = await mongoose.startSession();
    session.startTransaction();
  } catch (err: any) {
    isTransactionSupported = false;
    session = null;
  }

  if (isTransactionSupported && session) {
    try {
      const invoiceNumber = await generateInvoiceNumber(Sale, settings.invoicePrefix);

      // Decrement stock conditionally inside transaction
      for (const item of lineItems) {
        const updated = await Product.findOneAndUpdate(
          {
            _id: item.productId,
            stockQuantity: { $gte: item.quantity },
            isArchived: false,
          },
          { $inc: { stockQuantity: -item.quantity } },
          { session, returnDocument: 'after' }
        );

        if (!updated) {
          throw new Error(`Stock verification failed for product: ${item.name}. Transaction aborted.`);
        }
      }

      const sale = new Sale({
        invoiceNumber,
        idempotencyKey: input.idempotencyKey,
        items: lineItems,
        subtotal,
        discountType,
        discountValue,
        discountAmount,
        taxRate,
        taxAmount,
        finalAmount,
        paymentMethod: input.paymentMethod,
        customerName: input.customerName || '',
        customerPhone: input.customerPhone || '',
        status: 'completed',
        createdBy: userId ? new Types.ObjectId(userId) : undefined,
        notes: input.notes || '',
      });

      await sale.save({ session });

      // Record stock adjustment audit entries
      for (const item of lineItems) {
        const prod = productLookup.get(item.productId.toString())!;
        await StockAdjustment.create(
          [
            {
              productId: item.productId,
              productName: item.name,
              previousQuantity: prod.stockQuantity,
              newQuantity: prod.stockQuantity - item.quantity,
              quantityChange: -item.quantity,
              reason: 'SALE',
              saleId: sale._id,
              userId: userId ? new Types.ObjectId(userId) : undefined,
            },
          ],
          { session }
        );
      }

      await session.commitTransaction();
      return sale;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } else {
    // Standalone fallback: Atomic conditional decrements with automated compensation rollback
    const decrementedItems: Array<{ productId: Types.ObjectId; quantity: number }> = [];

    try {
      for (const item of lineItems) {
        const updated = await Product.findOneAndUpdate(
          {
            _id: item.productId,
            stockQuantity: { $gte: item.quantity },
            isArchived: false,
          },
          { $inc: { stockQuantity: -item.quantity } },
          { returnDocument: 'after' }
        );

        if (!updated) {
          throw new Error(
            `Stock verification failed for product: ${item.name}. Stock was modified concurrently.`
          );
        }

        decrementedItems.push({ productId: item.productId, quantity: item.quantity });
      }

      const invoiceNumber = await generateInvoiceNumber(Sale, settings.invoicePrefix);

      const sale = new Sale({
        invoiceNumber,
        idempotencyKey: input.idempotencyKey,
        items: lineItems,
        subtotal,
        discountType,
        discountValue,
        discountAmount,
        taxRate,
        taxAmount,
        finalAmount,
        paymentMethod: input.paymentMethod,
        customerName: input.customerName || '',
        customerPhone: input.customerPhone || '',
        status: 'completed',
        createdBy: userId ? new Types.ObjectId(userId) : undefined,
        notes: input.notes || '',
      });

      await sale.save();

      // Record audit adjustments
      for (const item of lineItems) {
        const prod = productLookup.get(item.productId.toString())!;
        await StockAdjustment.create({
          productId: item.productId,
          productName: item.name,
          previousQuantity: prod.stockQuantity,
          newQuantity: prod.stockQuantity - item.quantity,
          quantityChange: -item.quantity,
          reason: 'SALE',
          saleId: sale._id,
          userId: userId ? new Types.ObjectId(userId) : undefined,
        });
      }

      return sale;
    } catch (error) {
      // Rollback any successfully decremented items in this failed batch
      for (const reverted of decrementedItems) {
        await Product.updateOne(
          { _id: reverted.productId },
          { $inc: { stockQuantity: reverted.quantity } }
        );
      }
      throw error;
    }
  }
}

export interface SalesQueryParams {
  page?: number;
  limit?: number;
  invoiceNumber?: string;
  paymentMethod?: 'all' | 'cash' | 'upi' | 'card' | 'other';
  startDate?: string;
  endDate?: string;
}

export async function getSales(params: SalesQueryParams) {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 20));
  const skip = (page - 1) * limit;

  const query: FilterQuery<ISale> = {};

  if (params.paymentMethod && params.paymentMethod !== 'all') {
    query.paymentMethod = params.paymentMethod;
  }

  if (params.invoiceNumber && params.invoiceNumber.trim() !== '') {
    query.invoiceNumber = new RegExp(params.invoiceNumber.trim(), 'i');
  }

  if (params.startDate || params.endDate) {
    query.date = {};
    if (params.startDate) {
      const start = new Date(params.startDate);
      start.setHours(0, 0, 0, 0);
      query.date.$gte = start;
    }
    if (params.endDate) {
      const end = new Date(params.endDate);
      end.setHours(23, 59, 59, 999);
      query.date.$lte = end;
    }
  }

  const [sales, totalCount] = await Promise.all([
    Sale.find(query).sort({ date: -1 }).skip(skip).limit(limit).lean(),
    Sale.countDocuments(query),
  ]);

  return {
    sales,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit) || 1,
    },
  };
}

export async function getSaleById(id: string): Promise<ISale | null> {
  return Sale.findById(id).lean();
}
