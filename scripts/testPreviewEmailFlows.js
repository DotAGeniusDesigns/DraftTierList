/* eslint-disable no-console */

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const { promisify } = require('node:util');
const { execFile } = require('node:child_process');

const execFileAsync = promisify(execFile);
const BASE_URL = process.env.TEST_BASE_URL;
if (!BASE_URL) throw new Error('TEST_BASE_URL is required.');
const ORIGIN = new URL(BASE_URL).origin;
const suffix = crypto.randomBytes(4).toString('hex');
const account = {
    username: `flows${suffix}`,
    email: `flows-${suffix}@example.com`,
    password: 'FlowPass123!',
};
const changedEmail = `flows-new-${suffix}@example.com`;

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

const client = () => ({ cookie: '' });
const initialClient = client();
const resetClient = client();
const confirmClient = client();
const recoveryClient = client();
let cleanupClient = initialClient;
let cleanupPassword = account.password;
let needsPasswordChange = false;

const request = async (session, path, {
    method = 'GET',
    body,
} = {}) => {
    const headers = { Origin: ORIGIN };
    const cookies = [protectionCookie, session.cookie].filter(Boolean);
    if (cookies.length > 0) headers.Cookie = cookies.join('; ');
    if (body !== undefined) headers['Content-Type'] = 'application/json';

    const response = await fetch(`${BASE_URL}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
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
            throw new Error(`${method} ${path} returned non-JSON (${response.status}).`);
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

const collectStrings = (value, output = []) => {
    if (typeof value === 'string') output.push(value);
    else if (Array.isArray(value)) value.forEach((entry) => collectStrings(entry, output));
    else if (value && typeof value === 'object') {
        Object.values(value).forEach((entry) => collectStrings(entry, output));
    }
    return output;
};

const recentLogText = async () => {
    const { stdout } = await execFileAsync('vercel', [
        'logs',
        BASE_URL,
        '--since', '10m',
        '--limit', '100',
        '--json',
        '--no-branch',
    ], {
        cwd: process.cwd(),
        encoding: 'utf8',
        maxBuffer: 2 * 1024 * 1024,
    });

    return stdout
        .split(/\r?\n/)
        .filter(Boolean)
        .flatMap((line) => {
            try {
                return collectStrings(JSON.parse(line));
            } catch {
                return [];
            }
        })
        .join('\n');
};

const waitForLogMatch = async (pattern, description) => {
    for (let attempt = 0; attempt < 15; attempt += 1) {
        const text = await recentLogText();
        const match = text.match(pattern);
        if (match) return match[1];
        await new Promise((resolve) => setTimeout(resolve, 2000));
    }
    throw new Error(`Timed out waiting for ${description} in Preview logs.`);
};

const changeResetPassword = async (session, password) => {
    const result = await expectStatus(200, session, '/api/account/password', {
        method: 'POST',
        body: { newPassword: password, newPasswordConfirm: password },
    });
    assert.equal(result.user.mustChangePassword, false);
    needsPasswordChange = false;
    cleanupClient = session;
    cleanupPassword = password;
};

const run = async () => {
    console.log('Creating isolated email-flow account…');
    await expectStatus(201, initialClient, '/api/auth/signup', {
        method: 'POST',
        body: {
            username: account.username,
            email: account.email,
            password: account.password,
            passwordConfirm: account.password,
            acceptedTerms: true,
        },
    });

    console.log('Testing temporary-password redemption and reset-only access…');
    await expectStatus(200, client(), '/api/auth/forgot-password', {
        method: 'POST',
        body: { email: account.email },
    });
    const tempPassword = await waitForLogMatch(
        new RegExp(`To: ${account.email}[\\s\\S]*?temporary Fantasy Toolkit password is: ([A-Za-z0-9-]+)`),
        'temporary password'
    );
    const tempLogin = await expectStatus(200, resetClient, '/api/auth/login', {
        method: 'POST',
        body: { identifier: account.email, password: tempPassword },
    });
    needsPasswordChange = true;
    cleanupClient = resetClient;
    assert.equal(tempLogin.user.mustChangePassword, true);
    const invalidated = await expectStatus(200, initialClient, '/api/auth/me');
    assert.equal(invalidated.user, null);
    await expectStatus(401, resetClient, '/api/boards');
    await expectStatus(401, client(), '/api/auth/login', {
        method: 'POST',
        body: { identifier: account.email, password: tempPassword },
    });

    const postResetPassword = 'FlowPass456!';
    await changeResetPassword(resetClient, postResetPassword);
    await expectStatus(200, resetClient, '/api/boards');

    console.log('Testing email confirmation and old-address recovery…');
    const staged = await expectStatus(200, resetClient, '/api/account/profile', {
        method: 'POST',
        body: { email: changedEmail, currentPassword: postResetPassword },
    });
    assert.equal(staged.user.email, account.email);
    const confirmToken = await waitForLogMatch(
        new RegExp(`To: ${changedEmail}[\\s\\S]*?/confirm-email\\?token=([A-Za-z0-9_-]+)`),
        'email confirmation token'
    );
    const confirmed = await expectStatus(200, confirmClient, '/api/account/confirm-email', {
        method: 'POST',
        body: { token: confirmToken },
    });
    cleanupClient = confirmClient;
    assert.equal(confirmed.user.email, changedEmail);
    const staleAfterEmailChange = await expectStatus(200, resetClient, '/api/auth/me');
    assert.equal(staleAfterEmailChange.user, null);

    const recoveryToken = await waitForLogMatch(
        new RegExp(`To: ${account.email}[\\s\\S]*?/recover-email\\?token=([A-Za-z0-9_-]+)`),
        'email recovery token'
    );
    const recovered = await expectStatus(200, recoveryClient, '/api/account/recover-email', {
        method: 'POST',
        body: { token: recoveryToken },
    });
    needsPasswordChange = true;
    cleanupClient = recoveryClient;
    assert.equal(recovered.user.email, account.email);
    assert.equal(recovered.user.mustChangePassword, true);
    await expectStatus(401, recoveryClient, '/api/boards');

    await changeResetPassword(recoveryClient, 'FlowPass789!');
    console.log('All temporary-password and email recovery checks passed.');
};

const cleanup = async () => {
    try {
        if (needsPasswordChange && cleanupClient.cookie) {
            await changeResetPassword(cleanupClient, 'FlowCleanup789!');
        }
        if (cleanupClient.cookie) {
            await request(cleanupClient, '/api/account/delete', {
                method: 'POST',
                body: { currentPassword: cleanupPassword, confirm: 'DELETE' },
            });
        }
    } catch (error) {
        console.error('Test cleanup failed:', error.message);
        if (!process.exitCode) process.exitCode = 1;
    }
};

run()
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(cleanup);
