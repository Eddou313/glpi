import React, { useEffect, useState } from 'react';
import axios from 'axios';

// Interface calquée exactement sur la structure de vos données API GLPI v2.3
interface GLPIUser {
  id: number;
  username: string; // Mis à jour (au lieu de name)
  realname: string | null;
  firstname: string | null;
  phone: string | null;
  mobile: string | null;
  is_active: boolean;
  is_deleted: boolean;
  last_login: string | null;
  default_entity: {
    id: number;
    name: string;
  } | null;
}

// Configuration depuis le .env (Vite)
const API_BASE_URL = import.meta.env.VITE_GLPI_API_URL || 'http://glpi.localhost/api.php';
const CLIENT_ID = import.meta.env.VITE_GLPI_CLIENT_ID;
const CLIENT_SECRET = import.meta.env.VITE_GLPI_CLIENT_SECRET;
const GLPI_USER = import.meta.env.VITE_GLPI_USER;
const GLPI_PASSWORD = import.meta.env.VITE_GLPI_PASSWORD;

export const UserList: React.FC = () => {
  const [users, setUsers] = useState<GLPIUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGLPIUsers = async () => {
      try {
        setLoading(true);

        // 1. Demande du Token OAuth2 (Flux Password)
        const tokenResponse = await axios.post(`${API_BASE_URL}/token`, {
          grant_type: 'password',
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          username: GLPI_USER,
          password: GLPI_PASSWORD,
          scope: 'api'
        }, {
          headers: { 'Content-Type': 'application/json' }
        });

        const accessToken = tokenResponse.data.access_token;

        // 2. Appel de la liste des utilisateurs sur l'API v2.3
        const usersResponse = await axios.get(`${API_BASE_URL}/v2.3/Administration/User`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });

        // Enregistrement des données reçues
        setUsers(usersResponse.data);
        setError(null);
      } catch (err: any) {
        console.error("Erreur GLPI API :", err);
        setError(err.response?.data?.message || "Impossible de charger les utilisateurs.");
      } finally {
        setLoading(false);
      }
    };

    if (CLIENT_ID && GLPI_USER) {
      fetchGLPIUsers();
    } else {
      setError("Les variables d'environnement dans le fichier .env sont incomplètes.");
      setLoading(false);
    }
  }, []);

  if (loading) return <p style={{ padding: '20px' }}>Chargement des utilisateurs GLPI...</p>;
  if (error) return <p style={{ padding: '20px', color: 'red' }}>Erreur : {error}</p>;

  return (
    <div style={{ padding: '20px', fontFamily: 'Segoe UI, sans-serif' }}>
      <h2 style={{ color: '#333' }}>Liste des Utilisateurs GLPI (API v2.3)</h2>
      
      {users.length === 0 ? (
        <p>Aucun utilisateur trouvé.</p>
      ) : (
        <table border={1} cellPadding={12} style={{ borderCollapse: 'collapse', width: '100%', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
          <thead>
            <tr style={{ backgroundColor: '#2c3e50', color: '#ffffff', textAlign: 'left' }}>
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
                <td>{user.realname || '-'}</td>
                <td>{user.firstname || '-'}</td>
                <td>{user.default_entity ? user.default_entity.name : '-'}</td>
                <td>
                  <span style={{ 
                    padding: '4px 8px', 
                    borderRadius: '4px', 
                    fontSize: '12px',
                    color: '#fff',
                    backgroundColor: user.is_active ? '#2ecc71' : '#e74c3c' 
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