# RAPPORT D'ÉTUDE DU PROJET GLPI 11.0.7

## Utilisation de GLPI comme Backend d'une Application Moderne

# 1. Introduction

## 1.1 Contexte

Les entreprises modernes ont besoin d'une gestion centralisée :

* des utilisateurs ;
* du parc informatique ;
* des incidents ;
* des demandes de support ;
* des équipements réseau ;
* des licences logicielles.

GLPI 11.0.7 fournit une plateforme complète de gestion des services informatiques (ITSM) et expose une API REST permettant son utilisation comme backend d'applications externes.

## 1.2 Objectifs

L'objectif est :

* d'étudier l'architecture de GLPI ;
* d'analyser ses processus métiers ;
* d'exploiter son API REST ;
* d'utiliser GLPI comme backend d'une nouvelle application.

---

# 2. Présentation Générale de GLPI

## 2.1 Définition

GLPI est une solution Open Source de gestion :

* du Helpdesk ;
* de l'inventaire ;
* des actifs informatiques ;
* des contrats ;
* des licences ;
* des réservations.

## 2.2 Modules Principaux

```text
GLPI
│
├── Helpdesk
├── Assets
├── Utilisateurs
├── Contrats
├── Logiciels
├── Réservations
├── Reporting
└── API REST
```

---

# 3. Étude Métier

## 3.1 Cas d'Utilisation UML

```text
                    +------------------+
                    | Administrateur   |
                    +--------+---------+
                             |
                             |
                             v

+-------------+      +--------------+      +-------------+
| Utilisateur |----->| Créer Ticket |<-----| Technicien  |
+-------------+      +--------------+      +-------------+
        |                    |
        |                    v
        |            +---------------+
        +----------->| Consulter     |
                     | Ticket        |
                     +---------------+

Administrateur
      |
      +------> Gérer Utilisateurs
      |
      +------> Configurer GLPI
      |
      +------> Gérer Inventaire
```

---

# 4. Diagramme de Classe UML

```text
+----------------+
| User           |
+----------------+
| id             |
| name           |
| email          |
+----------------+
        |
        | 1
        |
        | N
+----------------+
| Ticket         |
+----------------+
| id             |
| title          |
| status         |
+----------------+
        |
        | N
        |
        | 1
+----------------+
| Group          |
+----------------+

+----------------+
| Computer       |
+----------------+
| id             |
| serial         |
| name           |
+----------------+

+----------------+
| Software       |
+----------------+
| id             |
| version        |
+----------------+
```

---

# 5. Diagramme de Séquence

## Création d'un Ticket

```text
Utilisateur
     |
     | Créer Ticket
     v
Application
     |
     | POST /Ticket
     v
API GLPI
     |
     | INSERT
     v
MySQL
     |
     | Retour ID
     v
API GLPI
     |
     v
Application
     |
     v
Utilisateur
```

---

# 6. BPMN – Gestion d'Incident

```text
+----------------+
| Utilisateur    |
+-------+--------+
        |
        v
Déclaration
        |
        v
Création Ticket
        |
        v
Affectation
        |
        v
Diagnostic
        |
        v
Résolution
        |
        v
Validation
        |
        v
Clôture
```

---

# 7. BPMN – Gestion de Demande

```text
Demande
   |
   v
Validation
   |
   v
Exécution
   |
   v
Livraison
   |
   v
Fermeture
```

---

# 8. Architecture Technique

```text
+------------------------------------+
| Frontend React / Flutter           |
+----------------+-------------------+
                 |
                 |
                 v
+------------------------------------+
| API REST GLPI                      |
+----------------+-------------------+
                 |
                 |
                 v
+------------------------------------+
| PHP 8.x                            |
| Apache/Nginx                       |
+----------------+-------------------+
                 |
                 |
                 v
+------------------------------------+
| MySQL / MariaDB                    |
+------------------------------------+
```

---

# 9. Architecture Applicative

```text
┌─────────────────────┐
│ Application Mobile  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ API Gateway         │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ GLPI REST API       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Base de Données     │
└─────────────────────┘
```

---

# 10. MCD (MERISE)

```text
UTILISATEUR
------------
id_user
nom
email

TICKET
------------
id_ticket
titre
description
date_creation

ORDINATEUR
------------
id_pc
nom
serial

LOGICIEL
------------
id_logiciel
version

GROUPE
------------
id_groupe
nom
```

Relations :

```text
UTILISATEUR (1,N) ------ TICKET

UTILISATEUR (1,N) ------ ORDINATEUR

ORDINATEUR (N,N) ------ LOGICIEL

UTILISATEUR (N,1) ------ GROUPE
```

---

# 11. MLD (Modèle Logique)

```sql
users
(
    id,
    name,
    email
)

tickets
(
    id,
    users_id,
    title,
    content,
    status
)

computers
(
    id,
    serial,
    name
)

groups
(
    id,
    name
)
```

---

# 12. Principales Tables MySQL de GLPI

## glpi_users

Contient :

* utilisateurs ;
* techniciens ;
* administrateurs.

```text
id
name
firstname
realname
password
email
```

---

## glpi_tickets

Gestion du helpdesk.

```text
id
name
content
status
priority
date
```

---

## glpi_groups

```text
id
name
```

---

## glpi_computers

Inventaire des ordinateurs.

```text
id
name
serial
otherserial
```

---

## glpi_printers

Gestion des imprimantes.

---

## glpi_monitors

Gestion des écrans.

---

## glpi_networkequipments

Gestion réseau.

---

## glpi_softwares

Inventaire logiciel.

---

## glpi_contracts

Gestion des contrats.

---

## glpi_documents

Gestion documentaire.

---

# 13. Schéma des Modules

```text
+-----------------------------------+
|            GLPI                   |
+-----------------------------------+
|
+-- Utilisateurs
|
+-- Helpdesk
|      |
|      +-- Tickets
|      +-- Suivi
|      +-- Validation
|
+-- Inventaire
|      |
|      +-- PC
|      +-- Écrans
|      +-- Imprimantes
|      +-- Réseau
|
+-- Logiciels
|
+-- Contrats
|
+-- Réservations
|
+-- Rapports
|
+-- API REST
```

---

# 14. Étude de l'API REST

## Authentification

```http
GET /apirest.php/initSession
```

Retour :

```json
{
  "session_token": "xxxxxxxx"
}
```

---

## Tickets

```http
GET /Ticket
POST /Ticket
PUT /Ticket/{id}
DELETE /Ticket/{id}
```

---

## Utilisateurs

```http
GET /User
POST /User
```

---

## Ordinateurs

```http
GET /Computer
POST /Computer
```

---

## Recherche

```http
/search/Ticket
/search/User
/search/Computer
```

---

# 15. Intégration avec une Application React

Architecture recommandée :

```text
src/
│
├── api/
│   ├── auth.ts
│   ├── ticket.ts
│   ├── user.ts
│
├── pages/
│
├── services/
│
├── hooks/
│
└── components/
```

---

# 16. Sécurité

Utiliser :

* HTTPS
* App Token
* Session Token
* Journalisation
* Contrôle d'accès

Ne jamais :

* exposer MySQL ;
* stocker les tokens en clair ;
* donner les droits administrateur aux clients.

---

# 17. Avantages de GLPI comme Backend

✔ API REST complète

✔ Gestion des utilisateurs

✔ Gestion des tickets

✔ Gestion documentaire

✔ Historisation

✔ Gestion de parc

✔ Gestion des actifs

✔ Multi-entités

✔ Open Source

---

# 18. Limites

✖ API parfois complexe

✖ Certaines données nécessitent plusieurs appels

✖ Personnalisation avancée parfois via plugins

✖ Modèle de données volumineux

---

# 19. Recommandations

Créer une couche intermédiaire :

```text
React
   |
Node.js / Spring Boot
   |
GLPI API
   |
MySQL
```

Cette couche permettra :

* JWT ;
* cache ;
* validation ;
* sécurité ;
* agrégation de données.

---

# 20. Conclusion

GLPI 11.0.7 constitue une solution robuste pouvant être utilisée comme backend central d'une application moderne. Son API REST, sa gestion des actifs informatiques, son système de tickets et sa structure modulaire en font une plateforme adaptée à la création de portails web, d'applications mobiles et de tableaux de bord métier.
