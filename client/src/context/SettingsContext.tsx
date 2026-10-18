import React, { createContext, useContext, useEffect, useState } from 'react';
import * as settingsService from '../services/settings.js';
import { ShopSettings } from '../types/index.js';

interface SettingsContextType {
  settings: ShopSettings | null;
  isLoading: boolean;
  refreshSettings: () => Promise<void>;
  updateSettings: (data: Partial<ShopSettings>) => Promise<void>;
}

const defaultSettings: ShopSettings = {
  shopName: 'WTL Mobile & Accessories',
  tagline: 'Smartphones • Audio • Accessories',
  address: 'Shop No. 12, Main Market',
  contactNumber: '+91 98765 43210',
  currency: 'INR',
  currencySymbol: '₹',
  taxEnabled: true,
  taxName: 'GST',
  taxRate: 18,
  invoicePrefix: 'WTL-',
  defaultLowStockThreshold: 5,
  invoiceFooterNote: 'Thank you for shopping with us! No warranty on physical damage.',
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<ShopSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSettings = async () => {
    try {
      const res = await settingsService.fetchSettings();
      if (res?.data) {
        setSettings(res.data);
      }
    } catch (err) {
      console.error('Failed to load shop settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshSettings();
  }, []);

  const updateSettings = async (data: Partial<ShopSettings>) => {
    const res = await settingsService.updateSettings(data);
    if (res?.data) {
      setSettings(res.data);
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        isLoading,
        refreshSettings,
        updateSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
