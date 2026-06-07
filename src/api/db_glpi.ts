const API_BASE_URL = import.meta.env.VITE_GLPI_API_URL || '/glpi-api';
const CLIENT_ID     = import.meta.env.VITE_GLPI_CLIENT_ID;
const CLIENT_SECRET = import.meta.env.VITE_GLPI_CLIENT_SECRET;
const GLPI_USER     = import.meta.env.VITE_GLPI_USER;

let cachedToken: string | null = localStorage.getItem("glpi_token");

let tokenExpiresAt: number = Number(localStorage.getItem("glpi_token_exp") || 0);

export function TokenValide(): boolean {
  const token = cachedToken || localStorage.getItem("glpi_token");
  const exp = tokenExpiresAt || Number(localStorage.getItem("glpi_token_exp"));

  return !!token && !!exp && Date.now() < exp;
}

export type reponse = {
  error?: string;
  success?: string;
};

export async function getGLPIToken(pwd: string): Promise<reponse> {
  if (!CLIENT_ID || !GLPI_USER) {
    throw new Error("Variables GLPI manquantes (.env)");
  }

  try {
    const response = await fetch(`${API_BASE_URL}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'password',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        username: GLPI_USER,
        password: pwd,
        scope: 'api',
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return {
        error:
          data?.message ||
          data?.error ||
          data?.error_description ||
          "Erreur de connexion GLPI",
      };
    }

    const now = Date.now();
    cachedToken = data.access_token;
    if (!cachedToken) {
      return { error: "Token invalide reçu du serveur" };
    }

    tokenExpiresAt =
      now + (data.expires_in ?? 3600) * 1000 - 30_000;

    // sync storage
    localStorage.setItem("glpi_token", cachedToken);
    localStorage.setItem("glpi_token_exp", String(tokenExpiresAt));

    return { success: "Connexion réussie" };

  } catch (error: any) {
    return {
      error: error.message || "Erreur réseau GLPI",
    };
  }
}

export async function glpiFetch<T>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown,
  options: RequestInit = {},
): Promise<T> {
  const token = cachedToken ||localStorage.getItem("glpi_token");

  if (!token) {
    throw new Error("Aucun token GLPI disponible (non connecté)");
  }

  const url = `${API_BASE_URL}/v2.3/${path}`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
    ...(options.headers as Record<string, string> ?? {})
  };
  

  if (method !== 'GET') {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    ...options,
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();

  if (!response.ok) {
    console.error("GLPI ERROR:", text);

    throw new Error(
      `[GLPI ${method}] ${path} → HTTP ${response.status}\n${text}`
    );
  }

  if (!text) return undefined as T;

  return JSON.parse(text) as T;
}

export const glpiGet = <T>(path: string) => glpiFetch<T>('GET', path);

export const glpiPost = <T>(path: string, body: unknown) => glpiFetch<T>('POST', path, body);

export const glpiPut = <T>(path: string, body: unknown) => glpiFetch<T>('PUT', path, body);

export const glpiPatch = <T>(path: string, body: unknown) => glpiFetch<T>('PATCH', path, body);

export const glpiDelete = <T>(path: string) => glpiFetch<T>('DELETE', path);

export function invalidateGLPIToken(): void {
  cachedToken = null;
  tokenExpiresAt = 0;
  localStorage.removeItem("glpi_token");
  localStorage.removeItem("glpi_token_exp");
}

// recuperation token 
export function getToken() {
  return cachedToken || localStorage.getItem("glpi_token");
}