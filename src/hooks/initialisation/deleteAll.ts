import { glpiFetch, glpiGet } from "../../api/db_glpi";

export async function deleteAllDropdowns(
  path: string,
  protectedNames: string[] = []
): Promise<number> {

  const items = await glpiGet<any[]>(
    `${path}?range=0-9999&fields=id,name`
  ).catch(() => []);

  let deleted = 0;

  for (const item of items) {

    if (
      protectedNames.includes(
        (item.name ?? '').trim()
      )
    ) {
      continue;
    }

    try {
      await glpiFetch(
        'DELETE',
        `${path}/${item.id}`,
        { input: { id: item.id } }
      );

      deleted++;
    } catch {
      // ignore
    }
  }

  return deleted;
}