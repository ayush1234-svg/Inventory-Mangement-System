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

      {/* Invoice Container - Sized for A5 Portrait Sheet (148 × 210 mm) */}
      <div className="relative w-full max-w-[560px] rounded-2xl bg-white shadow-2xl border border-slate-200 z-10 my-auto overflow-hidden flex flex-col max-h-[96vh] invoice-modal-content">
        {/* Modal Top Action Bar (Excluded in Print) */}
        <div className="flex items-center justify-between px-5 py-3 bg-slate-900 text-white no-print shrink-0">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold tracking-wide">A5 Invoice (148 × 210 mm)</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              icon={<Printer className="w-3.5 h-3.5" />}
              className="bg-slate-800 text-white border-slate-700 hover:bg-slate-700 hover:text-white text-xs py-1.5 px-3"
            >
              Print A5 / PDF
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={onStartNewBill}
              icon={<Plus className="w-3.5 h-3.5" />}
              className="text-xs py-1.5 px-3"
            >
              New Bill
            </Button>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded-md transition-colors ml-1 cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* PRINTABLE RETAIL INVOICE BODY - A5 PORTRAIT (148 × 210 mm, 8-10mm Margins, 9-11pt Typography) */}
        <div
          id="invoice-printable-area"
          className="p-6 sm:p-7 overflow-y-auto text-slate-800 font-sans print:p-0 print:m-0 print:text-black print:overflow-visible print:bg-white text-[10pt] leading-normal"
        >
          {/* TOP SECTION: Store Logo and Details */}
          <div className="pb-4 border-b border-slate-200 print:border-gray-300">
            <div className="flex items-start justify-between gap-3">
              {/* Logo + Store Info */}
              <div className="flex items-start gap-2.5">
                {/* Store Logo Emblem */}
                <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0 print:border print:border-black print:bg-white print:text-black">
                  <span className="font-black text-sm tracking-tighter">WTL</span>
                </div>

                <div className="space-y-0.5">
                  <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 print:text-black invoice-title leading-tight">
                    {settings?.shopName || 'WTL Mobile & Accessories'}
                  </h1>
                  {settings?.tagline && (
                    <p className="text-[9pt] font-medium text-slate-500 print:text-gray-600 invoice-subtext">
                      {settings.tagline}
                    </p>
                  )}
                  <p className="text-[9pt] text-slate-600 print:text-gray-700 leading-tight max-w-[260px] invoice-subtext">
                    {settings?.address}
                  </p>
                  <div className="text-[9pt] text-slate-600 print:text-gray-700 invoice-subtext pt-0.5 space-x-2">
                    {settings?.contactNumber && <span>📞 {settings.contactNumber}</span>}
                    {settings?.gstin && (
                      <span className="font-mono font-semibold print:text-black">
                        GSTIN: {settings.gstin}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Invoice Heading & Meta */}
              <div className="text-right shrink-0">
                <span className="text-base sm:text-lg font-bold tracking-wider text-slate-900 uppercase print:text-black block invoice-heading">
                  TAX INVOICE
                </span>
                <p className="font-mono text-[9.5pt] font-semibold text-slate-800 print:text-black mt-0.5">
                  #{sale.invoiceNumber}
                </p>
                <p className="text-[9pt] text-slate-500 print:text-gray-600 invoice-caption mt-0.5">
                  {formatDateTime(sale.date)}
                </p>
                <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[8.5pt] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 print:border-gray-400 print:bg-transparent print:text-black">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>PAID ({formatPaymentMethod(sale.paymentMethod)})</span>
                </div>
              </div>
            </div>

            {/* Customer & Bill Meta Strip */}
            <div className="mt-3 pt-2.5 border-t border-slate-100 print:border-gray-200 grid grid-cols-2 gap-2 text-[9pt]">
              <div>
                <span className="text-[8.5pt] font-semibold uppercase tracking-wider text-slate-400 block">
                  Billed To
                </span>
                <p className="font-semibold text-slate-900 print:text-black">
                  {sale.customerName || 'Walk-in Retail Customer'}
                </p>
                {sale.customerPhone && (
                  <p className="text-slate-500 print:text-gray-600">{sale.customerPhone}</p>
                )}
              </div>
              <div className="text-right">
                <span className="text-[8.5pt] font-semibold uppercase tracking-wider text-slate-400 block">
                  Supply / Mode
                </span>
                <p className="text-slate-700 print:text-black">
                  POS Counter 01 • State Code: 27
                </p>
                <p className="text-slate-500 print:text-gray-600">
                  Total Items: {totalQuantity} {totalQuantity === 1 ? 'unit' : 'units'}
                </p>
              </div>
            </div>
          </div>

          {/* MIDDLE SECTION: Product Table */}
          <div className="py-2.5">
            <table className="w-full text-left border-collapse text-[9.5pt]">
              <thead>
                <tr className="border-b border-slate-200 print:border-gray-400 text-slate-500 font-bold uppercase tracking-wider text-[8.5pt]">
                  <th className="py-2 px-1 w-6 text-center">#</th>
                  <th className="py-2 px-2">Item Description</th>
                  <th className="py-2 px-2 text-right w-20">Price</th>
                  <th className="py-2 px-1 text-center w-12">Qty</th>
                  <th className="py-2 px-2 text-right w-24">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 print:divide-gray-200">
                {sale.items.map((item, idx) => (
                  <tr key={idx} className="print:border-b print:border-gray-200">
                    <td className="py-2 px-1 text-center text-slate-400 font-mono text-[9pt]">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-2">
                      <p className="font-semibold text-slate-900 print:text-black leading-tight">
                        {item.name}
                      </p>
                      <p className="text-[8.5pt] text-slate-500 mt-0.5 invoice-caption">
                        {item.brand}
                        {item.storage && ` • ${item.storage}`}
                        {item.color && ` • ${item.color}`}
                      </p>
                    </td>
                    <td className="py-2 px-2 text-right font-mono text-slate-700 print:text-black">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="py-2 px-1 text-center font-mono font-medium text-slate-800 print:text-black">
                      {item.quantity}
                    </td>
                    <td className="py-2 px-2 text-right font-mono font-bold text-slate-900 print:text-black">
                      {formatCurrency(item.lineTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* BOTTOM SECTION: Subtotal, GST, and Grand Total */}
          <div className="pt-3 border-t border-slate-200 print:border-gray-400">
            <div className="flex flex-col-reverse sm:flex-row sm:items-start justify-between gap-4">
              {/* Left Side: Amount in Words & Note */}
              <div className="sm:max-w-[240px] space-y-2">
                <div>
                  <span className="text-[8.5pt] font-semibold uppercase tracking-wider text-slate-400 block">
                    Amount in Words
                  </span>
                  <p className="text-[9pt] text-slate-700 italic font-medium leading-relaxed mt-0.5 print:text-black invoice-subtext">
                    {amountInWords(sale.finalAmount)}
                  </p>
                </div>

                <div className="pt-1 text-[8.5pt] text-slate-500 invoice-caption">
                  <p className="font-medium text-slate-700 print:text-black">
                    {settings?.invoiceFooterNote || 'Thank you for your purchase!'}
                  </p>
                </div>
              </div>

              {/* Right Side: Subtotal, GST, Grand Total Breakdown */}
              <div className="w-full sm:w-56 space-y-1.5 text-[9.5pt]">
                <div className="flex justify-between text-slate-600 print:text-gray-800">
                  <span>Subtotal</span>
                  <span className="font-mono text-slate-900 font-medium print:text-black">
                    {formatCurrency(sale.subtotal)}
                  </span>
                </div>

                {sale.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount {sale.discountType === 'percentage' && `(${sale.discountValue}%)`}</span>
                    <span className="font-mono font-medium">- {formatCurrency(sale.discountAmount)}</span>
                  </div>
                )}

                {sale.taxAmount > 0 ? (
                  <>
                    <div className="flex justify-between text-slate-600 print:text-gray-800">
                      <span>CGST ({(sale.taxRate / 2).toFixed(1)}%)</span>
                      <span className="font-mono text-slate-900 print:text-black">
                        {formatCurrency(halfTaxPaise)}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600 print:text-gray-800">
                      <span>SGST ({(sale.taxRate / 2).toFixed(1)}%)</span>
                      <span className="font-mono text-slate-900 print:text-black">
                        {formatCurrency(otherHalfTaxPaise)}
                      </span>
                    </div>
                  </>
                ) : null}

                {/* Grand Total Row */}
                <div className="pt-2 mt-1 border-t-2 border-slate-900 print:border-black flex justify-between items-baseline invoice-grand-total">
                  <span className="text-[10pt] font-bold uppercase tracking-tight text-slate-900 print:text-black">
                    Grand Total
                  </span>
                  <span className="text-[12pt] font-black font-mono text-slate-900 print:text-black">
                    {formatCurrency(sale.finalAmount)}
                  </span>
                </div>

                {/* Signatory */}
                <div className="pt-5 text-right print:pt-5">
                  <div className="h-5 border-b border-slate-300 inline-block w-32 print:border-gray-400"></div>
                  <p className="text-[9pt] font-semibold text-slate-800 uppercase tracking-wider print:text-black mt-0.5">
                    For {settings?.shopName || 'WTL Mobile'}
                  </p>
                  <p className="text-[8pt] text-slate-400">Authorized Signatory</p>
                </div>
              </div>
            </div>
          </div>

          {/* Minimal Bottom Footnote */}
          <div className="mt-5 pt-2 border-t border-slate-100 flex items-center justify-between text-[8pt] text-slate-400 print:border-gray-200">
            <span>Computer Generated Retail Invoice</span>
            <span>A5 Portrait • 148 × 210 mm</span>
          </div>
        </div>

        {/* Modal Bottom Actions (Excluded in Print) */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3 no-print shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            icon={<Download className="w-3.5 h-3.5" />}
          >
            Save as PDF / Print A5
          </Button>
          <Button variant="primary" size="sm" onClick={onStartNewBill} icon={<Plus className="w-3.5 h-3.5" />}>
            Start New Bill
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
};
