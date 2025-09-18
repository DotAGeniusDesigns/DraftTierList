import React from 'react';
import { streamersDatabase } from '../utils/streamersDatabase';
import { getTeamLogo, getTeamData } from '../utils/teamData';
import { getOffenseRanking, getDefenseRanking } from '../utils/powerRankings';
import { playerDatabase } from '../utils/playerDatabase';

const Streamers = ({ darkMode }) => {
    // Get streaming data for Week 3 from the database
    const streamingData = streamersDatabase;

    // Helper function to get player photo
    const getPlayerPhoto = (playerName) => {
        const playerKey = playerName.toLowerCase().replace(/\s+/g, '-').replace(/\./g, '');
        const player = playerDatabase[playerKey];
        return player ? player.photo : 'https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg';
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
                                    <img src={getPlayerPhoto(player.name)} alt={player.name} className="w-8 h-8 rounded-full" />
                                    <div>
                                        <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                            {player.name}
                                        </h3>
                                        <p className={`text-base ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                            {player.team} • {player.homeAway}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium ${getPositionColor(position)}`}>
                                    #{player.streamingRank}
                                </span>
                            </div>
                        </div>

                        {/* QB's Stats - Last Week vs Season Average */}
                        <div className="space-y-2 mb-3">
                            {/* Pass Yards */}
                            <div className={`p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                <p className={`text-sm text-center mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Pass Yards</p>
                                <div className="flex justify-between">
                                    <div className="text-center flex-1">
                                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Last Week</p>
                                        <p className={`text-base font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{player.lastWeekPassYards !== undefined ? player.lastWeekPassYards : '--'}</p>
                                    </div>
                                    <div className={`w-px ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
                                    <div className="text-center flex-1">
                                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Season Avg</p>
                                        <p className={`text-base font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{player.seasonAvgPassYards !== undefined ? player.seasonAvgPassYards : '--'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Pass TDs */}
                            <div className={`p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                <p className={`text-sm text-center mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Pass TDs</p>
                                <div className="flex justify-between">
                                    <div className="text-center flex-1">
                                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Last Week</p>
                                        <p className={`text-base font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{player.lastWeekPassTDs !== undefined ? player.lastWeekPassTDs : '--'}</p>
                                    </div>
                                    <div className={`w-px ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
                                    <div className="text-center flex-1">
                                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Season Avg</p>
                                        <p className={`text-base font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{player.seasonAvgPassTDs !== undefined ? player.seasonAvgPassTDs : '--'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Rush Yards */}
                            <div className={`p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                <p className={`text-sm text-center mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Rush Yards</p>
                                <div className="flex justify-between">
                                    <div className="text-center flex-1">
                                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Last Week</p>
                                        <p className={`text-base font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{player.lastWeekRushYards !== undefined ? player.lastWeekRushYards : '--'}</p>
                                    </div>
                                    <div className={`w-px ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
                                    <div className="text-center flex-1">
                                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Season Avg</p>
                                        <p className={`text-base font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{player.seasonAvgRushYards !== undefined ? player.seasonAvgRushYards : '--'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Rush TDs */}
                            <div className={`p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                <p className={`text-sm text-center mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Rush TDs</p>
                                <div className="flex justify-between">
                                    <div className="text-center flex-1">
                                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Last Week</p>
                                        <p className={`text-base font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{player.lastWeekRushTDs !== undefined ? player.lastWeekRushTDs : '--'}</p>
                                    </div>
                                    <div className={`w-px ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
                                    <div className="text-center flex-1">
                                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Season Avg</p>
                                        <p className={`text-base font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{player.seasonAvgRushTDs !== undefined ? player.seasonAvgRushTDs : '--'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section Break - Opponent Stats */}
                        <div className={`border-t mb-3 ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}></div>

                        {/* Opponent's Negative Stats */}
                        <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                            <div className="text-center mb-2">
                                <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>vs</p>
                                <div className="flex items-center justify-center space-x-2">
                                    <img src={getTeamLogo(player.opponent)} alt={player.opponent} className="w-6 h-6" />
                                    <span className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{player.opponent}</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className={`text-center p-2 rounded ${darkMode ? 'bg-gray-600' : 'bg-white'}`}>
                                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Average Fantasy Points Allowed</p>
                                    <p className={`text-base font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{player.opponentFantasyPointsAllowed}</p>
                                </div>
                                <div className={`text-center p-2 rounded ${darkMode ? 'bg-gray-600' : 'bg-white'}`}>
                                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Average Pass TDs Allowed</p>
                                    <p className={`text-base font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{player.opponentPassTDsAllowed}</p>
                                </div>
                                <div className={`text-center p-2 rounded ${darkMode ? 'bg-gray-600' : 'bg-white'}`}>
                                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Average Pass Yds Allowed</p>
                                    <p className={`text-base font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{player.opponentPassYardsAllowed}</p>
                                </div>
                                <div className={`text-center p-2 rounded ${darkMode ? 'bg-gray-600' : 'bg-white'}`}>
                                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Average QB Rush Yds Allowed</p>
                                    <p className={`text-base font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{player.opponentQBRushYardsAllowed}</p>
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
                                <span className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium ${getPositionColor(position)}`}>
                                    #{player.streamingRank}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <div className={`text-center p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>vs</p>
                                <div className="flex items-center justify-center space-x-2">
                                    <img src={getTeamLogo(player.opponent)} alt={player.opponent} className="w-6 h-6" />
                                    <span className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{player.opponent}</span>
                                </div>
                            </div>
                            <div className={`text-center p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>DL Pressure</p>
                                <p className={`text-sm text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{player.defensiveLinePressure}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 mb-3">
                            <div className={`text-center p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Run Def Rank</p>
                                <p className={`text-base font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>#{player.opponentRunDefRank}</p>
                            </div>
                            <div className={`text-center p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>TDs Allowed</p>
                                <p className={`text-base font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{player.opponentRushTDsAllowed}</p>
                            </div>
                            <div className={`text-center p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Yards Allowed</p>
                                <p className={`text-base font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{player.opponentRushYardsAllowed}</p>
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
                                <span className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium ${getPositionColor(position)}`}>
                                    #{player.streamingRank}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <div className={`text-center p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>vs</p>
                                <div className="flex items-center justify-center space-x-2">
                                    <img src={getTeamLogo(player.opponent)} alt={player.opponent} className="w-6 h-6" />
                                    <span className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{player.opponent}</span>
                                </div>
                            </div>
                            <div className={`text-center p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>WR vs CB</p>
                                <p className={`text-sm text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{player.opponentWRvsCB}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 mb-3">
                            <div className={`text-center p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Pass Def Rank</p>
                                <p className={`text-base font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>#{player.opponentPassDefRank}</p>
                            </div>
                            <div className={`text-center p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Red Zone D</p>
                                <p className={`text-sm text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{player.redZoneDefense}</p>
                            </div>
                            <div className={`text-center p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Secondary</p>
                                <p className={`text-sm text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{player.secondaryDepth}</p>
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
                                    <img src={getPlayerPhoto(player.name)} alt={player.name} className="w-8 h-8 rounded-full" />
                                    <div>
                                        <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                            {player.name}
                                        </h3>
                                        <p className={`text-base ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                            {player.team} • {player.homeAway}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium ${getPositionColor(position)}`}>
                                    #{player.streamingRank}
                                </span>
                            </div>
                        </div>

                        {/* TE's Stats - Last Week vs Season Average */}
                        <div className="space-y-2 mb-3">
                            {/* Targets */}
                            <div className={`p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                <p className={`text-sm text-center mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Targets</p>
                                <div className="flex justify-between">
                                    <div className="text-center flex-1">
                                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Last Week</p>
                                        <p className={`text-base font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{player.lastWeekTargets !== undefined ? player.lastWeekTargets : '--'}</p>
                                    </div>
                                    <div className={`w-px ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
                                    <div className="text-center flex-1">
                                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Season Avg</p>
                                        <p className={`text-base font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{player.seasonAvgTargets !== undefined ? player.seasonAvgTargets : '--'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Receptions */}
                            <div className={`p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                <p className={`text-sm text-center mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Receptions</p>
                                <div className="flex justify-between">
                                    <div className="text-center flex-1">
                                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Last Week</p>
                                        <p className={`text-base font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{player.lastWeekReceptions !== undefined ? player.lastWeekReceptions : '--'}</p>
                                    </div>
                                    <div className={`w-px ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
                                    <div className="text-center flex-1">
                                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Season Avg</p>
                                        <p className={`text-base font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{player.seasonAvgReceptions !== undefined ? player.seasonAvgReceptions : '--'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Yards */}
                            <div className={`p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                <p className={`text-sm text-center mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Yards</p>
                                <div className="flex justify-between">
                                    <div className="text-center flex-1">
                                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Last Week</p>
                                        <p className={`text-base font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{player.lastWeekYards !== undefined ? player.lastWeekYards : '--'}</p>
                                    </div>
                                    <div className={`w-px ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
                                    <div className="text-center flex-1">
                                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Season Avg</p>
                                        <p className={`text-base font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{player.seasonAvgYards !== undefined ? player.seasonAvgYards : '--'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* TDs */}
                            <div className={`p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                <p className={`text-sm text-center mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>TDs</p>
                                <div className="flex justify-between">
                                    <div className="text-center flex-1">
                                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Last Week</p>
                                        <p className={`text-base font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{player.lastWeekTDs !== undefined ? player.lastWeekTDs : '--'}</p>
                                    </div>
                                    <div className={`w-px ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
                                    <div className="text-center flex-1">
                                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Season Avg</p>
                                        <p className={`text-base font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{player.seasonAvgTDs !== undefined ? player.seasonAvgTDs : '--'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section Break - Opponent Stats */}
                        <div className={`border-t mb-3 ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}></div>

                        {/* Opponent's Negative Stats */}
                        <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                            <div className="text-center mb-2">
                                <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>vs</p>
                                <div className="flex items-center justify-center space-x-2">
                                    <img src={getTeamLogo(player.opponent)} alt={player.opponent} className="w-6 h-6" />
                                    <span className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{player.opponent}</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className={`text-center p-2 rounded ${darkMode ? 'bg-gray-600' : 'bg-white'}`}>
                                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Average Fantasy Points Allowed</p>
                                    <p className={`text-base font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{player.opponentFantasyPointsAllowed}</p>
                                </div>
                                <div className={`text-center p-2 rounded ${darkMode ? 'bg-gray-600' : 'bg-white'}`}>
                                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Average Rec Yds Allowed</p>
                                    <p className={`text-base font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{player.opponentRecYardsAllowed}</p>
                                </div>
                                <div className={`text-center p-2 rounded ${darkMode ? 'bg-gray-600' : 'bg-white'}`}>
                                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Average Rec TDs Allowed</p>
                                    <p className={`text-base font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{player.opponentRecTDsAllowed}</p>
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
                                <span className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium ${getPositionColor(position)}`}>
                                    #{player.streamingRank}
                                </span>
                            </div>
                        </div>

                        {/* DST's Positive Stats */}
                        <div className="space-y-2 mb-3">
                            <div className={`text-center p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Fantasy Points Per Game</p>
                                <p className={`text-base font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{player.fantasyPointsPerGame}</p>
                            </div>
                            <div className={`text-center p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>NFL Defense Rank</p>
                                <p className={`text-base font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>#{getDefenseRanking(player.team)}</p>
                            </div>
                        </div>

                        {/* Section Break - Opponent Stats */}
                        <div className={`border-t mb-3 ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}></div>

                        {/* Opponent's Negative Stats */}
                        <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                            <div className="text-center mb-2">
                                <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>vs</p>
                                <div className="flex items-center justify-center space-x-2">
                                    <img src={getTeamLogo(player.opponent)} alt={player.opponent} className="w-6 h-6" />
                                    <span className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{player.opponent}</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className={`text-center p-2 rounded ${darkMode ? 'bg-gray-600' : 'bg-white'}`}>
                                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>NFL Offense Rank</p>
                                    <p className={`text-base font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>#{getOffenseRanking(player.opponent)}</p>
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
                                    <img src={getPlayerPhoto(player.name)} alt={player.name} className="w-8 h-8 rounded-full" />
                                    <div>
                                        <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                            {player.name}
                                        </h3>
                                        <p className={`text-base ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                            {player.team} • {player.homeAway}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium ${getPositionColor(position)}`}>
                                    #{player.streamingRank}
                                </span>
                            </div>
                        </div>

                        {/* Kicker's Positive Stats */}
                        <div className="space-y-2 mb-3">
                            <div className={`text-center p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Fantasy Points Per Game</p>
                                <p className={`text-base font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{player.fantasyPointsPerGame}</p>
                            </div>
                        </div>

                        {/* Section Break - Opponent Stats */}
                        <div className={`border-t mb-3 ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}></div>

                        {/* Opponent's Negative Stats */}
                        <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                            <div className="text-center mb-2">
                                <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>vs</p>
                                <div className="flex items-center justify-center space-x-2">
                                    <img src={getTeamLogo(player.opponent)} alt={player.opponent} className="w-6 h-6" />
                                    <span className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{player.opponent}</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className={`text-center p-2 rounded ${darkMode ? 'bg-gray-600' : 'bg-white'}`}>
                                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>NFL Defense Rank</p>
                                    <p className={`text-base font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>#{getDefenseRanking(player.opponent)}</p>
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
                    <h1 className={`text-5xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Week 3 Streamers
                    </h1>
                    <p className={`text-xl ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Find the best streaming options for Week 3
                    </p>
                </div>

                {/* Streamers by Position */}
                {Object.entries(streamingData).map(([position, players]) => (
                    <div key={position} className="mb-8">
                        <h2 className={`text-3xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
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
