import { Product } from '../models/Product.js';
import { Sale } from '../models/Sale.js';

export async function getDashboardSummary() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  // 1. Today's sales aggregation (Revenue and Bill count)
  const todaySalesAgg = await Sale.aggregate([
    {
      $match: {
        date: { $gte: startOfToday, $lte: endOfToday },
        status: 'completed',
      },
    },
    {
      $group: {
        _id: null,
        todayRevenuePaise: { $sum: '$finalAmount' },
        todayBillsCount: { $sum: 1 },
      },
    },
  ]);

  const todayRevenuePaise = todaySalesAgg[0]?.todayRevenuePaise || 0;
  const todayBillsCount = todaySalesAgg[0]?.todayBillsCount || 0;

  // 2. Total active products count
  const totalProducts = await Product.countDocuments({ isArchived: false });

  // 3. Products with low stock count (where stockQuantity <= lowStockThreshold and isArchived = false)
  const lowStockCount = await Product.countDocuments({
    isArchived: false,
    $expr: { $lte: ['$stockQuantity', '$lowStockThreshold'] },
  });

  return {
    todayRevenuePaise,
    todayBillsCount,
    totalProducts,
    lowStockCount,
  };
}

export async function getSalesOverview(days = 7) {
  const safeDays = days === 30 ? 30 : 7;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (safeDays - 1));
  startDate.setHours(0, 0, 0, 0);

  // Group completed sales by YYYY-MM-DD
  const dailyData = await Sale.aggregate([
    {
      $match: {
        date: { $gte: startDate },
        status: 'completed',
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$date' },
        },
        revenuePaise: { $sum: '$finalAmount' },
        billsCount: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const dataMap = new Map<string, { revenuePaise: number; billsCount: number }>();
  for (const item of dailyData) {
    dataMap.set(item._id, {
      revenuePaise: item.revenuePaise,
      billsCount: item.billsCount,
    });
  }

  // Generate continuous timeline array so days with zero sales are shown correctly
  const timeline: Array<{ date: string; label: string; revenuePaise: number; billsCount: number }> = [];
  const current = new Date(startDate);
  const now = new Date();

  while (current <= now) {
    const yyyy = current.getFullYear();
    const mm = String(current.getMonth() + 1).padStart(2, '0');
    const dd = String(current.getDate()).padStart(2, '0');
    const dateKey = `${yyyy}-${mm}-${dd}`;

    const label = current.toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
    });

    const entry = dataMap.get(dateKey) || { revenuePaise: 0, billsCount: 0 };
    timeline.push({
      date: dateKey,
      label,
      revenuePaise: entry.revenuePaise,
      billsCount: entry.billsCount,
    });

    current.setDate(current.getDate() + 1);
  }

  return timeline;
}

export async function getLowStockProducts(limit = 10) {
  return Product.find({
    isArchived: false,
    $expr: { $lte: ['$stockQuantity', '$lowStockThreshold'] },
  })
    .sort({ stockQuantity: 1, name: 1 })
    .limit(limit)
    .select('name category brand model stockQuantity lowStockThreshold sellingPrice')
    .lean();
}

export async function getRecentSales(limit = 5) {
  return Sale.find({ status: 'completed' })
    .sort({ date: -1 })
    .limit(limit)
    .select('invoiceNumber date finalAmount paymentMethod customerName items')
    .lean();
}
