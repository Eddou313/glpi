import { useState, useEffect, useCallback } from 'react';
import { glpiGet } from '../../api/db_glpi';
import {TICKET_STATUS_LABELS,TICKET_TYPE_LABELS,TICKET_PRIORITY_LABELS,type GlpiTicket,type TicketSummary,} from '../../types/dashbord/dashbord.type';

// Utilitaire : regroupe un tableau par une clé et compte
function groupAndCount<T>(
  items: T[],
  getKey: (item: T) => unknown,   // ← était : number
  labels: Record<number, string>
): { label: string; count: number }[] {
  const counts: Record<number, number> = {};

  for (const item of items) {
    const raw = getKey(item);

    const key = typeof raw === 'object' && raw !== null
      ? Number((raw as any).id ?? (raw as any).value ?? 0)
      : Number(raw);

    if (!Number.isFinite(key)) continue;   
    counts[key] = (counts[key] ?? 0) + 1;
  }

  return Object.entries(counts).map(([key, count]) => ({
    label: labels[Number(key)] ?? `Inconnu (${key})`,
    count,
  }));
}
export function useTicketSummary() {
  const [summary, setSummary]   = useState<TicketSummary | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error,   setError]     = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // On récupère tous les tickets (champs minimaux pour la perf)
      const tickets = await glpiGet<GlpiTicket[]>(
        'Assistance/Ticket?range=0-9999&fields=id,status,type,priority'
      );

      setSummary({
        total:      tickets.length,
        byStatus:   groupAndCount(tickets, t => t.status,   TICKET_STATUS_LABELS),
        byType:     groupAndCount(tickets, t => t.type,     TICKET_TYPE_LABELS),
        byPriority: groupAndCount(tickets, t => t.priority, TICKET_PRIORITY_LABELS),
    });

    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des tickets');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { summary, loading, error, refresh: fetch };
}