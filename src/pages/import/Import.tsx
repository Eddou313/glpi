import { useState } from "react";
import { buildImageMapFromZip } from "../../hooks/import/zip";
import {DeleteDataButton} from "./Initialisation";
import { parseFile } from "../../hooks/import/parse";
import { COLUMNS_DATE_FICHIER2, COLUMNS_HEURE_FICHIER2, FICHIER1_COLUMNS, FICHIER2_COLUMNS, FICHIER3_COLUMNS, type colonneCSV } from "../../types/import/fichier";

function Import ()
{   
    const [config] = useState({separator: ',',encoding: 'UTF-8',skipHeader: true});
    const [csv1, setCSV1] = useState<File | null>(null);
    const [csv2, setCSV2] = useState<File | null>(null);
    const [csv3, setCSV3] = useState<File | null>(null);
    const [ver,setVer] = useState <boolean>(false);
    const [zip, setZIP] = useState<File | null>(null);

    const [mes,setMes] = useState("");
    const [error,setError] = useState("");
    const [importing,setImporting] = useState<boolean | null>(null);

    const Importer = async () =>{
        if (!csv1 &&  !csv2 &&  !csv3) {
            setError("Importer au moins une fichier");
            // return;
        }

        try {
            let sary;
            if (ver === true) {
                sary = new Map<string, { blob: Blob; fileName: string }>();
                if (zip) {
                    sary = await buildImageMapFromZip(zip);
                } 
            } 
            const [parsedCSV1, parsedCSV2, parsedCSV3] = await Promise.all([
                csv1 ? parseFile<colonneCSV["fichier1"]>(csv1, config.separator, FICHIER1_COLUMNS as unknown as (keyof any)[], [], [], []) : Promise.resolve([]),
                csv2 ? parseFile<colonneCSV["fichier2"]>(csv2, config.separator, FICHIER2_COLUMNS as unknown as (keyof any)[], [...COLUMNS_DATE_FICHIER2], [], [...COLUMNS_HEURE_FICHIER2]) : Promise.resolve([]),
                csv3 ? parseFile<colonneCSV["fichier3"]>(csv3, config.separator, FICHIER3_COLUMNS as unknown as (keyof any)[], [], [], []) : Promise.resolve([]),
            ]);

            if(parsedCSV1)
            {
                console.log(`csv1 : ${parsedCSV1}`);
            }
            if(parsedCSV2)
            {
                console.log(`csv2 : ${parsedCSV2}`);
            }
            if(parsedCSV3)
            {
                console.log(`csv3 : ${parsedCSV3}`);
            }
            
        } catch (error: any) {
            setError(`Erreur lors de l import : ${error.message}`)
        }

        console.log(`import`);
        setMes("donner importer avec succer!");
        setImporting(true);
        // return;
    };
    return (
        <div>
            <div>
                <DeleteDataButton />
            </div>            
            <div className="import-shell">
                    <div className="import-grid">
                        <section className="import-card">
                            <h2 className="import-card-title">Fichiers source</h2>
                            {error && (
                                <div>
                                    {error}
                                </div>
                            )}
                            {/* <form onSubmit={Importer} className="import-form"> */}
                            <div>
                                <div className="import-field">
                                    <label className="import-label" htmlFor="file1">File 1</label>
                                    <input
                                        type="file"
                                        id="file1"
                                        name="file1"
                                        className="import-file"
                                        onChange={(e) => setCSV1(e.target.files?.[0] || null)}
                                    />
                                </div>

                                <div className="import-field">
                                    <label className="import-label" htmlFor="file2">File 2</label>
                                    <input
                                        type="file"
                                        id="file2"
                                        name="file2"
                                        className="import-file"
                                        onChange={(e) => setCSV2(e.target.files?.[0] || null)}
                                    />
                                </div>

                                <div className="import-field">
                                    <label className="import-label" htmlFor="file3">File 3</label>
                                    <input
                                        type="file"
                                        id="file3"
                                        name="file3"
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
                                        onChange={(e) => setZIP(e.target.files?.[0] || null)}
                                    />
                                </div>

                                <label className="import-check" htmlFor="checkBox">
                                    <input
                                        type="checkbox"
                                        id="checkBox"
                                        checked={ver}
                                        onChange={(e) => setVer(e.target.checked)}
                                    />
                                    Importer les images
                                </label>

                                <div className="import-actions">
                                    <button type="submit" className="import-button" onClick={Importer}>
                                        {importing ? "Import en cours..." : "Importer"}
                                    </button>
                                </div>
                            </div>

                            {mes && (
                                <div className={`import-message ${mes.startsWith("Erreur") ? "import-message--error" : "import-message--success"}`}>
                                    {mes}
                                </div>
                            )}
                        </section>
                    </div>
                </div>
            </div>
    )
}
export default Import;