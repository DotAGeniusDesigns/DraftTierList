import React from 'react';

// "Round.Pick" label for the next undrafted slot, e.g. 3 already drafted in
// a 12-team league -> pick #4 overall -> round 1, slot 4 -> "1.04". This is
// just a running count, not a snake-draft seat assignment — it doesn't need
// to know which team is on the clock, only how many picks have happened.
const formatPickLabel = (draftedCount, teamCount) => {
    const overallPick = draftedCount + 1;
    const round = Math.floor((overallPick - 1) / teamCount) + 1;
    const pickInRound = ((overallPick - 1) % teamCount) + 1;
    return `${round}.${String(pickInRound).padStart(2, '0')}`;
};

const DraftModeBar = ({ darkMode, teamCount, draftedCount, lastPickName, onShowGrid, onEnd }) => {
    const pickLabel = formatPickLabel(draftedCount, teamCount);

    return (
        <div className="pointer-events-none fixed inset-x-0 bottom-3 z-40 flex justify-center px-3 sm:bottom-4">
            <div
                className={`pointer-events-auto flex max-w-full items-center gap-2.5 rounded-2xl border px-3.5 py-2.5 shadow-2xl backdrop-blur-xl sm:gap-4 sm:px-5 sm:py-3 ${
                    darkMode
                        ? 'border-white/10 bg-slate-900/95'
                        : 'border-slate-200 bg-white/95'
                }`}
            >
                <span className="hidden shrink-0 items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-500 sm:inline-flex">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Draft Mode
                </span>

                <div className="hidden h-6 w-px shrink-0 bg-current opacity-10 sm:block" />

                <div className="flex min-w-0 items-baseline gap-1.5">
                    <span className={`text-[10px] font-semibold uppercase tracking-wide ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                        Pick
                    </span>
                    <span className={`text-base font-bold tabular-nums sm:text-lg ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                        {pickLabel}
                    </span>
                </div>

                <div className="h-6 w-px shrink-0 bg-current opacity-10" />

                <div className="flex min-w-0 items-baseline gap-1.5">
                    <span className={`shrink-0 text-[10px] font-semibold uppercase tracking-wide ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                        Last
                    </span>
                    <span className={`truncate text-sm font-semibold sm:text-base ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                        {lastPickName || '—'}
                    </span>
                </div>

                <div className="h-6 w-px shrink-0 bg-current opacity-10" />

                <button
                    onClick={onShowGrid}
                    className={`flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold transition sm:px-2.5 sm:text-sm ${
                        darkMode
                            ? 'text-slate-300 hover:bg-white/5'
                            : 'text-slate-600 hover:bg-slate-100'
                    }`}
                    title="View draft board"
                >
                    <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h18v18H3V3zm0 6h18M3 15h18M9 3v18M15 3v18" />
                    </svg>
                    <span className="hidden sm:inline">Board</span>
                </button>

                <button
                    onClick={onEnd}
                    className={`ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition sm:ml-2 ${
                        darkMode
                            ? 'text-slate-500 hover:bg-white/5 hover:text-slate-300'
                            : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                    }`}
                    title="End draft mode"
                    aria-label="End draft mode"
                >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                        />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default DraftModeBar;
