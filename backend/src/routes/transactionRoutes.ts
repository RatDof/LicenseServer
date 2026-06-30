import { Router } from 'express';
import { TransactionController } from '../controllers/transactionController';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);
router.get('/', TransactionController.getTransactions);
router.get('/:id', TransactionController.getTransactionById);
export default router;
