import { Router } from 'express';
import { deleteCost, deleteCostForce, deleteCostForceAll, deleteOuvertureById, getAllCost, getCostTickets, getCostTicketsAll, getCostTicketsPremier, getIsDelete, getSuperCostAndOuvertures, updateSuperCostOrReouverture, upsterConst } from '../controllers/const.controller.ts';
const router = Router();

router.get('/', getAllCost);
router.delete('/forceAll/', deleteCostForceAll);

router.get('/super-ouverture', getSuperCostAndOuvertures);
router.put('/super-ouverture/:id', updateSuperCostOrReouverture);
router.delete('/ouverture/:id', deleteOuvertureById);
router.get('/is_deleted/:ticket_id', getIsDelete);
router.delete('/force/:ticket_id', deleteCostForce);
router.get('/first/:ticket_id', getCostTicketsPremier);
router.get('/all/:ticket_id', getCostTicketsAll);

router.get('/:ticket_id', getCostTickets);
router.post('/:ticket_id', upsterConst);
router.delete('/:ticket_id', deleteCost);

// router.post("/ouvre/:id",reouvert);
export default router;
