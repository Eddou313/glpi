import type { Request, Response } from 'express';
import db from '../db/db.ts'; 

export const getLastParameter = (req: Request, res: Response) => {
  const status = db.prepare('SELECT id, technical_name, default_name_fr, name_mg, bg_color FROM kanban_statuses ORDER DESC LIMIT 1').get();
  if (!status) return res.status(404).json({ error: 'Kanban status not found' });
  res.json(status);
};

export const getParameter = (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const status = db.prepare('SELECT id, technical_name, default_name_fr, name_mg, bg_color FROM kanban_statuses WHERE id = ?').get(id);
  if (!status) return res.status(404).json({ error: 'Kanban status not found' });
  res.json(status);
};

export const createParameter = (req: Request, res: Response) => {
  const { technical_name, default_name_fr, name_mg, bg_color } = req.body;
  if (!technical_name) return res.status(400).json({ error: 'Technical name required' });
  try {
    const info = db.prepare('INSERT INTO kanban_statuses (technical_name, default_name_fr, name_mg, bg_color) VALUES (?, ?, ?, ?)').run(technical_name, default_name_fr ?? null, name_mg ?? null, bg_color ?? null);
    const status = db.prepare('SELECT id, technical_name, default_name_fr, name_mg, bg_color FROM kanban_statuses WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(status);
  } catch (err: any) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') return res.status(409).json({ error: 'Technical name already exists' });
    res.status(500).json({ error: err.message });
  }
};

export const updateParameter = (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { technical_name, default_name_fr, name_mg, bg_color } = req.body;
  const info = db.prepare('UPDATE kanban_statuses SET technical_name = coalesce(?, technical_name), default_name_fr = coalesce(?, default_name_fr), name_mg = coalesce(?, name_mg), bg_color = coalesce(?, bg_color) WHERE id = ?').run(technical_name ?? null, default_name_fr ?? null, name_mg ?? null, bg_color ?? null, id);
  if (info.changes === 0) return res.status(404).json({ error: 'Kanban status not found' });
  const status = db.prepare('SELECT id, technical_name, default_name_fr, name_mg, bg_color FROM kanban_statuses WHERE id = ?').get(id);
  res.json(status);
};

export const deleteParameter = (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const info = db.prepare('DELETE FROM kanban_statuses WHERE id = ?').run(id);
  if (info.changes === 0) return res.status(404).json({ error: 'Kanban status not found' });
  res.status(204).send();
};