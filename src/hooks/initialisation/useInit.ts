import { useState, useCallback } from 'react';
import { glpiGet, glpiFetch } from '../../api/db_glpi';
import { deleteAllLocations } from './deleteLocation';
import { deleteAllDropdowns } from './deleteAll';
import { MODEL_ENDPOINT_MAP } from '../import/fichier1_test/glpi';
import { importCache } from '../import/fichier1_test/importCaches';

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

async function deleteAllOf(path: string): Promise<number> {
  const items = await glpiGet<{ id: number }[]>(
    `${path}?range=0-9999&fields=id`
  ).catch(() => []);

  if (!items.length) return 0;

  let deleted = 0;

  for (const item of items) {
    try {
      await glpiFetch(
        'DELETE',
        `${path}/${item.id}`,
        { input: { id: item.id } }
      );
      deleted++;
    } catch {
      // ignorer les erreurs individuelles
    }
  }

  return deleted;
}

async function deleteAllUsersExceptSystem(): Promise<number> {
  const users = await glpiGet<any[]>(
    'Administration/User?range=0-9999&fields=id,name,login'
  ).catch(() => []);

  const SAFE_USERS = new Set([
    'glpi',
    'post-only',
    'tech',
    'normal',
  ]);

  const toDelete = users.filter(u => {
    const login = String(
      u.login ?? u.name ?? ''
    ).toLowerCase();

    if (SAFE_USERS.has(login)) return false;

    // utilisateurs protégés GLPI
    if ([1, 2, 3, 6].includes(Number(u.id))) {
      return false;
    }

    return true;
  });

  let deleted = 0;

  for (const user of toDelete) {
    try {
      await glpiFetch(
        'DELETE',
        `Administration/User/${user.id}`,
        { input: { id: user.id } }
      );

      deleted++;
    } catch (err: any) {
      const msg = String(err?.message ?? '');

      if (
        msg.includes('ERROR_RIGHT_MISSING') ||
        msg.includes('403')
      ) {
        continue;
      }

      console.error(
        'Erreur suppression user',
        user.id,
        err
      );
    }
  }

  return deleted;
}

export function useDeleteAllData() {
  const [state, setState] = useState<DeleteState>({
    running: false,
    done: false,
    error: null,
    steps: [],
  });
  importCache.clear();
  const run = useCallback(async () => {
    const steps: Step[] = [
      ...RESOURCES.map(r => ({
        label: r.label,
        status: 'pending' as StepStatus,
      })),
      {
        label: 'Utilisateurs',
        status: 'pending',
      },
      {
        label: 'Locations',
        status: 'pending',
      },
      {
        label: 'Fabricants',
        status: 'pending',
      },
      {
        label: 'Modèles',
        status: 'pending',
      },
    ];

    const refresh = () =>
      setState(s => ({
        ...s,
        steps: [...steps],
      }));

    setState({
      running: true,
      done: false,
      error: null,
      steps: [...steps],
    });

    try {
      /* =========================
         Tickets + Assets
      ========================= */

      for (let i = 0; i < RESOURCES.length; i++) {
        steps[i].status = 'running';
        refresh();

        const count = await deleteAllOf(
          RESOURCES[i].path
        );

        steps[i].status = 'done';
        steps[i].detail = `${count} supprimé(s)`;

        refresh();
      }

      /* =========================
         Utilisateurs
      ========================= */

      const userStepIndex = RESOURCES.length;

      steps[userStepIndex].status = 'running';
      refresh();

      const deletedUsers =
        await deleteAllUsersExceptSystem();

      steps[userStepIndex].status = 'done';
      steps[userStepIndex].detail =
        `${deletedUsers} utilisateur(s) supprimé(s)`;

      refresh();

      /* =========================
         Locations
      ========================= */

      const locationStepIndex =
        RESOURCES.length + 1;

      steps[locationStepIndex].status = 'running';
      refresh();

      const deletedLocations =
        await deleteAllLocations();

      steps[locationStepIndex].status = 'done';
      steps[locationStepIndex].detail =
        `${deletedLocations} location(s) supprimée(s)`;

      refresh();

      /* =========================
         Fabricants
      ========================= */

      const manufacturerStepIndex =
        RESOURCES.length + 2;

      steps[manufacturerStepIndex].status =
        'running';
      refresh();

      const deletedManufacturers =
        await deleteAllDropdowns(
          'Dropdowns/Manufacturer'
        );

      steps[manufacturerStepIndex].status =
        'done';

      steps[manufacturerStepIndex].detail =
        `${deletedManufacturers} fabricant(s) supprimé(s)`;

      refresh();

      /* =========================
         Modèles
      ========================= */

      const modelStepIndex =
        RESOURCES.length + 3;

      steps[modelStepIndex].status = 'running';
      refresh();

      const modelEndpoints = [
        ...new Set(
          Object.values(MODEL_ENDPOINT_MAP)
            .filter(Boolean)
        ),
      ];

      let deletedModels = 0;

      for (const endpoint of modelEndpoints) {
        try {
          deletedModels +=
            await deleteAllDropdowns(endpoint);
        } catch (err) {
          console.error(
            'Erreur suppression modèle',
            endpoint,
            err
          );
        }
      }

      steps[modelStepIndex].status = 'done';
      steps[modelStepIndex].detail =
        `${deletedModels} modèle(s) supprimé(s)`;

      refresh();

      /* =========================
         FIN
      ========================= */

      setState({
        running: false,
        done: true,
        error: null,
        steps: [...steps],
      });

    } catch (err: any) {

      setState({
        running: false,
        done: false,
        error:
          err?.message ??
          'Erreur inconnue',
        steps: [...steps],
      });

    }
  }, []);

  const reset = useCallback(() => {
    setState({
      running: false,
      done: false,
      error: null,
      steps: [],
    });
  }, []);

  return {
    state,
    run,
    reset,
  };
}