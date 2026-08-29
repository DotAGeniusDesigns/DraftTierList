// Shared visual tokens and class helpers for the 2026 UI refresh.

export const TIER_HEX = {
    1: '#ef4444',
    2: '#f97316',
    3: '#eab308',
    4: '#22c55e',
    5: '#3b82f6',
    6: '#8b5cf6',
    7: '#ec4899',
    8: '#6b7280',
    9: '#14b8a6',
    10: '#a855f7',
    11: '#f43f5e',
    12: '#64748b',
};

export const getTierAccentStyle = (tierNumber) => ({
    borderLeftColor: TIER_HEX[tierNumber] || TIER_HEX[12],
    boxShadow: `inset 4px 0 0 0 ${TIER_HEX[tierNumber] || TIER_HEX[12]}`,
});

const MODAL_WIDTHS = {
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
};

export const ui = {
    page: (dark) =>
        dark
            ? 'min-h-screen bg-app-dark text-slate-100'
            : 'min-h-screen bg-app-light text-slate-900',

    nav: (dark) =>
        dark
            ? 'sticky top-0 z-40 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl'
            : 'sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl',

    card: (dark) =>
        dark
            ? 'rounded-2xl border border-white/[0.06] bg-slate-900/60 shadow-card-dark'
            : 'rounded-2xl border border-slate-200/80 bg-white shadow-card',

    cardInset: (dark) =>
        dark
            ? 'rounded-xl border border-white/[0.04] bg-slate-950/40'
            : 'rounded-xl border border-slate-100 bg-slate-50/80',

    toolbar: (dark) =>
        dark
            ? 'rounded-2xl border border-white/[0.06] bg-slate-900/50 p-3 sm:p-4 shadow-card-dark'
            : 'rounded-2xl border border-slate-200/80 bg-white/90 p-3 sm:p-4 shadow-card backdrop-blur-sm',

    muted: (dark) => (dark ? 'text-slate-400' : 'text-slate-500'),

    heading: (dark) => (dark ? 'text-white' : 'text-slate-900'),

    btn: (dark) =>
        dark
            ? 'inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-800/80 px-3.5 py-2 text-sm font-medium text-slate-100 transition hover:border-white/20 hover:bg-slate-700/80 focus:outline-none focus:ring-2 focus:ring-emerald-500/40'
            : 'inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/30',

    btnPrimary: () =>
        'inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-3.5 py-2 text-sm font-semibold text-white shadow-glow transition hover:from-emerald-400 hover:to-teal-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/50',

    navSegment: (dark) =>
        dark
            ? 'flex items-center gap-0.5 rounded-2xl bg-slate-900/70 p-1 ring-1 ring-white/[0.06]'
            : 'flex items-center gap-0.5 rounded-2xl bg-slate-100/90 p-1 ring-1 ring-slate-200/70',

    navPill: (dark, active) => {
        const base =
            'inline-flex items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-xs font-semibold transition sm:px-3 sm:text-sm';
        if (active) {
            return dark
                ? `${base} bg-emerald-500 text-white shadow-sm shadow-emerald-900/30`
                : `${base} bg-white text-emerald-700 shadow-sm ring-1 ring-slate-200/60`;
        }
        return dark
            ? `${base} text-slate-400 hover:bg-white/5 hover:text-slate-200`
            : `${base} text-slate-600 hover:bg-white/60 hover:text-slate-900`;
    },

    // Form primitives, added with accounts. `invalid` swaps the ring to rose
    // so an inline field error reads without relying on the message alone.
    label: (dark) =>
        `block text-sm font-semibold ${dark ? 'text-slate-200' : 'text-slate-700'}`,

    input: (dark, invalid = false) => {
        const base =
            'w-full rounded-xl border px-3.5 py-2.5 text-sm transition focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60';
        if (invalid) {
            return dark
                ? `${base} border-rose-500/50 bg-slate-900/70 text-slate-100 placeholder-slate-500 focus:border-rose-400 focus:ring-rose-500/30`
                : `${base} border-rose-300 bg-white text-slate-900 placeholder-slate-400 focus:border-rose-400 focus:ring-rose-500/25`;
        }
        return dark
            ? `${base} border-white/10 bg-slate-900/70 text-slate-100 placeholder-slate-500 focus:border-emerald-500/50 focus:ring-emerald-500/30`
            : `${base} border-slate-200 bg-white text-slate-900 placeholder-slate-400 shadow-sm focus:border-emerald-400 focus:ring-emerald-500/25`;
    },

    fieldError: (dark) => `mt-1.5 text-xs font-medium ${dark ? 'text-rose-300' : 'text-rose-600'}`,

    // Full-width banners for form-level success/failure.
    alert: (dark, tone = 'error') => {
        const base = 'rounded-xl border px-4 py-3 text-sm';
        const tones = {
            error: dark
                ? 'border-rose-500/25 bg-rose-500/10 text-rose-200'
                : 'border-rose-200 bg-rose-50 text-rose-700',
            // Real green, not the accent: `emerald` is remapped to the brand
            // crimson in tailwind.config.js, and a success banner in red
            // reads as a failure.
            success: dark
                ? 'border-green-500/25 bg-green-500/10 text-green-200'
                : 'border-green-200 bg-green-50 text-green-700',
            info: dark
                ? 'border-sky-500/25 bg-sky-500/10 text-sky-200'
                : 'border-sky-200 bg-sky-50 text-sky-700',
            warning: dark
                ? 'border-amber-500/25 bg-amber-500/10 text-amber-200'
                : 'border-amber-200 bg-amber-50 text-amber-800',
        };
        return `${base} ${tones[tone] || tones.error}`;
    },

    dropdown: (dark) =>
        dark
            ? 'rounded-xl border border-white/10 bg-slate-900/95 shadow-2xl backdrop-blur-xl'
            : 'rounded-xl border border-slate-200 bg-white/95 shadow-xl backdrop-blur-xl',

    statPill: (dark, variant = 'default') => {
        const variants = {
            default: dark
                ? 'bg-slate-800/80 text-slate-300 ring-1 ring-white/5'
                : 'bg-white text-slate-700 ring-1 ring-slate-200 shadow-sm',
            success: dark
                ? 'bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/20'
                : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
            muted: dark
                ? 'bg-slate-800/50 text-slate-400 ring-1 ring-white/5'
                : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
        };
        return `inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold sm:text-sm ${variants[variant]}`;
    },

    toggle: (dark, on) =>
        on
            ? 'relative inline-flex h-7 w-12 items-center rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 shadow-glow transition'
            : dark
                ? 'relative inline-flex h-7 w-12 items-center rounded-full bg-slate-700 ring-1 ring-white/10 transition'
                : 'relative inline-flex h-7 w-12 items-center rounded-full bg-slate-200 transition',

    modalOverlay: 'fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm',

    // `size` picks the max width. It is a parameter rather than a class the
    // caller appends: appending `max-w-2xl` alongside this helper's own
    // `max-w-md` is a coin toss, since both are the same specificity and
    // whichever Tailwind emits later wins. It was emitting max-w-md, so the
    // draft-kit modal had been rendering at 448px while asking for 672px.
    //
    // The widths are spelled out rather than interpolated because Tailwind only
    // sees class names that appear literally in the source — a `max-w-${size}`
    // template produces no CSS at all.
    modal: (dark, size = 'md') => {
        const width = MODAL_WIDTHS[size] || MODAL_WIDTHS.md;
        return dark
            ? `w-full ${width} rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl`
            : `w-full ${width} rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl`;
    },
};
