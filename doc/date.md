# Gestion des Dates SQLite en TypeScript

## 1. Fonction globale : `obtenirDateFormatee`

Cette fonction permet de convertir une date et une heure séparées en une chaîne compatible avec SQLite au format :

```text
YYYY-MM-DD HH:mm:ss
```

```ts
export function obtenirDateFormatee({
  annee,
  mois,
  jour,
  heures = 0,
  minutes = 0,
  secondes = 0,
}: {
  annee: number;
  mois: number;
  jour: number;
  heures?: number;
  minutes?: number;
  secondes?: number;
}): string {
  const pad = (val: number) => String(val).padStart(2, "0");

  return `${annee}-${pad(mois)}-${pad(jour)} ${pad(heures)}:${pad(minutes)}:${pad(secondes)}`;
}
```

---

## 2. Étape 1 : Division (`.split()`)

Pour extraire les données numériques depuis des formats textuels comme `"01-02-2006"` et `"08:02:04"`, on utilise la méthode `.split()` combinée à `.map(Number)` pour la conversion immédiate en nombres.

```ts
// Chaînes de caractères d'origine
const dateStr = "01-02-2006"; // Format attendu : JJ-MM-AAAA
const heureStr = "08:02:04";  // Format attendu : HH:mm:ss

// 1. Division de la date par le séparateur "-"
const [jour, mois, annee] = dateStr.split("-").map(Number);

// 2. Division de l'heure par le séparateur ":"
const [heures, minutes, secondes] = heureStr.split(":").map(Number);
```

### Résultat des variables

| Variable | Valeur |
|-----------|---------|
| jour | 1 |
| mois | 2 |
| annee | 2006 |
| heures | 8 |
| minutes | 2 |
| secondes | 4 |

---

## 3. Étape 2 : Rassemblement

On injecte désormais les variables extraites dans notre fonction de formatage pour générer la chaîne finale structurée pour SQLite.

```ts
// Rassemblement et conversion au format SQLite (YYYY-MM-DD HH:mm:ss)
const dateSQLite = obtenirDateFormatee({
  annee,
  mois,
  jour,
  heures,
  minutes,
  secondes
});

console.log(dateSQLite);
```

### Résultat

```text
2006-02-01 08:02:04
```

---

## 4. Étape 3 : Affichage sur une Page (Exemple React / Framework)

Voici comment orchestrer l'ensemble de la logique à l'intérieur d'un composant React afin d'afficher le résultat de manière dynamique sur l'interface utilisateur.

```tsx
import React, { useState, useEffect } from "react";
import { obtenirDateFormatee } from "./utils/dateHelper";

export const VisionneurDate = () => {
  const [dateAffichee, setDateAffichee] = useState<string>("");

  useEffect(() => {
    // 1. Données d'entrée brutes
    const chaineDate = "01-02-2006";
    const chaineHeure = "08:02:04";

    // 2. Traitement (Division)
    const [j, m, a] = chaineDate.split("-").map(Number);
    const [h, min, s] = chaineHeure.split(":").map(Number);

    // 3. Rassemblement via la fonction globale
    const resultatFormate = obtenirDateFormatee({
      annee: a,
      mois: m,
      jour: j,
      heures: h,
      minutes: min,
      secondes: s,
    });

    // 4. Mise à jour de l'état pour affichage
    setDateAffichee(resultatFormate);
  }, []);

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h3>Résultat du traitement de la date</h3>

      <p>
        <strong>Format SQLite final :</strong>

        <code
          style={{
            marginLeft: "10px",
            background: "#eee",
            padding: "4px",
          }}
        >
          {dateAffichee}
        </code>
      </p>
    </div>
  );
};
```

---

## Résumé

### Données d'entrée

```text
Date  : 01-02-2006
Heure : 08:02:04
```

### Traitement

```ts
const [jour, mois, annee] = dateStr.split("-").map(Number);
const [heures, minutes, secondes] = heureStr.split(":").map(Number);
```

### Conversion

```ts
const dateSQLite = obtenirDateFormatee({
  annee,
  mois,
  jour,
  heures,
  minutes,
  secondes,
});
```

### Résultat final SQLite

```text
2006-02-01 08:02:04
```

---

## 5. Transformation entre les formats de date

Il est fréquent de recevoir une date au format français :

```text
JJ-MM-AAAA
```

alors que certaines bases de données ou API attendent :

```text
AAAA-MM-JJ
```

### Conversion de `JJ-MM-AAAA` vers `AAAA-MM-JJ`

```ts
function convertirVersFormatBDD(dateFr: string): string {
  const [jour, mois, annee] = dateFr.split("-");

  return `${annee}-${mois}-${jour}`;
}

const dateFr = "01-02-2006";
const dateBDD = convertirVersFormatBDD(dateFr);

console.log(dateBDD);
```

Résultat :

```text
2006-02-01
```

---

### Conversion de `AAAA-MM-JJ` vers `JJ-MM-AAAA`

```ts
function convertirVersFormatFrancais(dateBDD: string): string {
  const [annee, mois, jour] = dateBDD.split("-");

  return `${jour}-${mois}-${annee}`;
}

const dateBDD = "2006-02-01";
const dateFr = convertirVersFormatFrancais(dateBDD);

console.log(dateFr);
```

Résultat :

```text
01-02-2006
```

---

### Version avec validation simple

```ts
function convertirDate(
  date: string,
  formatSource: "DD-MM-YYYY" | "YYYY-MM-DD",
  formatDestination: "DD-MM-YYYY" | "YYYY-MM-DD"
): string {
  if (formatSource === formatDestination) {
    return date;
  }

  if (formatSource === "DD-MM-YYYY") {
    const [jour, mois, annee] = date.split("-");
    return `${annee}-${mois}-${jour}`;
  }

  const [annee, mois, jour] = date.split("-");
  return `${jour}-${mois}-${annee}`;
}
```

Exemples :

```ts
console.log(
  convertirDate(
    "01-02-2006",
    "DD-MM-YYYY",
    "YYYY-MM-DD"
  )
);
// 2006-02-01

console.log(
  convertirDate(
    "2006-02-01",
    "YYYY-MM-DD",
    "DD-MM-YYYY"
  )
);
// 01-02-2006
```

---

### Utilisation avec `obtenirDateFormatee`

```ts
const dateFr = "01-02-2006";
const heureStr = "08:02:04";

const [jour, mois, annee] = dateFr.split("-").map(Number);
const [heures, minutes, secondes] = heureStr.split(":").map(Number);

const dateSQLite = obtenirDateFormatee({
  annee,
  mois,
  jour,
  heures,
  minutes,
  secondes,
});

console.log(dateSQLite);
```

Résultat :

```text
2006-02-01 08:02:04
```

Ainsi, le flux complet est :

```text
01-02-2006
    ↓
Découpage (.split)
    ↓
jour=01 mois=02 annee=2006
    ↓
Transformation
    ↓
2006-02-01
    ↓
Ajout de l'heure
    ↓
2006-02-01 08:02:04
```

Ce format final est compatible avec les champs `DATE` et `DATETIME` de SQLite, PostgreSQL et MySQL.