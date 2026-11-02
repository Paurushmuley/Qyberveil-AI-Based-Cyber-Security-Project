import { Router } from 'express';
import { ProjectController } from '../controllers/project.controller.js';
import { validateBody } from '../middleware/validateRequest.js';
import { createProjectSchema } from '@vulnsight/validation';

const router = Router();

router.get('/', ProjectController.listProjects);
router.post('/', validateBody(createProjectSchema), ProjectController.createProject);
router.get('/:id', ProjectController.getProject);
router.delete('/:id', ProjectController.deleteProject);

export default router;
