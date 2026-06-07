const API_BASE_URL = import.meta.env.VITE_GLPI_API_URL || '/glpi-api';
const CLIENT_ID = import.meta.env.VITE_GLPI_CLIENT_ID;
const CLIENT_SECRET = import.meta.env.VITE_GLPI_CLIENT_SECRET;
const GLPI_USER = import.meta.env.VITE_GLPI_USER;

export async function getGLPIToken(): Promise<string | null> {
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
                username: 'glpi',
                password: 'glpi',
                scope: 'api',
            }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            return null;
        }
        return data.access_token || null;
    } catch (error: any) {
        return null;
    }
}

export async function glpiFetchClient<T>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    path: string,
    body?: unknown,
    options: RequestInit = {},
): Promise<T> {
    const token = await getGLPIToken();

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
