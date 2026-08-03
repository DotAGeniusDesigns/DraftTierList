// POST /api/auth/login — accepts either a username or an email address.

const { sql } = require('../../server/lib/db.js');
const {
    withErrorHandling, allowMethods, readJsonBody, badRequest, unauthorized,
    clientIp, enforceRateLimit, clearRateLimit,
} = require('../../server/lib/http.js');
const {
    verifyPassword, verifyDummyPassword, createSessionToken, createPasswordResetToken,
    setSessionCookie, setPasswordResetCookie, publicUser,
} = require('../../server/lib/auth.js');

const handler = async (req, res) => {
    if (!allowMethods(req, res, ['POST'])) return;

    const body = readJsonBody(req);
    const identifier = String(body.identifier ?? '').trim();
    const password = String(body.password ?? '');

    if (!identifier) throw badRequest('Enter your username or email.', 'identifier');
    if (!password) throw badRequest('Enter your password.', 'password');

    const ip = clientIp(req);
    const identifierLower = identifier.toLowerCase();

    // Two limits on purpose: the per-IP one stops a broad spray, the
    // per-account one stops a distributed attack on a single account.
    await enforceRateLimit(
        'login_ip', ip, 30, 15 * 60,
        'Too many sign-in attempts from this connection. Try again in 15 minutes.'
    );
    await enforceRateLimit(
        'login_account', identifierLower, 10, 15 * 60,
        'Too many sign-in attempts for this account. Try again in 15 minutes.'
    );

    const rows = await sql`
        SELECT id, username, email, password_hash, must_change_password,
               temp_password_hash, temp_password_expires_at,
               token_version, created_at, last_login_at
        FROM users
        WHERE username_lower = ${identifierLower} OR email_lower = ${identifierLower}
        LIMIT 1
    `;
    const user = rows[0];

    // One message for "no such user" and "wrong password" so the endpoint
    // can't be used to enumerate which accounts exist.
    const rejection = unauthorized('That username or password is not right.');
    if (!user) {
        await Promise.all([verifyDummyPassword(password), verifyDummyPassword(password)]);
        throw rejection;
    }

    const tempIsLive = Boolean(user.temp_password_hash)
        && Boolean(user.temp_password_expires_at)
        && new Date(user.temp_password_expires_at) > new Date();
    // Always perform two bcrypt comparisons. A missing temp hash uses the same
    // dummy work as a missing account so timing reveals as little state as possible.
    const [realMatches, tempCandidateMatches] = await Promise.all([
        verifyPassword(password, user.password_hash),
        user.temp_password_hash
            ? verifyPassword(password, user.temp_password_hash)
            : verifyDummyPassword(password),
    ]);
    const tempMatches = tempIsLive && tempCandidateMatches;

    if (!realMatches && !tempMatches) {
        // Distinguish "expired temp password" only when it is genuinely the
        // password being offered — otherwise this would leak account state.
        if (user.temp_password_hash && !tempIsLive && tempCandidateMatches) {
            throw unauthorized('That temporary password has expired. Request a new one.');
        }
        throw rejection;
    }

    let updatedUser;
    if (tempMatches) {
        // Consume the exact temp credential we verified. The conditional update
        // makes redemption single-use even when two requests arrive together.
        const updated = await sql`
            UPDATE users
            SET last_login_at = NOW(),
                must_change_password = TRUE,
                temp_password_hash = NULL,
                temp_password_expires_at = NULL,
                token_version = token_version + 1,
                updated_at = NOW()
            WHERE id = ${user.id}
              AND temp_password_hash = ${user.temp_password_hash}
              AND temp_password_expires_at > NOW()
            RETURNING id, username, email, must_change_password, token_version,
                      created_at, last_login_at
        `;
        if (!updated[0]) throw rejection;
        updatedUser = { ...updated[0], session_purpose: 'password-reset' };
    } else {
        // The real password still works, so any outstanding reset was either
        // not the owner or no longer needed. If a reset-only session had
        // already been issued, rotate once more to revoke it.
        const updated = await sql`
            UPDATE users
            SET last_login_at = NOW(),
                must_change_password = FALSE,
                temp_password_hash = NULL,
                temp_password_expires_at = NULL,
                token_version = token_version + CASE WHEN must_change_password THEN 1 ELSE 0 END,
                updated_at = NOW()
            WHERE id = ${user.id}
            RETURNING id, username, email, must_change_password, token_version,
                      created_at, last_login_at
        `;
        updatedUser = { ...updated[0], session_purpose: 'session' };
    }

    await clearRateLimit('login_account', identifierLower);

    if (tempMatches) {
        setPasswordResetCookie(res, createPasswordResetToken(updatedUser));
    } else {
        setSessionCookie(res, createSessionToken(updatedUser));
    }
    res.status(200).json({
        user: publicUser(updatedUser),
    });
};

module.exports = withErrorHandling(handler);
