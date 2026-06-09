import { useState } from "react";
import { buildImageMapFromZip } from "../../zip";
import { DeleteDataButton }     from "../../../../pages/import/Initialisation";
import { parseFile }            from "../../parse";
import { UseImages }            from "../../UseImages";
import { useImport }            from "./useImport";
import { ImportResultTable }    from "./importResultTables";
import { ImportSummaryBar }     from "./importsummarybar";
import {
  FICHIER1_COLUMNS,
  FICHIER2_COLUMNS,
  FICHIER3_COLUMNS,
  COLUMNS_DATE_FICHIER2,
  COLUMNS_HEURE_FICHIER2,
  type colonneCSV,
} from "../../../../types/import/fichier";
import "./import.css";

function Import() {
  const [config] = useState({ separator: ",", encoding: "UTF-8" });

  const [csv1, setCSV1] = useState<File | null>(null);
  const [csv2, setCSV2] = useState<File | null>(null);
  const [csv3, setCSV3] = useState<File | null>(null);
  const [zip,  setZIP]  = useState<File | null>(null);
  const [ver,  setVer]  = useState(false);
  const [error, setError] = useState("");

  const { cleanImageMap } = UseImages();
  const { importing, currentFile, liveResults, summaries, run, reset } = useImport();

  const handleImport = async () => {
    setError("");
    reset();

    if (!csv1 && !csv2 && !csv3) {
      setError("Veuillez sélectionner au moins un fichier CSV.");
      return;
    }

    try {
      let imageMap: Map<string, { blob: Blob; fileName: string }> | undefined;
      if (ver && zip) {
        imageMap = cleanImageMap(await buildImageMapFromZip(zip));
        console.log("ImageMap prête :", imageMap);
      }

      const [rows1, rows2, rows3] = await Promise.all([
        csv1
          ? parseFile<colonneCSV["fichier1"]>(
              csv1, config.separator,
              FICHIER1_COLUMNS as unknown as (keyof unknown)[],
              [], [], []
            )
          : Promise.resolve([]),
        csv2
          ? parseFile<colonneCSV["fichier2"]>(
              csv2, config.separator,
              FICHIER2_COLUMNS as unknown as (keyof unknown)[],
              [...COLUMNS_DATE_FICHIER2], [], [...COLUMNS_HEURE_FICHIER2]
            )
          : Promise.resolve([]),
        csv3
          ? parseFile<colonneCSV["fichier3"]>(
              csv3, config.separator,
              FICHIER3_COLUMNS as unknown as (keyof unknown)[],
              [], [], []
            )
          : Promise.resolve([]),
      ]);

      await run({
        rows1:    rows1 as colonneCSV["fichier1"][],
        rows2:    rows2 as colonneCSV["fichier2"][],
        rows3:    rows3 as colonneCSV["fichier3"][],
        imageMap,  
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
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
              <div className="import-message import-message--error">{error}</div>
            )}

            <div className="import-form">
              <FileField id="file1" label="Fichier 1 — Équipements (CSV)" accept=".csv" onChange={setCSV1} />
              <FileField id="file2" label="Fichier 2 — Tickets (CSV)"     accept=".csv" onChange={setCSV2} />
              <FileField id="file3" label="Fichier 3 — Coûts tickets (CSV)" accept=".csv" onChange={setCSV3} />
              <FileField id="zip1"  label="ZIP images"                    accept=".zip" onChange={setZIP} />

              <div className="import-field-checkbox">
                <input
                  type="checkbox" id="checkBox"
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
                  onClick={handleImport}
                  disabled={importing}
                >
                  {importing ? "Import en cours…" : "Importer les fichiers"}
                </button>
              </div>
            </div>
          </section>

          {(liveResults.length > 0 || summaries.length > 0 || currentFile) && (
            <section className="import-card">
              <h2 className="import-card-title">Résultats GLPI</h2>
              <ImportSummaryBar summaries={summaries} currentFile={currentFile} />
              <ImportResultTable results={liveResults} />
            </section>
          )}

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

export default Import;