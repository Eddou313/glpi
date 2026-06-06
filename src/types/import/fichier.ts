export type colonneCSV = {
    fichier1: {
        Name: string;
        Status: string;
        Location: string;
        Manufacturer: string;
        Item_Type: string;
        Model: string;
        Inventory_Number: string;
        User ?: string;
    },

    fichier2: {
        Ref_Ticket: string;
        Date: string;
        Heure: string;
        Type: number;
        Titre: number;
        Description:string;
        Status:string;
        Priority:string;
        Items:string;
    };

    fichier3: {
        Num_Ticket: string;
        Duration_second: string;
        Time_Cost: string;
        Fixed_Cost: string;
    }
}

export type ImportDataType = keyof colonneCSV;
export const FICHIER1_COLUMNS = [
    "Name",
    "Status",
    "Location",
    "Manufacturer",
    "Item_Type",
    "Model",
    "Inventory_Number",
    "User",
] as const;

export const FICHIER2_COLUMNS = [
    "Ref_Ticket",
    "Date",
    "Heure",
    "Type",
    "Titre",
    "Description",
    "Status",
    "Priority",
    "Items",
] as const;
export const COLUMNS_DATE_FICHIER2 = ["Date"] as const;
export const COLUMNS_HEURE_FICHIER2 = ["Date"] as const;

export const FICHIER3_COLUMNS = [
    "Num_Ticket",
    "Duration_second",
    "Time_Cost",
    "Fixed_Cost",
] as const;

