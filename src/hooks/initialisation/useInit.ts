import { useState, useCallback } from 'react';
import { glpiGet, glpiFetch } from '../../api/db_glpi';

type StepStatus = 'pending' | 'running' | 'done' | 'error';

type Step = {
  label:   string;
  status:  StepStatus;
  detail?: string;
};

export type DeleteState = {
  running: boolean;
  done:    boolean;
  error:   string | null;
  steps:   Step[];
};

const RESOURCES = [
  { path: 'Assistance/Ticket',       label: 'Tickets'            },
  { path: 'Assets/Computer',         label: 'Ordinateurs'        },
  { path: 'Assets/Monitor',          label: 'Moniteurs'          },
  { path: 'Assets/Printer',          label: 'Imprimantes'        },
  { path: 'Assets/NetworkEquipment', label: 'Équipements réseau' },
  { path: 'Assets/Peripheral',       label: 'Périphériques'      },
  { path: 'Assets/Phone',            label: 'Téléphones'         },
  { path: 'Assets/Software',         label: 'Logiciels'          },
];

async function deleteAllOf(path: string): Promise<number> {
  const items = await glpiGet<{ id: number }[]>(
    `${path}?range=0-9999&fields=id`
  ).catch(() => [] as { id: number }[]);

  if (!items.length) return 0;

  await Promise.all(
    items.map(item =>
      glpiFetch('DELETE', `${path}/${item.id}`, { input: { id: item.id } })
        .catch(() => null)
    )
  );

  return items.length;
}

export function useDeleteAllData() {
  const [state, setState] = useState<DeleteState>({
    running: false,
    done:    false,
    error:   null,
    steps:   [],
  });

  const run = useCallback(async () => {
    const steps: Step[] = RESOURCES.map(r => ({
      label:  r.label,
      status: 'pending',
    }));

    setState({ running: true, done: false, error: null, steps: [...steps] });

    for (let i = 0; i < RESOURCES.length; i++) {
      steps[i] = { ...steps[i], status: 'running' };
      setState(s => ({ ...s, steps: [...steps] }));

      try {
        const count = await deleteAllOf(RESOURCES[i].path);
        steps[i] = { ...steps[i], status: 'done', detail: `${count} supprimé(s)` };
      } catch (err: any) {
        steps[i] = { ...steps[i], status: 'error', detail: err.message };
        setState(s => ({
          ...s,
          running: false,
          error:   `Échec sur "${RESOURCES[i].label}" : ${err.message}`,
          steps:   [...steps],
        }));
        return;
      }

      setState(s => ({ ...s, steps: [...steps] }));
    }

    setState(s => ({ ...s, running: false, done: true }));
  }, []);

  const reset = useCallback(() => {
    setState({ running: false, done: false, error: null, steps: [] });
  }, []);

  return { state, run, reset };
}