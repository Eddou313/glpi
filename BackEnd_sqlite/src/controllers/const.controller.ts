import type { Request, Response } from 'express';
import db from '../db/db.ts';

export const getAllCost = (req: Request, res: Response) => {
    try {
        const costs = db.prepare('SELECT id, ticket_id, cost, id_items, category, type_cout , "group" FROM cost').all();
        res.json(costs);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getCostTickets = (req: Request, res: Response) => { 
    const ticket_id = Number(req.params.ticket_id);
    const type_cout = Number(req.query.type_cout);
    const nbrItems = Number(req.query.nbrItems);
    try {
        if (isNaN(ticket_id) || isNaN(type_cout)) {
            return res.status(400).json({ error: "L'identifiant du ticket ou le type de coût est invalide." });
        }
        const cost = db.prepare('SELECT * FROM cost WHERE ticket_id = ? AND type_cout = ? ORDER BY id DESC LIMIT ?').all(ticket_id, type_cout,nbrItems);
        res.json(cost || []);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getCostTicketsPremier = (req: Request, res: Response) => { 
    const ticket_id = Number(req.params.ticket_id);
    const type_cout = Number(req.query.type_cout);
    const nbrItems = Number(req.query.nbrItems);
    try {
        if (isNaN(ticket_id) || isNaN(type_cout)) {
            return res.status(400).json({ error: "L'identifiant du ticket ou le type de coût est invalide." });
        }
        const cost = db.prepare('SELECT * FROM cost WHERE ticket_id = ? AND type_cout = ? ORDER BY id ASC LIMIT ?').all(ticket_id, type_cout,nbrItems);
        res.json(cost || []);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getCostTicketsAll = (req: Request, res: Response) => { 
    const ticket_id = Number(req.params.ticket_id);
    const type_cout = Number(req.query.type_cout);
    const nbrItems = Number(req.query.nbrItems);
    try {
        if (isNaN(ticket_id) || isNaN(type_cout)) {
            return res.status(400).json({ error: "L'identifiant du ticket ou le type de coût est invalide." });
        }
        const cost = db.prepare('SELECT * FROM cost WHERE ticket_id = ? AND type_cout = ?').all(ticket_id, type_cout);
        res.json(cost || []);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
export const upsterConst = (req: Request, res: Response) => { 
    try {
        const id = Number(req.params.ticket_id);
        const { cost, id_items, category, type_cout, group } = req.body;
        
        const typeCoutId = Number(type_cout);

        if (isNaN(id) || isNaN(typeCoutId)) {
            return res.status(400).json({ error: "L'identifiant du ticket ou le type de coût est invalide." });
        }

        const costVal = parseFloat(cost) || 0;
        const itemId = id_items ? parseInt(id_items, 10) : null;
        const cat = category || null;

        if(type_cout === 1)
        {
            const existingCost = db.prepare('SELECT * FROM cost WHERE ticket_id = ?  AND id_items =? AND type_cout = ?').get(id, id_items,typeCoutId);
            if (existingCost) {
                db.prepare(`
                    UPDATE cost 
                    SET cost = ?, id_items = ?, category = ? 
                    WHERE ticket_id = ? AND type_cout = ?
                `).run(costVal, itemId, cat, id, typeCoutId);
            } else {
                db.prepare(`
                    INSERT INTO cost (ticket_id, cost, id_items, category, type_cout,"group") 
                    VALUES (?, ?, ?, ?, ?,?)
                `).run(id, costVal, itemId, cat, typeCoutId, group);
            }
        }
        else
        {
            db.prepare(`
                INSERT INTO cost (ticket_id, cost, id_items, category, type_cout,"group") 
                VALUES (?, ?, ?, ?, ?,?)
            `).run(id, costVal, itemId, cat, typeCoutId, group);
        }
        
        const rep = db.prepare('SELECT * FROM cost WHERE ticket_id = ? AND type_cout = ?').get(id, typeCoutId);
        res.json(rep);
        
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteCost = (req: Request, res: Response) => { 
    try {
        const id = Number(req.params.ticket_id);
        const type_cout = Number(req.body.type_cout); 
        if (isNaN(id) || isNaN(type_cout)) {
            return res.status(400).json({ error: "ID ou type de coût invalide." });
        }
        // const info = db.prepare('DELETE FROM cost WHERE ticket_id = ? ').run(id);
        const info = db.prepare('UPDATE cost SET is_deleted = true WHERE ticket_id= ? AND type_cout = ?').run(id,type_cout);
        
        if (info.changes === 0) {
            return res.status(404).json({ error: `Coût avec le type ID ${type_cout} non trouvé pour ce ticket.` });
        }
        
        res.status(204).send();
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
export const getIsDelete = (req: Request, res: Response) => { 
    const ticket_id = Number(req.params.ticket_id);
    const type_cout = Number(req.body.type_cout);
    try {
        if (isNaN(ticket_id) || isNaN(type_cout)) {
            return res.status(400).json({ error: "L'identifiant du ticket ou le type de coût est invalide." });
        }
        const cost = db.prepare('SELECT * FROM cost WHERE ticket_id = ? AND type_cout = ? AND is_deleted = true ORDER BY id DESC LIMIT 1').get(ticket_id, type_cout);
        res.json(cost || { message: "Aucun coût trouvé pour ce ticket avec ce type." });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
export const deleteCostForce = (req: Request, res: Response) => { 
    try {
        const id = Number(req.params.ticket_id);
        const { type_cout } = req.body || {}; 
        const typeCoutNum = Number(type_cout);
        const nbr_items = Number(req.body.nbr_items); 
        if (isNaN(id) || isNaN(type_cout)) {
            return res.status(400).json({ error: "ID ou type de coût invalide." });
        }
        const info = db.prepare(`
            DELETE FROM cost
            WHERE id IN (
                SELECT id
                FROM cost
                WHERE ticket_id = ?
                AND type_cout = ?
                ORDER BY id DESC
                LIMIT ?
            )
        `).run(id, typeCoutNum, nbr_items);
        if (info.changes === 0) {
            return res.status(404).json({ error: `Coût avec le type ID ${typeCoutNum} non trouvé pour ce ticket.` });
        }
        
        res.status(204).send();
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
export const deleteCostForceAll = (req: Request, res: Response) => { 
    try {
        const { type_cout } = req.body || {}; 
        const typeCoutNum = Number(type_cout);
        db.prepare(`
            DELETE FROM cost
        `).run();
        res.status(204).send();
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
// export const reouvert = (req: Request, res: Response) => { 
//     try {
//         const id = Number(req.params.ticket_id);
//         const { cost, id_items, category,type_cout } = req.body;
        
//         if (isNaN(id)) {
//             return res.status(400).json({ error: "L'identifiant du ticket est invalide." });
//         }

//         const costVal = parseFloat(cost) || 0;
//         const itemId = id_items ? parseInt(id_items, 10) : null;
//         const cat = category;
//         const existingCost = db.prepare('SELECT * FROM cost WHERE ticket_id = ? AND type_cout = ?').get(id, type_cout);

<<<<<<< Updated upstream
//         if (existingCost) {
//             db.prepare(`
//                 UPDATE cost 
//                 SET cost = ?, id_items = ?, category = ? 
//                 WHERE ticket_id = ? AND type_cout = ?
//             `).run(costVal, itemId, cat, id, type_cout);
//         } else {
//             db.prepare(`
//                 INSERT INTO cost (ticket_id, cost, id_items, category, type_cout) 
//                 VALUES (?, ?, ?, ?, ?)
//             `).run(id, costVal, itemId, cat, type_cout);
//         }
        
//         const rep = db.prepare('SELECT * FROM cost WHERE ticket_id = ? AND type_cout = ?').get(id, type_cout);
//         res.json(rep);
        
//     } catch (error: any) {
//         res.status(500).json({ error: error.message });
//     }
// };
=======
export const updateSuperCostOrReouverture = (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        const { cost, percentage, mode_ouverture } = req.body;

        if (isNaN(id)) {
            return res.status(400).json({ error: "ID invalide." });
        }

        const current = db.prepare(`
            ${COST_SELECT}
            WHERE id = ?
              AND type_cout IN (?, ?)
        `).get(id, TYPE_COUT.SUPER_COST, TYPE_COUT.OUVERTURE) as CostRow | undefined;

        if (!current) {
            return res.status(404).json({ error: "Ligne introuvable." });
        }

        if (current.type_cout === TYPE_COUT.SUPER_COST) {
            const batchRows = getRowsByBatch(current.ticket_id, TYPE_COUT.SUPER_COST, current.group);
            distributeBatchCost(batchRows, getNumber(cost, current.cost));

            db.prepare(`
                UPDATE cost
                SET percentage = 100, mode_ouverture = NULL
                WHERE ticket_id = ?
                  AND type_cout = ?
                  AND COALESCE("group", '') = COALESCE(?, '')
                  AND COALESCE(is_deleted, false) = false
            `).run(current.ticket_id, TYPE_COUT.SUPER_COST, current.group);

            recalculateOuverturesAfterGroup(current.ticket_id, current.group);
        }

        if (current.type_cout === TYPE_COUT.OUVERTURE) {
            const groupRows = getRowsByBatch(current.ticket_id, TYPE_COUT.OUVERTURE, current.group);

            const totalItems = Math.max(groupRows.length, 1);
            const newModeOuverture = getNullableNumber(mode_ouverture) || 1;
            const requestedCost = getNumber(cost, current.cost);
            const requestedPercentage = getNumber(percentage, Number(current.percentage || 0));
            const costChanged = Math.abs(requestedCost - Number(current.cost || 0)) > 0.000001;
            const base = getSuperCostBase(current.ticket_id, newModeOuverture, totalItems, current.group);
            const nextPercentage = costChanged && base > 0
                ? (requestedCost / base) * 100
                : requestedPercentage;

            db.prepare(`
                UPDATE cost
                SET percentage = ?, mode_ouverture = ?
                WHERE ticket_id = ?
                  AND type_cout = ?
                  AND COALESCE("group", '') = COALESCE(?, '')
                  AND COALESCE(is_deleted, false) = false
            `).run(nextPercentage, newModeOuverture, current.ticket_id, TYPE_COUT.OUVERTURE, current.group);

            recalculateOuvertureGroup(current.ticket_id, current.group);
        }

        res.json(listSuperCostsAndOuvertures());
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteSuperCostOrReouverture = (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);

        if (isNaN(id)) {
            return res.status(400).json({ error: "ID invalide." });
        }

        const current = db.prepare(`
            ${COST_SELECT}
            WHERE id = ?
              AND type_cout IN (?, ?)
              AND COALESCE(is_deleted, false) = false
        `).get(id, TYPE_COUT.SUPER_COST, TYPE_COUT.OUVERTURE) as CostRow | undefined;

        if (!current) {
            return res.status(404).json({ error: "Ligne introuvable." });
        }

        const info = db.prepare(`
            DELETE FROM cost
            WHERE ticket_id = ?
              AND type_cout = ?
              AND COALESCE("group", '') = COALESCE(?, '')
        `).run(current.ticket_id, current.type_cout, current.group);

        if (info.changes === 0) {
            return res.status(404).json({ error: "Batch introuvable." });
        }

        if (current.type_cout === TYPE_COUT.SUPER_COST) {
            recalculateOuverturesAfterGroup(current.ticket_id, current.group);
        }

        res.json(listSuperCostsAndOuvertures());
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteOuvertureById = (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);

        if (isNaN(id)) {
            return res.status(400).json({ error: "ID d'ouverture invalide." });
        }

        const info = db.prepare(`
            UPDATE cost
            SET is_deleted = true
            WHERE id = ?
              AND type_cout = ?
        `).run(id, TYPE_COUT.OUVERTURE);

        if (info.changes === 0) {
            return res.status(404).json({ error: "Ouverture introuvable." });
        }

        res.status(204).send();
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
>>>>>>> Stashed changes
