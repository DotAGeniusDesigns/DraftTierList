// POST /api/account/profile — change username and/or email.
//
// Both are identity, so both need the current password. A new email remains
// pending until its owner follows a one-hour confirmation link.

const { sql } = require('../../server/lib/db.js');
const {
    withErrorHandling, allowMethods, readJsonBody, badRequest, conflict,
    unauthorized, enforceRateLimit,
} = require('../../server/lib/http.js');
const {
    requireUser, verifyPassword, generateActionToken, hashActionToken, publicUser,
} = require('../../server/lib/auth.js');
const { validateUsername, validateEmail } = require('../../server/lib/validate.js');
const { sendEmailChangeConfirmationEmail, siteUrlFrom } = require('../../server/lib/email.js');

const EMAIL_CHANGE_MINUTES = 60;

const handler = async (req, res) => {
    if (!allowMethods(req, res, ['POST'])) return;

    const sessionUser = await requireUser(req);

    await enforceRateLimit(
        'profile_update', sessionUser.id, 15, 15 * 60,
        'Too many changes at once. Wait 15 minutes and try again.'
    );

    const body = readJsonBody(req);
    const currentPassword = String(body.currentPassword ?? '');

    const rows = await sql`
        SELECT id, username, email, password_hash,
               pending_email, pending_email_lower,
               email_change_token_hash, email_change_expires_at
        FROM users
        WHERE id = ${sessionUser.id}
    `;
    const record = rows[0];
    if (!record) throw unauthorized();

    if (!currentPassword) throw badRequest('Enter your password to confirm this change.', 'currentPassword');
    const matches = await verifyPassword(currentPassword, record.password_hash);
    if (!matches) throw badRequest('That password is not right.', 'currentPassword');

    // Only fields actually present in the request are touched, so the profile
    // form can send one at a time.
    const wantsUsername = typeof body.username === 'string';
    const wantsEmail = typeof body.email === 'string';
    if (!wantsUsername && !wantsEmail) throw badRequest('Nothing to update.');

    const username = wantsUsername ? body.username.trim() : record.username;
    const email = wantsEmail ? body.email.trim() : record.email;

    if (wantsUsername) {
        const usernameError = validateUsername(username);
        if (usernameError) throw badRequest(usernameError, 'username');
    }
    if (wantsEmail) {
        const emailError = validateEmail(email);
        if (emailError) throw badRequest(emailError, 'email');
    }

    const emailChanged = email.toLowerCase() !== record.email.toLowerCase();
    let emailChangeToken = null;
    let emailChangeTokenHash = null;

    if (emailChanged) {
        const emailLower = email.toLowerCase();
        const conflicts = await sql`
            SELECT id
            FROM users
            WHERE id <> ${sessionUser.id}
              AND (
                  email_lower = ${emailLower}
                  OR (
                      pending_email_lower = ${emailLower}
                      AND email_change_expires_at > NOW()
                  )
                  OR (
                      previous_email_lower = ${emailLower}
                      AND email_recovery_expires_at > NOW()
                  )
              )
            LIMIT 1
        `;
        if (conflicts[0]) throw conflict('An account already uses that email address.', 'email');

        emailChangeToken = generateActionToken();
        emailChangeTokenHash = hashActionToken(emailChangeToken);

    }

    let updated;
    try {
        const result = await sql`
            UPDATE users
            SET username = ${username},
                username_lower = ${username.toLowerCase()},
                pending_email = CASE WHEN ${emailChanged} THEN ${email} ELSE pending_email END,
                pending_email_lower = CASE
                    WHEN ${emailChanged} THEN ${email.toLowerCase()}
                    ELSE pending_email_lower
                END,
                email_change_token_hash = CASE
                    WHEN ${emailChanged} THEN ${emailChangeTokenHash}
                    ELSE email_change_token_hash
                END,
                email_change_expires_at = CASE
                    WHEN ${emailChanged}
                    THEN NOW() + make_interval(mins => ${EMAIL_CHANGE_MINUTES}::int)
                    ELSE email_change_expires_at
                END,
                updated_at = NOW()
            WHERE id = ${sessionUser.id}
            RETURNING id, username, email, must_change_password, token_version, created_at, last_login_at
        `;
        updated = result[0];
    } catch (error) {
        if (error.code === '23505') {
            if (String(error.constraint || '').includes('username')) {
                throw conflict('That username is already taken.', 'username');
            }
            throw conflict('An account already uses that email address.', 'email');
        }
        throw error;
    }

    if (emailChanged) {
        try {
            await sendEmailChangeConfirmationEmail({
                to: email,
                username,
                confirmUrl: `${siteUrlFrom(req)}/confirm-email?token=${encodeURIComponent(emailChangeToken)}`,
            });
        } catch (error) {
            // Store first so a successfully delivered message can never point
            // at a token that does not exist. If delivery fails, restore the
            // exact previous pending state and username, but only if this
            // request still owns the token (a newer request wins).
            await sql`
                UPDATE users
                SET username = ${record.username},
                    username_lower = ${record.username.toLowerCase()},
                    pending_email = ${record.pending_email},
                    pending_email_lower = ${record.pending_email_lower},
                    email_change_token_hash = ${record.email_change_token_hash},
                    email_change_expires_at = ${record.email_change_expires_at},
                    updated_at = NOW()
                WHERE id = ${sessionUser.id}
                  AND email_change_token_hash = ${emailChangeTokenHash}
            `;
            console.error('Failed to send email change confirmation:', error);
            throw new Error('Email change confirmation could not be delivered');
        }
    }

    res.status(200).json({
        user: publicUser(updated),
        message: emailChanged
            ? `Check ${email} to confirm the change. The link expires in one hour.`
            : 'Profile updated.',
    });
};

module.exports = withErrorHandling(handler);
