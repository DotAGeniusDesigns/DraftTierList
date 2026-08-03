// Shared request validation, API errors, and database-backed rate limiting.

const { sql, ensureSchema } = require('./db.js');

class ApiError extends Error {
    constructor(status, message, field = null) {
        super(message);
        this.status = status;
        this.field = field;
    }
}

const badRequest = (message, field = null) => new ApiError(400, message, field);
const unauthorized = (message = 'Sign in to continue.') => new ApiError(401, message);
const forbidden = (message = 'This request is not allowed.') => new ApiError(403, message);
const notFound = (message = 'Not found.') => new ApiError(404, message);
const conflict = (message, field = null) => new ApiError(409, message, field);
const tooManyRequests = (message) => new ApiError(429, message);

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const validateMutationRequest = (req) => {
    if (!MUTATING_METHODS.has(req.method)) return;

    const forwardedHost = String(req.headers['x-forwarded-host'] || req.headers.host || '')
        .split(',')[0]
        .trim();
    const forwardedProto = String(req.headers['x-forwarded-proto'] || '')
        .split(',')[0]
        .trim();
    const secureEnvironment = process.env.VERCEL_ENV === 'production'
        || process.env.VERCEL_ENV === 'preview'
        || process.env.NODE_ENV === 'production';
    const proto = forwardedProto || (secureEnvironment ? 'https' : 'http');
    const allowedOrigins = new Set();
    if (forwardedHost) allowedOrigins.add(`${proto}://${forwardedHost}`);
    if (process.env.PUBLIC_SITE_URL) {
        try {
            allowedOrigins.add(new URL(process.env.PUBLIC_SITE_URL).origin);
        } catch {
            throw new Error('PUBLIC_SITE_URL must be a valid absolute URL.');
        }
    }

    const origin = req.headers.origin;
    if (!origin) {
        if (secureEnvironment) throw forbidden('Missing request origin.');
    } else {
        let normalizedOrigin;
        try {
            normalizedOrigin = new URL(origin).origin;
        } catch {
            throw forbidden('Invalid request origin.');
        }
        if (!allowedOrigins.has(normalizedOrigin)) {
            throw forbidden('Requests must come from this site.');
        }
    }

    const hasBody = req.body !== undefined && req.body !== null && req.body !== '';
    if (hasBody) {
        const contentType = String(req.headers['content-type'] || '').toLowerCase();
        if (!contentType.startsWith('application/json')) {
            throw badRequest('Request content type must be application/json.');
        }
    }
};

const withErrorHandling = (handler) => async (req, res) => {
    try {
        validateMutationRequest(req);
        await ensureSchema();
        await handler(req, res);
    } catch (error) {
        if (error instanceof ApiError) {
            res.status(error.status).json({
                error: error.message,
                ...(error.field ? { field: error.field } : {}),
            });
            return;
        }

        console.error('Unhandled API error:', error);
        res.status(500).json({ error: 'Something went wrong on our end. Try again in a moment.' });
    }
};

const allowMethods = (req, res, allowed) => {
    const methods = [...allowed, 'OPTIONS'];

    if (req.method === 'OPTIONS') {
        res.setHeader('Allow', methods.join(', '));
        res.status(204).end();
        return false;
    }

    if (!allowed.includes(req.method)) {
        res.setHeader('Allow', methods.join(', '));
        throw new ApiError(405, `${req.method} is not supported here.`);
    }

    return true;
};

const readJsonBody = (req) => {
    const { body } = req;
    if (!body) return {};
    if (typeof body === 'object') return body;

    try {
        return JSON.parse(body);
    } catch {
        throw badRequest('Request body must be valid JSON.');
    }
};

const clientIp = (req) => {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.length > 0) {
        return forwarded.split(',')[0].trim();
    }
    return req.socket?.remoteAddress || 'unknown';
};

const enforceRateLimit = async (bucket, key, limit, windowSeconds, message) => {
    const rows = await sql`
        INSERT INTO rate_limits (bucket, key, attempts, window_started_at)
        VALUES (${bucket}, ${key}, 1, NOW())
        ON CONFLICT (bucket, key) DO UPDATE SET
            attempts = CASE
                WHEN rate_limits.window_started_at < NOW() - make_interval(secs => ${windowSeconds}::double precision)
                THEN 1
                ELSE rate_limits.attempts + 1
            END,
            window_started_at = CASE
                WHEN rate_limits.window_started_at < NOW() - make_interval(secs => ${windowSeconds}::double precision)
                THEN NOW()
                ELSE rate_limits.window_started_at
            END
        RETURNING attempts
    `;

    if (Math.random() < 0.01) {
        try {
            await sql`DELETE FROM rate_limits WHERE window_started_at < NOW() - INTERVAL '24 hours'`;
        } catch (error) {
            console.error('Rate limit cleanup failed:', error);
        }
    }

    if (rows[0].attempts > limit) {
        throw tooManyRequests(message || 'Too many attempts. Wait a few minutes and try again.');
    }
};

const clearRateLimit = async (bucket, key) => {
    await sql`DELETE FROM rate_limits WHERE bucket = ${bucket} AND key = ${key}`;
};

module.exports = {
    ApiError,
    badRequest,
    unauthorized,
    forbidden,
    notFound,
    conflict,
    tooManyRequests,
    withErrorHandling,
    allowMethods,
    readJsonBody,
    clientIp,
    enforceRateLimit,
    clearRateLimit,
};
