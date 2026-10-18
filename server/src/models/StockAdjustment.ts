import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface IStockAdjustment extends Document {
  productId: Types.ObjectId;
  productName: string;
  previousQuantity: number;
  newQuantity: number;
  quantityChange: number;
  reason: 'RESTOCK' | 'MANUAL_CORRECTION' | 'DAMAGE_WRITE_OFF' | 'SALE';
  saleId?: Types.ObjectId;
  note?: string;
  userId?: Types.ObjectId;
  createdAt: Date;
}

const stockAdjustmentSchema = new Schema<IStockAdjustment>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    productName: {
      type: String,
      required: true,
    },
    previousQuantity: {
      type: Number,
      required: true,
      min: 0,
    },
    newQuantity: {
      type: Number,
      required: true,
      min: 0,
    },
    quantityChange: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      enum: ['RESTOCK', 'MANUAL_CORRECTION', 'DAMAGE_WRITE_OFF', 'SALE'],
      required: true,
      index: true,
    },
    saleId: {
      type: Schema.Types.ObjectId,
      ref: 'Sale',
    },
    note: {
      type: String,
      trim: true,
      default: '',
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

stockAdjustmentSchema.index({ productId: 1, createdAt: -1 });

export const StockAdjustment: Model<IStockAdjustment> =
  mongoose.models.StockAdjustment ||
  mongoose.model<IStockAdjustment>('StockAdjustment', stockAdjustmentSchema);
