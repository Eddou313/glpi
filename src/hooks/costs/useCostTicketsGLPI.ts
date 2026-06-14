import { glpiGet } from "../../api/db_client"

export interface TicketsCost {
    id: number;
    ticket: {
        id: number;
        name: string;
    };
    name: string;
    comment: string | null; 
    date_begin: string | null;
    date_end: string | null;
    duration: number;
    cost_time: number;
    cost_fixed: number;
    cost_material: number;
    budget: {
        id: number;
        name: string;
    } | null;
    entity: {
        id: number;
        name: string;
    };
}

export interface TicketsCostReel {
    Ticket_id: number;
    Ticket_name: string;
    date_creation : string | null;
    durationT: number;
    cost_timeT: number;
    cost_fixedR: number;
    cost_materialT: number;
    cost_Total: number;
}

export const ServiceCost = {
    getByTickets: (id: number) => glpiGet<TicketsCost[]>(`Assistance/Ticket/${id}/Cost`),
}

export function useCostTicketsGLPI() {
    const getCostByTickets = async (id: number): Promise<TicketsCostReel | null> => {
        try {
            const result = await ServiceCost.getByTickets(id);
            
            let duration = 0;
            let cost_time = 0;
            let cost_fixed = 0;
            let cost_material = 0;
            let total = 0;

            if (!result || result.length === 0) {
                return null;
            }

            for (const item of result) {
                const fixe = Number(item.cost_fixed) || 0;
                const materiel = Number(item.cost_material) || 0;
                const tauxHoraire = Number(item.cost_time) || 0;
                const dureeSecondes = Number(item.duration) || 0;

                const coutTemps = (dureeSecondes / 3600) * tauxHoraire;
                const totalLigneCout = fixe + materiel + coutTemps;

                duration += dureeSecondes;
                cost_fixed += fixe;
                cost_time += tauxHoraire;
                cost_material += materiel;
                total += totalLigneCout;
            }

            const reponse: TicketsCostReel = {
                Ticket_id: result[0].ticket.id, 
                Ticket_name: result[0].ticket.name,
                durationT: duration,
                cost_timeT: cost_time,
                cost_fixedR: cost_fixed,
                cost_materialT: cost_material,
                cost_Total: Number(total.toFixed(2)),
                date_creation: result[result.length-1].date_begin,
            };

            // console.log("reponse : " + JSON.stringify(reponse, null, 2));
            return reponse;

        } catch (error: any) {
            console.error("Erreur attrapée :", error); 
            throw new Error("Erreur lors de la recuperation cost : " + error.message);
        }
    }
    return { getCostByTickets }
}