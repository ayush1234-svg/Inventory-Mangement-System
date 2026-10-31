import React, { useEffect, useRef, useState } from 'react';
import { Loader2, UploadCloud } from 'lucide-react';
import { Product } from '../../types/index.js';
import { paiseToRupees, rupeesToPaise } from '../../utils/format.js';
import { compressImage, formatBytes } from '../../utils/imageCompressor.js';
import { uploadImage } from '../../services/upload.js';
import { Button } from '../common/Button.js';
import { Input } from '../common/Input.js';
import { Modal } from '../common/Modal.js';
import { ProductImage } from '../common/ProductImage.js';
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
  const [imageUrl, setImageUrl] = useState('');
  const [imageMode, setImageMode] = useState<'upload' | 'url'>('upload');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadStats, setUploadStats] = useState<string | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isCapturingPhoto, setIsCapturingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraVideoRef = useRef<HTMLVideoElement>(null);

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
      setImageUrl(product.imageUrl || '');
      setImageMode(
        product.imageUrl && !product.imageUrl.startsWith('/uploads/') && !product.imageUrl.startsWith('data:')
          ? 'url'
          : 'upload'
      );
      setUploadStats(null);
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
      setImageUrl('');
      setImageMode('upload');
      setUploadStats(null);
      setPurchasePriceRupees('');
      setSellingPriceRupees('');
      setStockQuantity(10);
      setLowStockThreshold(5);
      setStorage('');
      setColor('');
    }
    setErrors({});
  }, [product, isOpen]);

  useEffect(() => {
    const video = cameraVideoRef.current;
    if (!video || !cameraStream) return;

    video.srcObject = cameraStream;
    void video.play().catch(() => {
      setErrors((prev) => ({ ...prev, image: 'Unable to start the camera preview.' }));
    });

    return () => {
      video.srcObject = null;
      cameraStream.getTracks().forEach((track) => track.stop());
    };
  }, [cameraStream]);

  const closeModal = () => {
    setCameraStream(null);
    onClose();
  };

  const handleImageFile = async (file?: File) => {
    if (!file) return;

    setIsUploadingImage(true);
    setErrors((prev) => ({ ...prev, image: '' }));

    try {
      // 1. Client-side compression (max 800px, WebP, quality 0.85)
      const compressed = await compressImage(file);
      setUploadStats(`${formatBytes(compressed.compressedSize)} (optimized)`);

      // 2. Upload to server
      const uploadedUrl = await uploadImage(compressed.dataUrl, file.name);
      setImageUrl(uploadedUrl);
    } catch (err: any) {
      setErrors((prev) => ({ ...prev, image: err.message || 'Failed to process image' }));
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const startCamera = async () => {
    setErrors((prev) => ({ ...prev, image: '' }));

    if (!navigator.mediaDevices?.getUserMedia) {
      setErrors((prev) => ({
        ...prev,
        image: 'Camera access is not available in this browser. Use Choose photo instead.',
      }));
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: 'environment' } },
      });
      setCameraStream(stream);
    } catch (err) {
      const message =
        err instanceof DOMException && err.name === 'NotAllowedError'
          ? 'Camera permission was denied. Allow camera access in your browser settings, or use Choose photo.'
          : err instanceof DOMException && err.name === 'NotFoundError'
            ? 'No camera was found on this device. Use Choose photo instead.'
            : 'Could not open the camera. Use Choose photo instead.';
      setErrors((prev) => ({ ...prev, image: message }));
    }
  };

  const capturePhoto = async () => {
    const video = cameraVideoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      setErrors((prev) => ({ ...prev, image: 'The camera is not ready yet. Try again in a moment.' }));
      return;
    }

    setIsCapturingPhoto(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Unable to capture an image from the camera.');

      context.drawImage(video, 0, 0);
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (capturedBlob) =>
            capturedBlob
              ? resolve(capturedBlob)
              : reject(new Error('Unable to capture an image from the camera.')),
          'image/jpeg',
          0.92,
        );
      });

      setCameraStream(null);
      await handleImageFile(new File([blob], `product-photo-${Date.now()}.jpg`, { type: blob.type }));
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        image: err instanceof Error ? err.message : 'Unable to capture a photo.',
      }));
    } finally {
      setIsCapturingPhoto(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    void handleImageFile(e.target.files?.[0]);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    await handleImageFile(file);
  };

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
        imageUrl: imageUrl.trim() || undefined,
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
      closeModal();
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
      onClose={closeModal}
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

        {/* Product Image Section (Device Storage Upload + URL Option) */}
        <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200 space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">
              Product Image
            </span>
            <div className="flex items-center gap-1 bg-slate-200/60 p-0.5 rounded-lg text-[11px] font-medium">
              <button
                type="button"
                onClick={() => setImageMode('upload')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  imageMode === 'upload'
                    ? 'bg-white text-indigo-700 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Upload from Device
              </button>
              <button
                type="button"
                onClick={() => setImageMode('url')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  imageMode === 'url'
                    ? 'bg-white text-indigo-700 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Image URL
              </button>
            </div>
          </div>

          {errors.image && (
            <div className="p-2 bg-rose-50 border border-rose-200 rounded text-xs text-rose-600 font-medium">
              {errors.image}
            </div>
          )}

          {/* Mode 1: Device Upload (Camera / PC / Mobile Storage) */}
          {imageMode === 'upload' ? (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                aria-label="Choose a product photo"
              />

              {imageUrl ? (
                <div className="flex items-center gap-3 p-2.5 bg-white rounded-lg border border-slate-200">
                  <div className="w-16 h-16 rounded-md bg-slate-50 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center p-1">
                    <ProductImage
                      src={imageUrl}
                      alt={name || 'Preview'}
                      category={category === 'CUSTOM' ? customCategory : category}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">Image Attached</p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {uploadStats
                        ? uploadStats
                        : imageUrl.startsWith('/uploads/')
                        ? 'Stored on server'
                        : 'Image loaded'}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingImage}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
                      >
                        Change Photo
                      </button>
                      <span className="text-slate-300">•</span>
                      <button
                        type="button"
                        onClick={() => {
                          setImageUrl('');
                          setUploadStats(null);
                        }}
                        className="text-xs text-rose-600 hover:text-rose-800 font-medium cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-4 text-center transition-all ${
                    isUploadingImage
                      ? 'border-indigo-400 bg-indigo-50/50 cursor-wait'
                      : 'border-slate-300 bg-white hover:border-indigo-400 hover:bg-indigo-50/20'
                  }`}
                >
                  {cameraStream ? (
                    <div className="space-y-3">
                      <video
                        ref={cameraVideoRef}
                        autoPlay
                        muted
                        playsInline
                        aria-label="Live camera preview"
                        className="mx-auto max-h-72 w-full rounded-lg bg-black object-contain"
                      />
                      <div className="flex justify-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setCameraStream(null)}
                          disabled={isCapturingPhoto}
                        >
                          Cancel camera
                        </Button>
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          onClick={() => void capturePhoto()}
                          isLoading={isCapturingPhoto}
                        >
                          Capture photo
                        </Button>
                      </div>
                    </div>
                  ) : isUploadingImage ? (
                    <div className="flex flex-col items-center justify-center py-2 text-indigo-600">
                      <Loader2 className="w-6 h-6 animate-spin mb-1.5" />
                      <span className="text-xs font-semibold">Optimizing & Uploading image...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-1">
                      <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2">
                        <UploadCloud className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-semibold text-slate-800">
                        Add a photo from your device or take one now
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Supports JPG, PNG, WebP (auto-optimized for instant loading)
                      </p>
                      <div className="mt-3 flex flex-col justify-center gap-2 sm:flex-row">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          Choose photo
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => void startCamera()}
                        >
                          Take photo
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Mode 2: External Image URL */
            <div className="flex items-start gap-3">
              <div className="w-14 h-14 rounded-md bg-white border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center p-1">
                <ProductImage
                  src={imageUrl}
                  alt={name || 'Preview'}
                  category={category === 'CUSTOM' ? customCategory : category}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex-1 min-w-0">
                <Input
                  placeholder="https://images.unsplash.com/... or direct link"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  helperText="Paste any direct web link to an image"
                />
              </div>
            </div>
          )}
        </div>

        {/* Smartphone-Specific Attributes (Only shown when category is Smartphones) */}
        {isPhone && (
          <div className="p-3.5 bg-indigo-50/50 rounded-lg border border-indigo-100 space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 block">
              Smartphone Attributes
            </span>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
          <Button variant="outline" type="button" onClick={closeModal} disabled={isSubmitting}>
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
