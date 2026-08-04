// Tabs shown in the navbar. In-season tools (streamers, interesting players)
// are intentionally omitted until they have real data — they still resolve by
// URL so existing links and the legacy hash redirects below keep working.
export const NAV_ROUTES = [
    { path: '/draft-board', label: 'Draft Board', shortLabel: 'Board', icon: 'board' },
    { path: '/draft-range', label: 'Draft Range', shortLabel: 'Range', icon: 'range' },
    { path: '/offseason', label: 'Offseason HQ', shortLabel: 'Offseason', icon: 'offseason' },
    { path: '/draft-lottery', label: 'Draft Lottery', shortLabel: 'Lottery', icon: 'lottery' },
];

export const PAYPAL_HOSTED_BUTTON_ID = 'JBSDA3B82L9N4';

export const PAYPAL_DONATE_URL =
    `https://www.paypal.com/donate/?hosted_button_id=${PAYPAL_HOSTED_BUTTON_ID}`;

export const LEGACY_HASH_ROUTES = {
    'draft-board': '/draft-board',
    'draft-range': '/draft-range',
    streamers: '/streamers',
    'interesting-players': '/interesting-players',
    'new-tool': '/draft-scheduler',
    offseason: '/offseason',
    'draft-lottery': '/draft-lottery',
};
