import React from 'react';
import { getStreamersForWeek } from '../utils/streamersDatabase';

const Streamers = ({ darkMode }) => {
    // Get streaming data for Week 1 from the database
    const streamingData = getStreamersForWeek(1);

    const getPositionColor = (position) => {
        switch (position) {
            case 'QB': return darkMode ? 'bg-orange-900 text-orange-200' : 'bg-orange-100 text-orange-800';
            case 'RB': return darkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800';
            case 'WR': return darkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800';
            case 'TE': return darkMode ? 'bg-purple-900 text-purple-200' : 'bg-purple-100 text-purple-800';
            case 'DST': return darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-700';
            case 'K': return darkMode ? 'bg-pink-900 text-pink-200' : 'bg-pink-100 text-pink-800';
            default: return darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-700';
        }
    };

    const renderPlayerCard = (player, position) => {
        const baseCardClasses = `p-4 rounded-lg border transition-all duration-200 ${darkMode
            ? 'bg-gray-800 border-gray-700 hover:border-gray-600'
            : 'bg-white border-gray-200 hover:border-gray-300'
            }`;

        switch (position) {
            case 'QB':
                return (
                    <div key={player.name} className={baseCardClasses}>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                                <img src={player.teamLogo} alt={player.team} className="w-8 h-8" />
                                <div>
                                    <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                        {player.name}
                                    </h3>
                                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {player.team} • {player.homeAway}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPositionColor(position)}`}>
                                    #{player.streamingRank}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <div className={`text-center p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>vs</p>
                                <div className="flex items-center justify-center space-x-2">
                                    <img src={player.opponentLogo} alt={player.opponent} className="w-6 h-6" />
                                    <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{player.opponent}</span>
                                </div>
                            </div>
                            <div className={`text-center p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Weather</p>
                                <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{player.weather}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 mb-3">
                            <div className={`text-center p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Pass Def Rank</p>
                                <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>#{player.opponentPassDefRank}</p>
                            </div>
                            <div className={`text-center p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>TDs Allowed</p>
                                <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{player.opponentPassTDsAllowed}</p>
                            </div>
                            <div className={`text-center p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Yards Allowed</p>
                                <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{player.opponentPassYardsAllowed}</p>
                            </div>
                        </div>

                        <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {player.reason}
                        </p>
                    </div>
                );

            case 'RB':
                return (
                    <div key={player.name} className={baseCardClasses}>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                                <img src={player.teamLogo} alt={player.team} className="w-8 h-8" />
                                <div>
                                    <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                        {player.name}
                                    </h3>
                                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {player.team}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPositionColor(position)}`}>
                                    #{player.streamingRank}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <div className={`text-center p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>vs</p>
                                <div className="flex items-center justify-center space-x-2">
                                    <img src={player.opponentLogo} alt={player.opponent} className="w-6 h-6" />
                                    <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{player.opponent}</span>
                                </div>
                            </div>
                            <div className={`text-center p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>DL Pressure</p>
                                <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{player.defensiveLinePressure}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 mb-3">
                            <div className={`text-center p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Run Def Rank</p>
                                <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>#{player.opponentRunDefRank}</p>
                            </div>
                            <div className={`text-center p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>TDs Allowed</p>
                                <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{player.opponentRushTDsAllowed}</p>
                            </div>
                            <div className={`text-center p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Yards Allowed</p>
                                <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{player.opponentRushYardsAllowed}</p>
                            </div>
                        </div>

                        <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {player.reason}
                        </p>
                    </div>
                );

            case 'WR':
                return (
                    <div key={player.name} className={baseCardClasses}>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                                <img src={player.teamLogo} alt={player.team} className="w-8 h-8" />
                                <div>
                                    <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                        {player.name}
                                    </h3>
                                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {player.team}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPositionColor(position)}`}>
                                    #{player.streamingRank}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <div className={`text-center p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>vs</p>
                                <div className="flex items-center justify-center space-x-2">
                                    <img src={player.opponentLogo} alt={player.opponent} className="w-6 h-6" />
                                    <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{player.opponent}</span>
                                </div>
                            </div>
                            <div className={`text-center p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>WR vs CB</p>
                                <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{player.opponentWRvsCB}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 mb-3">
                            <div className={`text-center p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Pass Def Rank</p>
                                <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>#{player.opponentPassDefRank}</p>
                            </div>
                            <div className={`text-center p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Red Zone D</p>
                                <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{player.redZoneDefense}</p>
                            </div>
                            <div className={`text-center p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Secondary</p>
                                <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{player.secondaryDepth}</p>
                            </div>
                        </div>

                        <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {player.reason}
                        </p>
                    </div>
                );

            case 'TE':
                return (
                    <div key={player.name} className={baseCardClasses}>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                                <img src={player.teamLogo} alt={player.team} className="w-8 h-8" />
                                <div>
                                    <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                        {player.name}
                                    </h3>
                                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {player.team}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPositionColor(position)}`}>
                                    #{player.streamingRank}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <div className={`text-center p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>vs</p>
                                <div className="flex items-center justify-center space-x-2">
                                    <img src={player.opponentLogo} alt={player.opponent} className="w-6 h-6" />
                                    <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{player.opponent}</span>
                                </div>
                            </div>
                            <div className={`text-center p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>LB Coverage</p>
                                <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{player.linebackerCoverage}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mb-3">
                            <div className={`text-center p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>TE Def Rank</p>
                                <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>#{player.opponentTEDefRank}</p>
                            </div>
                            <div className={`text-center p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Red Zone D</p>
                                <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{player.redZoneDefense}</p>
                            </div>
                        </div>

                        <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {player.reason}
                        </p>
                    </div>
                );

            case 'DST':
                return (
                    <div key={player.name} className={baseCardClasses}>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                                <img src={player.teamLogo} alt={player.team} className="w-8 h-8" />
                                <div>
                                    <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                        {player.name}
                                    </h3>
                                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {player.team} • {player.homeAway}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPositionColor(position)}`}>
                                    #{player.streamingRank}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <div className={`text-center p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>vs</p>
                                <div className="flex items-center justify-center space-x-2">
                                    <img src={player.opponentLogo} alt={player.opponent} className="w-6 h-6" />
                                    <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{player.opponent}</span>
                                </div>
                            </div>
                            <div className={`text-center p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Weather</p>
                                <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{player.weather}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 mb-3">
                            <div className={`text-center p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Offense Rank</p>
                                <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>#{player.opponentOffenseRank}</p>
                            </div>
                            <div className={`text-center p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Turnovers</p>
                                <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{player.turnoversForced}</p>
                            </div>
                            <div className={`text-center p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Sacks</p>
                                <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{player.sacks}</p>
                            </div>
                        </div>

                        <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {player.reason}
                        </p>
                    </div>
                );

            case 'K':
                return (
                    <div key={player.name} className={baseCardClasses}>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                                <img src={player.teamLogo} alt={player.team} className="w-8 h-8" />
                                <div>
                                    <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                        {player.name}
                                    </h3>
                                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {player.team}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPositionColor(position)}`}>
                                    #{player.streamingRank}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <div className={`text-center p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>vs</p>
                                <div className="flex items-center justify-center space-x-2">
                                    <img src={player.opponentLogo} alt={player.opponent} className="w-6 h-6" />
                                    <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{player.opponent}</span>
                                </div>
                            </div>
                            <div className={`text-center p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Weather</p>
                                <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{player.weather}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mb-3">
                            <div className={`text-center p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Defense Rank</p>
                                <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>#{player.opponentDefenseRank}</p>
                            </div>
                            <div className={`text-center p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>FG Attempts</p>
                                <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{player.fieldGoalAttemptsAllowed}</p>
                            </div>
                        </div>

                        <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {player.reason}
                        </p>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className={`min-h-screen transition-colors duration-200 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className={`text-4xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Week 1 Streamers
                    </h1>
                    <p className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Find the best streaming options for Week 1
                    </p>
                </div>

                {/* Streamers by Position */}
                {Object.entries(streamingData).map(([position, players]) => (
                    <div key={position} className="mb-8">
                        <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {position} Streamers
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {players.map(player => renderPlayerCard(player, position))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Streamers;
