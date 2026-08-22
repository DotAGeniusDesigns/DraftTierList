// Account actions that share one Vercel Function to stay within the Hobby plan
// limit. Static routes (profile, password) take precedence; everything else is
// routed here via /api/account/:action.

const { sql } = require('../../server/lib/db.js');
const {
    withErrorHandling, allowMethods, readJsonBody, badRequest,
    unauthorized, notFound, clientIp, enforceRateLimit,
} = require('../../server/lib/http.js');
const {
    requireUser, verifyPassword, createSessionToken, setSessionCookie,
    clearSessionCookie, publicUser, generateActionToken, hashActionToken,
    createPasswordResetToken, setPasswordResetCookie,
} = require('../../server/lib/auth.js');
const { sendEmailChangedEmail, siteUrlFrom } = require('../../server/lib/email.js');

const CONFIRM_PHRASE = 'DELETE';
const RECOVERY_HOURS = 24;

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

const recoverEmail = async (req, res) => {
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
