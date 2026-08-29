/** @type {import('tailwindcss').Config} */

// ── Volt Gridiron theme ─────────────────────────────────────────────────────
// The 2026 restyle: OLED near-black surfaces, electric volt-lime accent,
// condensed athletic type (Barlow Condensed + Barlow). Rather than renaming
// color classes across every component, the theme remaps the families the
// codebase was already built on:
//
//   slate   → cool near-black neutrals (dark end is the OLED surface stack,
//             light end is a faintly green-tinted off-white)
//   emerald → the volt accent family. 500 is THE volt (#ccff00) and is a FILL
//             color — anything sitting on it needs dark text (text-slate-950),
//             never text-white. Text accents split by mode: light mode reads
//             accents at 600/700 (olive, legible on white), dark mode at
//             300/400 (bright volt tints) — shared labels are written
//             `text-emerald-600 dark:text-emerald-400`.
//   teal    → lime, emerald's gradient partner (volt → lime = the brand fade)
//
// Semantic good/bad indicators (deltas, grades, success alerts, the Upside
// flag) use Tailwind's untouched `green` family — true green, distinct from
// the yellow-green volt.
module.exports = {
    // `dark:` variants follow the html.dark class App.jsx toggles, not the OS
    // setting — the split-shade accent pattern above depends on this.
    darkMode: 'class',
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
                sans: ['"Barlow"', 'system-ui', 'sans-serif'],
                display: ['"Barlow Condensed"', 'system-ui', 'sans-serif'],
            },
            colors: {
                slate: {
                    50: '#f6f7f4',
                    100: '#eef0ea',
                    200: '#dfe3da',
                    300: '#c3c9bc',
                    400: '#6b7261',
                    500: '#575e4e',
                    600: '#454b3d',
                    700: '#383c33',
                    800: '#1b1f18',
                    900: '#111410',
                    950: '#070808',
                },
                emerald: {
                    50: '#f9ffdb',
                    100: '#f1ffb8',
                    200: '#e6fd85',
                    300: '#daf75c',
                    400: '#d9ff4d',
                    500: '#ccff00',
                    600: '#5f7a00',
                    700: '#4c6300',
                    800: '#3a4b00',
                    900: '#2f3d00',
                    950: '#1a2200',
                },
                teal: {
                    50: '#f7fee7',
                    100: '#ecfccb',
                    200: '#d9f99d',
                    300: '#bef264',
                    400: '#a3e635',
                    500: '#84cc16',
                    600: '#65a30d',
                    700: '#4d7c0f',
                    800: '#3f6212',
                    900: '#365314',
                    950: '#1a2e05',
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
            // Athletic corners: tighter than Tailwind's defaults, but not
            // print-flat. `rounded-full` (pills, avatars, toggles) untouched.
            borderRadius: {
                lg: '0.375rem',
                xl: '0.5rem',
                '2xl': '0.75rem',
                '3xl': '1rem',
            },
            boxShadow: {
                card: '0 1px 2px rgba(7, 8, 8, 0.05), 0 8px 24px rgba(7, 8, 8, 0.07)',
                'card-dark': '0 4px 24px rgba(0, 0, 0, 0.45)',
                glow: '0 0 20px rgba(204, 255, 0, 0.22)',
            },
            backgroundImage: {
                'app-light': 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(204, 255, 0, 0.10), transparent), linear-gradient(180deg, #f7f8f5 0%, #eef0ea 100%)',
                'app-dark': 'radial-gradient(ellipse 70% 45% at 50% -10%, rgba(204, 255, 0, 0.09), transparent), linear-gradient(180deg, #070808 0%, #0b0d0a 100%)',
            },
        },
    },
    plugins: [],
};
