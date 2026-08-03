/* eslint-disable no-console */

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const LZString = require('lz-string');

const BASE_URL = process.env.TEST_BASE_URL;
if (!BASE_URL) throw new Error('TEST_BASE_URL is required.');
const ORIGIN = new URL(BASE_URL).origin;
const suffix = crypto.randomBytes(4).toString('hex');
const protectionCookie = (() => {
    const cookieFile = process.env.VERCEL_BYPASS_COOKIE_FILE;
    if (!cookieFile) return '';
    return fs.readFileSync(cookieFile, 'utf8')
        .split(/\r?\n/)
        .filter((line) => line && (!line.startsWith('#') || line.startsWith('#HttpOnly_')))
        .map((line) => {
            const fields = line.replace(/^#HttpOnly_/, '').split('\t');
            return fields.length >= 7 ? `${fields[5]}=${fields[6]}` : '';
        })
        .filter(Boolean)
        .join('; ');
})();

const accounts = [
    { username: `smokea${suffix}`, email: `smokea-${suffix}@example.com`, password: 'AlphaPass123!' },
    { username: `smokeb${suffix}`, email: `smokeb-${suffix}@example.com`, password: 'BravoPass123!' },
    { username: `smokec${suffix}`, email: `smokec-${suffix}@example.com`, password: 'CharliePass123!' },
];
const clients = accounts.map(() => ({ cookie: '' }));

const request = async (session, path, {
    method = 'GET',
    body,
    origin = ORIGIN,
    contentType = 'application/json',
} = {}) => {
    const headers = {};
    if (origin) headers.Origin = origin;
    const cookies = [protectionCookie, session.cookie].filter(Boolean);
    if (cookies.length > 0) headers.Cookie = cookies.join('; ');
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
    b: [[1, 'smoke-player']],
    tn: { 1: 'Smoke Tier' },
}));

const cleanup = async () => {
    await Promise.allSettled(accounts.map((account, index) => (
        clients[index].cookie
            ? request(clients[index], '/api/account/delete', {
                method: 'POST',
                body: { currentPassword: account.password, confirm: 'DELETE' },
            })
            : Promise.resolve()
    )));
};

const run = async () => {
    console.log(`Smoke testing ${BASE_URL}`);
    await expectStatus(200, { cookie: '' }, '/api/auth/me');
    await expectStatus(403, { cookie: '' }, '/api/auth/signup', {
        method: 'POST',
        origin: 'https://attacker.example',
        body: {},
    });
    await expectStatus(400, { cookie: '' }, '/api/auth/signup', {
        method: 'POST',
        body: '{}',
        contentType: 'text/plain',
    });

    console.log('Testing account creation and duplicate protection…');
    await Promise.all(accounts.map((account, index) => signup(clients[index], account)));
    await expectStatus(409, { cookie: '' }, '/api/auth/signup', {
        method: 'POST',
        body: {
            username: `other${suffix}`,
            email: accounts[0].email,
            password: accounts[0].password,
            passwordConfirm: accounts[0].password,
            acceptedTerms: true,
        },
    });
    await expectStatus(400, { cookie: '' }, '/api/auth/signup', {
        method: 'POST',
        body: {
            username: `long${suffix}`,
            email: `long-${suffix}@example.com`,
            password: `${'界'.repeat(24)}a1x`,
            passwordConfirm: `${'界'.repeat(24)}a1x`,
            acceptedTerms: true,
        },
    });

    console.log('Testing board validation, isolation, and quota…');
    const firstBoard = await expectStatus(201, clients[0], '/api/boards', {
        method: 'POST',
        body: { name: 'Board 1', code: validBoardCode, playerCount: 1 },
    });
    await expectStatus(400, clients[0], '/api/boards', {
        method: 'POST',
        body: { name: 'Broken', code: 'not-a-board', playerCount: 1 },
    });
    await expectStatus(404, clients[1], `/api/boards/${firstBoard.board.id}`);
    for (let index = 2; index <= 25; index += 1) {
        await expectStatus(201, clients[0], '/api/boards', {
            method: 'POST',
            body: { name: `Board ${index}`, code: validBoardCode, playerCount: index },
        });
    }
    await expectStatus(409, clients[0], '/api/boards', {
        method: 'POST',
        body: { name: 'Board 26', code: validBoardCode, playerCount: 26 },
    });

    console.log('Testing session and password security…');
    const secondDevice = { cookie: '' };
    await login(secondDevice, accounts[0].username, accounts[0].password);
    await expectStatus(200, clients[0], '/api/account/sessions', {
        method: 'POST',
        body: { currentPassword: accounts[0].password },
    });
    const invalidated = await expectStatus(200, secondDevice, '/api/auth/me');
    assert.equal(invalidated.user, null);

    const oldPassword = accounts[0].password;
    accounts[0].password = 'AlphaPass456!';
    await expectStatus(200, clients[0], '/api/account/password', {
        method: 'POST',
        body: {
            currentPassword: oldPassword,
            newPassword: accounts[0].password,
            newPasswordConfirm: accounts[0].password,
        },
    });
    await login({ cookie: '' }, accounts[0].username, oldPassword, 401);
    await login({ cookie: '' }, accounts[0].username, accounts[0].password);

    console.log('Testing reset and email-action routes…');
    await expectStatus(200, { cookie: '' }, '/api/auth/forgot-password', {
        method: 'POST',
        body: { email: accounts[2].email },
    });
    await expectStatus(200, { cookie: '' }, '/api/auth/forgot-password', {
        method: 'POST',
        body: { email: `missing-${suffix}@example.com` },
    });
    const requestedEmail = `smokec-new-${suffix}@example.com`;
    const profileResult = await expectStatus(200, clients[2], '/api/account/profile', {
        method: 'POST',
        body: { email: requestedEmail, currentPassword: accounts[2].password },
    });
    assert.equal(profileResult.user.email, accounts[2].email);
    await expectStatus(400, { cookie: '' }, '/api/account/confirm-email', {
        method: 'POST',
        body: { token: 'invalid' },
    });
    await expectStatus(400, { cookie: '' }, '/api/account/recover-email', {
        method: 'POST',
        body: { token: 'invalid' },
    });

    console.log('All Preview smoke checks passed.');
};

run()
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(cleanup);
