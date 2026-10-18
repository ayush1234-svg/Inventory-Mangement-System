import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Eye,
  IndianRupee,
  Package,
  Plus,
  Receipt,
  ShoppingCart,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { PaymentBadge, StockStatusBadge } from '../components/common/Badge.js';
import { Button } from '../components/common/Button.js';
import { EmptyState } from '../components/common/EmptyState.js';
import { Spinner } from '../components/common/Spinner.js';
import { useToast } from '../components/common/Toast.js';
import { StockModal } from '../components/inventory/StockModal.js';
import { InvoiceModal } from '../components/pos/InvoiceModal.js';
import * as dashboardService from '../services/dashboard.js';
import * as productService from '../services/products.js';
import { DashboardSummary, Product, Sale, SalesTimelineItem } from '../types/index.js';
import { formatCurrency, formatDateTime } from '../utils/format.js';

export const DashboardPage: React.FC = () => {
  const { success, error } = useToast();

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [salesOverview, setSalesOverview] = useState<SalesTimelineItem[]>([]);
  const [overviewDays, setOverviewDays] = useState<number>(7);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [selectedStockProduct, setSelectedStockProduct] = useState<Product | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Sale | null>(null);

  const loadDashboardData = async () => {
    try {
      const [sumRes, chartRes, lowRes, salesRes] = await Promise.all([
        dashboardService.fetchDashboardSummary(),
        dashboardService.fetchSalesOverview(overviewDays),
        dashboardService.fetchLowStockProducts(6),
        dashboardService.fetchRecentSales(5),
      ]);

      setSummary(sumRes.data);
      setSalesOverview(chartRes.data);
      setLowStockProducts(lowRes.data);
      setRecentSales(salesRes.data);
    } catch (err: any) {
      error(err.message || 'Failed to load dashboard metrics.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [overviewDays]);

  const handleStockUpdate = async (data: {
    quantityChange: number;
    reason: string;
    note?: string;
  }) => {
    if (!selectedStockProduct) return;
    try {
      await productService.adjustProductStock(selectedStockProduct._id, data);
      success('Stock updated successfully.');
      setSelectedStockProduct(null);
      loadDashboardData();
    } catch (err: any) {
      error(err.message || 'Failed to update stock.');
    }
  };

  if (isLoading) {
    return <Spinner size="lg" label="Loading dashboard metrics..." className="h-96" />;
  }

  // Max value calculation for clean SVG chart scaling
  const maxRevenue = Math.max(...salesOverview.map((item) => item.revenuePaise), 1);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Revenue */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Today's Sales Revenue
            </span>
            <span className="text-2xl font-extrabold text-slate-900 mt-1 block">
              {formatCurrency(summary?.todayRevenuePaise ?? 0)}
            </span>
            <span className="text-[11px] text-slate-400 mt-1 block">Gross billing today</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <IndianRupee className="w-6 h-6" />
          </div>
        </div>

        {/* Today's Bills */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Bills Generated Today
            </span>
            <span className="text-2xl font-extrabold text-slate-900 mt-1 block">
              {summary?.todayBillsCount ?? 0}
            </span>
            <span className="text-[11px] text-slate-400 mt-1 block">Completed sales</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 shrink-0">
            <Receipt className="w-6 h-6" />
          </div>
        </div>

        {/* Total Products */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Catalogue Items
            </span>
            <span className="text-2xl font-extrabold text-slate-900 mt-1 block">
              {summary?.totalProducts ?? 0}
            </span>
            <span className="text-[11px] text-slate-400 mt-1 block">Active stock items</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <Package className="w-6 h-6" />
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Low-Stock Alerts
            </span>
            <span
              className={`text-2xl font-extrabold mt-1 block ${
                (summary?.lowStockCount ?? 0) > 0 ? 'text-amber-600' : 'text-slate-900'
              }`}
            >
              {summary?.lowStockCount ?? 0}
            </span>
            <span className="text-[11px] text-slate-400 mt-1 block">At or below threshold</span>
          </div>
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
              (summary?.lowStockCount ?? 0) > 0
                ? 'bg-amber-50 border border-amber-200 text-amber-600'
                : 'bg-slate-50 border border-slate-200 text-slate-400'
            }`}
          >
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 2. Sales Overview Chart */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Sales Overview</h3>
            <p className="text-xs text-slate-500">
              Daily revenue trends from completed sales records
            </p>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setOverviewDays(7)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                overviewDays === 7
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setOverviewDays(30)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                overviewDays === 30
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Last 30 Days
            </button>
          </div>
        </div>

        {/* Lightweight SVG Bar Chart */}
        <div className="h-56 w-full flex items-end gap-2 pt-6 pb-2 border-b border-slate-200">
          {salesOverview.map((item, idx) => {
            const heightPercent = maxRevenue > 0 ? (item.revenuePaise / maxRevenue) * 100 : 0;
            return (
              <div
                key={idx}
                className="flex-1 flex flex-col items-center h-full justify-end group relative"
              >
                {/* Tooltip */}
                <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[11px] py-1 px-2 rounded pointer-events-none whitespace-nowrap z-20 shadow-md">
                  <div className="font-semibold">{formatCurrency(item.revenuePaise)}</div>
                  <div className="text-[10px] text-slate-300">
                    {item.billsCount} {item.billsCount === 1 ? 'bill' : 'bills'}
                  </div>
                </div>

                {/* Bar */}
                <div
                  style={{ height: `${Math.max(heightPercent, 4)}%` }}
                  className={`w-full max-w-[36px] rounded-t-md transition-all ${
                    item.revenuePaise > 0
                      ? 'bg-indigo-600 group-hover:bg-indigo-700 shadow-xs'
                      : 'bg-slate-200'
                  }`}
                />

                {/* Date Label */}
                <span className="text-[10px] text-slate-500 font-medium mt-2 truncate w-full text-center">
                  {overviewDays === 30 ? (idx % 4 === 0 ? item.label : '') : item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Bottom Two-Column Grid: Low Stock Warnings & Recent Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Attention List */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900">Low-Stock Attention</h3>
              </div>
              <Link
                to="/inventory?stockStatus=low_stock"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <span>View all</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {lowStockProducts.length === 0 ? (
              <EmptyState
                icon={<CheckCircle2 className="w-6 h-6 text-emerald-500" />}
                title="Inventory is Healthy"
                description="No products are currently at or below their low-stock thresholds."
              />
            ) : (
              <div className="divide-y divide-slate-100">
                {lowStockProducts.map((prod) => (
                  <div key={prod._id} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 truncate">{prod.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {prod.brand} • {prod.category}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <StockStatusBadge
                        stock={prod.stockQuantity}
                        threshold={prod.lowStockThreshold}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedStockProduct(prod)}
                        className="text-xs py-1 px-2.5"
                      >
                        Restock
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Sales List */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" />
                <h3 className="text-sm font-bold text-slate-900">Recent Completed Sales</h3>
              </div>
              <Link
                to="/sales"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <span>All Invoices</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {recentSales.length === 0 ? (
              <EmptyState
                icon={<ShoppingCart className="w-6 h-6 text-slate-400" />}
                title="No Sales Yet"
                description="Complete sales in Billing to view invoices and records here."
                action={
                  <Link to="/billing">
                    <Button size="sm" icon={<Plus className="w-3.5 h-3.5" />}>
                      Create First Sale
                    </Button>
                  </Link>
                }
              />
            ) : (
              <div className="divide-y divide-slate-100">
                {recentSales.map((sale) => (
                  <div key={sale._id} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 font-mono">
                        {sale.invoiceNumber}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {formatDateTime(sale.date)}
                        {sale.customerName && ` • ${sale.customerName}`}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span className="text-xs font-extrabold text-slate-900 block">
                          {formatCurrency(sale.finalAmount)}
                        </span>
                        <PaymentBadge method={sale.paymentMethod} />
                      </div>
                      <button
                        onClick={() => setSelectedInvoice(sale)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-slate-100 transition-colors"
                        title="View invoice receipt"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stock Adjustment Modal */}
      {selectedStockProduct && (
        <StockModal
          product={selectedStockProduct}
          isOpen={!!selectedStockProduct}
          onClose={() => setSelectedStockProduct(null)}
          onSubmit={handleStockUpdate}
        />
      )}

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <InvoiceModal
          sale={selectedInvoice}
          isOpen={!!selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onStartNewBill={() => setSelectedInvoice(null)}
        />
      )}
    </div>
  );
};
