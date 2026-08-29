/** @type {import('tailwindcss').Config} */

// ── Press Box theme ─────────────────────────────────────────────────────────
// The 2026 restyle: warm newsprint paper, serif display type, crimson accent.
// Rather than renaming color classes across every component, the theme remaps
// the three families the codebase was already built on:
//
//   slate   → warm paper/ink neutrals (light end = paper, dark end = warm ink)
//   emerald → crimson (the brand accent)
//   teal    → rust   (only ever the gradient partner of emerald)
//   white   → paper white (#fdfaf3), so cards and button text stay on-theme
//
// So `text-emerald-600` in a component means "accent text", not literally
// green. Semantic good/bad indicators (deltas, grades, success alerts) use
// Tailwind's untouched `green` family instead — a positive trend must never
// render in the accent crimson, which reads as an error.
module.exports = {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
        "./public/index.html"
    ],
    theme: {
        extend: {
            screens: {
                // Narrower than `md` on purpose. The desktop row is a fixed
                // CSS grid (see src/utils/boardGrid.js) that needs exactly
                // 698px to render without any column shrinking; 710px adds a
                // small safety margin. Below this, Player.jsx and Tier.jsx
                // render an entirely separate, simpler single-line mobile
                // layout — the two are not the same markup stretched by CSS,
                // so there is no in-between zone where a flexible column
                // stretches into empty space.
                board: '710px',
            },
            fontFamily: {
                sans: ['"Inter"', 'system-ui', 'sans-serif'],
                display: ['"Fraunces"', 'Georgia', 'serif'],
            },
            colors: {
                white: '#fdfaf3',
                // The dark end (700–950) is mahogany, not near-black: dark mode
                // is rich red-brown surfaces with cream type, per user request.
                slate: {
                    50: '#f6f0e4',
                    100: '#f0e9d9',
                    200: '#e0d6c2',
                    300: '#cfc0a4',
                    400: '#867c6d',
                    500: '#6b6255',
                    600: '#57503f',
                    700: '#54382a',
                    800: '#462b20',
                    900: '#38221a',
                    950: '#291811',
                },
                // 300/400 are the shades dark mode uses for accent text, and
                // on mahogany the accent is cream/gold, not light crimson.
                // 500+ (light mode's accent text and all solid fills) stay
                // crimson in both modes.
                emerald: {
                    50: '#faeee6',
                    100: '#f5ddd0',
                    200: '#ecc1ab',
                    300: '#f0dcae',
                    400: '#dcbd8c',
                    500: '#b3301c',
                    600: '#9c2715',
                    700: '#84220f',
                    800: '#6a1e10',
                    900: '#541a10',
                    950: '#320e07',
                },
                teal: {
                    50: '#faf0e3',
                    100: '#f4e0c9',
                    200: '#e9c49d',
                    300: '#e2a26b',
                    400: '#d07c3d',
                    500: '#b45a20',
                    600: '#9a4718',
                    700: '#7f3a15',
                    800: '#663012',
                    900: '#52280f',
                    950: '#301605',
                },
                'tier-1': '#ef4444',
                'tier-2': '#f97316',
                'tier-3': '#eab308',
                'tier-4': '#22c55e',
                'tier-5': '#3b82f6',
                'tier-6': '#8b5cf6',
                'tier-7': '#ec4899',
                'tier-8': '#6b7280',
                'tier-9': '#14b8a6',
                'tier-10': '#a855f7',
                'tier-11': '#f43f5e',
                'tier-12': '#64748b',
            },
            // Editorial corners: crisp, close to print. `rounded-full` (pills,
            // avatars, toggles) is untouched.
            borderRadius: {
                lg: '0.25rem',
                xl: '0.3rem',
                '2xl': '0.375rem',
                '3xl': '0.5rem',
            },
            // Flat, hairline-first elevation. The big default shadows are
            // toned down too, so modals and dropdowns stay in the same world.
            boxShadow: {
                card: '0 1px 2px rgba(28, 25, 23, 0.07)',
                'card-dark': '0 1px 2px rgba(0, 0, 0, 0.45)',
                glow: '0 0 18px rgba(179, 48, 28, 0.15)',
                xl: '0 4px 16px rgba(28, 25, 23, 0.12)',
                '2xl': '0 8px 30px rgba(28, 25, 23, 0.18)',
            },
            backgroundImage: {
                'app-light': 'linear-gradient(180deg, #f7f2e9 0%, #f2ebdd 100%)',
                'app-dark': 'radial-gradient(ellipse 70% 45% at 50% -10%, rgba(240, 220, 174, 0.07), transparent), linear-gradient(180deg, #2e1b13 0%, #3b241b 100%)',
            },
        },
    },
    plugins: [],
};
