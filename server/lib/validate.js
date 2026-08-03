// Authoritative account and board validation rules. The browser mirrors the
// account rules in src/utils/accountRules.js for immediate feedback.

const LZString = require('lz-string');

const USERNAME_MIN = 3;
const USERNAME_MAX = 20;
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 72;

const USERNAME_PATTERN = /^[a-zA-Z0-9](?:[a-zA-Z0-9_-]*[a-zA-Z0-9])?$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const RESERVED_USERNAMES = new Set([
    'admin', 'administrator', 'root', 'support', 'help', 'staff', 'moderator',
    'mod', 'system', 'api', 'login', 'logout', 'signup', 'register', 'profile',
    'settings', 'account', 'privacy', 'terms', 'draft-board', 'draftlist',
    'fantasytoolkit', 'null', 'undefined', 'anonymous', 'me',
]);

const validateUsername = (value) => {
    const username = String(value ?? '').trim();
    if (!username) return 'Pick a username.';
    if (username.length < USERNAME_MIN) return `Usernames need at least ${USERNAME_MIN} characters.`;
    if (username.length > USERNAME_MAX) return `Usernames can be at most ${USERNAME_MAX} characters.`;
    if (!USERNAME_PATTERN.test(username)) {
        return 'Usernames can use letters, numbers, underscores and hyphens, and must start and end with a letter or number.';
    }
    if (RESERVED_USERNAMES.has(username.toLowerCase())) return 'That username is reserved.';
    return null;
};

const validateEmail = (value) => {
    const email = String(value ?? '').trim();
    if (!email) return 'Enter your email address.';
    if (email.length > 254) return 'That email address is too long.';
    if (!EMAIL_PATTERN.test(email)) return 'Enter a valid email address.';
    return null;
};

const validatePassword = (value) => {
    const password = String(value ?? '');
    if (!password) return 'Enter a password.';
    if (password.length < PASSWORD_MIN) return `Passwords need at least ${PASSWORD_MIN} characters.`;
    if (Buffer.byteLength(password, 'utf8') > PASSWORD_MAX) {
        return `Passwords can be at most ${PASSWORD_MAX} UTF-8 bytes.`;
    }
    if (!/[a-zA-Z]/.test(password)) return 'Include at least one letter.';
    if (!/[0-9]/.test(password)) return 'Include at least one number.';
    return null;
};

const validatePasswordConfirm = (password, confirm) => {
    if (!confirm) return 'Confirm your password.';
    if (password !== confirm) return 'Those passwords do not match.';
    return null;
};

const validateBoardName = (value) => {
    const name = String(value ?? '').trim();
    if (!name) return 'Give this board a name.';
    if (name.length > 60) return 'Board names can be at most 60 characters.';
    return null;
};

const validateBoardCode = (value) => {
    const code = String(value ?? '');
    let json;
    try {
        json = LZString.decompressFromEncodedURIComponent(code);
    } catch {
        return 'That board data is invalid.';
    }
    if (!json || json.length > 1_000_000) return 'That board data is invalid.';

    let data;
    try {
        data = JSON.parse(json);
    } catch {
        return 'That board data is invalid.';
    }

    if (data?.v !== 3 || !Array.isArray(data.b) || data.b.length > 2_000) {
        return 'That board data is invalid or uses an unsupported version.';
    }
    const invalidTier = data.b.some((entry) => (
        !Array.isArray(entry)
        || entry.length !== 2
        || !Number.isInteger(Number(entry[0]))
        || Number(entry[0]) < 1
        || Number(entry[0]) > 10_000
        || typeof entry[1] !== 'string'
        || entry[1].length > 500_000
    ));
    if (invalidTier) return 'That board data is invalid.';

    if (data.tn !== undefined && (
        !data.tn || typeof data.tn !== 'object' || Array.isArray(data.tn)
    )) {
        return 'That board data is invalid.';
    }
    if (data.f !== undefined && (
        !data.f || typeof data.f !== 'object' || Array.isArray(data.f)
    )) {
        return 'That board data is invalid.';
    }
    return null;
};

module.exports = {
    USERNAME_MIN,
    USERNAME_MAX,
    PASSWORD_MIN,
    PASSWORD_MAX,
    validateUsername,
    validateEmail,
    validatePassword,
    validatePasswordConfirm,
    validateBoardName,
    validateBoardCode,
};
