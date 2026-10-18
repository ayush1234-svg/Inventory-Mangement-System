import { Request, Response } from 'express';
import * as reportService from '../services/reportService.js';

export async function getReports(req: Request, res: Response): Promise<void> {
  const { startDate, endDate, preset } = req.query;
  const report = await reportService.getComprehensiveReport({
    startDate: startDate as string,
    endDate: endDate as string,
    preset: preset as any,
  });
  res.json({ success: true, data: report });
}
