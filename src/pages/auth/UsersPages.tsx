import { useUsers,type GlpiUser } from '../../hooks/auth/useUsers';
import { useAuth }            from '../../hooks/auth/useAuth';

export function UsersPage() {
  const { users, loading, error } = useUsers();
  const { logout }                = useAuth();

  if (loading) return <p style={{ textAlign: 'center', marginTop: 60 }}>Chargement des utilisateurs...</p>;
  if (error)   return <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>;

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', padding: '0 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>Utilisateurs GLPI ({users.length})</h2>
        <button
          onClick={logout}
          style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #ccc', cursor: 'pointer' }}
        >
          Déconnexion
        </button>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead>
          <tr style={{ background: '#f5f5f5', textAlign: 'left' }}>
            <th style={th}>ID</th>
            <th style={th}>Identifiant</th>
            <th style={th}>Prénom</th>
            <th style={th}>Nom</th>
            <th style={th}>Email</th>
            <th style={th}>Statut</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user: GlpiUser) => (
            <tr key={user.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={td}>{user.id}</td>
              <td style={td}>{user.name}</td>
              <td style={td}>{user.firstname ?? '—'}</td>
              <td style={td}>{user.realname  ?? '—'}</td>
              <td style={td}>{user.email     ?? '—'}</td>
              <td style={td}>
                <span style={{
                  padding: '2px 8px', borderRadius: 12, fontSize: 12,
                  background: user.is_active ? '#e6f4ea' : '#fce8e6',
                  color:      user.is_active ? '#1e7e34' : '#c0392b',
                }}>
                  {user.is_active ? 'Actif' : 'Inactif'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const th: React.CSSProperties = { padding: '10px 12px', fontWeight: 500 };
const td: React.CSSProperties = { padding: '10px 12px' };