import { z } from 'zod';

export const updateSettingsSchema = z.object({
  shopName: z.string().min(1, 'Shop name is required').max(100).trim().optional(),
  tagline: z.string().max(150).optional(),
  address: z.string().min(1, 'Address is required').max(250).trim().optional(),
  contactNumber: z.string().min(1, 'Contact number is required').max(30).trim().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  gstin: z.string().max(30).optional().default(''),
  currency: z.string().max(10).optional().default('INR'),
  currencySymbol: z.string().max(5).optional().default('₹'),
  taxEnabled: z.boolean().optional(),
  taxName: z.string().max(20).optional().default('GST'),
  taxRate: z.number().min(0).max(100).optional(),
  invoicePrefix: z.string().min(1).max(10).trim().optional(),
  defaultLowStockThreshold: z.number().int().min(0).optional(),
  invoiceFooterNote: z.string().max(250).optional(),
});
