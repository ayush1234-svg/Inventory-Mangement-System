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
    <div className="flex flex-col gap-2.5 rounded-lg border border-slate-200 bg-white p-2.5 shadow-xs transition-colors hover:border-slate-300">
      <div className="flex min-w-0 items-start gap-2.5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-slate-50 p-1">
          <ProductImage
            src={item.product.imageUrl}
            alt={item.product.name}
            category={item.product.category}
            className="h-full w-full object-contain"
          />
        </div>
        <div className="min-w-0 flex-1">
          <h5 className="line-clamp-2 break-words text-xs font-semibold leading-4 text-slate-900">
            {item.product.name}
          </h5>
          <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-500">
            <span className="whitespace-nowrap">{formatCurrency(item.product.sellingPrice)} each</span>
            {item.product.storage && (
              <span className="font-medium text-slate-600">{item.product.storage}</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex min-w-0 flex-wrap items-center gap-2 border-t border-slate-100 pt-2">
        <div className="flex shrink-0 items-center overflow-hidden rounded-md border border-slate-200 bg-slate-50">
          <button
            type="button"
            onClick={() => onUpdateQuantity(item.product._id, item.quantity - 1)}
            className="inline-flex h-7 w-7 items-center justify-center text-slate-600 transition-colors hover:bg-slate-200 hover:text-slate-900 disabled:opacity-40"
            aria-label="Decrease quantity"
          >
            <Minus className="h-3 w-3" />
          </button>

          <span className="min-w-8 px-1 text-center text-xs font-semibold tabular-nums text-slate-900">
            {item.quantity}
          </span>

          <button
            type="button"
            disabled={isMaxStock}
            onClick={() => onUpdateQuantity(item.product._id, item.quantity + 1)}
            className="inline-flex h-7 w-7 items-center justify-center text-slate-600 transition-colors hover:bg-slate-200 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Increase quantity"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>

        <div className="ml-auto flex min-w-0 items-center justify-end gap-1.5">
          <span className="whitespace-nowrap text-xs font-bold tabular-nums text-slate-900">
            {formatCurrency(lineTotal)}
          </span>
          <button
            type="button"
            onClick={() => onRemove(item.product._id)}
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
            aria-label={`Remove ${item.product.name} from bill`}
            title="Remove line item"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
