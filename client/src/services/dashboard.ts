import { DashboardSummary, Product, Sale, SalesTimelineItem } from '../types/index.js';
import { apiRequest } from './api.js';

export async function fetchDashboardSummary(): Promise<{ data: DashboardSummary }> {
  return apiRequest('/dashboard/summary');
}

export async function fetchSalesOverview(days = 7): Promise<{ data: SalesTimelineItem[] }> {
  return apiRequest('/dashboard/sales-overview', { params: { days } });
}

export async function fetchLowStockProducts(limit = 10): Promise<{ data: Product[] }> {
  return apiRequest('/dashboard/low-stock', { params: { limit } });
}

export async function fetchRecentSales(limit = 5): Promise<{ data: Sale[] }> {
  return apiRequest('/dashboard/recent-sales', { params: { limit } });
}
