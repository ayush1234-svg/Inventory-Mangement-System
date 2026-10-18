import { Request, Response } from 'express';
import * as settingsService from '../services/settingsService.js';

export async function getSettings(_req: Request, res: Response): Promise<void> {
  const settings = await settingsService.getShopSettings();
  res.json({ success: true, data: settings });
}

export async function updateSettings(req: Request, res: Response): Promise<void> {
  const settings = await settingsService.updateShopSettings(req.body);
  res.json({
    success: true,
    message: 'Settings updated successfully',
    data: settings,
  });
}
