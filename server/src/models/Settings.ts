import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ISettings extends Document {
  shopName: string;
  tagline?: string;
  address: string;
  contactNumber: string;
  email?: string;
  gstin?: string;
  currency: string;
  currencySymbol: string;
  taxEnabled: boolean;
  taxName: string;
  taxRate: number; // percentage (e.g. 18 for 18% GST)
  invoicePrefix: string;
  defaultLowStockThreshold: number;
  invoiceFooterNote: string;
  updatedAt: Date;
}

const settingsSchema = new Schema<ISettings>(
  {
    shopName: {
      type: String,
      required: true,
      default: 'WTL Mobile & Accessories',
      trim: true,
    },
    tagline: {
      type: String,
      default: 'Smartphones • Audio • Accessories',
      trim: true,
    },
    address: {
      type: String,
      default: 'Shop No. 12, Main Market, City Center',
      trim: true,
    },
    contactNumber: {
      type: String,
      default: '+91 98765 43210',
      trim: true,
    },
    email: {
      type: String,
      default: 'contact@wtlmobile.com',
      trim: true,
    },
    gstin: {
      type: String,
      default: '',
      trim: true,
    },
    currency: {
      type: String,
      default: 'INR',
      trim: true,
    },
    currencySymbol: {
      type: String,
      default: '₹',
      trim: true,
    },
    taxEnabled: {
      type: Boolean,
      default: false,
    },
    taxName: {
      type: String,
      default: 'GST',
      trim: true,
    },
    taxRate: {
      type: Number,
      default: 18,
      min: 0,
      max: 100,
    },
    invoicePrefix: {
      type: String,
      default: 'WTL-',
      trim: true,
    },
    defaultLowStockThreshold: {
      type: Number,
      default: 5,
      min: 0,
    },
    invoiceFooterNote: {
      type: String,
      default: 'Thank you for shopping with us! No warranty on physical damage.',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Settings: Model<ISettings> =
  mongoose.models.Settings || mongoose.model<ISettings>('Settings', settingsSchema);
