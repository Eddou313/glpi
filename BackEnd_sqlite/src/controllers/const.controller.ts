import type { Request, Response } from 'express';
import db from '../db/db.ts';

const TYPE_COUT = {
    GLPI: 1,
    SUPER_COST: 2,
    OUVERTURE: 3,
} as const;

type CostRow = {
    id: number;
    ticket_id: number;
    cost: number;
    id_items: number | null;
    category: string | null;
    type_cout: number;
    is_deleted?: boolean | number;
    group: string | null;
    percentage?: number | null;
    mode_ouverture?: number | null;
};

const COST_SELECT = `
    SELECT id, ticket_id, cost, id_items, category, type_cout, is_deleted,
           "group", percentage, mode_ouverture
    FROM cost
`;

function getNumber(value: unknown, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function getNullableNumber(value: unknown) {
    if (value === null || value === undefined || value === '') return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
}

function getBatch(value: string | null) {
    return value || '';
}

function getRowsByBatch(ticketId: number, typeCout: number, group: string | null) {
    return db.prepare(`
        ${COST_SELECT}
        WHERE ticket_id = ?
          AND type_cout = ?
          AND COALESCE("group", '') = COALESCE(?, '')
          AND COALESCE(is_deleted, false) = false
        ORDER BY id ASC
    `).all(ticketId, typeCout, group) as CostRow[];
}

function distributeBatchCost(rows: CostRow[], totalCost: number) {
    if (rows.length === 0) return;

    const costByRow = totalCost / rows.length;
    const update = db.prepare(`UPDATE cost SET cost = ? WHERE id = ?`);

    for (const row of rows) {
        update.run(costByRow, row.id);
    }
}

function getSuperCostGroupCount(ticketId: number) {
    const row = db.prepare(`
        SELECT COUNT(*) AS total
        FROM (
            SELECT COALESCE("group", id) AS group_key
            FROM cost
            WHERE ticket_id = ?
              AND type_cout = ?
              AND COALESCE(is_deleted, false) = false
            GROUP BY COALESCE("group", id)
        )
    `).get(ticketId, TYPE_COUT.SUPER_COST) as { total?: number } | undefined;

    return Math.max(Number(row?.total || 1), 1);
}

function getSuperCostBase(ticketId: number, mode: number, totalItems: number, ouvertureGroup?: string | null) {
    const limit = Math.max(totalItems, 1);
    const groupLimit = getBatch(ouvertureGroup || null);
    const groupFilter = groupLimit
        ? 'AND COALESCE("group", \'\') <= ?'
        : '';
    const groupParams = groupLimit ? [groupLimit] : [];

    if (mode === 2) {
        const rows = db.prepare(`
            SELECT cost
            FROM cost
            WHERE ticket_id = ?
              AND type_cout = ?
              AND COALESCE(is_deleted, false) = false
              ${groupFilter}
            ORDER BY COALESCE("group", '') ASC, id ASC
            LIMIT ?
        `).all(ticketId, TYPE_COUT.SUPER_COST, ...groupParams, limit) as CostRow[];

        return rows.reduce((sum, row) => sum + Number(row.cost || 0), 0);
    }

    if (mode === 3) {
        const row = db.prepare(`
            SELECT SUM(cost) AS total
            FROM cost
            WHERE ticket_id = ?
              AND type_cout = ?
              AND COALESCE(is_deleted, false) = false
              ${groupFilter}
        `).get(ticketId, TYPE_COUT.SUPER_COST, ...groupParams) as { total?: number } | undefined;

        const countRow = db.prepare(`
            SELECT COUNT(*) AS total
            FROM (
                SELECT COALESCE("group", id) AS group_key
                FROM cost
                WHERE ticket_id = ?
                  AND type_cout = ?
                  AND COALESCE(is_deleted, false) = false
                  ${groupFilter}
                GROUP BY COALESCE("group", id)
            )
        `).get(ticketId, TYPE_COUT.SUPER_COST, ...groupParams) as { total?: number } | undefined;

        return Number(row?.total || 0) / Math.max(Number(countRow?.total || 1), 1);
    }

    if (mode === 4) {
        const row = db.prepare(`
            SELECT SUM(cost) AS total
            FROM cost
            WHERE ticket_id = ?
              AND type_cout = ?
              AND COALESCE(is_deleted, false) = false
              ${groupFilter}
        `).get(ticketId, TYPE_COUT.SUPER_COST, ...groupParams) as { total?: number } | undefined;

        return Number(row?.total || 0);
    }

    const rows = db.prepare(`
        SELECT cost
        FROM cost
        WHERE ticket_id = ?
          AND type_cout = ?
          AND COALESCE(is_deleted, false) = false
          ${groupFilter}
        ORDER BY COALESCE("group", '') DESC, id DESC
        LIMIT ?
    `).all(ticketId, TYPE_COUT.SUPER_COST, ...groupParams, limit) as CostRow[];

    return rows.reduce((sum, row) => sum + Number(row.cost || 0), 0);
}

function recalculateOuvertureGroup(ticketId: number, group: string | null) {
    const ouvertures = db.prepare(`
        ${COST_SELECT}
        WHERE ticket_id = ?
          AND type_cout = ?
          AND COALESCE("group", '') = COALESCE(?, '')
          AND COALESCE(is_deleted, false) = false
        ORDER BY id ASC
    `).all(ticketId, TYPE_COUT.OUVERTURE, group) as CostRow[];

    if (ouvertures.length === 0) return;

    const first = ouvertures[0]!;
    const percentage = Number(first.percentage || 0);
    const mode = Number(first.mode_ouverture || 1);
    const base = getSuperCostBase(ticketId, mode, ouvertures.length, first.group);
    const totalOuverture = (percentage * base) / 100;
    const costByItem = totalOuverture / Math.max(ouvertures.length, 1);

    const update = db.prepare(`UPDATE cost SET cost = ? WHERE id = ?`);
    for (const ouverture of ouvertures) {
        update.run(costByItem, ouverture.id);
    }
}

function recalculateOuverturesForTicket(ticketId: number) {
    const groups = db.prepare(`
        SELECT COALESCE("group", '') AS group_key
        FROM cost
        WHERE ticket_id = ?
          AND type_cout = ?
          AND COALESCE(is_deleted, false) = false
        GROUP BY COALESCE("group", '')
    `).all(ticketId, TYPE_COUT.OUVERTURE) as Array<{ group_key: string }>;

    for (const row of groups) {
        recalculateOuvertureGroup(ticketId, row.group_key || null);
    }
}

function recalculateOuverturesAfterGroup(ticketId: number, group: string | null) {
    const groupStart = getBatch(group);
    const rows = db.prepare(`
        SELECT COALESCE("group", '') AS group_key
        FROM cost
        WHERE ticket_id = ?
          AND type_cout = ?
          AND COALESCE(is_deleted, false) = false
          AND COALESCE("group", '') >= ?
        GROUP BY COALESCE("group", '')
        ORDER BY COALESCE("group", '') ASC
    `).all(ticketId, TYPE_COUT.OUVERTURE, groupStart) as Array<{ group_key: string }>;

    for (const row of rows) {
        recalculateOuvertureGroup(ticketId, row.group_key || null);
    }
}

function listSuperCostsAndOuvertures() {
    return db.prepare(`
        ${COST_SELECT}
        WHERE type_cout IN (?, ?)
          AND COALESCE(is_deleted, false) = false
        ORDER BY ticket_id ASC, id ASC
    `).all(TYPE_COUT.SUPER_COST, TYPE_COUT.OUVERTURE);
}

export const getAllCost = (req: Request, res: Response) => {
    try {
        const costs = db.prepare(`
            ${COST_SELECT}
            WHERE COALESCE(is_deleted, false) = false
            ORDER BY id DESC
        `).all();

        res.json(costs);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getCostTickets = (req: Request, res: Response) => {
    const ticket_id = Number(req.params.ticket_id);
    const type_cout = Number(req.query.type_cout);
    const nbrItems = Number(req.query.nbrItems);

    try {
        if (isNaN(ticket_id) || isNaN(type_cout)) {
            return res.status(400).json({ error: "L'identifiant du ticket ou le type de cout est invalide." });
        }

        const cost = db.prepare(`
            SELECT *
            FROM cost
            WHERE ticket_id = ?
              AND type_cout = ?
              AND COALESCE(is_deleted, false) = false
            ORDER BY id DESC
            LIMIT ?
        `).all(ticket_id, type_cout, nbrItems);

        res.json(cost || []);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getCostTicketsPremier = (req: Request, res: Response) => {
    const ticket_id = Number(req.params.ticket_id);
    const type_cout = Number(req.query.type_cout);
    const nbrItems = Number(req.query.nbrItems);

    try {
        if (isNaN(ticket_id) || isNaN(type_cout)) {
            return res.status(400).json({ error: "L'identifiant du ticket ou le type de cout est invalide." });
        }

        const cost = db.prepare(`
            SELECT *
            FROM cost
            WHERE ticket_id = ?
              AND type_cout = ?
              AND COALESCE(is_deleted, false) = false
            ORDER BY id ASC
            LIMIT ?
        `).all(ticket_id, type_cout, nbrItems);

        res.json(cost || []);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getCostTicketsAll = (req: Request, res: Response) => {
    const ticket_id = Number(req.params.ticket_id);
    const type_cout = Number(req.query.type_cout);

    try {
        if (isNaN(ticket_id) || isNaN(type_cout)) {
            return res.status(400).json({ error: "L'identifiant du ticket ou le type de cout est invalide." });
        }

        const cost = db.prepare(`
            SELECT *
            FROM cost
            WHERE ticket_id = ?
              AND type_cout = ?
              AND COALESCE(is_deleted, false) = false
        `).all(ticket_id, type_cout);

        res.json(cost || []);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const upsterConst = (req: Request, res: Response) => {
    try {
        const id = Number(req.params.ticket_id);
        const { cost, id_items, category, type_cout, group, percentage, mode_ouverture } = req.body;
        const typeCoutId = Number(type_cout);

        if (isNaN(id) || isNaN(typeCoutId)) {
            return res.status(400).json({ error: "L'identifiant du ticket ou le type de cout est invalide." });
        }

        const costVal = parseFloat(cost) || 0;
        const itemId = getNullableNumber(id_items);
        const cat = category || null;
        const percent = getNumber(percentage, typeCoutId === TYPE_COUT.SUPER_COST ? 100 : 0);
        const modeOuverture = getNullableNumber(mode_ouverture);

        if (typeCoutId === TYPE_COUT.GLPI) {
            const existingCost = db.prepare(`
                SELECT *
                FROM cost
                WHERE ticket_id = ?
                  AND COALESCE(id_items, 0) = COALESCE(?, 0)
                  AND type_cout = ?
            `).get(id, itemId, typeCoutId);

            if (existingCost) {
                db.prepare(`
                    UPDATE cost
                    SET cost = ?, id_items = ?, category = ?, "group" = ?, percentage = ?, mode_ouverture = ?
                    WHERE ticket_id = ?
                      AND COALESCE(id_items, 0) = COALESCE(?, 0)
                      AND type_cout = ?
                `).run(costVal, itemId, cat, group, percent, modeOuverture, id, itemId, typeCoutId);
            } else {
                db.prepare(`
                    INSERT INTO cost (ticket_id, cost, id_items, category, type_cout, "group", percentage, mode_ouverture)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `).run(id, costVal, itemId, cat, typeCoutId, group, percent, modeOuverture);
            }
        } else {
            db.prepare(`
                INSERT INTO cost (ticket_id, cost, id_items, category, type_cout, "group", percentage, mode_ouverture)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `).run(id, costVal, itemId, cat, typeCoutId, group, percent, modeOuverture);
        }

        const rep = db.prepare(`
            SELECT *
            FROM cost
            WHERE ticket_id = ?
              AND type_cout = ?
            ORDER BY id DESC
            LIMIT 1
        `).get(id, typeCoutId);

        res.json(rep);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteCost = (req: Request, res: Response) => {
    try {
        const id = Number(req.params.ticket_id);
        const type_cout = Number(req.body.type_cout);

        if (isNaN(id) || isNaN(type_cout)) {
            return res.status(400).json({ error: "ID ou type de cout invalide." });
        }

        const info = db.prepare(`
            UPDATE cost
            SET is_deleted = true
            WHERE ticket_id = ?
              AND type_cout = ?
        `).run(id, type_cout);

        if (info.changes === 0) {
            return res.status(404).json({ error: `Cout avec le type ID ${type_cout} non trouve pour ce ticket.` });
        }

        res.status(204).send();
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getIsDelete = (req: Request, res: Response) => {
    const ticket_id = Number(req.params.ticket_id);
    const type_cout = Number(req.body.type_cout);

    try {
        if (isNaN(ticket_id) || isNaN(type_cout)) {
            return res.status(400).json({ error: "L'identifiant du ticket ou le type de cout est invalide." });
        }

        const cost = db.prepare(`
            SELECT *
            FROM cost
            WHERE ticket_id = ?
              AND type_cout = ?
              AND is_deleted = true
            ORDER BY id DESC
            LIMIT 1
        `).get(ticket_id, type_cout);

        res.json(cost || { message: "Aucun cout trouve pour ce ticket avec ce type." });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteCostForce = (req: Request, res: Response) => {
    try {
        const id = Number(req.params.ticket_id);
        const typeCoutNum = Number(req.body.type_cout);
        const nbrItems = Number(req.body.nbr_items);

        if (isNaN(id) || isNaN(typeCoutNum) || isNaN(nbrItems)) {
            return res.status(400).json({ error: "ID, type de cout ou nombre d'elements invalide." });
        }

        const info = db.prepare(`
            DELETE FROM cost
            WHERE id IN (
                SELECT id
                FROM cost
                WHERE ticket_id = ?
                  AND type_cout = ?
                ORDER BY id DESC
                LIMIT ?
            )
        `).run(id, typeCoutNum, nbrItems);

        if (info.changes === 0) {
            return res.status(404).json({ error: `Cout avec le type ID ${typeCoutNum} non trouve pour ce ticket.` });
        }

        if (typeCoutNum === TYPE_COUT.SUPER_COST) {
            recalculateOuverturesForTicket(id);
        }

        res.status(204).send();
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteCostForceAll = (req: Request, res: Response) => {
    try {
        db.prepare(`DELETE FROM cost`).run();
        res.status(204).send();
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getSuperCostAndOuvertures = (req: Request, res: Response) => {
    try {
        res.json(listSuperCostsAndOuvertures());
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const updateSuperCostOrReouverture = (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        const { cost, percentage, mode_ouverture } = req.body;

        if (isNaN(id)) {
            return res.status(400).json({ error: "ID invalide." });
        }

        const current = db.prepare(`
            ${COST_SELECT}
            WHERE id = ?
              AND type_cout IN (?, ?)
        `).get(id, TYPE_COUT.SUPER_COST, TYPE_COUT.OUVERTURE) as CostRow | undefined;

        if (!current) {
            return res.status(404).json({ error: "Ligne introuvable." });
        }

        if (current.type_cout === TYPE_COUT.SUPER_COST) {
            const batchRows = getRowsByBatch(current.ticket_id, TYPE_COUT.SUPER_COST, current.group);
            distributeBatchCost(batchRows, getNumber(cost, current.cost));

            db.prepare(`
                UPDATE cost
                SET percentage = 100, mode_ouverture = NULL
                WHERE ticket_id = ?
                  AND type_cout = ?
                  AND COALESCE("group", '') = COALESCE(?, '')
                  AND COALESCE(is_deleted, false) = false
            `).run(current.ticket_id, TYPE_COUT.SUPER_COST, current.group);

            recalculateOuverturesAfterGroup(current.ticket_id, current.group);
        }

        if (current.type_cout === TYPE_COUT.OUVERTURE) {
            const groupRows = getRowsByBatch(current.ticket_id, TYPE_COUT.OUVERTURE, current.group);

            const totalItems = Math.max(groupRows.length, 1);
            const newModeOuverture = getNullableNumber(mode_ouverture) || 1;
            const requestedCost = getNumber(cost, current.cost);
            const requestedPercentage = getNumber(percentage, Number(current.percentage || 0));
            const costChanged = Math.abs(requestedCost - Number(current.cost || 0)) > 0.000001;
            const base = getSuperCostBase(current.ticket_id, newModeOuverture, totalItems, current.group);
            const nextPercentage = costChanged && base > 0
                ? (requestedCost / base) * 100
                : requestedPercentage;

            db.prepare(`
                UPDATE cost
                SET percentage = ?, mode_ouverture = ?
                WHERE ticket_id = ?
                  AND type_cout = ?
                  AND COALESCE("group", '') = COALESCE(?, '')
                  AND COALESCE(is_deleted, false) = false
            `).run(nextPercentage, newModeOuverture, current.ticket_id, TYPE_COUT.OUVERTURE, current.group);

            recalculateOuvertureGroup(current.ticket_id, current.group);
        }

        res.json(listSuperCostsAndOuvertures());
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteOuvertureById = (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);

        if (isNaN(id)) {
            return res.status(400).json({ error: "ID d'ouverture invalide." });
        }

        const info = db.prepare(`
            UPDATE cost
            SET is_deleted = true
            WHERE id = ?
              AND type_cout = ?
        `).run(id, TYPE_COUT.OUVERTURE);

        if (info.changes === 0) {
            return res.status(404).json({ error: "Ouverture introuvable." });
        }

        res.status(204).send();
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
