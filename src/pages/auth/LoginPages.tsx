import { useState }  from 'react';
import { useAuth }   from '../../hooks/auth/useAuth';

export function LoginPage() {
  const [login,    setLogin]    = useState('');
  const [password, setPassword] = useState('');
  const { login: doLogin, loading, error } = useAuth();

  return (
    <div style={{ maxWidth: 360, margin: '80px auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <h2 style={{ textAlign: 'center' }}>Connexion GLPI</h2>

      {error && (
        <p style={{ color: 'red', textAlign: 'center', margin: 0 }}>{error}</p>
      )}

      <input
        placeholder="Identifiant"
        value={login}
        onChange={e => setLogin(e.target.value)}
        style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc' }}
      />
      <input
        placeholder="Mot de passe"
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && doLogin(login, password)}
        style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc' }}
      />
      <button
        onClick={() => doLogin(login, password)}
        disabled={loading || !login || !password}
        style={{ padding: '10px', borderRadius: 6, background: '#0057a8', color: '#fff', border: 'none', cursor: 'pointer' }}
      >
        {loading ? 'Connexion...' : 'Se connecter'}
      </button>
    </div>
  );
}