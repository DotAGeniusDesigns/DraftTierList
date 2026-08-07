// Less-frequent account actions share one Vercel Function so the application
// stays within the Hobby plan's function limit. Static routes (profile,
// password, confirm-email, recover-email) all take precedence over this
// dynamic route, so only actions without a static file of their own belong here.

const { sql } = require('../../server/lib/db.js');
const {
    withErrorHandling, allowMethods, readJsonBody, badRequest,
    unauthorized, notFound, clientIp, enforceRateLimit,
} = require('../../server/lib/http.js');
const {
    requireUser, verifyPassword, createSessionToken, setSessionCookie,
    clearSessionCookie, publicUser,
} = require('../../server/lib/auth.js');

const CONFIRM_PHRASE = 'DELETE';

const signOutEverywhere = async (req, res) => {
    if (!allowMethods(req, res, ['POST'])) return;

    const sessionUser = await requireUser(req);
    await enforceRateLimit(
        'sessions_user', sessionUser.id, 5, 15 * 60,
        'Too many attempts. Wait 15 minutes and try again.'
    );
    await enforceRateLimit(
        'sessions_ip', clientIp(req), 15, 15 * 60,
        'Too many attempts from this connection. Wait 15 minutes and try again.'
    );
    const currentPassword = String(readJsonBody(req).currentPassword ?? '');
    const rows = await sql`SELECT password_hash FROM users WHERE id = ${sessionUser.id}`;
    if (!rows[0]) throw unauthorized();
    if (!currentPassword) throw badRequest('Enter your password to confirm.', 'currentPassword');
    if (!await verifyPassword(currentPassword, rows[0].password_hash)) {
        throw badRequest('That password is not right.', 'currentPassword');
    }

    const updated = await sql`
        UPDATE users
        SET token_version = token_version + 1, updated_at = NOW()
        WHERE id = ${sessionUser.id}
        RETURNING id, username, email, must_change_password, token_version, created_at, last_login_at
    `;
    setSessionCookie(res, createSessionToken(updated[0]));
    res.status(200).json({
        user: publicUser(updated[0]),
        message: 'Signed out on all other devices.',
    });
};

const deleteAccount = async (req, res) => {
    if (!allowMethods(req, res, ['POST'])) return;

    const sessionUser = await requireUser(req);
    await enforceRateLimit(
        'delete_user', sessionUser.id, 5, 15 * 60,
        'Too many attempts. Wait 15 minutes and try again.'
    );
    await enforceRateLimit(
        'delete_ip', clientIp(req), 15, 15 * 60,
        'Too many attempts from this connection. Wait 15 minutes and try again.'
    );
    const body = readJsonBody(req);
    const currentPassword = String(body.currentPassword ?? '');
    const confirm = String(body.confirm ?? '').trim();
    const rows = await sql`SELECT password_hash FROM users WHERE id = ${sessionUser.id}`;
    if (!rows[0]) throw unauthorized();
    if (!currentPassword) throw badRequest('Enter your password to confirm.', 'currentPassword');
    if (!await verifyPassword(currentPassword, rows[0].password_hash)) {
        throw badRequest('That password is not right.', 'currentPassword');
    }
    if (confirm.toUpperCase() !== CONFIRM_PHRASE) {
        throw badRequest(`Type ${CONFIRM_PHRASE} to confirm.`, 'confirm');
    }

    await sql`DELETE FROM users WHERE id = ${sessionUser.id}`;
    clearSessionCookie(res);
    res.status(200).json({ ok: true, message: 'Your account and saved boards have been deleted.' });
};

const handlers = {
    sessions: signOutEverywhere,
    delete: deleteAccount,
};

const handler = async (req, res) => {
    const action = typeof req.query.action === 'string' ? req.query.action : '';
    const actionHandler = handlers[action];
    if (!actionHandler) throw notFound();
    await actionHandler(req, res);
};

module.exports = withErrorHandling(handler);
