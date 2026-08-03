// GET  /api/boards — list the signed-in user's saved boards (without payloads)
// POST /api/boards — save the current board as a new one

const { sql } = require('../../server/lib/db.js');
const {
    withErrorHandling, allowMethods, readJsonBody, badRequest, conflict,
    clientIp, enforceRateLimit,
} = require('../../server/lib/http.js');
const { requireUser } = require('../../server/lib/auth.js');
const { validateBoardName, validateBoardCode } = require('../../server/lib/validate.js');

// Generous next to a real board (a few KB), tight enough to keep a bad actor
// from parking megabytes in the table.
const MAX_CODE_LENGTH = 50_000;
const MAX_BOARDS_PER_USER = 25;
const MAX_PLAYER_COUNT = 10_000;

const toSummary = (row) => ({
    id: row.id,
    name: row.name,
    playerCount: row.player_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
});

const handler = async (req, res) => {
    if (!allowMethods(req, res, ['GET', 'POST'])) return;

    const user = await requireUser(req);
    res.setHeader('Cache-Control', 'no-store, private');

    if (req.method === 'GET') {
        const rows = await sql`
            SELECT id, name, player_count, created_at, updated_at
            FROM boards
            WHERE user_id = ${user.id}
            ORDER BY updated_at DESC
        `;
        res.status(200).json({ boards: rows.map(toSummary) });
        return;
    }

    const body = readJsonBody(req);
    const name = String(body.name ?? '').trim();
    const code = String(body.code ?? '');
    const playerCount = Number.isFinite(Number(body.playerCount))
        ? Math.min(MAX_PLAYER_COUNT, Math.max(0, Math.trunc(Number(body.playerCount))))
        : 0;

    await enforceRateLimit(
        'board_write_user', user.id, 30, 15 * 60,
        'Too many board changes. Wait 15 minutes and try again.'
    );
    await enforceRateLimit(
        'board_write_ip', clientIp(req), 100, 15 * 60,
        'Too many board changes from this connection. Wait 15 minutes and try again.'
    );

    const nameError = validateBoardName(name);
    if (nameError) throw badRequest(nameError, 'name');

    if (!code) throw badRequest('That board is empty — there is nothing to save.', 'code');
    if (code.length > MAX_CODE_LENGTH) throw badRequest('That board is too large to save.', 'code');
    const codeError = validateBoardCode(code);
    if (codeError) throw badRequest(codeError, 'code');

    const rows = await sql`
        WITH available_slot AS (
            SELECT candidate::smallint AS slot
            FROM generate_series(1, ${MAX_BOARDS_PER_USER}) AS candidate
            WHERE NOT EXISTS (
                SELECT 1 FROM boards
                WHERE user_id = ${user.id} AND slot = candidate
            )
            ORDER BY candidate
            LIMIT 1
        )
        INSERT INTO boards (user_id, name, code, player_count, slot)
        SELECT ${user.id}, ${name}, ${code}, ${playerCount}, slot
        FROM available_slot
        ON CONFLICT (user_id, slot) WHERE slot IS NOT NULL DO NOTHING
        RETURNING id, name, player_count, created_at, updated_at
    `;
    if (!rows[0]) {
        throw conflict(`You can keep up to ${MAX_BOARDS_PER_USER} saved boards. Delete one to make room.`);
    }

    res.status(201).json({ board: toSummary(rows[0]) });
};

module.exports = withErrorHandling(handler);
