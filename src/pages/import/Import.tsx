import { useState } from "react";
import { buildImageMapFromZip } from "../../hooks/import/zip";
import { DeleteDataButton } from "./Initialisation";
import { parseFile } from "../../hooks/import/parse";
import { COLUMNS_DATE_FICHIER2, COLUMNS_HEURE_FICHIER2, FICHIER1_COLUMNS, FICHIER2_COLUMNS, FICHIER3_COLUMNS, type colonneCSV } from "../../types/import/fichier";
import "./import.css"; 
import { UseImages } from "../../hooks/import/UseImages";

function Import() {   
    const [config] = useState({ separator: ',', encoding: 'UTF-8', skipHeader: true });
    const [csv1, setCSV1] = useState<File | null>(null);
    const [csv2, setCSV2] = useState<File | null>(null);
    const [csv3, setCSV3] = useState<File | null>(null);
    const [ver, setVer] = useState<boolean>(false);
    const [zip, setZIP] = useState<File | null>(null);

    const [mes, setMes] = useState("");
    const [error, setError] = useState("");
    const [importing, setImporting] = useState<boolean>(false);

    const { cleanImageMap } = UseImages();
    const Importer = async () => {
        setError("");
        setMes("");

        if (!csv1 && !csv2 && !csv3) {
            setError("Veuillez importer au moins un fichier.");
            return; 
        }

        setImporting(true);

        try {
            let sary;
            if (ver === true) {
                sary = new Map<string, { blob: Blob; fileName: string }>();
                if (zip) {
                    sary = await buildImageMapFromZip(zip);
                    sary = cleanImageMap(sary);
                } 
            } 
            console.log("sary : ", sary);
            
            const [parsedCSV1, parsedCSV2, parsedCSV3] = await Promise.all([
                csv1 ? parseFile<colonneCSV["fichier1"]>(csv1, config.separator, FICHIER1_COLUMNS as unknown as (keyof any)[], [], [], []) : Promise.resolve([]),
                csv2 ? parseFile<colonneCSV["fichier2"]>(csv2, config.separator, FICHIER2_COLUMNS as unknown as (keyof any)[], [...COLUMNS_DATE_FICHIER2], [], [...COLUMNS_HEURE_FICHIER2]) : Promise.resolve([]),
                csv3 ? parseFile<colonneCSV["fichier3"]>(csv3, config.separator, FICHIER3_COLUMNS as unknown as (keyof any)[], [], [], []) : Promise.resolve([]),
            ]);

            if(parsedCSV1) console.log("csv1 : ", parsedCSV1);
            if(parsedCSV2) console.log("csv2 : ", parsedCSV2);
            if(parsedCSV3) console.log("csv3 : ", parsedCSV3);

            setMes("Données importées avec succès !");
        } catch (err: any) {
            setError(`Erreur lors de l'import : ${err.message}`);
        } finally {
            setImporting(false); 
        }
    };

    return (
        <div className="import-container">
            <div className="import-init-zone">
                <DeleteDataButton />
            </div>            
            
            <div className="import-shell">
                <div className="import-grid">
                    <section className="import-card">
                        <h2 className="import-card-title">Fichiers source</h2>
                        
                        {error && (
                            <div className="import-message import-message--error">
                                {error}
                            </div>
                        )}

                        <div className="import-form">
                            <div className="import-field">
                                <label className="import-label" htmlFor="file1">Fichier 1 (CSV)</label>
                                <input
                                    type="file"
                                    id="file1"
                                    accept=".csv"
                                    className="import-file"
                                    onChange={(e) => setCSV1(e.target.files?.[0] || null)}
                                />
                            </div>

                            <div className="import-field">
                                <label className="import-label" htmlFor="file2">Fichier 2 (CSV)</label>
                                <input
                                    type="file"
                                    id="file2"
                                    accept=".csv"
                                    className="import-file"
                                    onChange={(e) => setCSV2(e.target.files?.[0] || null)}
                                />
                            </div>

                            <div className="import-field">
                                <label className="import-label" htmlFor="file3">Fichier 3 (CSV)</label>
                                <input
                                    type="file"
                                    id="file3"
                                    accept=".csv"
                                    className="import-file"
                                    onChange={(e) => setCSV3(e.target.files?.[0] || null)}
                                />
                            </div>

                            <div className="import-field">
                                <label className="import-label" htmlFor="zip1">ZIP images</label>
                                <input
                                    type="file"
                                    id="zip1"
                                    name="zip1"
                                    accept=".zip"
                                    className="import-file"
                                    // disabled={!ver} 
                                    onChange={(e) => setZIP(e.target.files?.[0] || null)}
                                />
                            </div>

                            <div className="import-field-checkbox">
                                <input
                                    type="checkbox"
                                    id="checkBox"
                                    checked={ver}
                                    onChange={(e) => setVer(e.target.checked)}
                                />
                                <label className="import-check-label" htmlFor="checkBox">
                                    Importer les images associées
                                </label>
                            </div>

                            <div className="import-actions">
                                <button 
                                    type="button" 
                                    className="import-button" 
                                    onClick={Importer}
                                    disabled={importing}
                                >
                                    {importing ? "Import en cours..." : "Importer les fichiers"}
                                </button>
                            </div>
                        </div>

                        {mes && (
                            <div className="import-message import-message--success">
                                {mes}
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
}

export default Import;