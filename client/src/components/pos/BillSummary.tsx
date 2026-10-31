import React, { useState } from 'react';
import { CreditCard, IndianRupee, QrCode, Tag, UserCheck, Wallet } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext.js';
import { formatCurrency, paiseToRupees, rupeesToPaise } from '../../utils/format.js';
import { Button } from '../common/Button.js';
import { Input } from '../common/Input.js';

interface BillSummaryProps {
  subtotalPaise: number;
  discountType: 'percentage' | 'fixed' | 'none';
  discountValue: number;
  onDiscountChange: (type: 'percentage' | 'fixed' | 'none', value: number) => void;
  paymentMethod: 'cash' | 'upi' | 'card' | 'other';
  onPaymentMethodChange: (method: 'cash' | 'upi' | 'card' | 'other') => void;
  customerName: string;
  onCustomerNameChange: (val: string) => void;
  customerPhone: string;
  onCustomerPhoneChange: (val: string) => void;
  onCompleteSale: () => void;
  isSubmitting: boolean;
  itemCount: number;
}

export const BillSummary: React.FC<BillSummaryProps> = ({
  subtotalPaise,
  discountType,
  discountValue,
  onDiscountChange,
  paymentMethod,
  onPaymentMethodChange,
  customerName,
  onCustomerNameChange,
  customerPhone,
  onCustomerPhoneChange,
  onCompleteSale,
  isSubmitting,
  itemCount,
}) => {
  const { settings } = useSettings();
  const [showCustomerFields, setShowCustomerFields] = useState(false);

  // Calculations
  let discountAmountPaise = 0;
  if (discountType === 'percentage') {
    discountAmountPaise = Math.round((subtotalPaise * Math.min(100, Math.max(0, discountValue))) / 100);
  } else if (discountType === 'fixed') {
    discountAmountPaise = Math.min(subtotalPaise, Math.max(0, discountValue));
  }

  const taxableAmountPaise = Math.max(0, subtotalPaise - discountAmountPaise);
  const taxRate = settings?.taxEnabled ? settings.taxRate : 0;
  const taxAmountPaise = settings?.taxEnabled
    ? Math.round((taxableAmountPaise * taxRate) / 100)
    : 0;

  const finalAmountPaise = taxableAmountPaise + taxAmountPaise;

  const paymentButtons: Array<{
    id: 'cash' | 'upi' | 'card' | 'other';
    label: string;
    icon: React.ReactNode;
  }> = [
    { id: 'cash', label: 'Cash', icon: <IndianRupee className="w-4 h-4" /> },
    { id: 'upi', label: 'UPI / QR', icon: <QrCode className="w-4 h-4" /> },
    { id: 'card', label: 'Card', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'other', label: 'Other', icon: <Wallet className="w-4 h-4" /> },
  ];

  return (
    <div className="flex flex-col bg-slate-50 border-t border-slate-200 p-4 space-y-3.5 select-none">
      {/* Customer Quick Toggle */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setShowCustomerFields(!showCustomerFields)}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 focus:outline-none"
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>{showCustomerFields ? 'Hide Customer Details' : '+ Add Customer Details (Optional)'}</span>
        </button>
      </div>

      {showCustomerFields && (
        <div className="grid grid-cols-1 gap-2 pt-1 animate-in fade-in duration-150 sm:grid-cols-2">
          <Input
            placeholder="Customer Name"
            value={customerName}
            onChange={(e) => onCustomerNameChange(e.target.value)}
            className="text-xs py-1.5"
          />
          <Input
            placeholder="Phone Number"
            type="tel"
            value={customerPhone}
            onChange={(e) => onCustomerPhoneChange(e.target.value)}
            className="text-xs py-1.5"
          />
        </div>
      )}

      {/* Discount Row */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
          <Tag className="w-3.5 h-3.5 text-slate-400" />
          <span>Discount</span>
        </div>

        <div className="flex items-center gap-1.5">
          <select
            value={discountType}
            onChange={(e) => onDiscountChange(e.target.value as any, discountValue)}
            className="text-xs border border-slate-300 rounded-md bg-white px-2 py-1 text-slate-700 focus:outline-none"
          >
            <option value="none">None</option>
            <option value="percentage">% Off</option>
            <option value="fixed">Fixed ₹</option>
          </select>

          {discountType !== 'none' && (
            <input
              type="number"
              min="0"
              max={discountType === 'percentage' ? 100 : paiseToRupees(subtotalPaise)}
              placeholder="0"
              value={discountType === 'percentage' ? discountValue : paiseToRupees(discountValue) || ''}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 0;
                onDiscountChange(
                  discountType,
                  discountType === 'percentage' ? val : rupeesToPaise(val)
                );
              }}
              className="w-16 text-xs text-right border border-slate-300 rounded-md bg-white px-2 py-1 font-semibold focus:outline-none focus:border-indigo-600"
            />
          )}
        </div>
      </div>

      {/* Monetary Totals Breakdown */}
      <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-200/80 pt-2.5">
        <div className="flex justify-between">
          <span>Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
          <span className="font-medium text-slate-900">{formatCurrency(subtotalPaise)}</span>
        </div>

        {discountAmountPaise > 0 && (
          <div className="flex justify-between text-emerald-600">
            <span>Discount Applied</span>
            <span>- {formatCurrency(discountAmountPaise)}</span>
          </div>
        )}

        {settings?.taxEnabled && (
          <div className="flex justify-between">
            <span>{settings.taxName} ({settings.taxRate}%)</span>
            <span className="font-medium text-slate-900">{formatCurrency(taxAmountPaise)}</span>
          </div>
        )}

        <div className="flex items-baseline justify-between pt-2 border-t border-slate-200 text-slate-900 font-bold">
          <span className="text-sm">Final Payable</span>
          <span className="text-xl font-extrabold text-indigo-700 tracking-tight">
            {formatCurrency(finalAmountPaise)}
          </span>
        </div>
      </div>

      {/* Payment Method Selector */}
      <div className="space-y-1 pt-1">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
          Payment Method
        </span>
        <div className="grid grid-cols-4 gap-1.5">
          {paymentButtons.map((btn) => (
            <button
              key={btn.id}
              type="button"
              onClick={() => onPaymentMethodChange(btn.id)}
              className={`flex flex-col items-center justify-center p-2 rounded-md border text-xs font-semibold transition-all ${
                paymentMethod === btn.id
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
              }`}
            >
              {btn.icon}
              <span className="mt-1 text-[11px]">{btn.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Complete Sale Action */}
      <Button
        variant="primary"
        size="lg"
        onClick={onCompleteSale}
        isLoading={isSubmitting}
        disabled={itemCount === 0 || isSubmitting}
        className="w-full text-sm font-semibold tracking-wide py-3 shadow-md"
      >
        Complete Sale ({formatCurrency(finalAmountPaise)})
      </Button>
    </div>
  );
};
