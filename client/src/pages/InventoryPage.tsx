import React, { useEffect, useState } from 'react';
import {
  Archive,
  ArchiveRestore,
  Edit,
  Package,
  Plus,
  RefreshCw,
  Search,
} from 'lucide-react';
import { StockStatusBadge } from '../components/common/Badge.js';
import { Button } from '../components/common/Button.js';
import { EmptyState } from '../components/common/EmptyState.js';
import { Spinner } from '../components/common/Spinner.js';
import { useToast } from '../components/common/Toast.js';
import { ProductImage } from '../components/common/ProductImage.js';
import { ProductModal } from '../components/inventory/ProductModal.js';
import { StockModal } from '../components/inventory/StockModal.js';
import * as productService from '../services/products.js';
import { Product } from '../types/index.js';
import { formatCurrency } from '../utils/format.js';

export const InventoryPage: React.FC = () => {
  const { success, error } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [stockStatus, setStockStatus] = useState<string>('all');

  // Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [stockModalProduct, setStockModalProduct] = useState<Product | null>(null);

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const res = await productService.fetchProducts({
        page,
        limit: 15,
        search,
        category: category === 'All' ? undefined : category,
        stockStatus,
        sortBy: 'name',
        sortOrder: 'asc',
      });

      setProducts(res.data);
      setTotalPages(res.pagination.totalPages);
      setTotalCount(res.pagination.totalCount);
    } catch (err: any) {
      error(err.message || 'Failed to load inventory.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await productService.fetchCategories();
      if (res?.data) {
        setCategories(res.data);
      }
    } catch {
      // non-blocking
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [page, category, stockStatus]);

  // Debounced search trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      loadProducts();
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const handleCreateOrUpdate = async (productData: Partial<Product>) => {
    if (editingProduct) {
      await productService.updateProduct(editingProduct._id, productData);
      success('Product updated successfully.');
    } else {
      await productService.createProduct(productData);
      success('New product created successfully.');
    }
    loadProducts();
    loadCategories();
  };

  const handleStockAdjust = async (data: {
    quantityChange: number;
    reason: string;
    note?: string;
  }) => {
    if (!stockModalProduct) return;
    await productService.adjustProductStock(stockModalProduct._id, data);
    success('Inventory stock updated.');
    loadProducts();
  };

  const handleToggleArchive = async (prod: Product) => {
    const actionName = prod.isArchived ? 'unarchive' : 'archive';
    if (
      !confirm(
        `Are you sure you want to ${actionName} "${prod.name}"? ${
          prod.isArchived
            ? 'It will reappear in billing catalogue.'
            : 'It will be hidden from billing catalogue but preserved in historical sales.'
        }`
      )
    ) {
      return;
    }

    try {
      await productService.toggleArchiveProduct(prod._id);
      success(`Product ${prod.isArchived ? 'restored' : 'archived'} successfully.`);
      loadProducts();
    } catch (err: any) {
      error(err.message || `Failed to ${actionName} product.`);
    }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Catalogue & Stock Inventory</h2>
          <p className="text-xs text-slate-500">
            Total {totalCount} {totalCount === 1 ? 'item' : 'items'} in catalogue
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => {
            setEditingProduct(null);
            setIsProductModalOpen(true);
          }}
          icon={<Plus className="w-4 h-4" />}
        >
          Add Product
        </Button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by product name, brand, or model..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Category Dropdown */}
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            className="text-xs sm:text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none flex-1 md:flex-none"
          >
            <option value="All">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Stock Status Filter */}
          <select
            value={stockStatus}
            onChange={(e) => {
              setStockStatus(e.target.value);
              setPage(1);
            }}
            className="text-xs sm:text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none flex-1 md:flex-none"
          >
            <option value="all">Active Items</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock Alerts</option>
            <option value="out_of_stock">Out of Stock</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <Spinner label="Loading catalogue inventory..." className="h-64" />
        ) : products.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={<Package className="w-8 h-8 text-slate-400" />}
              title="No Products Found"
              description="No products match your current search and filter selections."
              action={
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSearch('');
                    setCategory('All');
                    setStockStatus('all');
                  }}
                >
                  Clear Filters
                </Button>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Product Details</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Brand / Model</th>
                  <th className="py-3 px-4 text-right">Cost Price</th>
                  <th className="py-3 px-4 text-right">Selling Price</th>
                  <th className="py-3 px-4 text-center">Stock</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((prod) => (
                  <tr
                    key={prod._id}
                    className={`hover:bg-slate-50/70 transition-colors ${
                      prod.isArchived ? 'opacity-60 bg-slate-50/30' : ''
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200 p-1 shrink-0 overflow-hidden flex items-center justify-center">
                          <ProductImage
                            src={prod.imageUrl}
                            alt={prod.name}
                            category={prod.category}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900 truncate">{prod.name}</div>
                          {(prod.storage || prod.color) && (
                            <div className="text-[11px] text-slate-500 font-normal mt-0.5">
                              {prod.storage && <span className="mr-1.5">{prod.storage}</span>}
                              {prod.color && <span>({prod.color})</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">{prod.category}</td>

                    <td className="py-3.5 px-4 text-slate-600">
                      <span className="font-medium text-slate-800">{prod.brand}</span>
                      {prod.model && <span className="text-slate-400 block text-xs">{prod.model}</span>}
                    </td>

                    <td className="py-3.5 px-4 text-right text-slate-600 font-mono">
                      {formatCurrency(prod.purchasePrice)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-bold text-slate-900 font-mono">
                      {formatCurrency(prod.sellingPrice)}
                    </td>

                    <td className="py-3.5 px-4 text-center font-bold text-slate-900">
                      {prod.stockQuantity}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <StockStatusBadge
                        stock={prod.stockQuantity}
                        threshold={prod.lowStockThreshold}
                        isArchived={prod.isArchived}
                      />
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setStockModalProduct(prod)}
                          title="Quick Stock Adjustment"
                          className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => {
                            setEditingProduct(prod);
                            setIsProductModalOpen(true);
                          }}
                          title="Edit Details"
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleToggleArchive(prod)}
                          title={prod.isArchived ? 'Restore to Catalogue' : 'Archive Product'}
                          className={`p-1.5 rounded-md transition-colors ${
                            prod.isArchived
                              ? 'text-emerald-600 hover:bg-emerald-50'
                              : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                          }`}
                        >
                          {prod.isArchived ? (
                            <ArchiveRestore className="w-4 h-4" />
                          ) : (
                            <Archive className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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

      {/* Add / Edit Product Modal */}
      {isProductModalOpen && (
        <ProductModal
          isOpen={isProductModalOpen}
          onClose={() => {
            setIsProductModalOpen(false);
            setEditingProduct(null);
          }}
          onSubmit={handleCreateOrUpdate}
          product={editingProduct}
          categories={categories}
        />
      )}

      {/* Quick Stock Adjustment Modal */}
      {stockModalProduct && (
        <StockModal
          product={stockModalProduct}
          isOpen={!!stockModalProduct}
          onClose={() => setStockModalProduct(null)}
          onSubmit={handleStockAdjust}
        />
      )}
    </div>
  );
};
