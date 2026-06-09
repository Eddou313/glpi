// ─────────────────────────────────────────────────────────────────────────────
// Types pour l'import fichier 2 — Tickets
// ─────────────────────────────────────────────────────────────────────────────

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

// ── Cache ticket retourné après création ──────────────────────────────────────
export interface CachedTicket {
    id: number;   // GLPI ticket id
    ref: string;   // Ref_Ticket normalisé (string)
    name: string;   // Titre
    date: string;   // ISO
}

// ── Payload POST GLPI ─────────────────────────────────────────────────────────
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
// ── Status tickets ────────────────────────────────────────────────────────────
// 1=Nouveau  2=En cours(Attribué)  3=En cours(Planifié)  4=En attente  5=Résolu  6=Clos
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
    "Processing (Assigned)": 2,
    "Processing (Planned)": 3,
    "Pending": 4,
    "Solved": 5,
    "Closed": 6,
};

// ── Urgence / Impact / Priorité ───────────────────────────────────────────────
// 1=Très basse  2=Basse  3=Moyenne  4=Haute  5=Très haute  6=Majeure
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
// Staus : Nouveau , En cours(Attribuer),En cours(Planifie),En attente,Resolu,Clos
// Urgence : Très haute,haute, Moyenne,Basse,tres basse
// Impact : Très haute,haute, Moyenne,Basse,tres basse
// Priority : Très haute,haute, Moyenne,Basse,tres basse