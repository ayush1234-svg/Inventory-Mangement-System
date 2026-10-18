import { Request, Response } from 'express';
import * as saleService from '../services/saleService.js';

export async function createSale(req: Request, res: Response): Promise<void> {
  const sale = await saleService.createSale(req.body, req.user?.id);
  res.status(201).json({
    success: true,
    message: 'Sale completed successfully',
    data: sale,
  });
}

export async function getSales(req: Request, res: Response): Promise<void> {
  const result = await saleService.getSales(req.query as any);
  res.json({
    success: true,
    data: result.sales,
    pagination: result.pagination,
  });
}

export async function getSaleById(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const sale = await saleService.getSaleById(id);
  if (!sale) {
    res.status(404).json({ success: false, message: 'Sale invoice not found' });
    return;
  }
  res.json({ success: true, data: sale });
}
