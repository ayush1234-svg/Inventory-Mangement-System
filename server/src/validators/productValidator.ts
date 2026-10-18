import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(150).trim(),
  category: z.string().min(1, 'Category is required').trim(),
  brand: z.string().min(1, 'Brand is required').trim(),
  model: z.string().max(100).optional().default(''),
  imageUrl: z.string().max(2000000).optional().default(''),
  purchasePrice: z.number().int().min(0, 'Purchase price must be >= 0 (in paise)'),
  sellingPrice: z.number().int().min(0, 'Selling price must be >= 0 (in paise)'),
  stockQuantity: z.number().int().min(0, 'Stock quantity must be >= 0').default(0),
  lowStockThreshold: z.number().int().min(0).default(5),
  storage: z.string().max(50).optional().default(''),
  color: z.string().max(50).optional().default(''),
});

export const updateProductSchema = createProductSchema.partial();

export const stockAdjustmentSchema = z.object({
  quantityChange: z.number().int().refine((val) => val !== 0, {
    message: 'Quantity change cannot be zero',
  }),
  reason: z.enum(['RESTOCK', 'MANUAL_CORRECTION', 'DAMAGE_WRITE_OFF']),
  note: z.string().max(255).optional().default(''),
});

export const productQuerySchema = z.object({
  page: z.string().optional().transform((v) => (v ? Math.max(1, parseInt(v, 10)) : 1)),
  limit: z.string().optional().transform((v) => (v ? Math.min(100, Math.max(1, parseInt(v, 10))) : 20)),
  search: z.string().optional().default(''),
  category: z.string().optional().default(''),
  stockStatus: z.enum(['all', 'in_stock', 'low_stock', 'out_of_stock', 'archived']).optional().default('all'),
  sortBy: z.enum(['name', 'sellingPrice', 'stockQuantity', 'createdAt']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});
