import { Router } from 'express';
import authRoutes from './authRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import productRoutes from './productRoutes.js';
import reportRoutes from './reportRoutes.js';
import saleRoutes from './saleRoutes.js';
import settingsRoutes from './settingsRoutes.js';

const router = Router();

// Health check endpoint
router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'WTL Mobile Shop Management API',
    timestamp: new Date().toISOString(),
  });
});

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/sales', saleRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reports', reportRoutes);
router.use('/settings', settingsRoutes);

export default router;
