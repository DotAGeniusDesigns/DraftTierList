/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
        "./public/index.html"
    ],
    theme: {
        extend: {
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
            }
        },
    },
    plugins: [],
} 