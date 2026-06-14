import { Router } from 'express';
import { deleteCost, deleteCostForce, getAllCost, getCostTickets, getIsDelete, upsterConst } from '../controllers/const.controller.ts';
const router = Router();

router.get('/', getAllCost);
router.get('/:ticket_id', getCostTickets);
router.post('/:ticket_id', upsterConst);
router.delete('/:ticket_id', deleteCost);
router.get('/is_deleted/:ticket_id', getIsDelete);
router.delete('/force/:ticket_id', deleteCostForce);

// router.post("/ouvre/:id",reouvert);
export default router;
