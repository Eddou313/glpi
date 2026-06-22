import { Router } from 'express';
<<<<<<< Updated upstream
import { deleteCost, deleteCostForce, deleteCostForceAll, getAllCost, getCostTickets, getCostTicketsAll, getCostTicketsPremier, getIsDelete, upsterConst } from '../controllers/const.controller.ts';
=======
import { deleteCost, deleteCostForce, deleteCostForceAll, deleteOuvertureById, deleteSuperCostOrReouverture, getAllCost, getCostTickets, getCostTicketsAll, getCostTicketsPremier, getIsDelete, getSuperCostAndOuvertures, updateSuperCostOrReouverture, upsterConst } from '../controllers/const.controller.ts';
>>>>>>> Stashed changes
const router = Router();

router.get('/', getAllCost);
router.delete('/forceAll/', deleteCostForceAll);

<<<<<<< Updated upstream

router.get('/:ticket_id', getCostTickets);
router.post('/:ticket_id', upsterConst);
router.delete('/:ticket_id', deleteCost);
=======
router.get('/super-ouverture', getSuperCostAndOuvertures);
router.put('/super-ouverture/:id', updateSuperCostOrReouverture);
router.delete('/super-ouverture/:id', deleteSuperCostOrReouverture);
router.delete('/ouverture/:id', deleteOuvertureById);

>>>>>>> Stashed changes
router.get('/is_deleted/:ticket_id', getIsDelete);
router.delete('/force/:ticket_id', deleteCostForce);
router.get('/first/:ticket_id', getCostTicketsPremier);
router.get('/all/:ticket_id', getCostTicketsAll);

// router.post("/ouvre/:id",reouvert);
export default router;
