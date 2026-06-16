import type { Request, Response } from 'express';
import db from '../db/db.ts';

export const getAllCost = (req: Request, res: Response) => {
    try {
        const costs = db.prepare('SELECT id, ticket_id, cost, id_items, category, type_cout FROM cost').all();
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

export const upsterConst = (req: Request, res: Response) => { 
    try {
        const id = Number(req.params.ticket_id);
        const { cost, id_items, category, type_cout } = req.body;
        
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
                    INSERT INTO cost (ticket_id, cost, id_items, category, type_cout) 
                    VALUES (?, ?, ?, ?, ?)
                `).run(id, costVal, itemId, cat, typeCoutId);
            }
        }
        else
        {
            db.prepare(`
                INSERT INTO cost (ticket_id, cost, id_items, category, type_cout) 
                VALUES (?, ?, ?, ?, ?)
            `).run(id, costVal, itemId, cat, typeCoutId);
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