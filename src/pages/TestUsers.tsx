import React, { useEffect, useState } from 'react';
import { glpiGet, invalidateGLPIToken } from '../api/db_glpi';

interface GLPIUser {
  id: number;
  username: string;
  realname: string | null;
  firstname: string | null;
  phone: string | null;
  mobile: string | null;
  is_active: boolean;
  is_deleted: boolean;
  last_login: string | null;
  default_entity: { id: number; name: string } | null;
}

export const UserList: React.FC = () => {
  const [users, setUsers]     = useState<GLPIUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await glpiGet<GLPIUser[]>('Administration/User');
        setUsers(data);
        setError(null);
      } catch (err: any) {
        // Si token expiré côté serveur → on le purge pour le prochain appel
        if (err.message?.includes('401')) invalidateGLPIToken();
        console.error('Erreur GLPI API :', err);
        setError(err.message ?? 'Impossible de charger les utilisateurs.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) return <p style={{ padding: '20px' }}>Chargement des utilisateurs GLPI…</p>;
  if (error)   return <p style={{ padding: '20px', color: 'red' }}>Erreur : {error}</p>;

  return (
    <div style={{ padding: '20px', fontFamily: 'Segoe UI, sans-serif' }}>
      <h2 style={{ color: '#333' }}>Liste des Utilisateurs GLPI (API v2.3)</h2>

      {users.length === 0 ? (
        <p>Aucun utilisateur trouvé.</p>
      ) : (
        <table
          border={1}
          cellPadding={12}
          style={{ borderCollapse: 'collapse', width: '100%', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}
        >
          <thead>
            <tr style={{ backgroundColor: '#2c3e50', color: '#fff', textAlign: 'left' }}>
              <th>ID</th>
              <th>Nom d'utilisateur</th>
              <th>Nom Réel</th>
              <th>Prénom</th>
              <th>Entité par défaut</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} style={{ backgroundColor: user.is_deleted ? '#ffebee' : 'transparent' }}>
                <td>{user.id}</td>
                <td><strong>{user.username}</strong></td>
                <td>{user.realname ?? '–'}</td>
                <td>{user.firstname ?? '–'}</td>
                <td>{user.default_entity?.name ?? '–'}</td>
                <td>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    color: '#fff',
                    backgroundColor: user.is_active ? '#2ecc71' : '#e74c3c',
                  }}>
                    {user.is_active ? 'Actif' : 'Inactif'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default UserList;