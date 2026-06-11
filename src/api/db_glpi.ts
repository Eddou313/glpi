const API_BASE_URL  = import.meta.env.VITE_GLPI_API_URL    || '/glpi-api';
const CLIENT_ID     = import.meta.env.VITE_GLPI_CLIENT_ID;
const CLIENT_SECRET = import.meta.env.VITE_GLPI_CLIENT_SECRET;
const GLPI_USER     = import.meta.env.VITE_GLPI_USER;
const APP_TOKEN     = import.meta.env.VITE_GLPI_APP_TOKEN;
const V1_BASE       = import.meta.env.VITE_GLPI_LEGACY_API_URL || `${API_BASE_URL.replace('/glpi-api', '')}/apirest.php`;
const USER_TOKEN    = import.meta.env.VITE_GLPI_USER_TOKEN;

const TOKEN_LIFETIME    = 24 * 60 * 60 * 1000; 
const V1_TOKEN_LIFETIME = 24 * 60 * 60 * 1000; 

let _v2Token:     string | null = localStorage.getItem("glpi_token");
let _v2ExpiresAt: number        = Number(localStorage.getItem("glpi_token_exp") || 0);

let _v1Token:     string | null = localStorage.getItem("glpi_v1_session");
let _v1ExpiresAt: number        = Number(localStorage.getItem("glpi_v1_exp") || 0);

export type reponse = { error?: string; success?: string };

export function TokenValide(): boolean {
  const token = _v2Token || localStorage.getItem("glpi_token");
  const exp   = _v2ExpiresAt || Number(localStorage.getItem("glpi_token_exp"));
  return !!token && !!exp && Date.now() < exp;
}

function isV1TokenFresh(): boolean {
  return !!_v1Token && _v1ExpiresAt > 0 && Date.now() < _v1ExpiresAt;
}

export async function getGLPIToken(pwd: string): Promise<reponse> {
  if (!CLIENT_ID || !GLPI_USER) {
    throw new Error("Variables GLPI manquantes (.env)");
  }

  try {
    const response = await fetch(`${API_BASE_URL}/token`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type:    "password",
        client_id:     CLIENT_ID,
        client_secret: CLIENT_SECRET,
        username:      GLPI_USER,
        password:      pwd,
        scope:         "api",
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

    const token = data.access_token;
    if (!token) return { error: "Token invalide reçu du serveur" };

    const expiresAt = Date.now() + TOKEN_LIFETIME;

    _v2Token     = token;
    _v2ExpiresAt = expiresAt;
    localStorage.setItem("glpi_token",     token);
    localStorage.setItem("glpi_token_exp", String(expiresAt));
    localStorage.setItem("glpi_token_legacy", token); // compat

    return { success: "Connexion réussie" };

  } catch (err: any) {
    return { error: err.message || "Erreur réseau GLPI" };
  }
}

export function invalidateGLPIToken(): void {
  _v2Token     = null;
  _v2ExpiresAt = 0;
  localStorage.removeItem("glpi_token");
  localStorage.removeItem("glpi_token_exp");
  localStorage.removeItem("glpi_token_legacy");
}

export function getToken(): string | null {
  return _v2Token || localStorage.getItem("glpi_token");
}
// V1
export async function initV1Session(force = false): Promise<string> {
  if (!force && isV1TokenFresh()) {
    return _v1Token!;
  }

  _v1Token     = null;
  _v1ExpiresAt = 0;
  localStorage.removeItem("glpi_v1_session");
  localStorage.removeItem("glpi_v1_exp");

  if (!USER_TOKEN) throw new Error("USER_TOKEN manquant dans .env");
  if (!APP_TOKEN)  throw new Error("APP_TOKEN manquant dans .env");

  const res = await fetch(`${V1_BASE}/initSession`, {
    method:  "GET",
    headers: {
      "Content-Type":  "application/json",
      "App-Token":     APP_TOKEN,
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

  const expiresAt = Date.now() + V1_TOKEN_LIFETIME;

  _v1Token     = data.session_token;
  _v1ExpiresAt = expiresAt;
  localStorage.setItem("glpi_v1_session", _v1Token!);
  localStorage.setItem("glpi_v1_exp",     String(expiresAt));

  console.log("[GLPI v1] Nouvelle session ouverte (valide 24h)");
  return _v1Token!;
}

export function invalidateV1Session(): void {
  _v1Token     = null;
  _v1ExpiresAt = 0;
  localStorage.removeItem("glpi_v1_session");
  localStorage.removeItem("glpi_v1_exp");
}


export async function glpiFetch<T>(
  method:  "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  path:    string,
  body?:   unknown,
  options: RequestInit = {},
): Promise<T> {
  const token = _v2Token || localStorage.getItem("glpi_token");
  if (!token) throw new Error("Aucun token GLPI disponible (non connecté)");
  if (!token || !TokenValide()) {
    invalidateGLPIToken();
    window.location.href = "/login"; // Redirection immédiate au niveau global
    throw new Error("Session expirée, redirection...");
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept:        "application/json",
    ...(options.headers as Record<string, string> ?? {}),
  };

  if (method !== "GET") headers["Content-Type"] = "application/json";

  const response = await fetch(`${API_BASE_URL}/v2.3/${path}`, {
    ...options,
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      console.warn("[GLPI v2] Token rejeté par le serveur ou expiré. Déconnexion...");
      invalidateGLPIToken();
      window.location.href = "/login"; 
    }
    console.error("GLPI ERROR:", text);
    throw new Error(`[GLPI ${method}] ${path} → HTTP ${response.status}\n${text}`);
  }

  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

export const glpiGet    = <T>(path: string)                => glpiFetch<T>("GET",    path);
export const glpiPost   = <T>(path: string, body: unknown) => glpiFetch<T>("POST",   path, body);
export const glpiPut    = <T>(path: string, body: unknown) => glpiFetch<T>("PUT",    path, body);
export const glpiPatch  = <T>(path: string, body: unknown) => glpiFetch<T>("PATCH",  path, body);
export const glpiDelete = <T>(path: string)                => glpiFetch<T>("DELETE", path);

export async function glpiFetchV1<T>(
  method:  "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  path:    string,
  body?:   unknown,
  retry =  true,
): Promise<T> {
  const session = await initV1Session();

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
    if ((res.status === 401 || res.status === 403) && retry) {
      console.warn(`[GLPI v1] Session rejetée (${res.status}) — renouvellement forcé…`);
      invalidateV1Session();
      await initV1Session(true);
      return glpiFetchV1<T>(method, path, body, false); 
    }
    console.error(`[GLPI v1] ERROR ${method} ${path}:`, text);
    throw new Error(`[GLPI v1 ${method}] ${path} → HTTP ${res.status}\n${text}`);
  }

  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

export const glpiGetV1    = <T>(path: string)                => glpiFetchV1<T>("GET",    path);
export const glpiPostV1   = <T>(path: string, body: unknown) => glpiFetchV1<T>("POST",   path, body);
export const glpiPutV1    = <T>(path: string, body: unknown) => glpiFetchV1<T>("PUT",    path, body);
export const glpiPatchV1  = <T>(path: string, body: unknown) => glpiFetchV1<T>("PATCH",  path, body);
export const glpiDeleteV1 = <T>(path: string)                => glpiFetchV1<T>("DELETE", path);