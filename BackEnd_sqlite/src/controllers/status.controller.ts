import type { Request, Response } from 'express';

export const getStatus = (req: Request, res: Response): void => {
  res.json({ 
    status: "OK", 
    message: "Web service Express opérationnel avec TypeScript (NodeNext) !" 
  });
};