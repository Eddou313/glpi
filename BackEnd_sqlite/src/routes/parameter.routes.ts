import { Router } from 'express';
import { createKabanStatus, deleteKanbanStatus, getKanbanStatus, updateKanbanStatus } from '../controllers/paramettre.controller.ts';
const router = Router();

router.get('/Parameter/:id', getKanbanStatus);
router.post('/Parameter', createKabanStatus);
router.put('/Parameter/:id', updateKanbanStatus);
router.delete('/Parameter/:id', deleteKanbanStatus);

export default router;