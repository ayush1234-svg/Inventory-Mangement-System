import { Router } from 'express';
import * as dashboardController from '../controllers/dashboardController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/summary', dashboardController.getSummary);
router.get('/sales-overview', dashboardController.getSalesOverview);
router.get('/low-stock', dashboardController.getLowStock);
router.get('/recent-sales', dashboardController.getRecentSales);

export default router;
