import { glpiFetch, glpiPost } from "../../api/db_glpi";

type CreateStateInput = {
  name: string;
  comment?: string;
  is_recursive?: boolean;
  is_visible_helpdesk?: boolean;
  parent_id?: number;
};

const stateCache = new Map<string, number>();

export async function createState(input: CreateStateInput): Promise<number> {
  const key = input.name?.trim();
  if (!key) return 0;

  // ✔ cache hit
  if (stateCache.has(key)) {
    return stateCache.get(key)!;
  }

  const payload = {
    name: key,
    comment: input.comment ?? "",
    entity: {},

    is_recursive: input.is_recursive ?? true,
    is_visible_helpdesk: input.is_visible_helpdesk ?? true,

    parent: {
      id: input.parent_id ?? 0,
    },

    visibilities: {
      computer: true,
      monitor: true,
      networkequipment: true,
      peripheral: true,
      phone: true,
      printer: true,
      softwarelicense: true,
      certificate: true,
      enclosure: true,
      pdu: true,
      line: true,
      rack: true,
      softwareversion: true,
      cluster: true,
      contract: true,
      appliance: true,
      databaseinstance: true,
      cable: true,
      unmanaged: true,
      passivedcequipment: true,
    },
  };

  try {
    const res = await glpiFetch<{ id: number }>("POST","Dropdowns/State", payload);

    stateCache.set(key, res.id);
    return res.id;
  } catch (err) {
    console.warn(`State "${key}" error:`, err);

    stateCache.set(key, 0);

    return 0;
  }
}

async function getAllStates(): Promise<{ id: number; name: string }[]> {
  const token = localStorage.getItem("glpi_token");

  if (!token) throw new Error("Missing GLPI token");

  const res = await fetch(
    `${import.meta.env.VITE_GLPI_API_URL}/v2.3/Dropdowns/State`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    }
  );

  if (!res.ok) {
    throw new Error(await res.text());
  }

  const data = await res.json();

  return Array.isArray(data) ? data : data.data ?? [];
}

/**
 * DELETE STATE
 */
export async function deleteState(id: number): Promise<boolean> {
  try {
    const token = localStorage.getItem("glpi_token");

    if (!token) throw new Error("Missing GLPI token");

    const res = await fetch(
      `${import.meta.env.VITE_GLPI_API_URL}/v2.3/Dropdowns/State/${id}?force=true`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      }
    );

    if (!res.ok) {
      throw new Error(await res.text());
    }

    // ✔ clean cache
    for (const [k, v] of stateCache.entries()) {
      if (v === id) stateCache.delete(k);
    }

    return true;
  } catch (err) {
    console.warn("Delete State error:", err);
    return false;
  }
}

export async function deleteAllStates(): Promise<{
  deleted: number;
  failed: number;
}> {
  try {
    const states = await getAllStates();

    let deleted = 0;
    let failed = 0;

    for (const state of states) {
      const ok = await deleteState(state.id);

      if (ok) {
        deleted++;
      } else {
        failed++;
      }
    }

    // ✔ clear cache completely (IMPORTANT)
    stateCache.clear();

    return { deleted, failed };
  } catch (err) {
    console.warn("Delete all states error:", err);

    return { deleted: 0, failed: 0 };
  }
}

export function getStateCache() {
  return stateCache;
}