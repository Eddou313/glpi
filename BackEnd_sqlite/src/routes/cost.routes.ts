import { Router } from 'express';
import { deleteCost, getAllCost, getCostTickets, upsterConst } from '../controllers/const.controller.ts';
const router = Router();

router.get('/', getAllCost);
router.get('/:id', getCostTickets);
router.post('/:id', upsterConst);
router.delete('/:id', deleteCost);
export default router;