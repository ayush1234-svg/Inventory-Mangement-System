import { Request, Response } from 'express';
import * as productService from '../services/productService.js';

export async function getProducts(req: Request, res: Response): Promise<void> {
  const result = await productService.getProducts(req.query as any);
  res.json({
    success: true,
    data: result.products,
    pagination: result.pagination,
  });
}

export async function getProductById(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const product = await productService.getProductById(id);
  if (!product) {
    res.status(404).json({ success: false, message: 'Product not found' });
    return;
  }
  res.json({ success: true, data: product });
}

export async function createProduct(req: Request, res: Response): Promise<void> {
  const product = await productService.createProduct(req.body, req.user?.id);
  res.status(201).json({
    success: true,
    message: 'Product created successfully',
    data: product,
  });
}

export async function updateProduct(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const product = await productService.updateProduct(id, req.body);
  if (!product) {
    res.status(404).json({ success: false, message: 'Product not found' });
    return;
  }
  res.json({
    success: true,
    message: 'Product updated successfully',
    data: product,
  });
}

export async function adjustStock(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const { quantityChange, reason, note } = req.body;
  const result = await productService.adjustProductStock(
    id,
    quantityChange,
    reason,
    note,
    req.user?.id
  );
  res.json({
    success: true,
    message: `Stock successfully adjusted by ${quantityChange > 0 ? '+' : ''}${quantityChange}`,
    data: result.product,
    adjustment: result.adjustment,
  });
}

export async function toggleArchive(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const product = await productService.toggleArchiveProduct(id);
  if (!product) {
    res.status(404).json({ success: false, message: 'Product not found' });
    return;
  }
  res.json({
    success: true,
    message: product.isArchived ? 'Product archived' : 'Product unarchived and active',
    data: product,
  });
}

export async function getCategories(_req: Request, res: Response): Promise<void> {
  const categories = await productService.getProductCategories();
  res.json({ success: true, data: categories });
}

export async function getProductAdjustments(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const adjustments = await productService.getProductStockAdjustments(id);
  res.json({ success: true, data: adjustments });
}
