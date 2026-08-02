import React, { useCallback, useRef, useState } from 'react';

// Chip + hover card for a player carried by src/utils/injuryReport.js, which
// scripts/updateInjuries.js refreshes from ESPN's injury feed. Lives next to the
// player's name rather than in the flags column so it still shows on phones,
// where that column is hidden.

// ESPN's designations, shortened to something that fits beside a name.
const SHORT = {
    QUESTIONABLE: 'Q',
    DOUBTFUL: 'D',
    OUT: 'OUT',
    IR: 'IR',
    'PUP-P': 'PUP',
    'PUP-R': 'PUP',
    'NFI-A': 'NFI',
    'NFI-R': 'NFI',
    'RESERVE-SUS': 'SUSP',
};

// Designations that mean "not playing", as opposed to a game-time decision.
const SIDELINED = new Set(['OUT', 'IR', 'PUP-P', 'PUP-R', 'NFI-A', 'NFI-R', 'RESERVE-SUS']);

// Dates arrive as plain ISO days; parsing them as UTC keeps a player in a
// western timezone from reading a day early.
const formatDay = (iso) => {
    if (!iso) return '';
    const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso}T00:00:00Z` : iso);
    if (Number.isNaN(date.getTime())) return iso;
    return date.toLocaleDateString(undefined, {
        month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
    });
};

const formatNewsDay = (iso) => {
    if (!iso) return '';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

// Tallest the card gets, plus its offset. Only used to decide which side of the
// row it opens on, so an approximation is fine.
const CARD_HEIGHT = 170;

const InjuryBadge = ({ injury, darkMode }) => {
    // The last rows of a 377-player board have no viewport left underneath and
    // nothing below to scroll to, so the card would open into dead space. Flip
    // it above the row when that's where the room is.
    const [openUp, setOpenUp] = useState(false);
    const chipRef = useRef(null);
    const place = useCallback(() => {
        const rect = chipRef.current?.getBoundingClientRect();
        if (!rect) return;
        setOpenUp(rect.bottom + CARD_HEIGHT > window.innerHeight && rect.top > CARD_HEIGHT);
    }, []);

    if (!injury) return null;

    const short = SHORT[injury.designation] || 'INJ';
    const sidelined = SIDELINED.has(injury.designation);

    // ESPN dates a season-ending injury to the following February, which is
    // technically a return date and practically "see you next year".
    const returnYear = (injury.returnDate || '').slice(0, 4);
    const newsYear = (injury.newsDate || '').slice(0, 4);
    const seasonEnding = returnYear && newsYear && returnYear > newsYear;

    return (
        // Deliberately not `relative`: the hover card below positions against the
        // name container in Player.jsx so it stays on screen at phone widths.
        <span className="group/inj inline-flex align-middle">
            <button
                ref={chipRef}
                type="button"
                onMouseEnter={place}
                onFocus={place}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                aria-label={`${injury.label}${injury.bodyPart ? ` — ${injury.bodyPart}` : ''}`}
                // min-h-0/min-w-0 opt out of the 44px tap-target floor index.css
                // puts on every button under 640px — this is a label you hover,
                // not a control, and at 44px it swallows the player's name.
                className={`min-h-0 min-w-0 cursor-help rounded px-1 py-px text-[9px] font-bold uppercase leading-tight tracking-wide ring-1 transition sm:text-[10px] ${
                    sidelined
                        ? 'bg-rose-500/15 text-rose-500 ring-rose-500/30'
                        : 'bg-amber-500/15 text-amber-600 ring-amber-500/30 dark:text-amber-400'
                }`}
            >
                {short}
            </button>

            <div
                role="tooltip"
                className={`pointer-events-none absolute left-0 ${openUp ? 'bottom-[calc(100%+6px)]' : 'top-[calc(100%+6px)]'} z-40 hidden w-60 rounded-lg px-2.5 py-2 text-left text-[10px] font-medium normal-case leading-snug tracking-normal shadow-lg group-focus-within/inj:block group-hover/inj:block sm:w-72 ${
                    darkMode
                        ? 'border border-white/10 bg-slate-800 text-slate-200'
                        : 'border border-slate-200 bg-white text-slate-600'
                }`}
            >
                <span
                    className={`absolute left-3 h-0 w-0 border-x-[6px] border-x-transparent ${
                        openUp
                            ? `top-full border-t-[6px] ${darkMode ? 'border-t-slate-800' : 'border-t-white'}`
                            : `bottom-full border-b-[6px] ${darkMode ? 'border-b-slate-800' : 'border-b-white'}`
                    }`}
                    aria-hidden="true"
                />
                <span className={`block font-bold ${sidelined ? 'text-rose-500' : 'text-amber-500'}`}>
                    {injury.label}{injury.bodyPart ? ` · ${injury.bodyPart}` : ''}
                </span>
                {injury.returnDate && (
                    <span className={`mt-0.5 block font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                        {seasonEnding ? 'Out for the season' : `Expected back ${formatDay(injury.returnDate)}`}
                    </span>
                )}
                {injury.description && <span className="mt-1 block">{injury.description}</span>}
                <span className={`mt-1.5 block text-[9px] ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                    ESPN injury report{injury.newsDate ? ` · ${formatNewsDay(injury.newsDate)}` : ''}
                </span>
            </div>
        </span>
    );
};

export default InjuryBadge;
