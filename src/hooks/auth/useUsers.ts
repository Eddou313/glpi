import { useState, useEffect } from 'react';
import { api }                 from '../../api/https';

export interface GlpiUser {
  id:         number;
  name:       string;
  firstname:  string;
  realname:   string;
  email:      string;
  is_active:  number;
}

export function useUsers() {
  const [users,   setUsers]   = useState<GlpiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    api.get<GlpiUser[]>('/users')
      .then(res => setUsers(res.data))
      .catch(e  => setError(e.response?.data?.error ?? 'Erreur'))
      .finally(() => setLoading(false));
  }, []);

  return { users, loading, error };
}