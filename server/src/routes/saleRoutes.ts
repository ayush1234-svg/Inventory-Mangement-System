import { Router } from 'express';
import * as saleController from '../controllers/saleController.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import { createSaleSchema, salesQuerySchema } from '../validators/saleValidator.js';

const router = Router();

router.use(requireAuth);

router.post('/', validateBody(createSaleSchema), saleController.createSale);
router.get('/', validateQuery(salesQuerySchema), saleController.getSales);
router.get('/:id', saleController.getSaleById);

export default router;
