import { Router } from 'express';
import { TargetController } from '../controllers/target.controller.js';
import { validateBody } from '../middleware/validateRequest.js';
import { createTargetSchema } from '@vulnsight/validation';

const router = Router();

router.get('/', TargetController.listTargets);
router.post('/', validateBody(createTargetSchema), TargetController.createTarget);
router.post('/:id/verify', TargetController.verifyTarget);

export default router;
