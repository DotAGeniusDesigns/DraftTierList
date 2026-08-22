// POST /api/league-hubs/:id/managers — add a manager to a hub (owner only)
//
// Slot allocation mirrors api/boards/index.js: an atomic "first free position"
// insert rather than a separate COUNT-then-INSERT, so two concurrent adds
// can't both believe they got the last of 16 slots.

const { sql } = require('../../../../../server/lib/db.js');
const {
    withErrorHandling, allowMethods, readJsonBody, badRequest, notFound, conflict,
    clientIp, enforceRateLimit,
} = require('../../../../../server/lib/http.js');
const { requireUser } = require('../../../../../server/lib/auth.js');
const {
    validateManagerName, validateDescription, validateImageData, validateRoster,
} = require('../../../../../server/lib/validate.js');

const MAX_MANAGERS_PER_HUB = 16;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const toManager = (row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    imageData: row.image_data,
    roster: row.roster,
    position: row.position,
});

const handler = async (req, res) => {
    if (!allowMethods(req, res, ['POST'])) return;

    const hubId = String(req.query.id ?? '');
    if (!UUID_PATTERN.test(hubId)) throw notFound('That league hub does not exist.');

    const user = await requireUser(req);
    res.setHeader('Cache-Control', 'no-store, private');

    const hub = await sql`SELECT id FROM league_hubs WHERE id = ${hubId} AND user_id = ${user.id}`;
    if (!hub[0]) throw notFound('That league hub does not exist.');

    await enforceRateLimit(
        'league_hub_write_user', user.id, 30, 15 * 60,
        'Too many league hub changes. Wait 15 minutes and try again.'
    );
    await enforceRateLimit(
        'league_hub_write_ip', clientIp(req), 100, 15 * 60,
        'Too many league hub changes from this connection. Wait 15 minutes and try again.'
    );

    const body = readJsonBody(req);
    const name = String(body.name ?? '').trim();
    const description = typeof body.description === 'string' ? body.description.trim() : null;
    const imageData = typeof body.imageData === 'string' ? body.imageData : null;
    const roster = Array.isArray(body.roster) ? body.roster : [];

    const nameError = validateManagerName(name);
    if (nameError) throw badRequest(nameError, 'name');
    const descriptionError = validateDescription(description);
    if (descriptionError) throw badRequest(descriptionError, 'description');
    const imageError = validateImageData(imageData);
    if (imageError) throw badRequest(imageError, 'imageData');
    const rosterError = validateRoster(roster);
    if (rosterError) throw badRequest(rosterError, 'roster');

    const rows = await sql`
        WITH available_slot AS (
            SELECT candidate::smallint AS position
            FROM generate_series(1, ${MAX_MANAGERS_PER_HUB}) AS candidate
            WHERE NOT EXISTS (
                SELECT 1 FROM league_hub_managers
                WHERE hub_id = ${hubId} AND position = candidate
            )
            ORDER BY candidate
            LIMIT 1
        )
        INSERT INTO league_hub_managers (hub_id, name, description, image_data, roster, position)
        SELECT ${hubId}, ${name}, ${description}, ${imageData}, ${JSON.stringify(roster)}::jsonb, position
        FROM available_slot
        RETURNING id, name, description, image_data, roster, position
    `;
    if (!rows[0]) {
        throw conflict(`You can add up to ${MAX_MANAGERS_PER_HUB} managers per league.`);
    }

    await sql`UPDATE league_hubs SET updated_at = NOW() WHERE id = ${hubId}`;

    res.status(201).json({ manager: toManager(rows[0]) });
};

module.exports = withErrorHandling(handler);
