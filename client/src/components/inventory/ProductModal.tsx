import React, { useEffect, useState } from 'react';
import { Product } from '../../types/index.js';
import { paiseToRupees, rupeesToPaise } from '../../utils/format.js';
import { Button } from '../common/Button.js';
import { Input } from '../common/Input.js';
import { Modal } from '../common/Modal.js';
import { Select } from '../common/Select.js';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Product>) => Promise<void>;
  product?: Product | null;
  categories: string[];
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  product,
  categories,
}) => {
  const isEditing = !!product;

  const [name, setName] = useState('');
  const [category, setCategory] = useState('Smartphones');
  const [customCategory, setCustomCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [purchasePriceRupees, setPurchasePriceRupees] = useState<number | ''>('');
  const [sellingPriceRupees, setSellingPriceRupees] = useState<number | ''>('');
  const [stockQuantity, setStockQuantity] = useState<number | ''>(0);
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(5);
  const [storage, setStorage] = useState('');
  const [color, setColor] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (product) {
      setName(product.name || '');
      setCategory(product.category || 'Smartphones');
      setBrand(product.brand || '');
      setModel(product.model || '');
      setPurchasePriceRupees(paiseToRupees(product.purchasePrice));
      setSellingPriceRupees(paiseToRupees(product.sellingPrice));
      setStockQuantity(product.stockQuantity ?? 0);
      setLowStockThreshold(product.lowStockThreshold ?? 5);
      setStorage(product.storage || '');
      setColor(product.color || '');
    } else {
      setName('');
      setCategory('Smartphones');
      setCustomCategory('');
      setBrand('');
      setModel('');
      setPurchasePriceRupees('');
      setSellingPriceRupees('');
      setStockQuantity(10);
      setLowStockThreshold(5);
      setStorage('');
      setColor('');
    }
    setErrors({});
  }, [product, isOpen]);

  const isPhone = category === 'Smartphones' || customCategory === 'Smartphones';

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Product name is required';
    if (!brand.trim()) errs.brand = 'Brand is required';
    if (category === 'CUSTOM' && !customCategory.trim()) {
      errs.category = 'Custom category name is required';
    }
    if (purchasePriceRupees === '' || Number(purchasePriceRupees) < 0) {
      errs.purchasePrice = 'Valid purchase price (>= 0) is required';
    }
    if (sellingPriceRupees === '' || Number(sellingPriceRupees) < 0) {
      errs.sellingPrice = 'Valid selling price (>= 0) is required';
    }
    if (!isEditing && (stockQuantity === '' || Number(stockQuantity) < 0)) {
      errs.stockQuantity = 'Valid initial stock quantity is required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload: Partial<Product> = {
        name: name.trim(),
        category: category === 'CUSTOM' ? customCategory.trim() : category,
        brand: brand.trim(),
        model: model.trim(),
        purchasePrice: rupeesToPaise(Number(purchasePriceRupees)),
        sellingPrice: rupeesToPaise(Number(sellingPriceRupees)),
        lowStockThreshold: Number(lowStockThreshold),
        storage: isPhone ? storage.trim() : '',
        color: isPhone ? color.trim() : '',
      };

      if (!isEditing) {
        payload.stockQuantity = Math.floor(Number(stockQuantity));
      }

      await onSubmit(payload);
      onClose();
    } catch (err: any) {
      setErrors({ form: err.message || 'Failed to save product.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const categoryOptions = [
    ...categories.map((c) => ({ label: c, value: c })),
    { label: '+ Add Custom Category...', value: 'CUSTOM' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Product Details' : 'Add New Product to Catalogue'}
      description={
        isEditing
          ? 'Modify product specifications or pricing. Stock changes must be recorded via Stock Adjustments.'
          : 'Enter product identity, pricing in ₹, and stock information.'
      }
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.form && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-xs font-medium text-rose-700">
            {errors.form}
          </div>
        )}

        {/* Row 1: Category & Brand */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Select
              label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              options={categoryOptions}
            />
            {category === 'CUSTOM' && (
              <Input
                placeholder="Enter new category name"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                error={errors.category}
                className="mt-2"
              />
            )}
          </div>

          <Input
            label="Brand"
            placeholder="e.g. Apple, Samsung, boAt"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            error={errors.brand}
          />
        </div>

        {/* Row 2: Product Name & Model */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Product Name"
            placeholder="e.g. iPhone 15 / 20W Power Adapter"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
          />

          <Input
            label="Model (Optional)"
            placeholder="e.g. A2846, MHJE3HN/A"
            value={model}
            onChange={(e) => setModel(e.target.value)}
          />
        </div>

        {/* Smartphone-Specific Attributes (Only shown when category is Smartphones) */}
        {isPhone && (
          <div className="p-3.5 bg-indigo-50/50 rounded-lg border border-indigo-100 space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 block">
              Smartphone Attributes
            </span>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Storage"
                placeholder="e.g. 128GB, 256GB"
                value={storage}
                onChange={(e) => setStorage(e.target.value)}
              />
              <Input
                label="Color"
                placeholder="e.g. Black, Blue, Titanium"
                value={color}
                onChange={(e) => setColor(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Row 3: Pricing */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Purchase Cost (₹)"
            type="number"
            step="0.01"
            min="0"
            placeholder="e.g. 1200"
            value={purchasePriceRupees}
            onChange={(e) =>
              setPurchasePriceRupees(e.target.value === '' ? '' : parseFloat(e.target.value))
            }
            error={errors.purchasePrice}
            helperText="Cost price (used for accurate gross profit tracking)"
          />

          <Input
            label="Selling Price (₹)"
            type="number"
            step="0.01"
            min="0"
            placeholder="e.g. 1599"
            value={sellingPriceRupees}
            onChange={(e) =>
              setSellingPriceRupees(e.target.value === '' ? '' : parseFloat(e.target.value))
            }
            error={errors.sellingPrice}
            helperText="Retail price for customer billing"
          />
        </div>

        {/* Row 4: Stock & Threshold */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {!isEditing ? (
            <Input
              label="Initial Stock Quantity"
              type="number"
              min="0"
              step="1"
              value={stockQuantity}
              onChange={(e) =>
                setStockQuantity(e.target.value === '' ? '' : parseInt(e.target.value, 10))
              }
              error={errors.stockQuantity}
            />
          ) : (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Current Stock
              </label>
              <div className="px-3 py-2 bg-slate-100 rounded-md text-sm font-semibold text-slate-800 border border-slate-200">
                {product.stockQuantity} units
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                To adjust stock, use the "Stock Adjustment" button on the table.
              </p>
            </div>
          )}

          <Input
            label="Low-Stock Alert Threshold"
            type="number"
            min="0"
            step="1"
            value={lowStockThreshold}
            onChange={(e) => setLowStockThreshold(parseInt(e.target.value, 10) || 0)}
            helperText="Triggers warning when stock falls to or below this level"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" isLoading={isSubmitting}>
            {isEditing ? 'Save Changes' : 'Create Product'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
