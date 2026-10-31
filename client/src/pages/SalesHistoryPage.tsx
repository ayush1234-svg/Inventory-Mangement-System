import React, { useEffect, useState } from 'react';
import {
  Eye,
  Receipt,
  Search,
} from 'lucide-react';
import { PaymentBadge } from '../components/common/Badge.js';
import { Button } from '../components/common/Button.js';
import { EmptyState } from '../components/common/EmptyState.js';
import { Spinner } from '../components/common/Spinner.js';
import { useToast } from '../components/common/Toast.js';
import { InvoiceModal } from '../components/pos/InvoiceModal.js';
import * as salesService from '../services/sales.js';
import { Sale } from '../types/index.js';
import { formatCurrency, formatDateTime } from '../utils/format.js';

export const SalesHistoryPage: React.FC = () => {
  const { error } = useToast();

  const [sales, setSales] = useState<Sale[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Selected Sale for viewing invoice
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  const loadSales = async () => {
    setIsLoading(true);
    try {
      const res = await salesService.fetchSales({
        page,
        limit: 15,
        invoiceNumber,
        paymentMethod: paymentMethod === 'all' ? undefined : paymentMethod,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });

      setSales(res.data);
      setTotalPages(res.pagination.totalPages);
      setTotalCount(res.pagination.totalCount);
    } catch (err: any) {
      error(err.message || 'Failed to fetch sales history.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
  }, [page, paymentMethod, startDate, endDate]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      loadSales();
    }, 250);
    return () => clearTimeout(timer);
  }, [invoiceNumber]);

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Sales Invoices & Billing History</h2>
          <p className="text-xs text-slate-500">
            Total {totalCount} completed {totalCount === 1 ? 'sale' : 'sales'} on record
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center gap-3">
        {/* Invoice Number Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by invoice number (e.g. WTL-202610-00001)..."
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 font-mono"
          />
        </div>

        {/* Date Filter & Payment Method */}
        <div className="flex w-full flex-wrap items-center gap-2 md:w-auto">
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(1);
            }}
            className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs text-slate-700 focus:outline-none sm:flex-none sm:px-2.5 sm:text-sm"
            title="Start Date"
          />

          <span className="text-slate-400 text-xs">to</span>

          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPage(1);
            }}
            className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs text-slate-700 focus:outline-none sm:flex-none sm:px-2.5 sm:text-sm"
            title="End Date"
          />

          <select
            value={paymentMethod}
            onChange={(e) => {
              setPaymentMethod(e.target.value);
              setPage(1);
            }}
            className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs text-slate-700 focus:outline-none sm:flex-none sm:px-3 sm:text-sm"
          >
            <option value="all">All Payment Methods</option>
            <option value="cash">Cash</option>
            <option value="upi">UPI</option>
            <option value="card">Card</option>
            <option value="other">Other</option>
          </select>

          {(startDate || endDate || paymentMethod !== 'all' || invoiceNumber) && (
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
                setPaymentMethod('all');
                setInvoiceNumber('');
                setPage(1);
              }}
              className="text-xs font-semibold text-rose-600 hover:text-rose-800 px-2 py-1"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Sales Invoices Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <Spinner label="Loading sales history..." className="h-64" />
        ) : sales.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={<Receipt className="w-8 h-8 text-slate-400" />}
              title="No Sales Invoices Found"
              description="No sales matched your specified filters or search criteria."
            />
          </div>
        ) : (
          <>
            <div className="space-y-3 p-3 md:hidden">
              {sales.map((sale) => (
                <article key={sale._id} className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="break-all font-mono text-sm font-bold text-slate-900">
                        {sale.invoiceNumber}
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">{formatDateTime(sale.date)}</p>
                    </div>
                    <PaymentBadge method={sale.paymentMethod} />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 text-xs">
                    <div>
                      <span className="block text-slate-500">Customer</span>
                      <span className="break-words font-medium text-slate-800">
                        {sale.customerName || 'Walk-in'}
                      </span>
                    </div>
                    <div>
                      <span className="block text-slate-500">Items</span>
                      <span className="font-medium text-slate-800">
                        {sale.items.reduce((acc, item) => acc + item.quantity, 0)}
                      </span>
                    </div>
                    <div>
                      <span className="block text-slate-500">Subtotal</span>
                      <span className="font-medium text-slate-800">{formatCurrency(sale.subtotal)}</span>
                    </div>
                    <div>
                      <span className="block text-slate-500">Final amount</span>
                      <span className="font-bold text-slate-900">{formatCurrency(sale.finalAmount)}</span>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end border-t border-slate-100 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedSale(sale)}
                      icon={<Eye className="h-3.5 w-3.5" />}
                    >
                      View / Print
                    </Button>
                  </div>
                </article>
              ))}
            </div>
            <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4 text-center">Items</th>
                  <th className="py-3 px-4 text-right">Subtotal</th>
                  <th className="py-3 px-4 text-right">Final Amount</th>
                  <th className="py-3 px-4 text-center">Payment</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sales.map((sale) => (
                  <tr key={sale._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 font-mono">
                      {sale.invoiceNumber}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      {formatDateTime(sale.date)}
                    </td>

                    <td className="py-3.5 px-4 text-slate-700">
                      {sale.customerName ? (
                        <div>
                          <span className="font-medium text-slate-900">{sale.customerName}</span>
                          {sale.customerPhone && (
                            <span className="text-[11px] text-slate-400 block">
                              {sale.customerPhone}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Walk-in</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center font-medium text-slate-700">
                      {sale.items.reduce((acc, i) => acc + i.quantity, 0)}
                    </td>

                    <td className="py-3.5 px-4 text-right text-slate-600 font-mono">
                      {formatCurrency(sale.subtotal)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-bold text-slate-900 font-mono">
                      {formatCurrency(sale.finalAmount)}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <PaymentBadge method={sale.paymentMethod} />
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedSale(sale)}
                        icon={<Eye className="w-3.5 h-3.5" />}
                        className="text-xs py-1 px-2.5"
                      >
                        View / Print
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Invoice Modal Preview */}
      {selectedSale && (
        <InvoiceModal
          sale={selectedSale}
          isOpen={!!selectedSale}
          onClose={() => setSelectedSale(null)}
          onStartNewBill={() => setSelectedSale(null)}
        />
      )}
    </div>
  );
};
