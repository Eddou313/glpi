import { Router } from 'express';
import { createParameter, deleteParameter, getLastParameter, getParameter, updateParameter } from '../controllers/parameter.controller.ts';
const router = Router();

router.get('/Parameter/:id', getParameter);
router.get('/Parameter', getLastParameter);
router.post('/Parameter', createParameter);
router.put('/Parameter/:id', updateParameter);
router.delete('/Parameter/:id', deleteParameter);

export default router;