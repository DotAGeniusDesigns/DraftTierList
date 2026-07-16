import React, { useState, useEffect, useMemo } from 'react';
import { ui } from '../utils/uiTheme';
import { getPositionTagClass } from '../utils/playerStyles';

const POSITION_ORDER = ['QB', 'RB', 'WR', 'TE', 'K', 'DST'];

const sortByAdp = (a, b) => {
    const adpA = a.adp ?? Infinity;
    const adpB = b.adp ?? Infinity;
    return adpA - adpB;
};

const DraftRange = ({ darkMode, allPlayers = [] }) => {
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
                        <span className={getPositionTagClass(player.position, { darkMode })}>
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
        <div className={`${ui.page(darkMode)} p-4 sm:p-6`}>
            <div className="mx-auto max-w-6xl">
                <div className="mb-8 text-center">
                    <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-500">
                        Draft Tool
                    </p>
                    <h1 className={`text-3xl font-bold sm:text-4xl ${ui.heading(darkMode)}`}>
                        Draft Range <span className="text-gradient-brand">Calculator</span>
                    </h1>
                </div>

                <div className={`${ui.card(darkMode)} mb-8 p-6`}>
                    <div className="flex flex-col sm:flex-row gap-6">
                        <div className="flex-1">
                            <label className={`block text-sm font-medium mb-2 transition-colors duration-200 ${darkMode ? 'text-gray-300' : 'text-black'}`}>
                                League Size
                            </label>
                            <select
                                value={leagueSize}
                                onChange={(e) => setLeagueSize(parseInt(e.target.value))}
                                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ${darkMode
                                    ? 'bg-gray-700 border-gray-600 text-white'
                                    : 'bg-white border-gray-300 text-black'}`}
                            >
                                {leagueSizeOptions.map(size => (
                                    <option key={size} value={size}>{size} teams</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex-1">
                            <label className={`block text-sm font-medium mb-2 transition-colors duration-200 ${darkMode ? 'text-gray-300' : 'text-black'}`}>
                                Your Pick Position
                            </label>
                            <select
                                value={pickPosition}
                                onChange={(e) => setPickPosition(parseInt(e.target.value))}
                                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ${darkMode
                                    ? 'bg-gray-700 border-gray-600 text-white'
                                    : 'bg-white border-gray-300 text-black'}`}
                            >
                                {pickPositionOptions.map(pick => (
                                    <option key={pick} value={pick}>Pick {pick}</option>
                                ))}
                            </select>
                        </div>

                        {/* Position Filter */}
                        <div className="flex-1">
                            <label className={`block text-sm font-medium mb-2 transition-colors duration-200 ${darkMode ? 'text-gray-300' : 'text-black'}`}>
                                Position Filter (optional)
                            </label>
                            <div className="flex flex-wrap gap-2">
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
                                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${positionFilter.includes(position)
                                            ? 'bg-blue-600 text-white'
                                            : darkMode
                                                ? 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                                                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                            }`}
                                    >
                                        {position}
                                    </button>
                                ))}
                            </div>
                            {positionFilter.length > 0 && (
                                <button
                                    onClick={() => setPositionFilter([])}
                                    className={`mt-3 text-sm hover:underline ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}
                                >
                                    Clear all filters
                                </button>
                            )}
                        </div>
                    </div>

                    <div className={`mt-4 p-4 rounded-md transition-colors duration-200 ${darkMode ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
                        <p className={`text-sm transition-colors duration-200 ${darkMode ? 'text-blue-200' : 'text-blue-800'}`}>
                            <strong>How it works:</strong> Based on your league size and pick position,
                            this tool shows players likely to be available at each of your picks.
                            The variance increases in later rounds to account for more unpredictable drafting.
                            {positionFilter.length > 0 && (
                                <span className="block mt-1">
                                    <strong>Filtered by:</strong> {positionFilter.join(', ')}
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
                                        <span className={getPositionTagClass(position, { darkMode })}>
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
                <div className="space-y-6">
                    {Object.entries(availablePlayers).map(([round, data]) => (
                        <div key={round} className={`rounded-lg shadow-md overflow-hidden transition-colors duration-200 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                            <div className={`px-6 py-4 transition-colors duration-200 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                                <h2 className={`text-xl font-bold transition-colors duration-200 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                    Round {round} - Pick {data.pickNumber} (Position {pickPosition})
                                </h2>
                                <p className={`text-sm transition-colors duration-200 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    ADP Range: {Math.max(1, data.pickNumber - data.variance)} - {data.pickNumber + data.variance}
                                    (±{data.variance})
                                </p>
                            </div>

                            <div className="p-6">
                                {data.players.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {data.players.map((player, index) => (
                                            <div
                                                key={player.id}
                                                onClick={() => handlePlayerClick(player)}
                                                className={`rounded-lg p-4 border hover:shadow-md transition-all duration-200 cursor-pointer ${darkMode
                                                    ? 'bg-gray-700 border-gray-600'
                                                    : 'bg-gray-50 border-gray-200'} ${draftedPlayers.find(p => p.id === player.id)
                                                        ? darkMode
                                                            ? 'ring-2 ring-green-400 bg-gray-600 border-green-500'
                                                            : 'ring-2 ring-green-400 bg-green-50 border-green-300'
                                                        : ''
                                                    }`}
                                            >
                                                <div className="flex items-center space-x-3">
                                                    {player.photo && (
                                                        <img
                                                            src={player.photo}
                                                            alt={player.name}
                                                            className="w-12 h-12 rounded-full object-cover"
                                                        />
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h3 className={`font-semibold truncate transition-colors duration-200 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                                                {player.name}
                                                            </h3>
                                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${player.position === 'QB' ? (darkMode ? 'bg-orange-900 text-orange-200' : 'bg-orange-100 text-orange-800') :
                                                                player.position === 'RB' ? (darkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800') :
                                                                    player.position === 'WR' ? (darkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800') :
                                                                        player.position === 'TE' ? (darkMode ? 'bg-purple-900 text-purple-200' : 'bg-purple-100 text-purple-800') :
                                                                            player.position === 'K' ? (darkMode ? 'bg-pink-900 text-pink-200' : 'bg-pink-100 text-pink-800') :
                                                                                (darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-700')
                                                                }`}>
                                                                {player.position}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            {player.team && (
                                                                <img
                                                                    src={`https://a.espncdn.com/i/teamlogos/nfl/500/${player.team.toLowerCase()}.png`}
                                                                    alt={player.team}
                                                                    className="w-5 h-5 object-contain"
                                                                    onError={(e) => {
                                                                        e.target.style.display = 'none';
                                                                    }}
                                                                />
                                                            )}
                                                            <span className={`text-sm transition-colors duration-200 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                                {player.team}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <p className={`text-sm font-medium transition-colors duration-200 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                                                                ADP: {player.adp}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <p className={`transition-colors duration-200 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
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
