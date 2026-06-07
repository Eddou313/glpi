import { useState } from 'react';
import { useAuth } from '../../hooks/auth/useAuth';
import { useNavigate } from 'react-router-dom';

export function LoginPage() {
  const [password, setPassword] = useState('glpi');
  const [mes, setMes] = useState<string | null>(null);

  const navigate = useNavigate();

  const { login, loading, error } = useAuth();

  async function traitement() {
    setMes(null);

    try {
      const response = await login(password);

      if (response.error) {
        setMes(response.error);
        return;
      }

      if (response.success) {
        setMes(response.success);
        navigate("/import");
      }
    } catch (err: any) {
      setMes(err.message || 'Erreur inconnue');
      console.error(
        `Erreur lors du traitement de login : ${err.message}`
      );
    }
  }

  return (
    <div
      style={{
        maxWidth: 360,
        margin: '80px auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <h2 style={{ textAlign: 'center' }}>Connexion</h2>

      {error && (
        <p style={{ color: 'red', textAlign: 'center', margin: 0 }}>
          {error}
        </p>
      )}

      {mes && (
        <p
          style={{
            color: mes === 'connexion reussie' ? 'green' : 'red',
            textAlign: 'center',
            margin: 0,
          }}
        >
          {mes}
        </p>
      )}

      <input
        placeholder="Mot de passe"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{
          padding: '8px 12px',
          borderRadius: 6,
          border: '1px solid #ccc',
        }}
      />

      <button
        onClick={traitement}
        disabled={loading}
        style={{
          padding: '10px',
          borderRadius: 6,
          background: '#0057a8',
          color: '#fff',
          border: 'none',
          cursor: loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? 'Connexion...' : 'Se connecter'}
      </button>
    </div>
  );
}