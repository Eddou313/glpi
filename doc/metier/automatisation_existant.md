# 21. Automatisations Disponibles dans GLPI 11.0.7

## 21.1 Introduction

L'un des principaux avantages de GLPI est son moteur d'automatisation.

Ces automatisations permettent :

* de réduire les tâches manuelles ;
* d'accélérer le traitement des incidents ;
* d'améliorer le respect des SLA ;
* d'automatiser les notifications ;
* de maintenir la cohérence des données.

Architecture générale :

```text
Evénement
    |
    v
Règle Métier
    |
    v
Action Automatique
    |
    +------ Notification
    |
    +------ Affectation
    |
    +------ Mise à jour
    |
    +------ Création
```

---

# 21.2 Actions Automatiques (Cron Tasks)

GLPI possède un planificateur interne permettant d'exécuter des tâches périodiques. Ces tâches peuvent être exécutées :

* depuis GLPI ;
* depuis Linux via Cron ;
* depuis Windows via le Planificateur de tâches.

Les actions automatiques sont configurables :

```text
Configuration
    |
    +---- Actions automatiques
```

Fonctionnement :

```text
Cron Linux
      |
      v
front/cron.php
      |
      v
GLPI Scheduler
      |
      +---- Notifications
      +---- SLA
      +---- Mail
      +---- Maintenance
```

Il est recommandé d'utiliser le mode CLI avec une exécution toutes les minutes.

---

# 21.3 Création Automatique de Tickets par Email

GLPI peut surveiller une boîte mail.

Exemple :

```text
support@societe.com
```

Lorsqu'un email est reçu :

```text
Email reçu
      |
      v
Mail Collector
      |
      v
Création Ticket
      |
      v
Affectation
```

Le processus est assuré par l'action automatique "mailgate".

---

# 21.4 Notifications Automatiques

GLPI peut envoyer automatiquement des emails lors :

* de la création d'un ticket ;
* d'un changement de statut ;
* d'une affectation ;
* d'une résolution ;
* d'une validation.

Workflow :

```text
Modification Ticket
        |
        v
Notification Queue
        |
        v
Envoi Email
```

L'action automatique "queuednotification" traite les notifications en attente.

---

# 21.5 Affectation Automatique des Tickets

Les règles métier permettent :

* d'affecter un ticket à un groupe ;
* d'affecter un ticket à un technicien ;
* de modifier sa priorité ;
* de modifier sa catégorie.

Exemple :

```text
Si catégorie = Réseau
      |
      v
Affecter Groupe Réseau
```

Exemple :

```text
Si urgence = Critique
      |
      v
Priorité = Très Haute
```

Ces mécanismes sont gérés par les règles métier des tickets.

---

# 21.6 Routage Automatique Multi-Entités

GLPI peut rediriger automatiquement les tickets.

```text
Ticket reçu
     |
     +---- Madagascar
     |
     +---- France
     |
     +---- Canada
```

Chaque ticket est automatiquement envoyé vers la bonne entité selon les règles définies.

---

# 21.7 Gestion Automatique des SLA

GLPI surveille automatiquement :

* le délai de prise en charge ;
* le délai de résolution ;
* les dépassements.

Workflow :

```text
Création Ticket
      |
      v
Démarrage SLA
      |
      v
Contrôle Périodique
      |
      v
Alerte Dépassement
```

Les tâches "slaticket" et "olaticket" réalisent ces contrôles.

---

# 21.8 Fermeture Automatique des Tickets

Après résolution :

```text
Ticket Résolu
      |
      v
Attente Validation
      |
      v
Fermeture Automatique
```

Cette automatisation est assurée par "closeticket".

---

# 21.9 Enquête de Satisfaction Automatique

Après la résolution :

```text
Résolution
      |
      v
Enquête Satisfaction
      |
      v
Réponse Client
```

GLPI peut générer automatiquement des enquêtes de satisfaction.

---

# 21.10 Relances Automatiques

Pour les tickets en attente :

```text
Ticket En Attente
       |
       v
Relance 1
       |
       v
Relance 2
       |
       v
Relance 3
```

Puis éventuellement :

```text
Résolution Automatique
```

si aucun retour n'est reçu.

---

# 21.11 Alertes d'Expiration

GLPI surveille automatiquement :

* les contrats ;
* les licences ;
* les certificats ;
* les domaines ;
* les garanties.

```text
Date Expiration
       |
       v
Alerte
       |
       v
Notification
```

Actions concernées :

* contract
* software
* certificate
* DomainsAlert
* infocom

---

# 21.12 Tickets Récurrents

GLPI peut créer automatiquement des tickets périodiques.

Exemple :

```text
Chaque lundi
      |
      v
Créer Ticket Sauvegarde
```

Ou :

```text
Chaque mois
      |
      v
Créer Ticket Maintenance
```

L'action "RecurrentItems" réalise cette génération.

---

# 21.13 Maintenance Automatique

GLPI nettoie automatiquement :

* les sessions expirées ;
* les fichiers temporaires ;
* les anciens logs ;
* les notifications anciennes ;
* les documents orphelins.

Workflow :

```text
Base de données
       |
       v
Nettoyage
       |
       v
Optimisation
```

Actions :

* session
* temp
* logs
* cleanorphans
* queuednotificationclean

---

# 21.14 Inventaire Automatique

Avec l'inventaire GLPI :

```text
Agent
   |
   v
Inventaire
   |
   v
GLPI
   |
   v
Mise à jour automatique
```

Les informations matérielles et logicielles sont synchronisées sans intervention humaine.

---

# 21.15 Architecture Complète des Automatisations

```text
+----------------------------------+
|             GLPI                 |
+----------------------------------+
|
+-- Règles Métier
|      |
|      +-- Affectation
|      +-- Priorité
|      +-- Catégorie
|
+-- Notifications
|
+-- SLA / OLA
|
+-- Collecteur Email
|
+-- Tickets Récurrents
|
+-- Inventaire Automatique
|
+-- Alertes Expiration
|
+-- Nettoyage Automatique
|
+-- Enquêtes Satisfaction
|
+-- Relances Automatiques
|
+-- Fermeture Automatique
+----------------------------------+
```

# Conclusion

Les automatisations de GLPI constituent l'un des éléments les plus importants de la plateforme. Elles permettent de transformer GLPI en un véritable moteur de workflow capable de gérer automatiquement les incidents, les demandes, les notifications, les inventaires, les contrats et les niveaux de service sans intervention humaine permanente.
