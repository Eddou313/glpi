import { useState } from "react";
import { parseFile } from "../../hooks/import/parse";
import { FICHIER4_COLUMNS, type colonneCSV } from "../../types/import/fichier";
import { useImportTest } from "../../hooks/import/fichier1_test/features/hooks/useImportFichierTest";
function ImportMvt() {
  const [config] = useState({ separator: ",", encoding: "UTF-8" });
  const [importing,setImporting] = useState(false);
  const [csv1, setCSV1] = useState<File | null>(null);
  const [ver,  setVer]  = useState(false);
  const [error, setError] = useState("");
  const {Importer} = useImportTest();
  const handleImport = async () => {
    setError("");;

    if (!csv1) {
      setError("Veuillez sélectionner au moins un fichier CSV.");
      return;
    }

    try {
      const [rows1] = await Promise.all([
        csv1
          ? parseFile<colonneCSV["fichier4"]>(
              csv1, config.separator,
              FICHIER4_COLUMNS as unknown as (keyof unknown)[],
              [], [], []
            )
          : Promise.resolve([]),
      ]);
      await Importer(rows1 as colonneCSV["fichier4"][],);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="import-container">
      <div className="import-shell">
        <div className="import-grid">

          <section className="import-card">
            <h2 className="import-card-title">Fichiers source</h2>

            {error && (
              <div className="import-message import-message--error">{error}</div>
            )}

            <div className="import-form">
              <FileField id="file1" label="Fichier 1 — Équipements (CSV)" accept=".csv" onChange={setCSV1} />
              <div className="import-actions">
                <button
                  type="button"
                  className="import-button"
                  onClick={handleImport}
                  disabled={importing}
                >
                  {importing ? "Import en cours…" : "Importer les fichiers"}
                </button>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}

interface FileFieldProps {
  id: string; label: string; accept: string;
  onChange: (f: File | null) => void;
}
function FileField({ id, label, accept, onChange }: FileFieldProps) {
  return (
    <div className="import-field">
      <label className="import-label" htmlFor={id}>{label}</label>
      <input type="file" id={id} accept={accept} className="import-file"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)} />
    </div>
  );
}

export default ImportMvt;