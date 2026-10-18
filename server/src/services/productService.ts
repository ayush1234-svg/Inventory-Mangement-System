import mongoose from 'mongoose';
type FilterQuery<T> = Record<string, any>;
import { IProduct, Product } from '../models/Product.js';
import { StockAdjustment } from '../models/StockAdjustment.js';

export interface ProductQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  stockStatus?: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock' | 'archived';
  sortBy?: 'name' | 'sellingPrice' | 'stockQuantity' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export async function getProducts(params: ProductQueryParams) {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 20));
  const skip = (page - 1) * limit;

  const query: FilterQuery<IProduct> = {};

  // Status filtering
  if (params.stockStatus === 'archived') {
    query.isArchived = true;
  } else {
    query.isArchived = false;

    if (params.stockStatus === 'in_stock') {
      query.$expr = { $gt: ['$stockQuantity', '$lowStockThreshold'] };
    } else if (params.stockStatus === 'low_stock') {
      query.$expr = {
        $and: [
          { $gt: ['$stockQuantity', 0] },
          { $lte: ['$stockQuantity', '$lowStockThreshold'] },
        ],
      };
    } else if (params.stockStatus === 'out_of_stock') {
      query.stockQuantity = 0;
    }
  }

  // Category filter
  if (params.category && params.category.trim() !== '' && params.category !== 'All') {
    query.category = params.category.trim();
  }

  // Search filter (name, brand, model)
  if (params.search && params.search.trim() !== '') {
    const searchRegex = new RegExp(params.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    query.$or = [
      { name: searchRegex },
      { brand: searchRegex },
      { model: searchRegex },
    ];
  }

  const sortField = params.sortBy || 'createdAt';
  const sortDirection = params.sortOrder === 'asc' ? 1 : -1;
  const sortOptions: Record<string, 1 | -1> = { [sortField]: sortDirection };

  const [products, totalCount] = await Promise.all([
    Product.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean(),
    Product.countDocuments(query),
  ]);

  return {
    products,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit) || 1,
    },
  };
}

export async function getProductById(id: string): Promise<IProduct | null> {
  return Product.findById(id).lean();
}

export async function createProduct(data: Partial<IProduct>, userId?: string): Promise<IProduct> {
  const product = new Product(data);
  await product.save();

  // If initial stock > 0, log an initial stock entry
  if (product.stockQuantity > 0) {
    await StockAdjustment.create({
      productId: product._id,
      productName: product.name,
      previousQuantity: 0,
      newQuantity: product.stockQuantity,
      quantityChange: product.stockQuantity,
      reason: 'RESTOCK',
      note: 'Initial inventory stock on creation',
      userId: userId ? new mongoose.Types.ObjectId(userId) : undefined,
    });
  }

  return product;
}

export async function updateProduct(id: string, data: Partial<IProduct>): Promise<IProduct | null> {
  // Prevent direct modification of stockQuantity via general update (must use adjustStock API)
  const { stockQuantity, ...allowedUpdates } = data as any;

  const product = await Product.findByIdAndUpdate(id, allowedUpdates, {
    returnDocument: 'after',
    runValidators: true,
  });

  return product;
}

export async function adjustProductStock(
  productId: string,
  quantityChange: number,
  reason: 'RESTOCK' | 'MANUAL_CORRECTION' | 'DAMAGE_WRITE_OFF',
  note?: string,
  userId?: string
): Promise<{ product: IProduct; adjustment: any }> {
  const product = await Product.findById(productId);
  if (!product) {
    const error: any = new Error('Product not found');
    error.statusCode = 404;
    throw error;
  }

  const previousQuantity = product.stockQuantity;
  const newQuantity = previousQuantity + quantityChange;

  if (newQuantity < 0) {
    const error: any = new Error(
      `Cannot decrease stock by ${Math.abs(quantityChange)}. Current stock is ${previousQuantity}.`
    );
    error.statusCode = 400;
    throw error;
  }

  product.stockQuantity = newQuantity;
  await product.save();

  const adjustment = await StockAdjustment.create({
    productId: product._id,
    productName: product.name,
    previousQuantity,
    newQuantity,
    quantityChange,
    reason,
    note: note || '',
    userId: userId ? new mongoose.Types.ObjectId(userId) : undefined,
  });

  return { product, adjustment };
}

export async function toggleArchiveProduct(productId: string): Promise<IProduct | null> {
  const product = await Product.findById(productId);
  if (!product) {
    const error: any = new Error('Product not found');
    error.statusCode = 404;
    throw error;
  }

  product.isArchived = !product.isArchived;
  await product.save();
  return product;
}

export async function getProductCategories(): Promise<string[]> {
  const categories = await Product.distinct('category', { isArchived: false });
  return categories.filter(Boolean).sort();
}

export async function getProductStockAdjustments(productId: string) {
  return StockAdjustment.find({ productId })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
}
