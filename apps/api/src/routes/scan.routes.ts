import { Router } from 'express';
import { ScanController } from '../controllers/scan.controller.js';
import { validateBody } from '../middleware/validateRequest.js';
import { triggerScanSchema } from '@vulnsight/validation';

const router = Router();

router.post('/', validateBody(triggerScanSchema), ScanController.triggerScan);
router.get('/:id', ScanController.getScan);
router.post('/:id/cancel', ScanController.cancelScan);
router.post('/compare', ScanController.compareScans);
router.post('/findings/:id/analyze', ScanController.analyzeFinding);
router.get('/:id/report', ScanController.generateReport);

export default router;
