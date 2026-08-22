// GET    /api/league-hubs/:id — full hub + all managers/rosters (public, no auth)
// PUT    /api/league-hubs/:id — update the hub's name/description (owner only)
// DELETE /api/league-hubs/:id — remove a hub and its managers (owner only)
//
// The GET here is deliberately unauthenticated: this is the "shareable link"
// half of the feature, and anyone with the URL is meant to be able to open
// it and see the league. There's no external platform to live-fetch from —
// everything returned here is exactly what the hub's owner entered.

const { sql } = require('../../../server/lib/db.js');
const {
    withErrorHandling, allowMethods, readJsonBody, badRequest, notFound,
    clientIp, enforceRateLimit,
} = require('../../../server/lib/http.js');
const { requireUser } = require('../../../server/lib/auth.js');
const { validateLeagueHubName, validateDescription } = require('../../../server/lib/validate.js');

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const toSummary = (row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
});

const toManager = (row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    imageData: row.image_data,
    roster: row.roster,
    position: row.position,
});

const handler = async (req, res) => {
    if (!allowMethods(req, res, ['GET', 'PUT', 'DELETE'])) return;

    const id = String(req.query.id ?? '');
    if (!UUID_PATTERN.test(id)) throw notFound('That league hub does not exist.');

    if (req.method === 'GET') {
        await enforceRateLimit(
            'league_hub_read_ip', clientIp(req), 120, 15 * 60,
            'Too many requests from this connection. Wait a few minutes and try again.'
        );

        const hubRows = await sql`
            SELECT id, name, description, created_at, updated_at
            FROM league_hubs
            WHERE id = ${id}
        `;
        if (!hubRows[0]) throw notFound('That league hub does not exist.');

        const managerRows = await sql`
            SELECT id, name, description, image_data, roster, position
            FROM league_hub_managers
            WHERE hub_id = ${id}
            ORDER BY position ASC
        `;

        res.setHeader('Cache-Control', 'public, max-age=30');
        res.status(200).json({
            hub: { ...toSummary(hubRows[0]), managers: managerRows.map(toManager) },
        });
        return;
    }

    const user = await requireUser(req);
    res.setHeader('Cache-Control', 'no-store, private');

    await enforceRateLimit(
        'league_hub_write_user', user.id, 30, 15 * 60,
        'Too many league hub changes. Wait 15 minutes and try again.'
    );

    if (req.method === 'DELETE') {
        const rows = await sql`
            DELETE FROM league_hubs WHERE id = ${id} AND user_id = ${user.id} RETURNING id
        `;
        if (!rows[0]) throw notFound('That league hub does not exist.');

        res.status(200).json({ ok: true });
        return;
    }

    const body = readJsonBody(req);
    const wantsName = typeof body.name === 'string';
    const wantsDescription = body.description !== undefined;
    if (!wantsName && !wantsDescription) throw badRequest('Nothing to update.');

    const existing = await sql`
        SELECT id, name, description FROM league_hubs WHERE id = ${id} AND user_id = ${user.id}
    `;
    if (!existing[0]) throw notFound('That league hub does not exist.');

    const name = wantsName ? body.name.trim() : existing[0].name;
    const description = wantsDescription
        ? (typeof body.description === 'string' ? body.description.trim() : null)
        : existing[0].description;

    if (wantsName) {
        const nameError = validateLeagueHubName(name);
        if (nameError) throw badRequest(nameError, 'name');
    }
    if (wantsDescription) {
        const descriptionError = validateDescription(description);
        if (descriptionError) throw badRequest(descriptionError, 'description');
    }

    const rows = await sql`
        UPDATE league_hubs
        SET name = ${name}, description = ${description}, updated_at = NOW()
        WHERE id = ${id} AND user_id = ${user.id}
        RETURNING id, name, description, created_at, updated_at
    `;

    res.status(200).json({ hub: toSummary(rows[0]) });
};

module.exports = withErrorHandling(handler);
