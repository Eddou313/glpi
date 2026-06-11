const API_BASE_URL = import.meta.env.VITE_GLPI_API_URL || '/glpi-api';
const CLIENT_ID = import.meta.env.VITE_GLPI_CLIENT_ID;
const CLIENT_SECRET = import.meta.env.VITE_GLPI_CLIENT_SECRET;
const GLPI_USER = import.meta.env.VITE_GLPI_USER;
const APP_TOKEN = import.meta.env.VITE_GLPI_APP_TOKEN;     // obligatoire pour v1
const V1_BASE = import.meta.env.VITE_GLPI_LEGACY_API_URL || `${API_BASE_URL.replace('/glpi-api', '')}/apirest.php`;
const USER_TOKEN = import.meta.env.VITE_GLPI_USER_TOKEN;

let cachedToken: string | null = localStorage.getItem("glpi_token");
let cachedToken2: string | null = localStorage.getItem("glpi_token_legacy");

const TOKEN_LIFETIME = 24 * 60 * 60 * 1000;
let tokenExpiresAt: number = Number(localStorage.getItem("glpi_token_exp") || 0);

let _v1SessionToken: string | null = localStorage.getItem("glpi_v1_session");


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
    cachedToken2 = data.access_token;
    if (!cachedToken && !cachedToken2) {
      return { error: "Token invalide reçu du serveur" };
    }

    // tokenExpiresAt = now + (data.expires_in ?? 3600) * 1000 - 30_000;
    tokenExpiresAt = now + TOKEN_LIFETIME;

    // sync storage
    localStorage.setItem("glpi_token", cachedToken ?? "");
    localStorage.setItem("glpi_token_exp", String(tokenExpiresAt));
    localStorage.setItem("glpi_token_legacy", cachedToken2 ?? "");

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
  const token = cachedToken || localStorage.getItem("glpi_token");

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

//  v1
export async function initV1Session(force = false): Promise<string> {
  // ── Si force ou token en mémoire absent → nouvelle session ───────────────
  if (!force && _v1SessionToken) return _v1SessionToken;

  // Vider l'ancien token avant de réinitialiser
  _v1SessionToken = null;
  localStorage.removeItem("glpi_v1_session");

  if (!USER_TOKEN) throw new Error("USER_TOKEN manquant dans .env");
  if (!APP_TOKEN)  throw new Error("APP_TOKEN manquant dans .env");

  const res = await fetch(`${V1_BASE}/initSession`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "App-Token":    APP_TOKEN,
      "Authorization": `user_token ${USER_TOKEN}`,
    },
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`[GLPI v1] initSession → HTTP ${res.status}\n${text}`);
  }

  const data = JSON.parse(text);
  if (!data?.session_token) {
    throw new Error("[GLPI v1] session_token absent de la réponse");
  }

  _v1SessionToken = data.session_token;
  localStorage.setItem("glpi_v1_session", _v1SessionToken!);
  console.log("[GLPI v1] Nouvelle session ouverte");

  return _v1SessionToken!;
}

export function invalidateV1Session(): void {
  _v1SessionToken = null;
  localStorage.removeItem("glpi_v1_session");
}

export async function glpiFetchV1<T>(
  method:  "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  path:    string,
  body?:   unknown,
  retry = true
): Promise<T> {
  // Toujours utiliser le token en mémoire — jamais celui du localStorage seul
  // car il peut être expiré depuis la dernière session
  const session = _v1SessionToken ?? await initV1Session();

  const headers: Record<string, string> = {
    "Content-Type":  "application/json",
    "Session-Token": session,
    ...(APP_TOKEN ? { "App-Token": APP_TOKEN } : {}),
  };

  const res = await fetch(`${V1_BASE}/${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();

  if (!res.ok) {
    // Token invalide ou expiré → on réinitialise et on réessaie une seule fois
    if ((res.status === 401 || res.status === 403) && retry) {
      console.warn(`[GLPI v1] Session invalide (${res.status}) — réinitialisation…`);
      invalidateV1Session();
      await initV1Session(true);  // force = true
      return glpiFetchV1<T>(method, path, body, false); // retry=false pour éviter boucle
    }
    console.error(`[GLPI v1] ERROR ${method} ${path}:`, text);
    throw new Error(`[GLPI v1 ${method}] ${path} → HTTP ${res.status}\n${text}`);
  }

  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}
export const glpiGetV1 = <T>(path: string) => glpiFetchV1<T>("GET", path);
export const glpiPostV1 = <T>(path: string, body: unknown) => glpiFetchV1<T>("POST", path, body);
export const glpiPutV1 = <T>(path: string, body: unknown) => glpiFetchV1<T>("PUT", path, body);
export const glpiPatchV1 = <T>(path: string, body: unknown) => glpiFetchV1<T>("PATCH", path, body);
export const glpiDeleteV1 = <T>(path: string) => glpiFetchV1<T>("DELETE", path);
