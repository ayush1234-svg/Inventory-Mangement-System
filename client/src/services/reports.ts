import { ReportData } from '../types/index.js';
import { apiRequest } from './api.js';

export async function fetchReports(params: {
  preset?: string;
  startDate?: string;
  endDate?: string;
}): Promise<{ data: ReportData }> {
  return apiRequest('/reports', { params });
}
