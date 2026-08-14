import React, { useState, useEffect, useMemo } from 'react';
import { ui } from '../utils/uiTheme';
import { getPositionTagProps } from '../utils/playerStyles';
import { usePositionColors } from '../context/PositionColorsContext';

const POSITION_ORDER = ['QB', 'RB', 'WR', 'TE', 'K', 'DST'];

const sortByAdp = (a, b) => {
    const adpA = a.adp ?? Infinity;
    const adpB = b.adp ?? Infinity;
    return adpA - adpB;
};

const DraftRange = ({ darkMode, allPlayers = [] }) => {
    const { colors: positionColors } = usePositionColors();
    const [leagueSize, setLeagueSize] = useState(12);
    const [pickPosition, setPickPosition] = useState(1);
    const [positionFilter, setPositionFilter] = useState([]);
    const [availablePlayers, setAvailablePlayers] = useState({});
    const [draftedPlayers, setDraftedPlayers] = useState([]);

    // Calculate variance based on round
    const getVariance = (round) => {
        if (round <= 2) return 2;
        return 2 + (round - 2); // Increment by 1 each round after round 2
    };

    // Handle player click to draft/undraft
    const handlePlayerClick = (player) => {
        setDraftedPlayers(prev => {
            const isAlreadyDrafted = prev.find(p => p.id === player.id);
            if (isAlreadyDrafted) {
                return prev.filter(p => p.id !== player.id);
            } else {
                return [...prev, player];
            }
        });
    };

    // Remove drafted player
    const handleRemoveDrafted = (playerId) => {
        setDraftedPlayers(prev => prev.filter(p => p.id !== playerId));
    };

    // Calculate probable available players for each round
    useEffect(() => {
        const pickNumberForRound = (round) => {
            if (round % 2 === 1) {
                return (round - 1) * leagueSize + pickPosition;
            }
            return (round - 1) * leagueSize + (leagueSize - pickPosition + 1);
        };

        const calculateAvailablePlayers = () => {
            if (!allPlayers || allPlayers.length === 0) return;

            const available = {};

            // Calculate for first 15 rounds (or adjust as needed)
            for (let round = 1; round <= 15; round++) {
                const pickNumber = pickNumberForRound(round);
                const variance = getVariance(round);

                // Find players within ADP range
                let roundPlayers = allPlayers.filter(player => {
                    const minADP = Math.max(1, pickNumber - variance);
                    const maxADP = pickNumber + variance;
                    return player.adp >= minADP && player.adp <= maxADP;
                });

                // Apply position filter if any positions are selected
                if (positionFilter.length > 0) {
                    roundPlayers = roundPlayers.filter(player =>
                        positionFilter.includes(player.position)
                    );
                }

                // Sort by ADP within the round
                roundPlayers.sort((a, b) => a.adp - b.adp);

                available[round] = {
                    pickNumber,
                    players: roundPlayers,
                    variance
                };
            }

            setAvailablePlayers(available);
        };

        calculateAvailablePlayers();
    }, [leagueSize, pickPosition, positionFilter, allPlayers]);

    const leagueSizeOptions = [8, 10, 12, 14, 16];
    const pickPositionOptions = Array.from({ length: leagueSize }, (_, i) => i + 1);

    const selectClass = `w-full cursor-pointer rounded-xl border px-3.5 py-2.5 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-emerald-500/40 ${darkMode
        ? 'border-white/10 bg-slate-950/40 text-slate-100'
        : 'border-slate-200 bg-white text-slate-900 shadow-sm'}`;

    const draftedByPosition = useMemo(() => {
        const groups = Object.fromEntries(POSITION_ORDER.map((pos) => [pos, []]));

        draftedPlayers.forEach((player) => {
            const pos = POSITION_ORDER.includes(player.position) ? player.position : null;
            if (pos) groups[pos].push(player);
        });

        return POSITION_ORDER
            .map((position) => ({
                position,
                players: [...groups[position]].sort(sortByAdp),
            }))
            .filter((group) => group.players.length > 0);
    }, [draftedPlayers]);

    const renderDraftedPlayerCard = (player, adpRank) => (
        <div
            key={player.id}
            className={`${ui.cardInset(darkMode)} flex items-center justify-between gap-3 p-3`}
        >
            <div className="flex min-w-0 items-center gap-3">
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold tabular-nums ${darkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                    {adpRank}
                </span>
                {player.photo && (
                    <img
                        src={player.photo}
                        alt={player.name}
                        className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-white/80 dark:ring-slate-700"
                    />
                )}
                <div className="min-w-0">
                    <h3 className={`truncate text-sm font-semibold ${ui.heading(darkMode)}`}>
                        {player.name}
                    </h3>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span {...getPositionTagProps(player.position, { darkMode, colors: positionColors })}>
                            {player.position}
                        </span>
                        {player.team && (
                            <img
                                src={`https://a.espncdn.com/i/teamlogos/nfl/500/${player.team.toLowerCase()}.png`}
                                alt={player.team}
                                className="h-4 w-4 object-contain"
                                onError={(e) => { e.target.style.display = 'none'; }}
                            />
                        )}
                        <span className={`text-xs ${ui.muted(darkMode)}`}>{player.team}</span>
                    </div>
                </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
                <p className={`text-sm font-semibold tabular-nums ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                    {player.adp != null ? `ADP ${player.adp.toFixed(1)}` : 'No ADP'}
                </p>
                <button
                    onClick={() => handleRemoveDrafted(player.id)}
                    className={`rounded-lg px-2 py-1 text-xs font-medium transition ${darkMode
                        ? 'bg-rose-500/15 text-rose-400 hover:bg-rose-500/25'
                        : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                        }`}
                >
                    Remove
                </button>
            </div>
        </div>
    );

    return (
        <div className="p-4 sm:p-6">
            <div className="mx-auto max-w-6xl">
                <div className="mb-6">
                    <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-500">
                        Draft Tool
                    </p>
                    <h1 className={`font-display text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl ${ui.heading(darkMode)}`}>
                        Draft Range <span className="text-gradient-brand">Calculator</span>
                    </h1>
                    <p className={`mt-2 max-w-2xl text-sm sm:text-base ${ui.muted(darkMode)}`}>
                        See which players are likely to be on the board at each of your picks,
                        based on league size and draft slot.
                    </p>
                </div>

                <div className={`${ui.toolbar(darkMode)} mb-8`}>
                    <div className="flex flex-col gap-5 sm:flex-row">
                        <div className="flex-1">
                            <label htmlFor="league-size" className={`mb-2 block text-sm font-medium ${ui.muted(darkMode)}`}>
                                League Size
                            </label>
                            <select
                                id="league-size"
                                value={leagueSize}
                                onChange={(e) => setLeagueSize(parseInt(e.target.value))}
                                className={selectClass}
                            >
                                {leagueSizeOptions.map(size => (
                                    <option key={size} value={size}>{size} teams</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex-1">
                            <label htmlFor="pick-position" className={`mb-2 block text-sm font-medium ${ui.muted(darkMode)}`}>
                                Your Pick Position
                            </label>
                            <select
                                id="pick-position"
                                value={pickPosition}
                                onChange={(e) => setPickPosition(parseInt(e.target.value))}
                                className={selectClass}
                            >
                                {pickPositionOptions.map(pick => (
                                    <option key={pick} value={pick}>Pick {pick}</option>
                                ))}
                            </select>
                        </div>

                        {/* Position Filter */}
                        <div className="flex-1">
                            <span className={`mb-2 block text-sm font-medium ${ui.muted(darkMode)}`}>
                                Position Filter (optional)
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                                {['QB', 'RB', 'WR', 'TE', 'K', 'DST'].map(position => (
                                    <button
                                        key={position}
                                        onClick={() => {
                                            if (positionFilter.includes(position)) {
                                                setPositionFilter(positionFilter.filter(p => p !== position));
                                            } else {
                                                setPositionFilter([...positionFilter, position]);
                                            }
                                        }}
                                        className={`cursor-pointer rounded-lg px-3 py-2 text-sm font-semibold transition ${positionFilter.includes(position)
                                            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-glow'
                                            : darkMode
                                                ? 'bg-slate-800/70 text-slate-300 ring-1 ring-white/5 hover:bg-slate-700/70'
                                                : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
                                            }`}
                                    >
                                        {position}
                                    </button>
                                ))}
                            </div>
                            {positionFilter.length > 0 && (
                                <button
                                    onClick={() => setPositionFilter([])}
                                    className={`mt-3 cursor-pointer text-sm font-medium hover:underline ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}
                                >
                                    Clear all filters
                                </button>
                            )}
                        </div>
                    </div>

                    <div className={`mt-5 rounded-xl border-l-4 border-emerald-500 p-4 ${darkMode ? 'bg-emerald-500/[0.06]' : 'bg-emerald-50/70'}`}>
                        <p className={`text-sm leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                            <strong className={ui.heading(darkMode)}>How it works:</strong> Based on your league size and pick position,
                            this tool shows players likely to be available at each of your picks.
                            The variance increases in later rounds to account for more unpredictable drafting.
                            {positionFilter.length > 0 && (
                                <span className="mt-1 block">
                                    <strong className={ui.heading(darkMode)}>Filtered by:</strong> {positionFilter.join(', ')}
                                </span>
                            )}
                        </p>
                    </div>
                </div>

                {/* Drafted Players Section */}
                {draftedPlayers.length > 0 && (
                    <div className={`${ui.card(darkMode)} mb-8 p-6`}>
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h2 className={`text-xl font-bold ${ui.heading(darkMode)}`}>
                                    Your Drafted Team
                                </h2>
                                <p className={`mt-1 text-sm ${ui.muted(darkMode)}`}>
                                    {draftedPlayers.length} players · grouped by position, ranked by ADP within each role
                                </p>
                            </div>
                            <button
                                onClick={() => setDraftedPlayers([])}
                                className={`rounded-xl px-3 py-2 text-sm font-medium transition ${darkMode
                                    ? 'bg-rose-600 text-white hover:bg-rose-500'
                                    : 'bg-rose-50 text-rose-700 ring-1 ring-rose-200 hover:bg-rose-100'
                                    }`}
                            >
                                Clear All
                            </button>
                        </div>

                        <div className="space-y-6">
                            {draftedByPosition.map(({ position, players }) => (
                                <div key={position}>
                                    <div className={`mb-3 flex items-center gap-3 border-b pb-2 ${darkMode ? 'border-white/5' : 'border-slate-200'}`}>
                                        <span {...getPositionTagProps(position, { darkMode, colors: positionColors })}>
                                            {position}
                                        </span>
                                        <span className={`text-sm font-semibold ${ui.heading(darkMode)}`}>
                                            {position === 'DST' ? 'Defense' : position}
                                        </span>
                                        <span className={`text-xs ${ui.muted(darkMode)}`}>
                                            {players.length} {players.length === 1 ? 'player' : 'players'}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                        {players.map((player, index) => renderDraftedPlayerCard(player, index + 1))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Results */}
                <div className="space-y-5">
                    {Object.entries(availablePlayers).map(([round, data]) => (
                        <div key={round} className={`${ui.card(darkMode)} overflow-hidden`}>
                            <div className={`flex flex-wrap items-center gap-x-4 gap-y-2 border-b px-5 py-4 sm:px-6 ${darkMode ? 'border-white/5' : 'border-slate-100'}`}>
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-sm font-bold text-white shadow-glow">
                                    {round}
                                </span>
                                <div className="min-w-0">
                                    <h2 className={`text-base font-bold sm:text-lg ${ui.heading(darkMode)}`}>
                                        Round {round} · Pick {data.pickNumber}
                                    </h2>
                                    <p className={`text-xs sm:text-sm ${ui.muted(darkMode)}`}>
                                        ADP range {Math.max(1, data.pickNumber - data.variance)}–{data.pickNumber + data.variance} (±{data.variance})
                                    </p>
                                </div>
                            </div>

                            <div className="p-4 sm:p-5">
                                {data.players.length > 0 ? (
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                        {data.players.map((player) => {
                                            const isDrafted = draftedPlayers.some(p => p.id === player.id);
                                            return (
                                                <div
                                                    key={player.id}
                                                    onClick={() => handlePlayerClick(player)}
                                                    className={`cursor-pointer p-3.5 transition hover:-translate-y-px hover:shadow-md ${ui.cardInset(darkMode)} ${isDrafted
                                                        ? 'ring-2 ring-emerald-500/70'
                                                        : ''
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        {player.photo && (
                                                            <img
                                                                src={player.photo}
                                                                alt={player.name}
                                                                loading="lazy"
                                                                className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-white/80 dark:ring-slate-700"
                                                            />
                                                        )}
                                                        <div className="min-w-0 flex-1">
                                                            <div className="mb-1 flex items-center gap-2">
                                                                <h3 className={`truncate text-sm font-semibold ${ui.heading(darkMode)}`}>
                                                                    {player.name}
                                                                </h3>
                                                                <span {...getPositionTagProps(player.position, { darkMode, colors: positionColors })}>
                                                                    {player.position}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                {player.team && (
                                                                    <img
                                                                        src={`https://a.espncdn.com/i/teamlogos/nfl/500/${player.team.toLowerCase()}.png`}
                                                                        alt={player.team}
                                                                        className="h-4 w-4 object-contain"
                                                                        onError={(e) => {
                                                                            e.target.style.display = 'none';
                                                                        }}
                                                                    />
                                                                )}
                                                                <span className={`text-xs ${ui.muted(darkMode)}`}>
                                                                    {player.team}
                                                                </span>
                                                                <span className={`ml-auto text-xs font-semibold tabular-nums ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                                                    ADP {player.adp}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="py-8 text-center">
                                        <p className={`text-sm ${ui.muted(darkMode)}`}>
                                            No players found in this ADP range
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DraftRange;
