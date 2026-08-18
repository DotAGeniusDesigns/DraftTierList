/** @type {import('tailwindcss').Config} */
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
                sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
                display: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
            },
            colors: {
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
            boxShadow: {
                card: '0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px rgba(15, 23, 42, 0.06)',
                'card-dark': '0 4px 24px rgba(0, 0, 0, 0.35)',
                glow: '0 0 20px rgba(16, 185, 129, 0.25)',
            },
            backgroundImage: {
                'app-light': 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(16, 185, 129, 0.12), transparent), linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
                'app-dark': 'radial-gradient(ellipse 70% 45% at 50% -10%, rgba(16, 185, 129, 0.08), transparent), linear-gradient(180deg, #0c1017 0%, #0f172a 100%)',
            },
        },
    },
    plugins: [],
};
