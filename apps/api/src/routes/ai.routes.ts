import { Router } from 'express';
import { AIController } from '../controllers/ai.controller.js';
import { validateBody } from '../middleware/validateRequest.js';
import { configureAiProviderSchema } from '@vulnsight/validation';

const router = Router();

router.get('/config', AIController.getConfigs);
router.post('/config', validateBody(configureAiProviderSchema), AIController.saveConfig);
router.post('/test', AIController.testConnection);
router.delete('/config/:provider', AIController.deleteConfig);
router.get('/models/:provider', AIController.getModels);

export default router;
