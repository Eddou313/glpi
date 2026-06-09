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
      await deleteAllStates();

      // ... reste du code inchangé

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
        error: err?.message ?? 'Erreur inconnue',
        steps: [...steps],
      });
    }
  }, []);

  const reset = useCallback(() => {
    importCache.clear();
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