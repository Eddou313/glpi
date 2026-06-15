import { api } from "../../api/https";
import { useCallback } from "react";

export const type_cout_mapping = {
    GLPI: 1,
    SUPER_COST: 2,
    OUVERTURE: 3,
} as const;

export interface TicketCost {
    id?: number;
    ticket_id: number;
    cost: number;
    id_items?: number;
    category: string | null;
    type_cout: number;
    is_deleted: boolean
}

export function useConsts() {

    const getAll = useCallback(async (): Promise<TicketCost[]> => {
        try {
            const reponse = await api.get("/Cost");
            return reponse.data || [];
        } catch (erreur: any) {
            console.error("Erreur getAll : " + erreur.message);
            throw new Error(erreur.message);
        }
    }, []);

    const getByTickets = useCallback(async (ticketId: number, typeCoutId: number): Promise<TicketCost | null> => {
        try {
            const reponse = await api.get(`/Cost/${ticketId}`, { params: { type_cout: typeCoutId } });
            if (!reponse.data || !Array.isArray(reponse.data) || reponse.data.length === 0) {
                return null;
            }
            const data: TicketCost[] = reponse.data;
            const totalCost = data.reduce((sum, item) => sum + (item.cost || 0), 0);
            return {
                ...data[0],
                cost: totalCost
            };
        } catch (erreur: any) {
            console.error("Erreur getByTickets : " + erreur.message);
            return null;
        }
    }, []);
    const upsert = useCallback(async (
        ticketId: number,
        cost: number,
        typeCoutId: number,
        category: string | "",
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
    }, []);

    const Remove = useCallback(async (ticketId: number, typeCoutId: number): Promise<void> => {
        try {
            await api.delete(`/Cost/${ticketId}`, { data: { type_cout: typeCoutId } });
        } catch (erreur: any) {
            console.error("Erreur Remove : " + erreur.message);
            throw new Error(erreur.message);
        }
    }, []);

    const Reouvre = useCallback(async (ticketId: number, costOuverture: number, category: string, idItems: number | null): Promise<TicketCost> => {
        try {
            return await upsert(ticketId, costOuverture, type_cout_mapping.OUVERTURE, category, idItems);
        } catch (erreur: any) {
            console.error("Erreur Reouvre : " + erreur.message);
            throw new Error(erreur.message);
        }
    }, [upsert]);

    const getIsDeleted = useCallback(async (ticketId: number, typeCoutId: number): Promise<TicketCost | null> => {
        try {
            const reponse = await api.post(`/Cost/is_deleted/${ticketId}`, { type_cout: typeCoutId });
            if (!reponse.data || reponse.data.message || Object.keys(reponse.data).length === 0) {
                return null;
            }

            return reponse.data;
        } catch (erreur: any) {
            console.error("Erreur getByTickets : " + erreur.message);
            return null;
        }
    }, []);

    const RemoveForce = useCallback(async (ticketId: number, typeCoutId: number,nbr_items: number): Promise<void> => {
        try {
            await api.delete(`/Cost/force/${ticketId}`, { data: { type_cout: typeCoutId , nbr_items: nbr_items } });
        } catch (erreur: any) {
            console.error("Erreur Remove : " + erreur.message);
            throw new Error(erreur.message);
        }
    }, []);


    return { getAll, getByTickets, upsert, Remove, Reouvre, getIsDeleted, RemoveForce };
}