import { useDeleteAllData } from '../../hooks/initialisation/useInit';
import './init.css';
function StepIcon({ status }: { status: string }) {
  if (status === 'done')    return <span className="del-step__icon del-step__icon--done">✓</span>;
  if (status === 'error')   return <span className="del-step__icon del-step__icon--error">✗</span>;
  if (status === 'running') return <span className="del-step__icon del-step__icon--running" />;
  return <span className="del-step__icon del-step__icon--pending" />;
}

export function DeleteDataButton() {
  const { state, run, reset } = useDeleteAllData();
  const { running, done, error, steps } = state;

  return (
    <div className="del-widget">

      <div className="del-widget__header">
        <h3 className="del-widget__title">Suppression des données</h3>
        <p className="del-widget__subtitle">
          Supprime définitivement tous les tickets, coûts et éléments de l'inventaire GLPI.
        </p>
      </div>

      {/* Bouton — visible uniquement avant le lancement */}
      {!running && !done && !error && (
        <button className="del-btn del-btn--danger" onClick={run}>
          Supprimer toutes les données
        </button>
      )}

      {/* Progression étape par étape */}
      {steps.length > 0 && (
        <div className="del-steps">
          {steps.map((step, i) => (
            <div key={i} className={`del-step del-step--${step.status}`}>
              <StepIcon status={step.status} />
              <div className="del-step__body">
                <span className="del-step__label">{step.label}</span>
                {step.detail && (
                  <span className="del-step__detail">{step.detail}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Succès */}
      {done && (
        <div className="del-result del-result--success">
          <p>Toutes les données ont été supprimées.</p>
          <button className="del-btn del-btn--secondary" onClick={reset}>
            Recommencer
          </button>
        </div>
      )}

      {/* Erreur */}
      {error && (
        <div className="del-result del-result--error">
          <p>{error}</p>
          <button className="del-btn del-btn--secondary" onClick={reset}>
            Réessayer
          </button>
        </div>
      )}

    </div>
  );
}