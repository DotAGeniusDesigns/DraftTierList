import React, { useState, useRef, useEffect } from 'react';

const Player = ({ player, index, onToggleDraft, onMovePlayer, darkMode }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const playerRef = useRef(null);
    const dragDataRef = useRef(null);

    const handleClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggleDraft(player.id);
    };

    const handleDragStart = (e) => {
        console.log('🎯 DRAG START for player:', player.name, 'at index:', index);
        setIsDragging(true);
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

    const handleDragEnd = () => {
        setIsDragging(false);
    };

    // Touch event handlers for mobile
    const handleTouchStart = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const touch = e.touches[0];
        const rect = playerRef.current.getBoundingClientRect();
        
        setDragOffset({
            x: touch.clientX - rect.left,
            y: touch.clientY - rect.top
        });
        
        setIsDragging(true);
        
        // Store drag data
        dragDataRef.current = {
            playerId: player.id,
            sourceIndex: index,
            sourceTier: player.tier
        };
        
        // Dispatch custom drag start event
        const dragStartEvent = new CustomEvent('playerDragStart', {
            detail: dragDataRef.current,
            bubbles: true
        });
        document.dispatchEvent(dragStartEvent);
    };

    const handleTouchMove = (e) => {
        if (!isDragging) return;
        
        // Prevent scrolling during drag
        e.preventDefault();
        e.stopPropagation();
        
        const touch = e.touches[0];
        
        // Dispatch custom drag move event
        const dragMoveEvent = new CustomEvent('playerDragMove', {
            detail: {
                clientX: touch.clientX,
                clientY: touch.clientY,
                dragData: dragDataRef.current
            },
            bubbles: true
        });
        document.dispatchEvent(dragMoveEvent);
    };

    const handleTouchEnd = (e) => {
        if (!isDragging) return;
        
        // Prevent any default behavior
        e.preventDefault();
        e.stopPropagation();
        
        const touch = e.changedTouches[0];
        
        // Dispatch custom drag end event
        const dragEndEvent = new CustomEvent('playerDragEnd', {
            detail: {
                clientX: touch.clientX,
                clientY: touch.clientY,
                dragData: dragDataRef.current
            },
            bubbles: true
        });
        document.dispatchEvent(dragEndEvent);
        
        setIsDragging(false);
        dragDataRef.current = null;
    };

    // Debug: Log team logo URL
    console.log(`Team logo for ${player.name} (${player.team}):`, player.teamLogo);

    return (
        <div
            ref={playerRef}
            draggable="true"
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className={`
                relative p-2 sm:p-3 border-b cursor-grab active:cursor-grabbing transition-all duration-200
                ${isDragging ? 'opacity-50 scale-105 z-50' : ''}
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
                <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
            )}

            {/* Player info - responsive layout */}
            <div className="flex items-center gap-2 sm:gap-0">
                {/* Rank */}
                <div className={`w-8 sm:w-16 text-center font-bold text-xs sm:text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                    {index}
                </div>

                {/* Photo */}
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
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

                {/* Player name and team - mobile optimized */}
                <div className="flex-1 min-w-0 px-2 sm:px-12">
                    <div className={`font-semibold text-sm ${player.drafted ? 'line-through' : ''} ${darkMode ? 'text-gray-200' : 'text-gray-900'
                        }`}>
                        {player.name}
                    </div>
                    {/* Show team on mobile */}
                    <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} sm:hidden`}>
                        {player.team}
                    </div>
                </div>

                {/* Team logo - hidden on mobile, shown on desktop */}
                <div className="hidden sm:block w-12 h-12 flex-shrink-0">
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
                <div className="w-16 sm:w-24 text-center mx-2 sm:mx-4">
                    <span className={`text-xs font-bold px-1 sm:px-2 py-1 rounded ${player.drafted
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

                {/* Bye week - hidden on mobile */}
                <div className="hidden sm:block w-24 text-center">
                    <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                        BYE {player.byeWeek}
                    </span>
                </div>

                {/* Drag handle - larger on mobile for better touch */}
                <div className={`w-8 sm:w-12 transition-colors flex-shrink-0 ml-1 sm:ml-2 ${darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
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