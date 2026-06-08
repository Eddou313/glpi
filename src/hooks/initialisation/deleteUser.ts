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

const PROTECTED_USERS = new Set([
  'glpi',
  'post-only',
  'tech',
  'normal',
]);

async function getAllUsers(): Promise<any[]> {
  return glpiGet<any[]>(
    `/Administration/User?range=0-9999&fields=id,name,login`
  ).catch(() => []);
}

async function deleteUser(id: number) {
  return glpiFetch('DELETE', `/Administration/User/${id}`, {
    input: { id }
  });
}

export function useDeleteUsersExceptDefault() {
  const [state, setState] = useState<DeleteState>({
    running: false,
    done: false,
    error: null,
    steps: [],
  });

  const run = useCallback(async () => {
    setState({ running: true, done: false, error: null, steps: [] });

    const users = await getAllUsers();

    const toDelete = users.filter(
      u => !PROTECTED_USERS.has(u.login || u.name)
    );

    const steps: Step[] = toDelete.map(u => ({
      label: u.login || u.name,
      status: 'pending',
    }));

    setState(s => ({ ...s, steps: [...steps] }));

    for (let i = 0; i < toDelete.length; i++) {
      const user = toDelete[i];

      steps[i] = { ...steps[i], status: 'running' };
      setState(s => ({ ...s, steps: [...steps] }));

      try {
        await deleteUser(user.id);

        steps[i] = {
          ...steps[i],
          status: 'done',
          detail: `ID ${user.id} supprimé`,
        };
      } catch (err: any) {
        steps[i] = {
          ...steps[i],
          status: 'error',
          detail: err.message || 'Erreur suppression',
        };
      }

      setState(s => ({ ...s, steps: [...steps] }));
    }

    setState(s => ({
      ...s,
      running: false,
      done: true,
    }));
  }, []);

  const reset = useCallback(() => {
    setState({ running: false, done: false, error: null, steps: [] });
  }, []);

  return { state, run, reset };
}