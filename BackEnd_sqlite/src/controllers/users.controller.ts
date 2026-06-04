import type { Request, Response } from 'express';
import db from '../db/db.js'; 

export const listUsers = (req: Request, res: Response) => {
  const rows = db.prepare('SELECT id, username, email FROM users ORDER BY id DESC').all();
  res.json(rows);
};

export const getUser = (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const user = db.prepare('SELECT id, username, email FROM users WHERE id = ?').get(id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
};

export const createUser = (req: Request, res: Response) => {
  const { username, email } = req.body;
  if (!username) return res.status(400).json({ error: 'username required' });
  try {
    const info = db.prepare('INSERT INTO users (username, email) VALUES (?, ?)').run(username, email ?? null);
    const user = db.prepare('SELECT id, username, email FROM users WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(user);
  } catch (err: any) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') return res.status(409).json({ error: 'username already exists' });
    res.status(500).json({ error: err.message });
  }
};

export const updateUser = (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { username, email } = req.body;
  const info = db.prepare('UPDATE users SET username = coalesce(?, username), email = coalesce(?, email) WHERE id = ?').run(username ?? null, email ?? null, id);
  if (info.changes === 0) return res.status(404).json({ error: 'User not found' });
  const user = db.prepare('SELECT id, username, email FROM users WHERE id = ?').get(id);
  res.json(user);
};

export const deleteUser = (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const info = db.prepare('DELETE FROM users WHERE id = ?').run(id);
  if (info.changes === 0) return res.status(404).json({ error: 'User not found' });
  res.status(204).send();
};