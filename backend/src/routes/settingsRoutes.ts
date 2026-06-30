import { Router } from 'express';
import { SettingsController } from '../controllers/settingsController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();
router.use(authenticate, requireAdmin);
router.get('/', SettingsController.getSettings);
router.put('/', SettingsController.updateSettings);
router.get('/logs', SettingsController.getLogs);
export default router;
