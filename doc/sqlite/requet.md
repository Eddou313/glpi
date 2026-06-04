# 📄 Requêtes SQLite — Table `users`

Documentation de toutes les requêtes SQLite intégrées dans les fonctions du contrôleur `users`.

---

## 🗃️ Structure de la table

```sql
CREATE TABLE users (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT    NOT NULL UNIQUE,
  email    TEXT
);
```

---

## 1. `listUsers` — Lister tous les utilisateurs

**Route :** `GET /users`

**Ce que fait la fonction :**
Récupère la liste complète de tous les utilisateurs enregistrés dans la base, triée du plus récent au plus ancien.

**Requête SQLite :**
```sql
SELECT id, username, email
FROM users
ORDER BY id DESC
```

**Explication de la requête :**
- `SELECT id, username, email` → on sélectionne uniquement les 3 colonnes utiles (on évite de retourner des champs sensibles comme un mot de passe)
- `FROM users` → la table ciblée
- `ORDER BY id DESC` → tri décroissant par `id`, donc les derniers insérés apparaissent en premier

**Méthode better-sqlite3 :** `.all()` — retourne un tableau de toutes les lignes

```typescript
export const listUsers = (req: Request, res: Response) => {
  const rows = db.prepare('SELECT id, username, email FROM users ORDER BY id DESC').all();
  res.json(rows);
};
```

---

## 2. `getUser` — Récupérer un utilisateur par son ID

**Route :** `GET /users/:id`

**Ce que fait la fonction :**
Cherche un utilisateur précis via son identifiant numérique. Retourne une erreur 404 s'il n'existe pas.

**Requête SQLite :**
```sql
SELECT id, username, email
FROM users
WHERE id = ?
```

**Explication de la requête :**
- `WHERE id = ?` → le `?` est un **paramètre lié** (*bound parameter*) : better-sqlite3 injecte la valeur de façon sécurisée pour éviter les injections SQL
- Si aucune ligne ne correspond, `.get()` retourne `undefined`, ce qui déclenche le `404`

**Méthode better-sqlite3 :** `.get(id)` — retourne une seule ligne ou `undefined`

```typescript
export const getUser = (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const user = db.prepare('SELECT id, username, email FROM users WHERE id = ?').get(id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
};
```

---

## 3. `createUser` — Créer un nouvel utilisateur

**Route :** `POST /users`

**Ce que fait la fonction :**
Insère un nouvel utilisateur dans la base. Après l'insertion, relit la ligne créée pour la retourner complète au client. Gère le cas où le `username` est déjà pris (contrainte `UNIQUE`).

**Requête 1 — Insertion :**
```sql
INSERT INTO users (username, email)
VALUES (?, ?)
```

**Explication :**
- Insère les valeurs `username` et `email` passées dans le `body`
- Si `email` est absent, on passe `null` explicitement (`email ?? null`)
- `.run()` retourne un objet `info` contenant `info.lastInsertRowid` : l'`id` auto-généré de la ligne créée

**Requête 2 — Relecture après insertion :**
```sql
SELECT id, username, email
FROM users
WHERE id = ?
```

**Explication :**
- On relit immédiatement l'utilisateur créé avec son `id` pour retourner la donnée telle qu'elle est stockée en base (bonne pratique)

**Méthode better-sqlite3 :** `.run()` — exécute sans retourner de ligne ; `.get()` pour la relecture

**Gestion d'erreur :**
- `SQLITE_CONSTRAINT_UNIQUE` → le `username` existe déjà → réponse `409 Conflict`

```typescript
export const createUser = (req: Request, res: Response) => {
  const { username, email } = req.body;
  if (!username) return res.status(400).json({ error: 'username required' });
  try {
    const info = db.prepare('INSERT INTO users (username, email) VALUES (?, ?)').run(username, email ?? null);
    const user = db.prepare('SELECT id, username, email FROM users WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(user);
  } catch (err: any) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') return res.status(409).json({ error: 'username already exists' });
    res.status(500).json({ error: err.message });
  }
};
```

---

## 4. `updateUser` — Mettre à jour un utilisateur

**Route :** `PATCH /users/:id`

**Ce que fait la fonction :**
Met à jour partiellement un utilisateur (seuls les champs fournis changent). Retourne 404 si l'utilisateur n'existe pas.

**Requête 1 — Mise à jour partielle :**
```sql
UPDATE users
SET username = coalesce(?, username),
    email    = coalesce(?, email)
WHERE id = ?
```

**Explication :**
- `coalesce(?, username)` → astuce SQLite : si le `?` vaut `NULL`, on garde l'ancienne valeur de `username`. Cela permet un **PATCH partiel** sans écraser les champs non fournis
- `info.changes` indique le nombre de lignes modifiées : si `0`, l'utilisateur n'existe pas → `404`

**Requête 2 — Relecture après mise à jour :**
```sql
SELECT id, username, email
FROM users
WHERE id = ?
```

**Explication :**
- Même logique que pour `createUser` : on relit la ligne après modification pour retourner l'état actuel

**Méthode better-sqlite3 :** `.run()` puis `.get()`

```typescript
export const updateUser = (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { username, email } = req.body;
  const info = db
    .prepare('UPDATE users SET username = coalesce(?, username), email = coalesce(?, email) WHERE id = ?')
    .run(username ?? null, email ?? null, id);
  if (info.changes === 0) return res.status(404).json({ error: 'User not found' });
  const user = db.prepare('SELECT id, username, email FROM users WHERE id = ?').get(id);
  res.json(user);
};
```

---

## 5. `deleteUser` — Supprimer un utilisateur

**Route :** `DELETE /users/:id`

**Ce que fait la fonction :**
Supprime définitivement un utilisateur par son `id`. Retourne 404 s'il n'existe pas, ou `204 No Content` si la suppression a réussi.

**Requête SQLite :**
```sql
DELETE FROM users
WHERE id = ?
```

**Explication :**
- Supprime la ligne dont l'`id` correspond
- `info.changes === 0` signifie qu'aucune ligne n'a été touchée : l'utilisateur n'existait pas → `404`
- En cas de succès, on retourne `204` (succès sans corps de réponse — standard REST pour un DELETE)

**Méthode better-sqlite3 :** `.run(id)` — retourne `{ changes, lastInsertRowid }`

```typescript
export const deleteUser = (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const info = db.prepare('DELETE FROM users WHERE id = ?').run(id);
  if (info.changes === 0) return res.status(404).json({ error: 'User not found' });
  res.status(204).send();
};
```

---

## 📊 Récapitulatif des requêtes

| Fonction       | Méthode HTTP | Requête SQL       | better-sqlite3 | Retour HTTP        |
|----------------|-------------|-------------------|----------------|--------------------|
| `listUsers`    | GET         | `SELECT … ORDER BY id DESC` | `.all()`  | `200` + tableau    |
| `getUser`      | GET         | `SELECT … WHERE id = ?`     | `.get()`  | `200` ou `404`     |
| `createUser`   | POST        | `INSERT …` + `SELECT`       | `.run()` + `.get()` | `201` ou `409` |
| `updateUser`   | PATCH       | `UPDATE … coalesce` + `SELECT` | `.run()` + `.get()` | `200` ou `404` |
| `deleteUser`   | DELETE      | `DELETE … WHERE id = ?`     | `.run()`  | `204` ou `404`     |

---

## 💡 Bonnes pratiques appliquées

**Paramètres liés (`?`)** — Toutes les valeurs dynamiques passent par des `?` et jamais par concaténation de chaîne. Cela protège contre les injections SQL.

**Relecture après écriture** — Après un `INSERT` ou `UPDATE`, on fait un `SELECT` pour retourner la ligne telle qu'elle est réellement en base, pas juste les données envoyées par le client.

**`coalesce` pour le PATCH partiel** — Permet de ne mettre à jour que les champs fournis sans avoir à construire une requête SQL dynamique.

**`info.changes` pour le 404** — Plutôt que de faire un `SELECT` avant chaque `UPDATE`/`DELETE` (deux requêtes), on vérifie après coup si des lignes ont été affectées.