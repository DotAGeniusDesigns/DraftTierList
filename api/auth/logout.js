// POST /api/auth/logout — drops the session cookie on this device.
// Signing out everywhere is a separate, authenticated action (see
// /api/account/sessions), because it invalidates other devices too.

const { withErrorHandling, allowMethods } = require('../../server/lib/http.js');
const { clearSessionCookie } = require('../../server/lib/auth.js');

const handler = async (req, res) => {
    if (!allowMethods(req, res, ['POST'])) return;

    clearSessionCookie(res);
    res.status(200).json({ ok: true });
};

module.exports = withErrorHandling(handler);
