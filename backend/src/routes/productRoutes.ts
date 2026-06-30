import { Router } from 'express';
import { ProductController } from '../controllers/productController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();
router.use(authenticate);
router.get('/', ProductController.getProducts);
router.get('/:id', ProductController.getProductById);
router.post('/', requireAdmin, ProductController.createProduct);
router.put('/:id', requireAdmin, ProductController.updateProduct);
router.delete('/:id', requireAdmin, ProductController.deleteProduct);
export default router;
