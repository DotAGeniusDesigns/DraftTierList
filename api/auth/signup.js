// POST /api/auth/signup — create an account and sign the new user straight in.

const { sql } = require('../../server/lib/db.js');
const {
    withErrorHandling, allowMethods, readJsonBody, badRequest, conflict,
    clientIp, enforceRateLimit,
} = require('../../server/lib/http.js');
const {
    hashPassword, createSessionToken, setSessionCookie, publicUser,
} = require('../../server/lib/auth.js');
const {
    validateUsername, validateEmail, validatePassword, validatePasswordConfirm,
} = require('../../server/lib/validate.js');

const handler = async (req, res) => {
    if (!allowMethods(req, res, ['POST'])) return;

    // Signup is unauthenticated and writes rows, so it is capped per IP.
    await enforceRateLimit(
        'signup', clientIp(req), 10, 60 * 60,
        'Too many accounts created from this connection. Try again in an hour.'
    );

    const body = readJsonBody(req);
    const username = String(body.username ?? '').trim();
    const email = String(body.email ?? '').trim();
    const password = String(body.password ?? '');
    const passwordConfirm = String(body.passwordConfirm ?? '');

    const usernameError = validateUsername(username);
    if (usernameError) throw badRequest(usernameError, 'username');

    const emailError = validateEmail(email);
    if (emailError) throw badRequest(emailError, 'email');

    const passwordError = validatePassword(password);
    if (passwordError) throw badRequest(passwordError, 'password');

    const confirmError = validatePasswordConfirm(password, passwordConfirm);
    if (confirmError) throw badRequest(confirmError, 'passwordConfirm');

    if (body.acceptedTerms !== true) {
        throw badRequest('Accept the Terms of Service and Privacy Policy to continue.', 'acceptedTerms');
    }

    const usernameLower = username.toLowerCase();
    const emailLower = email.toLowerCase();
    const reservedEmail = await sql`
        SELECT id
        FROM users
        WHERE (
            pending_email_lower = ${emailLower} AND email_change_expires_at > NOW()
        ) OR (
            previous_email_lower = ${emailLower} AND email_recovery_expires_at > NOW()
        )
        LIMIT 1
    `;
    if (reservedEmail[0]) {
        throw conflict('An account already exists for that email address.', 'email');
    }
    const passwordHash = await hashPassword(password);

    let user;
    try {
        const rows = await sql`
            INSERT INTO users (username, username_lower, email, email_lower, password_hash, last_login_at)
            VALUES (${username}, ${usernameLower}, ${email}, ${emailLower}, ${passwordHash}, NOW())
            RETURNING id, username, email, must_change_password, token_version, created_at, last_login_at
        `;
        user = rows[0];
    } catch (error) {
        // Let the unique indexes decide the winner rather than pre-checking,
        // which would leave a race between the check and the insert.
        if (error.code === '23505') {
            if (String(error.constraint || '').includes('username')) {
                throw conflict('That username is already taken.', 'username');
            }
            throw conflict('An account already exists for that email address.', 'email');
        }
        throw error;
    }

    setSessionCookie(res, createSessionToken(user));
    res.status(201).json({ user: publicUser(user) });
};

module.exports = withErrorHandling(handler);
