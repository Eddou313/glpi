export interface Parameter{
    id : number;
    technical_name : number;
    default_name_fr : string;
    name_mg : string;
    bg_color : string;
}

export const TICKET_STATUS: Record<string, number> = {
    "New": 1,
    "Processing (Assigned)": 2,
    "Processing (Planned)": 3,
    "Pending": 4,
    "Solved": 5,
    "Closed": 6,
};

export const LANGUE: Record<string, number> = {
    "Français": 1,
    "Malagasy": 2,
};