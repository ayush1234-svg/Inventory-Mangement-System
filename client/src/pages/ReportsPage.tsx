import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  Download,
  TrendingUp,
} from 'lucide-react';
import { Button } from '../components/common/Button.js';
import { EmptyState } from '../components/common/EmptyState.js';
import { Spinner } from '../components/common/Spinner.js';
import { useToast } from '../components/common/Toast.js';
import { useSettings } from '../context/SettingsContext.js';
import * as reportService from '../services/reports.js';
import { ReportData } from '../types/index.js';
import { exportReportToCSV } from '../utils/csv.js';
import { formatCurrency, formatDate } from '../utils/format.js';

export const ReportsPage: React.FC = () => {
  const { error, success } = useToast();
  const { settings } = useSettings();

  const [preset, setPreset] = useState<'today' | 'yesterday' | 'last7days' | 'last30days' | 'thisMonth' | 'all'>('last30days');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [report, setReport] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadReport = async () => {
    setIsLoading(true);
    try {
      const res = await reportService.fetchReports({
        preset: startDate || endDate ? undefined : preset,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setReport(res.data);
    } catch (err: any) {
      error(err.message || 'Failed to generate business reports.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [preset, startDate, endDate]);

  const handleExportCSV = () => {
    if (!report) return;
    exportReportToCSV(report, settings?.shopName);
    success('Sales report exported to CSV successfully.');
  };

  const presetButtons = [
    { id: 'today', label: 'Today' },
    { id: 'yesterday', label: 'Yesterday' },
    { id: 'last7days', label: 'Last 7 Days' },
    { id: 'last30days', label: 'Last 30 Days' },
    { id: 'thisMonth', label: 'This Month' },
    { id: 'all', label: 'All Time' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Business Reports & Intelligence</h2>
          <p className="text-xs text-slate-500">
            {report
              ? `Reporting period: ${formatDate(report.dateRange.start)} to ${formatDate(
                  report.dateRange.end
                )}`
              : 'Financial performance and product analysis'}
          </p>
        </div>

        <Button
          variant="outline"
          onClick={handleExportCSV}
          icon={<Download className="w-4 h-4" />}
          disabled={!report || report.summary.totalBills === 0}
        >
          Export CSV Report
        </Button>
      </div>

      {/* Preset Period & Custom Date Range Filter */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Preset Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {presetButtons.map((btn) => (
            <button
              key={btn.id}
              onClick={() => {
                setStartDate('');
                setEndDate('');
                setPreset(btn.id as any);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                preset === btn.id && !startDate && !endDate
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Custom Range Picker */}
        <div className="flex w-full flex-wrap items-center gap-2 text-xs md:w-auto">
          <span className="text-slate-400 font-medium">Custom:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-2 py-2 text-slate-700 focus:outline-none md:flex-none"
          />
          <span className="text-slate-400">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-2 py-2 text-slate-700 focus:outline-none md:flex-none"
          />
        </div>
      </div>

      {isLoading ? (
        <Spinner size="lg" label="Computing financial reports..." className="h-64" />
      ) : !report || report.summary.totalBills === 0 ? (
        <div className="bg-white p-12 rounded-xl border border-slate-200 shadow-xs">
          <EmptyState
            icon={<BarChart3 className="w-8 h-8 text-slate-400" />}
            title="No Sales In This Period"
            description="No completed sales transactions were recorded for the selected date range."
          />
        </div>
      ) : (
        <>
          {/* 1. Executive Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Revenue */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Total Revenue
              </span>
              <span className="text-2xl font-extrabold text-slate-900 mt-1 block">
                {formatCurrency(report.summary.totalRevenuePaise)}
              </span>
              <span className="text-[11px] text-slate-400 mt-1 block">Total customer billings</span>
            </div>

            {/* Estimated Gross Profit (CRITICAL: Distinguished from revenue!) */}
            <div className="bg-white p-5 rounded-xl border border-emerald-200/80 bg-emerald-50/10 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider block">
                  Est. Gross Profit
                </span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="text-2xl font-extrabold text-emerald-700 mt-1 block">
                {formatCurrency(report.summary.estimatedGrossProfitPaise)}
              </span>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Revenue minus captured COGS
              </span>
            </div>

            {/* Total Units Sold */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Units Sold
              </span>
              <span className="text-2xl font-extrabold text-slate-900 mt-1 block">
                {report.summary.totalUnitsSold}
              </span>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Across {report.summary.totalBills} {report.summary.totalBills === 1 ? 'bill' : 'bills'}
              </span>
            </div>

            {/* Average Order Value */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Avg. Order Value
              </span>
              <span className="text-2xl font-extrabold text-slate-900 mt-1 block">
                {formatCurrency(report.summary.averageOrderValuePaise)}
              </span>
              <span className="text-[11px] text-slate-400 mt-1 block">Per customer invoice</span>
            </div>
          </div>

          {/* 2. Middle Row: Payment Methods & Top Products */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sales by Payment Method */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">Sales by Payment Method</h3>
                <p className="text-xs text-slate-500 mb-4">
                  Distribution of collected money across channels
                </p>

                <div className="space-y-3">
                  {report.paymentMethods.map((pm) => {
                    const percentage =
                      report.summary.totalRevenuePaise > 0
                        ? Math.round(
                            (pm.totalAmountPaise / report.summary.totalRevenuePaise) * 100
                          )
                        : 0;

                    return (
                      <div key={pm.method} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="uppercase text-slate-700">{pm.method}</span>
                          <span className="text-slate-900">
                            {formatCurrency(pm.totalAmountPaise)} ({percentage}%)
                          </span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${percentage}%` }}
                            className="h-full bg-indigo-600 rounded-full"
                          />
                        </div>
                        <div className="text-[11px] text-slate-400 text-right">
                          {pm.count} {pm.count === 1 ? 'sale' : 'sales'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Top Selling Products */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">Best-Selling Products</h3>
                <p className="text-xs text-slate-500 mb-4">
                  Top performing items ranked by units sold
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider text-[10px]">
                        <th className="py-2">Product</th>
                        <th className="py-2 text-center">Units Sold</th>
                        <th className="py-2 text-right">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {report.topProducts.map((p, idx) => (
                        <tr key={idx} className="py-2">
                          <td className="py-2.5 font-medium text-slate-800">
                            <div>{p.name}</div>
                            <span className="text-[11px] text-slate-400">{p.brand}</span>
                          </td>
                          <td className="py-2.5 text-center font-bold text-slate-900">
                            {p.unitsSold}
                          </td>
                          <td className="py-2.5 text-right font-semibold text-slate-900 font-mono">
                            {formatCurrency(p.revenuePaise)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
