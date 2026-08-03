// POST /api/account/password — change the signed-in user's password.
//
// Requires the current password except when the caller holds a short-lived,
// reset-only session created by redeeming a temporary credential.

const { sql } = require('../../server/lib/db.js');
const {
    withErrorHandling, allowMethods, readJsonBody, badRequest, unauthorized,
    enforceRateLimit,
} = require('../../server/lib/http.js');
const {
    requirePasswordChangeUser, hashPassword, verifyPassword, createSessionToken,
    setSessionCookie, publicUser,
} = require('../../server/lib/auth.js');
const { validatePassword, validatePasswordConfirm } = require('../../server/lib/validate.js');

const handler = async (req, res) => {
    if (!allowMethods(req, res, ['POST'])) return;

    const sessionUser = await requirePasswordChangeUser(req);
    const isResetSession = sessionUser.session_purpose === 'password-reset';

    await enforceRateLimit(
        'password_change', sessionUser.id, 10, 15 * 60,
        'Too many attempts. Wait 15 minutes and try again.'
    );

    const body = readJsonBody(req);
    const currentPassword = String(body.currentPassword ?? '');
    const newPassword = String(body.newPassword ?? '');
    const confirm = String(body.newPasswordConfirm ?? '');

    const rows = await sql`SELECT password_hash, must_change_password FROM users WHERE id = ${sessionUser.id}`;
    const record = rows[0];
    if (!record) throw unauthorized();

    if (isResetSession && !record.must_change_password) {
        throw unauthorized('This password-reset session is no longer valid.');
    }

    if (!isResetSession) {
        if (!currentPassword) throw badRequest('Enter your current password.', 'currentPassword');
        const matches = await verifyPassword(currentPassword, record.password_hash);
        if (!matches) throw badRequest('That is not your current password.', 'currentPassword');
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) throw badRequest(passwordError, 'newPassword');

    const confirmError = validatePasswordConfirm(newPassword, confirm);
    if (confirmError) throw badRequest(confirmError, 'newPasswordConfirm');

    const isSame = await verifyPassword(newPassword, record.password_hash);
    if (isSame) throw badRequest('That is already your password. Pick a different one.', 'newPassword');

    const passwordHash = await hashPassword(newPassword);

    // Bumping token_version signs out every other device, which is the point:
    // a password change should evict whoever prompted it.
    const updated = await sql`
        UPDATE users
        SET password_hash = ${passwordHash},
            must_change_password = FALSE,
            temp_password_hash = NULL,
            temp_password_expires_at = NULL,
            token_version = token_version + 1,
            updated_at = NOW()
        WHERE id = ${sessionUser.id}
        RETURNING id, username, email, must_change_password, token_version, created_at, last_login_at
    `;

    // ...including this one, so re-issue a cookie for the device that made
    // the change rather than logging the user out of their own session.
    const regularUser = { ...updated[0], session_purpose: 'session' };
    setSessionCookie(res, createSessionToken(regularUser));
    res.status(200).json({
        user: publicUser(regularUser),
        message: 'Password updated. Other devices have been signed out.',
    });
};

module.exports = withErrorHandling(handler);
