import mongoose, { Model, Schema } from 'mongoose';

export interface IProduct {
  _id?: mongoose.Types.ObjectId;
  name: string;
  category: string;
  brand: string;
  model?: string;
  imageUrl?: string;
  purchasePrice: number; // in paise
  sellingPrice: number;  // in paise
  stockQuantity: number;
  lowStockThreshold: number;
  isArchived: boolean;
  // Optional smartphone attributes
  storage?: string;
  color?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      index: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      index: true,
    },
    brand: {
      type: String,
      required: [true, 'Brand is required'],
      trim: true,
      index: true,
    },
    model: {
      type: String,
      trim: true,
      default: '',
    },
    imageUrl: {
      type: String,
      trim: true,
      default: '',
    },
    purchasePrice: {
      type: Number,
      required: [true, 'Purchase price is required'],
      min: [0, 'Purchase price cannot be negative'],
    },
    sellingPrice: {
      type: Number,
      required: [true, 'Selling price is required'],
      min: [0, 'Selling price cannot be negative'],
    },
    stockQuantity: {
      type: Number,
      required: [true, 'Stock quantity is required'],
      min: [0, 'Stock quantity cannot be negative'],
      default: 0,
      validate: {
        validator: Number.isInteger,
        message: 'Stock quantity must be an integer',
      },
    },
    lowStockThreshold: {
      type: Number,
      min: [0, 'Threshold cannot be negative'],
      default: 5,
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
    storage: {
      type: String,
      trim: true,
      default: '',
    },
    color: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for optimal search and filtering
productSchema.index({ name: 'text', brand: 'text', model: 'text' });
productSchema.index({ isArchived: 1, category: 1, name: 1 });
productSchema.index({ isArchived: 1, stockQuantity: 1 });
productSchema.index({ isArchived: 1, lowStockThreshold: 1 });

export const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>('Product', productSchema);
