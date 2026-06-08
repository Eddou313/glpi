import { useState, useCallback } from 'react';
import { glpiFetch } from '../../api/db_glpi';

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

type DocumentItem = {
  id: number;
  name?: string;
  filename?: string;
};

async function getAllDocuments(): Promise<DocumentItem[]> {
  const res = await fetch(
    `${import.meta.env.VITE_GLPI_API_URL}/v2.3/Document`
  );

  if (!res.ok) {
    throw new Error(`Erreur API GLPI: ${res.status}`);
  }

  const data = await res.json();
  return Array.isArray(data) ? data : data.data ?? [];
}

/** récupère les liens Document_Item */
async function getDocumentItems(documentId: number) {
  const res = await fetch(
    `${import.meta.env.VITE_GLPI_API_URL}/v2.3/Document/${documentId}/Document_Item`
  );

  if (!res.ok) return [];

  const data = await res.json();
  return Array.isArray(data) ? data : data.data ?? [];
}

async function deleteDocumentItem(id: number) {
  return glpiFetch(
    'DELETE',
    `/v2.3/Document_Item/${id}?force_purge=true`
  );
}

async function deleteDocument(id: number) {
  return glpiFetch(
    'DELETE',
    `/v2.3/Document/${id}?force_purge=true`
  );
}

export function useDeleteDocuments() {
  const [state, setState] = useState<DeleteState>({
    running: false,
    done: false,
    error: null,
    steps: [],
  });

  const run = useCallback(async () => {
    setState({ running: true, done: false, error: null, steps: [] });

    try {
      const documents = await getAllDocuments();

      const steps: Step[] = documents.map((d) => ({
        label: d.name ?? d.filename ?? `Document ${d.id}`,
        status: 'pending',
      }));

      setState((s) => ({ ...s, steps: [...steps] }));

      for (let i = 0; i < documents.length; i++) {
        const doc = documents[i];

        steps[i] = { ...steps[i], status: 'running' };
        setState((s) => ({ ...s, steps: [...steps] }));

        try {
          // 1. supprimer les Document_Item liés
          const items = await getDocumentItems(doc.id);

          for (const item of items) {
            await deleteDocumentItem(item.id);
          }

          // 2. supprimer le Document
          await deleteDocument(doc.id);

          steps[i] = {
            ...steps[i],
            status: 'done',
            detail: `Document ${doc.id} + items supprimés`,
          };
        } catch (err: any) {
          steps[i] = {
            ...steps[i],
            status: 'error',
            detail: err?.message ?? 'Erreur suppression',
          };
        }

        setState((s) => ({ ...s, steps: [...steps] }));
      }

      setState((s) => ({
        ...s,
        running: false,
        done: true,
      }));
    } catch (err: any) {
      setState((s) => ({
        ...s,
        running: false,
        done: false,
        error: err?.message ?? 'Erreur globale',
      }));
    }
  }, []);

  const reset = useCallback(() => {
    setState({ running: false, done: false, error: null, steps: [] });
  }, []);

  return { state, run, reset };
}