import { Router } from 'express';
import { checkParameter, createParameter, deleteParameter, getAllParameter, getLastParameter, getParameter, updateParameter } from '../controllers/parameter.controller.ts';
const router = Router();

router.get('/Parameters', getAllParameter);
router.get('/check/:id', checkParameter);

// 2. Les routes dynamiques ensuite
router.get('/:id', getParameter);
router.get('/', getLastParameter);
router.post('/', createParameter);
router.put('/:id', updateParameter);
router.delete('/:id', deleteParameter);
export default router;