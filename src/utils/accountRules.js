// Browser-side mirror of server/lib/validate.js.
//
// The server is the authority — it re-runs every one of these checks and its
// message wins. These exist so a typo is caught as the user types instead of
// after a round trip. Change one file, change the other.

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 20;
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 72;

const USERNAME_PATTERN = /^[a-zA-Z0-9](?:[a-zA-Z0-9_-]*[a-zA-Z0-9])?$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const RESERVED_USERNAMES = new Set([
    'admin', 'administrator', 'root', 'support', 'help', 'staff', 'moderator',
    'mod', 'system', 'api', 'login', 'logout', 'signup', 'register', 'profile',
    'settings', 'account', 'privacy', 'terms', 'draft-board', 'draftlist',
    'fantasytoolkit', 'null', 'undefined', 'anonymous', 'me',
]);

export const validateUsername = (value) => {
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

export const validateEmail = (value) => {
    const email = String(value ?? '').trim();
    if (!email) return 'Enter your email address.';
    if (email.length > 254) return 'That email address is too long.';
    if (!EMAIL_PATTERN.test(email)) return 'Enter a valid email address.';
    return null;
};

export const validatePassword = (value) => {
    const password = String(value ?? '');
    if (!password) return 'Enter a password.';
    if (password.length < PASSWORD_MIN) return `Passwords need at least ${PASSWORD_MIN} characters.`;
    if (new TextEncoder().encode(password).length > PASSWORD_MAX) {
        return `Passwords can be at most ${PASSWORD_MAX} UTF-8 bytes.`;
    }
    if (!/[a-zA-Z]/.test(password)) return 'Include at least one letter.';
    if (!/[0-9]/.test(password)) return 'Include at least one number.';
    return null;
};

export const validatePasswordConfirm = (password, confirm) => {
    if (!confirm) return 'Confirm your password.';
    if (password !== confirm) return 'Those passwords do not match.';
    return null;
};

/**
 * A rough 0-4 strength score for the signup meter. Deliberately simple and
 * advisory — validatePassword above is what actually gates submission.
 */
export const passwordStrength = (value) => {
    const password = String(value ?? '');
    if (!password) return { score: 0, label: '' };

    let score = 0;
    if (password.length >= PASSWORD_MIN) score += 1;
    if (password.length >= 12) score += 1;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password) && /[^a-zA-Z0-9]/.test(password)) score += 1;

    const labels = ['Too short', 'Weak', 'Okay', 'Good', 'Strong'];
    return { score, label: labels[score] };
};
