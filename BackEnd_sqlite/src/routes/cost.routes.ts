import { Router } from 'express';
import {
    deleteCost,
    deleteCostForce,
    deleteCostForceAll,
    deleteOuvertureById,
    deleteSuperCostOrReouverture,
    getAllCost,
    getAllCostCancel,
    getCostTickets,
    getCostTicketsAll,
    getCostTicketsPremier,
    getIsDelete,
    getSuperCostAndOuvertures,
    retablir,
    updateSuperCostOrReouverture,
    upsterConst
} from '../controllers/const.controller.ts';
import { getFond } from '../controllers/fond.controller.ts';
const router = Router();

router.get('/', getAllCost);
router.delete('/forceAll/', deleteCostForceAll);
router.get('/fond', getFond);

router.get('/cancelled', getAllCostCancel);
router.post('/cancelled/:id/restore', retablir);
router.get('/super-ouverture', getSuperCostAndOuvertures);
router.put('/super-ouverture/:id', updateSuperCostOrReouverture);
router.delete('/super-ouverture/:id', deleteSuperCostOrReouverture);
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
