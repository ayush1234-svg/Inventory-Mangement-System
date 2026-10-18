import React from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, Download, Plus, Printer, X } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext.js';
import { Sale } from '../../types/index.js';
import { amountInWords, formatCurrency, formatDateTime, formatPaymentMethod } from '../../utils/format.js';
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

  const totalQuantity = sale.items.reduce((sum, item) => sum + item.quantity, 0);
  const halfTaxPaise = Math.round(sale.taxAmount / 2);
  const otherHalfTaxPaise = sale.taxAmount - halfTaxPaise;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto invoice-modal-portal">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs no-print"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Invoice Container */}
      <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-slate-200 z-10 my-auto overflow-hidden flex flex-col max-h-[94vh] invoice-modal-content">
        {/* Modal Top Header (Excluded in Print) */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-900 text-white no-print shrink-0">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-semibold tracking-wide">Sale Completed Successfully</span>
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
              className="p-1.5 text-slate-400 hover:text-white rounded-md transition-colors ml-1 cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE RETAIL INVOICE BODY - MODERN MINIMAL CLEAN */}
        <div
          id="invoice-printable-area"
          className="p-8 sm:p-10 overflow-y-auto text-slate-800 font-sans print:p-8 print:m-0 print:text-black print:overflow-visible print:bg-white"
        >
          {/* Top Brand & Invoice Title */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b border-slate-200 print:border-gray-300">
            {/* Store Information */}
            <div className="space-y-1">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 print:text-black">
                {settings?.shopName || 'WTL Mobile & Accessories'}
              </h2>
              {settings?.tagline && (
                <p className="text-xs font-medium text-slate-500 print:text-gray-600">
                  {settings.tagline}
                </p>
              )}
              <p className="text-xs text-slate-500 print:text-gray-600 max-w-sm leading-relaxed pt-0.5">
                {settings?.address}
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 print:text-gray-600 pt-1">
                {settings?.contactNumber && <span>Tel: {settings.contactNumber}</span>}
                {settings?.email && <span>Email: {settings.email}</span>}
                {settings?.gstin && (
                  <span className="font-mono text-slate-600 print:text-black">
                    GSTIN: {settings.gstin}
                  </span>
                )}
              </div>
            </div>

            {/* Invoice Meta */}
            <div className="text-left sm:text-right shrink-0">
              <span className="text-2xl sm:text-3xl font-light tracking-widest text-slate-900 uppercase print:text-black block">
                INVOICE
              </span>
              <p className="font-mono text-sm font-semibold text-slate-700 print:text-black mt-1">
                #{sale.invoiceNumber}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {formatDateTime(sale.date)}
              </p>
              <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 print:border-gray-400 print:bg-transparent print:text-black">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Paid via {formatPaymentMethod(sale.paymentMethod)}</span>
              </div>
            </div>
          </div>

          {/* Billed To & Transaction Details */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 py-6 border-b border-slate-100 print:border-gray-200 text-xs">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Billed To
              </span>
              <p className="font-semibold text-slate-900 text-sm print:text-black">
                {sale.customerName || 'Walk-in Retail Customer'}
              </p>
              {sale.customerPhone ? (
                <p className="text-slate-500 print:text-gray-600 mt-0.5">
                  {sale.customerPhone}
                </p>
              ) : (
                <p className="text-slate-400 mt-0.5">Direct Retail</p>
              )}
            </div>

            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Payment Method
              </span>
              <p className="font-semibold text-slate-800 print:text-black">
                {formatPaymentMethod(sale.paymentMethod)}
              </p>
              <p className="text-slate-500 print:text-gray-600 mt-0.5">
                Status: Completed
              </p>
            </div>

            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Total Units
              </span>
              <p className="font-semibold text-slate-800 print:text-black">
                {totalQuantity} {totalQuantity === 1 ? 'item' : 'items'}
              </p>
              <p className="text-slate-500 print:text-gray-600 mt-0.5">
                Place of Supply: State (27)
              </p>
            </div>
          </div>

          {/* Minimalist Items Table */}
          <div className="py-2">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider text-[10px] print:border-gray-300">
                  <th className="py-3 px-1 w-8 text-center">#</th>
                  <th className="py-3 px-3">Item</th>
                  <th className="py-3 px-3 text-right w-24">Price</th>
                  <th className="py-3 px-3 text-center w-16">Qty</th>
                  <th className="py-3 px-3 text-right w-28">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 print:divide-gray-200">
                {sale.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-1 text-center text-slate-400 font-mono text-xs">
                      {idx + 1}
                    </td>
                    <td className="py-3.5 px-3">
                      <p className="font-semibold text-slate-900 print:text-black text-sm">
                        {item.name}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {item.brand}
                        {item.storage && ` • ${item.storage}`}
                        {item.color && ` • ${item.color}`}
                      </p>
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono text-slate-600 print:text-black">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono font-medium text-slate-800 print:text-black">
                      {item.quantity}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono font-semibold text-slate-900 print:text-black">
                      {formatCurrency(item.lineTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financials & Summary (Clean Minimal - No Terms & Conditions) */}
          <div className="pt-4 border-t border-slate-200 print:border-gray-300">
            <div className="flex flex-col-reverse sm:flex-row sm:items-start justify-between gap-6">
              {/* Left Column: Amount in Words & Note */}
              <div className="sm:max-w-xs space-y-3">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                    Amount in Words
                  </span>
                  <p className="text-xs text-slate-700 italic font-medium leading-relaxed mt-1 print:text-black">
                    {amountInWords(sale.finalAmount)}
                  </p>
                </div>

                <div className="pt-2 text-xs text-slate-500">
                  <p className="font-medium text-slate-700 print:text-black">
                    {settings?.invoiceFooterNote || 'Thank you for your business!'}
                  </p>
                </div>
              </div>

              {/* Right Column: Clean Totals Stack */}
              <div className="w-full sm:w-64 space-y-2 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span className="font-mono text-slate-800 font-medium print:text-black">
                    {formatCurrency(sale.subtotal)}
                  </span>
                </div>

                {sale.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount {sale.discountType === 'percentage' && `(${sale.discountValue}%)`}</span>
                    <span className="font-mono">- {formatCurrency(sale.discountAmount)}</span>
                  </div>
                )}

                {sale.taxAmount > 0 ? (
                  <>
                    <div className="flex justify-between text-slate-500">
                      <span>CGST ({(sale.taxRate / 2).toFixed(1)}%)</span>
                      <span className="font-mono text-slate-800 print:text-black">
                        {formatCurrency(halfTaxPaise)}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>SGST ({(sale.taxRate / 2).toFixed(1)}%)</span>
                      <span className="font-mono text-slate-800 print:text-black">
                        {formatCurrency(otherHalfTaxPaise)}
                      </span>
                    </div>
                  </>
                ) : null}

                {/* Total Line */}
                <div className="pt-2.5 mt-1 border-t border-slate-900 print:border-black flex justify-between items-baseline">
                  <span className="text-sm font-bold uppercase tracking-tight text-slate-900 print:text-black">
                    Total Amount
                  </span>
                  <span className="text-xl font-bold font-mono text-slate-900 print:text-black">
                    {formatCurrency(sale.finalAmount)}
                  </span>
                </div>

                {/* Signatory */}
                <div className="pt-8 text-right print:pt-8">
                  <div className="h-6 border-b border-slate-300 inline-block w-36 print:border-gray-400"></div>
                  <p className="text-[11px] font-semibold text-slate-800 uppercase tracking-wider print:text-black mt-1">
                    {settings?.shopName || 'WTL Mobile'}
                  </p>
                  <p className="text-[10px] text-slate-400">Authorized Signatory</p>
                </div>
              </div>
            </div>
          </div>

          {/* Minimal Bottom Footer */}
          <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 print:border-gray-200">
            <span>Computer Generated Retail Invoice</span>
            <span>Thank you for shopping with us!</span>
          </div>
        </div>

        {/* Modal Bottom Actions (Excluded in Print) */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3 no-print shrink-0">
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
    </div>,
    document.body
  );
};
