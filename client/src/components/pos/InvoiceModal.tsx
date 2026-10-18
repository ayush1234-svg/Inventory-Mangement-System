import React from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, Download, Plus, Printer, Smartphone, X } from 'lucide-react';
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

        {/* PRINTABLE RETAIL INVOICE BODY */}
        <div
          id="invoice-printable-area"
          className="p-6 sm:p-8 overflow-y-auto text-slate-800 font-sans print:p-6 print:m-0 print:text-black print:overflow-visible print:bg-white"
        >
          {/* Top Brand Banner */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b-2 border-slate-900 print:border-black">
            {/* Store Identity */}
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 print:bg-black">
                <Smartphone className="w-6 h-6 text-indigo-400 print:text-white" />
              </div>
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight text-slate-900 print:text-black">
                  {settings?.shopName || 'WTL Mobile & Accessories'}
                </h2>
                {settings?.tagline && (
                  <p className="text-xs font-semibold text-indigo-600 print:text-gray-700 tracking-wide mt-0.5">
                    {settings.tagline}
                  </p>
                )}
                <p className="text-xs text-slate-600 print:text-gray-700 mt-1 max-w-sm leading-relaxed">
                  {settings?.address}
                </p>
                <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-600 print:text-gray-700 font-medium">
                  {settings?.contactNumber && <span>📞 {settings.contactNumber}</span>}
                  {settings?.email && <span>✉️ {settings.email}</span>}
                </div>
              </div>
            </div>

            {/* Invoice Stamp & Metadata */}
            <div className="text-left sm:text-right shrink-0">
              <div className="inline-block bg-slate-900 text-white text-[11px] font-extrabold uppercase px-3 py-1 rounded tracking-wider mb-2 print:bg-black print:text-white">
                TAX INVOICE / CASH BILL
              </div>
              <p className="text-[11px] text-slate-500 uppercase tracking-wider font-bold">Invoice No</p>
              <p className="text-base font-extrabold text-slate-900 font-mono tracking-tight print:text-black">
                {sale.invoiceNumber}
              </p>
              <p className="text-[11px] text-slate-500 mt-1.5 uppercase tracking-wider font-bold">Date & Time</p>
              <p className="text-xs font-bold text-slate-800 print:text-black">
                {formatDateTime(sale.date)}
              </p>
              {settings?.gstin && (
                <div className="mt-2 inline-block px-2.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[11px] font-mono font-bold text-slate-800 print:border-gray-400 print:bg-transparent">
                  GSTIN: {settings.gstin}
                </div>
              )}
            </div>
          </div>

          {/* Customer & Transaction Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 my-5">
            {/* Customer Box */}
            <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/70 print:bg-transparent print:border-gray-300">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                  Customer Details (Billed To)
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100 print:border-gray-400 print:text-black print:bg-transparent">
                  Retail Buyer
                </span>
              </div>
              <p className="text-sm font-bold text-slate-900 print:text-black">
                {sale.customerName || 'Walk-in Retail Customer'}
              </p>
              {sale.customerPhone ? (
                <p className="text-xs text-slate-600 print:text-gray-700 mt-0.5">
                  Mobile: <span className="font-semibold text-slate-900 print:text-black">{sale.customerPhone}</span>
                </p>
              ) : (
                <p className="text-xs text-slate-400 mt-0.5">Contact not provided</p>
              )}
              <p className="text-[11px] text-slate-500 mt-1">Place of Supply: State (27)</p>
            </div>

            {/* Payment & Bill Details */}
            <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/70 print:bg-transparent print:border-gray-300">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                  Payment & Transaction
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 print:border-gray-400 print:text-black print:bg-transparent">
                  <CheckCircle2 className="w-3 h-3" /> PAID
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[11px] text-slate-500 block">Payment Mode:</span>
                  <span className="font-bold text-slate-900 uppercase print:text-black">
                    {formatPaymentMethod(sale.paymentMethod)}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">Status:</span>
                  <span className="font-semibold text-emerald-700 print:text-black">Completed</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">Register / POS:</span>
                  <span className="font-medium text-slate-700 print:text-black">Counter 01</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">Total Items:</span>
                  <span className="font-bold text-slate-900 print:text-black">
                    {totalQuantity} units
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="border border-slate-200 rounded-lg overflow-hidden my-4 print:border-gray-300">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[11px] print:bg-gray-100 print:text-black">
                  <th className="py-2.5 px-3 w-10 text-center">#</th>
                  <th className="py-2.5 px-3">Item Description</th>
                  <th className="py-2.5 px-3 text-right">Price</th>
                  <th className="py-2.5 px-3 text-center w-16">Qty</th>
                  <th className="py-2.5 px-3 text-right w-28">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 print:divide-gray-200">
                {sale.items.map((item, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50 print:bg-white'}>
                    <td className="py-3 px-3 text-center text-slate-400 font-mono text-xs">{idx + 1}</td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-900 print:text-black block text-xs sm:text-sm">
                        {item.name}
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-[11px] text-slate-500">
                        <span className="font-semibold text-slate-700 print:text-black">{item.brand}</span>
                        {item.storage && <span>• {item.storage}</span>}
                        {item.color && <span>• {item.color}</span>}
                        <span className="text-slate-400">• Warranty: 1 Yr Mfr</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right text-slate-700 font-mono font-medium print:text-black">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-slate-900 font-mono print:text-black">
                      {item.quantity}
                    </td>
                    <td className="py-3 px-3 text-right font-extrabold text-slate-900 font-mono text-xs sm:text-sm print:text-black">
                      {formatCurrency(item.lineTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financials & Terms Section */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 pt-2">
            {/* Left 7 cols: Amount in Words, Terms, Notes */}
            <div className="sm:col-span-7 space-y-3.5">
              {/* Amount in words card */}
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs print:bg-transparent print:border-gray-300">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Amount Chargeable (in words)
                </span>
                <p className="font-bold text-slate-900 italic mt-0.5 print:text-black">
                  {amountInWords(sale.finalAmount)}
                </p>
              </div>

              {/* Terms & Conditions */}
              <div className="text-[10px] text-slate-500 space-y-1 print:text-gray-600">
                <p className="font-bold text-slate-700 uppercase tracking-wider print:text-black">
                  Terms & Conditions:
                </p>
                <ol className="list-decimal pl-4 space-y-0.5 leading-relaxed">
                  <li>Goods once sold can be exchanged within 7 days against manufacturer warranty issues with original packaging & invoice.</li>
                  <li>Handsets & accessories are covered under direct brand authorized service centers.</li>
                  <li>Physical damage, water ingress, or unauthorized tampering voids manufacturer warranty.</li>
                </ol>
              </div>
            </div>

            {/* Right 5 cols: Subtotals, Tax Breakdown & Grand Total Card */}
            <div className="sm:col-span-5 space-y-2">
              <div className="rounded-lg border border-slate-200 p-3.5 bg-slate-50/50 space-y-2 text-xs print:bg-transparent print:border-gray-300">
                <div className="flex justify-between text-slate-600">
                  <span>Gross Subtotal</span>
                  <span className="font-semibold text-slate-900 font-mono print:text-black">
                    {formatCurrency(sale.subtotal)}
                  </span>
                </div>

                {sale.discountAmount > 0 && (
                  <div className="flex justify-between text-rose-600 font-medium">
                    <span>Discount {sale.discountType === 'percentage' && `(${sale.discountValue}%)`}</span>
                    <span className="font-mono">- {formatCurrency(sale.discountAmount)}</span>
                  </div>
                )}

                {sale.taxAmount > 0 ? (
                  <>
                    <div className="flex justify-between text-slate-600 pt-1 border-t border-slate-200 print:border-gray-300">
                      <span>CGST ({(sale.taxRate / 2).toFixed(1)}%)</span>
                      <span className="font-mono text-slate-900 print:text-black">
                        {formatCurrency(halfTaxPaise)}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>SGST ({(sale.taxRate / 2).toFixed(1)}%)</span>
                      <span className="font-mono text-slate-900 print:text-black">
                        {formatCurrency(otherHalfTaxPaise)}
                      </span>
                    </div>
                  </>
                ) : null}
              </div>

              {/* Highlight Grand Total Card */}
              <div className="p-3.5 rounded-lg bg-slate-900 text-white flex items-center justify-between shadow-xs print:bg-black print:text-white">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 print:text-gray-300 block">
                    Total Payable
                  </span>
                  <span className="text-xs text-slate-300 print:text-gray-300">Inclusive of all taxes</span>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black font-mono tracking-tight text-white">
                    {formatCurrency(sale.finalAmount)}
                  </span>
                </div>
              </div>

              {/* Signatory Box */}
              <div className="pt-6 text-right print:pt-6">
                <div className="h-8 border-b border-dashed border-slate-300 inline-block w-40 print:border-gray-400"></div>
                <p className="text-[11px] font-bold text-slate-800 uppercase tracking-wider print:text-black mt-1">
                  For {settings?.shopName || 'WTL Mobile'}
                </p>
                <p className="text-[10px] text-slate-400">Authorized Signatory</p>
              </div>
            </div>
          </div>

          {/* Invoice Bottom Footer Note */}
          <div className="mt-6 pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-400 gap-2 print:border-gray-300">
            <span>{settings?.invoiceFooterNote || 'Thank you for shopping with us!'}</span>
            <span>Computer Generated Retail Tax Invoice • Valid without physical signature</span>
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
