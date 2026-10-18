import React, { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, RotateCcw } from 'lucide-react';
import { Product } from '../../types/index.js';
import { Button } from '../common/Button.js';
import { Input } from '../common/Input.js';
import { Modal } from '../common/Modal.js';
import { ProductImage } from '../common/ProductImage.js';
import { Select } from '../common/Select.js';

interface StockModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { quantityChange: number; reason: string; note?: string }) => Promise<void>;
}

export const StockModal: React.FC<StockModalProps> = ({
  product,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [operation, setOperation] = useState<'ADD' | 'SUBTRACT' | 'SET'>('ADD');
  const [amount, setAmount] = useState<number | ''>(10);
  const [reason, setReason] = useState<'RESTOCK' | 'MANUAL_CORRECTION' | 'DAMAGE_WRITE_OFF'>('RESTOCK');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setOperation('ADD');
      setAmount(10);
      setReason('RESTOCK');
      setNote('');
      setError('');
    }
  }, [isOpen]);

  if (!product) return null;

  const currentStock = product.stockQuantity;

  let delta = 0;
  if (typeof amount === 'number') {
    if (operation === 'ADD') delta = amount;
    else if (operation === 'SUBTRACT') delta = -amount;
    else if (operation === 'SET') delta = amount - currentStock;
  }

  const resultingStock = currentStock + delta;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount === '' || delta === 0) {
      setError('Please specify a non-zero quantity adjustment.');
      return;
    }

    if (resultingStock < 0) {
      setError(`Cannot reduce stock below zero. Current stock is ${currentStock}.`);
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onSubmit({
        quantityChange: delta,
        reason,
        note: note.trim(),
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to adjust stock.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Update Product Stock"
      description={`Record an inventory adjustment for ${product.name}.`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-xs font-medium text-rose-700">
            {error}
          </div>
        )}

        {/* Product Visual Header */}
        <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="w-12 h-12 rounded-md bg-white border border-slate-200 p-1 shrink-0 overflow-hidden flex items-center justify-center">
            <ProductImage
              src={product.imageUrl}
              alt={product.name}
              category={product.category}
              className="w-full h-full object-contain"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-bold text-slate-900 truncate">{product.name}</h4>
            <p className="text-[11px] text-slate-500">
              {product.brand} • {product.category}
              {product.storage && ` • ${product.storage}`}
            </p>
          </div>
        </div>

        {/* Current vs New Stock Visual */}
        <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
          <div>
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
              Current Stock
            </span>
            <span className="text-xl font-bold text-slate-800">{currentStock}</span>
          </div>

          <div>
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
              Resulting Stock
            </span>
            <span
              className={`text-xl font-extrabold ${
                resultingStock < 0
                  ? 'text-rose-600'
                  : resultingStock <= product.lowStockThreshold
                  ? 'text-amber-600'
                  : 'text-emerald-600'
              }`}
            >
              {resultingStock}
            </span>
          </div>
        </div>

        {/* Operation Type */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
            Adjustment Type
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                setOperation('ADD');
                setReason('RESTOCK');
              }}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-semibold border transition-all ${
                operation === 'ADD'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <ArrowUp className="w-3.5 h-3.5" />
              <span>Add Stock (+)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setOperation('SUBTRACT');
                setReason('MANUAL_CORRECTION');
              }}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-semibold border transition-all ${
                operation === 'SUBTRACT'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <ArrowDown className="w-3.5 h-3.5" />
              <span>Reduce (-)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setOperation('SET');
                setReason('MANUAL_CORRECTION');
              }}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-semibold border transition-all ${
                operation === 'SET'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Set Count</span>
            </button>
          </div>
        </div>

        {/* Quantity Input */}
        <Input
          label={
            operation === 'SET' ? 'New Total Stock Count' : 'Units to Adjust'
          }
          type="number"
          min="1"
          step="1"
          value={amount}
          onChange={(e) =>
            setAmount(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10)))
          }
        />

        {/* Reason Selector */}
        <Select
          label="Adjustment Reason (For Audit Log)"
          value={reason}
          onChange={(e) => setReason(e.target.value as any)}
          options={[
            { label: 'New Stock Restock (Fresh Shipment)', value: 'RESTOCK' },
            { label: 'Manual Physical Count Correction', value: 'MANUAL_CORRECTION' },
            { label: 'Damaged / Defective Write-off', value: 'DAMAGE_WRITE_OFF' },
          ]}
        />

        {/* Optional Note */}
        <Input
          label="Audit Note (Optional)"
          placeholder="e.g. Received shipment from distributor invoice #412"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            isLoading={isSubmitting}
            disabled={resultingStock < 0 || amount === '' || delta === 0}
          >
            Apply Adjustment
          </Button>
        </div>
      </form>
    </Modal>
  );
};
