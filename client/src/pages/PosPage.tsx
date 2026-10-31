import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  PackageSearch,
  Search,
  ShoppingCart,
  Trash2,
} from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState.js';
import { Spinner } from '../components/common/Spinner.js';
import { useToast } from '../components/common/Toast.js';
import { BillSummary } from '../components/pos/BillSummary.js';
import { CartItemRow } from '../components/pos/CartItem.js';
import { InvoiceModal } from '../components/pos/InvoiceModal.js';
import { ProductCard } from '../components/pos/ProductCard.js';
import * as productService from '../services/products.js';
import * as saleService from '../services/sales.js';
import { CartItem, Product, Sale } from '../types/index.js';

export const PosPage: React.FC = () => {
  const { success, error } = useToast();

  // Catalogue State
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isLoadingCatalogue, setIsLoadingCatalogue] = useState(true);

  // Active Bill State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed' | 'none'>('none');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'card' | 'other'>('cash');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Completed Invoice State
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);

  // Idempotency Key Ref (generated per bill session to prevent duplicate submissions)
  const idempotencyKeyRef = useRef<string>(generateIdempotencyKey());

  function generateIdempotencyKey() {
    return `bill-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
  }

  // Debounce search query by 250ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 250);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Load Catalogue & Categories
  const loadCatalogue = async () => {
    setIsLoadingCatalogue(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        productService.fetchProducts({
          limit: 100,
          search: debouncedSearch,
          category: selectedCategory === 'All' ? undefined : selectedCategory,
          stockStatus: 'all',
          sortBy: 'name',
          sortOrder: 'asc',
        }),
        productService.fetchCategories(),
      ]);

      setProducts(prodRes.data);
      if (catRes?.data) {
        setCategories(['All', ...catRes.data]);
      }
    } catch (err: any) {
      error(err.message || 'Failed to load product catalogue.');
    } finally {
      setIsLoadingCatalogue(false);
    }
  };

  useEffect(() => {
    loadCatalogue();
  }, [debouncedSearch, selectedCategory]);

  // Cart Handlers
  const handleAddToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product._id === product._id);
      if (existing) {
        if (existing.quantity >= product.stockQuantity) {
          error(`Cannot add more. Available stock for ${product.name} is ${product.stockQuantity}.`);
          return prev;
        }
        return prev.map((item) =>
          item.product._id === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (productId: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItem(productId);
      return;
    }

    setCart((prev) =>
      prev.map((item) => {
        if (item.product._id === productId) {
          if (newQty > item.product.stockQuantity) {
            error(
              `Requested quantity (${newQty}) exceeds available stock (${item.product.stockQuantity}).`
            );
            return item;
          }
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  const handleRemoveItem = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product._id !== productId));
  };

  const handleClearCart = () => {
    if (cart.length > 0) {
      setCart([]);
      setDiscountType('none');
      setDiscountValue(0);
      setCustomerName('');
      setCustomerPhone('');
      idempotencyKeyRef.current = generateIdempotencyKey();
    }
  };

  // Calculations
  const subtotalPaise = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.product.sellingPrice * item.quantity, 0);
  }, [cart]);

  const totalItemCount = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.quantity, 0);
  }, [cart]);

  // Complete Sale
  const handleCompleteSale = async () => {
    if (cart.length === 0 || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const payload: saleService.CreateSalePayload = {
        idempotencyKey: idempotencyKeyRef.current,
        items: cart.map((i) => ({
          productId: i.product._id,
          quantity: i.quantity,
        })),
        discountType,
        discountValue,
        paymentMethod,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
      };

      const res = await saleService.createSale(payload);
      success('Sale completed and invoice generated!');
      setCompletedSale(res.data);

      // Refresh product catalogue stock in background
      loadCatalogue();
    } catch (err: any) {
      error(err.message || 'Failed to complete sale. Please check inventory stock.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartNewBill = () => {
    setCompletedSale(null);
    handleClearCart();
  };

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-8rem)] max-w-7xl flex-col gap-5 overflow-visible select-none lg:h-[calc(100vh-5.5rem)] lg:min-h-0 lg:flex-row lg:overflow-hidden">
      {/* ================= LEFT PANEL: PRODUCT CATALOGUE ================= */}
      <div className="flex min-h-[55vh] flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs lg:min-h-0">
        {/* Top Search & Filter Bar */}
        <div className="p-4 border-b border-slate-200 space-y-3 bg-white z-10 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search products by name, brand, or model..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category Horizontal Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition-colors shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Products Grid */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50">
          {isLoadingCatalogue ? (
            <Spinner label="Loading catalogue products..." className="h-64" />
          ) : products.length === 0 ? (
            <EmptyState
              icon={<PackageSearch className="w-8 h-8 text-slate-400" />}
              title="No Products Found"
              description="No active items match your current search query or category filter."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
              {products.map((prod) => {
                const inCart = cart.find((i) => i.product._id === prod._id)?.quantity || 0;
                return (
                  <ProductCard
                    key={prod._id}
                    product={prod}
                    onAddToCart={handleAddToCart}
                    cartQuantity={inCart}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ================= RIGHT PANEL: ACTIVE BILL ================= */}
      <div className="flex min-h-[60vh] w-full shrink-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs lg:min-h-0 lg:w-96">
        {/* Bill Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Current Bill</h3>
            {totalItemCount > 0 && (
              <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">
                {totalItemCount}
              </span>
            )}
          </div>

          {cart.length > 0 && (
            <button
              onClick={handleClearCart}
              className="text-xs font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1 focus:outline-none"
              title="Clear all line items"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>

        {/* Selected Items Scroll Area */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-400">
              <ShoppingCart className="w-10 h-10 mb-2 stroke-1 text-slate-300" />
              <p className="text-xs font-medium text-slate-600">Bill is empty</p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-[200px]">
                Click on any product in the catalogue to add it to this sale.
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <CartItemRow
                key={item.product._id}
                item={item}
                onUpdateQuantity={handleUpdateQuantity}
                onRemove={handleRemoveItem}
              />
            ))
          )}
        </div>

        {/* Bill Monetary Summary & Complete Button */}
        <BillSummary
          subtotalPaise={subtotalPaise}
          discountType={discountType}
          discountValue={discountValue}
          onDiscountChange={(type, val) => {
            setDiscountType(type);
            setDiscountValue(val);
          }}
          paymentMethod={paymentMethod}
          onPaymentMethodChange={setPaymentMethod}
          customerName={customerName}
          onCustomerNameChange={setCustomerName}
          customerPhone={customerPhone}
          onCustomerPhoneChange={setCustomerPhone}
          onCompleteSale={handleCompleteSale}
          isSubmitting={isSubmitting}
          itemCount={totalItemCount}
        />
      </div>

      {/* Completed Sale Invoice Modal */}
      {completedSale && (
        <InvoiceModal
          sale={completedSale}
          isOpen={!!completedSale}
          onClose={() => setCompletedSale(null)}
          onStartNewBill={handleStartNewBill}
        />
      )}
    </div>
  );
};
