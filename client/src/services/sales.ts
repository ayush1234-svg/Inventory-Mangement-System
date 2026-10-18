import { Sale } from '../types/index.js';
import { apiRequest } from './api.js';

export interface CreateSalePayload {
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

export interface SalesHistoryResponse {
  success: boolean;
  data: Sale[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}

export async function createSale(payload: CreateSalePayload): Promise<{ data: Sale; message: string }> {
  return apiRequest('/sales', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchSales(params: {
  page?: number;
  limit?: number;
  invoiceNumber?: string;
  paymentMethod?: string;
  startDate?: string;
  endDate?: string;
}): Promise<SalesHistoryResponse> {
  return apiRequest('/sales', { params });
}

export async function fetchSaleById(id: string): Promise<{ data: Sale }> {
  return apiRequest(`/sales/${id}`);
}
