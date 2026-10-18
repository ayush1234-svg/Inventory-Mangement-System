import React from 'react';
import { CheckCircle2, Download, Plus, Printer, X } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext.js';
import { Sale } from '../../types/index.js';
import { formatCurrency, formatDateTime, formatPaymentMethod } from '../../utils/format.js';
import { Button } from '../common/Button.js';

interface InvoiceModalProps {
  sale: Sale | null;
  isOpen: boolean;
  onClose: () => void;
  onStartNewBill: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  sale,
  isOpen,
  onClose,
  onStartNewBill,
}) => {
  const { settings } = useSettings();

  if (!isOpen || !sale) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs no-print"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Invoice Container */}
      <div className="relative w-full max-w-xl rounded-xl bg-white shadow-2xl border border-slate-200 z-10 my-auto overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Header (Excluded in Print) */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-900 text-white no-print">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-semibold">Sale Completed Successfully</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              icon={<Printer className="w-3.5 h-3.5" />}
              className="bg-slate-800 text-white border-slate-700 hover:bg-slate-700 hover:text-white"
            >
              Print / Save PDF
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={onStartNewBill}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              New Bill
            </Button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-md transition-colors ml-1"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE RETAIL INVOICE BODY */}
        <div
          id="invoice-printable-area"
          className="p-8 overflow-y-auto text-slate-800 font-sans print:p-0 print:m-0 print:text-black"
        >
          {/* Shop Header */}
          <div className="text-center pb-4 border-b border-slate-200">
            <h2 className="text-xl font-extrabold uppercase tracking-tight text-slate-900 print:text-black">
              {settings?.shopName || 'WTL Mobile & Accessories'}
            </h2>
            {settings?.tagline && (
              <p className="text-xs text-slate-500 print:text-gray-600 mt-0.5">{settings.tagline}</p>
            )}
            <p className="text-xs text-slate-600 print:text-gray-700 mt-1">{settings?.address}</p>
            <p className="text-xs text-slate-600 print:text-gray-700">
              Tel: {settings?.contactNumber} {settings?.email && `• ${settings.email}`}
            </p>
            {settings?.gstin && (
              <p className="text-xs font-semibold text-slate-700 print:text-black mt-1">
                GSTIN: {settings.gstin}
              </p>
            )}
          </div>

          {/* Invoice Meta Details */}
          <div className="grid grid-cols-2 gap-4 py-4 text-xs border-b border-slate-200">
            <div>
              <p className="text-slate-500">INVOICE NUMBER</p>
              <p className="font-bold text-sm text-slate-900 print:text-black font-mono">
                {sale.invoiceNumber}
              </p>
              <p className="text-slate-500 mt-2">DATE & TIME</p>
              <p className="font-medium text-slate-800 print:text-black">
                {formatDateTime(sale.date)}
              </p>
            </div>

            <div className="text-right">
              <p className="text-slate-500">PAYMENT METHOD</p>
              <p className="font-bold text-slate-900 print:text-black">
                {formatPaymentMethod(sale.paymentMethod)}
              </p>
              {sale.customerName && (
                <>
                  <p className="text-slate-500 mt-2">CUSTOMER</p>
                  <p className="font-semibold text-slate-900 print:text-black">
                    {sale.customerName}
                    {sale.customerPhone && ` (${sale.customerPhone})`}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Line Items Table */}
          <table className="w-full text-left text-xs my-4 border-collapse">
            <thead>
              <tr className="border-b border-slate-300 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-2 pr-2">Item</th>
                <th className="py-2 px-2 text-right">Price</th>
                <th className="py-2 px-2 text-center">Qty</th>
                <th className="py-2 pl-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sale.items.map((item, idx) => (
                <tr key={idx} className="py-2">
                  <td className="py-2.5 pr-2">
                    <span className="font-semibold text-slate-900 print:text-black block">
                      {item.name}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {item.brand}
                      {item.storage && ` • ${item.storage}`}
                      {item.color && ` • ${item.color}`}
                    </span>
                  </td>
                  <td className="py-2.5 px-2 text-right text-slate-700 print:text-black">
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td className="py-2.5 px-2 text-center font-medium text-slate-900 print:text-black">
                    {item.quantity}
                  </td>
                  <td className="py-2.5 pl-2 text-right font-semibold text-slate-900 print:text-black">
                    {formatCurrency(item.lineTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Monetary Summary */}
          <div className="border-t border-slate-300 pt-3 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span className="font-medium text-slate-900 print:text-black">
                {formatCurrency(sale.subtotal)}
              </span>
            </div>

            {sale.discountAmount > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>
                  Discount {sale.discountType === 'percentage' && `(${sale.discountValue}%)`}
                </span>
                <span className="font-medium text-rose-600 print:text-black">
                  - {formatCurrency(sale.discountAmount)}
                </span>
              </div>
            )}

            {sale.taxAmount > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>
                  {settings?.taxName || 'GST'} ({sale.taxRate}%)
                </span>
                <span className="font-medium text-slate-900 print:text-black">
                  {formatCurrency(sale.taxAmount)}
                </span>
              </div>
            )}

            <div className="flex justify-between pt-2 border-t border-slate-900 text-sm font-bold text-slate-900 print:text-black">
              <span>TOTAL AMOUNT</span>
              <span className="text-base font-extrabold">{formatCurrency(sale.finalAmount)}</span>
            </div>
          </div>

          {/* Footer Note */}
          <div className="mt-8 pt-4 border-t border-dashed border-slate-200 text-center text-[11px] text-slate-500">
            <p>{settings?.invoiceFooterNote || 'Thank you for shopping with us!'}</p>
            <p className="mt-1 text-[10px] text-slate-400">Computer Generated Retail Invoice</p>
          </div>
        </div>

        {/* Modal Bottom Actions (Excluded in Print) */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3 no-print">
          <Button
            variant="outline"
            onClick={handlePrint}
            icon={<Download className="w-4 h-4" />}
          >
            Save as PDF / Print
          </Button>
          <Button variant="primary" onClick={onStartNewBill} icon={<Plus className="w-4 h-4" />}>
            Start New Bill
          </Button>
        </div>
      </div>
    </div>
  );
};
