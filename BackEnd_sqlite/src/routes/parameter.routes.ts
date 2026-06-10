import { Router } from 'express';
import { createParameter, deleteParameter, getAllParameter, getLastParameter, getParameter, updateParameter } from '../controllers/parameter.controller.ts';
const router = Router();

router.get('/:id', getParameter);
router.get('/Parameters', getAllParameter);
router.get('/', getLastParameter);
router.post('/', createParameter);
router.put('/:id', updateParameter);
router.delete('/:id', deleteParameter);

export default router;