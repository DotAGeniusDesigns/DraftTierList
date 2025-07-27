import React from 'react';

const Player = ({ player, index, onToggleDraft, onMovePlayer, darkMode }) => {
    const handleClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggleDraft(player.id);
    };

    const handleDragStart = (e) => {
        console.log('🎯 DRAG START for player:', player.name, 'at index:', index);
        e.dataTransfer.setData('text/plain', JSON.stringify({
            playerId: player.id,
            sourceIndex: index,
            sourceTier: player.tier
        }));
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const dragData = e.dataTransfer.getData('text/plain');
        if (!dragData) return;

        try {
            const { playerId } = JSON.parse(dragData);
            console.log('🎯 DROP detected:', playerId, 'onto', player.id, 'at index:', index);

            if (playerId !== player.id) {
                // Moving to a different player's tier
                onMovePlayer && onMovePlayer(playerId, player.tier, index);
            }
        } catch (error) {
            console.error('Error parsing drag data:', error);
        }
    };

    // Debug: Log team logo URL
    console.log(`Team logo for ${player.name} (${player.team}):`, player.teamLogo);

    return (
        <div
            draggable="true"
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`
                relative p-3 border-b cursor-grab active:cursor-grabbing transition-all duration-200
                ${darkMode
                    ? `border-gray-700 ${player.drafted ? 'bg-gray-800 opacity-60' : 'bg-gray-900 hover:bg-gray-800'}`
                    : `border-gray-200 ${player.drafted ? 'bg-gray-100 opacity-60' : 'bg-white hover:bg-gray-50'}`
                }
            `}
            onClick={handleClick}
            style={{ userSelect: 'none' }}
            data-player-id={player.id}
        >
            {/* Draft indicator */}
            {player.drafted && (
                <div className="absolute top-3 left-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
            )}

            {/* Player info - evenly distributed on single row */}
            <div className="flex items-center">
                {/* Rank */}
                <div className={`w-16 text-center font-bold text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                    {index}
                </div>

                {/* Photo */}
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                    <img
                        src={player.photo}
                        alt={player.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                        }}
                    />
                    <div className={`w-full h-full flex items-center justify-center text-xs font-bold ${darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-300 text-gray-600'
                        }`} style={{ display: 'none' }}>
                        {player.name.split(' ').map(n => n[0]).join('')}
                    </div>
                </div>

                {/* Player name - takes up more space */}
                <div className="flex-1 px-12">
                    <div className={`font-semibold text-sm ${player.drafted ? 'line-through' : ''} ${darkMode ? 'text-gray-200' : 'text-gray-900'
                        }`}>
                        {player.name}
                    </div>
                </div>

                {/* Team logo */}
                <div className="w-12 h-12 flex-shrink-0">
                    <img
                        src={player.teamLogo}
                        alt={player.team}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                            console.error(`Failed to load team logo for ${player.team}:`, player.teamLogo);
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                        }}
                    />
                    <div className={`w-full h-full flex items-center justify-center text-xs font-bold ${darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-600'
                        }`} style={{ display: 'none' }}>
                        {player.team}
                    </div>
                </div>

                {/* Position */}
                <div className="w-24 text-center mx-4">
                    <span className={`text-xs font-bold px-2 py-1 rounded ${player.drafted
                        ? 'bg-gray-300 text-gray-600'
                        : player.position === 'WR'
                            ? 'bg-green-100 text-green-800'
                            : player.position === 'RB'
                                ? 'bg-blue-100 text-blue-800'
                                : player.position === 'QB'
                                    ? 'bg-orange-100 text-orange-800'
                                    : player.position === 'TE'
                                        ? 'bg-purple-100 text-purple-800'
                                        : player.position === 'DST'
                                            ? 'bg-gray-200 text-gray-700'
                                            : player.position === 'K'
                                                ? 'bg-pink-100 text-pink-800'
                                                : 'bg-gray-200 text-gray-700'
                        }`}>
                        {player.position}
                    </span>
                </div>

                {/* Bye week */}
                <div className="w-24 text-center">
                    <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                        BYE {player.byeWeek}
                    </span>
                </div>

                {/* Drag handle */}
                <div className={`w-12 transition-colors flex-shrink-0 ml-2 ${darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                    }`}>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M7 2a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 2zm0 6a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 8zm0 6a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 14zm6-8a2 2 0 1 1-.001-4.001A2 2 0 0 1 13 6zm0 2a2 2 0 1 1 .001 4.001A2 2 0 0 1 13 8zm0 6a2 2 0 1 1 .001 4.001A2 2 0 0 1 13 14z" />
                    </svg>
                </div>
            </div>
        </div>
    );
};

export default Player; 