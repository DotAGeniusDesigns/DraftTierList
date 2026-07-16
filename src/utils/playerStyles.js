// Shared position badge styles for light and dark mode.
const badgeBase = 'inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide sm:text-xs sm:px-2.5 sm:py-1';

export const getPositionTagClass = (position, { drafted = false, darkMode = false } = {}) => {
    if (drafted) {
        return `${badgeBase} ${darkMode ? 'bg-slate-700/60 text-slate-400' : 'bg-slate-200 text-slate-500'}`;
    }

    const colors = {
        WR: darkMode ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/25' : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
        RB: darkMode ? 'bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/25' : 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
        QB: darkMode ? 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/25' : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
        TE: darkMode ? 'bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/25' : 'bg-violet-50 text-violet-700 ring-1 ring-violet-200',
        DST: darkMode ? 'bg-slate-600/40 text-slate-300 ring-1 ring-slate-500/30' : 'bg-slate-100 text-slate-700 ring-1 ring-slate-200',
        K: darkMode ? 'bg-fuchsia-500/15 text-fuchsia-300 ring-1 ring-fuchsia-500/25' : 'bg-fuchsia-50 text-fuchsia-700 ring-1 ring-fuchsia-200',
    };

    return `${badgeBase} ${colors[position] || (darkMode ? 'bg-slate-700/60 text-slate-300 ring-1 ring-slate-600' : 'bg-slate-100 text-slate-700 ring-1 ring-slate-200')}`;
};

export const getPositionFilterTagClass = (position) => {
    const colors = {
        WR: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
        RB: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
        QB: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
        TE: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200',
        DST: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200',
        K: 'bg-fuchsia-50 text-fuchsia-700 ring-1 ring-fuchsia-200',
    };
    return `inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-bold uppercase tracking-wide ${colors[position] || 'bg-slate-100 text-slate-700 ring-1 ring-slate-200'}`;
};
