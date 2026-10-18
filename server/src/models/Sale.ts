import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface ISaleItem {
  productId: Types.ObjectId;
  name: string;
  brand: string;
  model?: string;
  storage?: string;
  color?: string;
  unitPrice: number;    // in paise
  purchaseCost: number; // in paise, captured at time of sale
  quantity: number;
  lineTotal: number;    // in paise
}

export interface ISale {
  _id?: Types.ObjectId;
  invoiceNumber: string;
  idempotencyKey?: string;
  date: Date;
  items: ISaleItem[];
  subtotal: number;       // in paise
  discountType: 'percentage' | 'fixed' | 'none';
  discountValue: number;
  discountAmount: number; // in paise
  taxRate: number;        // percentage e.g. 18 for 18% GST or 0
  taxAmount: number;      // in paise
  finalAmount: number;    // in paise
  paymentMethod: 'cash' | 'upi' | 'card' | 'other';
  customerName?: string;
  customerPhone?: string;
  status: 'completed' | 'cancelled';
  createdBy?: Types.ObjectId;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const saleItemSchema = new Schema<ISaleItem>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    brand: {
      type: String,
      required: true,
    },
    model: {
      type: String,
      default: '',
    },
    storage: {
      type: String,
      default: '',
    },
    color: {
      type: String,
      default: '',
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    purchaseCost: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: 'Quantity must be an integer',
      },
    },
    lineTotal: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const saleSchema = new Schema<ISale>(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    idempotencyKey: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      index: true,
    },
    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    items: {
      type: [saleItemSchema],
      required: true,
      validate: {
        validator: (v: ISaleItem[]) => Array.isArray(v) && v.length > 0,
        message: 'A sale must have at least one line item',
      },
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed', 'none'],
      default: 'none',
    },
    discountValue: {
      type: Number,
      default: 0,
      min: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    taxRate: {
      type: Number,
      default: 0,
      min: 0,
    },
    taxAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    finalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'upi', 'card', 'other'],
      required: true,
      index: true,
    },
    customerName: {
      type: String,
      trim: true,
      default: '',
    },
    customerPhone: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['completed', 'cancelled'],
      default: 'completed',
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for sales reporting and date range filtering
saleSchema.index({ date: -1, status: 1 });
saleSchema.index({ paymentMethod: 1, date: -1 });

export const Sale: Model<ISale> =
  mongoose.models.Sale || mongoose.model<ISale>('Sale', saleSchema);
