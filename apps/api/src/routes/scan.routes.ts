import { Router } from 'express';
import { ScanController } from '../controllers/scan.controller.js';
import { validateBody } from '../middleware/validateRequest.js';
import { triggerScanSchema } from '@vulnsight/validation';

const router = Router();

router.post('/', validateBody(triggerScanSchema), ScanController.triggerScan);
router.get('/', ScanController.listScans);
router.get('/findings', ScanController.listFindings);
router.post('/posture', ScanController.getPostureSummary);
router.get('/reports', ScanController.listReports);
router.post('/openapi/parse', ScanController.parseOpenApiSpec);
router.post('/compare', ScanController.compareScans);
router.post('/findings/:id/analyze', ScanController.analyzeFinding);
router.get('/:id/report', ScanController.generateReport);
router.get('/:id', ScanController.getScan);
router.post('/:id/cancel', ScanController.cancelScan);

export default router;
