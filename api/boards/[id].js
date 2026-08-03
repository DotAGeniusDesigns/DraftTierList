// GET    /api/boards/:id — fetch one saved board, payload included
// PUT    /api/boards/:id — overwrite its name and/or payload
// DELETE /api/boards/:id — remove it
//
// Every query is scoped by user_id as well as id, so a guessed board id from
// another account returns 404 rather than someone else's list.

const { sql } = require('../../server/lib/db.js');
const {
    withErrorHandling, allowMethods, readJsonBody, badRequest, notFound,
    clientIp, enforceRateLimit,
} = require('../../server/lib/http.js');
const { requireUser } = require('../../server/lib/auth.js');
const { validateBoardName, validateBoardCode } = require('../../server/lib/validate.js');

const MAX_CODE_LENGTH = 50_000;
const MAX_PLAYER_COUNT = 10_000;

// Postgres raises 22P02 on a malformed uuid, so reject junk ids before they
// reach a query.
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const toSummary = (row) => ({
    id: row.id,
    name: row.name,
    playerCount: row.player_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
});

const handler = async (req, res) => {
    if (!allowMethods(req, res, ['GET', 'PUT', 'DELETE'])) return;

    const user = await requireUser(req);
    res.setHeader('Cache-Control', 'no-store, private');

    const id = String(req.query.id ?? '');
    if (!UUID_PATTERN.test(id)) throw notFound('That board does not exist.');

    if (req.method !== 'GET') {
        await enforceRateLimit(
            'board_write_user', user.id, 30, 15 * 60,
            'Too many board changes. Wait 15 minutes and try again.'
        );
        await enforceRateLimit(
            'board_write_ip', clientIp(req), 100, 15 * 60,
            'Too many board changes from this connection. Wait 15 minutes and try again.'
        );
    }

    if (req.method === 'GET') {
        const rows = await sql`
            SELECT id, name, code, player_count, created_at, updated_at
            FROM boards
            WHERE id = ${id} AND user_id = ${user.id}
        `;
        if (!rows[0]) throw notFound('That board does not exist.');

        res.status(200).json({ board: { ...toSummary(rows[0]), code: rows[0].code } });
        return;
    }

    if (req.method === 'DELETE') {
        const rows = await sql`
            DELETE FROM boards WHERE id = ${id} AND user_id = ${user.id} RETURNING id
        `;
        if (!rows[0]) throw notFound('That board does not exist.');

        res.status(200).json({ ok: true });
        return;
    }

    const body = readJsonBody(req);
    const wantsName = typeof body.name === 'string';
    const wantsCode = typeof body.code === 'string';
    if (!wantsName && !wantsCode) throw badRequest('Nothing to update.');

    const existing = await sql`
        SELECT id, name, code, player_count FROM boards WHERE id = ${id} AND user_id = ${user.id}
    `;
    if (!existing[0]) throw notFound('That board does not exist.');

    const name = wantsName ? body.name.trim() : existing[0].name;
    const code = wantsCode ? body.code : existing[0].code;
    const playerCount = wantsCode && Number.isFinite(Number(body.playerCount))
        ? Math.min(MAX_PLAYER_COUNT, Math.max(0, Math.trunc(Number(body.playerCount))))
        : existing[0].player_count;

    if (wantsName) {
        const nameError = validateBoardName(name);
        if (nameError) throw badRequest(nameError, 'name');
    }
    if (wantsCode) {
        if (!code) throw badRequest('That board is empty — there is nothing to save.', 'code');
        if (code.length > MAX_CODE_LENGTH) throw badRequest('That board is too large to save.', 'code');
        const codeError = validateBoardCode(code);
        if (codeError) throw badRequest(codeError, 'code');
    }

    const rows = await sql`
        UPDATE boards
        SET name = ${name}, code = ${code}, player_count = ${playerCount}, updated_at = NOW()
        WHERE id = ${id} AND user_id = ${user.id}
        RETURNING id, name, player_count, created_at, updated_at
    `;

    res.status(200).json({ board: toSummary(rows[0]) });
};

module.exports = withErrorHandling(handler);
