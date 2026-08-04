// POST /api/account/recover-email — undo an unauthorized email change.
//
// The token is emailed to the previous address after a confirmed swap. Recovery
// restores that address, signs out every device, and opens a password-reset
// session so the real owner can pick a new password.

const { sql } = require('../../server/lib/db.js');
const {
    withErrorHandling, allowMethods, readJsonBody, badRequest,
    clientIp, enforceRateLimit,
} = require('../../server/lib/http.js');
const {
    createPasswordResetToken, setPasswordResetCookie, publicUser,
    hashActionToken,
} = require('../../server/lib/auth.js');

const handler = async (req, res) => {
    if (!allowMethods(req, res, ['POST'])) return;

    await enforceRateLimit(
        'recover_email_ip', clientIp(req), 20, 60 * 60,
        'Too many recovery attempts. Try again in an hour.'
    );

    const body = readJsonBody(req);
    const token = String(body.token ?? '').trim();
    if (!token) throw badRequest('This recovery link is incomplete.');

    const tokenHash = hashActionToken(token);

    const rows = await sql`
        SELECT id, username, email, previous_email, previous_email_lower,
               email_recovery_token_hash, email_recovery_expires_at
        FROM users
        WHERE email_recovery_token_hash = ${tokenHash}
          AND email_recovery_expires_at > NOW()
        LIMIT 1
    `;
    const record = rows[0];
    if (!record || !record.previous_email) {
        throw badRequest('This recovery link is invalid or has expired.');
    }

    const conflicts = await sql`
        SELECT id
        FROM users
        WHERE id <> ${record.id}
          AND email_lower = ${record.previous_email_lower}
        LIMIT 1
    `;
    if (conflicts[0]) {
        throw badRequest('Your previous email address is now used by another account. Contact support.');
    }

    const updated = await sql`
        UPDATE users
        SET email = ${record.previous_email},
            email_lower = ${record.previous_email_lower},
            previous_email = NULL,
            previous_email_lower = NULL,
            email_recovery_token_hash = NULL,
            email_recovery_expires_at = NULL,
            must_change_password = TRUE,
            token_version = token_version + 1,
            updated_at = NOW()
        WHERE id = ${record.id}
          AND email_recovery_token_hash = ${tokenHash}
        RETURNING id, username, email, must_change_password, token_version, created_at, last_login_at
    `;

    if (!updated[0]) {
        throw badRequest('This recovery link is invalid or has expired.');
    }

    const resetUser = { ...updated[0], session_purpose: 'password-reset' };
    setPasswordResetCookie(res, createPasswordResetToken(resetUser));

    res.status(200).json({
        user: publicUser(resetUser),
        message: 'Your email was restored. Choose a new password to secure the account.',
    });
};

module.exports = withErrorHandling(handler);
