// Thin fetch wrapper for the /api endpoints.
//
// Sessions live in an httpOnly cookie, so there is no token to attach here —
// `credentials: 'include'` is what carries it, and it is the one option every
// call must not forget.

export class ApiError extends Error {
    constructor(message, { status = 0, field = null } = {}) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        // Set when the failure belongs to one form field, so the caller can
        // show the message inline instead of as a banner.
        this.field = field;
    }
}

const request = async (path, { method = 'GET', body, signal } = {}) => {
    let response;
    try {
        response = await fetch(`/api${path}`, {
            method,
            credentials: 'include',
            headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
            body: body === undefined ? undefined : JSON.stringify(body),
            signal,
        });
    } catch (error) {
        if (error.name === 'AbortError') throw error;
        throw new ApiError('Could not reach the server. Check your connection and try again.');
    }

    // 204 and friends have no body to parse.
    const text = await response.text();
    let payload = null;
    if (text) {
        try {
            payload = JSON.parse(text);
        } catch {
            // A non-JSON body means something upstream answered instead of our
            // handler — usually the SPA fallback or a platform error page.
            throw new ApiError('The server sent an unexpected response.', { status: response.status });
        }
    }

    if (!response.ok) {
        throw new ApiError(
            payload?.error || 'Something went wrong. Try again.',
            { status: response.status, field: payload?.field || null }
        );
    }

    return payload;
};

export const api = {
    // --- auth ---
    me: (signal) => request('/auth/me', { signal }),
    login: (identifier, password) => request('/auth/login', {
        method: 'POST',
        body: { identifier, password },
    }),
    signup: (payload) => request('/auth/signup', { method: 'POST', body: payload }),
    logout: () => request('/auth/logout', { method: 'POST' }),
    forgotPassword: (email) => request('/auth/forgot-password', {
        method: 'POST',
        body: { email },
    }),

    // --- account ---
    updateProfile: (payload) => request('/account/profile', { method: 'POST', body: payload }),
    confirmEmail: (token) => request('/account/confirm-email', {
        method: 'POST',
        body: { token },
    }),
    recoverEmail: (token) => request('/account/recover-email', {
        method: 'POST',
        body: { token },
    }),
    changePassword: (payload) => request('/account/password', { method: 'POST', body: payload }),
    signOutEverywhere: (currentPassword) => request('/account/sessions', {
        method: 'POST',
        body: { currentPassword },
    }),
    deleteAccount: (currentPassword, confirm) => request('/account/delete', {
        method: 'POST',
        body: { currentPassword, confirm },
    }),

    // --- boards ---
    listBoards: (signal) => request('/boards', { signal }),
    getBoard: (id, signal) => request(`/boards/${id}`, { signal }),
    createBoard: (payload) => request('/boards', { method: 'POST', body: payload }),
    updateBoard: (id, payload) => request(`/boards/${id}`, { method: 'PUT', body: payload }),
    deleteBoard: (id) => request(`/boards/${id}`, { method: 'DELETE' }),

    // --- league hubs ---
    // getLeagueHub is unauthenticated on the server, so it works whether or
    // not the visitor is signed in — it's the public "shareable link" half of
    // this feature. Everything else requires being signed in as the owner.
    listLeagueHubs: (signal) => request('/league-hubs', { signal }),
    getLeagueHub: (id, signal) => request(`/league-hubs/${id}`, { signal }),
    createLeagueHub: (payload) => request('/league-hubs', { method: 'POST', body: payload }),
    updateLeagueHub: (id, payload) => request(`/league-hubs/${id}`, { method: 'PUT', body: payload }),
    deleteLeagueHub: (id) => request(`/league-hubs/${id}`, { method: 'DELETE' }),
    createLeagueHubManager: (hubId, payload) => request(`/league-hubs/${hubId}/managers`, { method: 'POST', body: payload }),
    updateLeagueHubManager: (hubId, managerId, payload) => request(`/league-hubs/${hubId}/managers/${managerId}`, { method: 'PUT', body: payload }),
    deleteLeagueHubManager: (hubId, managerId) => request(`/league-hubs/${hubId}/managers/${managerId}`, { method: 'DELETE' }),
};
