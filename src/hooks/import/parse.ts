import Papa from "papaparse";
export const parseFile = <T>(
    file: File, // fichier CSV
    separator: string, // séparateur ";" ou ","
    expectedColumns?: (keyof any)[], // colonnes attendues
    expectedDateColumns?: string[], // colonnes contenant des dates
    expectedPositiveNumberColumns?: string[] // colonnes contenant des nombres positifs
): Promise<T[]> => {
    return new Promise<T[]>((resolve, reject) => {

        Papa.parse(file, {
            delimiter: separator,
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                try {
                    const csvColumns = (results.meta?.fields || [])
                        .filter(Boolean) as string[];

                    if (expectedColumns && expectedColumns.length > 0) {
                        validateColumnNames(csvColumns, expectedColumns);
                    }

                    const rows = (results.data as any[])
                        .filter(row =>
                            Object.values(row)
                                .some(v => v !== '' && v !== null && v !== undefined)
                        );
                    if (expectedDateColumns && expectedDateColumns.length > 0) {
                        for (const row of rows) {
                            for (const dateColumn of expectedDateColumns) {
                                const rawValue = String(row?.[dateColumn] ?? "").trim();
                                if (rawValue && !isValidCsvDate(rawValue)) {
                                    throw new Error(
                                        `Format de date différente de DD/MM/YYYY. Colonne "${dateColumn}", valeur "${rawValue}"`
                                    );
                                }
                            }
                        }
                    }
                    // Validation des nombres positifs
                    if (expectedPositiveNumberColumns && expectedPositiveNumberColumns.length > 0) {
                        for (const row of rows) {
                            for (const numberColumn of expectedPositiveNumberColumns) {
                                const rawValue = row?.[numberColumn];
                                if (rawValue === undefined || rawValue === null || String(rawValue).trim() === "") {
                                    throw new Error(
                                        `Montant manquant ou invalide. Colonne "${numberColumn}"`
                                    );
                                }
                                // vérifier si nombre positif
                                if (!isPositiveCsvNumber(rawValue)) {
                                    throw new Error(
                                        `Montant positif obligatoire. Colonne "${numberColumn}", valeur "${rawValue}"`
                                    );
                                }
                            }
                        }
                    }
                    // Conversion des nombres français ex : "12,5" => 12.5
                    const cleanedData = rows.map(row => convertFrenchNumbersInObject(row)) as T[];
                    resolve(cleanedData);

                } catch (error: any) {
                    console.error("Erreur de validation:", error.message);
                    reject(error instanceof Error? error: new Error(String(error)));
                }
            },
            error: (error) => {
                console.error("Erreur lors du parsing CSV:",error.message);
                reject(new Error(`Erreur lors du parsing CSV: ${error.message}`));
            }
        });
    });
};

// Vérifie les noms des colonnes
export function validateColumnNames(csvColumns: string[], // colonnes trouvées dans le CSV
    expectedColumns: (keyof any)[] // colonnes attendues
): void {
    const normalizedCsvColumns =csvColumns.map(normalizeColumnName);
    const normalizedExpectedColumns =expectedColumns.map(col =>normalizeColumnName(String(col)));
    // transformer en Set pour comparaison rapide
    const csvSet = new Set(normalizedCsvColumns);
    const expectedSet = new Set(normalizedExpectedColumns);
    // Vérifie colonnes manquantes
    for (const expected of expectedSet) {
        if (!csvSet.has(expected)) {
            throw new Error(`Nom de colonne non conforme. Colonne manquante ou incorrecte: "${expected}"`);
        }
    }
    // Vérifie colonnes supplémentaires
    for (const csv of csvSet) {
        if (!expectedSet.has(csv)) {
            throw new Error(`Nom de colonne non conforme. Colonne non reconnue: "${csv}"`);
        }
    }
}
// Normalise les noms de colonnes
function normalizeColumnName(name: string): string {
    return (name || "")
        // enlève espaces début/fin
        .trim()
        // minuscule
        .toLowerCase()
        // séparation accents
        .normalize("NFD")
        // enlève accents
        .replace(/[\u0300-\u036f]/g, "")
        // espaces => underscore
        .replace(/\s+/g, "_");
}

// Vérifie une date DD/MM/YYYY
function isValidCsvDate(value: string): boolean {
    const trimmed = String(value ?? "").trim();
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
        return false;
    }

    const [day, month, year] =trimmed.split("/").map(Number);
    const date = new Date(year, month - 1, day);

    return (
        date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day
    );
}
// Vérifie nombre positif
function isPositiveCsvNumber(value: unknown): boolean {
    // conversion : "12,5" => 12.5
    const numericValue = typeof value === "number"? value: Number(String(value ?? "").trim().replace(",", "."));
    // vérifie nombre valide > 0
    return (
        Number.isFinite(numericValue) &&
        numericValue > 0
    );
}
// Convertit nombres français
const convertFrenchNumbersInObject = (obj: any): any => {
    if (Array.isArray(obj)) {

        return obj.map(item =>
            convertFrenchNumbersInObject(item)
        );
    }
    if (obj !== null && typeof obj === 'object') {

        return Object.entries(obj).reduce(

            (acc, [key, value]) => {
                if (typeof value === 'string') {
                    const trimmed = value.trim();
                    const converted =trimmed.replace(',', '.');
                    if (!isNaN(Number(converted)) && converted !== '' && converted.match(/^-?\d+\.?\d*$/)) {
                        // convertir en number
                        acc[key] = Number(converted);
                    } else {
                        acc[key] = value;
                    }

                }
                // Si sous-objet
                else if (typeof value === 'object') {
                    acc[key] =convertFrenchNumbersInObject(value);
                }
                else { acc[key] = value;}
                return acc;
            },
            {} as any
        );
    }
    return obj;
};