import { useState, useCallback } from 'react';
import { glpiGet, glpiFetch } from '../../api/db_glpi';

type StepStatus = 'pending' | 'running' | 'done' | 'error';

type Step = {
  label: string;
  status: StepStatus;
  detail?: string;
};

export type DeleteState = {
  running: boolean;
  done: boolean;
  error: string | null;
  steps: Step[];
};

/* =========================
   RESOURCES (ASSETS + TICKETS)
========================= */

const RESOURCES = [
  { path: 'Assistance/Ticket', label: 'Tickets' },
  { path: 'Assets/Computer', label: 'Ordinateurs' },
  { path: 'Assets/Monitor', label: 'Moniteurs' },
  { path: 'Assets/Printer', label: 'Imprimantes' },
  { path: 'Assets/NetworkEquipment', label: 'Équipements réseau' },
  { path: 'Assets/Peripheral', label: 'Périphériques' },
  { path: 'Assets/Phone', label: 'Téléphones' },
  { path: 'Assets/Software', label: 'Logiciels' },
];

/* =========================
   USERS PROTECTED
========================= */

const PROTECTED_USERS = new Set([
  'glpi',
  'post-only',
  'tech',
  'normal',
]);

/* =========================
   GENERIC DELETE
========================= */

async function deleteAllOf(path: string): Promise<number> {
  const items = await glpiGet<{ id: number }[]>(
    `${path}?range=0-9999&fields=id`
  ).catch(() => [] as { id: number }[]);

  if (!items.length) return 0;

  await Promise.all(
    items.map(item =>
      glpiFetch('DELETE', `${path}/${item.id}`, {
        input: { id: item.id },
      }).catch(() => null)
    )
  );

  return items.length;
}

/* =========================
   USERS DELETE (SAFE)
========================= */

async function deleteAllUsersExceptSystem(): Promise<number> {
  const users = await glpiGet<any[]>(
    `Administration/User?range=0-9999&fields=id,name,login`
  ).catch(() => []);
  const SAFE_USERS = new Set([
    'glpi',
    'post-only',
    'tech',
    'normal',
  ]);

  const toDelete = users.filter(u => {
    const login = (u.login || u.name || '').toLowerCase();
    if (SAFE_USERS.has(login)) return false;
    if ([1, 2, 3, 6].includes(u.id)) return false;

    return true;
  });

  let deletedCount = 0;

  for (const u of toDelete) {
    try {
      await glpiFetch(
        'DELETE',
        `Administration/User/${u.id}`,
        { input: { id: u.id } }
      );

      deletedCount++;
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('ERROR_RIGHT_MISSING') || msg.includes('403')) {
        continue;
      }
    }
  }

  return deletedCount;
}

/* =========================
   HOOK
========================= */

export function useDeleteAllData() {
  const [state, setState] = useState<DeleteState>({
    running: false,
    done: false,
    error: null,
    steps: [],
  });

  const run = useCallback(async () => {
    const steps: Step[] = [
      ...RESOURCES.map(r => ({
        label: r.label,
        status: 'pending' as StepStatus,
      })),
      {
        label: 'Utilisateurs (hors système)',
        status: 'pending' as StepStatus,
      },
    ];

    setState({ running: true, done: false, error: null, steps: [...steps] });

    /* =========================
       1. ASSETS + TICKETS
    ========================= */

    for (let i = 0; i < RESOURCES.length; i++) {
      steps[i] = { ...steps[i], status: 'running' };
      setState(s => ({ ...s, steps: [...steps] }));

      try {
        const count = await deleteAllOf(RESOURCES[i].path);

        steps[i] = {
          ...steps[i],
          status: 'done',
          detail: `${count} supprimé(s)`,
        };
      } catch (err: any) {
        steps[i] = {
          ...steps[i],
          status: 'error',
          detail: err.message,
        };

        setState(s => ({
          ...s,
          running: false,
          error: `Erreur sur "${RESOURCES[i].label}" : ${err.message}`,
          steps: [...steps],
        }));

        return;
      }

      setState(s => ({ ...s, steps: [...steps] }));
    }

    /* =========================
       2. USERS
    ========================= */

    const userStepIndex = RESOURCES.length;
    steps[userStepIndex] = {
      ...steps[userStepIndex],
      status: 'running',
    };
    setState(s => ({ ...s, steps: [...steps] }));

    try {
      const deleted = await deleteAllUsersExceptSystem();

      steps[userStepIndex] = {
        ...steps[userStepIndex],
        status: 'done',
        detail: `${deleted} utilisateur(s) supprimé(s)`,
      };
    } catch (err: any) {
      steps[userStepIndex] = {
        ...steps[userStepIndex],
        status: 'error',
        detail: err.message,
      };

      setState(s => ({
        ...s,
        running: false,
        error: `Erreur suppression users : ${err.message}`,
        steps: [...steps],
      }));

      return;
    }

    setState(s => ({ ...s, running: false, done: true }));
  }, []);

  const reset = useCallback(() => {
    setState({ running: false, done: false, error: null, steps: [] });
  }, []);

  return { state, run, reset };
}