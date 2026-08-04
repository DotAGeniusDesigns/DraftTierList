import React from 'react';

const ColumnHeader = ({ label, tooltip, className = '', darkMode }) => (
    <div className={`group relative flex justify-center ${className}`}>
        <span
            className={`cursor-help border-b border-dotted ${darkMode ? 'border-slate-600' : 'border-slate-300'}`}
        >
            {label}
        </span>
        {tooltip && (
            <div
                role="tooltip"
                className={`pointer-events-none absolute left-1/2 top-[calc(100%+6px)] z-40 hidden w-44 -translate-x-1/2 rounded-lg px-2.5 py-2 text-left text-[10px] font-medium normal-case leading-snug tracking-normal shadow-lg group-hover:block sm:w-52 ${
                    darkMode
                        ? 'border border-white/10 bg-slate-800 text-slate-200'
                        : 'border border-slate-200 bg-white text-slate-600'
                }`}
            >
                <span
                    className={`absolute bottom-full left-1/2 h-0 w-0 -translate-x-1/2 border-x-[6px] border-b-[6px] border-x-transparent ${
                        darkMode ? 'border-b-slate-800' : 'border-b-white'
                    }`}
                    aria-hidden="true"
                />
                {tooltip}
            </div>
        )}
    </div>
);

export const BOARD_COLUMN_TOOLTIPS = {
    pos: 'Player position: QB, RB, WR, TE, K, or DST.',
    team: 'NFL team for the 2026 season.',
    ol: 'Offensive line rank for the player’s team (lower is better).',
    bye: 'Week the team is on bye during the 2026 season.',
    ecr: 'Half-PPR Expert Consensus Rank. Parentheses show how far your board rank differs.',
    adp: 'Half-PPR Average Draft Position. Parentheses show value vs your current rank.',
    flags: 'Tag upside, risky, or handcuff players, then filter the board by them.',
};

export default ColumnHeader;
