import { ShopSettings } from '../types/index.js';
import { apiRequest } from './api.js';

export async function fetchSettings(): Promise<{ data: ShopSettings }> {
  return apiRequest('/settings');
}

export async function updateSettings(settingsData: Partial<ShopSettings>): Promise<{ data: ShopSettings; message: string }> {
  return apiRequest('/settings', {
    method: 'PATCH',
    body: JSON.stringify(settingsData),
  });
}
