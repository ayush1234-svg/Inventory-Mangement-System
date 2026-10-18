import { ReportData } from '../types/index.js';
import { formatCurrency, formatDate } from './format.js';

export function exportReportToCSV(report: ReportData, shopName = 'WTL Mobile'): void {
  const lines: string[] = [];

  lines.push(`"${shopName} - Business Sales Report"`);
  lines.push(`"Period: ${formatDate(report.dateRange.start)} to ${formatDate(report.dateRange.end)}"`);
  lines.push(`"Generated: ${new Date().toLocaleString('en-IN')}"`);
  lines.push('');

  // 1. Summary Metrics
  lines.push('"EXECUTIVE SUMMARY"');
  lines.push('"Metric","Value"');
  lines.push(`"Total Revenue","${formatCurrency(report.summary.totalRevenuePaise)}"`);
  lines.push(`"Estimated Gross Profit","${formatCurrency(report.summary.estimatedGrossProfitPaise)}"`);
  lines.push(`"Cost of Goods Sold (COGS)","${formatCurrency(report.summary.totalCostOfGoodsPaise)}"`);
  lines.push(`"Total Discount Given","${formatCurrency(report.summary.totalDiscountPaise)}"`);
  lines.push(`"Total Tax Collected","${formatCurrency(report.summary.totalTaxPaise)}"`);
  lines.push(`"Total Bills Generated","${report.summary.totalBills}"`);
  lines.push(`"Total Units Sold","${report.summary.totalUnitsSold}"`);
  lines.push(`"Average Order Value","${formatCurrency(report.summary.averageOrderValuePaise)}"`);
  lines.push('');

  // 2. Payment Methods
  lines.push('"SALES BY PAYMENT METHOD"');
  lines.push('"Payment Method","Bills Count","Total Amount"');
  for (const pm of report.paymentMethods) {
    lines.push(`"${pm.method.toUpperCase()}","${pm.count}","${formatCurrency(pm.totalAmountPaise)}"`);
  }
  lines.push('');

  // 3. Top Products
  lines.push('"TOP SELLING PRODUCTS"');
  lines.push('"Product Name","Brand","Units Sold","Revenue"');
  for (const prod of report.topProducts) {
    lines.push(`"${prod.name.replace(/"/g, '""')}","${prod.brand}","${prod.unitsSold}","${formatCurrency(prod.revenuePaise)}"`);
  }
  lines.push('');

  // 4. Daily Breakdown
  lines.push('"DAILY REVENUE BREAKDOWN"');
  lines.push('"Date","Bills Count","Revenue"');
  for (const day of report.dailyBreakdown) {
    lines.push(`"${day.date}","${day.billsCount}","${formatCurrency(day.revenuePaise)}"`);
  }

  const csvContent = lines.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `WTL_Sales_Report_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
