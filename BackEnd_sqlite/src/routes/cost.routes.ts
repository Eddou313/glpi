import { Router } from 'express';
import { getAllCost, getCostTickets, upsterConst } from '../controllers/const.controller.ts';
const router = Router();

router.get('/', getAllCost);
router.get('/:id', getCostTickets);
router.post('/:id', upsterConst);
export default router;