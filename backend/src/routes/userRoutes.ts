import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', requireAdmin, UserController.getUsers);
router.get('/:id', requireAdmin, UserController.getUserById);
router.post('/', requireAdmin, UserController.createUser);
router.put('/:id', requireAdmin, UserController.updateUser);
router.delete('/:id', requireAdmin, UserController.deleteUser);
router.post('/:id/balance', requireAdmin, UserController.adjustBalance);

export default router;
