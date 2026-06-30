import { Router } from 'express';
import { LicenseController } from '../controllers/licenseController';
import { authenticate, requireAdmin, requireAdminOrReseller } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', requireAdminOrReseller, LicenseController.getLicenses);
router.get('/my', LicenseController.getUserLicenses);
router.post('/validate', LicenseController.validateLicense);
router.get('/:id', requireAdminOrReseller, LicenseController.getLicenseById);
router.post('/', requireAdminOrReseller, LicenseController.createLicense);
router.post('/bulk', requireAdminOrReseller, LicenseController.bulkCreateLicenses);
router.put('/:id', requireAdminOrReseller, LicenseController.updateLicense);
router.delete('/:id', requireAdmin, LicenseController.deleteLicense);
router.post('/:id/suspend', requireAdminOrReseller, LicenseController.suspendLicense);
router.post('/:id/resume', requireAdminOrReseller, LicenseController.resumeLicense);

export default router;
