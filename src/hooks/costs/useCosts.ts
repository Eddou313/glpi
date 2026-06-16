import { api } from "../../api/https";
import { useCallback } from "react";

export const type_cout_mapping = {
    GLPI: 1,
    SUPER_COST: 2,
    OUVERTURE: 3,
} as const;

interface DateOptions {
  annee?: number;
  mois?: number;
  jour?: number;
  heures?: number;
  minutes?: number;
  secondes?: number;
}
// obtenirDateFormatee({ annee: 2029, mois: 12 }); 
// Résultat : "2029-12-16 14:30:15" (garde le jour et l'heure actuelle)

// obtenirDateFormatee({ heures: 8, minutes: 0, secondes: 0 }); 
// Résultat : "2026-06-16 08:00:00"
export const obtenirDateFormatee = (options?: DateOptions): string => {
  const maintenant = new Date();

  // Si une option est fournie, on l'utilise, sinon on prend la valeur actuelle
  const annee = options?.annee ?? maintenant.getFullYear();
  // Attention : les mois de l'objet Date vont de 0 à 11. 
  // Si l'utilisateur passe "3" pour Mars, on fait 3 - 1 = 2.
  const moisIndex = options?.mois !== undefined ? options.mois - 1 : maintenant.getMonth();
  const jour = options?.jour ?? maintenant.getDate();
  const heures = options?.heures ?? maintenant.getHours();
  const minutes = options?.minutes ?? maintenant.getMinutes();
  const secondes = options?.secondes ?? maintenant.getSeconds();

  // On crée une nouvelle date basée sur ces composants
  const dateFinale = new Date(annee, moisIndex, jour, heures, minutes, secondes);

  // Formatage avec padStart pour garantir le format SQLite (YYYY-MM-DD HH:mm:ss)
  const fAnnee = dateFinale.getFullYear();
  const fMois = String(dateFinale.getMonth() + 1).padStart(2, "0");
  const fJour = String(dateFinale.getDate()).padStart(2, "0");
  const fHeures = String(dateFinale.getHours()).padStart(2, "0");
  const fMinutes = String(dateFinale.getMinutes()).padStart(2, "0");
  const fSecondes = String(dateFinale.getSeconds()).padStart(2, "0");

  return `${fAnnee}-${fMois}-${fJour} ${fHeures}:${fMinutes}:${fSecondes}`;
};

export interface TicketCost {
    id?: number;
    ticket_id: number;
    cost: number;
    id_items?: number;
    category: string | null;
    type_cout: number;
    is_deleted: boolean
    group: string;
}

export interface TicketCostDisplay extends TicketCost {
  glpiCostPerItem: number;
  glpiCostTotal: number;
  linkedItemsCount: number;
  totalCost: number;
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

    const getByTickets = useCallback(async (ticketId: number, typeCoutId: number, nbrItems : number): Promise<TicketCost | null> => {
        try {
            const reponse = await api.get(`/Cost/${ticketId}`, { params: { type_cout: typeCoutId,nbrItems :nbrItems  } });
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
            const dateAujourdhui = obtenirDateFormatee();
            const reponse = await api.post(`/Cost/${ticketId}`, {
                cost,
                id_items: idItems,
                category,
                type_cout: typeCoutId,
                group: dateAujourdhui
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

// const dateStr = "01-02-2006"; // Format: JJ-MM-AAAA
// const heureStr = "08:02:04";  // Format: HH:mm:ss

// 1. On divise la date par le tiret "-"
    // const [jour, mois, annee] = dateStr.split("-").map(Number);

// 2. On divise l'heure par les deux-points ":"
    // const [heures, minutes, secondes] = heureStr.split(":").map(Number);

// 3. On passe le tout à notre fonction sous forme d'objet
    // const dateSQLite = obtenirDateFormatee({
    //   annee,
    //   mois,
    //   jour,
    //   heures,
    //   minutes,
    //   secondes
    // });

// console.log(dateSQLite);