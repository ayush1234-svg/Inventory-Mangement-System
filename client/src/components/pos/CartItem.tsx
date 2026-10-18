import React from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { CartItem as CartItemType } from '../../types/index.js';
import { formatCurrency } from '../../utils/format.js';
import { ProductImage } from '../common/ProductImage.js';

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (productId: string, newQty: number) => void;
  onRemove: (productId: string) => void;
}

export const CartItemRow: React.FC<CartItemProps> = ({ item, onUpdateQuantity, onRemove }) => {
  const lineTotal = item.product.sellingPrice * item.quantity;
  const isMaxStock = item.quantity >= item.product.stockQuantity;

  return (
    <div className="flex items-center justify-between gap-2.5 p-2.5 bg-white border border-slate-200 rounded-lg shadow-xs hover:border-slate-300 transition-colors">
      <div className="w-10 h-10 rounded-md bg-slate-50 border border-slate-200 p-1 shrink-0 overflow-hidden flex items-center justify-center">
        <ProductImage
          src={item.product.imageUrl}
          alt={item.product.name}
          category={item.product.category}
          className="w-full h-full object-contain"
        />
      </div>

      <div className="min-w-0 flex-1">
        <h5 className="text-xs font-semibold text-slate-900 truncate">
          {item.product.name}
        </h5>
        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
          <span>{formatCurrency(item.product.sellingPrice)} each</span>
          {item.product.storage && (
            <span className="text-slate-600 font-medium">({item.product.storage})</span>
          )}
          <span className="text-slate-400 font-mono">Stock: {item.product.stockQuantity}</span>
        </div>
      </div>

      {/* Stepper Controls */}
      <div className="flex items-center gap-1.5 shrink-0">
        <div className="flex items-center border border-slate-200 rounded-md bg-slate-50 overflow-hidden">
          <button
            onClick={() => onUpdateQuantity(item.product._id, item.quantity - 1)}
            className="p-1.5 text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors disabled:opacity-40"
            aria-label="Decrease quantity"
          >
            <Minus className="w-3 h-3" />
          </button>

          <span className="w-7 text-center text-xs font-semibold text-slate-900 select-none">
            {item.quantity}
          </span>

          <button
            disabled={isMaxStock}
            onClick={() => onUpdateQuantity(item.product._id, item.quantity + 1)}
            className="p-1.5 text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Increase quantity"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>

        {/* Line Total */}
        <div className="w-20 text-right">
          <span className="text-xs font-bold text-slate-900 block truncate">
            {formatCurrency(lineTotal)}
          </span>
        </div>

        {/* Remove Button */}
        <button
          onClick={() => onRemove(item.product._id)}
          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
          title="Remove line item"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
