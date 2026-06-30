import { Router } from 'express';
import { AnalyticsController } from '../controllers/analyticsController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();
router.use(authenticate, requireAdmin);
router.get('/', AnalyticsController.getDashboard);
router.get('/transactions', AnalyticsController.getTransactionAnalytics);
export default router;
