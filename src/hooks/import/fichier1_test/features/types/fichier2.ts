export interface CsvRow2 {
    Ref_Ticket: string | number;
    Date: string;
    Heure: string;
    Type: string | number;
    Titre: string;
    Description: string;
    Status: string;
    Priority: string;
    Items: string | string[];
}

export interface CachedTicket {
    id: number;   
    ref: string;  
    name: string;
    date: string; 
}

export interface GlpiTicketPayload {
    name: string;
    content: string;
    date: string;
    type: number;
    urgency: number;
    impact: number;
    priority: number;
    status: { id: number };
}

export const TICKET_STATUS_MAP: Record<string, number> = {
    // Français
    "Nouveau": 1,
    "En cours (Attribuer)": 2,
    "En cours (Planifie)": 3,
    "En attente": 4,
    "Résolu": 5,
    "Resolu": 5,
    "Clos": 6,
    // Anglais
    "New": 1,
    "In progress (assigned)": 2,
    "In progress (planned)": 3,
    "Pending": 4,
    "Solved": 5,
    "Closed": 6,
};

// ── Urgence / Impact / Priorité ───────────────────────────────────────────────
export const TICKET_PRIORITY_MAP: Record<string, number> = {
    // Français
    "Très basse": 1,
    "Tres basse": 1,
    "Basse": 2,
    "Moyenne": 3,
    "Haute": 4,
    "Très haute": 5,
    "Tres haute": 5,
    "Majeure": 6,
    // Anglais
    "VeryLow": 1,
    "Very Low": 1,
    "Low": 2,
    "Medium": 3,
    "High": 4,
    "VeryHigh": 5,
    "Very High": 5,
    "Major": 6,
};

// ── Type de ticket ────────────────────────────────────────────────────────────
export const TICKET_TYPE_MAP: Record<string, number> = {
    // Français
    "Incident": 1,
    "Demande": 2,
    // Anglais
    "Request": 2,
};