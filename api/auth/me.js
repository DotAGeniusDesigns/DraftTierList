// GET /api/auth/me — who is signed in on this browser.
// Returns 200 with user: null when nobody is, so the app can boot without
// treating "logged out" as an error.

const { withErrorHandling, allowMethods } = require('../../server/lib/http.js');
const { getSessionUser, publicUser } = require('../../server/lib/auth.js');

const handler = async (req, res) => {
    if (!allowMethods(req, res, ['GET'])) return;

    const user = await getSessionUser(req);

    // Never let a CDN or browser cache one user's identity.
    res.setHeader('Cache-Control', 'no-store, private');
    res.status(200).json({ user: user ? publicUser(user) : null });
};

module.exports = withErrorHandling(handler);
