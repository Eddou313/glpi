# 🔗 Référence des Requêtes SQLite — Jointures (JOIN)

Documentation de toutes les requêtes SQLite utilisant des jointures entre tables, intégrées dans les fonctions du contrôleur.

---

## 📋 Table des matières

- [INNER JOIN — listPostsWithAuthor](#inner-join--listpostswithauthor)
- [LEFT JOIN — listUsersWithPosts](#left-join--listuserswithposts)
- [Multiple JOIN — listCommentsWithPostAndUser](#multiple-join--listcommentswithpostanduser)
- [LEFT JOIN + COUNT — listPostsWithCommentCount](#left-join--count--listpostswithcommentcount)
- [Self JOIN — listUsersWithManager](#self-join--listuserswithmanager)

---

## `INNER JOIN` — `listPostsWithAuthor`

**Description :** Récupère tous les articles **avec** les informations de leur auteur. Seuls les articles ayant un auteur existant sont retournés.

**Code TypeScript :**
```typescript
export const listPostsWithAuthor = (req: Request, res: Response) => {
  const rows = db.prepare(`
    SELECT
      posts.id        AS post_id,
      posts.title,
      posts.content,
      users.id        AS author_id,
      users.username  AS author_name,
      users.email     AS author_email
    FROM posts
    INNER JOIN users ON users.id = posts.user_id
    ORDER BY posts.id DESC
  `).all();
  res.json(rows);
};
```

**Requête SQL :**
```sql
SELECT
  posts.id        AS post_id,
  posts.title,
  posts.content,
  users.id        AS author_id,
  users.username  AS author_name,
  users.email     AS author_email
FROM posts
INNER JOIN users ON users.id = posts.user_id
ORDER BY posts.id DESC
```

**Explication :**
- `INNER JOIN users ON users.id = posts.user_id` → joint la table `users` sur la clé étrangère `user_id` de `posts`. Si un post n'a pas d'auteur correspondant, il est **exclu** du résultat
- `AS post_id`, `AS author_name` → alias pour éviter les conflits de noms entre tables (les deux tables ont un champ `id`)
- `ORDER BY posts.id DESC` → les articles les plus récents en premier

**Schéma impliqué :**
```
users         posts
──────        ──────────────────
id  ◄────── user_id (FK)
username      id
email         title
              content
```

**Exemple de réponse :**
```json
[
  {
    "post_id": 5,
    "title": "Mon premier article",
    "content": "Contenu...",
    "author_id": 2,
    "author_name": "alice",
    "author_email": "alice@example.com"
  }
]
```

---

## `LEFT JOIN` — `listUsersWithPosts`

**Description :** Récupère tous les utilisateurs **même ceux sans articles**. Les utilisateurs sans post auront `null` dans les champs liés aux articles.

**Code TypeScript :**
```typescript
export const listUsersWithPosts = (req: Request, res: Response) => {
  const rows = db.prepare(`
    SELECT
      users.id        AS user_id,
      users.username,
      users.email,
      posts.id        AS post_id,
      posts.title     AS post_title
    FROM users
    LEFT JOIN posts ON posts.user_id = users.id
    ORDER BY users.id ASC, posts.id DESC
  `).all();
  res.json(rows);
};
```

**Requête SQL :**
```sql
SELECT
  users.id        AS user_id,
  users.username,
  users.email,
  posts.id        AS post_id,
  posts.title     AS post_title
FROM users
LEFT JOIN posts ON posts.user_id = users.id
ORDER BY users.id ASC, posts.id DESC
```

**Explication :**
- `LEFT JOIN posts` → retourne **tous** les utilisateurs, avec ou sans article associé
- Si un utilisateur n'a aucun post → `post_id` et `post_title` seront `null`
- Un utilisateur avec **3 posts** apparaîtra sur **3 lignes** distinctes (une par post)
- `ORDER BY users.id ASC, posts.id DESC` → tri primaire par utilisateur, secondaire par post récent

**Différence INNER vs LEFT :**
| Type | Utilisateur sans post |
|------|----------------------|
| `INNER JOIN` | ❌ Exclu |
| `LEFT JOIN` | ✅ Inclus (avec `null`) |

**Exemple de réponse :**
```json
[
  { "user_id": 1, "username": "alice", "email": "alice@ex.com", "post_id": 3, "post_title": "Article A" },
  { "user_id": 1, "username": "alice", "email": "alice@ex.com", "post_id": 1, "post_title": "Article B" },
  { "user_id": 2, "username": "bob",   "email": "bob@ex.com",   "post_id": null, "post_title": null }
]
```

---

## Multiple JOIN — `listCommentsWithPostAndUser`

**Description :** Récupère tous les commentaires avec le titre de l'article commenté ET le nom de l'auteur du commentaire. Implique **3 tables** jointes en chaîne.

**Code TypeScript :**
```typescript
export const listCommentsWithPostAndUser = (req: Request, res: Response) => {
  const postId = Number(req.params.postId);
  const rows = db.prepare(`
    SELECT
      comments.id       AS comment_id,
      comments.body,
      comments.created_at,
      users.id          AS author_id,
      users.username    AS author_name,
      posts.id          AS post_id,
      posts.title       AS post_title
    FROM comments
    INNER JOIN users ON users.id = comments.user_id
    INNER JOIN posts ON posts.id = comments.post_id
    WHERE comments.post_id = ?
    ORDER BY comments.created_at ASC
  `).all(postId);
  res.json(rows);
};
```

**Requête SQL :**
```sql
SELECT
  comments.id       AS comment_id,
  comments.body,
  comments.created_at,
  users.id          AS author_id,
  users.username    AS author_name,
  posts.id          AS post_id,
  posts.title       AS post_title
FROM comments
INNER JOIN users ON users.id = comments.user_id
INNER JOIN posts ON posts.id = comments.post_id
WHERE comments.post_id = ?
ORDER BY comments.created_at ASC
```

**Explication :**
- Premier `INNER JOIN users` → relie chaque commentaire à son auteur via `comments.user_id`
- Second `INNER JOIN posts` → relie chaque commentaire à son article via `comments.post_id`
- `WHERE comments.post_id = ?` → filtre sur un article précis passé en paramètre
- `ORDER BY comments.created_at ASC` → affiche les commentaires dans l'ordre chronologique

**Schéma impliqué :**
```
users           comments              posts
──────          ──────────────────    ──────
id  ◄────────  user_id (FK)          id
username        id                    title
                body             ►── post_id (FK)
                created_at
```

**Exemple de réponse :**
```json
[
  {
    "comment_id": 10,
    "body": "Super article !",
    "created_at": "2024-03-01T10:00:00",
    "author_id": 2,
    "author_name": "bob",
    "post_id": 5,
    "post_title": "Mon premier article"
  }
]
```

---

## `LEFT JOIN` + `COUNT` — `listPostsWithCommentCount`

**Description :** Récupère tous les articles avec le **nombre de commentaires** associés à chacun. Les articles sans commentaire affichent `0`.

**Code TypeScript :**
```typescript
export const listPostsWithCommentCount = (req: Request, res: Response) => {
  const rows = db.prepare(`
    SELECT
      posts.id          AS post_id,
      posts.title,
      posts.created_at,
      users.username    AS author_name,
      COUNT(comments.id) AS comment_count
    FROM posts
    INNER JOIN users    ON users.id    = posts.user_id
    LEFT JOIN  comments ON comments.post_id = posts.id
    GROUP BY posts.id
    ORDER BY posts.id DESC
  `).all();
  res.json(rows);
};
```

**Requête SQL :**
```sql
SELECT
  posts.id          AS post_id,
  posts.title,
  posts.created_at,
  users.username    AS author_name,
  COUNT(comments.id) AS comment_count
FROM posts
INNER JOIN users    ON users.id         = posts.user_id
LEFT JOIN  comments ON comments.post_id = posts.id
GROUP BY posts.id
ORDER BY posts.id DESC
```

**Explication :**
- `INNER JOIN users` → chaque post doit avoir un auteur (obligatoire)
- `LEFT JOIN comments` → on inclut les posts **sans commentaire** (le COUNT sera `0`)
- `COUNT(comments.id)` → compte les commentaires ; avec un LEFT JOIN, les lignes `null` ne sont **pas comptées** (comportement correct)
- `GROUP BY posts.id` → obligatoire dès qu'on utilise `COUNT` avec d'autres colonnes non agrégées

**Pourquoi LEFT JOIN ici et pas INNER JOIN ?**
> Avec `INNER JOIN comments`, un article sans commentaire serait **exclu** du résultat. Le `LEFT JOIN` garantit que tous les articles apparaissent, avec `comment_count = 0` si besoin.

**Exemple de réponse :**
```json
[
  { "post_id": 5, "title": "Article A", "author_name": "alice", "comment_count": 4 },
  { "post_id": 4, "title": "Article B", "author_name": "bob",   "comment_count": 0 }
]
```

---

## Self JOIN — `listUsersWithManager`

**Description :** Récupère tous les utilisateurs avec le nom de leur manager. Les deux proviennent de la **même table** `users` — on joint la table sur elle-même.

**Code TypeScript :**
```typescript
export const listUsersWithManager = (req: Request, res: Response) => {
  const rows = db.prepare(`
    SELECT
      u.id            AS user_id,
      u.username      AS username,
      u.email,
      m.id            AS manager_id,
      m.username      AS manager_name
    FROM users u
    LEFT JOIN users m ON m.id = u.manager_id
    ORDER BY u.id ASC
  `).all();
  res.json(rows);
};
```

**Requête SQL :**
```sql
SELECT
  u.id            AS user_id,
  u.username      AS username,
  u.email,
  m.id            AS manager_id,
  m.username      AS manager_name
FROM users u
LEFT JOIN users m ON m.id = u.manager_id
ORDER BY u.id ASC
```

**Explication :**
- `FROM users u` → alias `u` pour désigner l'employé
- `LEFT JOIN users m` → alias `m` pour désigner le manager (même table !)
- `ON m.id = u.manager_id` → le `manager_id` de l'employé pointe vers l'`id` d'un autre utilisateur
- `LEFT JOIN` → les utilisateurs sans manager (ex: le directeur) auront `manager_id = null`

**Schéma impliqué :**
```
users (u)              users (m)
──────────────         ──────────
id                     id  ◄──── manager_id (FK auto-référence)
username               username
email
manager_id ───────────►
```

**Exemple de réponse :**
```json
[
  { "user_id": 1, "username": "alice", "email": "...", "manager_id": null,  "manager_name": null },
  { "user_id": 2, "username": "bob",   "email": "...", "manager_id": 1,     "manager_name": "alice" },
  { "user_id": 3, "username": "carol", "email": "...", "manager_id": 1,     "manager_name": "alice" }
]
```

---

## 🗂️ Récapitulatif des jointures

| Fonction | Type JOIN | Tables | Description courte |
|----------|-----------|--------|--------------------|
| `listPostsWithAuthor` | `INNER JOIN` | `posts` + `users` | Articles avec leur auteur |
| `listUsersWithPosts` | `LEFT JOIN` | `users` + `posts` | Utilisateurs avec leurs articles (même sans) |
| `listCommentsWithPostAndUser` | `INNER JOIN` × 2 | `comments` + `users` + `posts` | Commentaires avec auteur et article |
| `listPostsWithCommentCount` | `INNER JOIN` + `LEFT JOIN` + `COUNT` | `posts` + `users` + `comments` | Articles avec nombre de commentaires |
| `listUsersWithManager` | Self `LEFT JOIN` | `users` × 2 | Utilisateurs avec leur manager |

---

## 📐 Guide de choix du type de JOIN

```
Est-ce que je veux garder les lignes sans correspondance ?
│
├── NON → INNER JOIN
│         Retourne uniquement les lignes qui ont une correspondance dans les deux tables
│
└── OUI → LEFT JOIN
          Retourne TOUTES les lignes de la table de gauche,
          avec NULL pour les colonnes de la table de droite si pas de correspondance

Cas spéciaux :
  ├── Même table sur elle-même      → Self JOIN (avec alias u et m)
  └── Compter des lignes liées      → LEFT JOIN + COUNT(colonne) + GROUP BY
```