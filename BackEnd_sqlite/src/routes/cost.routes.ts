import { Router } from 'express';
import { deleteCost, deleteCostForce, deleteCostForceAll, getAllCost, getCostTickets, getCostTicketsAll, getCostTicketsPremier, getIsDelete, upsterConst } from '../controllers/const.controller.ts';
const router = Router();

router.get('/', getAllCost);
router.delete('/forceAll/', deleteCostForceAll);


router.get('/:ticket_id', getCostTickets);
router.post('/:ticket_id', upsterConst);
router.delete('/:ticket_id', deleteCost);
router.get('/is_deleted/:ticket_id', getIsDelete);
router.delete('/force/:ticket_id', deleteCostForce);
router.get('/first/:ticket_id', getCostTicketsPremier);
router.get('/all/:ticket_id', getCostTicketsAll);

// router.post("/ouvre/:id",reouvert);
export default router;
