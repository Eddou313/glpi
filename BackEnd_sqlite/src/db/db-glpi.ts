import axios from 'axios';
// Récupération de l'URL depuis le fichier .env (avec valeur par défaut demandée)
const GLPI_API_BASE = process.env.GLPI_API_URL || 'http://glpi.localhost/apirest.php';
const GLPI_APP_TOKEN = process.env.GLPI_APP_TOKEN || ''; // Optionnel, selon votre config GLPI

export async function callGLPI(
  sessionToken: string, 
  endpoint: string, 
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', 
  data: any = null
) {
  try {
    const headers: Record<string, string> = {
      'Session-Token': sessionToken
    };
    if (GLPI_APP_TOKEN) headers['App-Token'] = GLPI_APP_TOKEN;

    const config = {
      method,
      url: `${GLPI_API_BASE}/${endpoint}`,
      headers,
      data
    };

    const response = await axios(config);
    return response.data;
  } catch (error: any) {
    console.error(`Erreur appel GLPI (${endpoint}):`, error.response?.data || error.message);
    throw error;
  }
}