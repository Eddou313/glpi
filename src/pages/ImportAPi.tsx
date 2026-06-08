// import { useMemo, useState } from 'react';
// import JSZip from 'jszip';
// import { parseFile } from '../hooks/import/parse';
// import {
//   FICHIER1_COLUMNS,
//   FICHIER2_COLUMNS,
//   FICHIER3_COLUMNS,
//   COLUMNS_DATE_FICHIER2,
//   COLUMNS_HEURE_FICHIER2,
//   type colonneCSV,
// } from '../types/import/fichier';
// import { importApi, type ImportPlan } from '../api/import';
// import './import/import.css';

// const separator = ',';

// const toRows = <T extends Record<string, unknown>>(rows: T[]) =>
//   rows.map((values, index) => ({
//     rowNumber: index + 1,
//     values,
//   }));

// function normalizeText(value: string): string {
//   return value.trim().toLowerCase();
// }

// function normalizeZipKey(fileName: string): string {
//   const baseName = fileName.split(/[\\/]/).pop() || fileName;
//   const stem = baseName.replace(/\.[^.]+$/, '');
//   return normalizeText(stem);
// }

// export default function ImportApiPage() {
//   const [csv1, setCsv1] = useState<File | null>(null);
//   const [csv2, setCsv2] = useState<File | null>(null);
//   const [csv3, setCsv3] = useState<File | null>(null);
//   const [zip, setZip] = useState<File | null>(null);
//   const [loading, setLoading] = useState(false);
//   const [success, setSuccess] = useState('');
//   const [error, setError] = useState('');
//   const [result, setResult] = useState<unknown>(null);

//   const canSendZip = useMemo(() => Boolean(zip), [zip]);

//   const handleImportJson = async () => {
//     setLoading(true);
//     setSuccess('');
//     setError('');
//     setResult(null);

//     try {
//       const [rows1, rows2, rows3] = await Promise.all([
//         csv1
//           ? parseFile<colonneCSV['fichier1']>(
//               csv1,
//               separator,
//               FICHIER1_COLUMNS as unknown as string[],
//               [],
//               [],
//               []
//             )
//           : Promise.resolve([]),
//         csv2
//           ? parseFile<colonneCSV['fichier2']>(
//               csv2,
//               separator,
//               FICHIER2_COLUMNS as unknown as string[],
//               [...COLUMNS_DATE_FICHIER2],
//               [],
//               [...COLUMNS_HEURE_FICHIER2]
//             )
//           : Promise.resolve([]),
//         csv3
//           ? parseFile<colonneCSV['fichier3']>(
//               csv3,
//               separator,
//               FICHIER3_COLUMNS as unknown as string[],
//               [],
//               [],
//               []
//             )
//           : Promise.resolve([]),
//       ]);

//       const importPlan: ImportPlan = {
//         parsedFiles: {
//           fichier1: { rows: toRows(rows1) },
//           fichier2: { rows: toRows(rows2) },
//           fichier3: { rows: toRows(rows3) },
//         },
//         extractedEntities: {},
//         documentPayloads: [],
//       };

//       const response = await importApi.runTransactionalImport(importPlan);
//       setResult(response.data);
//       setSuccess('Import JSON envoyé au backend avec succès.');
//     } catch (err) {
//       setError(err instanceof Error ? err.message : String(err));
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleImportWithZip = async () => {
//     setLoading(true);
//     setSuccess('');
//     setError('');
//     setResult(null);

//     try {
//       const [rows1, rows2, rows3] = await Promise.all([
//         csv1
//           ? parseFile<colonneCSV['fichier1']>(
//               csv1,
//               separator,
//               FICHIER1_COLUMNS as unknown as string[],
//               [],
//               [],
//               []
//             )
//           : Promise.resolve([]),
//         csv2
//           ? parseFile<colonneCSV['fichier2']>(
//               csv2,
//               separator,
//               FICHIER2_COLUMNS as unknown as string[],
//               [...COLUMNS_DATE_FICHIER2],
//               [],
//               [...COLUMNS_HEURE_FICHIER2]
//             )
//           : Promise.resolve([]),
//         csv3
//           ? parseFile<colonneCSV['fichier3']>(
//               csv3,
//               separator,
//               FICHIER3_COLUMNS as unknown as string[],
//               [],
//               [],
//               []
//             )
//           : Promise.resolve([]),
//       ]);

//       const documentPayloads: ImportPlan['documentPayloads'] = [];
//       const formData = new FormData();

//       if (zip) {
//         const zipInstance = await JSZip.loadAsync(zip);
//         const entries = Object.values(zipInstance.files).filter((entry) => !entry.dir);

//         for (const entry of entries) {
//           const ext = entry.name.split('.').pop()?.toLowerCase() || '';
//           if (!['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp'].includes(ext)) {
//             continue;
//           }

//           const fileName = entry.name.split(/[\\/]/).pop() || entry.name;
//           const stem = fileName.replace(/\.[^.]+$/, '');
//           const fieldName = `doc_${normalizeZipKey(fileName)}_${documentPayloads.length}`;

//           const buffer = await entry.async('blob');
//           const mimeType =
//             ext === 'png' ? 'image/png' :
//             ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' :
//             ext === 'webp' ? 'image/webp' :
//             ext === 'gif' ? 'image/gif' :
//             'application/octet-stream';

//           documentPayloads.push({
//             fieldName,
//             fileName,
//             assetName: stem,
//             mimeType,
//             size: buffer.size,
//           });

//           formData.append(fieldName, new File([buffer], fileName, { type: mimeType }));
//         }
//       }

//       const importPlan: ImportPlan = {
//         parsedFiles: {
//           fichier1: { rows: toRows(rows1) },
//           fichier2: { rows: toRows(rows2) },
//           fichier3: { rows: toRows(rows3) },
//         },
//         extractedEntities: {},
//         documentPayloads,
//       };

//       formData.append('importPlan', JSON.stringify(importPlan));

//       const response = await importApi.runTransactionalImportStream(formData);
//       setResult(response.data);
//       setSuccess('Import ZIP envoyé au backend avec succès.');
//     } catch (err) {
//       setError(err instanceof Error ? err.message : String(err));
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="import-container">
//       <section className="import-card">
//         <h2 className="import-card-title">Import via API Express</h2>

//         {error && <div className="import-message import-message--error">{error}</div>}
//         {success && <div className="import-message import-message--success">{success}</div>}

//         <div className="import-form">
//           <div className="import-field">
//             <label className="import-label" htmlFor="file1">Fichier 1 (CSV)</label>
//             <input
//               type="file"
//               id="file1"
//               accept=".csv"
//               className="import-file"
//               onChange={(e) => setCsv1(e.target.files?.[0] ?? null)}
//             />
//           </div>

//           <div className="import-field">
//             <label className="import-label" htmlFor="file2">Fichier 2 (CSV)</label>
//             <input
//               type="file"
//               id="file2"
//               accept=".csv"
//               className="import-file"
//               onChange={(e) => setCsv2(e.target.files?.[0] ?? null)}
//             />
//           </div>

//           <div className="import-field">
//             <label className="import-label" htmlFor="file3">Fichier 3 (CSV)</label>
//             <input
//               type="file"
//               id="file3"
//               accept=".csv"
//               className="import-file"
//               onChange={(e) => setCsv3(e.target.files?.[0] ?? null)}
//             />
//           </div>

//           <div className="import-field">
//             <label className="import-label" htmlFor="zip">ZIP images</label>
//             <input
//               type="file"
//               id="zip"
//               accept=".zip"
//               className="import-file"
//               onChange={(e) => setZip(e.target.files?.[0] ?? null)}
//             />
//           </div>

//           <div className="import-actions" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
//             <button
//               type="button"
//               className="import-button"
//               onClick={handleImportJson}
//               disabled={loading}
//             >
//               {loading ? 'Import en cours...' : 'Importer sans ZIP'}
//             </button>

//             <button
//               type="button"
//               className="import-button"
//               onClick={handleImportWithZip}
//               disabled={loading || !canSendZip}
//             >
//               {loading ? 'Import ZIP en cours...' : 'Importer avec ZIP'}
//             </button>
//           </div>
//         </div>

//         {/* {result && (
//           <pre className="import-result" style={{ marginTop: '1rem', whiteSpace: 'pre-wrap' }}>
//             {JSON.stringify(result, null, 2)}
//           </pre>
//         )} */}
//       </section>
//     </div>
//   );
// }