import { Router } from 'express';
import { balance } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/balance', authenticate, balance);

export default router;
