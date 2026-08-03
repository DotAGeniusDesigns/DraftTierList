// Less-frequent account actions share one Vercel Function so the application
// stays within the Hobby plan's function limit. Static profile/password routes
// still take precedence over this dynamic route.

const { sql } = require('../../server/lib/db.js');
const {
    withErrorHandling, allowMethods, readJsonBody, badRequest, conflict,
    unauthorized, notFound, clientIp, enforceRateLimit,
} = require('../../server/lib/http.js');
const {
    requireUser, verifyPassword, createSessionToken, setSessionCookie,
    clearSessionCookie, publicUser, generateActionToken, hashActionToken,
    createPasswordResetToken, setPasswordResetCookie,
} = require('../../server/lib/auth.js');
const { sendEmailChangedEmail, siteUrlFrom } = require('../../server/lib/email.js');

const RECOVERY_HOURS = 24;
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

const confirmEmail = async (req, res) => {
    if (!allowMethods(req, res, ['POST'])) return;

    const token = String(readJsonBody(req).token ?? '');
    if (token.length < 32 || token.length > 200) {
        throw badRequest('That confirmation link is invalid or has expired.');
    }
    const tokenHash = hashActionToken(token);
    await enforceRateLimit(
        'email_confirm_ip', clientIp(req), 20, 60 * 60,
        'Too many confirmation attempts. Wait an hour and try again.'
    );
    await enforceRateLimit(
        'email_confirm_token', tokenHash, 5, 60 * 60,
        'Too many confirmation attempts. Request a new email change.'
    );

    const matches = await sql`
        SELECT id, username, email, email_lower, pending_email, pending_email_lower,
               email_change_expires_at
        FROM users
        WHERE email_change_token_hash = ${tokenHash}
          AND email_change_expires_at > NOW()
          AND pending_email IS NOT NULL
        LIMIT 1
    `;
    const record = matches[0];
    if (!record) throw badRequest('That confirmation link is invalid or has expired.');

    const recoveryToken = generateActionToken();
    const recoveryHash = hashActionToken(recoveryToken);
    let updated;
    try {
        const rows = await sql`
            UPDATE users
            SET previous_email = email,
                previous_email_lower = email_lower,
                email = pending_email,
                email_lower = pending_email_lower,
                pending_email = NULL,
                pending_email_lower = NULL,
                email_change_token_hash = NULL,
                email_change_expires_at = NULL,
                email_recovery_token_hash = ${recoveryHash},
                email_recovery_expires_at = NOW() + make_interval(hours => ${RECOVERY_HOURS}::int),
                token_version = token_version + 1,
                updated_at = NOW()
            WHERE id = ${record.id}
              AND email_change_token_hash = ${tokenHash}
              AND email_change_expires_at > NOW()
            RETURNING id, username, email, must_change_password, token_version,
                      created_at, last_login_at
        `;
        updated = rows[0];
    } catch (error) {
        if (error.code === '23505') {
            throw conflict('That email address is no longer available.');
        }
        throw error;
    }
    if (!updated) throw badRequest('That confirmation link is invalid or has expired.');

    try {
        await sendEmailChangedEmail({
            to: record.email,
            username: record.username,
            newEmail: updated.email,
            recoveryUrl: `${siteUrlFrom(req)}/recover-email?token=${encodeURIComponent(recoveryToken)}`,
        });
    } catch (error) {
        await sql`
            UPDATE users
            SET email = ${record.email},
                email_lower = ${record.email_lower},
                pending_email = ${record.pending_email},
                pending_email_lower = ${record.pending_email_lower},
                email_change_token_hash = ${tokenHash},
                email_change_expires_at = ${record.email_change_expires_at},
                previous_email = NULL,
                previous_email_lower = NULL,
                email_recovery_token_hash = NULL,
                email_recovery_expires_at = NULL,
                token_version = token_version + 1,
                updated_at = NOW()
            WHERE id = ${record.id} AND email_recovery_token_hash = ${recoveryHash}
        `;
        console.error('Failed to send email recovery notice:', error);
        throw new Error('Email change recovery notice could not be delivered');
    }

    const regularUser = { ...updated, session_purpose: 'session' };
    setSessionCookie(res, createSessionToken(regularUser));
    res.status(200).json({
        user: publicUser(regularUser),
        message: 'Email address confirmed.',
    });
};

const recoverEmail = async (req, res) => {
    if (!allowMethods(req, res, ['POST'])) return;

    const token = String(readJsonBody(req).token ?? '');
    if (token.length < 32 || token.length > 200) {
        throw badRequest('That recovery link is invalid or has expired.');
    }
    const tokenHash = hashActionToken(token);
    await enforceRateLimit(
        'email_recover_ip', clientIp(req), 20, 60 * 60,
        'Too many recovery attempts. Wait an hour and try again.'
    );
    await enforceRateLimit(
        'email_recover_token', tokenHash, 5, 60 * 60,
        'Too many recovery attempts. This link can no longer be used.'
    );

    let updated;
    try {
        const rows = await sql`
            UPDATE users
            SET email = previous_email,
                email_lower = previous_email_lower,
                previous_email = NULL,
                previous_email_lower = NULL,
                email_recovery_token_hash = NULL,
                email_recovery_expires_at = NULL,
                pending_email = NULL,
                pending_email_lower = NULL,
                email_change_token_hash = NULL,
                email_change_expires_at = NULL,
                temp_password_hash = NULL,
                temp_password_expires_at = NULL,
                must_change_password = TRUE,
                token_version = token_version + 1,
                updated_at = NOW()
            WHERE email_recovery_token_hash = ${tokenHash}
              AND email_recovery_expires_at > NOW()
              AND previous_email IS NOT NULL
            RETURNING id, username, email, must_change_password, token_version,
                      created_at, last_login_at
        `;
        updated = rows[0];
    } catch (error) {
        if (error.code === '23505') {
            throw conflict('The previous email address is already attached to another account.');
        }
        throw error;
    }
    if (!updated) throw badRequest('That recovery link is invalid or has expired.');

    const resetUser = { ...updated, session_purpose: 'password-reset' };
    setPasswordResetCookie(res, createPasswordResetToken(resetUser));
    res.status(200).json({
        user: publicUser(resetUser),
        message: 'Your previous email was restored. Choose a new password now.',
    });
};

const handlers = {
    sessions: signOutEverywhere,
    delete: deleteAccount,
    'confirm-email': confirmEmail,
    'recover-email': recoverEmail,
};

const handler = async (req, res) => {
    const action = typeof req.query.action === 'string' ? req.query.action : '';
    const actionHandler = handlers[action];
    if (!actionHandler) throw notFound();
    await actionHandler(req, res);
};

module.exports = withErrorHandling(handler);
