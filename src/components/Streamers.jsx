import React from 'react';
import { getStreamersForWeek } from '../utils/streamersDatabase';
import { getTeamLogo, getTeamData } from '../utils/teamData';
import { getOffenseRanking, getDefenseRanking } from '../utils/powerRankings';
import { playerDatabase } from '../utils/playerDatabase';

const Streamers = ({ darkMode }) => {
    // Get streaming data for Week 1 from the database
    const streamingData = getStreamersForWeek(1);

    // Helper function to get player photo
    const getPlayerPhoto = (playerName) => {
        const playerKey = playerName.toLowerCase().replace(/\s+/g, '-').replace(/\./g, '');
        const player = playerDatabase[playerKey];
        return player ? player.photo : null;
    };

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
        const baseCardClasses = `p-3 rounded-lg border transition-all duration-200 w-80 mx-auto ${darkMode
            ? 'bg-gray-800 border-gray-700 hover:border-gray-600'
            : 'bg-white border-gray-200 hover:border-gray-300'
            }`;

        switch (position) {
            case 'QB':
                return (
                    <div key={player.name} className={baseCardClasses}>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                                <img src={getTeamLogo(player.team)} alt={player.team} className="w-8 h-8" />
                                <div className="flex items-center space-x-2">
                                    {getPlayerPhoto(player.name) && (
                                        <img src={getPlayerPhoto(player.name)} alt={player.name} className="w-8 h-8 rounded-full" />
                                    )}
                                    <div>
                                        <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                            {player.name}
                                        </h3>
                                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                            {player.team} • {player.homeAway}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPositionColor(position)}`}>
                                    #{player.streamingRank}
                                </span>
                            </div>
                        </div>

                        {/* Section Break - Opponent Stats */}
                        <div className={`border-t mb-3 ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}></div>

                        {/* Opponent's Negative Stats */}
                        <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                            <div className="text-center mb-2">
                                <p className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>vs</p>
                                <div className="flex items-center justify-center space-x-2">
                                    <img src={getTeamLogo(player.opponent)} alt={player.opponent} className="w-6 h-6" />
                                    <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{player.opponent}</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className={`text-center p-2 rounded ${darkMode ? 'bg-gray-600' : 'bg-white'}`}>
                                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Fantasy Points Per Game Allowed</p>
                                    <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{player.opponentFantasyPointsAllowed}</p>
                                </div>
                                <div className={`text-center p-2 rounded ${darkMode ? 'bg-gray-600' : 'bg-white'}`}>
                                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>TDs Allowed</p>
                                    <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{player.opponentPassTDsAllowed}</p>
                                </div>
                                <div className={`text-center p-2 rounded ${darkMode ? 'bg-gray-600' : 'bg-white'}`}>
                                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Pass Yds Allowed</p>
                                    <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{player.opponentPassYardsAllowed}</p>
                                </div>
                                <div className={`text-center p-2 rounded ${darkMode ? 'bg-gray-600' : 'bg-white'}`}>
                                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>QB Rush Yds Allowed</p>
                                    <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{player.opponentQBRushYardsAllowed}</p>
                                </div>
                            </div>
                        </div>


                    </div>
                );

            case 'RB':
                return (
                    <div key={player.name} className={baseCardClasses}>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                                <img src={getTeamLogo(player.team)} alt={player.team} className="w-8 h-8" />
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
                                    <img src={getTeamLogo(player.opponent)} alt={player.opponent} className="w-6 h-6" />
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


                    </div>
                );

            case 'WR':
                return (
                    <div key={player.name} className={baseCardClasses}>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                                <img src={getTeamLogo(player.team)} alt={player.team} className="w-8 h-8" />
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
                                    <img src={getTeamLogo(player.opponent)} alt={player.opponent} className="w-6 h-6" />
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


                    </div>
                );

            case 'TE':
                return (
                    <div key={player.name} className={baseCardClasses}>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                                <img src={getTeamLogo(player.team)} alt={player.team} className="w-8 h-8" />
                                <div className="flex items-center space-x-2">
                                    {getPlayerPhoto(player.name) && (
                                        <img src={getPlayerPhoto(player.name)} alt={player.name} className="w-8 h-8 rounded-full" />
                                    )}
                                    <div>
                                        <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                            {player.name}
                                        </h3>
                                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                            {player.team} • {player.homeAway}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPositionColor(position)}`}>
                                    #{player.streamingRank}
                                </span>
                            </div>
                        </div>

                        {/* Section Break - Opponent Stats */}
                        <div className={`border-t mb-3 ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}></div>

                        {/* Opponent's Negative Stats */}
                        <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                            <div className="text-center mb-2">
                                <p className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>vs</p>
                                <div className="flex items-center justify-center space-x-2">
                                    <img src={getTeamLogo(player.opponent)} alt={player.opponent} className="w-6 h-6" />
                                    <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{player.opponent}</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className={`text-center p-2 rounded ${darkMode ? 'bg-gray-600' : 'bg-white'}`}>
                                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Fantasy Points Per Game Allowed</p>
                                    <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{player.opponentFantasyPointsAllowed}</p>
                                </div>
                                <div className={`text-center p-2 rounded ${darkMode ? 'bg-gray-600' : 'bg-white'}`}>
                                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Rec Yds Allowed</p>
                                    <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{player.opponentRecYardsAllowed}</p>
                                </div>
                                <div className={`text-center p-2 rounded ${darkMode ? 'bg-gray-600' : 'bg-white'}`}>
                                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Rec TDs Allowed</p>
                                    <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{player.opponentRecTDsAllowed}</p>
                                </div>
                            </div>
                        </div>


                    </div>
                );

            case 'DST':
                return (
                    <div key={player.name} className={baseCardClasses}>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                                <img src={getTeamLogo(player.team)} alt={player.team} className="w-8 h-8" />
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

                        {/* DST's Positive Stats */}
                        <div className="space-y-2 mb-3">
                            <div className={`text-center p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Fantasy Points Per Game</p>
                                <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{player.fantasyPointsPerGame}</p>
                            </div>
                            <div className={`text-center p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>NFL Defense Rank</p>
                                <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>#{getDefenseRanking(player.team)}</p>
                            </div>
                        </div>

                        {/* Section Break - Opponent Stats */}
                        <div className={`border-t mb-3 ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}></div>

                        {/* Opponent's Negative Stats */}
                        <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                            <div className="text-center mb-2">
                                <p className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>vs</p>
                                <div className="flex items-center justify-center space-x-2">
                                    <img src={getTeamLogo(player.opponent)} alt={player.opponent} className="w-6 h-6" />
                                    <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{player.opponent}</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className={`text-center p-2 rounded ${darkMode ? 'bg-gray-600' : 'bg-white'}`}>
                                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>NFL Offense Rank</p>
                                    <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>#{getOffenseRanking(player.opponent)}</p>
                                </div>
                            </div>
                        </div>


                    </div>
                );

            case 'K':
                return (
                    <div key={player.name} className={baseCardClasses}>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                                <img src={getTeamLogo(player.team)} alt={player.team} className="w-8 h-8" />
                                <div className="flex items-center space-x-2">
                                    {getPlayerPhoto(player.name) && (
                                        <img src={getPlayerPhoto(player.name)} alt={player.name} className="w-8 h-8 rounded-full" />
                                    )}
                                    <div>
                                        <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                            {player.name}
                                        </h3>
                                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                            {player.team} • {player.homeAway}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPositionColor(position)}`}>
                                    #{player.streamingRank}
                                </span>
                            </div>
                        </div>

                        {/* Kicker's Positive Stats */}
                        <div className="space-y-2 mb-3">
                            <div className={`text-center p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Fantasy Points Per Game</p>
                                <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{player.fantasyPointsPerGame}</p>
                            </div>
                        </div>

                        {/* Section Break - Opponent Stats */}
                        <div className={`border-t mb-3 ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}></div>

                        {/* Opponent's Negative Stats */}
                        <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                            <div className="text-center mb-2">
                                <p className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>vs</p>
                                <div className="flex items-center justify-center space-x-2">
                                    <img src={getTeamLogo(player.opponent)} alt={player.opponent} className="w-6 h-6" />
                                    <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{player.opponent}</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className={`text-center p-2 rounded ${darkMode ? 'bg-gray-600' : 'bg-white'}`}>
                                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>NFL Defense Rank</p>
                                    <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>#{getDefenseRanking(player.opponent)}</p>
                                </div>
                            </div>
                        </div>


                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className={`min-h-screen transition-colors duration-200 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-8">
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
                        <div className="flex flex-wrap justify-center gap-4 sm:gap-6 lg:gap-8 max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
                            {players.map(player => renderPlayerCard(player, position))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Streamers;
