import { glpiFetch } from "../../../api/db_glpi";

type DropdownItem = { id: number; name: string };

// Cache mémoire: endpoint → liste complète
const listCache = new Map<string, DropdownItem[]>();
// Cache mémoire: endpoint::name → id
const idCache = new Map<string, number>();

function idCacheKey(endpoint: string, name: string) {
  return `${endpoint}::${name.trim().toLowerCase()}`;
}

/**
 * Charge toute la liste d'un endpoint dropdown (avec pagination GLPI).
 * Mis en cache pour éviter les appels répétés dans la même session.
 */
async function fetchAll(endpoint: string): Promise<DropdownItem[]> {
  if (listCache.has(endpoint)) return listCache.get(endpoint)!;

  const allItems: DropdownItem[] = [];
  let start = 0;
  const limit = 100;

  while (true) {
    try {
      const page = await glpiFetch<DropdownItem[]>(
        "GET",
        `${endpoint}?limit=${limit}&start=${start}`,
      );
      if (!Array.isArray(page) || page.length === 0) break;
      allItems.push(...page);
      if (page.length < limit) break;
      start += limit;
    } catch {
      break;
    }
  }

  listCache.set(endpoint, allItems);
  return allItems;
}

/**
 * Cherche un item par nom dans la liste complète (comparaison locale).
 */
async function findByName(
  endpoint: string,
  name: string,
): Promise<number | null> {
  const items = await fetchAll(endpoint);
  const needle = name.trim().toLowerCase();
  const match = items.find((r) => r.name?.trim().toLowerCase() === needle);
  return match ? match.id : null;
}

export async function resolveOrCreate(
  endpoint: string,
  name: string,
  extraPayload: Record<string, unknown> = {},
): Promise<number> {
  const trimmed = name.trim();
  if (!trimmed) return 0;

  const key = idCacheKey(endpoint, trimmed);
  if (idCache.has(key)) return idCache.get(key)!;

  // 1. Chercher dans la liste complète
  const found = await findByName(endpoint, trimmed);
  if (found !== null) {
    idCache.set(key, found);
    return found;
  }

  // 2. Créer
  try {
    const created = await glpiFetch<{ id: number }>("POST", endpoint, {
      input: { name: trimmed, ...extraPayload },
    });
    // Invalider le cache liste pour cet endpoint (nouvel item ajouté)
    listCache.delete(endpoint);
    idCache.set(key, created.id);
    return created.id;
  } catch (err: any) {
    // GLPI 500 "unique" = item existe déjà mais GET ne l'a pas trouvé
    // → forcer rechargement de la liste
    listCache.delete(endpoint);
    const retry = await findByName(endpoint, trimmed);
    if (retry !== null) {
      idCache.set(key, retry);
      return retry;
    }
    throw err;
  }
}

/** Vider les caches (utile entre deux imports) */
export function clearDropdownCache(): void {
  listCache.clear();
  idCache.clear();
}