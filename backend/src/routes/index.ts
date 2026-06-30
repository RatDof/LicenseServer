import { Router } from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import licenseRoutes from './licenseRoutes';
import productRoutes from './productRoutes';
import transactionRoutes from './transactionRoutes';
import analyticsRoutes from './analyticsRoutes';
import settingsRoutes from './settingsRoutes';
import { LicenseController } from '../controllers/licenseController';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/licenses', licenseRoutes);
router.use('/products', productRoutes);
router.use('/transactions', transactionRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/settings', settingsRoutes);
router.post('/app/license', (req, res) => LicenseController.checkLicenseForApp(req as any, res));

router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'LicenseServer API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

export default router;
