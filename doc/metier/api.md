# GLPI 11.0.7 comme Backend Applicatif

## Étude de l'API REST et des Intégrations

# 1. Pourquoi utiliser GLPI comme Backend ?

GLPI n'est pas seulement une application de Helpdesk.

Grâce à son API REST, il peut être utilisé comme serveur de données pour :

* Application mobile de support
* Portail client personnalisé
* Tableau de bord métier
* Application de gestion de parc
* Système de supervision
* Portail RH
* Intranet

Architecture :

```text
+---------------------+
| Application React   |
+----------+----------+
           |
           | HTTP / JSON
           v
+---------------------+
| API REST GLPI       |
+----------+----------+
           |
           v
+---------------------+
| Base MySQL/MariaDB  |
+---------------------+
```

---

# 2. Activation de l'API

Administration → Configuration → API

Activer :

```text
✓ API REST
✓ Authentification API
✓ Jetons d'application
```

---

# 3. Architecture de Communication

```text
Client
   |
   | HTTPS
   v
GLPI REST API
   |
   +---- Tickets
   |
   +---- Users
   |
   +---- Computers
   |
   +---- Assets
   |
   +---- Locations
   |
   +---- Groups
   |
   +---- Contracts
   |
   +---- Documents
   |
   +---- Reservations
```

Toutes les réponses sont au format :

```json
{
    "id": 1,
    "name": "Exemple"
}
```

---

# 4. Authentification

GLPI utilise :

## App-Token

Identifie l'application.

```http
App-Token: xxxxxxxxxxxxxx
```

## User Token

Identifie l'utilisateur.

```http
Authorization: user_token xxxxxxxxxxxx
```

## Session Token

Retourne après connexion.

```http
Session-Token: xxxxxxxxxxxx
```

Flux :

```text
Application
      |
      v
initSession
      |
      v
Session Token
      |
      v
Appels API
      |
      v
killSession
```

---

# 5. Ouverture de Session

Endpoint :

```http
/apirest.php/initSession
```

Exemple :

```bash
curl -X GET \
-H "Authorization: user_token TOKEN" \
-H "App-Token: APP_TOKEN"
```

Réponse :

```json
{
  "session_token": "abc123"
}
```

---

# 6. Fermeture de Session

```http
/apirest.php/killSession
```

---

# 7. Structure Générale des Endpoints

```text
/apirest.php/Ticket
/apirest.php/User
/apirest.php/Computer
/apirest.php/Monitor
/apirest.php/Printer
/apirest.php/NetworkEquipment
/apirest.php/Software
/apirest.php/Contract
/apirest.php/Location
/apirest.php/Group
```

---

# 8. Gestion des Utilisateurs

Création :

```http
POST /User
```

Lecture :

```http
GET /User/15
```

Modification :

```http
PUT /User/15
```

Suppression :

```http
DELETE /User/15
```

---

# 9. Gestion des Tickets

Objet principal du Helpdesk.

Structure :

```json
{
  "name": "Impossible de se connecter",
  "content": "Erreur d'authentification",
  "priority": 3
}
```

Création :

```http
POST /Ticket
```

Recherche :

```http
GET /Ticket
```

Consultation :

```http
GET /Ticket/100
```

Modification :

```http
PUT /Ticket/100
```

---

# 10. Workflow Ticket

```text
Nouveau
   |
   v
Attribué
   |
   v
En cours
   |
   v
Résolu
   |
   v
Clos
```

Une application mobile peut :

* créer un ticket ;
* ajouter des commentaires ;
* joindre des fichiers ;
* consulter l'état.

---

# 11. Gestion du Parc Informatique

Endpoint :

```http
/Computer
```

Exemple :

```json
{
  "name":"PC-001",
  "serial":"ABC123",
  "otherserial":"XYZ456"
}
```

Fonctions :

* Inventaire
* Affectation utilisateur
* Localisation
* Historique

---

# 12. Gestion des Imprimantes

```http
/Printer
```

Fonctions :

* Suivi matériel
* Numéro série
* Emplacement
* État

---

# 13. Gestion Réseau

```http
/NetworkEquipment
```

Permet :

* routeurs ;
* switchs ;
* bornes wifi ;
* pare-feu.

---

# 14. Gestion Logicielle

```http
/Software
```

Suivi :

```text
Nom
Version
Licence
Fabricant
```

---

# 15. Recherche Avancée

GLPI possède un moteur de recherche très puissant.

Exemple :

```http
/search/Ticket
```

Filtres :

```text
date
état
utilisateur
priorité
catégorie
```

Architecture :

```text
Client
   |
   v
Search Engine
   |
   +---- Users
   +---- Tickets
   +---- Assets
```

---

# 16. Documents et Pièces Jointes

Endpoints :

```http
/Document
```

Permet :

* upload
* téléchargement
* liaison aux tickets

Flux :

```text
Fichier
   |
   v
Document
   |
   v
Ticket
```

---

# 17. Gestion des Groupes

```http
/Group
```

Exemple :

```text
Support
Réseau
Développement
Administration
```

---

# 18. Gestion des Localisations

```http
/Location
```

Exemple :

```text
Antananarivo
Toamasina
Mahajanga
Fianarantsoa
```

---

# 19. Entités

GLPI permet une architecture multi-entités.

```text
Entreprise
      |
      +---- Direction
      |
      +---- Filiale
      |
      +---- Agence
```

Très utile pour une grande entreprise.

---

# 20. Intégration React

Exemple :

```typescript
const response = await fetch(
  "http://localhost/glpi/apirest.php/Ticket",
  {
    headers: {
      "Session-Token": token,
      "App-Token": appToken
    }
  }
);
```

---

# 21. Intégration Mobile Flutter

```dart
http.get(
  Uri.parse(url),
  headers: {
    'Session-Token': token,
    'App-Token': appToken
  }
);
```

---

# 22. Architecture Recommandée

```text
+-------------------+
| React Frontend    |
+---------+---------+
          |
          v
+-------------------+
| API Gateway       |
+---------+---------+
          |
          v
+-------------------+
| GLPI API REST     |
+---------+---------+
          |
          v
+-------------------+
| MySQL / MariaDB   |
+-------------------+
```

---

# 23. Sécurité

Toujours :

```text
HTTPS
App Token
User Token
Validation JWT externe
Logs
Rate Limiting
```

Éviter :

```text
Accès direct à la base
Exposition publique de MySQL
Stockage des tokens côté client
```

---

# 24. Cas d'Usage pour votre Nouvelle Application

L'application peut utiliser GLPI pour :

✓ Authentification des utilisateurs

✓ Gestion des tickets

✓ Gestion du matériel

✓ Inventaire informatique

✓ Gestion documentaire

✓ Réservations

✓ Reporting

✓ Historisation

✓ Notifications

✓ Workflow métier

GLPI devient alors un véritable backend métier, tandis que votre nouvelle application fournit une interface moderne adaptée aux besoins des utilisateurs.
