/* eslint-disable no-console */

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');
const LZString = require('lz-string');
const { neon } = require('@neondatabase/serverless');

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3100';
const ORIGIN = new URL(BASE_URL).origin;
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) throw new Error('DATABASE_URL is required. Run with --env-file=.env.local.');
try {
    const parsedDatabaseUrl = new URL(DATABASE_URL);
    if (!['postgres:', 'postgresql:'].includes(parsedDatabaseUrl.protocol)) throw new Error();
} catch {
    throw new Error(
        `DATABASE_URL is not a usable Postgres URL (length ${DATABASE_URL.length}, `
        + `starts with postgres: ${DATABASE_URL.startsWith('postgres')}).`
    );
}

const sql = neon(DATABASE_URL);
const suffix = crypto.randomBytes(4).toString('hex');
const accounts = {
    a: { username: `testa${suffix}`, email: `testa-${suffix}@example.com`, password: 'AlphaPass123!' },
    b: { username: `testb${suffix}`, email: `testb-${suffix}@example.com`, password: 'BravoPass123!' },
    c: { username: `testc${suffix}`, email: `testc-${suffix}@example.com`, password: 'CharliePass123!' },
};

const client = () => ({ cookie: '' });

const request = async (session, path, {
    method = 'GET',
    body,
    origin = ORIGIN,
    contentType = 'application/json',
} = {}) => {
    const headers = {};
    if (origin) headers.Origin = origin;
    if (session.cookie) headers.Cookie = session.cookie;
    if (body !== undefined && contentType) headers['Content-Type'] = contentType;

    const response = await fetch(`${BASE_URL}${path}`, {
        method,
        headers,
        body: body === undefined
            ? undefined
            : (contentType === 'application/json' ? JSON.stringify(body) : String(body)),
        redirect: 'manual',
    });
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) session.cookie = setCookie.split(';')[0];
    const text = await response.text();
    let data = null;
    if (text) {
        try {
            data = JSON.parse(text);
        } catch {
            throw new Error(`${method} ${path} returned non-JSON (${response.status}): ${text.slice(0, 120)}`);
        }
    }
    return { status: response.status, data };
};

const expectStatus = async (expected, session, path, options) => {
    const result = await request(session, path, options);
    assert.equal(
        result.status,
        expected,
        `${options?.method || 'GET'} ${path}: expected ${expected}, got ${result.status} (${JSON.stringify(result.data)})`
    );
    return result.data;
};

const signup = (session, account) => expectStatus(201, session, '/api/auth/signup', {
    method: 'POST',
    body: {
        username: account.username,
        email: account.email,
        password: account.password,
        passwordConfirm: account.password,
        acceptedTerms: true,
    },
});

const login = (session, identifier, password, expected = 200) => expectStatus(
    expected,
    session,
    '/api/auth/login',
    { method: 'POST', body: { identifier, password } }
);

const validBoardCode = LZString.compressToEncodedURIComponent(JSON.stringify({
    v: 3,
    ts: Math.floor(Date.now() / 1000),
    b: [[1, 'integration-player']],
    tn: { 1: 'Integration Tier' },
}));

const tokenHash = (token) => crypto.createHash('sha256').update(token).digest('hex');

const run = async () => {
    const a1 = client();
    const a2 = client();
    const b1 = client();
    const c1 = client();
    const c2 = client();

    console.log('Testing request-origin and content-type enforcement…');
    await expectStatus(403, client(), '/api/auth/signup', {
        method: 'POST',
        origin: 'https://attacker.example',
        body: {},
    });
    await expectStatus(400, client(), '/api/auth/signup', {
        method: 'POST',
        body: '{}',
        contentType: 'text/plain',
    });

    console.log('Testing signup, duplicate handling, and password byte limits…');
    await signup(a1, accounts.a);
    await signup(b1, accounts.b);
    await signup(c1, accounts.c);
    await expectStatus(409, client(), '/api/auth/signup', {
        method: 'POST',
        body: {
            username: `other${suffix}`,
            email: accounts.a.email,
            password: accounts.a.password,
            passwordConfirm: accounts.a.password,
            acceptedTerms: true,
        },
    });
    const longPassword = `${'界'.repeat(24)}a1x`;
    await expectStatus(400, client(), '/api/auth/signup', {
        method: 'POST',
        body: {
            username: `long${suffix}`,
            email: `long-${suffix}@example.com`,
            password: longPassword,
            passwordConfirm: longPassword,
            acceptedTerms: true,
        },
    });

    console.log('Testing cloud-board validation, quota, and account isolation…');
    const firstBoard = await expectStatus(201, a1, '/api/boards', {
        method: 'POST',
        body: { name: 'Board 1', code: validBoardCode, playerCount: 1 },
    });
    await expectStatus(400, a1, '/api/boards', {
        method: 'POST',
        body: { name: 'Broken', code: 'not-a-board', playerCount: 1 },
    });
    await expectStatus(404, b1, `/api/boards/${firstBoard.board.id}`);
    for (let index = 2; index <= 25; index += 1) {
        await expectStatus(201, a1, '/api/boards', {
            method: 'POST',
            body: { name: `Board ${index}`, code: validBoardCode, playerCount: index },
        });
    }
    await expectStatus(409, a1, '/api/boards', {
        method: 'POST',
        body: { name: 'Board 26', code: validBoardCode, playerCount: 26 },
    });

    console.log('Testing session invalidation and password changes…');
    await login(a2, accounts.a.username, accounts.a.password);
    const sessionsResult = await expectStatus(200, a1, '/api/account/sessions', {
        method: 'POST',
        body: { currentPassword: accounts.a.password },
    });
    assert.match(sessionsResult.message, /other devices/i);
    const invalidatedMe = await expectStatus(200, a2, '/api/auth/me');
    assert.equal(invalidatedMe.user, null);

    const newAPassword = 'AlphaPass456!';
    await expectStatus(200, a1, '/api/account/password', {
        method: 'POST',
        body: {
            currentPassword: accounts.a.password,
            newPassword: newAPassword,
            newPasswordConfirm: newAPassword,
        },
    });
    await login(client(), accounts.a.username, accounts.a.password, 401);
    await login(client(), accounts.a.username, newAPassword);

    console.log('Testing temporary-password reset-only sessions…');
    await login(c2, accounts.c.username, accounts.c.password);
    await expectStatus(200, client(), '/api/auth/forgot-password', {
        method: 'POST',
        body: { email: accounts.c.email },
    });
    await expectStatus(200, client(), '/api/auth/forgot-password', {
        method: 'POST',
        body: { email: `missing-${suffix}@example.com` },
    });

    const knownTemp = 'Temp-Test-42';
    const knownTempHash = await bcrypt.hash(knownTemp, 12);
    await sql`
        UPDATE users
        SET temp_password_hash = ${knownTempHash},
            temp_password_expires_at = NOW() + INTERVAL '60 minutes'
        WHERE email_lower = ${accounts.c.email.toLowerCase()}
    `;

    const resetClient = client();
    const tempLogin = await login(resetClient, accounts.c.email, knownTemp);
    assert.equal(tempLogin.user.mustChangePassword, true);
    const oldSession = await expectStatus(200, c2, '/api/auth/me');
    assert.equal(oldSession.user, null);
    await expectStatus(401, resetClient, '/api/boards');
    await login(client(), accounts.c.email, knownTemp, 401);

    const newCPassword = 'CharliePass456!';
    const resetDone = await expectStatus(200, resetClient, '/api/account/password', {
        method: 'POST',
        body: { newPassword: newCPassword, newPasswordConfirm: newCPassword },
    });
    assert.equal(resetDone.user.mustChangePassword, false);
    await expectStatus(200, resetClient, '/api/boards');

    console.log('Testing staged email confirmation and recovery…');
    const requestedEmail = `testc-new-${suffix}@example.com`;
    const profileResult = await expectStatus(200, resetClient, '/api/account/profile', {
        method: 'POST',
        body: { email: requestedEmail, currentPassword: newCPassword },
    });
    assert.equal(profileResult.user.email, accounts.c.email);
    const pendingRows = await sql`
        SELECT pending_email FROM users WHERE email_lower = ${accounts.c.email.toLowerCase()}
    `;
    assert.equal(pendingRows[0].pending_email, requestedEmail);

    const confirmToken = crypto.randomBytes(32).toString('base64url');
    await sql`
        UPDATE users
        SET email_change_token_hash = ${tokenHash(confirmToken)},
            email_change_expires_at = NOW() + INTERVAL '60 minutes'
        WHERE email_lower = ${accounts.c.email.toLowerCase()}
    `;
    const confirmClient = client();
    const confirmed = await expectStatus(200, confirmClient, '/api/account/confirm-email', {
        method: 'POST',
        body: { token: confirmToken },
    });
    assert.equal(confirmed.user.email, requestedEmail);

    const recoveryToken = crypto.randomBytes(32).toString('base64url');
    await sql`
        UPDATE users
        SET email_recovery_token_hash = ${tokenHash(recoveryToken)},
            email_recovery_expires_at = NOW() + INTERVAL '24 hours'
        WHERE email_lower = ${requestedEmail.toLowerCase()}
    `;
    const recoveryClient = client();
    const recovered = await expectStatus(200, recoveryClient, '/api/account/recover-email', {
        method: 'POST',
        body: { token: recoveryToken },
    });
    assert.equal(recovered.user.email, accounts.c.email);
    assert.equal(recovered.user.mustChangePassword, true);
    await expectStatus(401, recoveryClient, '/api/boards');
    await expectStatus(200, recoveryClient, '/api/account/password', {
        method: 'POST',
        body: {
            newPassword: 'CharliePass789!',
            newPasswordConfirm: 'CharliePass789!',
        },
    });

    console.log('All account integration checks passed.');
};

run()
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await sql`
            DELETE FROM users
            WHERE email_lower IN (
                ${accounts.a.email.toLowerCase()},
                ${accounts.b.email.toLowerCase()},
                ${accounts.c.email.toLowerCase()},
                ${`testc-new-${suffix}@example.com`}
            )
        `;
    });
