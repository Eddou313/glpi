import { api } from "../../api/https";

export interface TicketCost {
    id: number;
    ticket_id: number;
    cost: number;
    nbr_elements: number;
    status : boolean;
    cost_reoverture : number;
}

export function useConsts() {
    const getAll = async (): Promise<TicketCost[]> => {
        try {
            const reponse = await api.get("/Cost");
            console.log(reponse.data);
            return reponse.data;
        }
        catch (erreur: any) {
            console.error("Erreur lors de l'enregistrement du paramètre : " + erreur.message);
            throw new Error("Erreur lors de l'enregistrement du paramètre : " + erreur.message);
        }
    }
    const getByTickets = async (id: number): Promise<TicketCost> => {
        try {
            const reponse = await api.get(`/Cost/${id}`);
            return reponse.data;
        }
        catch (erreur: any) {
            console.error("Erreur lors de l'enregistrement du paramètre : " + erreur.message);
            throw new Error("Erreur lors de l'enregistrement du paramètre : " + erreur.message);
        }
    }
    const upsert = async (ticketId: number, cost: number, nb_elements: number): Promise<TicketCost> => {
        try {
            const reponse = await api.post(`/Cost/${ticketId}`, {
                ticket_id: ticketId,
                cost,
                nbr_elements: nb_elements 
            });
            return reponse.data;
        }
        catch (erreur: any) {
            console.error("Erreur lors de l'enregistrement du coût : " + erreur.message);
            throw new Error("Erreur lors de l'enregistrement du coût : " + erreur.message);
        }
    }
    const Remove = async (id: number): Promise<TicketCost> => {
        try {
            const reponse = await api.delete(`/Cost/${id}`);
            return reponse.data;
        }
        catch (erreur: any) {
            console.error("Erreur lors de l'enregistrement du paramètre : " + erreur.message);
            throw new Error("Erreur lors de l'enregistrement du paramètre : " + erreur.message);
        }
    }
    const Reouvre = async (id: number,a:number): Promise<TicketCost> => {
        try {
            const reponse = await api.post(`/Cost/ouvre/${id}`,{idT : id,cost_reoverture : a});
            console.log(reponse.data);
            return reponse.data;
        }
        catch (erreur: any) {
            console.error("Erreur lors de l'enregistrement du paramètre : " + erreur.message);
            throw new Error("Erreur lors de l'enregistrement du paramètre : " + erreur.message);
        }
    }
    return { getAll, getByTickets, upsert ,Remove,Reouvre}
}