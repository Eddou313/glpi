import { useEffect, useMemo, useState } from "react";
import { useSuperOuvertures } from "../../hooks/costs/useSuperOuvertures";
import { type TicketCost, type_cout_mapping } from "../../hooks/costs/useCosts";
import "./super-ouvertures.css";

type BatchRow = {
    key: string;
    firstId: number;
    ticket_id: number;
    type_cout: number;
    group: string;
    totalCost: number;
    percentage: number;
    mode_ouverture: number | null;
    count: number;
};

type EditState = {
    row: BatchRow;
    cost: string;
    percentage: string;
    modeOuverture: string;
};

function formatNumber(value: number) {
    return value.toLocaleString("fr-FR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function getTypeLabel(typeCout: number) {
    if (typeCout === type_cout_mapping.SUPER_COST) return "Supercost";
    if (typeCout === type_cout_mapping.OUVERTURE) return "Reouverture";
    return "Inconnu";
}

function buildBatchRows(rows: TicketCost[]) {
    const map = new Map<string, BatchRow>();

    for (const row of rows) {
        if (!row.id) continue;

        const group = row.group || "";
        const key = `${row.ticket_id}-${row.type_cout}-${group}`;
        const existing = map.get(key);

        if (!existing) {
            map.set(key, {
                key,
                firstId: row.id,
                ticket_id: row.ticket_id,
                type_cout: row.type_cout,
                group,
                totalCost: Number(row.cost || 0),
                percentage: Number(row.percentage || 0),
                mode_ouverture: row.mode_ouverture || null,
                count: 1,
            });
            continue;
        }

        existing.totalCost += Number(row.cost || 0);
        existing.count += 1;
        existing.firstId = Math.min(existing.firstId, row.id);

        if (row.type_cout === type_cout_mapping.OUVERTURE) {
            existing.percentage = Number(row.percentage || existing.percentage || 0);
            existing.mode_ouverture = row.mode_ouverture || existing.mode_ouverture;
        }
    }

    return Array.from(map.values()).sort((a, b) => {
        if (a.ticket_id !== b.ticket_id) return a.ticket_id - b.ticket_id;
        if (a.group !== b.group) return a.group.localeCompare(b.group);
        return a.type_cout - b.type_cout;
    });
}

export function SuperOuverturePage() {
    const { rows, loading, error, refresh, update, remove } = useSuperOuvertures();
    const [edit, setEdit] = useState<EditState | null>(null);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const batchRows = useMemo(() => buildBatchRows(rows), [rows]);

    const openEdit = (row: BatchRow) => {
        setEdit({
            row,
            cost: String(row.totalCost || 0),
            percentage: String(row.percentage || 0),
            modeOuverture: String(row.mode_ouverture || 1),
        });
    };

    const closeEdit = () => setEdit(null);

    const submitEdit = async () => {
        if (!edit) return;

        await update(
            edit.row.firstId,
            Number(edit.cost),
            Number(edit.percentage),
            edit.row.type_cout === type_cout_mapping.OUVERTURE
                ? Number(edit.modeOuverture || 1)
                : null
        );

        setEdit(null);
    };

    const deleteBatch = async (row: BatchRow) => {
        const ok = window.confirm(`Supprimer definitivement ${getTypeLabel(row.type_cout)} du ticket #${row.ticket_id} ?`);
        if (!ok) return;

        await remove(row.firstId);
    };

    return (
        <div className="super-openings-page">
            <div className="super-openings-header">
                <div>
                    <h1>Liste des reouvertures et supercosts</h1>
                    <p>Vue regroupee par ticket, type et batch.</p>
                </div>

                <button className="super-openings-refresh" onClick={refresh} disabled={loading}>
                    Actualiser
                </button>
            </div>

            {loading && <p className="super-openings-message">Chargement...</p>}
            {error && <p className="super-openings-error">{error}</p>}

            <div className="super-openings-table-wrap">
                <table className="super-openings-table">
                    <thead>
                        <tr>
                            <th>Ticket</th>
                            <th>Type</th>
                            <th>Group</th>
                            <th>Nombre lignes</th>
                            <th>Cout total</th>
                            <th>Pourcentage</th>
                            <th>Mode ouverture</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {batchRows.map((row) => {
                            const isOuverture = row.type_cout === type_cout_mapping.OUVERTURE;

                            return (
                                <tr key={row.key}>
                                    <td className="super-openings-id">#{row.ticket_id}</td>
                                    <td>
                                        <span className={isOuverture ? "super-openings-badge super-openings-badge--open" : "super-openings-badge"}>
                                            {getTypeLabel(row.type_cout)}
                                        </span>
                                    </td>
                                    <td>{row.group || "-"}</td>
                                    <td>{row.count}</td>
                                    <td className="super-openings-number">{formatNumber(row.totalCost)}</td>
                                    <td className="super-openings-number">{isOuverture ? `${formatNumber(row.percentage)} %` : "-"}</td>
                                    <td>{isOuverture ? row.mode_ouverture || 1 : "-"}</td>
                                <td>
                                    <div className="super-openings-actions">
                                        <button className="super-openings-edit" onClick={() => openEdit(row)}>Modifier</button>
                                        <button className="super-openings-delete" onClick={() => deleteBatch(row)}>Supprimer</button>
                                    </div>
                                </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {edit && (
                <div
                    className="super-openings-modal-overlay"
                    onClick={closeEdit}
                >
                    <div className="super-openings-modal" onClick={(event) => event.stopPropagation()}>
                        <div className="super-openings-modal-header">
                            <h2>Modifier {getTypeLabel(edit.row.type_cout)}</h2>
                            <button className="super-openings-modal-close" onClick={closeEdit}>x</button>
                        </div>

                        <div className="super-openings-field">
                            <label>Valeur totale</label>
                            <input
                                type="number"
                                value={edit.cost}
                                onChange={(event) => setEdit({ ...edit, cost: event.target.value })}
                            />
                        </div>

                        {edit.row.type_cout === type_cout_mapping.OUVERTURE && (
                            <>
                                <div className="super-openings-field">
                                    <label>Pourcentage</label>
                                    <input
                                        type="number"
                                        value={edit.percentage}
                                        onChange={(event) => setEdit({ ...edit, percentage: event.target.value })}
                                    />
                                </div>

                                <div className="super-openings-field">
                                    <label>Mode ouverture</label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={4}
                                        value={edit.modeOuverture}
                                        onChange={(event) => setEdit({ ...edit, modeOuverture: event.target.value })}
                                    />
                                </div>
                            </>
                        )}

                        <div className="super-openings-modal-actions">
                            <button className="super-openings-save" onClick={submitEdit}>Valider</button>
                            <button className="super-openings-cancel" onClick={closeEdit}>Annuler</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SuperOuverturePage;
