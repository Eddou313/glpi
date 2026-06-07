import { useEffect, useState } from "react";
import { glpiFetch} from "../../api/db_glpi";
import type { GLPICategory } from "../../types/category/category.types";


export function useCategory() {
    const [categories, setCategories] = useState<GLPICategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    async function fetchCategories()
    {
        try {
            setLoading(true);
            setError(null);
            const data: GLPICategory[] = [];

            // const data = await glpiFetch<GLPICategory[]>(
                // "GET",
                // "ITILCategory"
            // );

            setCategories(data ?? []);
        } catch (e: any) {
            setError(
                e?.message || "Erreur lors du chargement des Catégories"
            );
            setCategories([]);
        } finally {
            setLoading(false);
        }
    }
    useEffect(() => {
        fetchCategories();
    }, []);
    return {
        fetchCategories,
        categories,
        loading,
        error
    };
}