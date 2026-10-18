import { z } from 'zod';

export const createSaleItemSchema = z.object({
  productId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
});

export const createSaleSchema = z.object({
  idempotencyKey: z.string().min(8).max(100).optional(),
  items: z.array(createSaleItemSchema).min(1, 'At least one item is required in the sale'),
  discountType: z.enum(['percentage', 'fixed', 'none']).default('none'),
  discountValue: z.number().min(0).default(0),
  paymentMethod: z.enum(['cash', 'upi', 'card', 'other']),
  customerName: z.string().max(100).optional().default(''),
  customerPhone: z.string().max(20).optional().default(''),
  notes: z.string().max(300).optional().default(''),
});

export const salesQuerySchema = z.object({
  page: z.string().optional().transform((v) => (v ? Math.max(1, parseInt(v, 10)) : 1)),
  limit: z.string().optional().transform((v) => (v ? Math.min(100, Math.max(1, parseInt(v, 10))) : 20)),
  invoiceNumber: z.string().optional().default(''),
  paymentMethod: z.enum(['all', 'cash', 'upi', 'card', 'other']).optional().default('all'),
  startDate: z.string().optional().default(''),
  endDate: z.string().optional().default(''),
});
