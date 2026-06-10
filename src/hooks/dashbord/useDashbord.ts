import { useState, useEffect, useCallback } from 'react';
import type { AssetSummary } from '../../types/dashbord/dashbord.type';
import { useItems } from '../assets/useAssets'; 

export function useAssetSummary() {
  const [summary, setSummary] = useState<AssetSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { items, loading: itemsLoading, error: itemsError } = useItems();

  const calculateSummary = useCallback(() => {
    if (itemsLoading) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (!items || items.length === 0) {
        setSummary({
          total: 0,
          byType: []
        });
        return;
      }

      const countsMap: Record<string, number> = {};
      items.forEach((item) => {
        const type = item.itemtype || "Autre";
        countsMap[type] = (countsMap[type] || 0) + 1;
      });

      const byType = Object.entries(countsMap).map(([label, count]) => ({
        label,
        count,
      })).sort((a, b) => b.count - a.count);

      const total = items.length;

      setSummary({
        total,
        byType,
      });

    } catch (err: any) {
      setError(err.message || 'Erreur lors du calcul des statistiques');
    } finally {
      setLoading(false);
    }
  }, [items, itemsLoading]);

  useEffect(() => {
    calculateSummary();
  }, [items, itemsLoading, calculateSummary]);

  useEffect(() => {
    if (itemsError) setError(itemsError);
  }, [itemsError]);

  return { 
    summary, 
    loading: itemsLoading || loading, 
    error, 
    refresh: calculateSummary 
  };
}