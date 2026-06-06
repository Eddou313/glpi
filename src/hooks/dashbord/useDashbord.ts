import { useState, useEffect, useCallback } from 'react';
import { glpiGet } from '../../api/db_glpi';
import { ASSET_TYPES,type AssetSummary,type GlpiCountResponse,} from '../../types/dashbord/dashbord.type';

export function safeCount(res: GlpiCountResponse): number {
  const raw = Number(res?.count ?? 0);
  return Number.isFinite(raw) ? raw : 0;
}

export function useAssetSummary() {
  const [summary, setSummary]   = useState<AssetSummary | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error,   setError]     = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const counts = await Promise.all(
        ASSET_TYPES.map(({ key }) =>
          glpiGet<GlpiCountResponse>(`Assets/${key}?only_count=true`)
            .then(res => safeCount(res))
            .catch(() => 0)  // si un type échoue, on met 0
        )
      );

      const byType = ASSET_TYPES.map((type, i) => ({
        label: type.label,
        count: counts[i] ?? 0,  
      }));

      setSummary({
        total:  counts.reduce((sum, c) => sum + c, 0),
        byType,
      });

    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des éléments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { summary, loading, error, refresh: fetch };
}