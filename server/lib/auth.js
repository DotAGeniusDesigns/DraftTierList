// Password hashing, purpose-limited JWT sessions, and session cookies.

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sql } = require('./db.js');
const { unauthorized } = require('./http.js');

const SESSION_COOKIE = 'ft_session';
const SESSION_DAYS = 30;
const SESSION_MAX_AGE = SESSION_DAYS * 24 * 60 * 60;
const RESET_SESSION_MINUTES = 15;
const RESET_SESSION_MAX_AGE = RESET_SESSION_MINUTES * 60;
const BCRYPT_ROUNDS = 12;
const DUMMY_PASSWORD_HASH = '$2b$12$g2dDh0BYKhJcXlMsiWPT2udXTcEqMopvz9Z4HcYyfkpj3XbbHAv8.';

const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET || SESSION_SECRET.length < 32) {
    throw new Error(
        'SESSION_SECRET is missing or too short. Set it to a random string of at least 32 characters.'
    );
}

const isProduction = process.env.VERCEL_ENV === 'production'
    || process.env.VERCEL_ENV === 'preview'
    || process.env.NODE_ENV === 'production';

const hashPassword = (password) => bcrypt.hash(password, BCRYPT_ROUNDS);
const verifyPassword = (password, hash) => bcrypt.compare(password, hash);
const verifyDummyPassword = (password) => bcrypt.compare(password, DUMMY_PASSWORD_HASH);

const generateTempPassword = () => {
    const letters = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
    const digits = '23456789';
    const alphabet = letters + digits;
    const pick = (pool) => pool[crypto.randomInt(0, pool.length)];
    const chars = Array.from({ length: 12 }, () => pick(alphabet));
    chars[0] = pick(letters);
    chars[11] = pick(digits);

    const raw = chars.join('');
    return `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}`;
};

const generateActionToken = () => crypto.randomBytes(32).toString('base64url');
const hashActionToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const createSessionToken = (user, purpose = 'session', expiresIn = `${SESSION_DAYS}d`) => jwt.sign(
    { sub: user.id, tv: user.token_version, purpose },
    SESSION_SECRET,
    { expiresIn }
);

const createPasswordResetToken = (user) => createSessionToken(
    user,
    'password-reset',
    `${RESET_SESSION_MINUTES}m`
);

const buildCookie = (value, maxAge) => {
    const parts = [
        `${SESSION_COOKIE}=${value}`,
        'Path=/',
        'HttpOnly',
        'SameSite=Lax',
        `Max-Age=${maxAge}`,
    ];
    if (isProduction) parts.push('Secure');
    return parts.join('; ');
};

const setSessionCookie = (res, token, maxAge = SESSION_MAX_AGE) => {
    res.setHeader('Set-Cookie', buildCookie(token, maxAge));
};

const setPasswordResetCookie = (res, token) => {
    setSessionCookie(res, token, RESET_SESSION_MAX_AGE);
};

const clearSessionCookie = (res) => {
    res.setHeader('Set-Cookie', buildCookie('', 0));
};

const readSessionCookie = (req) => {
    if (req.cookies && req.cookies[SESSION_COOKIE]) return req.cookies[SESSION_COOKIE];

    const header = req.headers.cookie;
    if (!header) return null;

    for (const part of header.split(';')) {
        const index = part.indexOf('=');
        if (index === -1) continue;
        if (part.slice(0, index).trim() === SESSION_COOKIE) {
            return decodeURIComponent(part.slice(index + 1).trim());
        }
    }
    return null;
};

const getSessionUser = async (req) => {
    const token = readSessionCookie(req);
    if (!token) return null;

    let payload;
    try {
        payload = jwt.verify(token, SESSION_SECRET);
    } catch {
        return null;
    }

    const rows = await sql`
        SELECT id, username, email, must_change_password, token_version, created_at, last_login_at
        FROM users
        WHERE id = ${payload.sub}
    `;
    const user = rows[0];
    if (!user || user.token_version !== payload.tv) return null;

    const purpose = payload.purpose || 'session';
    if (!['session', 'password-reset'].includes(purpose)) return null;
    return { ...user, session_purpose: purpose };
};

const requireUser = async (req) => {
    const user = await getSessionUser(req);
    if (!user) throw unauthorized('Your session has expired. Sign in again.');
    if (user.session_purpose !== 'session' || user.must_change_password) {
        throw unauthorized('Choose a new password before using your account.');
    }
    return user;
};

const requirePasswordChangeUser = async (req) => {
    const user = await getSessionUser(req);
    if (!user) throw unauthorized('Your password-reset session has expired. Sign in again.');
    return user;
};

const publicUser = (user) => ({
    id: user.id,
    username: user.username,
    email: user.email,
    mustChangePassword: Boolean(
        user.must_change_password || user.session_purpose === 'password-reset'
    ),
    createdAt: user.created_at,
    lastLoginAt: user.last_login_at || null,
});

module.exports = {
    SESSION_COOKIE,
    hashPassword,
    verifyPassword,
    verifyDummyPassword,
    generateTempPassword,
    generateActionToken,
    hashActionToken,
    createSessionToken,
    createPasswordResetToken,
    setSessionCookie,
    setPasswordResetCookie,
    clearSessionCookie,
    getSessionUser,
    requireUser,
    requirePasswordChangeUser,
    publicUser,
};
