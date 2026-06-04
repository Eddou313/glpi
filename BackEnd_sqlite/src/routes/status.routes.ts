import { Router } from 'express';
import { getStatus } from '../controllers/status.controller.js'; // .js obligatoire avec nodenext

const router = Router();

router.get('/status', getStatus);

export default router;