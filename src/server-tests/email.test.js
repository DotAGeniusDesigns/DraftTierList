describe('transactional email timeout', () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
        jest.resetModules();
        jest.useFakeTimers();
        process.env.RESEND_API_KEY = 'test-resend-key';
        delete process.env.VERCEL_ENV;
    });

    afterEach(() => {
        global.fetch = originalFetch;
        delete process.env.RESEND_API_KEY;
        jest.useRealTimers();
    });

    it('aborts a Resend request after eight seconds', async () => {
        global.fetch = jest.fn((url, options) => new Promise((resolve, reject) => {
            options.signal.addEventListener('abort', () => {
                const error = new Error('aborted');
                error.name = 'AbortError';
                reject(error);
            });
        }));
        const { sendEmail } = require('../../server/lib/email.js');

        const pending = sendEmail({
            to: 'test@example.com',
            subject: 'Test',
            html: '<p>Test</p>',
            text: 'Test',
        });
        const rejection = expect(pending).rejects.toMatchObject({ name: 'AbortError' });

        jest.advanceTimersByTime(7999);
        expect(global.fetch.mock.calls[0][1].signal.aborted).toBe(false);
        jest.advanceTimersByTime(1);

        await rejection;
        expect(global.fetch.mock.calls[0][1].signal.aborted).toBe(true);
    });
});
