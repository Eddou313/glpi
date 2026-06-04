import { useEffect, useState } from "react";
import { createUser, listUsers, type User } from "../api/users";

export type createUser =
  {
    username: string;
    email?: string;
  }

export function UsersPage() {
  const [allUser, setAllUser] = useState<User[]>([]);

  const [nom, setNom] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await listUsers();
        setAllUser(response.data);
      } catch (error: any) {
        console.error("Erreur lors du chargement des données :", error.message);
      }
    };
    fetchUsers();
  }, [allUser]);

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!nom && !email) alert(`les champ doit etre completer`);
    const response: createUser = {
      username: nom!,
      email: email!
    }
    try {
      await createUser(response);
    }
    catch (error : any) {
      console.log(`Erreur lors de la cretaion de user:${error.messsage}`);
    }
    return;
  }

  return (
    <div>
      <h1>Users</h1>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Username</th>
            <th>Email</th>
          </tr>
        </thead>
        <tbody>
          {allUser.length > 0 &&
            allUser.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.username}</td>
                <td>{user.email}</td>
              </tr>
            ))}
        </tbody>
      </table>
      <form onSubmit={save}>
        <div>
          <label htmlFor="nom">Nom</label>
          <input type="text" name="nom" id="nom" onChange={(e) => setNom(e.target.value)} />
        </div>
        <div>
          <label htmlFor="email">email</label>
          <input type="email" name="email" id="email" onChange={(e) => setEmail(e.target.value)} />
        </div>
        <button type="submit">Save</button>
      </form>
    </div>
  );
}

export default UsersPage;