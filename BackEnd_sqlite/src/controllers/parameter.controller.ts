import type { Request, Response } from 'express';
import db from '../db/db.ts';

export const getLastParameter = (req: Request, res: Response) => {
  const status = db.prepare('SELECT id, technical_name, default_name_fr, name_mg, bg_color FROM kanban_statuses ORDER DESC LIMIT 1').get();
  if (!status) return res.status(404).json({ error: 'Kanban status not found' });
  res.json(status);
};

export const getAllParameter = (req: Request, res: Response) => {
  try {
    const statuses = db.prepare('SELECT id, technical_name, default_name_fr, name_mg, bg_color FROM kanban_statuses').all();
    res.json(statuses);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getParameter = (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const status = db.prepare('SELECT id, technical_name, default_name_fr, name_mg, bg_color FROM kanban_statuses WHERE id = ?').get(id);
  if (!status) return res.status(404).json({ error: 'Kanban status not found' });
  res.json(status);
};

export const createParameter = (req: Request, res: Response) => {
  console.log("Données reçues du Front-end :", req.body);
  const { technical_name, default_name_fr, name_mg, bg_color } = req.body;

  if (!technical_name) {
    return res.status(400).json({ error: 'Le nom technique (technical_name) est requis' });
  }

  const techNameInt = parseInt(technical_name, 10);

  try {
    const existing = db.prepare('SELECT id FROM kanban_statuses WHERE technical_name = ?').get(techNameInt) as { id: number } | undefined;

    const valFr = default_name_fr && default_name_fr.trim() !== "" ? default_name_fr : null;
    const valMg = name_mg && name_mg.trim() !== "" ? name_mg : null;
    const valColor = bg_color && bg_color.trim() !== "" ? bg_color : null;

    if (existing) {
      db.prepare(`
        UPDATE kanban_statuses 
        SET 
          default_name_fr = COALESCE(?, default_name_fr), 
          name_mg = COALESCE(?, name_mg), 
          bg_color = COALESCE(?, bg_color) 
        WHERE id = ?
      `).run(valFr, valMg, valColor, existing.id);

      const updatedStatus = db.prepare('SELECT * FROM kanban_statuses WHERE id = ?').get(existing.id);
      return res.status(200).json(updatedStatus);

    } else {
      const info = db.prepare(`
        INSERT INTO kanban_statuses (technical_name, default_name_fr, name_mg, bg_color) 
        VALUES (?, ?, ?, ?)
      `).run(
        techNameInt,
        valFr ?? '',
        valMg ?? '',
        valColor ?? '#FFFFFF'
      );

      const newStatus = db.prepare('SELECT * FROM kanban_statuses WHERE id = ?').get(info.lastInsertRowid);
      return res.status(201).json(newStatus);
    }

  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const updateParameter = (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { technical_name, default_name_fr, name_mg, bg_color } = req.body;
  const techNameInt = parseInt(technical_name, 10);
  const info = db.prepare('UPDATE kanban_statuses SET technical_name = coalesce(?, technical_name), default_name_fr = coalesce(?, default_name_fr), name_mg = coalesce(?, name_mg), bg_color = coalesce(?, bg_color) WHERE id = ?').run(techNameInt ?? null, default_name_fr ?? null, name_mg ?? null, bg_color ?? null, id);
  if (info.changes === 0) return res.status(404).json({ error: 'Kanban status not found' });
  const status = db.prepare('SELECT id, technical_name, default_name_fr, name_mg, bg_color FROM kanban_statuses WHERE id = ?').get(id);
  res.json(status);
};

export const checkParameter = (req: Request, res: Response) => {
  const id = Number(req.params.technical_name);
  const status = db.prepare('SELECT id, technical_name, default_name_fr, name_mg, bg_color FROM kanban_statuses WHERE id = ?').get(id);
  if (!status) return false;
  return true;
}

export const deleteParameter = (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const info = db.prepare('DELETE FROM kanban_statuses WHERE id = ?').run(id);
  if (info.changes === 0) return res.status(404).json({ error: 'Kanban status not found' });
  res.status(204).send();
};

export const deleteParameterAll = (req: Request, res: Response) => {
  const info = db.prepare('DELETE FROM kanban_statuses').run();
  if (info.changes === 0) return res.status(404).json({ error: 'Kanban status not found' });
  res.status(204).send();
};