import { Router } from 'express';
import * as productController from '../controllers/productController.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import {
  createProductSchema,
  productQuerySchema,
  stockAdjustmentSchema,
  updateProductSchema,
} from '../validators/productValidator.js';

const router = Router();

// Protect all inventory routes
router.use(requireAuth);

router.get('/', validateQuery(productQuerySchema), productController.getProducts);
router.get('/categories', productController.getCategories);
router.get('/:id', productController.getProductById);
router.get('/:id/adjustments', productController.getProductAdjustments);

router.post('/', validateBody(createProductSchema), productController.createProduct);
router.patch('/:id', validateBody(updateProductSchema), productController.updateProduct);
router.patch('/:id/stock', validateBody(stockAdjustmentSchema), productController.adjustStock);
router.patch('/:id/archive', productController.toggleArchive);

export default router;
