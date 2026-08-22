// PUT    /api/league-hubs/:id/managers/:managerId — update a manager (owner only)
// DELETE /api/league-hubs/:id/managers/:managerId — remove a manager (owner only)

const { sql } = require('../../../../server/lib/db.js');
const {
    withErrorHandling, allowMethods, readJsonBody, badRequest, notFound,
    clientIp, enforceRateLimit,
} = require('../../../../server/lib/http.js');
const { requireUser } = require('../../../../server/lib/auth.js');
const {
    validateManagerName, validateDescription, validateImageData, validateRoster,
} = require('../../../../server/lib/validate.js');

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
    if (!allowMethods(req, res, ['PUT', 'DELETE'])) return;

    const hubId = String(req.query.id ?? '');
    const managerId = String(req.query.managerId ?? '');
    if (!UUID_PATTERN.test(hubId) || !UUID_PATTERN.test(managerId)) {
        throw notFound('That manager does not exist.');
    }

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

    if (req.method === 'DELETE') {
        const rows = await sql`
            DELETE FROM league_hub_managers
            WHERE id = ${managerId} AND hub_id = ${hubId}
            RETURNING id
        `;
        if (!rows[0]) throw notFound('That manager does not exist.');

        await sql`UPDATE league_hubs SET updated_at = NOW() WHERE id = ${hubId}`;
        res.status(200).json({ ok: true });
        return;
    }

    const existing = await sql`
        SELECT id, name, description, image_data, roster
        FROM league_hub_managers
        WHERE id = ${managerId} AND hub_id = ${hubId}
    `;
    if (!existing[0]) throw notFound('That manager does not exist.');

    const body = readJsonBody(req);
    const wantsName = typeof body.name === 'string';
    const wantsDescription = body.description !== undefined;
    const wantsImage = body.imageData !== undefined;
    const wantsRoster = body.roster !== undefined;

    const name = wantsName ? body.name.trim() : existing[0].name;
    const description = wantsDescription
        ? (typeof body.description === 'string' ? body.description.trim() : null)
        : existing[0].description;
    const imageData = wantsImage
        ? (typeof body.imageData === 'string' ? body.imageData : null)
        : existing[0].image_data;
    const roster = wantsRoster
        ? (Array.isArray(body.roster) ? body.roster : [])
        : existing[0].roster;

    if (wantsName) {
        const nameError = validateManagerName(name);
        if (nameError) throw badRequest(nameError, 'name');
    }
    if (wantsDescription) {
        const descriptionError = validateDescription(description);
        if (descriptionError) throw badRequest(descriptionError, 'description');
    }
    if (wantsImage) {
        const imageError = validateImageData(imageData);
        if (imageError) throw badRequest(imageError, 'imageData');
    }
    if (wantsRoster) {
        const rosterError = validateRoster(roster);
        if (rosterError) throw badRequest(rosterError, 'roster');
    }

    const rows = await sql`
        UPDATE league_hub_managers
        SET name = ${name},
            description = ${description},
            image_data = ${imageData},
            roster = ${JSON.stringify(roster)}::jsonb,
            updated_at = NOW()
        WHERE id = ${managerId} AND hub_id = ${hubId}
        RETURNING id, name, description, image_data, roster, position
    `;

    await sql`UPDATE league_hubs SET updated_at = NOW() WHERE id = ${hubId}`;

    res.status(200).json({ manager: toManager(rows[0]) });
};

module.exports = withErrorHandling(handler);
