const API_BASE_URL = import.meta.env.VITE_GLPI_API_URL || '/glpi-api';
const CLIENT_ID     = import.meta.env.VITE_GLPI_CLIENT_ID;
const CLIENT_SECRET = import.meta.env.VITE_GLPI_CLIENT_SECRET;
const GLPI_USER     = import.meta.env.VITE_GLPI_USER;
// const GLPI_PASSWORD = import.meta.env.VITE_GLPI_PASSWORD;

let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

export function TokenValide(): boolean {
  const token = cachedToken || localStorage.getItem("glpi_token");
  const exp = tokenExpiresAt || Number(localStorage.getItem("glpi_token_exp"));

  if (!token || !exp) return false;

  return Date.now() < exp;
}

export type reponse ={
  error ?: string;
  success ?: string;
}

export async function getGLPIToken(pwd:string): Promise<reponse> {
  if (!CLIENT_ID || !GLPI_USER) {
    throw new Error(
      "Variables d'environnement GLPI incomplètes (.env). " +
      "Vérifiez VITE_GLPI_CLIENT_ID et VITE_GLPI_USER."
    );
  }
  try {
    const response = await fetch(`${API_BASE_URL}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type:    'password',
        client_id:     CLIENT_ID,
        client_secret: CLIENT_SECRET,
        username:      GLPI_USER,
        password:      pwd,
        scope:         'api',
      }),
    });

    if (!response.ok) {
        let errorMessage = 'Erreur de connexion GLPI';
        try {
          const errorData = await response.json();
          errorMessage =
            errorData?.message ||
            errorData?.error ||
            errorData?.error_description ||
            errorMessage;
        } catch {
          const text = await response.text();
          if (text) errorMessage = text;
        }
        return {
          error: errorMessage,
        };
      }
    const now = Date.now();
    const data = await response.json();
    // expires_in est en secondes ; on soustrait 30s de marge
    cachedToken = data.access_token;
    if (cachedToken) {
      localStorage.setItem("glpi_token", cachedToken);
    }
    tokenExpiresAt = now + (data.expires_in ?? 3600) * 1000 - 30_000;
    localStorage.setItem("glpi_token_exp", tokenExpiresAt.toString());
    return {
      success: `connexion reussie`,
    }
  } catch (error: any) {
    return {
      error: error.message || 'Erreur réseau ou serveur GLPI',
    };
  }
}

async function glpiFetch<T = unknown>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown,
  options: Omit<RequestInit, 'method' | 'body'> = {}
): Promise<T> {
  const token =cachedToken;
  
  const url   = `${API_BASE_URL}/v2.3/${path}`;

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
    ...(method !== 'GET' && body !== undefined
      ? { body: JSON.stringify(body) }
      : {})
  });

  if (!response.ok) {
    const text = await response.text();

    console.error("GLPI ERROR:", text);

    throw new Error(
      `[GLPI ${method}] ${path} → HTTP ${response.status}\n${text}`
    );
  }
  // 204 No Content (DELETE/PUT sans corps de réponse)
  if (response.status === 204) return undefined as T;

  return response.json() as Promise<T>;
}

export const glpiGet = <T = unknown>(path: string) =>
  glpiFetch<T>('GET', path);

export const glpiPost = <T = unknown>(path: string, body: unknown) =>
  glpiFetch<T>('POST', path, body);

export const glpiPut = <T = unknown>(path: string, body: unknown) =>
  glpiFetch<T>('PUT', path, body);

export const glpiPatch = <T = unknown>(path: string, body: unknown) =>
  glpiFetch<T>('PATCH', path, body);

export const glpiDelete = <T = unknown>(path: string) =>
  glpiFetch<T>('DELETE', path);

export function invalidateGLPIToken(): void {
  cachedToken   = null;
  tokenExpiresAt = 0;
}