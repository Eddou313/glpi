import { useState } from "react";
import { parseFile } from "../../hooks/import/parse";
import { FICHIER4_COLUMNS, type colonneCSV } from "../../types/import/fichier";
import { useImportTest } from "../../hooks/import/fichier1_test/features/hooks/useImportFichierTest";
export const mvtExistant: Record<string, string> = {
  "open": "open",
  "cancel": "cancel",
  "closed": "closed",
}
function ImportMvt() {
  const [config] = useState({ separator: ",", encoding: "UTF-8" });
  const [importing, setImporting] = useState(false);
  const [csv1, setCSV1] = useState<File | null>(null);

  const [donnerManuel, setDonnerManuel] = useState<colonneCSV["fichier4"][]>([]);

  const [inputTicket, setInputTicket] = useState("");
  const [inputMvt, setInputMvt] = useState("open");
  const [inputValeur, setInputValeur] = useState<number | "">("");

  const [ver, setVer] = useState(false);
  const [error, setError] = useState("");
  const { Importer } = useImportTest();
  const handleResetManuel = () => {
    setDonnerManuel([]);
    setError("");
  };
  const handleAddManuel = () => {
    setError("");

    if (!inputTicket || !inputMvt || inputValeur === "") {
      setError("Veuillez remplir tous les champs de la saisie manuelle.");
      return;
    }

    const nouvelleLigne: colonneCSV["fichier4"] = {
      Tickets: inputTicket,
      mvt: inputMvt,
      valeur: Number(inputValeur),
    };

    setDonnerManuel((prev) => [...prev, nouvelleLigne]);
    setInputTicket("");
    setInputMvt("open");
    setInputValeur("");
  };

  const handleImport = async () => {
    setError("");
    setImporting(true);

    if (!csv1 && donnerManuel.length === 0) {
      setError("Veuillez sélectionner un fichier CSV ou ajouter des données manuelles.");
      setImporting(false);
      return;
    }

    try {
      if (donnerManuel.length > 0) {
        await Importer(donnerManuel);
      }
      if (csv1) {
        const [rows1] = await Promise.all([
          parseFile<colonneCSV["fichier4"]>(
            csv1,
            config.separator,
            FICHIER4_COLUMNS as unknown as (keyof unknown)[],
            [], [], []
          ),
        ]);

        await Importer(rows1);
      }
      setDonnerManuel([]);

    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setImporting(false);
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
              {/* <div style={{ marginBottom: "20px", borderBottom: "1px solid #ccc", paddingBottom: "20px" }}>
                <h2>Saisie manuelle</h2>

                <div style={{ display: "flex", gap: "10px", marginBottom: "10px", flexDirection: "column" }}>
                  <div>
                    <label style={{ display: "block" }}>Tickets :</label>
                    <input
                      type="text"
                      value={inputTicket}
                      onChange={(e) => setInputTicket(e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block" }}>Mvt :</label>
                    <select
                      value={inputMvt}
                      onChange={(e) => setInputMvt(e.target.value)}
                    >
                      {Object.entries(mvtExistant).map(([key, value]) => (
                        <option key={key} value={value}>
                          {key}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block" }}>Valeur :</label>
                    <input
                      type="number"
                      value={inputValeur}
                      onChange={(e) => setInputValeur(e.target.value !== "" ? Number(e.target.value) : "")}
                    />
                  </div>

                  <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                    <button type="button" onClick={handleAddManuel} style={{ alignSelf: "flex-start" }} > Ajouter à la liste </button>
                    <button type="button" onClick={handleResetManuel} > Initialiser la liste </button>
                  </div>
                </div>

                {donnerManuel.length > 0 && (
                  <div>
                    <h4>Données manuelles à importer ({donnerManuel.length}) :</h4>
                    {JSON.stringify(donnerManuel, null, 2)};
                  </div>
                )}
              </div> */}

              <FileField id="file1" label="Fichier 1 — Équipements (CSV)" accept=".csv,.txt" onChange={setCSV1} />

              <div className="import-actions">
                <button
                  type="button"
                  className="import-button"
                  onClick={handleImport}
                  disabled={importing}
                >
                  {importing ? "Import en cours…" : "Importer les données"}
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
  id: string;
  label: string;
  accept: string;
  onChange: (f: File | null) => void;
}

function FileField({ id, label, accept, onChange }: FileFieldProps) {
  return (
    <div className="import-field">
      <label className="import-label" htmlFor={id}>{label}</label>
      <input
        type="file"
        id={id}
        accept={accept}
        className="import-file"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}

export default ImportMvt;