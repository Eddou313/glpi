import { useEffect, useState } from "react";
import { useSuperOuvertures } from "../../hooks/costs/useSuperOuvertures";
import { type TicketCost, type_cout_mapping } from "../../hooks/costs/useCosts";

type EditState = {
    id: number;
    cost: string;
    percentage: string;
    modeOuverture: string;
};

const formatNumber = (value: number) =>
    value.toLocaleString("fr-FR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

const getTypeLabel = (type: number) => {
    if (type === type_cout_mapping.SUPER_COST) return "Supercost";
    if (type === type_cout_mapping.OUVERTURE) return "Ouverture";
    return "GLPI";
};

const getInitialPercentage = (row: TicketCost) => {
    if (row.type_cout === type_cout_mapping.SUPER_COST) return "100";
    return String(row.percentage || 0);
};

export function SuperOuverturePage() {
    const { rows, loading, error, refresh, update, removeOuverture } = useSuperOuvertures();
    const [edit, setEdit] = useState<EditState | null>(null);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const startEdit = (row: TicketCost) => {
        if (!row.id) return;

        setEdit({
            id: row.id,
            cost: String(row.cost || 0),
            percentage: getInitialPercentage(row),
            modeOuverture: String(row.mode_ouverture || 1),
        });
    };

    const submitEdit = async () => {
        if (!edit) return;

        await update(
            edit.id,
            Number(edit.cost),
            Number(edit.percentage),
            edit.modeOuverture ? Number(edit.modeOuverture) : null
        );

        setEdit(null);
    };

    const patchEdit = (patch: Partial<EditState>) => {
        setEdit((current) => current ? { ...current, ...patch } : current);
    };

    const deleteOuverture = async (row: TicketCost) => {
        if (!row.id || row.type_cout !== type_cout_mapping.OUVERTURE) return;
        if (!window.confirm("Supprimer cette ouverture ?")) return;

        await removeOuverture(row.id);
    };

    return (
        <div>
            <h1>Liste des ouvertures et supercosts</h1>
{/* 
            <button onClick={refresh} disabled={loading}>
                Actualiser
            </button>

            {loading && <p>Chargement...</p>}
            {error && <p>{error}</p>} */}

            <table border={1} cellPadding={8} cellSpacing={0}>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Ticket</th>
                        <th>Type</th>
                        <th>Categorie</th>
                        <th>Item</th>
                        <th>Valeur</th>
                        <th>Pourcentage</th>
                        <th>Mode ouverture</th>
                        <th>Groupe</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => {
                        const isEdit = edit?.id === row.id;
                        const isOuverture = row.type_cout === type_cout_mapping.OUVERTURE;

                        return (
                            <tr key={row.id}>
                                <td>{row.id}</td>
                                <td>{row.ticket_id}</td>
                                <td>{getTypeLabel(row.type_cout)}</td>
                                <td>{row.category || "-"}</td>
                                <td>{row.id_items || "-"}</td>
                                <td>
                                    {isEdit ? (
                                        <input
                                            type="number"
                                            value={edit!.cost}
                                            onChange={(e) => patchEdit({ cost: e.target.value })}
                                        />
                                    ) : (
                                        formatNumber(row.cost)
                                    )}
                                </td>
                                <td>
                                    {isEdit ? (
                                        <input
                                            type="number"
                                            value={edit!.percentage}
                                            disabled={!isOuverture}
                                            onChange={(e) => patchEdit({ percentage: e.target.value })}
                                        />
                                    ) : (
                                        `${formatNumber(row.percentage || (isOuverture ? 0 : 100))}%`
                                    )}
                                </td>
                                <td>
                                    {isEdit && isOuverture ? (
                                        <input
                                            type="number"
                                            min={1}
                                            max={4}
                                            value={edit!.modeOuverture}
                                            onChange={(e) => patchEdit({ modeOuverture: e.target.value })}
                                        />
                                    ) : (
                                        row.mode_ouverture || "-"
                                    )}
                                </td>
                                <td>{row.group || "-"}</td>
                                <td>
                                    {isEdit ? (
                                        <>
                                            <button onClick={submitEdit}>Valider</button>
                                            <button onClick={() => setEdit(null)}>Annuler</button>
                                        </>
                                    ) : (
                                        <>
                                            <button onClick={() => startEdit(row)}>Modifier</button>
                                            {isOuverture && (
                                                <button onClick={() => deleteOuverture(row)}>
                                                    Supprimer
                                                </button>
                                            )}
                                        </>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

export default SuperOuverturePage;
