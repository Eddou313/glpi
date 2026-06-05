import { useState } from "react";

function Import ()
{
    const [csv1, setCSV1] = useState<File | null>(null);
    const [csv2, setCSV2] = useState<File | null>(null);
    const [csv3, setCSV3] = useState<File | null>(null);
    const [ver,setVer] = useState <boolean>(false);
    const [zip, setZIP] = useState<File | null>(null);

    const [mes,setMes] = useState("");
    const [importing,setImporting] = useState<boolean | null>(null);
    const Importer = async () =>{
        console.log(`import`);
        setMes("donner importer avec succer!");
        setImporting(true);
    };
    return (
        <div className="import-shell">
                <div className="import-grid">
                    <section className="import-card">
                        <h2 className="import-card-title">Fichiers source</h2>
                        <form onSubmit={Importer} className="import-form">
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
                                <button type="submit" className="import-button">
                                    {importing ? "Import en cours..." : "Importer"}
                                </button>
                            </div>
                        </form>

                        {mes && (
                            <div className={`import-message ${mes.startsWith("Erreur") ? "import-message--error" : "import-message--success"}`}>
                                {mes}
                            </div>
                        )}
                    </section>
                </div>
            </div>
    )
}
export default Import;