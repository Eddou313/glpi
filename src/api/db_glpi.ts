// glpiClient.ts — Client GLPI API centralisé

// En dev, le proxy Vite (/glpi-api → http://glpi.localhost/api.php) évite le CORS.
// En prod, VITE_GLPI_API_URL doit pointer vers l'URL réelle de l'API GLPI.
const API_BASE_URL = import.meta.env.VITE_GLPI_API_URL || '/glpi-api';
const CLIENT_ID     = import.meta.env.VITE_GLPI_CLIENT_ID;
const CLIENT_SECRET = import.meta.env.VITE_GLPI_CLIENT_SECRET;
const GLPI_USER     = import.meta.env.VITE_GLPI_USER;
const GLPI_PASSWORD = import.meta.env.VITE_GLPI_PASSWORD;

// ─── Token cache (durée de vie en mémoire) ────────────────────────────────────
let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

/**
 * Récupère (ou renouvelle) le token OAuth2 GLPI via le flux Password.
 * Le token est mis en cache jusqu'à son expiration pour éviter les appels répétés.
 */
export async function getGLPIToken(): Promise<string> {
  const now = Date.now();

  if (cachedToken && now < tokenExpiresAt) {
    return cachedToken;
  }

  if (!CLIENT_ID || !GLPI_USER) {
    throw new Error(
      "Variables d'environnement GLPI incomplètes (.env). " +
      "Vérifiez VITE_GLPI_CLIENT_ID et VITE_GLPI_USER."
    );
  }

  const response = await fetch(`${API_BASE_URL}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type:    'password',
      client_id:     CLIENT_ID,
      client_secret: CLIENT_SECRET,
      username:      GLPI_USER,
      password:      GLPI_PASSWORD,
      scope:         'api',
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData?.message || `Échec de l'authentification GLPI (HTTP ${response.status})`
    );
  }

  const data = await response.json();

  cachedToken   = data.access_token;
  // expires_in est en secondes ; on soustrait 30s de marge
  tokenExpiresAt = now + (data.expires_in ?? 3600) * 1000 - 30_000;

  return cachedToken!;
}

// ─── Couche de transport interne ─────────────────────────────────────────────

/**
 * Fonction de transport interne : ajoute le token, construit l'URL, gère les erreurs.
 * Utilise les helpers publics (glpiGet, glpiPost…) plutôt que cette fonction directement.
 */
async function glpiFetch<T = unknown>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown,
  options: Omit<RequestInit, 'method' | 'body'> = {}
): Promise<T> {
  const token = await getGLPIToken();
  const url   = `${API_BASE_URL}/v2.3/${path}`;

  console.debug(`[GLPI] ${method} ${url}`, body ?? '');

  const response = await fetch(url, {
    ...options,
    method,
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData?.message ||
      `[GLPI ${method}] ${path} → HTTP ${response.status}`
    );
  }

  // 204 No Content (DELETE/PUT sans corps de réponse)
  if (response.status === 204) return undefined as T;

  return response.json() as Promise<T>;
}

// ─── Helpers publics par verbe HTTP ──────────────────────────────────────────

/**
 * GET — Lire une ressource ou une liste.
 * @example
 * const users   = await glpiGet<GLPIUser[]>('Administration/User');
 * const ticket  = await glpiGet<Ticket>(`Helpdesk/Ticket/${id}`);
 * const results = await glpiGet<Ticket[]>('Helpdesk/Ticket?limit=50&status=open');
 */
export const glpiGet = <T = unknown>(path: string) =>
  glpiFetch<T>('GET', path);

/**
 * POST — Créer une ressource.
 * @example
 * const created = await glpiPost<Ticket>('Helpdesk/Ticket', {
 *   name: 'Problème réseau',
 *   content: 'Pas d'accès Internet',
 *   itilcategories_id: 3,
 * });
 */
export const glpiPost = <T = unknown>(path: string, body: unknown) =>
  glpiFetch<T>('POST', path, body);

/**
 * PUT — Remplacer complètement une ressource.
 * @example
 * await glpiPut(`Administration/User/${id}`, { ...updatedUser });
 */
export const glpiPut = <T = unknown>(path: string, body: unknown) =>
  glpiFetch<T>('PUT', path, body);

/**
 * PATCH — Mettre à jour partiellement une ressource.
 * @example
 * await glpiPatch(`Administration/User/${id}`, { is_active: false });
 */
export const glpiPatch = <T = unknown>(path: string, body: unknown) =>
  glpiFetch<T>('PATCH', path, body);

/**
 * DELETE — Supprimer une ressource.
 * @example
 * await glpiDelete(`Administration/User/${id}`);
 */
export const glpiDelete = <T = unknown>(path: string) =>
  glpiFetch<T>('DELETE', path);

/**
 * Invalide manuellement le token en cache (utile après une erreur 401).
 */
export function invalidateGLPIToken(): void {
  cachedToken   = null;
  tokenExpiresAt = 0;
}