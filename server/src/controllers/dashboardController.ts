import { Request, Response } from 'express';
import * as dashboardService from '../services/dashboardService.js';

export async function getSummary(_req: Request, res: Response): Promise<void> {
  const summary = await dashboardService.getDashboardSummary();
  res.json({ success: true, data: summary });
}

export async function getSalesOverview(req: Request, res: Response): Promise<void> {
  const days = req.query.days ? parseInt(req.query.days as string, 10) : 7;
  const overview = await dashboardService.getSalesOverview(days);
  res.json({ success: true, data: overview });
}

export async function getLowStock(req: Request, res: Response): Promise<void> {
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
  const products = await dashboardService.getLowStockProducts(limit);
  res.json({ success: true, data: products });
}

export async function getRecentSales(req: Request, res: Response): Promise<void> {
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 5;
  const sales = await dashboardService.getRecentSales(limit);
  res.json({ success: true, data: sales });
}
