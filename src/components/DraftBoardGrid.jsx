import React, { useMemo } from 'react';
import { ui } from '../utils/uiTheme';
import { getPositionCellProps } from '../utils/playerStyles';
import { usePositionColors } from '../context/PositionColorsContext';

// Standard snake draft: within a round, pick-in-round counts up 1..teamCount
// on odd rounds and counts DOWN from teamCount..1 on even rounds — the team
// in the rightmost column picks first in round 2, so its label reads ".01"
// even though it's visually on the right. Column position and pick-in-round
// number are two different things; this is what maps one to the other.
const pickInRoundFor = (round, column, teamCount) => (
    round % 2 === 1 ? column : teamCount - column + 1
);

// Skip generational suffixes so "James Cook III" reads as "Cook", not "III".
const NAME_SUFFIXES = new Set(['jr', 'sr', 'ii', 'iii', 'iv', 'v']);
const lastNameOf = (fullName) => {
    const parts = fullName.trim().split(/\s+/);
    let idx = parts.length - 1;
    while (idx > 0 && NAME_SUFFIXES.has(parts[idx].toLowerCase().replace(/\.$/, ''))) {
        idx -= 1;
    }
    return parts[idx];
};

const Cell = ({ pickLabel, overallPick, player, darkMode }) => {
    const { colors: positionColors } = usePositionColors();

    if (!player) {
        return (
            <div
                className={`flex h-12 flex-col items-center justify-center rounded-md border border-dashed text-[9px] font-medium sm:h-[72px] sm:rounded-lg sm:text-[11px] ${
                    darkMode ? 'border-white/10 text-slate-600' : 'border-slate-200 text-slate-400'
                }`}
            >
                {pickLabel}
                <span className="hidden font-semibold opacity-60 sm:inline"> ({overallPick})</span>
            </div>
        );
    }

    const cellProps = getPositionCellProps(player.position, darkMode, positionColors);

    return (
        <div
            className="flex h-12 flex-col justify-between overflow-hidden rounded-md border px-1.5 py-1 sm:h-[72px] sm:rounded-lg sm:px-2 sm:py-1.5"
            style={cellProps.style}
        >
            <div className="flex items-center justify-between gap-0.5 text-[8px] font-bold uppercase tracking-wide opacity-70 sm:text-[10px]">
                <span className="tabular-nums">
                    {pickLabel}
                    <span className="hidden font-semibold opacity-75 sm:inline"> ({overallPick})</span>
                </span>
                <span>{player.position}</span>
            </div>
            <div className="truncate text-[11px] font-bold leading-tight sm:text-[13px]" title={player.name}>
                <span className="sm:hidden">{lastNameOf(player.name)}</span>
                <span className="hidden sm:inline">{player.name}</span>
            </div>
            <div className="truncate text-[8px] font-medium opacity-70 sm:text-[10px]">
                {player.team}
            </div>
        </div>
    );
};

const DraftBoardGrid = ({ darkMode, players, teamCount, onClose }) => {
    const { picksByOverall, undatedDraftedCount, currentRound } = useMemo(() => {
        const dated = [];
        let undated = 0;
        players.forEach((player) => {
            if (!player.drafted) return;
            if (player.draftedAt) dated.push(player);
            else undated += 1;
        });
        dated.sort((a, b) => a.draftedAt - b.draftedAt);

        const map = new Map();
        dated.forEach((player, i) => map.set(i + 1, player));

        return {
            picksByOverall: map,
            undatedDraftedCount: undated,
            currentRound: Math.floor(dated.length / teamCount) + 1,
        };
    }, [players, teamCount]);

    const rounds = useMemo(
        () => Array.from({ length: currentRound }, (_, i) => i + 1),
        [currentRound],
    );

    const panelBg = darkMode ? 'bg-slate-900' : 'bg-white';

    return (
        <div className={ui.modalOverlay}>
            <div className={`flex max-h-[88vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl shadow-2xl ${panelBg} ${
                darkMode
                    ? 'border-2 border-emerald-500/45 ring-1 ring-emerald-400/20'
                    : 'border-2 border-emerald-500/55 ring-1 ring-emerald-500/25'
            }`}>
                <div className={`flex shrink-0 items-center justify-between gap-3 border-b px-5 py-4 ${darkMode ? 'border-white/5' : 'border-slate-100'}`}>
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-500">Draft Mode</p>
                        <h2 className={`text-lg font-bold ${ui.heading(darkMode)}`}>Draft Board</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition ${darkMode ? 'text-slate-400 hover:bg-white/5 hover:text-slate-200' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`}
                        aria-label="Close draft board"
                    >
                        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                            <path fillRule="evenodd" d="M4.28 4.28a.75.75 0 011.06 0L10 8.94l4.66-4.66a.75.75 0 111.06 1.06L11.06 10l4.66 4.66a.75.75 0 11-1.06 1.06L10 11.06l-4.66 4.66a.75.75 0 01-1.06-1.06L8.94 10 4.28 5.34a.75.75 0 010-1.06z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>

                {undatedDraftedCount > 0 && (
                    <div className={`shrink-0 border-b px-5 py-2 text-xs ${darkMode ? 'border-white/5 bg-amber-500/10 text-amber-200' : 'border-slate-100 bg-amber-50 text-amber-800'}`}>
                        {undatedDraftedCount} player{undatedDraftedCount !== 1 ? 's' : ''} marked drafted before Draft Mode started {undatedDraftedCount !== 1 ? "aren't" : "isn't"} shown here — only picks made while Draft Mode is on have a slot.
                    </div>
                )}

                <div className="overflow-auto p-3 sm:p-5">
                    <div
                        className="grid gap-1 sm:gap-2"
                        style={{
                            gridTemplateColumns: `32px repeat(${teamCount}, minmax(64px, 1fr))`,
                            minWidth: `${32 + teamCount * 64}px`,
                        }}
                    >
                        <div className={`sticky left-0 top-0 z-20 ${panelBg}`} />
                        {Array.from({ length: teamCount }, (_, i) => (
                            <div
                                key={`head-${i}`}
                                className={`sticky top-0 z-10 flex items-center justify-center rounded-md py-1 text-[9px] font-bold uppercase tracking-wide sm:rounded-lg sm:py-1.5 sm:text-[11px] ${panelBg} ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}
                            >
                                <span className="sm:hidden">T{i + 1}</span>
                                <span className="hidden sm:inline">Team {i + 1}</span>
                            </div>
                        ))}

                        {rounds.map((round) => (
                            <React.Fragment key={`round-${round}`}>
                                <div
                                    className={`sticky left-0 z-10 flex items-center justify-center rounded-md text-[10px] font-bold sm:rounded-lg sm:text-xs ${panelBg} ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}
                                >
                                    R{round}
                                </div>
                                {Array.from({ length: teamCount }, (_, colIdx) => {
                                    const column = colIdx + 1;
                                    const pickInRound = pickInRoundFor(round, column, teamCount);
                                    const overallPick = (round - 1) * teamCount + pickInRound;
                                    const player = picksByOverall.get(overallPick);
                                    const pickLabel = `${round}.${String(pickInRound).padStart(2, '0')}`;
                                    return (
                                        <Cell
                                            key={`cell-${round}-${column}`}
                                            pickLabel={pickLabel}
                                            overallPick={overallPick}
                                            player={player}
                                            darkMode={darkMode}
                                        />
                                    );
                                })}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DraftBoardGrid;
