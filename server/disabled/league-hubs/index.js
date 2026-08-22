// GET  /api/league-hubs — list the signed-in user's league hubs
// POST /api/league-hubs — create a new hub (managers are added separately)

const { sql } = require('../../../server/lib/db.js');
const {
    withErrorHandling, allowMethods, readJsonBody, badRequest, conflict,
    clientIp, enforceRateLimit,
} = require('../../../server/lib/http.js');
const { requireUser } = require('../../../server/lib/auth.js');
const { validateLeagueHubName, validateDescription } = require('../../../server/lib/validate.js');

const MAX_HUBS_PER_USER = 25;

const toSummary = (row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
});

const handler = async (req, res) => {
    if (!allowMethods(req, res, ['GET', 'POST'])) return;

    const user = await requireUser(req);
    res.setHeader('Cache-Control', 'no-store, private');

    if (req.method === 'GET') {
        const rows = await sql`
            SELECT id, name, description, created_at, updated_at
            FROM league_hubs
            WHERE user_id = ${user.id}
            ORDER BY updated_at DESC
        `;
        res.status(200).json({ hubs: rows.map(toSummary) });
        return;
    }

    const body = readJsonBody(req);
    const name = String(body.name ?? '').trim();
    const description = typeof body.description === 'string' ? body.description.trim() : null;

    await enforceRateLimit(
        'league_hub_write_user', user.id, 15, 15 * 60,
        'Too many league hubs created. Wait 15 minutes and try again.'
    );
    await enforceRateLimit(
        'league_hub_write_ip', clientIp(req), 30, 15 * 60,
        'Too many league hubs created from this connection. Wait 15 minutes and try again.'
    );

    const nameError = validateLeagueHubName(name);
    if (nameError) throw badRequest(nameError, 'name');
    const descriptionError = validateDescription(description);
    if (descriptionError) throw badRequest(descriptionError, 'description');

    const existingCount = await sql`
        SELECT COUNT(*)::int AS count FROM league_hubs WHERE user_id = ${user.id}
    `;
    if (existingCount[0].count >= MAX_HUBS_PER_USER) {
        throw conflict(`You can keep up to ${MAX_HUBS_PER_USER} league hubs. Delete one to make room.`);
    }

    const rows = await sql`
        INSERT INTO league_hubs (user_id, name, description)
        VALUES (${user.id}, ${name}, ${description})
        RETURNING id, name, description, created_at, updated_at
    `;

    res.status(201).json({ hub: toSummary(rows[0]) });
};

module.exports = withErrorHandling(handler);
