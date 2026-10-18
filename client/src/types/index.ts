export interface User {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'staff';
}

export interface Product {
  _id: string;
  name: string;
  category: string;
  brand: string;
  model?: string;
  imageUrl?: string;
  purchasePrice: number; // in paise
  sellingPrice: number;  // in paise
  stockQuantity: number;
  lowStockThreshold: number;
  isArchived: boolean;
  storage?: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SaleItem {
  productId: string;
  name: string;
  brand: string;
  model?: string;
  storage?: string;
  color?: string;
  unitPrice: number;    // in paise
  purchaseCost: number; // in paise
  quantity: number;
  lineTotal: number;    // in paise
}

export interface Sale {
  _id: string;
  invoiceNumber: string;
  idempotencyKey?: string;
  date: string;
  items: SaleItem[];
  subtotal: number;       // in paise
  discountType: 'percentage' | 'fixed' | 'none';
  discountValue: number;
  discountAmount: number; // in paise
  taxRate: number;        // percentage e.g. 18
  taxAmount: number;      // in paise
  finalAmount: number;    // in paise
  paymentMethod: 'cash' | 'upi' | 'card' | 'other';
  customerName?: string;
  customerPhone?: string;
  status: 'completed' | 'cancelled';
  notes?: string;
  createdAt: string;
}

export interface StockAdjustment {
  _id: string;
  productId: string;
  productName: string;
  previousQuantity: number;
  newQuantity: number;
  quantityChange: number;
  reason: 'RESTOCK' | 'MANUAL_CORRECTION' | 'DAMAGE_WRITE_OFF' | 'SALE';
  note?: string;
  createdAt: string;
}

export interface ShopSettings {
  _id?: string;
  shopName: string;
  tagline?: string;
  address: string;
  contactNumber: string;
  email?: string;
  gstin?: string;
  currency: string;
  currencySymbol: string;
  taxEnabled: boolean;
  taxName: string;
  taxRate: number;
  invoicePrefix: string;
  defaultLowStockThreshold: number;
  invoiceFooterNote: string;
}

export interface DashboardSummary {
  todayRevenuePaise: number;
  todayBillsCount: number;
  totalProducts: number;
  lowStockCount: number;
}

export interface SalesTimelineItem {
  date: string;
  label: string;
  revenuePaise: number;
  billsCount: number;
}

export interface ReportData {
  dateRange: {
    start: string;
    end: string;
  };
  summary: {
    totalRevenuePaise: number;
    totalSubtotalPaise: number;
    totalDiscountPaise: number;
    totalTaxPaise: number;
    totalBills: number;
    totalUnitsSold: number;
    totalCostOfGoodsPaise: number;
    estimatedGrossProfitPaise: number;
    averageOrderValuePaise: number;
  };
  paymentMethods: Array<{
    method: 'cash' | 'upi' | 'card' | 'other';
    count: number;
    totalAmountPaise: number;
  }>;
  topProducts: Array<{
    productId: string;
    name: string;
    brand: string;
    unitsSold: number;
    revenuePaise: number;
  }>;
  dailyBreakdown: Array<{
    date: string;
    revenuePaise: number;
    billsCount: number;
  }>;
}

export interface CartItem {
  product: Product;
  quantity: number;
}
