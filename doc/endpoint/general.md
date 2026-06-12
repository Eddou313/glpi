# GLPI 11 - API REST v1 et v2

## Informations générales

Base URL :

```text
http://localhost/glpi/apirest.php
```

ou

```text
https://server/glpi/apirest.php
```

---

# Authentification

## Initialiser une session

### V1

```http
GET /initSession
```

Headers :

```http
App-Token: xxxx
Authorization: user_token xxxx
```

Réponse :

```json
{
  "session_token": "xxxxxxxx"
}
```

---

## Fermer une session

```http
GET /killSession
```

Headers :

```http
Session-Token: xxxx
App-Token: xxxx
```

---

# Utilisateurs

## Liste des utilisateurs

```http
GET /User
```

## Utilisateur par ID

```http
GET /User/{id}
```

## Création utilisateur

```http
POST /User
```

## Modification utilisateur

```http
PUT /User/{id}
```

## Suppression utilisateur

```http
DELETE /User/{id}
```

---

# Tickets

## Liste des tickets

```http
GET /Ticket
```

Paramètres :

```http
range=0-49
```

---

## Ticket par ID

```http
GET /Ticket/{id}
```

---

## Création ticket

```http
POST /Ticket
```

Exemple :

```json
{
  "input": {
    "name": "Incident imprimante",
    "content": "L'imprimante ne fonctionne plus"
  }
}
```

---

## Modification ticket

```http
PUT /Ticket/{id}
```

---

## Suppression ticket

```http
DELETE /Ticket/{id}
```

---

## Suivi d'un ticket

```http
GET /Ticket/{id}/ITILFollowup
```

---

## Ajouter un suivi

```http
POST /ITILFollowup
```

---

## Tâches d'un ticket

```http
GET /Ticket/{id}/TicketTask
```

---

## Ajouter une tâche

```http
POST /TicketTask
```

---

## Solutions

```http
GET /Ticket/{id}/ITILSolution
```

```http
POST /ITILSolution
```

---

# Ordinateurs

## Liste

```http
GET /Computer
```

## Détail

```http
GET /Computer/{id}
```

## Création

```http
POST /Computer
```

## Modification

```http
PUT /Computer/{id}
```

## Suppression

```http
DELETE /Computer/{id}
```

---

# Moniteurs

```http
GET /Monitor
POST /Monitor
PUT /Monitor/{id}
DELETE /Monitor/{id}
```

---

# Imprimantes

```http
GET /Printer
POST /Printer
PUT /Printer/{id}
DELETE /Printer/{id}
```

---

# Réseaux

```http
GET /NetworkEquipment
POST /NetworkEquipment
PUT /NetworkEquipment/{id}
DELETE /NetworkEquipment/{id}
```

---

# Logiciels

```http
GET /Software
POST /Software
PUT /Software/{id}
DELETE /Software/{id}
```

---

# Entités

```http
GET /Entity
POST /Entity
PUT /Entity/{id}
DELETE /Entity/{id}
```

---

# Groupes

```http
GET /Group
POST /Group
PUT /Group/{id}
DELETE /Group/{id}
```

---

# Lieux

```http
GET /Location
POST /Location
PUT /Location/{id}
DELETE /Location/{id}
```

---

# Fabricants

```http
GET /Manufacturer
POST /Manufacturer
PUT /Manufacturer/{id}
DELETE /Manufacturer/{id}
```

---

# Modèles

```http
GET /ComputerModel
GET /MonitorModel
GET /PrinterModel
GET /NetworkEquipmentModel
```

---

# Statuts

```http
GET /State
POST /State
PUT /State/{id}
DELETE /State/{id}
```

---

# Documents

```http
GET /Document
POST /Document
PUT /Document/{id}
DELETE /Document/{id}
```

---

# Profils

```http
GET /Profile
```

---

# Règles

```http
GET /Rule
```

---

# Recherche

## Recherche globale

```http
GET /search/{ItemType}
```

Exemple :

```http
GET /search/Ticket
GET /search/Computer
GET /search/User
```

---

# Upload de document

```http
POST /Document
```

Content-Type :

```http
multipart/form-data
```

---

# Endpoints statistiques (GLPI 11)

## Statistiques tickets

```http
GET /Assistance/Stat/Ticket
```

## Tickets par catégorie

```http
GET /Assistance/Stat/Ticket/Category
```

## Tickets par équipement

```http
GET /Assistance/Stat/Ticket/Asset
```

## Export

```http
GET /Assistance/Stat/Ticket/Asset/Export
```

---

# Endpoints V2 (GLPI 11)

Base URL :

```text
/api
```

Exemples :

```http
GET /api/Ticket
GET /api/User
GET /api/Computer
GET /api/Location
GET /api/Group
```

Authentification :

```http
Authorization: Bearer <token>
```

Les ressources disponibles en V2 reprennent généralement les mêmes objets métier que la V1 :

* Ticket
* User
* Computer
* Monitor
* Printer
* NetworkEquipment
* Software
* Entity
* Group
* Location
* Manufacturer
* Document
* Profile
* State

---

# Ressources utilisées dans le projet

* Ticket
* User
* Computer
* Location
* Group
* State
* Manufacturer
* Document
* ITILFollowup
* TicketTask
* ITILSolution
* Search
* Statistics
