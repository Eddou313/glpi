# Étude Métier du Projet GLPI 11.0.7

## 1. Présentation Générale

GLPI (Gestionnaire Libre de Parc Informatique) est une solution Open Source permettant de gérer :

* Le parc informatique
* Les utilisateurs
* Les incidents et demandes de support
* Les contrats
* Les licences logicielles
* Les équipements réseau
* Les réservations de matériels
* La gestion financière du SI

L'objectif principal est de centraliser toutes les informations liées au système d'information d'une organisation.

---

# 2. Acteurs du Système

## Utilisateur

Peut :

* Créer des tickets
* Consulter ses demandes
* Réserver du matériel

## Technicien

Peut :

* Recevoir des tickets
* Diagnostiquer les problèmes
* Résoudre les incidents

## Gestionnaire du Parc

Peut :

* Ajouter les équipements
* Gérer les licences
* Gérer les contrats

## Administrateur

Peut :

* Configurer GLPI
* Gérer les profils
* Administrer les droits

---

# 3. Vue Métier Générale

```text
+----------------+
| Utilisateur    |
+-------+--------+
        |
        v
+----------------+
| Création Ticket|
+-------+--------+
        |
        v
+----------------+
| Affectation    |
| Technicien     |
+-------+--------+
        |
        v
+----------------+
| Traitement     |
+-------+--------+
        |
        v
+----------------+
| Résolution     |
+-------+--------+
        |
        v
+----------------+
| Clôture Ticket |
+----------------+
```

---

# 4. Gestion des Incidents

## Processus Métier

```text
Utilisateur
    |
    v
Déclaration Incident
    |
    v
Création Ticket
    |
    v
Qualification
    |
    v
Affectation
    |
    v
Traitement
    |
    v
Résolution
    |
    v
Validation Utilisateur
    |
    v
Clôture
```

### Objectif

Assurer le suivi complet d'un incident jusqu'à sa résolution.

---

# 5. Gestion des Demandes

Les demandes concernent :

* Installation de logiciels
* Création de comptes
* Accès réseau
* Achat de matériel

## Workflow

```text
Demande Utilisateur
        |
        v
Validation
        |
        v
Traitement
        |
        v
Livraison Service
        |
        v
Fermeture
```

---

# 6. Gestion du Parc Informatique

GLPI permet de gérer :

* Ordinateurs
* Imprimantes
* Écrans
* Routeurs
* Switchs
* Téléphones

## Cycle de Vie d'un Équipement

```text
Achat
  |
  v
Stock
  |
  v
Déploiement
  |
  v
Utilisation
  |
  v
Maintenance
  |
  v
Réforme
```

---

# 7. Gestion des Licences

### Informations suivies

* Nom logiciel
* Nombre de licences
* Date d'expiration
* Affectation

## Flux

```text
Licence
   |
   +----> Logiciel
   |
   +----> Utilisateur
   |
   +----> Machine
```

---

# 8. Gestion des Contrats

Types :

* Maintenance
* Fournisseur
* Support
* Garantie

## Cycle

```text
Création
   |
   v
Activation
   |
   v
Suivi
   |
   v
Renouvellement
   |
   v
Expiration
```

---

# 9. Gestion des Réservations

Permet la réservation :

* Salle
* Vidéoprojecteur
* Ordinateur portable
* Véhicule

## Flux

```text
Utilisateur
      |
      v
Réservation
      |
      v
Validation
      |
      v
Utilisation
      |
      v
Restitution
```

---

# 10. Gestion des Utilisateurs

## Structure

```text
Entreprise
      |
      +----- Entité
                 |
                 +----- Groupe
                             |
                             +----- Utilisateur
```

---

# 11. Gestion Financière

GLPI permet de suivre :

* Coût du matériel
* Coût des licences
* Coût des contrats
* Budget informatique

## Flux Financier

```text
Budget
   |
   +----> Achat Matériel
   |
   +----> Contrats
   |
   +----> Licences
   |
   +----> Maintenance
```

---

# 12. Base de Données Métier Simplifiée

```text
Utilisateur
    |
    +---- Ticket
    |
    +---- Réservation

Ticket
    |
    +---- Technicien
    |
    +---- Catégorie

Ordinateur
    |
    +---- Utilisateur
    |
    +---- Licence

Contrat
    |
    +---- Fournisseur

Licence
    |
    +---- Logiciel
```

---

# 13. Indicateurs de Performance (KPI)

### Support

* Nombre de tickets ouverts
* Nombre de tickets fermés
* Temps moyen de résolution

### Parc

* Nombre d'équipements
* Taux d'utilisation

### Contrats

* Contrats expirant bientôt
* Coût annuel

### Licences

* Licences utilisées
* Licences disponibles

---

# 14. Architecture Fonctionnelle

```text
+--------------------------------------+
|               GLPI                   |
+--------------------------------------+
|                                      |
|  Helpdesk                            |
|  Gestion Parc                        |
|  Gestion Utilisateurs                |
|  Gestion Licences                    |
|  Gestion Contrats                    |
|  Réservations                        |
|  Reporting                           |
|  Administration                      |
|                                      |
+--------------------------------------+
```

---

# 15. Conclusion

GLPI 11.0.7 est une plateforme ITSM (IT Service Management) permettant :

* La gestion des incidents.
* La gestion des demandes de service.
* La gestion du parc informatique.
* La gestion des contrats.
* La gestion des licences.
* Le suivi financier du système d'information.

Le cœur métier de GLPI repose principalement sur la gestion des tickets et la gestion des actifs informatiques afin d'améliorer la qualité des services informatiques et la traçabilité des ressources.
