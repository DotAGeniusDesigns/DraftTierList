// ---------------------------------------------------------------------------
// These documents were written to describe what this app actually does. They
// are a starting point, not legal advice; if you take payments, add tracking
// beyond Vercel Analytics, or expect users in the EU/UK, have a lawyer read
// them first.
// ---------------------------------------------------------------------------

export const SITE_NAME = 'Fantasy Toolkit';

// Bump both when you materially change the documents.
export const PRIVACY_EFFECTIVE_DATE = 'August 3, 2026';
export const TERMS_EFFECTIVE_DATE = 'August 3, 2026';

// Minimum age for an account. 13 keeps the app outside COPPA's scope in the US.
export const MINIMUM_AGE = 13;

// Sub-processors named in the privacy policy. Keep this list honest — it is
// the part users are most likely to check.
export const SUBPROCESSORS = [
    {
        name: 'Vercel',
        role: 'Website and API hosting, plus privacy-friendly page analytics',
        link: 'https://vercel.com/legal/privacy-policy',
    },
    {
        name: 'Neon',
        role: 'Managed Postgres database storing accounts and saved boards',
        link: 'https://neon.tech/privacy-policy',
    },
    {
        name: 'Resend',
        role: 'Delivery of password-reset and account-notification email',
        link: 'https://resend.com/legal/privacy-policy',
    },
    {
        name: 'Sleeper',
        role: 'Public draft data, only when you connect a Sleeper draft',
        link: 'https://sleeper.com/privacy',
    },
];
