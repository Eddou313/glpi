import { useCallback, useState } from "react";
import { type TicketCost } from "./useCosts";
import { api } from "../../api/https";

export function useSuperOuvertures() {
    const [rows, setRows] = useState<TicketCost[]>([]);
    const [cancelledRows, setCancelledRows] = useState<TicketCost[]>([]);
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
        } finally {
            setLoading(false);
        }
    }, []);

    const refreshCancelled = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const reponse = await api.get<TicketCost[]>("/Cost/cancelled");
            setCancelledRows(reponse.data || []);
        } catch (error: any) {
            setError(error.message || "Erreur chargement des annulations.");
        } finally {
            setLoading(false);
        }
    }, []);

    const refreshAll = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [activeResponse, cancelledResponse] = await Promise.all([
                api.get<TicketCost[]>("/Cost/super-ouverture"),
                api.get<TicketCost[]>("/Cost/cancelled"),
            ]);

            setRows(activeResponse.data || []);
            setCancelledRows(cancelledResponse.data || []);
        } catch (error: any) {
            setError(error.message || "Erreur chargement.");
        } finally {
            setLoading(false);
        }
    }, []);

    const update = useCallback(async (
        id: number,
        cost: number,
        percentage: number,
        modeOuverture: number | null
    ) => {
        setLoading(true);
        setError(null);
        try {
            const reponse = await api.put<TicketCost[]>(`/Cost/super-ouverture/${id}`, {
                cost,
                percentage,
                mode_ouverture: modeOuverture,
            });
            setRows(reponse.data || []);
        } catch (error: any) {
            setError(error.message || "Erreur modification.");
        } finally {
            setLoading(false);
        }
    }, []);

    const remove = useCallback(async (id: number) => {
        setLoading(true);
        setError(null);
        try {
            const reponse = await api.delete<TicketCost[]>(`/Cost/super-ouverture/${id}`);
            setRows(reponse.data || []);

            const cancelledResponse = await api.get<TicketCost[]>("/Cost/cancelled");
            setCancelledRows(cancelledResponse.data || []);
        } catch (error: any) {
            setError(error.message || "Erreur suppression.");
        } finally {
            setLoading(false);
        }
    }, []);

    const restoreCancelled = useCallback(async (id: number) => {
        setLoading(true);
        setError(null);
        try {
            const reponse = await api.post<TicketCost[]>(`/Cost/cancelled/${id}/restore`);
            setRows(reponse.data || []);

            const cancelledResponse = await api.get<TicketCost[]>("/Cost/cancelled");
            setCancelledRows(cancelledResponse.data || []);
        } catch (error: any) {
            setError(error.message || "Erreur retablissement.");
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        rows,
        cancelledRows,
        loading,
        error,
        refresh,
        refreshCancelled,
        refreshAll,
        update,
        remove,
        restoreCancelled,
    };
}
