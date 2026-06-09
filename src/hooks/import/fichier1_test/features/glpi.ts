// ─────────────────────────────────────────────────────────────────────────────
//  types/glpi.ts
//  Types pour les payloads GLPI + tables de correspondance statiques
// ─────────────────────────────────────────────────────────────────────────────

// ── Réponse générique POST GLPI ───────────────────────────────────────────────
export interface GlpiCreated {
  id: number;
  message?: string;
}

// ── Payloads par endpoint ─────────────────────────────────────────────────────

export interface LocationPayload {
  name: string;
}

export interface ManufacturerPayload {
  name: string;
}

export interface ModelPayload {
  name: string;
}

export interface UserPayload {
  realname: string;
  firstname: string;
  username: string;
  is_active: boolean;
  authtype: number;
  password: string;
  password2: string;
}

export interface AssetPayload {
  name: string;
  otherserial: string;            // Inventory_Number
  status: { id: number };
  location: { id: number };
  manufacturer: { id: number };
  model: { id: number };
  user?: { id: number };
}

export interface TicketPayload {
  name: string;                   // Titre
  content: string;                // Description
  status: number;
  urgency: number;
  impact: number;
  priority: number;
  type: number;
  date: string;                   // ISO
  items_id?: number;              // id de l'équipement lié
  itemtype?: string;              // ex: "Computer"
}

export interface TicketCostPayload {
  tickets_id: number;
  duration: number;               // en secondes
  cost_time: number;
  cost_fixed: number;
}

// ── Tables de correspondance statiques ────────────────────────────────────────

/** Valeur CSV Status → id GLPI (State) — à ajuster selon votre instance */
export const STATUS_MAP: Record<string, number> = {
  "En production": 1,
  "Maintenance":   2,
  "En panne":      3,
  "En stock":      4,
  "Mis au rebut":  5,
};

/** Valeur CSV Ticket Status → id GLPI */
export const TICKET_STATUS_MAP: Record<string, number> = {
  "Nouveau":      1,
  "En cours":     2,
  "En attente":   3,
  "Résolu":       5,
  "Clos":         6,
};

/** Valeur CSV Priority → id GLPI */
export const TICKET_PRIORITY_MAP: Record<string, number> = {
  "Très haute": 6,
  "Haute":      5,
  "Moyenne":    3,
  "Basse":      2,
  "Très basse": 1,
};

/** Item_Type CSV → endpoint GLPI Assets/<X> */
export const ITEM_TYPE_MAP: Record<string, string> = {
  Computer:         "Computer",
  Monitor:          "Monitor",
  Printer:          "Printer",
  NetworkEquipment: "NetworkEquipment",
  Phone:            "Phone",
  Software:         "Software",
};

/** Item_Type → endpoint modèle GLPI */
export const MODEL_ENDPOINT_MAP: Record<string, string> = {
  Computer: "Dropdowns/ComputerModel",
  Monitor:  "Dropdowns/MonitorModel",
  Printer:  "Dropdowns/PrinterModel",
  Phone:    "Dropdowns/PhoneModel",
  default:  "Dropdowns/ComputerModel",
  NetworkEquipment: "Dropdowns/NetworkEquipmentModel",
  Enclosure: "Dropdowns/EnclosureModel",
  Peripheral: "Dropdowns/PeripheralModel",
  VirtualMachine: "Dropdowns/VirtualMachineModel",
};








