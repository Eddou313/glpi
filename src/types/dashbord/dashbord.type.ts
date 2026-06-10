
export type GlpiCountResponse = {
  count: number;
};

export type GlpiAsset = {
  id: number;
  name: string;
  itemtype: string;
};

export type GlpiTicket = {
  id: number;
  name: string;
  status: number;   // 1=Nouveau 2=En cours 3=En cours(planifié) 4=En attente 5=Résolu 6=Clos
  type: number;     // 1=Incident  2=Demande
  priority: number; // 1→6
};

export const TICKET_STATUS_LABELS: Record<number, string> = {
  1: 'Nouveau',
  2: 'En cours (distribuer',
  3: 'En cours (planifié)',
  4: 'En attente',
  5: 'Résolu',
  6: 'Clos',
};

export const TICKET_TYPE_LABELS: Record<number, string> = {
  1: 'Incident',
  2: 'Demande',
};

export const TICKET_PRIORITY_LABELS: Record<number, string> = {
  1: 'Très basse',
  2: 'Basse',
  3: 'Moyenne',
  4: 'Haute',
  5: 'Très haute',
  6: 'Majeure',
};

export type AssetSummary = {
  total: number;
  byType: { label: string; count: number }[];
};

export type TicketSummary = {
  total: number;
  byStatus:   { label: string; count: number }[];
  byType:     { label: string; count: number }[];
  byPriority: { label: string; count: number }[];
};