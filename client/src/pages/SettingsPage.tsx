import React, { useEffect, useState } from 'react';
import { Building2, FileText, Percent, Save } from 'lucide-react';
import { Button } from '../components/common/Button.js';
import { Input } from '../components/common/Input.js';
import { Spinner } from '../components/common/Spinner.js';
import { useToast } from '../components/common/Toast.js';
import { useSettings } from '../context/SettingsContext.js';
import { ShopSettings } from '../types/index.js';

export const SettingsPage: React.FC = () => {
  const { settings, isLoading, updateSettings } = useSettings();
  const { success, error } = useToast();

  const [formData, setFormData] = useState<ShopSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData({ ...settings });
    }
  }, [settings]);

  if (isLoading || !formData) {
    return <Spinner size="lg" label="Loading shop configuration..." className="h-64" />;
  }

  const handleChange = (field: keyof ShopSettings, value: any) => {
    setFormData((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    setIsSaving(true);
    try {
      await updateSettings(formData);
      success('Shop configuration updated successfully.');
    } catch (err: any) {
      error(err.message || 'Failed to update settings.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Title */}
      <div>
        <h2 className="text-lg font-bold text-slate-900">Shop Settings & Configuration</h2>
        <p className="text-xs text-slate-500">
          Configure business details, invoice identifiers, and GST/Tax rules
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Business Identity & Contact */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Building2 className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Store Profile & Invoice Header</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Shop Name"
              value={formData.shopName}
              onChange={(e) => handleChange('shopName', e.target.value)}
              placeholder="e.g. WTL Mobile & Accessories"
              required
            />

            <Input
              label="Tagline / Subheading"
              value={formData.tagline || ''}
              onChange={(e) => handleChange('tagline', e.target.value)}
              placeholder="e.g. Smartphones • Audio • Accessories"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Contact Phone Number"
              value={formData.contactNumber}
              onChange={(e) => handleChange('contactNumber', e.target.value)}
              placeholder="e.g. +91 98765 43210"
              required
            />

            <Input
              label="Store Email Address"
              type="email"
              value={formData.email || ''}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="e.g. store@wtlmobile.in"
            />
          </div>

          <Input
            label="Shop Physical Address"
            value={formData.address}
            onChange={(e) => handleChange('address', e.target.value)}
            placeholder="e.g. Shop No. 14, Galaxy Market, MG Road, Pune"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="GSTIN / Tax ID (Optional)"
              value={formData.gstin || ''}
              onChange={(e) => handleChange('gstin', e.target.value)}
              placeholder="e.g. 27AAAAA0000A1Z5"
              helperText="Displayed on customer invoices when tax is enabled"
            />

            <Input
              label="Invoice Footer Terms Note"
              value={formData.invoiceFooterNote || ''}
              onChange={(e) => handleChange('invoiceFooterNote', e.target.value)}
              placeholder="e.g. Thank you for shopping with us! No return without bill."
            />
          </div>
        </div>

        {/* Section 2: Invoicing & Default Rules */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <FileText className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Invoicing & Catalog Defaults</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Invoice Number Prefix"
              value={formData.invoicePrefix}
              onChange={(e) => handleChange('invoicePrefix', e.target.value)}
              placeholder="e.g. WTL-"
              helperText="Prefix before YYYYMM-XXXXX"
              required
            />

            <Input
              label="Currency Code"
              value={formData.currency}
              onChange={(e) => handleChange('currency', e.target.value)}
              placeholder="INR"
              disabled
              helperText="Default currency is INR"
            />

            <Input
              label="Default Low-Stock Threshold"
              type="number"
              min="0"
              value={formData.defaultLowStockThreshold}
              onChange={(e) =>
                handleChange('defaultLowStockThreshold', parseInt(e.target.value, 10) || 5)
              }
              helperText="Default alert level for newly created items"
            />
          </div>
        </div>

        {/* Section 3: Tax / GST Settings */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Percent className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">Tax & GST Configuration</h3>
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formData.taxEnabled}
                onChange={(e) => handleChange('taxEnabled', e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
              <span className="text-xs font-semibold text-slate-700">Enable Tax Calculation</span>
            </label>
          </div>

          {formData.taxEnabled ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in duration-150">
              <Input
                label="Tax Name Label"
                value={formData.taxName}
                onChange={(e) => handleChange('taxName', e.target.value)}
                placeholder="e.g. GST"
                helperText="Tax name displayed on customer bills"
              />

              <Input
                label="Applicable Tax Rate (%)"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={formData.taxRate}
                onChange={(e) => handleChange('taxRate', parseFloat(e.target.value) || 0)}
                suffixText="%"
                helperText="Standard rate applied on taxable total"
              />
            </div>
          ) : (
            <p className="text-xs text-slate-500">
              Tax is currently disabled. Invoices will not display tax breakdown lines.
            </p>
          )}
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSaving}
            icon={<Save className="w-4 h-4" />}
            className="shadow-sm font-semibold px-6"
          >
            Save All Settings
          </Button>
        </div>
      </form>
    </div>
  );
};
