import { useCallback, useState } from "react";
import { type TicketCost } from "./useCosts";
import { api } from "../../api/https";

export function useSuperOuvertures() {
    const [rows, setRows] = useState<TicketCost[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const refresh = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const reponse = await api.get<TicketCost[]>("/Cost/super-ouverture");
            setRows(reponse.data || []);
        } catch (error: any) {
            setError(error.message || "Erreur chargement.");
        }
        finally {
            setLoading(false);
        }
    }, []);

    const update = useCallback(async (id: number, cost: number, percentage: number, modeOuverture: number | null) => {
        setLoading(true);
        setError(null);
        try {
            const reponse = await api.put<TicketCost[]>(`/Cost/super-ouverture/${id}`, {
                cost,
                percentage,
                mode_ouverture: modeOuverture
            });
            setRows(reponse.data || []);
        } catch (error: any) {
            setError(error.message || "Erreur modification.");
        }
        finally {
            setLoading(false);
        }
    }, []);

    const removeOuverture = useCallback(async (id: number) => {
        setLoading(true);
        setError(null);
        try {
            await api.delete(`/Cost/ouverture/${id}`);
            await refresh();
        } catch (error: any) {
            setError(error.message || "Erreur suppression.");
        }
        finally {
            setLoading(false);
        }
    }, [refresh]);

    return { rows, loading, error, refresh, update, removeOuverture };
}
