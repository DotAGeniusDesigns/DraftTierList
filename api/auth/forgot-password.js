// POST /api/auth/forgot-password — email a one-hour temporary password.
//
// The temp password is stored in its own column and does NOT replace the real
// one: a reset request from a stranger can never lock the owner out. Whichever
// password is used first wins, and logging in with either clears the temp one.

const { sql } = require('../../server/lib/db.js');
const {
    withErrorHandling, allowMethods, readJsonBody, badRequest,
    clientIp, enforceRateLimit, clearRateLimit,
} = require('../../server/lib/http.js');
const { hashPassword, generateTempPassword } = require('../../server/lib/auth.js');
const { sendTempPasswordEmail, siteUrlFrom } = require('../../server/lib/email.js');
const { validateEmail } = require('../../server/lib/validate.js');

const TEMP_PASSWORD_MINUTES = 60;

const handler = async (req, res) => {
    if (!allowMethods(req, res, ['POST'])) return;

    const body = readJsonBody(req);
    const email = String(body.email ?? '').trim();

    const emailError = validateEmail(email);
    if (emailError) throw badRequest(emailError, 'email');

    const emailLower = email.toLowerCase();

    await enforceRateLimit(
        'reset_ip', clientIp(req), 10, 60 * 60,
        'Too many reset requests from this connection. Try again in an hour.'
    );
    await enforceRateLimit(
        'reset_account', emailLower, 1, 60 * 60,
        'A reset email was already sent recently. Check your inbox, including spam.'
    );

    // Always the same reply, whether or not the address is registered — the
    // form must not double as a way to discover who has an account.
    const genericResponse = {
        ok: true,
        message: 'If an account uses that email address, a temporary password is on its way.',
    };

    // Do the same expensive password-hash work even for an unknown address so
    // response timing does not cheaply reveal which emails have accounts.
    const tempPassword = generateTempPassword();
    const tempHash = await hashPassword(tempPassword);

    const rows = await sql`
        SELECT id, username, email FROM users WHERE email_lower = ${emailLower} LIMIT 1
    `;
    const user = rows[0];

    if (!user) {
        res.status(200).json(genericResponse);
        return;
    }

    await sql`
        UPDATE users
        SET temp_password_hash = ${tempHash},
            temp_password_expires_at = NOW() + make_interval(mins => ${TEMP_PASSWORD_MINUTES}::int),
            updated_at = NOW()
        WHERE id = ${user.id}
    `;

    try {
        await sendTempPasswordEmail({
            to: user.email,
            username: user.username,
            tempPassword,
            siteUrl: siteUrlFrom(req),
        });
    } catch (error) {
        // Don't leave a live temp password behind for an email that never
        // arrived; the user should retry rather than wait for nothing.
        await sql`
            UPDATE users
            SET temp_password_hash = NULL, temp_password_expires_at = NULL
            WHERE id = ${user.id} AND temp_password_hash = ${tempHash}
        `;
        await clearRateLimit('reset_account', emailLower);
        console.error('Failed to send reset email:', error);
        // Preserve the same public response used for unknown addresses. The
        // failed credential was removed above, and the user can retry.
    }

    res.status(200).json(genericResponse);
};

module.exports = withErrorHandling(handler);
