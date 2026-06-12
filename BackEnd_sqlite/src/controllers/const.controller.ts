import type { Request, Response } from 'express';
import db from '../db/db.ts';

export const getAllCost = (req: Request, res: Response) => {
    try {
        const statuses = db.prepare('SELECT id, ticket_id, cost, nbr_elements FROM cost').all();
        res.json(statuses);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getCostTickets = (req: Request, res: Response) => {
    // Sécurité : cherche 'id' ou 'ticket_id' selon comment Express l'interprète
    const id = Number(req.params.id || req.params.ticket_id);
    try {
        const statuses = db.prepare('SELECT * FROM cost WHERE ticket_id = ?').get(id);
        res.json(statuses);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const upsterConst = (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id || req.params.ticket_id);
        
        const { cost, nbr_elements } = req.body;
        
        console.log(id + "_" + cost + "_" + nbr_elements);
        
        if (isNaN(id)) {
            return res.status(400).json({ error: "L'identifiant du ticket passé dans l'URL est invalide (NaN)." });
        }

        const cosVal = parseFloat(cost) || 0;
        const nbE = parseInt(nbr_elements ?? 1, 10) || 1;
        
        const statuses = db.prepare('SELECT * FROM cost WHERE ticket_id = ?').get(id);

        if (statuses) {
            db.prepare('UPDATE cost SET cost = ?, nbr_elements = ? WHERE ticket_id = ?').run(cosVal, nbE, id);
        } else {
            db.prepare('INSERT INTO cost (ticket_id, cost, nbr_elements) VALUES (?, ?, ?)').run(id, cosVal, nbE);
        }
        
        const rep = db.prepare('SELECT * FROM cost WHERE ticket_id = ?').get(id);
        res.json(rep);
        
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
export const deleteCost = (req: Request, res: Response) => {
  const ticketId = Number(req.params.ticket_id);
  const info = db.prepare('DELETE FROM cost WHERE ticket_id = ?').run(ticketId);
  if (info.changes === 0) return res.status(404).json({ error: 'Coût non trouvé' });
  res.status(204).send();
};