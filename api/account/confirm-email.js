// POST /api/account/confirm-email — finish a pending email change.
//
// The token arrives in the confirmation link emailed to the new address.
// Completing the swap also notifies the old address with a 24-hour recovery link.

const { sql } = require('../../server/lib/db.js');
const {
    withErrorHandling, allowMethods, readJsonBody, badRequest,
    clientIp, enforceRateLimit,
} = require('../../server/lib/http.js');
const {
    generateActionToken, hashActionToken, publicUser,
} = require('../../server/lib/auth.js');
const { sendEmailChangedEmail, siteUrlFrom } = require('../../server/lib/email.js');

const RECOVERY_HOURS = 24;

const handler = async (req, res) => {
    if (!allowMethods(req, res, ['POST'])) return;

    await enforceRateLimit(
        'confirm_email_ip', clientIp(req), 30, 60 * 60,
        'Too many confirmation attempts. Try again in an hour.'
    );

    const body = readJsonBody(req);
    const token = String(body.token ?? '').trim();
    if (!token) throw badRequest('This confirmation link is incomplete.');

    const tokenHash = hashActionToken(token);

    const rows = await sql`
        SELECT id, username, email, email_lower, pending_email, pending_email_lower,
               email_change_token_hash, email_change_expires_at
        FROM users
        WHERE email_change_token_hash = ${tokenHash}
          AND email_change_expires_at > NOW()
        LIMIT 1
    `;
    const record = rows[0];
    if (!record || !record.pending_email) {
        throw badRequest('This confirmation link is invalid or has expired.');
    }

    const conflicts = await sql`
        SELECT id
        FROM users
        WHERE id <> ${record.id}
          AND email_lower = ${record.pending_email_lower}
        LIMIT 1
    `;
    if (conflicts[0]) {
        throw badRequest('That email address is already in use on another account.');
    }

    const recoveryToken = generateActionToken();
    const recoveryTokenHash = hashActionToken(recoveryToken);
    const previousEmail = record.email;

    const updated = await sql`
        UPDATE users
        SET email = ${record.pending_email},
            email_lower = ${record.pending_email_lower},
            pending_email = NULL,
            pending_email_lower = NULL,
            email_change_token_hash = NULL,
            email_change_expires_at = NULL,
            previous_email = ${previousEmail},
            previous_email_lower = ${record.email_lower},
            email_recovery_token_hash = ${recoveryTokenHash},
            email_recovery_expires_at = NOW() + make_interval(hours => ${RECOVERY_HOURS}::int),
            updated_at = NOW()
        WHERE id = ${record.id}
          AND email_change_token_hash = ${tokenHash}
        RETURNING id, username, email, must_change_password, token_version, created_at, last_login_at
    `;

    if (!updated[0]) {
        throw badRequest('This confirmation link is invalid or has expired.');
    }

    try {
        await sendEmailChangedEmail({
            to: previousEmail,
            username: record.username,
            newEmail: record.pending_email,
            recoveryUrl: `${siteUrlFrom(req)}/recover-email?token=${encodeURIComponent(recoveryToken)}`,
        });
    } catch (error) {
        console.error('Failed to send email-changed notification:', error);
    }

    res.status(200).json({
        user: publicUser(updated[0]),
        message: `Your email is now ${updated[0].email}.`,
    });
};

module.exports = withErrorHandling(handler);
