import { Product, StockAdjustment } from '../types/index.js';
import { apiRequest } from './api.js';

export interface ProductsResponse {
  success: boolean;
  data: Product[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}

export async function fetchProducts(params: {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  stockStatus?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}): Promise<ProductsResponse> {
  return apiRequest('/products', { params });
}

export async function fetchProductById(id: string): Promise<{ data: Product }> {
  return apiRequest(`/products/${id}`);
}

export async function createProduct(productData: Partial<Product>): Promise<{ data: Product; message: string }> {
  return apiRequest('/products', {
    method: 'POST',
    body: JSON.stringify(productData),
  });
}

export async function updateProduct(
  id: string,
  productData: Partial<Product>
): Promise<{ data: Product; message: string }> {
  return apiRequest(`/products/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(productData),
  });
}

export async function adjustProductStock(
  id: string,
  data: { quantityChange: number; reason: string; note?: string }
): Promise<{ data: Product; adjustment: StockAdjustment; message: string }> {
  return apiRequest(`/products/${id}/stock`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function toggleArchiveProduct(id: string): Promise<{ data: Product; message: string }> {
  return apiRequest(`/products/${id}/archive`, {
    method: 'PATCH',
  });
}

export async function fetchCategories(): Promise<{ data: string[] }> {
  return apiRequest('/products/categories');
}

export async function fetchStockAdjustments(id: string): Promise<{ data: StockAdjustment[] }> {
  return apiRequest(`/products/${id}/adjustments`);
}
