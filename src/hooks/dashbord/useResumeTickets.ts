import { useState, useEffect, useCallback } from 'react';
import { glpiGet, glpiGetV1 } from '../../api/db_glpi';
import { TICKET_STATUS_LABELS, TICKET_TYPE_LABELS, TICKET_PRIORITY_LABELS, type GlpiTicket, type TicketSummary, } from '../../types/dashbord/dashbord.type';

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
  const [summary, setSummary] = useState<TicketSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let allTickets: GlpiTicket[] = [];
      let currentRangeStart = 0;
      const batchSize = 100; // Limite de sécurité GLPI v1
      let hasMore = true;

      while (hasMore) {
        const rangeEnd = currentRangeStart + batchSize - 1;

        const url = `Ticket?range=${currentRangeStart}-${rangeEnd}`;
        const ticketsBatch = await glpiGetV1<GlpiTicket[]>(url);

        if (ticketsBatch && ticketsBatch.length > 0) {
          allTickets = [...allTickets, ...ticketsBatch];

          if (ticketsBatch.length < batchSize) {
            hasMore = false;
          } else {
            currentRangeStart += batchSize;
          }
        } else {
          hasMore = false;
        }
      }

      setSummary({
        total: allTickets.length,
        byStatus: groupAndCount(allTickets, t => t.status, TICKET_STATUS_LABELS),
        byType: groupAndCount(allTickets, t => t.type, TICKET_TYPE_LABELS),
        byPriority: groupAndCount(allTickets, t => t.priority, TICKET_PRIORITY_LABELS),
      });

    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement complet des tickets v1');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { summary, loading, error, refresh: fetch };
}