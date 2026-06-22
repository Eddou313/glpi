import db from "../db/db.ts";
import type { Request, Response } from 'express';

export const getFond = (req: Request, res: Response) => {
  try {
    db.prepare(`
      INSERT INTO fond (id, pourcentageFond)
      VALUES (1, 30)
      ON CONFLICT(id) DO NOTHING
    `).run();

    const fond = db.prepare(`
      SELECT id, pourcentageFond
      FROM fond
      ORDER BY id ASC
      LIMIT 1
    `).get();

    res.json(fond || { id: 1, pourcentageFond: 30 });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
