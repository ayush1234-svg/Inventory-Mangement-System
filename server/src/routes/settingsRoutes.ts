import { Router } from 'express';
import * as settingsController from '../controllers/settingsController.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { updateSettingsSchema } from '../validators/settingsValidator.js';

const router = Router();

router.use(requireAuth);

router.get('/', settingsController.getSettings);
router.patch('/', validateBody(updateSettingsSchema), settingsController.updateSettings);

export default router;
