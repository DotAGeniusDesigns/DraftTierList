import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SITE_NAME = 'Fantasy Toolkit';
const DEFAULT_DESCRIPTION =
    'Free 2026 fantasy football draft tools: drag-and-drop tier list, draft range tracker, offseason breakdowns, and a marble-race draft lottery.';

const ROUTE_META = {
    '/draft-board': {
        title: 'Draft Board & Tier List',
        description: 'Build your 2026 fantasy football draft board with drag-and-drop tiers, injury flags, Sleeper sync, and share links.',
    },
    '/draft-range': {
        title: 'Draft Range',
        description: 'See who is likely available at your draft pick using ADP-based range projections.',
    },
    '/draft-kit': {
        title: 'Draft Kit',
        description: '2026 fantasy football projections for the top 150 players — points per game, projected games, value over replacement, and value vs ADP.',
    },
    '/draft-grader': {
        title: 'Draft Grader',
        description: 'Grade your fantasy draft: import a Sleeper roster or build one by hand, and see expected points per week against an average team in your league.',
    },
    '/offseason': {
        title: 'Offseason HQ',
        description: '2026 coaching changes, roster moves, projected depth charts, and camp news for every NFL team.',
    },
    '/draft-lottery': {
        title: 'Draft Lottery',
        description: 'Settle your league draft order with a marble-race lottery and share the results.',
    },
    '/login': { title: 'Sign In', noindex: true },
    '/signup': { title: 'Create Account', noindex: true },
    '/forgot-password': { title: 'Reset Password', noindex: true },
    '/confirm-email': { title: 'Confirm Email', noindex: true },
    '/recover-email': { title: 'Recover Account', noindex: true },
    '/profile': { title: 'Profile', noindex: true },
    '/privacy': { title: 'Privacy Policy' },
    '/terms': { title: 'Terms of Service' },
    '/streamers': { title: 'Streamers', noindex: true },
    '/interesting-players': { title: 'Interesting Players', noindex: true },
    '/draft-scheduler': { title: 'Draft Scheduler', noindex: true },
};

// Routes with a path parameter can't be looked up exactly. Order matters:
// '/league-hub' must be checked before the shorter '/league/' prefix.
const DYNAMIC_ROUTE_META = [
    ['/league-hub', { title: 'League Hub', noindex: true }],
    ['/league/', { title: 'League Hub', noindex: true }],
];

const metaForPath = (pathname) => ROUTE_META[pathname]
    || DYNAMIC_ROUTE_META.find(([prefix]) => pathname.startsWith(prefix))?.[1];

const setMetaTag = (selector, attribute, name, content) => {
    if (!content) return;
    let element = document.querySelector(`${selector}[${attribute}="${name}"]`);
    if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
    }
    element.setAttribute('content', content);
};

const RouteHead = () => {
    const { pathname } = useLocation();

    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }, [pathname]);

    useEffect(() => {
        const known = metaForPath(pathname);
        const meta = known || {
            title: 'Page Not Found',
            description: 'This page does not exist on Fantasy Toolkit.',
            noindex: true,
        };
        const pageTitle = meta.title ? `${meta.title} — ${SITE_NAME}` : SITE_NAME;
        document.title = pageTitle;

        const description = meta.description || DEFAULT_DESCRIPTION;
        setMetaTag('meta', 'name', 'description', description);
        setMetaTag('meta', 'property', 'og:title', pageTitle);
        setMetaTag('meta', 'property', 'og:description', description);
        setMetaTag('meta', 'name', 'twitter:title', pageTitle);
        setMetaTag('meta', 'name', 'twitter:description', description);

        if (meta.noindex) {
            setMetaTag('meta', 'name', 'robots', 'noindex, nofollow');
        } else {
            const robots = document.querySelector('meta[name="robots"]');
            if (robots) robots.remove();
        }
    }, [pathname]);

    return null;
};

export default RouteHead;
