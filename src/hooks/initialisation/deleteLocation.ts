import { glpiFetch, glpiGet } from "../../api/db_glpi";

export async function deleteAllLocations(): Promise<number> {
  const locations = await glpiGet<any[]>(
    `Dropdowns/Location?range=0-9999&fields=id,name`
  ).catch(() => []);

  let deleted = 0;

  for (const loc of locations) {
    try {
      await glpiFetch(
        'DELETE',
        `Dropdowns/Location/${loc.id}`,
        { input: { id: loc.id } }
      );

      deleted++;
    } catch (err: any) {
      // 🔥 GLPI bloque si utilisé → on ignore
      const msg = err?.message || '';
      if (msg.includes('ERROR_RIGHT_MISSING') || msg.includes('403')) {
        continue;
      }
    }
  }

  return deleted;
}