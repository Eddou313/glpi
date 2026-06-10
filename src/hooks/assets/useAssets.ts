import { useEffect, useState, useCallback } from "react";
import { glpiGet, glpiGetV1 } from "../../api/db_glpi";

interface GlpiV2AssetTypeResponse {
    itemtype: string;
    name: string;
    href: string;
}

export type GlpiAsset = {
    id: number;
    name: string;
    itemtype: string;
};

export async function fetchAssetTypes(): Promise<GlpiV2AssetTypeResponse[]> {
    const assetTypes = await glpiGet<GlpiV2AssetTypeResponse[]>("Assets");
    return Array.isArray(assetTypes) ? assetTypes : [];
}

export async function fetchElementsForType(assetType: GlpiV2AssetTypeResponse): Promise<GlpiAsset[]> {
    try {
        const endpointMatch = assetType.href.match(/\/([^/]+)$/);
        const endpoint = endpointMatch ? endpointMatch[1] : assetType.itemtype;

        const data = await glpiGetV1<any[]>(endpoint);

        if (Array.isArray(data)) {
            return data.map((item) => ({
                id: item.id || 0,
                name: item.name || `${assetType.name} #${item.id}`,
                itemtype: assetType.name || assetType.itemtype,
            }));
        }
    } catch (e: any) {
        console.warn(`[Généralisation v1] Info pour l'endpoint ${assetType.itemtype} :`, e.message || e);
    }
    return [];
}

export function useItems() {
    const [items, setItems] = useState<GlpiAsset[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAllAssetsDynamically = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const assetTypes = await fetchAssetTypes();

            if (assetTypes.length === 0) {
                setItems([]);
                return;
            }

            const promises = assetTypes.map((type) => fetchElementsForType(type));
            const results = await Promise.all(promises);
            
            setItems(results.flat());
        } catch (err: any) {
            setError(err.message || "Erreur lors de la récupération dynamique du parc");
            console.error("Erreur useItems V2/V1 Hybride:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAllAssetsDynamically();
    }, [fetchAllAssetsDynamically]);

    return {
        items,
        loading,
        error,
        refresh: fetchAllAssetsDynamically,
    };
}