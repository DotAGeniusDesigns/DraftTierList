const mockSql = jest.fn();
const mockSendConfirmation = jest.fn();

jest.mock('../../server/lib/db.js', () => ({
    sql: mockSql,
}));

jest.mock('../../server/lib/http.js', () => ({
    allowMethods: () => true,
    badRequest: (message) => new Error(message),
    conflict: (message) => new Error(message),
    enforceRateLimit: async () => {},
    readJsonBody: (req) => req.body,
    unauthorized: (message) => new Error(message),
    withErrorHandling: (handler) => handler,
}));

jest.mock('../../server/lib/auth.js', () => ({
    generateActionToken: () => 'confirmation-token',
    hashActionToken: () => 'confirmation-token-hash',
    publicUser: (user) => user,
    requireUser: async () => ({ id: 'user-1' }),
    verifyPassword: async () => true,
}));

jest.mock('../../server/lib/validate.js', () => ({
    validateEmail: () => null,
    validateUsername: () => null,
}));

jest.mock('../../server/lib/email.js', () => ({
    sendEmailChangeConfirmationEmail: mockSendConfirmation,
    siteUrlFrom: () => 'https://fantasy-toolkit.com',
}));

const profileHandler = require('../../api/account/profile.js');

const record = {
    id: 'user-1',
    username: 'OriginalName',
    email: 'old@example.com',
    password_hash: 'hash',
    pending_email: null,
    pending_email_lower: null,
    email_change_token_hash: null,
    email_change_expires_at: null,
};

const updated = {
    id: 'user-1',
    username: 'UpdatedName',
    email: 'old@example.com',
    must_change_password: false,
    token_version: 1,
};

const request = {
    method: 'POST',
    headers: { host: 'fantasy-toolkit.com' },
    body: {
        username: 'UpdatedName',
        email: 'new@example.com',
        currentPassword: 'Password123',
    },
};

const response = () => {
    const res = {
        json: jest.fn(),
        status: jest.fn(),
    };
    res.status.mockReturnValue(res);
    return res;
};

describe('profile email change ordering', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('stores the confirmation token before sending the email', async () => {
        mockSql
            .mockResolvedValueOnce([record])
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([updated]);
        mockSendConfirmation.mockResolvedValue();

        await profileHandler(request, response());

        expect(mockSql).toHaveBeenCalledTimes(3);
        expect(mockSendConfirmation).toHaveBeenCalledTimes(1);
        expect(mockSql.mock.invocationCallOrder[2]).toBeLessThan(
            mockSendConfirmation.mock.invocationCallOrder[0]
        );
    });

    it('restores the previous pending state when delivery fails', async () => {
        mockSql
            .mockResolvedValueOnce([record])
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([updated])
            .mockResolvedValueOnce([]);
        mockSendConfirmation.mockRejectedValue(new Error('Resend unavailable'));

        await expect(profileHandler(request, response())).rejects.toThrow(
            'Email change confirmation could not be delivered'
        );

        expect(mockSql).toHaveBeenCalledTimes(4);
        const rollbackSql = mockSql.mock.calls[3][0].join(' ');
        expect(rollbackSql).toContain('SET username =');
        expect(rollbackSql).toContain('AND email_change_token_hash =');
    });
});
