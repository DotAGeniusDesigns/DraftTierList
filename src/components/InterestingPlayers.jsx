import React from 'react';
import { getTeamLogo } from '../utils/teamData';

const InterestingPlayers = ({ darkMode }) => {
    const interestingPlayers = [
        {
            id: "romeo-doubs",
            name: "Romeo Doubs",
            position: "WR",
            team: "GB",
            photo: "https://www.shutterstock.com/image-vector/vector-flat-illustration-grayscale-avatar-600nw-2264922221.jpg",
            stats: {
                fppg: 12.8,
                lastWeek: 18.4,
                seasonHigh: 24.2,
                targets: 6.2
            },
            notes: "Jayden Reed confirmed out at least 6 weeks, Packers offense very strong"
        }
    ];

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

    const renderPlayerCard = (player) => {
        const baseCardClasses = `p-3 rounded-lg border transition-all duration-200 w-80 mx-auto ${darkMode
            ? 'bg-gray-800 border-gray-700 hover:border-gray-600'
            : 'bg-white border-gray-200 hover:border-gray-300'
            }`;

        return (
            <div key={player.id} className={baseCardClasses}>
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                        <img src={getTeamLogo(player.team)} alt={player.team} className="w-8 h-8" />
                        <div className="flex items-center space-x-2">
                            <img src={player.photo} alt={player.name} className="w-8 h-8 rounded-full" />
                            <div>
                                <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {player.name}
                                </h3>
                                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {player.team}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPositionColor(player.position)}`}>
                            {player.position}
                        </span>
                    </div>
                </div>

                <div className={`border-t mb-3 ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}></div>

                <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className={`text-center p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>FPPG</p>
                        <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{player.stats.fppg}</p>
                    </div>
                    <div className={`text-center p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Last Week</p>
                        <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{player.stats.lastWeek}</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className={`text-center p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Season High</p>
                        <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{player.stats.seasonHigh}</p>
                    </div>
                    <div className={`text-center p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Targets/G</p>
                        <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{player.stats.targets}</p>
                    </div>
                </div>

                <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <p className={`text-xs font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Notes</p>
                    <p className={`text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{player.notes}</p>
                </div>
            </div>
        );
    };

    return (
        <div className={`min-h-screen transition-colors duration-200 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className={`text-4xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Waiver Wire Watch
                    </h1>
                    <p className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Players to keep an eye on for potential waiver wire pickups
                    </p>
                </div>

                {/* Players Grid */}
                <div className="flex flex-wrap justify-center gap-4 sm:gap-6 lg:gap-8 max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
                    {interestingPlayers.map(player => renderPlayerCard(player))}
                </div>
            </div>
        </div>
    );
};

export default InterestingPlayers;