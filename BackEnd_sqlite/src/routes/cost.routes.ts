import { Router } from 'express';
import { deleteCost, getAllCost, getCostTickets, upsterConst } from '../controllers/const.controller.ts';
const router = Router();

router.get('/', getAllCost);
router.get('/:ticket_id', getCostTickets);
router.post('/:ticket_id', upsterConst);
router.delete('/:ticket_id', deleteCost);
// router.post("/ouvre/:id",reouvert);
export default router;