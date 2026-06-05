import { useState }    from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/https';
import { getGLPIToken, type reponse } from '../../api/db_glpi';

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const navigate = useNavigate();

  async function login(password: string): Promise<reponse> {
    setLoading(true);
    setError(null);

    try {
      return await getGLPIToken(password);
    } catch (e: any) {
      const message = e.response?.data?.error??e.message ??'Erreur de connexion';
      setError(message);
      return {
        error: message,
      };
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