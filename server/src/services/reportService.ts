import { Sale } from '../models/Sale.js';

export interface ReportDateRange {
  startDate?: string;
  endDate?: string;
  preset?: 'today' | 'yesterday' | 'last7days' | 'last30days' | 'thisMonth' | 'all';
}

function resolveDateRange(range: ReportDateRange): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  let start = new Date(now);
  start.setHours(0, 0, 0, 0);

  if (range.preset === 'yesterday') {
    start.setDate(start.getDate() - 1);
    end.setDate(end.getDate() - 1);
  } else if (range.preset === 'last7days') {
    start.setDate(start.getDate() - 6);
  } else if (range.preset === 'last30days') {
    start.setDate(start.getDate() - 29);
  } else if (range.preset === 'thisMonth') {
    start.setDate(1);
  } else if (range.preset === 'all') {
    start = new Date('2020-01-01');
  } else if (range.startDate || range.endDate) {
    if (range.startDate) {
      start = new Date(range.startDate);
      start.setHours(0, 0, 0, 0);
    }
    if (range.endDate) {
      const customEnd = new Date(range.endDate);
      customEnd.setHours(23, 59, 59, 999);
      return { start, end: customEnd };
    }
  }

  return { start, end };
}

export async function getComprehensiveReport(range: ReportDateRange) {
  const { start, end } = resolveDateRange(range);

  const matchFilter = {
    date: { $gte: start, $lte: end },
    status: 'completed',
  };

  // 1. Overall Financial Summary
  const summaryAgg = await Sale.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: null,
        totalRevenuePaise: { $sum: '$finalAmount' },
        totalSubtotalPaise: { $sum: '$subtotal' },
        totalDiscountPaise: { $sum: '$discountAmount' },
        totalTaxPaise: { $sum: '$taxAmount' },
        totalBills: { $sum: 1 },
      },
    },
  ]);

  const summary = summaryAgg[0] || {
    totalRevenuePaise: 0,
    totalSubtotalPaise: 0,
    totalDiscountPaise: 0,
    totalTaxPaise: 0,
    totalBills: 0,
  };

  // 2. Units Sold & Cost of Goods Sold (using historical snapshot purchase costs!)
  const itemCostAgg = await Sale.aggregate([
    { $match: matchFilter },
    { $unwind: '$items' },
    {
      $group: {
        _id: null,
        totalUnitsSold: { $sum: '$items.quantity' },
        totalCostOfGoodsPaise: {
          $sum: { $multiply: ['$items.purchaseCost', '$items.quantity'] },
        },
      },
    },
  ]);

  const totalUnitsSold = itemCostAgg[0]?.totalUnitsSold || 0;
  const totalCostOfGoodsPaise = itemCostAgg[0]?.totalCostOfGoodsPaise || 0;

  // Net sales revenue before tax = subtotal - discount
  const netSalesRevenuePaise = Math.max(0, summary.totalSubtotalPaise - summary.totalDiscountPaise);
  // Gross Profit = net sales revenue - cost of goods sold
  const estimatedGrossProfitPaise = Math.max(0, netSalesRevenuePaise - totalCostOfGoodsPaise);

  // 3. Sales By Payment Method
  const paymentMethodsAgg = await Sale.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: '$paymentMethod',
        count: { $sum: 1 },
        totalAmountPaise: { $sum: '$finalAmount' },
      },
    },
    { $sort: { totalAmountPaise: -1 } },
  ]);

  const paymentMethods = paymentMethodsAgg.map((item) => ({
    method: item._id,
    count: item.count,
    totalAmountPaise: item.totalAmountPaise,
  }));

  // 4. Top Selling Products
  const topProductsAgg = await Sale.aggregate([
    { $match: matchFilter },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.productId',
        name: { $first: '$items.name' },
        brand: { $first: '$items.brand' },
        unitsSold: { $sum: '$items.quantity' },
        revenuePaise: { $sum: '$items.lineTotal' },
      },
    },
    { $sort: { unitsSold: -1, revenuePaise: -1 } },
    { $limit: 10 },
  ]);

  const topProducts = topProductsAgg.map((item) => ({
    productId: item._id,
    name: item.name,
    brand: item.brand,
    unitsSold: item.unitsSold,
    revenuePaise: item.revenuePaise,
  }));

  // 5. Daily Breakdown for Chart
  const dailyBreakdownAgg = await Sale.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
        revenuePaise: { $sum: '$finalAmount' },
        billsCount: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return {
    dateRange: {
      start: start.toISOString(),
      end: end.toISOString(),
    },
    summary: {
      totalRevenuePaise: summary.totalRevenuePaise,
      totalSubtotalPaise: summary.totalSubtotalPaise,
      totalDiscountPaise: summary.totalDiscountPaise,
      totalTaxPaise: summary.totalTaxPaise,
      totalBills: summary.totalBills,
      totalUnitsSold,
      totalCostOfGoodsPaise,
      estimatedGrossProfitPaise,
      averageOrderValuePaise:
        summary.totalBills > 0 ? Math.round(summary.totalRevenuePaise / summary.totalBills) : 0,
    },
    paymentMethods,
    topProducts,
    dailyBreakdown: dailyBreakdownAgg.map((d) => ({
      date: d._id,
      revenuePaise: d.revenuePaise,
      billsCount: d.billsCount,
    })),
  };
}
