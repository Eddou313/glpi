
export type GlpiCountResponse = {
  count: number;
};
// Un élément physique (ordinateur, imprimante, etc.)
export type GlpiAsset = {
  id: number;
  name: string;
  itemtype: string;
};
// Un ticket GLPI
export type GlpiTicket = {
  id: number;
  name: string;
  status: number;   // 1=Nouveau 2=En cours 3=En cours(planifié) 4=En attente 5=Résolu 6=Clos
  type: number;     // 1=Incident  2=Demande
  priority: number; // 1→6
};

export const TICKET_STATUS_LABELS: Record<number, string> = {
  1: 'Nouveau',
  2: 'En cours',
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

// Types d'éléments à récupérer depuis GLPI
export const ASSET_TYPES = [
  { key: 'Computer',        label: 'Ordinateurs' },
  { key: 'Monitor',         label: 'Moniteurs' },
  { key: 'NetworkEquipment',label: 'Équipements réseau' },
  { key: 'Peripheral',      label: 'Périphériques' },
  { key: 'Phone',           label: 'Téléphones' },
  { key: 'Printer',         label: 'Imprimantes' },
  { key: 'Software',        label: 'Logiciels' },
] as const;

export type AssetTypeKey = typeof ASSET_TYPES[number]['key'];

// Résultat structuré pour l'affichage
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