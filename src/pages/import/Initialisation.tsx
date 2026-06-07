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
  const totalSteps = steps.length;
  const completedSteps = steps.filter(step => step.status === 'done').length;

  const progressPercentage = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  const currentStep = steps.find(step => step.status === 'running') 
    || steps.find(step => step.status === 'error')
    || steps.filter(step => step.status === 'done').pop(); 

  return (
    <div className="del-widget">

      <div className="del-widget__header">
        <h3 className="del-widget__title">Suppression des données</h3>
      </div>

      {!running && !done && !error && (
        <button className="del-btn del-btn--danger" onClick={run}>
          Supprimer toutes les données
        </button>
      )}

      {running && currentStep && (
        <div className="del-progress-container">
          <div className="del-progress-bar-wrapper">
            <div className="del-progress-bar" style={{ width: `${progressPercentage}%` }}></div>
          </div>
          <span className="del-progress-text">{progressPercentage}% ({completedSteps}/{totalSteps})</span>

          <div className={`del-step del-step--${currentStep.status}`}>
            <StepIcon status={currentStep.status} />
            <div className="del-step__body">
              <span className="del-step__label">{currentStep.label}</span>
              {currentStep.detail && (
                <span className="del-step__detail">{currentStep.detail}</span>
              )}
            </div>
          </div>
        </div>
      )}

      {done && (
        <div className="del-result del-result--success">
          <p>Toutes les données ont été supprimées.</p>
          <button className="del-btn del-btn--secondary" onClick={reset}>
            Recommencer
          </button>
        </div>
      )}

      {error && (
        <div className="del-result del-result--error">
          <p>{error}</p>
          {currentStep && (
            <p className="del-step__detail">Bloqué à l'étape : {currentStep.label}</p>
          )}
          <button className="del-btn del-btn--secondary" onClick={reset}>
            Réessayer
          </button>
        </div>
      )}

    </div>
  );
}