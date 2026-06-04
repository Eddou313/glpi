import { useState }    from 'react';
import { useNavigate } from 'react-router-dom';
import { api }         from '../../api/https';

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const navigate = useNavigate();

  async function login(login: string, password: string) {
    setLoading(true);
    setError(null);
    try {
      await api.post('/auth/login', { login, password });
      navigate('/tickets');
    } catch (e: any) {
      setError(e.response?.data?.error ?? 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    await api.post('/auth/logout');
    navigate('/login');
  }

  return { login, logout, loading, error };
}
export default useAuth;