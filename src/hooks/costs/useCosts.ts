import { api } from "../../api/https";

export const type_cout_mapping = {
    GLPI: 1,
    SUPER_COST: 2,
    OUVERTURE: 3,
} as const;

export interface TicketCost {
    id?: number;
    ticket_id: number;
    cost: number;
    id_items?: number ;
    category: string | null;
    type_cout: number; 
}

export function useConsts() {
    
    const getAll = async (): Promise<TicketCost[]> => {
        try {
            const reponse = await api.get("/Cost");
            return reponse.data;
        } catch (erreur: any) {
            console.error("Erreur getAll : " + erreur.message);
            throw new Error(erreur.message);
        }
    };

    const getByTickets = async (ticketId: number, typeCoutId: number): Promise<TicketCost> => {
        try {
            const reponse = await api.post(`/Cost/detail/${ticketId}`, { type_cout: typeCoutId });
            return reponse.data;
        } catch (erreur: any) {
            console.error("Erreur getByTickets : " + erreur.message);
            throw new Error(erreur.message);
        }
    };

    const upsert = async (
        ticketId: number, 
        cost: number, 
        typeCoutId: number, 
        category: string | "" , 
        idItems: number | null
    ): Promise<TicketCost> => {
        try {
            const reponse = await api.post(`/Cost/${ticketId}`, {
                cost,
                id_items: idItems,
                category,
                type_cout: typeCoutId
            });
            return reponse.data;
        } catch (erreur: any) {
            console.error("Erreur upsert : " + erreur.message);
            throw new Error(erreur.message);
        }
    };

    const Remove = async (ticketId: number, typeCoutId: number): Promise<void> => {
        try {
            await api.delete(`/Cost/${ticketId}`, { data: { type_cout: typeCoutId } });
        } catch (erreur: any) {
            console.error("Erreur Remove : " + erreur.message);
            throw new Error(erreur.message);
        }
    };
    
    const Reouvre = async (ticketId: number, costOuverture: number, category: string ,idItems : number | null): Promise<TicketCost> => {
        try {
            return await upsert(ticketId, costOuverture, type_cout_mapping.OUVERTURE, category,idItems);
        } catch (erreur: any) {
            console.error("Erreur Reouvre : " + erreur.message);
            throw new Error(erreur.message);
        }
    };

    return { getAll, getByTickets, upsert, Remove, Reouvre };
}