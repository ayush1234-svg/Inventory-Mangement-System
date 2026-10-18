import React from 'react';
import {
  Headphones,
  Package,
  Plus,
  ShieldAlert,
  Smartphone,
  Sparkles,
  Usb,
  Zap,
} from 'lucide-react';
import { Product } from '../../types/index.js';
import { formatCurrency } from '../../utils/format.js';
import { StockStatusBadge } from '../common/Badge.js';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  cartQuantity?: number;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  cartQuantity = 0,
}) => {
  const isOutOfStock = product.stockQuantity <= 0;
  const isMaxInCart = cartQuantity >= product.stockQuantity;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Smartphones':
        return <Smartphone className="w-5 h-5 text-indigo-600" />;
      case 'Audio & Headphones':
        return <Headphones className="w-5 h-5 text-indigo-600" />;
      case 'Cables & Chargers':
        return <Zap className="w-5 h-5 text-amber-600" />;
      case 'Power Banks':
        return <Usb className="w-5 h-5 text-emerald-600" />;
      case 'Cases & Covers':
      case 'Screen Protectors':
        return <Sparkles className="w-5 h-5 text-sky-600" />;
      default:
        return <Package className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div
      onClick={() => {
        if (!isOutOfStock && !isMaxInCart) {
          onAddToCart(product);
        }
      }}
      className={`group relative flex flex-col justify-between p-3.5 rounded-lg border bg-white transition-all select-none ${
        isOutOfStock
          ? 'opacity-60 border-slate-200 cursor-not-allowed bg-slate-50/50'
          : isMaxInCart
          ? 'border-indigo-300 ring-1 ring-indigo-200 bg-indigo-50/20 cursor-pointer'
          : 'border-slate-200 hover:border-indigo-400 hover:shadow-sm cursor-pointer active:scale-[0.99]'
      }`}
    >
      <div>
        {/* Header with Category Icon and Stock Badge */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center shrink-0">
            {getCategoryIcon(product.category)}
          </div>
          <StockStatusBadge
            stock={product.stockQuantity}
            threshold={product.lowStockThreshold}
            isArchived={product.isArchived}
          />
        </div>

        {/* Product Details */}
        <h4 className="text-sm font-semibold text-slate-900 line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors">
          {product.name}
        </h4>

        <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-xs text-slate-500">
          <span className="font-medium text-slate-700">{product.brand}</span>
          {product.model && <span>• {product.model}</span>}
          {product.storage && (
            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[11px] font-medium text-slate-700">
              {product.storage}
            </span>
          )}
          {product.color && (
            <span className="text-[11px] text-slate-500">({product.color})</span>
          )}
        </div>
      </div>

      {/* Footer with Price and Quick Add */}
      <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100">
        <div>
          <span className="text-xs text-slate-400 block font-medium">Selling Price</span>
          <span className="text-sm font-bold text-slate-900">
            {formatCurrency(product.sellingPrice)}
          </span>
        </div>

        <button
          disabled={isOutOfStock || isMaxInCart}
          className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-md transition-colors ${
            cartQuantity > 0
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-100 text-slate-700 group-hover:bg-indigo-50 group-hover:text-indigo-600'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{cartQuantity > 0 ? `In Bill (${cartQuantity})` : 'Add'}</span>
        </button>
      </div>

      {isMaxInCart && (
        <div className="absolute inset-x-0 -bottom-2 flex justify-center pointer-events-none">
          <span className="text-[10px] bg-indigo-700 text-white px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
            <ShieldAlert className="w-2.5 h-2.5" /> Max stock reached
          </span>
        </div>
      )}
    </div>
  );
};
